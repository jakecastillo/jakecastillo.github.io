"use client";

import { useEffect, useRef, useState } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion";
import { resumeData } from "@/data/resume";

const pillars = [
    {
        title: "Secure Cloud Architecture",
        body: "Architecting self-healing AWS platforms with least-privilege IAM, encryption, and compliance guardrails embedded as code from day one.",
    },
    {
        title: "Shift-Left Security",
        body: "Baking SAST, dependency scanning, and policy-as-code into CI/CD so vulnerabilities surface in the pipeline — never in production.",
    },
    {
        title: "Resilient Data Integrity",
        body: "Enforcing type safety, encryption-at-rest, and schema constraints so cloud services stay trustworthy under load and under attack.",
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
                DevSecOps Philosophy
            </p>
            <h2 className="text-6xl font-black leading-[1.05] tracking-tight text-foreground [overflow-wrap:anywhere]">
                ENGINEERING RESILIENT
                <br />
                <span className="text-primary text-glow">CLOUD SYSTEMS.</span>
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
                Security by Design
            </h3>
            <div className="border-l border-border-strong pl-8">
                <ul className="space-y-10">
                    {pillars.map((pillar) => (
                        <li key={pillar.title}>
                            <h4 className="text-3xl font-bold leading-snug text-foreground">
                                {pillar.title}.
                            </h4>
                            <p className="measure-narrow mt-2 text-base leading-relaxed text-muted-foreground">
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
                The Outcome
            </p>
            <h2 className="text-8xl font-black leading-[0.95] tracking-tight text-foreground text-glow [overflow-wrap:anywhere]">
                PRECISION.
            </h2>
            <p className="measure mt-8 text-xl leading-relaxed text-muted-foreground">
                I embed security across the development lifecycle — shipping
                cloud infrastructure that moves fast, stays type-safe and
                observable, and holds up against real-world threats in
                production.
            </p>
        </div>
    );
}

export default function ActPhilosophy() {
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Detect touch / coarse-pointer / narrow viewports. On phones the horizontal
    // pin reads as scroll-jacking, so we fall back to the static vertical stack.
    // Starts false to keep SSR/client markup in sync; resolves after mount.
    const [isCompact, setIsCompact] = useState(false);
    useEffect(() => {
        const evaluate = () =>
            setIsCompact(
                window.matchMedia("(pointer: coarse)").matches ||
                    window.innerWidth < 768,
            );
        evaluate();
        window.addEventListener("resize", evaluate);
        return () => window.removeEventListener("resize", evaluate);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Drive horizontal travel only through the middle of the pin so the first
    // and last slides each get a full beat fully on-screen. The track is three
    // 70vw slides + gaps; ending at -66% leaves the final slide flush-right
    // (fully visible) rather than clipping it as the old -50% range did.
    const x = useTransform(scrollYProgress, [0.12, 0.92], ["0%", "-66%"]);

    // Scroll affordance (normal-motion only — the early return below covers
    // reduced-motion/touch). A thin progress rail tracks how far through the
    // pin we are; the "scroll" hint fades out once travel begins so it never
    // lingers over the final slide.
    const progressScaleX = useTransform(scrollYProgress, [0.12, 0.92], [0, 1]);
    const hintOpacity = useTransform(scrollYProgress, [0, 0.1, 0.22], [1, 1, 0]);

    // Reduced motion OR touch/coarse/narrow: a static vertical stack,
    // opacity-only reveals, no horizontal pin (no scroll-jacking on phones).
    if (prefersReducedMotion || isCompact) {
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

                {/* Scroll affordance — hints that horizontal content exists.
                    Decorative only; gated to normal-motion users by the early
                    return above. */}
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
