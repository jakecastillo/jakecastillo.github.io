"use client";

import { motion } from "framer-motion";
import { selectExpPinned, useActStore } from "@/hooks/useActStore";

// Persistent brand mark (orbital glyph wordmark) + a thin top scrim.
// Client component so it can subscribe to the act store: while the Experience
// act is pinned, the "Jake Castillo" wordmark fades to yield the top-left lane
// (the glyph — an unambiguous home affordance — stays). The scrim is a fixed
// --background→transparent gradient that keeps the wordmark legible over
// running manifesto copy site-wide, without darkening more than the top edge.
export default function BrandMark() {
    const pinned = useActStore(selectExpPinned);

    return (
        <>
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 z-30 h-8 bg-gradient-to-b from-background to-transparent"
            />
            <header className="fixed left-5 top-5 z-40">
                <a
                    href="#home"
                    aria-label="Jake Castillo — home"
                    className="-m-2.5 flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full p-2.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)]"
                >
                    <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
                        <defs>
                            <linearGradient id="brandmark" x1="0" y1="0" x2="0.7" y2="1">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <circle cx="57" cy="23" r="7.5" fill="url(#brandmark)" />
                        <path
                            d="M57 37 L57 63 Q57 80 40 80 Q28 80 28 68"
                            fill="none"
                            stroke="url(#brandmark)"
                            strokeWidth="13"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <circle cx="73" cy="73" r="7.5" fill="#2dd4bf" />
                    </svg>
                    <motion.span
                        animate={{ opacity: pinned ? 0 : 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="hidden font-mono text-xs uppercase tracking-[0.3em] text-foreground/80 sm:inline"
                    >
                        Jake Castillo
                    </motion.span>
                </a>
            </header>
        </>
    );
}
