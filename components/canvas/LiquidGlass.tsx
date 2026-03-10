"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";

export default function LiquidGlass() {
    const meshRef = useRef<THREE.Mesh>(null);
    const scrollOffset = useScrollStore((state) => state.offset);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();

        // Very slow, subtle organic movement independent of scroll
        const slowWarp = Math.sin(time * 0.2) * 0.05;

        // Scroll influence: As you scroll, the "lens" shifts slightly up/down, distorting what's behind it.
        // It's meant to feel like moving liquid across the surface.
        const scrollFactor = scrollOffset * 0.001;

        // Apply rotation to bend light passing through differently based on position
        meshRef.current.rotation.x = Math.PI / 16 + slowWarp + scrollFactor * 0.1;
        meshRef.current.rotation.y = -Math.PI / 32 - slowWarp * 1.5;

        // Gentle z movement to slightly change refraction intensity based on scroll
        meshRef.current.position.z = Math.sin(time * 0.4) * 0.1 - scrollFactor * 0.5;

    });

    return (
        // Positioned very close to the camera, filling almost the whole viewport acting as a filter
        <Plane
            ref={meshRef}
            // Use large fixed sizes to cover most viewports to avoid window SSR hydration mismatch
            args={[30, 30, 64, 64]}
            position={[0, 0, 1]} // Pushed slightly further away
        >
            <MeshTransmissionMaterial
                backside={false}
                samples={16}
                resolution={1024}
                transmission={0.9}     // High transparency
                thickness={0.5}
                ior={1.2}
                chromaticAberration={0.04}
                anisotropy={0.1}
                distortion={0.3}
                distortionScale={0.2}
                temporalDistortion={0.1}
                roughness={0.05}
                color="#ffffff"        // Pure clear glass, previously this was very dark!
            />
        </Plane>
    );
}
