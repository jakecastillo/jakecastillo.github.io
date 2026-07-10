"use client";

import { motion, type Variants } from "framer-motion";
import { resumeData } from "@/data/resume";
import ProcessSpine, { type ProcessStep } from "@/components/ProcessSpine";
import ArchitectureSchematic from "@/components/ArchitectureSchematic";
import EtchHeading from "@/components/beam/EtchHeading";
import ManifestoReveal from "@/components/beam/ManifestoReveal";
import { useReveal } from "@/hooks/useReveal";

const EASE = [0.16, 1, 0.3, 1] as const;

// Cheap opacity/y reveal; the arrival-snap + re-fire wiring lives in useReveal.
// (ManifestoReveal below is a separate GSAP scrubbed system that reverses on its
// own — the outer fade here is independent of it.)
const reveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

// "Build Where the Risk Lives" — general software-solutions + innovator process.
// Owner-approved copy; the ONLY copy change in this pass.
const processSteps: ProcessStep[] = [
    {
        index: "01",
        title: "Find the Constraints",
        body: "I separate the real constraints from the assumptions everyone's stopped questioning, and pressure-test the outcome before any code exists. I'd rather kill a weak idea in a week than build the wrong thing fluently.",
    },
    {
        index: "02",
        title: "Bet Where It Counts",
        body: "I pour design into the few decisions that are expensive to reverse and stay deliberately boring everywhere else — proven tools for the plumbing, so the real risk and invention land where they create value.",
    },
    {
        index: "03",
        title: "Prove the Unknown",
        body: "I build the scariest piece first — the unproven integration, the AI behavior, the assumption it all rests on — and put it in real hands while it's still cheap to be wrong.",
    },
    {
        index: "04",
        title: "Build to Be Changed",
        body: "Security, observability, and an honest record of why each call was made are part of the design, not a cleanup pass — I build for whoever inherits it a year from now, not for how clever it looks today.",
    },
];

export default function ActPhilosophy() {
    const belief = useReveal<HTMLDivElement>();
    const buildHeader = useReveal<HTMLElement>();
    const schematic = useReveal<HTMLDivElement>();
    return (
        <section className="section-y container-page">
            {/* Belief */}
            <motion.div
                variants={reveal}
                {...belief}
                className="panel flex flex-col p-8 sm:p-12 lg:p-16"
            >
                <p className="mb-5 font-mono text-xs uppercase tracking-[0.35em] text-primary">
                    02 / approach
                </p>
                <ManifestoReveal className="text-6xl font-black leading-[1.05] tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-7xl lg:text-8xl">
                    ENGINEER THE
                    <br />
                    <span className="text-primary text-glow">
                        SYSTEMS WE RELY ON.
                    </span>
                </ManifestoReveal>
                <div className="mt-8 mb-7 h-px w-12 bg-border-strong" />
                <p className="measure text-lg leading-relaxed text-muted-foreground">
                    {resumeData.summary}
                </p>
            </motion.div>

            {/* How I Build */}
            <div className="mt-20 sm:mt-28">
                <motion.header
                    variants={reveal}
                    {...buildHeader}
                    className="mb-10 sm:mb-14"
                >
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                        How I Build
                    </p>
                    <EtchHeading
                        as="p"
                        className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                    >
                        Build Where the Risk Lives
                        <span className="text-primary">.</span>
                    </EtchHeading>
                </motion.header>

                <ProcessSpine steps={processSteps} />

                <motion.div
                    variants={reveal}
                    {...schematic}
                    className="mt-16 sm:mt-20"
                >
                    <ArchitectureSchematic />
                </motion.div>
            </div>
        </section>
    );
}
