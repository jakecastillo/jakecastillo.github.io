"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import HoloLattice from "./canvas/HoloLattice";

interface SceneProps {
    /**
     * Borderline / mid-tier devices render the Scene but in a cheaper mode:
     * coarser geometry and no bloom post-pass, keeping the GPU budget low while
     * still showing the holographic lattice.
     */
    lowPower?: boolean;
}

export default function Scene({ lowPower = false }: SceneProps) {
    // Pause rendering when the tab/document is hidden so the RAF loop stops
    // spinning the GPU offscreen.
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
                    // highlight roll-off; exposure below 1 keeps the image dim.
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 0.95,
                }}
                dpr={[1, 1.5]}
                frameloop={frameloop}
                camera={{ position: [0, 0, 5], fov: 45 }}
            >
                <Suspense fallback={null}>
                    {/* Site near-black, aligned to the global --background token. */}
                    <color attach="background" args={["#060608"]} />
                    {/* Violet fog dissolves the far hemisphere into the void. */}
                    <fog attach="fog" args={["#070611", 5.5, 17]} />

                    <HoloLattice lowPower={lowPower} />

                    {/* Bloom makes the Fresnel rim + wireframe glow like a hologram.
                        Skipped on low-power devices to save the post-pass. */}
                    {!lowPower && (
                        <EffectComposer>
                            <Bloom
                                intensity={0.85}
                                luminanceThreshold={0.12}
                                luminanceSmoothing={0.5}
                                radius={0.7}
                                mipmapBlur
                            />
                        </EffectComposer>
                    )}
                </Suspense>
            </Canvas>
        </div>
    );
}
