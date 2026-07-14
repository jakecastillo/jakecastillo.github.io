"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";
import { useTiltStore } from "@/hooks/useTiltStore";
import { getBeamAnchorFrame } from "@/hooks/useBeamAnchors";
import { damp } from "./anim";

// "System Online" — a slowly rotating low-poly icosahedron rendered as a glowing
// violet Fresnel rim + violet wireframe with hologram scanlines and a slow sweep;
// cyan is reserved for the boot scan line only (the two-color discipline).
// The camera-facing center stays dark so hero text over it remains legible; only
// the grazing-angle silhouette + edges glow (the dark-mode Fresnel trick).

const VIOLET = new THREE.Color("#8b5cf6");
// The ONE sanctioned cyan — matches the --accent design token (globals.css).
// The whole site draws cyan from this single value; no second cyan exists.
const CYAN = new THREE.Color("#2dd4bf");
// Single source for the icosahedron radius: used by BOTH the geometry and the
// uRadius uniform so the world-Y scanline wipe maps correctly (spec §2.2).
const GEO_RADIUS = 1.3;

const vertexShader = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying float vWorldY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewV = normalize(-mv.xyz);
    vWorldY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uReveal;   // 0..1 boot progress (master clock)
  uniform float uPulse;    // one-shot lock-pulse brightness
  uniform float uRadius;   // geometry radius, for world-Y normalization
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying float vWorldY;

  // 4x4 Bayer ordered dither — copied VERBATIM from BeamRibbon so the two
  // shaders share ONE grain language. Breaks smooth low-frequency gradients
  // into a sub-8-bit-step stipple; see the dither line in main() for why.
  float bayer(vec2 p) {
    vec2 q = floor(mod(p, 4.0));
    float i = q.x + q.y * 4.0;
    // 4x4 Bayer matrix values /16, expressed procedurally-free as a lookup chain
    float m = 0.0;
    if (i < 1.0) m = 0.0;       else if (i < 2.0) m = 8.0;
    else if (i < 3.0) m = 2.0;  else if (i < 4.0) m = 10.0;
    else if (i < 5.0) m = 12.0; else if (i < 6.0) m = 4.0;
    else if (i < 7.0) m = 14.0; else if (i < 8.0) m = 6.0;
    else if (i < 9.0) m = 3.0;  else if (i < 10.0) m = 11.0;
    else if (i < 11.0) m = 1.0; else if (i < 12.0) m = 9.0;
    else if (i < 13.0) m = 15.0;else if (i < 14.0) m = 7.0;
    else if (i < 15.0) m = 13.0;else m = 5.0;
    return m / 16.0;
  }

  void main() {
    // Fresnel: bright at grazing angles (silhouette), dark facing the camera.
    float fres = pow(1.0 - clamp(dot(vNormalV, vViewV), 0.0, 1.0), uPower);
    // Hologram horizontal scanlines drifting upward.
    float scan = 0.82 + 0.18 * sin(vWorldY * 42.0 - uTime * 3.0);
    // Slow bright sweep band travelling up the form ("system online").
    float band = smoothstep(0.10, 0.0, abs(fract(vWorldY * 0.20 - uTime * 0.05) - 0.5));

    // --- Boot-up scanline reveal (smoothstep on ALPHA, never discard) ---
    // Normalize world-Y to 0..1 (bottom..top). Overshoot the threshold to 1.12
    // so at uReveal=1 every fragment (incl. the very top) is fully lit.
    float yN = clamp(vWorldY / uRadius * 0.5 + 0.5, 0.0, 1.0);
    float r = uReveal * 1.12;
    float wipe = smoothstep(yN - 0.05, yN + 0.05, r);     // form fills bottom->top
    float edge = smoothstep(0.06, 0.0, abs(r - yN));      // hot cyan scan bar at the line

    // Violet-bodied orb: the cyan mix is capped so the body reads violet even at
    // the grazing rim + sweep band. Cyan is reserved for the scan line / hot head.
    vec3 col = mix(uViolet, uCyan, clamp(fres * 0.5 + band * 0.6, 0.0, 0.35));
    col = mix(col, uCyan, edge);                          // tint the scan line cyan
    float glow = uIntensity * (scan + band * 0.7) + uPulse * 1.5;
    vec3 outCol = col * glow * wipe + uCyan * edge * 1.6; // edge blooms even before fill
    float a = (fres * scan + band * 0.12) * wipe + edge * 0.6;
    // --- Screen-space ordered dither: kill the facet/rim banding (jc-881) ---
    // The Fresnel + scanline + sweep terms make a smooth low-frequency gradient
    // across every large dark face; the half-float scene survives clean, but the
    // final 8-bit encode (amplified by Bloom's mip blur) quantizes it into hard
    // horizontal stripe bands — a venetian-blind moire, worst where the crystal
    // fills the viewport. A 4x4 Bayer stipple, injected BEFORE the framebuffer
    // write (thus before Bloom reads it), scatters the rounding across the tile so
    // the gradient crosses each step as noise, not a contour line.
    //
    // It rides the ALPHA, not the color. Under AdditiveBlending (SRC_ALPHA, ONE)
    // the buffer contribution is outCol*a, so an alpha dither da perturbs the
    // buffer by outCol*da — automatically SCALED BY LOCAL VALUE (the fragment's
    // own radiance: strong on the bright violet body, vanishing in the true-dark
    // core) yet hue-locked, because every channel is scaled by the identical da/a
    // ratio. A coverage dither can never shift chroma or desaturate, so the
    // violet/cyan two-color palette is left exactly intact — no wash. Amplitude
    // 0.006 puts ~1.5 LSB of grain into linear scene space; the later sRGB encode
    // steepens that to ~2.5-4 output LSB right where the dark-face bands live and
    // flattens it toward the bright rim — the correct perceptual weighting, always
    // enough to clear one step, never enough to read as noise. Gated by wipe so
    // the boot reveal front stays clean; time-independent, so reduced motion bakes
    // the identical static grain with zero travel.
    a += (bayer(gl_FragCoord.xy) - 0.5) * 0.006 * wipe;
    gl_FragColor = vec4(outCol, a);
  }
