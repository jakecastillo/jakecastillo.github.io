"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
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
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "low-power",
                    // ACES filmic tonemapping gives the dark scene a cinematic
                    // roll-off in the highlights. Exposure is held below 1 so the
                    // overall image stays dim — this never brightens the orb, it
                    // just shapes the few lit pixels into a softer, premium falloff.
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 0.85,
                }}
                dpr={[1, 1.5]}
                frameloop={frameloop}
                camera={{ position: [0, 0, 5], fov: 45 }}
            >
                <Suspense fallback={null}>
                    {/* Site near-black, aligned to the global --background token. */}
                    <color attach="background" args={["#060608"]} />
                    {/* Volumetric falloff: a near-black violet fog dissolves the
                        orb's far edge into the void, adding cinematic depth without
                        adding any light. Tuned to start past the orb so the core
                        is untouched and only its silhouette softens. */}
                    <fog attach="fog" args={["#070611", 7, 16]} />
                    <ambientLight intensity={0.38} color="#b9aef2" /> {/* Cool violet-leaning ambient so the sphere reads with a premium tint */}
                    {/* Subdued lights: keep the brightest lit pixel dim enough that
                        muted foreground copy stays legible over the orb. */}
                    <pointLight position={[5, 10, 5]} intensity={0.7} color="#8b5cf6" /> {/* Violet key */}
                    <pointLight position={[-10, -5, 2]} intensity={0.32} color="#38bdf8" /> {/* Cyan fill */}
                    {/* Cool rim from behind/above carves the orb off the background
                        for depth. Very low intensity — it kisses the silhouette
                        edge only and does not raise the brightest lit pixel. */}
                    <pointLight position={[-4, 6, -6]} intensity={0.22} color="#67e8f9" /> {/* Cyan rim */}
                    <pointLight position={[6, -4, -5]} intensity={0.18} color="#a78bfa" /> {/* Violet counter-rim */}

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
