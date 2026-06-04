"use client";

import { resumeData } from "@/data/resume";
import { BRAND } from "@/components/desktop/config/brand";
import AppCanvas from "@/components/desktop/AppCanvas";
import Avatar from "@/components/Avatar";

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

const STATS = [
    "UH Manoa · BS Computer Engineering 2020",
    "AWS Certified Solutions Architect – Associate",
    "Honolulu, HI",
];

export default function AboutApp() {
    return (
        <AppCanvas wide>
            <div className="font-mono text-sm text-foreground grid grid-cols-1 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] gap-8">
                {/* LEFT — VOID ID card */}
                <aside className="border border-border rounded-lg bg-[#0a0a18] p-5 flex flex-col items-center text-center md:items-start md:text-left h-fit">
                    <div className="font-display text-[10px] tracking-[0.3em] text-accent mb-4 self-stretch">{`// ID CARD`}</div>

                    <div
                        className="rounded-full p-[3px] bg-gradient-to-br from-primary to-accent shadow-[0_0_24px_-4px_rgba(139,92,246,0.6)]"
                    >
                        <div className="rounded-full overflow-hidden ring-1 ring-accent/40 bg-[#0a0a18]">
                            <Avatar size={160} className="block h-40 w-40 rounded-full" />
                        </div>
                    </div>

                    <h2 className="font-display text-xl font-black tracking-tight mt-4">{BRAND.name}</h2>
                    <p className="text-primary text-xs mt-0.5">{BRAND.role}</p>
                    <p className="text-muted-foreground text-xs">{BRAND.location}</p>

                    <div className="mt-3 flex items-start gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 self-center md:self-stretch">
                        <span className="relative mt-[3px] flex h-2 w-2 shrink-0" aria-hidden="true">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_1px_rgba(34,211,238,0.8)]" />
                        </span>
                        <span className="text-[10px] leading-snug tracking-[0.1em] text-accent text-left">
                            {BRAND.availability}
                        </span>
                    </div>

                    <ul className="mt-5 w-full space-y-2 border-t border-border pt-4 text-left">
                        {STATS.map((stat) => (
                            <li
                                key={stat}
                                className="text-[11px] leading-snug text-muted-foreground border-l-2 border-primary/40 pl-3"
                            >
                                {stat}
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* RIGHT — philosophy + pillars */}
                <div className="space-y-6 min-w-0">
                    <header>
                        <div className="text-[10px] tracking-[0.3em] text-accent mb-1">{`// IDENTITY`}</div>
                        <h2 className="font-display text-2xl font-black tracking-tight">{BRAND.name}</h2>
                        <p className="text-muted-foreground">{`${BRAND.role} · ${BRAND.location}`}</p>
                    </header>

                    {/* SIGNATURE — the ownable POV line, highlighted near identity */}
                    <div className="border-l-2 border-accent pl-4">
                        <p className="font-display text-lg sm:text-xl font-bold leading-tight tracking-tight text-foreground">
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                “{BRAND.signature}”
                            </span>
                        </p>
                        <p className="text-muted-foreground text-xs leading-relaxed mt-2">
                            Secure-by-default ships faster because the cost of a vulnerability is lowest before
                            you write it. When I bake authn, least-privilege, and input validation into the
                            scaffold, they stop being a <span className="text-accent">pre-launch fire drill</span> —
                            so I&apos;m not rewriting half the feature the week before release. Guardrails, not
                            gates: they remove the late-stage <span className="text-primary">rework</span> that
                            actually slows teams down.
                        </p>
                    </div>

                    <section>
                        <div className="font-display text-[10px] tracking-[0.3em] text-primary mb-2">{`// OPERATING_PRINCIPLE`}</div>
                        <p className="text-foreground leading-relaxed">
                            Engineering <span className="text-accent">resilient systems</span>. {resumeData.summary}
                        </p>
                    </section>

                    <section>
                        <div className="font-display text-[10px] tracking-[0.3em] text-accent mb-2">{`// WHY_SECURITY`}</div>
                        <p className="text-foreground leading-relaxed">
                            I got into security because the best teams ship fast{" "}
                            <span className="text-accent">without</span> shipping vulnerabilities. I&apos;d rather
                            build the guardrails that let people move quickly than be the gate that slows them down —
                            security as an <span className="text-primary">enabler</span>, not a checkpoint.
                        </p>
                    </section>

                    <section>
                        <div className="font-display text-[10px] tracking-[0.3em] text-accent mb-3">{`// THREAT_MODEL`}</div>
                        <ul className="space-y-3">
                            {PILLARS.map((p) => (
                                <li
                                    key={p.title}
                                    className="border-l-2 border-primary/40 pl-4 hover:border-accent transition-colors"
                                >
                                    <h3 className="font-display font-bold text-foreground">{p.title}</h3>
                                    <p className="text-muted-foreground text-xs leading-relaxed mt-1">{p.body}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </AppCanvas>
    );
}
