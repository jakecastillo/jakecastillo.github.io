"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The beam's terminus: a violet beacon glow that swells behind the contact
 * CTA as the act enters, answered once by a cyan pulse — the only cyan
 * "signal" moment in the act, per the color discipline.
 */
export default function Beacon() {
    const reduced = useReducedMotion();

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-visible"
        >
            {/* Violet beacon swell */}
            <motion.div
                initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    background:
                        "radial-gradient(closest-side, rgba(139,92,246,0.28), rgba(139,92,246,0.08) 55%, transparent 75%)",
                }}
            />
            {/* One-shot cyan answer pulse */}
            {!reduced && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    whileInView={{ opacity: [0, 0.5, 0], scale: [0.3, 1.6, 2.1] }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                        duration: 1.6,
                        delay: 0.9,
                        times: [0, 0.35, 1],
                        ease: "easeOut",
                    }}
                    className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/60 shadow-[0_0_60px_-10px_rgba(45,212,191,0.5)]"
                />
            )}
        </div>
    );
}
