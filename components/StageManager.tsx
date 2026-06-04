"use client";

import { useEffect, useState } from "react";
import {
    motion,
    AnimatePresence,
    useReducedMotion,
    useScroll,
    useSpring,
} from "framer-motion";
import { stageSections } from "@/data/sections";

export default function StageManager() {
    const [activeId, setActiveId] = useState(stageSections[0].id);
    const prefersReducedMotion = useReducedMotion();

    // Tie the vertical marker to overall scroll progress (no perpetual loop).
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
        restDelta: 0.001,
    });

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
    }, []);

    const currentAct =
        stageSections.find((act) => act.id === activeId) ?? stageSections[0];

    return (
        <div className="fixed top-12 left-12 z-40 hidden lg:block">
            <div className="flex flex-col items-start gap-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentAct.stageLabel}-${currentAct.stageTitle}`}
                        initial={
                            prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, x: -16 }
                        }
                        animate={{ opacity: 1, x: 0 }}
                        exit={
                            prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, x: 16 }
                        }
                        transition={{
                            duration: prefersReducedMotion ? 0.2 : 0.4,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        className="flex flex-col"
                    >
                        <span className="text-xs font-mono tracking-[0.4em] text-accent mb-1">
                            {currentAct.stageLabel}
                        </span>
                        <span className="text-lg font-black tracking-tighter text-foreground text-glow">
                            {currentAct.stageTitle}
                        </span>
                    </motion.div>
                </AnimatePresence>

                {/* Vertical progress marker tied to scroll position. */}
                <div className="w-px h-16 bg-border mt-6 relative overflow-hidden">
                    {prefersReducedMotion ? (
                        <span
                            aria-hidden="true"
                            className="absolute top-0 left-0 w-full h-full bg-primary/60"
                        />
                    ) : (
                        <motion.span
                            aria-hidden="true"
                            className="absolute top-0 left-0 w-full bg-primary origin-top"
                            style={{ height: "100%", scaleY: smoothProgress }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
