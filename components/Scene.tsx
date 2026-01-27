"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import HeroTerrain from "./canvas/HeroTerrain";

export default function Scene() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 1.5]}    // Optimization for high-DPI screens
                camera={{ position: [0, 2, 5], fov: 50 }} // Adjusted camera for better view of terrain
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.2} />
                    <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
                    <pointLight position={[-10, 5, -10]} intensity={0.5} color="#22d3ee" />

                    {/* Background Color match */}
                    {/* <color attach="background" args={["#050505"]} />  Removed to handle transparent overlays better if needed, but safe to keep for consistency */}

                    <HeroTerrain />

                    <fog attach="fog" args={["#050505", 2, 12]} />
                </Suspense>
            </Canvas>
        </div>
    );
}
