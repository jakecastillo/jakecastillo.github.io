"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export type ProcessStep = { index: string; title: string; body: string };

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ProcessSpine({ steps }: { steps: ProcessStep[] }) {
    const ref = useRef<HTMLOListElement>(null);
    const reduced = useReducedMotion();

    // Connector draws top→bottom as the list passes through the reading zone.
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 80%", "end 65%"],
    });
    const drawn = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <ol
            ref={ref}
            className="relative flex flex-col gap-10 pl-8 sm:gap-12 sm:pl-10"
        >
            {/* Rail track (faint, full height) */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[3px] top-3 bottom-3 w-px bg-border-subtle"
            />
            {/* Drawn rail — scroll-linked; full + static under reduced motion */}
            <motion.span
                aria-hidden="true"
                style={{ scaleY: reduced ? 1 : drawn }}
                className="pointer-events-none absolute left-[3px] top-3 bottom-3 w-px origin-top bg-primary glow-primary"
            />

            {steps.map((step, i) => (
                <motion.li
                    key={step.index}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.4, ease: EASE, delay: i * 0.04 }}
                    className="relative"
                >
                    {/* Node dot — centered on the rail. Rail center ≈ 3.5px from the
                        <ol> edge; the dot lives in the <li> (offset by pl-8/sm:pl-10)
                        and is 10px wide, so its left edge sits 33.5px / 41.5px back to
                        land the dot's center on the rail at both breakpoints. */}
                    <span
                        aria-hidden="true"
                        className="absolute -left-[33.5px] top-2 h-2.5 w-2.5 rounded-full bg-primary glow-primary sm:-left-[41.5px]"
                    />
                    <div className="flex items-baseline gap-3">
                        <span className="font-mono text-xs tabular-nums tracking-[0.3em] text-accent">
                            {step.index}
                        </span>
                        <h4 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {step.title}
                        </h4>
                    </div>
                    <p className="measure-narrow mt-3 text-base leading-relaxed text-muted-foreground">
                        {step.body}
                    </p>
                </motion.li>
            ))}
        </ol>
    );
}
