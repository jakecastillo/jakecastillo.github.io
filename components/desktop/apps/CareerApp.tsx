"use client";

import { resumeData } from "@/data/resume";
import { ArrowUpRight } from "lucide-react";

export default function CareerApp() {
    return (
        <div className="p-6 font-mono text-sm space-y-4">
            <header>
                <div className="text-[10px] tracking-[0.3em] text-accent mb-1">{`// CAREER LOG`}</div>
                <h2 className="text-xl font-black tracking-tight text-foreground">
                    Experience
                </h2>
            </header>

            <ol className="space-y-3">
                {resumeData.experience.map((job, i) => (
                    <li
                        key={i}
                        className="p-4 rounded-md border border-border/40 bg-background/50 hover:border-accent/40 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-[10px] tracking-[0.25em] text-primary mb-1">{job.period}</div>
                                <h3 className="text-base font-bold text-foreground">{job.title}</h3>
                                <p className="text-muted-foreground text-xs">{job.company}</p>
                            </div>
                            {job.companyUrl && (
                                <a
                                    href={job.companyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-accent transition-colors"
                                    aria-label={`Visit ${job.company}`}
                                >
                                    <ArrowUpRight size={14} />
                                </a>
                            )}
                        </div>
                        <ul className="mt-3 space-y-2 border-l-2 border-border/40 pl-3">
                            {job.description.map((d, j) => (
                                <li key={j} className="text-xs text-muted-foreground leading-relaxed">
                                    {d}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ol>
        </div>
    );
}
