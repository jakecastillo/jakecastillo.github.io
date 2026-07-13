"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBeamStore } from "@/hooks/useBeamStore";
import { getBeamAnchorFrame } from "@/hooks/useBeamAnchors";
import { damp } from "./anim";

// Relay hold: the ribbon is the LAST leg of the boot relay (spark → line →
// underline → ribbon). It stays dark until the boot-line→underline crossfade
// has landed (bootDone + crossfade tail), then flares in from the head.
// Read via getState() inside useFrame — never a hook subscription — so the
// Canvas subtree never re-renders (React 19 constraint, see Scene.tsx).
const REVEAL_HOLD_MS = 700;

// The Beam — a scroll-drawn ribbon of light THREADING THE CONTENT. Its curve
// is built through the acts' real DOM anchors (hero underline end → philosophy
// spine top → prism vertex → beacon center), measured document-side by
// useBeamAnchors and published as plain data. The whole mesh translates with
// scroll (pinned to the content), and the hot head's arc position is keyed so
// it ARRIVES at each anchor exactly as its act enters the reading zone.
// Additive + toneMapped:false clears the Bloom 0.1 luminance threshold, so the
// ribbon reads as illumination in the void rather than a solid rope.

const VIOLET = new THREE.Color("#8b5cf6");
// The ONE sanctioned cyan — matches the --accent design token (globals.css).
const CYAN = new THREE.Color("#2dd4bf");

// Ribbon thickness in CSS px at the anchor plane (converted to world units at
// geometry-rebuild time so it stays constant across viewport sizes).
const RADIUS_PX = 2.4;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uHead;      // 0..1 live drawn progress (arc fraction)
  uniform float uBurn;      // max uHead ever reached — the beam's memory
  uniform float uReveal;    // 0..1 boot-relay gate: dark until the underline handoff
  uniform float uTime;
  uniform float uViewH;     // framebuffer height (px) for the viewport-edge fade
  uniform float uEdge;      // fade band height (px) at top/bottom viewport edges
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform float uIntensity;
  varying vec2 vUv;

  // 4x4 Bayer ordered dither — grain on the glow falloff ("human-made" texture).
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
    float along = vUv.x;
    // Live drawn body with a soft tail behind the head.
    float drawn = smoothstep(uHead, uHead - 0.015, along);
    // Memory: everything the head has EVER passed. Where the head retreated
    // (scroll-back), the travelled path keeps a faint ember — the story
    // doesn't un-happen.
    float burned = smoothstep(uBurn, uBurn - 0.015, along);
    float ember = clamp(burned - drawn, 0.0, 1.0) * 0.15;
    // Hot head: a tight cyan-white node exactly at the draw front.
    float head = smoothstep(0.02, 0.0, abs(along - uHead));
    // Energy flicker travelling along the live body (embers stay calm).
    float flow = 0.75 + 0.25 * sin(along * 42.0 - uTime * 2.4);
    // Cyan warm-up trailing the head, so the draw front reads as heat.
    float nearHead = smoothstep(0.12, 0.0, uHead - along) * drawn;
    vec3 col = mix(uViolet, uCyan, clamp(head * 0.85 + nearHead * 0.35, 0.0, 1.0));
    float a = drawn * 0.42 * flow + ember * 0.42 + head * 0.9;
    // Ordered dither grain on the glow falloff — gated by the lit mask so
    // the undrawn tube stays truly invisible (no ghost path at page top).
    a += (bayer(gl_FragCoord.xy) - 0.5) * 0.06 * clamp(drawn + ember + head, 0.0, 1.0);
    // Viewport-edge fade: where the ribbon crosses the top/bottom screen
    // edge it dissolves instead of hard-clipping — no mid-air terminations.
    float edgeFade = smoothstep(0.0, uEdge, gl_FragCoord.y)
                   * (1.0 - smoothstep(uViewH - uEdge, uViewH, gl_FragCoord.y));
    // Boot-relay flare-in: alpha gated by uReveal; while revealing, the head
    // runs extra hot (the flare) and settles as uReveal reaches 1.
    float flare = 1.0 + (1.0 - uReveal) * head * 2.0;
    gl_FragColor = vec4(col * uIntensity * (1.0 + head * 2.5) * flare, clamp(a * uReveal * edgeFade, 0.0, 1.0));
  }
