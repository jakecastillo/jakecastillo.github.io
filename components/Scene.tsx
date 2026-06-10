"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
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

/** Minimal shape we mutate on the Bloom effect ref. */
type BloomLike = { intensity: number };

/**
 * Single source of render-loop control. The <Canvas> runs frameloop="demand", so
 * the expensive GL + bloom render only happens when we call invalidate(). This
 * one rAF timestamp-gates invalidate() at the target fps, and PAUSES it entirely
 * when the tab is hidden or the hero (and thus the holo) is scrolled out of view
 * — letting the cheap CSS aurora carry the lower page (the biggest battery win).
 *
 * Crucially, ALL of this state lives in refs + listeners, never React state, so
 * this component and the <Canvas> above it never re-render. Re-rendering the
 * Canvas subtree after mount crashes React 19's dev reconciler — it tries to
 * JSON.stringify the circular Three.js scene graph ("Converting circular
 * structure to JSON"). Imperative loop control keeps the Canvas props static.
 */
function LoopDriver({ fps, reducedMotion }: { fps: number; reducedMotion: boolean }) {
    const invalidate = useThree((s) => s.invalidate);

    useEffect(() => {
        // Reduced motion: render exactly ONE (static, lit) frame, then idle.
        if (reducedMotion) {
            invalidate();
            return;
        }

        let raf = 0;
        let last = 0;
        const interval = 1000 / fps;
        const visible = { current: typeof document !== "undefined" ? !document.hidden : true };
        const heroOnScreen = { current: true };

        const onVisibility = () => {
            visible.current = !document.hidden;
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Pause once the hero (#home) is scrolled well out of view.
        let io: IntersectionObserver | null = null;
        const hero = document.getElementById("home");
        if (hero && "IntersectionObserver" in window) {
            io = new IntersectionObserver(
                ([entry]) => {
                    heroOnScreen.current = entry.isIntersecting;
                    if (entry.isIntersecting) invalidate(); // wake immediately on return
                },
                { rootMargin: "200px 0px 200px 0px", threshold: 0 },
            );
            io.observe(hero);
        }

        const tick = (t: number) => {
            raf = requestAnimationFrame(tick);
            if (!visible.current || !heroOnScreen.current) return; // paused → no GPU work
            if (t - last < interval) return;
            last = t;
            invalidate();
        };
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener("visibilitychange", onVisibility);
            io?.disconnect();
        };
    }, [invalidate, fps, reducedMotion]);

    return null;
}

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

export default function Scene({ lowPower = false, reducedMotion = false }: SceneProps) {
    const bloomRef = useRef<BloomLike | null>(null);
    const bloomTarget = lowPower ? 0.9 : 1.05;
    // Full-power ~60fps; low-power ~30fps. The loop is demand-driven and paused
    // when offscreen, so even "60" only runs while the holo is actually visible.
    const fps = lowPower ? 30 : 60;

    return (
        // Fade the canvas in on mount via pure CSS (.holo-canvas-fade) — masks the
        // first-frame shader-compile hitch without a React state update inside the
        // R3F commit (which would crash React 19's dev reconciler).
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
                // Constant after mount — loop control is imperative (LoopDriver) so
                // the Canvas subtree never re-renders (see LoopDriver note above).
                frameloop="demand"
                camera={{ position: [0, 0, 5], fov: 45 }}
            >
                <Suspense fallback={null}>
                    {/* Transparent canvas (no scene background) so the CSS aurora +
                        page background show through behind the holographic lattice. */}
                    <fog attach="fog" args={["#070611", 5.5, 17]} />

                    <HoloLattice lowPower={lowPower} reducedMotion={reducedMotion} />

                    {/* Demand-loop driver: invalidates at the target fps while the
                        holo is visible; pauses when hidden / scrolled past; renders
                        one frame then idles under reduced motion. */}
                    <LoopDriver fps={fps} reducedMotion={reducedMotion} />

                    {/* Bloom is what makes the Fresnel rim + wireframe read as a
                        glowing hologram. On low-power devices it runs at a cheaper
                        budget: half-resolution buffer + fewer mip levels + a
                        slightly smaller intensity. Its intensity ramps from 0 during
                        the boot (BloomBoot) so the holo "powers on". */}
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

                    {/* Boot the bloom up (skipped under reduced motion, which seeds
                        the resting intensity statically above). */}
                    {!reducedMotion && <BloomBoot bloomRef={bloomRef} target={bloomTarget} />}
                </Suspense>
            </Canvas>
        </div>
    );
}