`;

export default function HoloLattice({
  lowPower = false,
  reducedMotion = false,
}: {
  lowPower?: boolean;
  reducedMotion?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const wireMatRef = useRef<THREE.MeshBasicMaterial>(null);
  // Act-aware duck: 1 = full presence, dips while the prism act holds the
  // stage (scroll window published by useBeamAnchors — module read inside
  // useFrame, never a subscription; React 19 Canvas constraint).
  const duck = useRef(1);
  const scrollOffset = useScrollStore((s) => s.offset);
  const tiltEnabled = useTiltStore((s) => s.enabled);

  // reducedMotion is now passed from BackgroundScene (single source of truth).
  const reduced = reducedMotion;

  // Lock-pulse latch (one-shot when uReveal crosses ~0.9).
  const locked = useRef(false);
  const lockStart = useRef(0);

  // Subtle cursor parallax: the lattice leans toward the pointer, making it feel
  // alive/responsive rather than a static centered object. The canvas is
  // pointer-events-none, so we listen at the window level and lerp toward target.
  const pointer = useRef({ x: 0, y: 0 });
  const lerped = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      // Normalize against the layout viewport (documentElement.client*), the
      // same box the fixed <Canvas> is sized to — NOT window.inner*, which
      // includes the classic scrollbar and would skew the lean off-center on
      // scrollbar-visible platforms (same root cause as the beam-anchor miss).
      const el = document.documentElement;
      pointer.current.x = (e.clientX / el.clientWidth) * 2 - 1;
      pointer.current.y = (e.clientY / el.clientHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  // Device-tilt parallax (touch only, opt-in): once the user enables it via the
  // hero affordance, feed gyro into the SAME pointer.current target the cursor
  // uses, so the existing useFrame lerp smooths it identically. The listener
  // attaches only when enabled — no always-on motion listener before opt-in.
  useEffect(() => {
    if (reduced || !tiltEnabled) return;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onTilt = (e: DeviceOrientationEvent) => {
      // gamma: left/right [-90,90]; beta: front/back [-180,180].
      // Small damped amplitude so the holo leans, not lurches.
      if (e.gamma != null) pointer.current.x = clamp(e.gamma / 35);
      if (e.beta != null) pointer.current.y = clamp((e.beta - 45) / 35);
    };
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, [reduced, tiltEnabled]);

  // detail 1 = 80 faces — a clean geodesic lattice; coarser on low-power.
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(GEO_RADIUS, lowPower ? 0 : 1),
    [lowPower],
  );

  // Low-power devices run a cheaper, lower-res bloom (see Scene.tsx), so the holo
  // gets less of the post-pass glow that normally makes the thin Fresnel rim read
  // on a phone. Compensate in-shader: a lower Fresnel power widens the bright rim
  // (so it's no longer ~1px) and a higher intensity makes it pop — so the holo is
  // clearly visible even where the bloom is faint or fails to create. Full-power
  // keeps the original, bloom-tuned values exactly.
  // Resting (post-boot) rim intensity — the value uIntensity ramps UP to.
  const restingIntensity = lowPower ? 2.3 : 1.75;
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uViolet: { value: VIOLET },
      uCyan: { value: CYAN },
      uPower: { value: lowPower ? 2.0 : 2.7 },
      // reduced-motion: seed the LIT end-state (no boot). Otherwise start dark.
      uIntensity: { value: reducedMotion ? restingIntensity : 0 },
      uReveal: { value: reducedMotion ? 1 : 0 },
      uPulse: { value: 0 },
      uRadius: { value: GEO_RADIUS },
    }),
    [lowPower, reducedMotion, restingIntensity],
  );

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    const m = matRef.current;
    // Reduced motion renders whenever the scroll-pinned beam needs a frame
    // (see LoopDriver) — freeze uTime there so the lattice stays a truly
    // static lit frame instead of shimmering on scroll.
    if (m && !reduced) m.uniforms.uTime.value = t;

    if (reduced) {
      // Static LIT frame (rendered on demand only for this path).
      g.rotation.set(0.5, 0.6, 0);
      g.scale.setScalar(1);
      return;
    }

    // --- Act IV duck: dim/park the lattice while the prism holds the stage ---
    // Ramps down as the skills act enters (one viewport of approach), holds
    // dim through the fan's park window, restores after the fan completes —
    // the climax gets a dark stage instead of competing with the full bloom.
    const bf = getBeamAnchorFrame();
    let duckTarget = 1;
    if (bf.prismArriveScroll > 0 && bf.viewportH > 0) {
      const y = window.scrollY;
      const vh = bf.viewportH;
      const enter = Math.min(
        Math.max((y - (bf.prismArriveScroll - vh)) / (vh * 0.6), 0),
        1,
      );
      const exit = Math.min(
        Math.max((y - bf.prismHoldScroll) / (vh * 0.7), 0),
        1,
      );
      // One FURTHER step while the head is actually WELDED to the vertex
      // (prismArriveScroll..prismHoldScroll): the split spectrum should own the
      // stage, so the lattice drops from ~0.32 to ~0.14 presence across the
      // park, then eases back with (1 - exit) after the hold. `park` ramps in
      // over a short 0.2vh once the head lands — distinct from the full-viewport
      // approach `enter` — so the extra dip is confined to the hold itself.
      const park = Math.min(
        Math.max((y - bf.prismArriveScroll) / (vh * 0.2), 0),
        1,
      );
      duckTarget = 1 - (0.68 * enter + 0.18 * park) * (1 - exit);
    }
    duck.current = damp(duck.current, duckTarget, 3, delta);
    if (wireMatRef.current) {
      wireMatRef.current.opacity = (lowPower ? 0.3 : 0.16) * duck.current;
    }

    // --- Boot envelope (uniforms only; frame-rate independent via damp) ---
    if (m) {
      const rev = m.uniforms.uReveal;
      if (rev.value < 1) rev.value = Math.min(1, damp(rev.value, 1, 3, delta));
      m.uniforms.uIntensity.value = damp(
        m.uniforms.uIntensity.value,
        restingIntensity * duck.current,
        3.2,
        delta,
      );
      // One-shot lock-pulse latched just after the form fully assembles (~0.95),
      // so "system online" lands as the last hero item (terminal) settles ~1.0s.
      if (!locked.current && rev.value > 0.95) {
        locked.current = true;
        lockStart.current = t;
      }
      if (locked.current) {
        const dt = t - lockStart.current;
        const pulse = Math.exp(-dt * 6) * Math.sin(dt * 30);
        m.uniforms.uPulse.value = Math.max(0, pulse) * 0.6;
      }
    }
    const pulseScale = 1 + (m ? m.uniforms.uPulse.value : 0) * 0.05;

    // Ease the parallax toward the cursor target.
    lerped.current.x += (pointer.current.x - lerped.current.x) * 0.045;
    lerped.current.y += (pointer.current.y - lerped.current.y) * 0.045;

    const s = scrollOffset * 0.0006;
    g.rotation.y = t * 0.07 + s + lerped.current.x * 0.28;
    g.rotation.x = Math.sin(t * 0.14) * 0.18 + s * 0.4 + lerped.current.y * 0.22;
    g.position.x = lerped.current.x * 0.18;
    g.position.y = Math.sin(t * 0.4) * 0.08 - lerped.current.y * 0.14;
    g.scale.setScalar(pulseScale);
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0, -1]}
      rotation={reducedMotion ? [0.5, 0.6, 0] : [0, 0, 0]}
    >
      {/* Fresnel-rim hologram body */}
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Violet wireframe lattice — the orb body stays violet-dominant; cyan is
          held back for the scan line only. A touch brighter on low-power, where the
          lighter bloom would otherwise leave the thin edges nearly invisible. */}
      <mesh geometry={geometry} scale={1.004}>
        <meshBasicMaterial
          ref={wireMatRef}
          color={VIOLET}
          wireframe
          transparent
          opacity={lowPower ? 0.3 : 0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Faint inner violet core for depth */}
      <mesh geometry={geometry} scale={0.5}>
        <meshBasicMaterial
          color={VIOLET}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
