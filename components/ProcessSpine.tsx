"use client";

import { useCallback, useRef } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
    type MotionValue,
} from "framer-motion";

export type ProcessStep = { index: string; title: string; body: string };

/**
 * One process node. Extracted so the per-node ignition `useTransform` is a
 * single hook per component — no rules-of-hooks violation in a `.map` loop.
 * The dot lights (0.25 → 1 opacity) as the drawn rail reaches its fraction.
 *
 * ONE clock (jc-a7l): the step card's opacity derives from the SAME `drawn`
 * MotionValue as its dot — cause (rail) and effect (text) can no longer
 * decouple at fast scroll the way the old whileInView fade did. Both readers
 * share the once-lit latch, so neither un-happens on scroll-back. Scroll-
 * derived state is also inherently deep-link/arrival correct (jc-sj2): a
 * restored scroll position lands with `drawn` already resolved.
 */
function SpineNode({
    step,
    i,
    count,
    drawn,
    reduced,
}: {
    step: ProcessStep;
    i: number;
    count: number;
    drawn: MotionValue<number>;
    reduced: boolean;
}) {
    // Once-lit latch (beam memory): the dot ignites as the drawn rail reaches
    // its fraction and STAYS lit when the rail retreats on scroll-back — the
    // story doesn't un-happen. `lit` only ever ratchets forward.
    const lit = useRef(0);
    const mapOpacity = useCallback(
        (v: number) => {
            lit.current = Math.max(lit.current, v);
            const start = i / count;
            const span = 0.5 / count;
            const t = Math.min(Math.max((lit.current - start) / span, 0), 1);
            return 0.25 + 0.75 * t;
        },
        [i, count],
    );
    const nodeOpacity = useTransform(drawn, mapOpacity);
    // Step text rides the identical latched rail value over a slightly longer
    // span — useTransform(drawn, [i/count, (i+0.7)/count], [0,1]) with memory.
    const mapItemOpacity = useCallback(
        (v: number) => {
            lit.current = Math.max(lit.current, v);
            const start = i / count;
            const span = 0.7 / count;
            return Math.min(Math.max((lit.current - start) / span, 0), 1);
        },
        [i, count],
    );
    const itemOpacity = useTransform(drawn, mapItemOpacity);

    return (
        <motion.li
            style={{ opacity: reduced ? 1 : itemOpacity }}
            className="relative"
        >
            {/* Node dot — centered on the rail. Rail center ≈ 3.5px from the
                <ol> edge; the dot lives in the <li> (offset by pl-8/sm:pl-10)
                and is 10px wide, so its left edge sits 33.5px / 41.5px back to
                land the dot's center on the rail at both breakpoints. Ignites
                as the drawn rail passes it. */}
            <motion.span
                aria-hidden="true"
                initial={false}
                style={{ opacity: reduced ? 1 : nodeOpacity }}
                className="absolute -left-[33.5px] top-[34px] h-2.5 w-2.5 rounded-full bg-primary glow-primary sm:-left-[41.5px] sm:top-9"
            />
            {/* Readability scrim (jc-l14): the step copy scrolls straight across
                the viewport-fixed holo, so it carries the same bg-surface/80 +
                backdrop-blur panel the timeline cards use — the holo yields to
                text locally while staying vivid outside the card. Pure CSS, so
                the reduced-motion static frame is equally protected. */}
            <div className="rounded-xl border border-border-subtle bg-surface/80 p-6 backdrop-blur-sm">
                <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums tracking-[0.3em] text-muted-foreground">
                        {step.index}
                    </span>
                    <h4 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {step.title}
                    </h4>
                </div>
                <p className="measure-narrow mt-3 text-base leading-relaxed text-muted-foreground">
                    {step.body}
                </p>
            </div>
        </motion.li>
    );
}

export default function ProcessSpine({ steps }: { steps: ProcessStep[] }) {
    const ref = useRef<HTMLOListElement>(null);
    const reduced = useReducedMotion();

    // Connector draws top→bottom as the list passes through the reading zone.
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 80%", "end 65%"],
    });
    const drawn = useTransform(scrollYProgress, [0, 1], [0, 1]);
    // Hot head rides the drawn rail's tip (framer interpolates the calc strings).
    const headTop = useTransform(
        drawn,
        [0, 1],
        ["0.75rem", "calc(100% - 0.75rem)"],
    );

    const count = steps.length;

    return (
        <ol
            ref={ref}
            // Beam anchor: useBeamAnchors measures this list's rect — the
            // ribbon's arrival keyframe lands on the rail's top node.
            data-beam-anchor="spine"
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
            {/* Hot head — the beam's leading node riding the rail tip. Gated on
                !reduced: under reduced motion it must not appear. (Removal fires
                as a post-mount re-render once useReducedMotion resolves, so the
                head is reliably gone — an opacity gate here is left stuck at the
                SSR value by the section's pre-existing hydration mismatch.) */}
            {!reduced && (
                <motion.span
                    aria-hidden="true"
                    style={{ top: headTop }}
                    className="pointer-events-none absolute left-[3px] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_14px_3px_rgba(45,212,191,0.55)]"
                />
            )}

            {steps.map((step, i) => (
                <SpineNode
                    key={step.index}
                    step={step}
                    i={i}
                    count={count}
                    drawn={drawn}
                    reduced={!!reduced}
                />
            ))}
        </ol>
    );
}
