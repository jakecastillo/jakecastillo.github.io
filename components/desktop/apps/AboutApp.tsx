"use client";

import { resumeData } from "@/data/resume";

const PILLARS = [
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

export default function AboutApp() {
    return (
        <div className="p-6 font-mono text-sm text-foreground space-y-6">
            <header>
                <div className="text-[10px] tracking-[0.3em] text-accent mb-1">{`// IDENTITY`}</div>
                <h2 className="text-2xl font-black tracking-tight">{resumeData.name}</h2>
                <p className="text-muted-foreground">DevSecOps Engineer · {resumeData.location}</p>
            </header>

            <section>
                <div className="text-[10px] tracking-[0.3em] text-primary mb-2">{`// PHILOSOPHY`}</div>
                <p className="text-foreground leading-relaxed">
                    Engineering <span className="text-accent">resilient systems</span>. {resumeData.summary}
                </p>
            </section>

            <section>
                <div className="text-[10px] tracking-[0.3em] text-accent mb-3">{`// PILLARS`}</div>
                <ul className="space-y-3">
                    {PILLARS.map((p) => (
                        <li
                            key={p.title}
                            className="border-l-2 border-primary/40 pl-4 hover:border-accent transition-colors"
                        >
                            <h3 className="font-bold text-foreground">{p.title}</h3>
                            <p className="text-muted-foreground text-xs leading-relaxed mt-1">{p.body}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
