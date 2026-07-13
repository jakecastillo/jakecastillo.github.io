"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import HoloLattice from "./canvas/HoloLattice";
import BeamRibbon from "./canvas/BeamRibbon";
import { getBeamAnchorFrame } from "@/hooks/useBeamAnchors";
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
 * one rAF timestamp-gates invalidate() at `fps` while the holo is in view, and
 * THROTTLES to the cheaper `idleFps` once the hero is scrolled past — the holo
 * keeps rotating everywhere (its motion is slow enough to look identical at the
 * lower rate), just rendering less often to ease battery on the long lower page.
 * Only a hidden tab pauses it entirely (nothing to render offscreen).
 *
 * Crucially, ALL of this state lives in refs + listeners, never React state, so
 * this component and the <Canvas> above it never re-render. Re-rendering the
 * Canvas subtree after mount crashes React 19's dev reconciler — it tries to
 * JSON.stringify the circular Three.js scene graph ("Converting circular
 * structure to JSON"). Imperative loop control keeps the Canvas props static.
 */
function LoopDriver({ fps, idleFps, reducedMotion }: { fps: number; idleFps: number; reducedMotion: boolean }) {
    const invalidate = useThree((s) => s.invalidate);

    useEffect(() => {
        // Reduced motion: render static, lit frames — one at mount, then only
        // when the beam must stay glued to the content: on scroll (the ribbon
        // mesh translates with the document; scroll-linked position, not
        // animation — time uniforms are frozen on this path) and on anchor
        // re-measures (resize/layout). Idle otherwise.
        if (reducedMotion) {
            invalidate();
            let raf = 0;
            const onScroll = () => {
                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => invalidate());
            };
            window.addEventListener("scroll", onScroll, { passive: true });
            let anchorVersion = getBeamAnchorFrame().version;
            const versionPoll = setInterval(() => {
                const v = getBeamAnchorFrame().version;
                if (v !== anchorVersion) {
                    anchorVersion = v;
                    invalidate();
                }
            }, 250);
            return () => {
                cancelAnimationFrame(raf);
                window.removeEventListener("scroll", onScroll);
                clearInterval(versionPoll);
            };
        }

        let raf = 0;
        let last = 0;
        const visible = { current: typeof document !== "undefined" ? !document.hidden : true };
        const heroOnScreen = { current: true };

        const onVisibility = () => {
            visible.current = !document.hidden;
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Throttle (not pause) once the hero (#home) is scrolled well out of view,
        // so the holo keeps rotating everywhere — just rendered less often.
        let io: IntersectionObserver | null = null;
        const hero = document.getElementById("home");
        if (hero && "IntersectionObserver" in window) {
            io = new IntersectionObserver(
                ([entry]) => {
                    heroOnScreen.current = entry.isIntersecting;
                },
                { rootMargin: "200px 0px 200px 0px", threshold: 0 },
            );
            io.observe(hero);
        }

        // The beam ribbon is pinned to the document (it translates with
        // scroll), so any scroll movement needs the FULL frame rate to stay
        // visually glued to the 60fps content — the idle throttle only kicks
        // in once the page has been still for a beat below the hero.
        let lastScrollY = -1;
        let lastScrollMove = 0;

        const tick = (t: number) => {
            raf = requestAnimationFrame(tick);
            if (!visible.current) return; // tab hidden → nothing to render offscreen
            const y = window.scrollY;
            if (y !== lastScrollY) {
                lastScrollY = y;
                lastScrollMove = t;
            }
            const active =
                heroOnScreen.current || t - lastScrollMove < 250;
            // Sub-frame tolerance (the -4): a bare 1000/rate gate skips native rAF
            // ticks arriving fractionally early, dropping ~1/3 of frames. Use the
            // lower idle rate once the page is still below the hero.
            const interval = 1000 / (active ? fps : idleFps) - 4;
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
    }, [invalidate, fps, idleFps, reducedMotion]);

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
    // Render rate while the holo is in view (hero) vs. throttled once scrolled
    // past it — the holo keeps rotating throughout; only the cadence drops.
    const fps = lowPower ? 30 : 60;
    const idleFps = lowPower ? 20 : 30;

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

                    {/* The Beam: a scroll-drawn ribbon of light threading the
                        lattice — its drawn length IS document scroll progress.
                        Props constant after mount (no Canvas re-render). */}
                    <BeamRibbon lowPower={lowPower} reducedMotion={reducedMotion} />

                    {/* Demand-loop driver: invalidates at the target fps in the
                        hero, throttles (keeps rotating) when scrolled past, pauses
                        on a hidden tab, renders one frame under reduced motion. */}
                    <LoopDriver fps={fps} idleFps={idleFps} reducedMotion={reducedMotion} />

                    {/* Bloom is what makes the Fresnel rim + wireframe read as a
                        glowing hologram. On low-power devices it runs at a cheaper
                        budget: half-resolution buffer + fewer mip levels + a
                        slightly smaller intensity. Its intensity ramps from 0 during
                        the boot (BloomBoot) so the holo "powers on". */}
                    <EffectComposer>
                        {lowPower ? (
                            <>
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
                                <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.045} />
                            </>
                        ) : (
                            <>
                                <Bloom
                                    ref={bloomRef}
                                    intensity={reducedMotion ? bloomTarget : 0}
                                    luminanceThreshold={0.1}
                                    luminanceSmoothing={0.5}
                                    radius={0.75}
                                    mipmapBlur
                                />
                                <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.045} />
                            </>
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
