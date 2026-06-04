"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { Environment } from "@react-three/drei";
import QuantumOrb from "./canvas/QuantumOrb";
import LiquidGlass from "./canvas/LiquidGlass";

interface SceneProps {
    /**
     * Borderline / mid-tier devices render the Scene but in a cheaper mode:
     * the reflective Environment map is dropped and the LiquidGlass refraction
     * lens is skipped, keeping the GPU budget low while still showing the orb.
     */
    lowPower?: boolean;
}

export default function Scene({ lowPower = false }: SceneProps) {
    // Pause rendering when the tab/document is hidden so the RAF loop stops
    // spinning the GPU offscreen. We mirror document visibility into a frameloop
    // value that React Three Fiber consumes.
    const [frameloop, setFrameloop] = useState<"always" | "never">("always");

    useEffect(() => {
        const sync = () => setFrameloop(document.hidden ? "never" : "always");
        sync();
        document.addEventListener("visibilitychange", sync);
        return () => document.removeEventListener("visibilitychange", sync);
    }, []);

    return (
        <div className="absolute inset-0">
            <Canvas
                gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
                dpr={[1, 1.5]}
                frameloop={frameloop}
                camera={{ position: [0, 0, 5], fov: 45 }}
            >
                <Suspense fallback={null}>
                    {/* Site near-black, aligned to the global --background token. */}
                    <color attach="background" args={["#060608"]} />
                    <ambientLight intensity={0.4} /> {/* Slightly brighter ambient so the sphere reads */}
                    {/* Subdued lights: keep the brightest lit pixel dim enough that
                        muted foreground copy stays legible over the orb. */}
                    <pointLight position={[5, 10, 5]} intensity={0.7} color="#8b5cf6" /> {/* Violet highlight */}
                    <pointLight position={[-10, -5, 2]} intensity={0.3} color="#38bdf8" /> {/* Cyan fill */}

                    {/* The Environment map adds realistic reflections, but it is
                        expensive — drop it entirely on low-power devices. */}
                    {!lowPower && <Environment preset="city" environmentIntensity={0.15} />}

                    <QuantumOrb />
                    {/* LiquidGlass transmission is the most expensive pass; skip it
                        on low-power devices and keep it subtle otherwise. */}
                    {!lowPower && <LiquidGlass />}
                </Suspense>
            </Canvas>
        </div>
    );
}
