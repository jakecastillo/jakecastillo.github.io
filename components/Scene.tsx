"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment } from "@react-three/drei";
import QuantumOrb from "./canvas/QuantumOrb";
import LiquidGlass from "./canvas/LiquidGlass";

export default function Scene() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 1.5]}
                camera={{ position: [0, 0, 5], fov: 45 }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={["#020617"]} /> {/* Deepest slate dark mode background */}
                    <ambientLight intensity={0.4} /> {/* Slightly brighter ambient light so the sphere is visible */}
                    <pointLight position={[5, 10, 5]} intensity={1.5} color="#38bdf8" /> {/* Cyan highlight */}
                    <pointLight position={[-10, -5, 2]} intensity={0.5} color="#818cf8" /> {/* Indigo fill */}

                    {/* The Environment map provides realistic reflections on the Glass and metallic Orb */}
                    <Environment preset="city" environmentIntensity={0.2} />

                    <QuantumOrb />
                    <LiquidGlass />

                </Suspense>
            </Canvas>
        </div>
    );
}
