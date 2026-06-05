"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";

// Brand palette: violet is the dominant accent, cyan is a rare secondary tint.
const BRAND_VIOLET = "#8b5cf6";
const BRAND_CYAN = "#22d3ee";

export default function QuantumOrb() {
    const orbRef = useRef<THREE.Mesh>(null);
    const outerRingRef = useRef<THREE.Mesh>(null);
    // Soft atmospheric glow shell — a backside, additive halo that fakes a gentle
    // bloom around the core without any post-processing pass. It breathes very
    // slightly with the pulse so the orb feels lit from within, never bright.
    const glowRef = useRef<THREE.Mesh>(null);
    const scrollOffset = useScrollStore((state) => state.offset);

    // Read the reduced-motion preference exactly once. BackgroundScene already
    // skips mounting this for reduced-motion users, but we stay defensive so the
    // orb settles into a calm static pose if it ever renders in that mode.
    const reducedMotionRef = useRef(
        typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    // Coarse-pointer (touch) devices that still reach this component get a
    // lower-poly sphere to shave vertex work. Computed once via lazy state init
    // so the value is read outside render and never changes for this instance.
    const [coarsePointer] = useState(
        () =>
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(pointer: coarse)").matches
    );

    // Inner-core tessellation: drop from 32 to 16 segments on coarse pointers.
    const coreSegments = coarsePointer ? 16 : 32;
    // Outer wireframe is already low-poly; trim it a touch further on touch.
    const ringSegments = coarsePointer ? 8 : 12;
    // Glow shell can be coarse — it's a soft blur, detail is invisible. Cheap.
    const glowSegments = coarsePointer ? 16 : 24;

    // Stable phase offset to keep motion organic without impure render-time randomness
    const phaseOffset = Math.PI * 0.61803398875;

    useFrame((state) => {
        if (!orbRef.current || !outerRingRef.current) return;

        // Reduced motion: freeze to a static, level pose — no rotation, hover, or pulse.
        if (reducedMotionRef.current) {
            orbRef.current.rotation.set(phaseOffset, phaseOffset, 0);
            outerRingRef.current.rotation.set(-phaseOffset * 1.5, 0, phaseOffset * 1.2);
            orbRef.current.position.y = 0;
            outerRingRef.current.position.y = 0;
            orbRef.current.scale.setScalar(1);
            outerRingRef.current.scale.setScalar(1);
            if (glowRef.current) {
                glowRef.current.position.y = 0;
                glowRef.current.scale.setScalar(1);
            }
            return;
        }

        const time = state.clock.getElapsedTime();

        // Very subtle base rotation
        const baseRotX = time * 0.05 + phaseOffset;
        const baseRotY = time * 0.08 + phaseOffset;

        // Scroll influence
        const scrollFactor = scrollOffset * 0.001;

        orbRef.current.rotation.x = baseRotX + scrollFactor * 2;
        orbRef.current.rotation.y = baseRotY + scrollFactor * 3;

        // OUTER RING ROTATION
        // Keep the scroll rotation subtle to prevent the wireframe from
        // clipping through the distorted inner core at extreme scroll depths
        outerRingRef.current.rotation.x = -baseRotX * 1.5 - scrollFactor * 0.5;
        outerRingRef.current.rotation.z = baseRotY * 1.2 + scrollFactor * 0.5;

        // Gentle hovering effect
        const hoverY = Math.sin(time * 0.5) * 0.2;
        orbRef.current.position.y = hoverY;
        outerRingRef.current.position.y = hoverY;

        // Pulsing scale effect ONLY
        const pulse = 1 + Math.sin(time * 1.2) * 0.02;

        orbRef.current.scale.setScalar(pulse);
        outerRingRef.current.scale.setScalar(pulse);

        // Glow shell follows the hover and breathes on an offset phase so the
        // halo gently expands and contracts a hair out of sync with the core,
        // reading as soft ambient light rather than a rigid outline.
        if (glowRef.current) {
            glowRef.current.position.y = hoverY;
            glowRef.current.scale.setScalar(1 + Math.sin(time * 0.9 + phaseOffset) * 0.035);
        }
    });

    return (
        <group position={[0, 0, -2]}>
            {/* Inner Core — deep violet-tinted slate. Emissive kept extremely low
                so the brightest lit pixel stays under ~#2a2550, letting muted text
                overlapping the orb hold >=4.5:1 contrast. Never competes with copy.
                Polished metalness + lower roughness deepen the specular gradient so
                the lit side rolls richly into shadow — cinematic depth, not glare. */}
            <Sphere ref={orbRef} args={[1.0, coreSegments, coreSegments]}>
                <MeshDistortMaterial
                    color="#16122b"
                    emissive={BRAND_VIOLET}
                    emissiveIntensity={0.05}
                    roughness={0.28}
                    metalness={0.82}
                    distort={0.3}
                    speed={2}
                />
            </Sphere>

            {/* Atmospheric glow shell — a backside, additively-blended halo that
                fakes a faint bloom around the core. depthWrite is off and opacity
                is tiny so it reads as ambient violet light bleeding into the void,
                never as a solid edge. Its dimness keeps text contrast intact. */}
            <Sphere ref={glowRef} args={[1.55, glowSegments, glowSegments]}>
                <meshBasicMaterial
                    color={BRAND_VIOLET}
                    transparent
                    opacity={0.05}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </Sphere>

            {/* Outer Wireframe / Energy containment field — brand violet, dialed
                down to a faint premium halo behind text. Fewer segments for perf. */}
            <Sphere ref={outerRingRef} args={[2.2, ringSegments, ringSegments]}>
                <meshStandardMaterial
                    color={BRAND_VIOLET}
                    emissive={BRAND_CYAN}
                    emissiveIntensity={0.15}
                    wireframe
                    transparent
                    opacity={0.045}
                    side={THREE.DoubleSide}
                />
            </Sphere>
        </group>
    );
}
