"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { resumeData, type Job } from "@/data/resume";
import { ArrowRight } from "lucide-react";

export default function ActExperience() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);

    return (
        <section ref={targetRef} className="relative h-[300vh]">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden bg-background">
                <div className="absolute lg:bottom-12 lg:left-12 bottom-6 left-6 z-20 text-muted-foreground font-mono text-xs tracking-widest flex items-center gap-2">
                    SCROLL TO EXPLORE <ArrowRight className="w-4 h-4" />
                </div>

                <motion.div style={{ x }} className="flex gap-12 md:gap-24 px-12 md:px-24 relative">
                    {/* Continuous Timeline Line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-border -translate-y-12 hidden md:block" />

                    {/* Intro spacer */}
                    <div className="w-0 md:w-[8vw] shrink-0" />

                    {resumeData.experience.map((job, index) => (
                        <TimelineNode key={index} job={job} index={index} />
                    ))}

                    {/* Outro spacer */}
                    <div className="w-[16vw] md:w-[20vw] shrink-0" />
                </motion.div>
            </div>
        </section>
    );
}

function TimelineNode({ job, index }: { job: Job; index: number }) {
    return (
        <div className="flex flex-col justify-start relative w-[80vw] md:w-[60vw] lg:w-[40vw] shrink-0">
            {/* Timeline Dot Visual */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full -translate-y-[calc(3rem+5px)] hidden md:block" />


            <div className="mb-6">
                <span className="font-mono text-sm text-primary tracking-widest mb-2 block">{job.period}</span>
                <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-2 leading-tight">{job.title}</h3>
                <h4 className="text-xl font-mono text-muted-foreground">{job.company}</h4>
            </div>

            <ul className="space-y-4 mb-8 border-l-2 border-border/50 pl-6">
                {job.description.map((desc, i) => (
                    <li key={i} className="text-base md:text-lg text-muted-foreground leading-relaxed">
                        {desc}
                    </li>
                ))}
            </ul>

            {job.companyUrl && (
                <a
                    href={job.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-mono tracking-wider text-foreground hover:text-primary transition-colors border border-border px-4 py-2 rounded-full w-fit hover:bg-surface-elevated"
                >
                    [ VIEW COMPANY ] <ArrowRight className="w-3 h-3" />
                </a>
            )}

            <div className="absolute -bottom-12 left-0 text-[10rem] font-bold text-input opacity-10 select-none pointer-events-none -z-10">
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
            </div>
        </div>
    );
}