`;

export default function BeamRibbon({
    lowPower = false,
    reducedMotion = false,
}: {
    lowPower?: boolean;
    reducedMotion?: boolean;
}) {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    // Rebuild bookkeeping — refs only, mutated inside useFrame (at most once
    // per anchor-frame version, i.e. on resize/layout change, never per frame).
    const builtVersion = useRef(-1);
    const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
    const stopScroll = useRef<number[]>([]);
    const stopFrac = useRef<number[]>([]);
    const unitsPerPx = useRef(0);
    const viewportW = useRef(0);
    const viewportH = useRef(0);
    // Reused scratch — never allocated per frame.
    const headPoint = useRef(new THREE.Vector3());

    // Placeholder geometry until the first anchor measurement lands; the mesh
    // stays invisible until then.
    const initialGeometry = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -1, 0),
        ]);
        return new THREE.TubeGeometry(curve, 2, 0.01, 3, false);
    }, []);

    const uniforms = useMemo(
        () => ({
            uHead: { value: reducedMotion ? 1 : 0 },
            uBurn: { value: reducedMotion ? 1 : 0 },
            uReveal: { value: reducedMotion ? 1 : 0 },
            uTime: { value: 0 },
            uViewH: { value: 1 },
            uEdge: { value: 0 },
            uViolet: { value: VIOLET },
            uCyan: { value: CYAN },
            uIntensity: { value: lowPower ? 2.4 : 2.1 },
        }),
        [lowPower, reducedMotion],
    );

    useFrame((state, delta) => {
        const m = matRef.current;
        const mesh = meshRef.current;
        if (!m || !mesh) return;

        const frame = getBeamAnchorFrame();

        // --- Rebuild (anchor-change only: resize / layout shift, NOT scroll) ---
        if (frame.version !== builtVersion.current && frame.points.length >= 4) {
            builtVersion.current = frame.version;
            unitsPerPx.current = frame.unitsPerPx;
            viewportW.current = frame.viewportW;
            viewportH.current = frame.viewportH;
            const u = frame.unitsPerPx;
            const vw = frame.viewportW;
            const vh = frame.viewportH;
            // Document px → world units at the z=0 plane, for scrollY = 0.
            // Per frame the mesh translates up by scrollY * unitsPerPx, keeping
            // every point glued to its document position.
            const vecs = frame.points.map(
                (p) =>
                    new THREE.Vector3(
                        (p.x - vw / 2) * u,
                        (vh / 2 - p.y) * u,
                        p.z,
                    ),
            );
            const curve = new THREE.CatmullRomCurve3(vecs);
            curveRef.current = curve;
            const old = mesh.geometry;
            mesh.geometry = new THREE.TubeGeometry(
                curve,
                lowPower ? 220 : 480,
                RADIUS_PX * u,
                lowPower ? 4 : 8,
                false,
            );
            old.dispose();
            mesh.visible = true;

            // Arc-length fractions of the anchor control points (TubeGeometry
            // samples arc-uniformly, so vUv.x IS arc fraction). Arrays rebuilt
            // here only — read-only in the per-frame path below.
            const DIV = 512;
            const lengths = curve.getLengths(DIV);
            const total = lengths[DIV];
            const n = frame.points.length;
            const ss: number[] = [];
            const sf: number[] = [];
            for (let i = 0; i < n; i++) {
                const p = frame.points[i];
                if (!p.anchor) continue;
                const t = i / (n - 1);
                ss.push(p.arriveScroll);
                sf.push(lengths[Math.round(t * DIV)] / total);
            }
            // The final anchor is the curve's last point — force exact 1 so
            // the head parks flush on the beacon.
            if (sf.length > 0) sf[sf.length - 1] = 1;
            stopScroll.current = ss;
            stopFrac.current = sf;
        }
        if (!mesh.visible || curveRef.current === null) return;

        // --- Per-frame: uniform writes + one mesh translation. No allocations. ---
        const scrollY = window.scrollY;
        mesh.position.y = scrollY * unitsPerPx.current;

        // Framebuffer height in device px (gl_FragCoord space) for the
        // viewport-edge fade band.
        const bufH = state.gl.domElement.height;
        m.uniforms.uViewH.value = bufH;
        m.uniforms.uEdge.value = bufH * 0.06;

        // Head target: piecewise-linear arc fraction between arrival stops —
        // the head lands on each anchor exactly as its act enters, and holds
        // at the beacon (fraction 1) for any scroll past the last stop.
        const ss = stopScroll.current;
        const sf = stopFrac.current;
        let target = sf[sf.length - 1];
        if (scrollY <= ss[0]) {
            target = sf[0];
        } else {
            for (let i = 1; i < ss.length; i++) {
                if (scrollY < ss[i]) {
                    target =
                        sf[i - 1] +
                        ((sf[i] - sf[i - 1]) * (scrollY - ss[i - 1])) /
                            (ss[i] - ss[i - 1]);
                    break;
                }
            }
        }

        if (reducedMotion) {
            // Static fully-drawn path through the same anchors; frozen time.
            m.uniforms.uHead.value = 1;
            m.uniforms.uBurn.value = 1;
            m.uniforms.uReveal.value = 1;
        } else {
            m.uniforms.uTime.value = state.clock.getElapsedTime();
            // Boot-relay gate: hold the ribbon dark until the underline
            // crossfade has landed (bootDone + hold), then damp uReveal up.
            const { bootDone, bootDoneAt } = useBeamStore.getState();
            const held =
                !bootDone || performance.now() - bootDoneAt < REVEAL_HOLD_MS;
            m.uniforms.uReveal.value = held
                ? 0
                : damp(m.uniforms.uReveal.value, 1, 3.5, delta);
            // Chase the arrival-keyed target with a light damp so the head
            // glides; memory only ever ratchets forward.
            m.uniforms.uHead.value = damp(
                m.uniforms.uHead.value,
                target,
                6,
                delta,
            );
            m.uniforms.uBurn.value = Math.max(
                m.uniforms.uBurn.value,
                m.uniforms.uHead.value,
            );
        }

    });

    return (
        <mesh ref={meshRef} geometry={initialGeometry} visible={false} frustumCulled={false}>
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
    );
}
