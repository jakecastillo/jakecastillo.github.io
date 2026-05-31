"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment } from "@react-three/drei";
import QuantumOrb from "./canvas/QuantumOrb";
import LiquidGlass from "./canvas/LiquidGlass";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function Scene() {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const allowMotion = useMediaQuery("(prefers-reduced-motion: no-preference)");
    const heavyOk = isDesktop && allowMotion;

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 1.5]}
                camera={{ position: [0, 0, 5], fov: 45 }}
                frameloop={allowMotion ? "always" : "demand"}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={["#020617"]} />
                    <ambientLight intensity={0.4} />
                    <pointLight position={[5, 10, 5]} intensity={1.5} color="#38bdf8" />
                    <pointLight position={[-10, -5, 2]} intensity={0.5} color="#818cf8" />
                    <Environment preset="city" environmentIntensity={0.2} />

                    <QuantumOrb />
                    {heavyOk && <LiquidGlass />}
                </Suspense>
            </Canvas>
        </div>
    );
}
