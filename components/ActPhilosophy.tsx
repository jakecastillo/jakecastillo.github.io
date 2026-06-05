"use client";

import { motion } from "framer-motion";
import { resumeData } from "@/data/resume";
import ProcessSpine, { type ProcessStep } from "@/components/ProcessSpine";
import ArchitectureSchematic from "@/components/ArchitectureSchematic";

const EASE = [0.16, 1, 0.3, 1] as const;

const reveal = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.4, ease: EASE },
} as const;

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
    return (
        <section className="section-y container-page">
            {/* Belief */}
            <motion.div
                {...reveal}
                className="panel flex flex-col p-8 sm:p-12 lg:p-16"
            >
                <p className="mb-5 font-mono text-xs uppercase tracking-[0.35em] text-primary">
                    02 / approach
                </p>
                <h2 className="text-6xl font-black leading-[1.05] tracking-tight text-foreground [overflow-wrap:anywhere]">
                    ENGINEER THE
                    <br />
                    <span className="text-primary text-glow">
                        SYSTEMS WE RELY ON.
                    </span>
                </h2>
                <div className="mt-8 mb-7 h-px w-12 bg-border-strong" />
                <p className="measure text-lg leading-relaxed text-muted-foreground">
                    {resumeData.summary}
                </p>
            </motion.div>

            {/* How I Build */}
            <div className="mt-20 sm:mt-28">
                <motion.header {...reveal} className="mb-10 sm:mb-14">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                        How I Build
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Build Where the Risk Lives
                        <span className="text-primary">.</span>
                    </p>
                </motion.header>

                <ProcessSpine steps={processSteps} />

                <motion.div {...reveal} className="mt-16 sm:mt-20">
                    <ArchitectureSchematic />
                </motion.div>
            </div>
        </section>
    );
}
