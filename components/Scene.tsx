"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import HoloLattice from "./canvas/HoloLattice";
import { damp } from "./canvas/anim";

interface SceneProps {
    /**
     * Borderline / mid-tier devices (incl. all mobile) render the Scene but in a
     * cheaper mode: coarser geometry, a half-resolution bloom post-pass, AND a
     * throttled ~30fps render loop — keeping the GPU/battery budget low while
     * still showing (and glowing) the holographic lattice.
     */
    lowPower?: boolean;
    /** Reduced-motion: render a single frozen LIT frame, no boot animation. */
    reducedMotion?: boolean;
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

/** Minimal shape we mutate on the Bloom effect ref. */
type BloomLike = { intensity: number };

/**
 * Ramps Bloom.intensity 0 → target during the boot ("powering on"), phased a
 * beat behind the scan via a small start delay. Mutates the effect ref in
 * useFrame — no React state, frame-rate independent.
 */
function BloomBoot({ bloomRef, target }: { bloomRef: React.RefObject<BloomLike | null>; target: number }) {
    useFrame((state, delta) => {
        const b = bloomRef.current;
        if (!b) return;
        if (state.clock.elapsedTime < 0.18) return; // phase behind the wipe
        b.intensity = damp(b.intensity, target, 3, delta);
    });
    return null;
}

/** Renders exactly one frame (reduced-motion still-frame under frameloop="never"). */
function RenderOnce() {
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        invalidate();
    }, [invalidate]);
    return null;
}

export default function Scene({ lowPower = false, reducedMotion = false }: SceneProps) {
    // Pause rendering when the tab/document is hidden so the loop never spins
    // the GPU offscreen.
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const sync = () => setHidden(document.hidden);
        sync();
        document.addEventListener("visibilitychange", sync);
        return () => document.removeEventListener("visibilitychange", sync);
    }, []);

    // Pause the persistent fixed canvas once the hero scrolls out of view —
    // it otherwise renders + runs the bloom pass for the entire page scroll.
    const [heroVisible, setHeroVisible] = useState(true);
    useEffect(() => {
        if (reducedMotion) return; // reduced path renders one frame, nothing to pause
        const el = document.getElementById("home");
        if (!el || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver(
            ([entry]) => setHeroVisible(entry.isIntersecting),
            // keep rendering a little past the hero edge, then stop
            { rootMargin: "200px 0px 200px 0px", threshold: 0 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [reducedMotion]);

    const bloomRef = useRef<BloomLike | null>(null);
    const bloomTarget = lowPower ? 0.9 : 1.05;

    // Low-power (mobile / mid-tier): demand-driven loop throttled to 30fps.
    // Full-power: the standard always-on loop. Hidden tab: stop entirely.
    // reduced-motion: one frame then idle. Otherwise: never when hidden or
    // scrolled past the hero; demand+throttle on low-power; always on desktop.
    const frameloop: "never" | "demand" | "always" = reducedMotion
        ? "demand"
        : hidden || !heroVisible
          ? "never"
          : lowPower
            ? "demand"
            : "always";

    return (
        // Fade the canvas in on mount via pure CSS (.holo-canvas-fade) — driving
        // this with React state from <Canvas onCreated> would update state inside
        // the R3F commit, which crashes React 19's dev reconciler (it tries to
        // JSON.stringify the circular Three.js scene graph).
        <div className="absolute inset-0 holo-canvas-fade">
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

                    <HoloLattice lowPower={lowPower} reducedMotion={reducedMotion} />

                    {/* Mobile / low-power: throttle the loop to ~30fps (half the
                        render work). Only while visible — unmounts when hidden. */}
                    {lowPower && !hidden && <FrameThrottle fps={30} />}

                    {/* Bloom is what makes the Fresnel rim + wireframe read as a
                        glowing hologram. The raw shader output is a ~1px additive
                        rim + a 0.16-opacity wireframe over near-black — on its own
                        that's imperceptible on a phone in ambient light, which is
                        why the holo looked "missing" on mobile.

                        So we ALWAYS run bloom now, but on low-power devices at a
                        cheaper budget: half-resolution buffer + fewer mip levels +
                        a slightly smaller intensity. A mipmap bloom at 0.5x res is
                        well within a mid-tier mobile GPU's budget (and trivial on a
                        flagship), while the in-shader low-power boost in HoloLattice
                        means the holo still reads even if a given device silently
                        fails to create the post-pass. Full-power keeps the original
                        look exactly. */}
                    <EffectComposer>
                        {lowPower ? (
                            <Bloom
                                ref={bloomRef}
                                intensity={reducedMotion ? bloomTarget : 0}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.5}
                                radius={0.7}
                                levels={5}
                                resolutionScale={0.5}
                                mipmapBlur
                            />
                        ) : (
                            <Bloom
                                ref={bloomRef}
                                intensity={reducedMotion ? bloomTarget : 0}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.5}
                                radius={0.75}
                                mipmapBlur
                            />
                        )}
                    </EffectComposer>

                    {/* Boot the bloom up (skipped under reduced motion). */}
                    {!reducedMotion && <BloomBoot bloomRef={bloomRef} target={bloomTarget} />}
                    {/* Reduced motion: force a single rendered frame. */}
                    {reducedMotion && <RenderOnce />}
                </Suspense>
            </Canvas>
        </div>
    );
}
