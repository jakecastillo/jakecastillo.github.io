"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion";
import { resumeData } from "@/data/resume";

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

const pillars = [
    {
        title: "Legacy Modernization",
        body: "Migrating brittle AS400 and AngularJS systems to modern React, NestJS, and AWS — without losing the business logic a decade of users depend on.",
    },
    {
        title: "End-to-End Solutions",
        body: "Owning solutions end to end — from React, Vue, and Angular front-ends to NestJS and Express services — as developer, tech lead, and architect.",
    },
    {
        title: "Cloud & DevOps",
        body: "Deploying and operating on AWS — managing releases, retiring end-of-life tech, and streamlining maintenance so systems stay reliable in production.",
    },
];

const reveal = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
};

// Slide 1 — the core belief.
function SlideBelief() {
    return (
        <div className="flex flex-col justify-center">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                02 / approach
            </p>
            <h2 className="text-6xl font-black leading-[1.05] tracking-tight text-foreground [overflow-wrap:anywhere]">
                MODERNIZING THE
                <br />
                <span className="text-primary text-glow">SYSTEMS WE RELY ON.</span>
            </h2>
            <p className="measure mt-8 text-xl leading-relaxed text-muted-foreground">
                {resumeData.summary}
            </p>
        </div>
    );
}

// Slide 2 — the process.
function SlideProcess() {
    return (
        <div className="flex flex-col justify-center">
            <h3 className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                How I Build
            </h3>
            <div className="border-l border-border-strong pl-8">
                <ul className="space-y-12">
                    {pillars.map((pillar) => (
                        <li key={pillar.title}>
                            <h4 className="text-3xl font-bold leading-snug tracking-tight text-foreground">
                                {pillar.title}.
                            </h4>
                            <p className="measure-narrow mt-3 text-base leading-relaxed text-muted-foreground">
                                {pillar.body}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// Slide 3 — the result.
function SlideResult() {
    return (
        <div className="flex flex-col justify-center">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                the result
            </p>
            <h2 className="text-8xl font-black leading-[0.95] tracking-tight text-foreground text-glow [overflow-wrap:anywhere]">
                SHIPPED.
            </h2>
            <p className="measure mt-8 text-xl leading-relaxed text-muted-foreground">
                I modernize the systems people rely on — shipping software
                that&rsquo;s fast, maintainable, and built to last in
                production, from public-sector platforms to healthcare and
                pandemic-response tools.
            </p>
        </div>
    );
}

/**
 * Whether the pinned horizontal experience should run. Gated behind a non-touch,
 * non-narrow viewport that is NOT requesting reduced motion (the horizontal pin
 * reads as scroll-jacking on phones). Starts false so SSR matches the safe
 * vertical fallback, then upgrades before paint on mount.
 */
function useImmersive() {
    const prefersReducedMotion = useReducedMotion();
    const [wideFinePointer, setWideFinePointer] = useState(false);

    useIsoLayoutEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const evaluate = () =>
            setWideFinePointer(
                !window.matchMedia("(pointer: coarse)").matches &&
                    window.innerWidth >= 768,
            );
        evaluate();
        window.addEventListener("resize", evaluate);
        return () => window.removeEventListener("resize", evaluate);
    }, []);

    return wideFinePointer && !prefersReducedMotion;
}

export default function ActPhilosophy() {
    const immersive = useImmersive();
    // useScroll lives ONLY inside <PhilosophyImmersive/>, so it never runs while
    // its target ref is unmounted (framer's "ref not hydrated" error).
    return immersive ? <PhilosophyImmersive /> : <PhilosophyStatic />;
}

// Reduced motion / touch / narrow: a static vertical stack, opacity-only
// reveals, no horizontal pin and no useScroll.
function PhilosophyStatic() {
    return (
        <section className="section-y container-page">
            <div className="flex flex-col gap-24">
                <motion.div {...reveal}>
                    <SlideBelief />
                </motion.div>
                <motion.div {...reveal}>
                    <SlideProcess />
                </motion.div>
                <motion.div {...reveal}>
                    <SlideResult />
                </motion.div>
            </div>
        </section>
    );
}

// Fine-pointer + normal-motion: the pinned horizontal scroll. Always renders its
// ref'd <section>, so useScroll has a hydrated target.
function PhilosophyImmersive() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Drive horizontal travel only through the middle of the pin so the first
    // and last slides each get a full beat fully on-screen.
    const x = useTransform(scrollYProgress, [0.12, 0.92], ["0%", "-66%"]);
    const progressScaleX = useTransform(scrollYProgress, [0.12, 0.92], [0, 1]);
    const hintOpacity = useTransform(scrollYProgress, [0, 0.1, 0.22], [1, 1, 0]);

    return (
        <section ref={containerRef} className="section-y relative h-[300vh]">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                <motion.div
                    style={{ x }}
                    className="container-page flex gap-16 sm:gap-24"
                >
                    <div className="flex min-h-[60vh] w-[88vw] flex-shrink-0 sm:w-[70vw]">
                        <SlideBelief />
                    </div>
                    <div className="flex min-h-[60vh] w-[88vw] flex-shrink-0 sm:w-[70vw]">
                        <SlideProcess />
                    </div>
                    <div className="flex min-h-[60vh] w-[88vw] flex-shrink-0 sm:w-[70vw]">
                        <SlideResult />
                    </div>
                </motion.div>

                {/* Scroll affordance — hints that horizontal content exists. */}
                <motion.div
                    aria-hidden="true"
                    style={{ opacity: hintOpacity }}
                    className="container-page pointer-events-none absolute bottom-8 left-0 right-0 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-subtle-foreground"
                >
                    Scroll
                    <span aria-hidden="true">&rarr;</span>
                </motion.div>

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-border"
                >
                    <motion.div
                        style={{ scaleX: progressScaleX }}
                        className="h-full origin-left bg-primary"
                    />
                </div>
            </div>
        </section>
    );
}
