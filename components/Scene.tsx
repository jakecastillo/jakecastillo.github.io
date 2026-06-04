"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import QuantumOrb from "./canvas/QuantumOrb";
import LiquidGlass from "./canvas/LiquidGlass";
import { useMediaQuery, DESKTOP_MEDIA_QUERY } from "@/hooks/useMediaQuery";
import { useBootStore } from "@/store/useBootStore";
import SealedPerimeter from "@/components/SealedPerimeter";
import { REVEAL, REVEAL_EASE } from "@/lib/revealTimeline";

// Minimal shape for the (non-standard, not-in-lib.dom) Network Information API.
// Used only to detect Data Saver so we can skip the WebGL Canvas on low-power /
// metered connections where the orb is near-invisible anyway.
type SaveDataConnection = { saveData?: boolean };

function prefersSaveData(): boolean {
    if (typeof navigator === "undefined") return false;
    const conn = (navigator as Navigator & { connection?: SaveDataConnection })
        .connection;
    return Boolean(conn?.saveData);
}

export default function Scene() {
    const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
    const allowMotion = useMediaQuery("(prefers-reduced-motion: no-preference)");
    const heavyOk = isDesktop && allowMotion;
    const phase = useBootStore((s) => s.phase);
    const visible = phase === "reveal" || phase === "ready";

    // Low-power gate (R7-B): when the user prefers reduced motion OR has Data
    // Saver on, skip mounting the WebGL Canvas entirely and render a lightweight
    // static "sealed perimeter" placeholder instead. The orb is near-invisible in
    // these conditions anyway (no bloom, heavy scrim), so paying the WebGL
    // INP/LCP/battery cost buys nothing — this kills it where it doesn't pay.
    // saveData starts false (matches SSR + first client render, so no hydration
    // mismatch) and is read post-mount in a rAF so the set never fires
    // synchronously in the effect body.
    const [saveData, setSaveData] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setSaveData(prefersSaveData()));
        return () => cancelAnimationFrame(id);
    }, []);
    const lowPower = !allowMotion || saveData;

    // Stage the heavy WebGL features (LiquidGlass's MeshTransmissionMaterial FBO
    // + EffectComposer/Bloom) one idle tick AFTER the Canvas + orb mount. Mounting
    // three.js init + Environment HDR + the transmission FBO + the post-processing
    // composer all in the single "reveal" frame synchronously jammed the main
    // thread (multi-second long task), so the QuantumLoader phase timers
    // (reveal->ready) and the boot-overlay exit fired tens of seconds late on
    // GPU-constrained first visits. Bringing the heavy path in a beat later keeps
    // the main thread free for the phase machine + overlay dismissal, then layers
    // the bloom/glass on for the settled hero. The orb's own reveal "land" runs on
    // REVEAL_DURATION (1.5s), so the staged bloom still catches the snap.
    const [heavyReady, setHeavyReady] = useState(false);
    useEffect(() => {
        if (!heavyOk) return;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let idleId: number | undefined;
        if ("requestIdleCallback" in window) {
            idleId = window.requestIdleCallback(() => setHeavyReady(true), {
                timeout: 600,
            });
        } else {
            timeoutId = setTimeout(() => setHeavyReady(true), 120);
        }
        return () => {
            if (idleId !== undefined && "cancelIdleCallback" in window) {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId !== undefined) clearTimeout(timeoutId);
        };
    }, [heavyOk]);

    const heavyOn = heavyOk && heavyReady;

    // R7-A: one-shot cyan radial-glow burst over the canvas on mobile reveal.
    // Mobile can't run the EffectComposer Bloom, so the lock-ring SNAP lands with
    // no halo; this CSS burst FAKES that bloom — a fast (~350ms) cyan flash that
    // decays to 0 so it never lingers behind reading surfaces. Gated on the
    // reveal beat + mobile + motion; reduced-motion / save-data never see it
    // (lowPower swaps the whole canvas for the static placeholder).
    const [mobileBurst, setMobileBurst] = useState(false);
    const burstEligible = !isDesktop && allowMotion && !lowPower;
    useEffect(() => {
        if (!burstEligible || phase !== "reveal") return;
        // Arm on the next frame (not synchronously in the effect body) so the
        // flash paints with the reveal, then decay it to nothing after ~350ms.
        const onId = requestAnimationFrame(() => setMobileBurst(true));
        const offId = setTimeout(() => setMobileBurst(false), 360);
        return () => {
            cancelAnimationFrame(onId);
            clearTimeout(offId);
            setMobileBurst(false);
        };
    }, [burstEligible, phase]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            // Cross-fade in AT reveal (+0 on the shared timeline) so the orb picks
            // up directly from the boot seal lattice — a handoff, not a second
            // intro. (Was delay 0.7s / 0.8s easeOut, which raced the overlay exit.)
            transition={{ duration: REVEAL.orbDuration, ease: REVEAL_EASE, delay: REVEAL.orb }}
            className="fixed inset-0 z-0 pointer-events-none"
        >
            {lowPower ? (
                // Static "sealed perimeter" placeholder (R7-B). Pure CSS/SVG, no
                // WebGL, no binary asset: a faint violet containment lattice with
                // the cyan lock-ring already sealed — the same "secure perimeter
                // established" read as the live orb, frozen. Honors the strict
                // two-color system (violet lattice + cyan seal) and adds no motion.
                <SealedPerimeter isDesktop={isDesktop} />
            ) : (
                <Canvas
                    gl={{ antialias: true, alpha: true }}
                    dpr={[1, 1.5]}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    frameloop={allowMotion ? "always" : "demand"}
                >
                    <Suspense fallback={null}>
                        <color attach="background" args={["#020617"]} />
                        <ambientLight intensity={0.4} />
                        {/* Palette-disciplined lighting: a violet key + a single
                            cool cyan rim — the only two colors in the system.
                            (Was off-brand sky-blue #38bdf8 + indigo #818cf8.) */}
                        <pointLight position={[5, 10, 5]} intensity={1.4} color="#8b5cf6" />
                        <pointLight position={[-8, -4, 3]} intensity={0.45} color="#22d3ee" />
                        <Environment preset="city" environmentIntensity={0.2} />
                        <QuantumOrb isDesktop={isDesktop} allowMotion={allowMotion} />
                        {heavyOn && <LiquidGlass />}
                        {/* Bloom makes the orb "land" on reveal. Desktop + allow-motion
                            only (staged a tick after mount so it never jams the reveal
                            frame), so mobile and reduced-motion keep the flat orb. */}
                        {heavyOn && (
                            // multisampling={0}: the default MSAA render target forces
                            // a per-frame multisample resolve/blit that triggers the
                            // driver "GPU stall due to ReadPixels" performance warning.
                            // The Canvas already requests antialias and bloom uses
                            // mipmapBlur, so disabling the composer's own MSAA removes
                            // the synchronous read-back without a visible quality hit.
                            <EffectComposer multisampling={0}>
                                {/* mipmapBlur keeps the bloom cheap. A high
                                    luminanceThreshold means only the bright cyan
                                    lock-ring SNAP spike (emissive ~5, toneMapped
                                    false) crosses into bloom — so the lock "blooms
                                    cyan" in a single frame without the violet
                                    lattice or core washing out the whole scene. */}
                                <Bloom
                                    mipmapBlur
                                    intensity={1.1}
                                    luminanceThreshold={0.85}
                                    luminanceSmoothing={0.2}
                                    radius={0.7}
                                />
                            </EffectComposer>
                        )}
                    </Suspense>
                </Canvas>
            )}

            {/* R7-A mobile cyan bloom burst: one-shot radial cyan flash centered on
                the orb's low band, fast-decaying to 0 so it never sits behind the
                reading zone. Fakes the EffectComposer Bloom mobile can't run. */}
            {mobileBurst && (
                <motion.div
                    aria-hidden
                    initial={{ opacity: 0.55 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="absolute inset-0"
                    style={{
                        // Centered low (~68%) to track the shrunk, dropped mobile
                        // orb; cyan (--accent, the secure/active signal) only.
                        background:
                            "radial-gradient(circle at 50% 68%, rgba(34,211,238,0.45) 0%, rgba(34,211,238,0.12) 28%, rgba(34,211,238,0) 60%)",
                    }}
                />
            )}

            {/* Mobile scrim: the orb canvas can otherwise bleed through the
                content tabs (About/Career/Stack/Projects/Contact). A bottom-up
                void-tinted gradient keeps the orb a near-quiet backdrop so mobile
                body text always reads cleanly. R7: the mid-stop is tapered toward
                /55 (was /70) so the orb's low seal band reads, while the /90 floor
                (was /95) keeps the upper reading zone dark — AppCanvas's own
                /95 panel still guarantees AA on actual text surfaces. */}
            {!isDesktop && (
                <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-[#020617]/30 via-[#020617]/55 to-[#020617]/90"
                />
            )}
        </motion.div>
    );
}
