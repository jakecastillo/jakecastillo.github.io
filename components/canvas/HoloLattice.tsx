"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";
import { useTiltStore } from "@/hooks/useTiltStore";

// "System Online" — a slowly rotating low-poly icosahedron rendered as a glowing
// violet Fresnel rim + cyan wireframe with hologram scanlines and a slow sweep.
// The camera-facing center stays dark so hero text over it remains legible; only
// the grazing-angle silhouette + edges glow (the dark-mode Fresnel trick).

const VIOLET = new THREE.Color("#8b5cf6");
const CYAN = new THREE.Color("#22d3ee");

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
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying float vWorldY;
  void main() {
    // Fresnel: bright at grazing angles (silhouette), dark facing the camera.
    float fres = pow(1.0 - clamp(dot(vNormalV, vViewV), 0.0, 1.0), uPower);
    // Hologram horizontal scanlines drifting upward.
    float scan = 0.82 + 0.18 * sin(vWorldY * 42.0 - uTime * 3.0);
    // Slow bright sweep band travelling up the form ("system online").
    float band = smoothstep(0.10, 0.0, abs(fract(vWorldY * 0.20 - uTime * 0.05) - 0.5));
    // Violet rim, cyan biased toward the sweep + brightest edges.
    vec3 col = mix(uViolet, uCyan, clamp(fres * 0.5 + band * 0.6, 0.0, 1.0));
    float a = fres * scan + band * 0.12;
    gl_FragColor = vec4(col * uIntensity * (scan + band * 0.7), a);
  }
`;

export default function HoloLattice({ lowPower = false }: { lowPower?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const scrollOffset = useScrollStore((s) => s.offset);
  const tiltEnabled = useTiltStore((s) => s.enabled);

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Subtle cursor parallax: the lattice leans toward the pointer, making it feel
  // alive/responsive rather than a static centered object. The canvas is
  // pointer-events-none, so we listen at the window level and lerp toward target.
  const pointer = useRef({ x: 0, y: 0 });
  const lerped = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
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
    () => new THREE.IcosahedronGeometry(1.3, lowPower ? 0 : 1),
    [lowPower],
  );

  // Low-power devices run a cheaper, lower-res bloom (see Scene.tsx), so the holo
  // gets less of the post-pass glow that normally makes the thin Fresnel rim read
  // on a phone. Compensate in-shader: a lower Fresnel power widens the bright rim
  // (so it's no longer ~1px) and a higher intensity makes it pop — so the holo is
  // clearly visible even where the bloom is faint or fails to create. Full-power
  // keeps the original, bloom-tuned values exactly.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uViolet: { value: VIOLET },
      uCyan: { value: CYAN },
      uPower: { value: lowPower ? 2.0 : 2.7 },
      uIntensity: { value: lowPower ? 2.3 : 1.75 },
    }),
    [lowPower],
  );

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    if (matRef.current) matRef.current.uniforms.uTime.value = t;

    if (reduced) {
      g.rotation.set(0.5, 0.6, 0);
      g.position.y = 0;
      return;
    }
    // Ease the parallax toward the cursor target.
    lerped.current.x += (pointer.current.x - lerped.current.x) * 0.045;
    lerped.current.y += (pointer.current.y - lerped.current.y) * 0.045;

    const s = scrollOffset * 0.0006;
    g.rotation.y = t * 0.07 + s + lerped.current.x * 0.28;
    g.rotation.x = Math.sin(t * 0.14) * 0.18 + s * 0.4 + lerped.current.y * 0.22;
    g.position.x = lerped.current.x * 0.18;
    g.position.y = Math.sin(t * 0.4) * 0.08 - lerped.current.y * 0.14;
  });

  return (
    <group ref={groupRef} position={[0, 0, -1]}>
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

      {/* Cyan wireframe lattice. A touch brighter on low-power, where the lighter
          bloom would otherwise leave the thin edges nearly invisible on a phone. */}
      <mesh geometry={geometry} scale={1.004}>
        <meshBasicMaterial
          color={CYAN}
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
