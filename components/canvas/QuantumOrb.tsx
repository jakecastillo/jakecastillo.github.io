"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

export default function QuantumOrb() {
    const orbRef = useRef<THREE.Mesh>(null);
    const outerRingRef = useRef<THREE.Mesh>(null);

    // Stable phase offset to keep motion organic without impure render-time randomness
    const phaseOffset = Math.PI * 0.61803398875;

    useFrame((state) => {
        if (!orbRef.current || !outerRingRef.current) return;

        const time = state.clock.getElapsedTime();

        // Very subtle base rotation
        const baseRotX = time * 0.05 + phaseOffset;
        const baseRotY = time * 0.08 + phaseOffset;

        orbRef.current.rotation.x = baseRotX;
        orbRef.current.rotation.y = baseRotY;

        // OUTER RING ROTATION
        outerRingRef.current.rotation.x = -baseRotX * 1.5;
        outerRingRef.current.rotation.z = baseRotY * 1.2;

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
            <Sphere ref={orbRef} args={[1.0, 32, 32]}>  {/* Reduced segments from 64 to 32 for performance */}
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
            <Sphere ref={outerRingRef} args={[2.2, 16, 16]}> {/* Reduced segments from 32 to 16 for performance */}
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
