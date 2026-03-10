"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";

export default function QuantumOrb() {
    const orbRef = useRef<THREE.Mesh>(null);
    const outerRingRef = useRef<THREE.Mesh>(null);
    const scrollOffset = useScrollStore((state) => state.offset);

    // Initial random values for subtle organic movement independent of time
    const randomOffset = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame((state) => {
        if (!orbRef.current || !outerRingRef.current) return;

        const time = state.clock.getElapsedTime();

        // Very subtle base rotation
        const baseRotX = time * 0.05 + randomOffset;
        const baseRotY = time * 0.08 + randomOffset;

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
    });

    return (
        <group position={[0, 0, -2]}>
            {/* Inner Core */}
            <Sphere ref={orbRef} args={[1.0, 64, 64]}>  {/* Drastically reduced size to prevent clipping */}
                <MeshDistortMaterial
                    color="#0f172a"
                    emissive="#1e293b"
                    emissiveIntensity={0.2}
                    roughness={0.2}
                    metalness={0.8}
                    distort={0.3}
                    speed={2}
                />
            </Sphere>

            {/* Outer Wireframe / Energy containment field */}
            <Sphere ref={outerRingRef} args={[2.2, 32, 32]}> {/* Increased size to provide massive clearance */}
                <meshStandardMaterial
                    color="#38bdf8"
                    wireframe
                    transparent
                    opacity={0.08}
                    side={THREE.DoubleSide}
                />
            </Sphere>
        </group>
    );
}
