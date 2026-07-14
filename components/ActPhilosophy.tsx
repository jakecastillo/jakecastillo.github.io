"use client";

import { motion, type Variants } from "framer-motion";
import { ScanSearch, Target, FlaskConical, RefreshCw } from "lucide-react";
import { resumeData } from "@/data/resume";
import ProcessSpine, { type ProcessStep } from "@/components/ProcessSpine";
import SolutionColumn from "@/components/SolutionColumn";
import EtchHeading from "@/components/beam/EtchHeading";
import ManifestoReveal from "@/components/beam/ManifestoReveal";
import { DUR, EASE } from "@/components/motion";
import { useReveal } from "@/hooks/useReveal";

// Cheap opacity/y reveal; the arrival-snap + re-fire wiring lives in useReveal.
// (ManifestoReveal below is a separate GSAP scrubbed system that reverses on its
// own — the outer fade here is independent of it.)
const reveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
};

// "Build Where the Risk Lives" — general software-solutions + innovator process.
// Owner-approved copy; the ONLY copy change in this pass.
const processSteps: ProcessStep[] = [
    {
        index: "01",
        title: "Find the Constraints",
        icon: ScanSearch,
        body: "I separate the real constraints from the assumptions everyone's stopped questioning, and pressure-test the outcome before any code exists. I'd rather kill a weak idea in a week than build the wrong thing fluently.",
    },
    {
        index: "02",
        title: "Bet Where It Counts",
        icon: Target,
        body: "I pour design into the few decisions that are expensive to reverse and stay deliberately boring everywhere else — proven tools for the plumbing, so the real risk and invention land where they create value.",
    },
    {
        index: "03",
        title: "Prove the Unknown",
        icon: FlaskConical,
        body: "I build the scariest piece first — the unproven integration, the AI behavior, the assumption it all rests on — and put it in real hands while it's still cheap to be wrong.",
    },
    {
        index: "04",
        title: "Build to Be Changed",
        icon: RefreshCw,
        body: "Security, observability, and an honest record of why each call was made are part of the design, not a cleanup pass — I build for whoever inherits it a year from now, not for how clever it looks today.",
    },
];

export default function ActPhilosophy() {
    const belief = useReveal<HTMLDivElement>();
    const schematic = useReveal<HTMLDivElement>();
    return (
        <section className="section-y container-page">
            {/* Belief — UNBOXED (jc-a7l): the manifesto runs full-bleed as
                typography-as-layout, no containing panel. A feathered
                background-token veil (the jc-l14 text-over-holo pattern) dims
                the holo locally behind the statement so the ember state keeps
                its >=3:1 floor; only the summary paragraph sits on a scrim. */}
            <motion.div variants={reveal} {...belief} className="relative">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 rounded-[var(--radius-panel)] sm:-inset-x-14"
                    style={{
                        background:
                            "color-mix(in srgb, var(--background) 92%, transparent)",
                        filter: "blur(28px)",
                    }}
                />
                {/* ONE eyebrow spec (jc-nc1); the act number lives on the stage
                    rail alone — no doubled "02". */}
                <p className="mb-5 text-xs label-accent">
                    approach
                </p>
                <ManifestoReveal className="type-display text-7xl text-foreground sm:text-8xl">
                    BORING WHERE IT SHOULD BE.
                    <br />
                    <span className="text-primary text-glow">
                        BOLD WHERE IT COUNTS.
                    </span>
                </ManifestoReveal>
                <div className="mt-8 mb-7 h-px w-12 bg-border-strong" />
                <p className="measure rounded-xl border border-border-subtle bg-surface/80 p-6 text-lg leading-relaxed text-muted-foreground backdrop-blur-sm">
                    {resumeData.summary}
                </p>
            </motion.div>

            {/* How I Build — two-lane recomposition (jc-5gg). The heading and
                process spine claim the LEFT lane, capped at ~40rem so the cards
                read as a composed column instead of full-container rows with
                50-60% dead interior. The right lane is deliberately held open:
                the act's WebGL orb drifts into it through Philosophy, and the
                beam/spine language threads that space — composed, not empty. */}
            <div className="mt-20 sm:mt-28">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,40rem)_1fr] lg:gap-x-16">
                    <div className="min-w-0">
                        <EtchHeading
                            as="p"
                            className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                            eyebrow="How I Build"
                            eyebrowClassName="text-xs label-accent"
                            wrapperClassName="mb-10 sm:mb-14"
                        >
                            Build Where the Risk Lives
                            <span className="text-primary">.</span>
                        </EtchHeading>

                        <ProcessSpine steps={processSteps} />
                    </div>
                    {/* right lane: held open for the drifting orb (owned elsewhere) */}
                </div>

                <motion.div
                    variants={reveal}
                    {...schematic}
                    className="mt-16 sm:mt-20"
                >
                    <SolutionColumn />
                </motion.div>
            </div>
        </section>
    );
}
