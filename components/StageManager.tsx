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
        return () => observer.disconnect();
        // setActiveId is a zustand action — referentially stable across
        // renders, so including it here doesn't change when this effect runs.
    }, [setActiveId]);

    const currentAct =
        stageSections.find((act) => act.id === activeId) ?? stageSections[0];

    return (
        // Nudged down from top-12 to clear the fixed header brand mark that now
        // sits at top-5 left-5; this keeps the act indicator from colliding with
        // it while staying aligned to the left gutter.
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
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        // Exit ~25% quicker than the entrance for a crisper handoff.
                        // (MotionProvider drops the x transform for reduced-motion users.)
                        exit={{
                            opacity: 0,
                            x: 16,
                            transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                        }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col"
                    >
                        <span className="text-xs font-mono tracking-[0.4em] text-muted-foreground mb-1">
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
    );
}
