"use client";

import { useEffect, useRef, useState } from "react";
import {
    motion,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion";
import { resumeData, type Job } from "@/data/resume";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Returns whether the immersive horizontal-scroll experience should run. It is
 * gated behind a fine pointer (mouse) device that is NOT requesting reduced
 * motion, so touch + coarse-pointer + reduced-motion users get the calm,
 * static vertical timeline instead of a pinned horizontal scroll.
 *
 * Starts `false` so SSR/first paint matches the safe vertical fallback, then
 * upgrades to the horizontal experience on mount when appropriate.
 */
function useImmersive() {
    const prefersReducedMotion = useReducedMotion();
    const [finePointer, setFinePointer] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const query = window.matchMedia("(pointer: fine) and (hover: hover)");
        const update = () => setFinePointer(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    return finePointer && !prefersReducedMotion;
}

export default function ActExperience() {
    const targetRef = useRef<HTMLDivElement>(null);
    const immersive = useImmersive();
    const total = resumeData.experience.length;

    const { scrollYProgress } = useScroll({ target: targetRef });
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);
    const barWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    // Map scroll progress → active node index for the "NN / TT" counter.
    const [active, setActive] = useState(0);
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const next = Math.min(total - 1, Math.max(0, Math.round(latest * (total - 1))));
        setActive((prev) => (prev === next ? prev : next));
    });

    // Reduced-motion / touch / coarse-pointer: render a static, vertical
    // case-study list — no pin, no horizontal transform, opacity-only reveals.
    if (!immersive) {
        return (
            <section className="container-page py-24">
                <h2 className="sr-only">Experience</h2>
                <p className="mb-12 font-mono text-xs tracking-widest text-muted-foreground">
                    {format(1)} <span className="text-subtle-foreground">/ {format(total)} ROLES</span>
                </p>
                <ol className="relative flex flex-col gap-16 border-l border-border-subtle pl-8 sm:pl-10">
                    {resumeData.experience.map((job, index) => (
                        <motion.li
                            key={index}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.3, ease: EASE }}
                        >
                            <TimelineNode job={job} index={index} total={total} variant="vertical" />
                        </motion.li>
                    ))}
                </ol>
            </section>
        );
    }

    return (
        <section ref={targetRef} className="relative h-[300vh]">
            <h2 className="sr-only">Experience</h2>
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                {/* Progress + node counter: shows how many entries exist and where you are. */}
                <div className="container-page absolute inset-x-0 bottom-6 z-20 flex flex-col gap-3 lg:bottom-12">
                    <div className="flex items-center justify-between font-mono text-xs tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-2">
                            SCROLL TO EXPLORE <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span
                            className="tabular-nums"
                            aria-live="polite"
                            aria-label={`Role ${format(active + 1)} of ${format(total)}`}
                        >
                            <span className="text-foreground">{format(active + 1)}</span>
                            <span className="text-subtle-foreground"> / {format(total)}</span>
                        </span>
                    </div>
                    <div
                        className="h-[2px] w-full overflow-hidden rounded-full bg-border-subtle"
                        aria-hidden="true"
                    >
                        <motion.div
                            style={{ width: barWidth }}
                            className="h-full rounded-full bg-primary glow-primary"
                        />
                    </div>
                </div>

                <motion.div style={{ x }} className="relative flex gap-12 px-6 sm:px-12 md:gap-24 md:px-24">
                    {/* Continuous timeline line */}
                    <div className="absolute left-0 top-0 hidden h-[1px] w-full -translate-y-12 bg-border md:block" aria-hidden="true" />

                    {/* Intro spacer */}
                    <div className="w-0 shrink-0 md:w-[8vw]" />

                    {resumeData.experience.map((job, index) => (
                        <TimelineNode key={index} job={job} index={index} total={total} variant="horizontal" />
                    ))}

                    {/* Outro spacer — wide enough to fully reveal the last node at -70% */}
                    <div className="w-[24vw] shrink-0 md:w-[28vw]" />
                </motion.div>
            </div>
        </section>
    );
}

function format(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
}

function TimelineNode({
    job,
    index,
    total,
    variant,
}: {
    job: Job;
    index: number;
    total: number;
    variant: "horizontal" | "vertical";
}) {
    const numeral = format(index + 1);
    const isHorizontal = variant === "horizontal";

    return (
        <div
            className={
                isHorizontal
                    ? "relative flex w-[82vw] shrink-0 flex-col justify-start sm:w-[80vw] md:w-[60vw] lg:w-[44vw]"
                    : "relative flex flex-col justify-start"
            }
        >
            {/* Timeline dot */}
            <div
                className={
                    isHorizontal
                        ? "absolute left-0 top-0 hidden h-3 w-3 -translate-y-[calc(3rem+5px)] rounded-full bg-primary glow-primary md:block"
                        : "absolute left-0 top-1.5 h-3 w-3 -translate-x-[calc(2rem+6.5px)] rounded-full bg-primary glow-primary sm:-translate-x-[calc(2.5rem+6.5px)]"
                }
                aria-hidden="true"
            />

            {/* Readability scrim: keeps muted text ≥4.5:1 even over the bright orb core. */}
            <div className="rounded-xl bg-background/70 px-4 py-3 backdrop-blur-sm">
                {/* Role / period / company hierarchy — reads as a STAR case-study header */}
                <header className="mb-6 flex flex-col gap-2">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                        {job.period} <span className="text-subtle-foreground">· {numeral} / {format(total)}</span>
                    </span>
                    <h3 className="text-4xl font-bold leading-[1.05] tracking-tighter text-foreground text-glow">
                        {job.title}
                    </h3>
                    <p className="font-mono text-base text-muted-foreground">
                        <span className="text-subtle-foreground">@ </span>
                        {job.company}
                    </p>
                </header>

                <ul className="space-y-4 border-l border-border-subtle pl-6">
                    {job.description.map((desc, i) => (
                        <li
                            key={i}
                            className="measure-narrow text-base leading-relaxed text-muted-foreground"
                        >
                            {renderDecisionClause(desc)}
                        </li>
                    ))}
                </ul>
            </div>

            {job.companyUrl && (
                <a
                    href={job.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-sm tracking-wider text-foreground transition-[color,background-color,transform] duration-150 hover:bg-surface-elevated hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
                >
                    VIEW COMPANY <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
            )}

            {/* Faint watermark numeral — kept subtle behind the content */}
            <div
                className="pointer-events-none absolute -bottom-8 left-0 -z-10 select-none text-9xl font-bold leading-none text-input opacity-[0.08]"
                aria-hidden="true"
            >
                {numeral}
            </div>
        </div>
    );
}

/**
 * Renders a bullet as a clean "decision clause": the lead clause (text before
 * the first em-dash) is emphasized, the rationale after it stays muted. Falls
 * back to plain text when no em-dash is present.
 */
function renderDecisionClause(text: string) {
    const splitAt = text.indexOf("—");
    if (splitAt === -1) return text;

    const lead = text.slice(0, splitAt).trimEnd();
    const rest = text.slice(splitAt + 1).trimStart();

    return (
        <>
            <span className="text-foreground">{lead}</span>
            <span className="text-subtle-foreground"> — </span>
            {rest}
        </>
    );
}
