"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { selectExpPinned, useActStore } from "@/hooks/useActStore";

// Persistent brand mark (orbital glyph wordmark) + a thin top scrim.
// Client component so it can subscribe to the act store: while the Experience
// act is pinned, the "Jake Castillo" wordmark fades to yield the top-left lane
// (the glyph — an unambiguous home affordance — stays). The scrim is a fixed
// --background→transparent gradient that keeps the wordmark legible over
// running manifesto copy site-wide, without darkening more than the top edge.
//
// Scroll-aware chrome exclusion (jc-6dh): fixed chrome must never hard-overlap
// scrolling body/act content at legibility-breaking contrast (the hero
// "Email me" pill, stack-card text, the mobile "LET'S BUILD" headline all used
// to ride over the opaque wordmark/glyph). The instant the page leaves the
// hero's top edge the wordmark earns a backdrop pill (surface/80 + blur,
// matching the dock) so anything scrolling UNDER the fixed chrome reads as
// "behind glass" instead of colliding opaque-on-opaque. On the hero itself
// (scrollY ≈ 0) the pill is fully transparent — no permanent bar. It is a pure
// opacity swap on an ABSOLUTE layer, so the glyph + wordmark never move (CLS 0).
export default function BrandMark() {
    const pinned = useActStore(selectExpPinned);
    const prefersReducedMotion = useReducedMotion();

    // Reads the NATIVE window scroll (not useScrollStore): under reduced-motion
    // Lenis never initialises and the store's offset stays 0, so the store
    // can't be trusted for the "off the hero" signal. window.scrollY tracks the
    // real document scroll in both the Lenis and the native/reduced-motion
    // paths. State flips only on the threshold crossing → at most two re-renders
    // of this out-of-canvas chrome, never one per scroll tick.
    const [scrolled, setScrolled] = useState(false);
    const scrolledRef = useRef(false);

    useEffect(() => {
        const update = () => {
            // ~0.5vh past the top edge (min 4px) = any real scroll off the hero.
            const next =
                window.scrollY > Math.max(4, window.innerHeight * 0.005);
            if (next !== scrolledRef.current) {
                scrolledRef.current = next;
                setScrolled(next);
            }
        };
        update(); // seed from current position (reload / deep-link mid-page)
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    // Reduced motion lands on the SAME end state with zero travel/duration.
    const pillTransition = prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

    // Wordmark yield (jc-2fo): while the Experience act is pinned the wordmark
    // COLLAPSES its width (not just its opacity) so the frosted pill hugs the
    // glyph as a clean roundel instead of leaving a ~190px empty husk on-screen
    // for the entire 300vh pin. Same 0.35s beam ease as the fade; reduced motion
    // snaps to the collapsed end state.
    const wordmarkTransition = prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

    return (
        <>
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 z-30 h-8 bg-gradient-to-b from-background to-transparent"
            />
            {/* Top-left corner exclusion scrim (jc-3c3): the frosted pill alone
                could not knock down 95px violet display glyphs ("COUNTS.")
                scrolling under it — backdrop-blur softens but doesn't dim a
                bright source. A feathered --background corner wash, painted
                BEHIND the header (z-30 < z-40) so the pill's backdrop-blur then
                samples an already-darkened region, guarantees passing display
                type reads as "behind glass," never optically merged. Gated on
                `scrolled` (same swap as the pill) so the hero top-left stays
                perfectly clear — no permanent bar. */}
            <motion.div
                aria-hidden="true"
                initial={false}
                animate={{ opacity: scrolled ? 1 : 0 }}
                transition={pillTransition}
                className="pointer-events-none fixed left-0 top-0 z-30 h-28 w-72"
                style={{
                    background:
                        "radial-gradient(120% 120% at 0% 0%, var(--background) 0%, color-mix(in srgb, var(--background) 55%, transparent) 42%, transparent 72%)",
                }}
            />
            <header className="fixed left-5 top-5 z-40">
                <a
                    href="#home"
                    aria-label="Jake Castillo — home"
                    className="relative -m-2.5 flex min-h-[44px] min-w-[44px] items-center rounded-full p-2.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)]"
                >
                    {/* Backdrop pill — the global chrome-exclusion surface. Absolute
                        so the glyph + wordmark never shift when it appears (CLS 0);
                        backdrop-blur frosts whatever body/act content is scrolling
                        behind the fixed chrome. Fades in only once off the hero, so
                        the header stays transparent on the hero (no permanent bar). */}
                    <motion.span
                        aria-hidden="true"
                        initial={false}
                        animate={{ opacity: scrolled ? 1 : 0 }}
                        transition={pillTransition}
                        className="pointer-events-none absolute inset-0 rounded-full border border-border bg-surface-overlay/90 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_18px_48px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    />
                    {/* `relative` so the glyph + wordmark paint ABOVE the absolute
                        pill (positioned siblings paint in source order). */}
                    <svg
                        width="26"
                        height="26"
                        viewBox="0 0 100 100"
                        aria-hidden="true"
                        className="relative"
                    >
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
                    {/* overflow-hidden + animated maxWidth is what actually
                        collapses the pill: opacity alone kept the laid-out width
                        and left a husk. marginLeft carries the glyph↔wordmark gap
                        so the collapsed pill is a snug circle, not glyph + dead
                        gap. whitespace-nowrap keeps the wordmark from wrapping mid
                        collapse. */}
                    <motion.span
                        initial={false}
                        animate={{
                            maxWidth: pinned ? 0 : "12rem",
                            marginLeft: pinned ? 0 : "0.5rem",
                            opacity: pinned ? 0 : 1,
                        }}
                        transition={wordmarkTransition}
                        className="relative hidden overflow-hidden whitespace-nowrap font-mono text-xs uppercase tracking-[0.3em] text-foreground/80 sm:inline-block"
                    >
                        Jake Castillo
                    </motion.span>
                </a>
            </header>
        </>
    );
}
