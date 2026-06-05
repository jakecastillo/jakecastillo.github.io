"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import HoloLattice from "./canvas/HoloLattice";

interface SceneProps {
    /**
     * Borderline / mid-tier devices (incl. all mobile) render the Scene but in a
     * cheaper mode: coarser geometry, no bloom post-pass, AND a throttled ~30fps
     * render loop — keeping the GPU/battery budget low while still showing the
     * holographic lattice.
     */
    lowPower?: boolean;
}

/**
 * Drives the render loop at a capped FPS while frameloop="demand". The holo
 * rotates slowly, so 30fps is visually identical to 60 — but the expensive GL
 * render only runs half as often. The rAF itself is a cheap timestamp check;
 * the GPU work happens only on invalidate().
 */
function FrameThrottle({ fps }: { fps: number }) {
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        let raf = 0;
        let last = 0;
        const interval = 1000 / fps;
        const tick = (t: number) => {
            raf = requestAnimationFrame(tick);
            if (t - last >= interval) {
                last = t;
                invalidate();
            }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [invalidate, fps]);
    return null;
}

export default function Scene({ lowPower = false }: SceneProps) {
    // Pause rendering when the tab/document is hidden so the loop never spins
    // the GPU offscreen.
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const sync = () => setHidden(document.hidden);
        sync();
        document.addEventListener("visibilitychange", sync);
        return () => document.removeEventListener("visibilitychange", sync);
    }, []);

    // Low-power (mobile / mid-tier): demand-driven loop throttled to 30fps.
    // Full-power: the standard always-on loop. Hidden tab: stop entirely.
    const frameloop = hidden ? "never" : lowPower ? "demand" : "always";

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
                    {/* Transparent canvas (no scene background) so the CSS aurora +
                        page background show through behind the holographic lattice. */}
                    <fog attach="fog" args={["#070611", 5.5, 17]} />

                    <HoloLattice lowPower={lowPower} />

                    {/* Mobile / low-power: throttle the loop to ~30fps (half the
                        render work). Only while visible — unmounts when hidden. */}
                    {lowPower && !hidden && <FrameThrottle fps={30} />}

                    {/* Bloom makes the Fresnel rim + wireframe glow like a hologram.
                        Skipped on low-power devices to save the post-pass. */}
                    {!lowPower && (
                        <EffectComposer>
                            <Bloom
                                intensity={1.05}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.5}
                                radius={0.75}
                                mipmapBlur
                            />
                        </EffectComposer>
                    )}
                </Suspense>
            </Canvas>
        </div>
    );
}
