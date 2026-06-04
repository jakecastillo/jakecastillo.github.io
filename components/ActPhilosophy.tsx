"use client";

import { useRef } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion";
import { resumeData } from "@/data/resume";

const pillars = [
    {
        title: "Infrastructure Design",
        body: "Designing resilient, microservice-first platforms that modernize legacy stacks and scale cleanly with growth.",
    },
    {
        title: "Cloud Orchestration",
        body: "Architecting self-healing AWS infrastructure with security and compliance embedded as code from day one.",
    },
    {
        title: "Data Integrity",
        body: "Enforcing type safety and consistency across complex schemas with modern ORMs, constraints, and SQL strategy.",
    },
];

const reveal = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

// Slide 1 — the core belief.
function SlideBelief() {
    return (
        <div className="flex flex-col justify-center">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-primary">
                Philosophy
            </p>
            <h2 className="text-5xl font-black tracking-tighter text-foreground">
                ENGINEERING
                <br />
                <span className="text-primary text-glow">RESILIENT SYSTEMS.</span>
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
                Systems Thinking
            </h3>
            <div className="border-l border-border-strong pl-8">
                <ul className="space-y-10">
                    {pillars.map((pillar) => (
                        <li key={pillar.title}>
                            <h4 className="text-3xl font-bold text-foreground">
                                {pillar.title}.
                            </h4>
                            <p className="measure mt-2 text-base leading-relaxed text-muted-foreground">
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
                The Result
            </p>
            <h2 className="text-8xl font-black tracking-tighter text-foreground text-glow">
                PRECISION.
            </h2>
            <p className="measure mt-8 text-xl leading-relaxed text-muted-foreground">
                Security embedded into the development lifecycle — type-safe,
                observable, and built to hold up in production.
            </p>
        </div>
    );
}

export default function ActPhilosophy() {
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Drive horizontal travel only through the middle of the pin so the first
    // and last slides each get a full beat fully on-screen. The track is three
    // 70vw slides + gaps; ending at -66% leaves the final slide flush-right
    // (fully visible) rather than clipping it as the old -50% range did.
    const x = useTransform(scrollYProgress, [0.12, 0.92], ["0%", "-66%"]);

    // Reduced motion: a static vertical stack, opacity-only reveals, no pin.
    if (prefersReducedMotion) {
        return (
            <section className="container-page py-24">
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
        <section ref={containerRef} className="relative h-[300vh]">
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
            </div>
        </section>
    );
}
