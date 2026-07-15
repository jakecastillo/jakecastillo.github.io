"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The beam's terminus: a violet beacon that swells in behind the contact CTA,
 * then idles BREATHING faintly with the ribbon's head parked on it. The
 * visitor's hand drives it from here: hovering the Email CTA brightens the
 * beacon (`hot`), and pressing it (`askKey` increments on pointerdown, so it
 * works on touch) fires the cyan answer pulse — repeatable, caused by the
 * visitor, per the color discipline's sanctioned "answer" moment.
 *
 * Reduced motion: hover/press still answer as INSTANT state changes — the
 * swell steps brighter, and the press shows a static cyan ring that steps off
 * after a beat (JS state, not CSS animation: the global reduced-motion cap
 * zeroes keyframe durations, which would swallow a keyframed flash).
 */
export default function Beacon({
    hot = false,
    askKey = 0,
}: {
    /** The ask (Email CTA) is hovered/focused — brighten the beacon. */
    hot?: boolean;
    /** Increments per CTA pointerdown; keys a fresh, repeatable answer pulse. */
    askKey?: number;
}) {
    const reduced = useReducedMotion();

    // Reduced-motion answer: cyan acknowledgment appears instantly on press
    // and steps off — a state change, never a travel. The "on" write is
    // deferred a tick (never synchronous inside the effect — React Compiler
    // cascading-render rule); 0ms is imperceptible.
    const [rmFlash, setRmFlash] = useState(false);
    useEffect(() => {
        if (!reduced || askKey === 0) return;
        const on = setTimeout(() => setRmFlash(true), 0);
        const off = setTimeout(() => setRmFlash(false), 600);
        return () => {
            clearTimeout(on);
            clearTimeout(off);
        };
    }, [askKey, reduced]);

    return (
        <div
            aria-hidden="true"
            // Beam anchor: the ribbon's terminus parks on this element's
            // center (the beacon behind the CTA card) — never below the fold.
            data-beam-anchor="beacon"
            // Observable interaction state (also the verification hooks).
            data-beacon-hot={hot ? "" : undefined}
            data-ask-count={askKey}
            className="pointer-events-none absolute inset-0 -z-10 overflow-visible"
        >
            {/* Violet beacon swell — entrance once, then the idle breath. */}
            <motion.div
                initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                // Taller-than-wide: the bloom reads as a violet COLUMN rising
                // through the card — soft behind the CTA at top, densest across
                // the middle where the card would otherwise be empty. Sized to
                // fade out inside the card edges (no stray outer halo). The beam
                // anchor is the parent's center, so this shape never moves it.
                className="absolute left-1/2 top-1/2 h-[480px] w-[380px] -translate-x-1/2 -translate-y-1/2"
            >
                <motion.div
                    className="h-full w-full rounded-full"
                    style={{
                        background:
                            "radial-gradient(ellipse closest-side, rgba(139,92,246,0.28), rgba(139,92,246,0.08) 55%, transparent 75%)",
                    }}
                    animate={
                        reduced
                            ? // Instant brightness step on hover; no breathing.
                              { opacity: hot ? 1 : 0.85, scale: 1 }
                            : hot
                              ? { opacity: 1, scale: 1.06 }
                              : {
                                    opacity: [0.72, 1, 0.72],
                                    scale: [1, 1.035, 1],
                                }
                    }
                    transition={
                        reduced
                            ? { duration: 0 }
                            : hot
                              ? { duration: 0.35, ease: "easeOut" }
                              : {
                                    duration: 4.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }
                    }
                />
            </motion.div>
            {/* The answered ask — cyan pulse from the CTA outward, keyed per
                press so it restarts cleanly every time the visitor asks. */}
            {askKey > 0 && !reduced && (
                <motion.div
                    key={askKey}
                    data-answer-pulse=""
                    initial={{ opacity: 0.55, scale: 0.35 }}
                    animate={{
                        opacity: [0.55, 0.4, 0],
                        scale: [0.35, 1.6, 2.1],
                    }}
                    transition={{
                        duration: 1.2,
                        times: [0, 0.4, 1],
                        ease: "easeOut",
                    }}
                    className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/60 shadow-[0_0_60px_-10px_rgba(45,212,191,0.5)]"
                />
            )}
            {askKey > 0 && reduced && rmFlash && (
                <div
                    data-answer-flash=""
                    className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/60 opacity-60 shadow-[0_0_60px_-10px_rgba(45,212,191,0.5)]"
                />
            )}
        </div>
    );
}
