"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBootStore } from "@/store/useBootStore";
import { REVEAL_EASE } from "@/lib/revealTimeline";
import SealedPerimeter from "@/components/SealedPerimeter";

// One honest beat, one clock. The old loader faked a systemd CRT boot (invented
// service logs, a progress bar wired to a 500ms wall-clock, Math.random log
// sampling) over work that wasn't happening — the Scene is deferred behind
// SceneLoader's idle callback, so there was nothing to mask, and a DevSecOps
// reviewer reads fake boot output as cosplay. This replaces it with a single
// designed moment: the secure perimeter SEALING. The cyan lock-ring draws closed
// once over ~600ms, then hands off seamlessly to the live orb (the same lattice).
const SEAL_MS = 650;
// Hold "reveal" long enough for the orb's land + chrome stagger to settle before
// "ready" arms the bare-desktop hints, so nothing stacks on a still-animating hero.
const REVEAL_TO_READY_MS = 1300;

export default function QuantumLoader() {
    const storeSetPhase = useBootStore((s) => s.setPhase);
    const storePhase = useBootStore((s) => s.phase);

    // Set when a fast-path (skip / reduced-motion / interaction) short-circuits
    // boot, so the seal timers below bail and can never revert a later phase.
    const fastPathRef = useRef(false);

    // Honor ?skip=1 (and deep-links) — jump straight to the desktop, never paint
    // the seal beat. Marks the fast path so the seal timers below no-op.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("skip") === "1" || params.has("open") || params.has("focus")) {
            fastPathRef.current = true;
            storeSetPhase("reveal");
            const id = setTimeout(() => storeSetPhase("ready"), 800);
            return () => clearTimeout(id);
        }
    }, [storeSetPhase]);

    // Reduced-motion users skip the seal entirely (they land on the static
    // SealedPerimeter the Scene renders); any genuine interaction also skips it.
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            fastPathRef.current = true;
            storeSetPhase("ready");
            return;
        }
        const skip = () => {
            if (useBootStore.getState().phase !== "ready") {
                fastPathRef.current = true;
                storeSetPhase("ready");
            }
        };
        window.addEventListener("pointerdown", skip);
        window.addEventListener("keydown", skip);
        window.addEventListener("wheel", skip, { passive: true });
        return () => {
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("keydown", skip);
            window.removeEventListener("wheel", skip);
        };
    }, [storeSetPhase]);

    // The whole boot machine: ONE seal beat, then a sequenced handoff. No second
    // clock, no log cascade. The reveal->ready hold lets the orb land settle.
    useEffect(() => {
        if (fastPathRef.current) return;
        const revealId = setTimeout(() => {
            if (!fastPathRef.current) storeSetPhase("reveal");
        }, SEAL_MS);
        const readyId = setTimeout(() => {
            if (!fastPathRef.current) storeSetPhase("ready");
        }, SEAL_MS + REVEAL_TO_READY_MS);
        return () => {
            clearTimeout(revealId);
            clearTimeout(readyId);
        };
    }, [storeSetPhase]);

    return (
        <AnimatePresence>
            {storePhase !== "ready" && storePhase !== "reveal" && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden bg-[#020617]"
                    // Short exit so the desktop chrome (which waits ~0.38s on the
                    // shared reveal timeline) paints on an already-cleared screen —
                    // the loader and the desktop are never on screen together.
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: REVEAL_EASE }}
                >
                    {/* The seal beat: the perimeter lattice with the cyan lock-ring
                        drawing closed once. Same visual language as the live orb, so
                        the exit hands off into the orb instead of cutting to it. */}
                    <SealedPerimeter isDesktop draw placement="center" />

                    {/* One honest line + a skip affordance, fading up under the seal. */}
                    <motion.div
                        className="absolute inset-x-0 bottom-[18%] flex flex-col items-center gap-3 px-6 text-center font-mono"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15, ease: REVEAL_EASE }}
                    >
                        <p className="text-[11px] sm:text-xs tracking-[0.32em] text-muted-foreground">
                            <span className="text-foreground">jake_castillo</span>
                            <span className="mx-2 text-muted-foreground/40">·</span>
                            <span className="text-accent">secure perimeter established</span>
                        </p>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40">
                            press any key →
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
