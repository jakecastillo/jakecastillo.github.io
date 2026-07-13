"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";
import { useBeamStore } from "@/hooks/useBeamStore";
import { damp } from "./anim";

// Relay hold: the ribbon is the LAST leg of the boot relay (spark → line →
// underline → ribbon). It stays dark until the boot-line→underline crossfade
// has landed (bootDone + crossfade tail), then flares in from the head.
// Read via getState() inside useFrame — never a hook subscription — so the
// Canvas subtree never re-renders (React 19 constraint, see Scene.tsx).
const REVEAL_HOLD_MS = 700;

// The Beam — a scroll-drawn ribbon of light threading the 3D world. Its drawn
// length IS document scroll progress; a hot cyan-white head leads the draw.
// Additive + toneMapped:false clears the Bloom 0.1 luminance threshold, so the
// ribbon reads as illumination in the void rather than a solid rope.

const VIOLET = new THREE.Color("#8b5cf6");
// The ONE sanctioned cyan — matches the --accent design token (globals.css).
const CYAN = new THREE.Color("#2dd4bf");

// The beam's path through the world: enters top (hero handoff), weaves around
// the lattice, exits bottom-center (contact beacon). View-space units at the
// z-planes given; tuned for fov 45 @ camera z 5.
const CONTROL_POINTS: [number, number, number][] = [
    [0.5, 2.15, -0.6],
    [1.6, 1.4, -1.2],
    [0.6, -0.2, -2.6],
    [-1.8, 0.6, -1.8],
    [-1.2, -1.6, -0.8],
    [0.8, -2.2, -1.6],
    [0.0, -3.4, -1.0],
];

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uHead;      // 0..1 drawn progress (== document scroll)
  uniform float uReveal;    // 0..1 boot-relay gate: dark until the underline handoff
  uniform float uTime;
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
    // Drawn body with a soft tail behind the head.
    float drawn = smoothstep(uHead, uHead - 0.015, along);
    // Hot head: a tight cyan-white node exactly at the draw front.
    float head = smoothstep(0.02, 0.0, abs(along - uHead));
    // Energy flicker travelling along the drawn body.
    float flow = 0.75 + 0.25 * sin(along * 42.0 - uTime * 2.4);
    // Cyan warm-up trailing the head, so the draw front reads as heat.
    float nearHead = smoothstep(0.12, 0.0, uHead - along) * drawn;
    vec3 col = mix(uViolet, uCyan, clamp(head * 0.85 + nearHead * 0.35, 0.0, 1.0));
    float a = drawn * 0.42 * flow + head * 0.9;
    // Ordered dither grain on the glow falloff — gated by the drawn mask so
    // the undrawn tube stays truly invisible (no ghost path at page top).
    a += (bayer(gl_FragCoord.xy) - 0.5) * 0.06 * clamp(drawn + head, 0.0, 1.0);
    // Boot-relay flare-in: alpha gated by uReveal; while revealing, the head
    // runs extra hot (the flare) and settles as uReveal reaches 1.
    float flare = 1.0 + (1.0 - uReveal) * head * 2.0;
    gl_FragColor = vec4(col * uIntensity * (1.0 + head * 2.5) * flare, clamp(a * uReveal, 0.0, 1.0));
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

    const geometry = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3(
            CONTROL_POINTS.map((p) => new THREE.Vector3(...p)),
        );
        // tubularSegments, radius, radialSegments — halved on low power.
        return new THREE.TubeGeometry(
            curve,
            lowPower ? 140 : 300,
            0.012,
            lowPower ? 4 : 8,
            false,
        );
    }, [lowPower]);

    const uniforms = useMemo(
        () => ({
            uHead: { value: reducedMotion ? 1 : 0 },
            uReveal: { value: reducedMotion ? 1 : 0 },
            uTime: { value: 0 },
            uViolet: { value: VIOLET },
            uCyan: { value: CYAN },
            uIntensity: { value: lowPower ? 2.4 : 2.1 },
        }),
        [lowPower, reducedMotion],
    );

    useFrame((state, delta) => {
        const m = matRef.current;
        if (!m) return;
        m.uniforms.uTime.value = state.clock.getElapsedTime();
        if (reducedMotion) return; // static fully-drawn frame
        // Boot-relay gate: hold the ribbon dark until the underline crossfade
        // has landed (bootDone + hold), then damp uReveal up — the flare-in.
        const { bootDone, bootDoneAt } = useBeamStore.getState();
        const held =
            !bootDone || performance.now() - bootDoneAt < REVEAL_HOLD_MS;
        m.uniforms.uReveal.value = held
            ? 0
            : damp(m.uniforms.uReveal.value, 1, 3.5, delta);
        // Chase document scroll progress with a light damp so the head glides.
        const target = useScrollStore.getState().progress;
        m.uniforms.uHead.value = damp(
            m.uniforms.uHead.value,
            target,
            6,
            delta,
        );
    });

    return (
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
    );
}
