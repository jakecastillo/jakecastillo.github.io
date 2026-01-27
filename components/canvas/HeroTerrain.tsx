"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/hooks/useScrollStore";

export default function HeroTerrain() {
    const meshRef = useRef<THREE.Mesh>(null);
    const scrollOffset = useScrollStore((state) => state.offset);

    // Animate the terrain
    useFrame((state) => {
        if (!meshRef.current) return;
        const { clock } = state;
        const t = clock.getElapsedTime();

        // Base animation
        const baseRotationX = -Math.PI / 2 + Math.sin(t * 0.1) * 0.05;

        // Scroll influence: As user scrolls, terrain tilts up and flattens out
        // Max scroll ~1000px implies approx 1 radian change if sensitive
        const scrollFactor = scrollOffset * 0.001;

        meshRef.current.rotation.x = baseRotationX + scrollFactor * 0.5;
        meshRef.current.rotation.z = t * 0.05 + scrollFactor * 0.2;
        meshRef.current.position.y = -1.5 + Math.sin(t * 0.2) * 0.1 - scrollFactor * 2; // Moves down as you scroll
        meshRef.current.position.z = -scrollFactor * 5; // Moves away
    });

    return (
        <group>
            <Plane
                ref={meshRef}
                args={[20, 20, 50, 50]} // Increased segments for wireframe density
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -2, 0]}
            >
                <meshStandardMaterial
                    color="#8b5cf6"
                    wireframe
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                />
            </Plane>
            {/* Add a secondary offset plane for visual complexity (Shift effect) */}
            <Plane
                args={[20, 20, 30, 30]}
                rotation={[-Math.PI / 2, 0, 0.5]}
                position={[0, -2.5, 0]}
            >
                <meshBasicMaterial
                    color="#22d3ee"
                    wireframe
                    transparent
                    opacity={0.1}
                />
            </Plane>
        </group>
    );
}
