"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { stageSections } from "@/data/sections";
import { selectExpPinned, useActStore } from "@/hooks/useActStore";

export default function StageManager() {
    const activeId = useActStore((s) => s.activeActId);
    const setActiveId = useActStore((s) => s.setActiveActId);
    // Yield the fixed left rail while the Experience act is pinned: cards scrub
    // across the full viewport (passing under x<130) and the act indicator would
    // slice through them — and, on unpin, float over "THE STACK". Tucking it out
    // for the whole pin also parks it well before unpin completes.
    const pinned = useActStore(selectExpPinned);

    // Drive the marker straight from scrollYProgress — Lenis already eases the
    // scroll, so an extra useSpring would double-smooth into a floaty rail.
    const { scrollYProgress } = useScroll();

    useEffect(() => {
        // Track per-section visibility ratios and surface the most-visible one.
        const ratios = new Map<string, number>();
        const elements = stageSections
            .map((act) => document.getElementById(act.id))
            .filter((el): el is HTMLElement => el !== null);

        if (elements.length === 0) return;

        // Deep-link / back-forward arrival: seed the active act straight from the
        // URL hash so a cold-load of /#skills lights the matching act before the
        // observer catches up. This store is now the SINGLE source of the active
        // section — the dock (Navigation) reads it too, so the duplicate
        // observer that used to live in Navigation is gone (jc-g2l).
        const syncFromHash = () => {
            const id = window.location.hash.slice(1);
            if (id && stageSections.some((act) => act.id === id)) setActiveId(id);
        };
        syncFromHash();
        window.addEventListener("hashchange", syncFromHash);
        window.addEventListener("popstate", syncFromHash);

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    ratios.set(
                        entry.target.id,
                        entry.isIntersecting ? entry.intersectionRatio : 0
                    );
                }

                // Pick the section with the greatest visible ratio, falling
                // back to document order on ties.
                let bestId = stageSections[0].id;
                let bestRatio = -1;
                for (const act of stageSections) {
                    const ratio = ratios.get(act.id) ?? 0;
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestId = act.id;
                    }
                }

                if (bestRatio > 0) setActiveId(bestId);
            },
            {
                // Bias toward the upper-center band so the active act flips as a
                // section settles into the reading zone.
                rootMargin: "-20% 0px -55% 0px",
                threshold: [0, 0.25, 0.5, 0.75, 1],
            }
        );

        elements.forEach((el) => observer.observe(el));
        return () => {
            observer.disconnect();
            window.removeEventListener("hashchange", syncFromHash);
            window.removeEventListener("popstate", syncFromHash);
        };
        // setActiveId is a zustand action — referentially stable across
        // renders, so including it here doesn't change when this effect runs.
    }, [setActiveId]);

    const currentAct =
        stageSections.find((act) => act.id === activeId) ?? stageSections[0];

    return (
        <>
        {/* Nudged down from top-12 to clear the fixed header brand mark that now
            sits at top-5 left-5; this keeps the act indicator from colliding with
            it while staying aligned to the left gutter. */}
        <motion.div
            inert={pinned ? true : undefined}
            animate={{ opacity: pinned ? 0 : 1, x: pinned ? -12 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-24 left-12 z-40 hidden lg:block"
        >
            <div className="flex flex-col items-start gap-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentAct.stageLabel}-${currentAct.stageTitle}`}
                        // Journey axis (jc-ahs): the rail's own progress marker
                        // fills top-down directly beneath this label, the beam
                        // threads downward, the dock yields downward — every
                        // other travel in the system is vertical. The act
                        // indicator now rides the same axis: the new act rises
                        // in from below, the old one exits upward, mirroring
                        // forward-scroll direction instead of a sideways
                        // pass-through borrowed from a different grammar.
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        // Exit ~25% quicker than the entrance for a crisper handoff.
                        // (MotionProvider drops the y transform for reduced-motion users.)
                        exit={{
                            opacity: 0,
                            y: -10,
                            transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                        }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col"
                    >
                        <span className="text-xs label mb-1">
                            {currentAct.stageLabel}
                        </span>
                        <span className="text-lg font-black tracking-tighter text-foreground text-glow">
                            {currentAct.stageTitle}
                        </span>
                    </motion.div>
                </AnimatePresence>

                {/* Vertical progress marker tied to scroll position (scroll-linked,
                    not autonomous motion, so it's calm under reduced-motion too). */}
                <div className="w-px h-16 bg-border mt-6 relative overflow-hidden">
                    <motion.span
                        aria-hidden="true"
                        className="absolute top-0 left-0 w-full bg-primary origin-top"
                        style={{ height: "100%", scaleY: scrollYProgress }}
                    />
                </div>
            </div>
        </motion.div>

        {/* Compact position indicator (jc-2cx): the rail above is lg-only, so
            below that breakpoint tablet/mobile visitors lost ALL sense of "which
            act, how many left" — the dock's active label names the current act,
            but never the count. A minimal numeral + step-dot chip in the
            opposite top corner from BrandMark (top-5 left-5) answers both without
            adding a second full rail. Purely decorative (the dock's own
            aria-current links + each act's sr-only heading already carry this
            for assistive tech), so the whole chip is aria-hidden. Fades with the
            same pinned signal as the lg rail: the Experience pin's escape-hatch
            affordance (Navigation.tsx, jc-42a) claims this exact corner while
            scrubbed, so the two are never on-screen together. */}
        <motion.div
            aria-hidden="true"
            animate={{ opacity: pinned ? 0 : 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-5 top-5 z-40 flex lg:hidden"
        >
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-overlay/80 px-3 py-2 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_18px_48px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                <span className="font-mono text-xs tabular-nums text-primary">
                    {currentAct.stageLabel}
                </span>
                <span className="flex items-center gap-1">
                    {stageSections.map((act) => (
                        <span
                            key={act.id}
                            className={`h-1 rounded-full transition-all duration-300 ${
                                act.id === activeId
                                    ? "w-3 bg-primary"
                                    : "w-1 bg-border-strong"
                            }`}
                        />
                    ))}
                </span>
            </div>
        </motion.div>
        </>
    );
}
