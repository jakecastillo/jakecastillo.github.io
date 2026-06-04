"use client";

import { ArrowRight, Download } from "lucide-react";
import { useDesktopStore } from "@/store/useDesktopStore";
import { BRAND } from "@/components/desktop/config/brand";
import { projects } from "@/data/projects";
import AppCanvas from "@/components/desktop/AppCanvas";

/**
 * Pull the headline figure for a given project straight from data/projects.ts so
 * the manifest can never drift from the source of truth. Returns the outcome
 * whose value reads as the strongest quantified proof (explicit override per
 * slug), falling back to outcomes[0] — the curated headline metric.
 */
function heroOutcome(slug: string, label?: string) {
    const project = projects.find((p) => p.slug === slug);
    if (!project) return null;
    const picked = label
        ? project.outcomes.find((o) => o.label === label)
        : undefined;
    return picked ?? project.outcomes[0] ?? null;
}

interface Proof {
    value: string;
    label: string;
    /** One-line context — what the number actually means. */
    context: string;
}

// The three strongest hero numbers, sourced live from data/projects.ts. Order is
// most-impressive-first so a 10-second scan lands on the security thesis.
const PROOF: Proof[] = [
    {
        ...(heroOutcome("pacific-impactzone-devsecops", "Pipelines security-gated") ?? {
            value: "~100%",
            label: "Pipelines security-gated",
        }),
        context: "Security controls codified as code, inline with every build.",
    },
    {
        ...(heroOutcome("datahouse-modernization", "Faster deploys") ?? {
            value: "~40%",
            label: "Faster deploys",
        }),
        context: "Quality + security gates baked into automated pipelines.",
    },
    {
        ...(heroOutcome("lumisight-thermal-scanning", "Airport deployments") ?? {
            value: "Statewide",
            label: "Airport deployments",
        }),
        context: "Rigorous QA gates shipped a critical platform under pressure.",
    },
];

// Availability line: prefer BRAND.availability if CONTENT wires it; otherwise
// compose a defensible default from role + location.
const AVAILABILITY =
    (BRAND as { availability?: string }).availability ??
    `${BRAND.role} · ${BRAND.location}`;

export default function ReadmeApp() {
    const open = useDesktopStore((s) => s.open);

    return (
        <AppCanvas className="font-mono text-sm">
            {/* KICKER — in-world OS manifest header */}
            <header className="space-y-3">
                <div className="text-[10px] tracking-[0.3em] text-muted-foreground/70">
                    {`// SYSTEM README`}
                </div>
                <h2 className="font-display text-2xl sm:text-[1.75rem] font-black leading-[1.1] tracking-tight text-foreground">
                    {BRAND.signature}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {BRAND.name} — {BRAND.tagline}. The proof, before the portfolio.
                </p>
            </header>

            {/* PROOF — three quantified hero numbers, violet-dominant */}
            <section aria-label="Proof of impact">
                <div className="text-[10px] tracking-[0.3em] text-primary mb-3">
                    {`// PROOF`}
                </div>
                <ul className="space-y-3">
                    {PROOF.map((p) => (
                        <li
                            key={p.label}
                            className="flex items-baseline gap-4 rounded-md border border-border/50 bg-background/30 p-4 transition-colors hover:border-primary/50"
                        >
                            <span className="font-display text-2xl font-black leading-none text-primary tabular-nums shrink-0 min-w-[5.5ch]">
                                {p.value}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[11px] tracking-[0.18em] uppercase text-foreground">
                                    {p.label}
                                </span>
                                <span className="block text-[11px] leading-snug text-muted-foreground mt-0.5">
                                    {p.context}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* AVAILABILITY — real status line */}
            <section
                aria-label="Availability"
                className="flex items-center gap-3 rounded-md border border-border/50 bg-background/30 px-4 py-3"
            >
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_1px_rgba(34,211,238,0.8)]" />
                </span>
                <p className="text-[11px] leading-snug text-foreground">
                    <span className="tracking-[0.2em] text-accent">AVAILABLE</span>
                    <span className="text-muted-foreground"> — {AVAILABILITY}</span>
                </p>
            </section>

            {/* CTA — one primary pair. Cyan is reserved for the secure/primary action. */}
            <section aria-label="Get in touch" className="space-y-3 pt-1">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                        href="/resume.pdf"
                        download
                        className="group flex flex-1 items-center justify-center gap-2 rounded-md border border-accent/60 bg-accent/10 px-4 py-3 text-xs font-medium tracking-wide text-accent shadow-[0_0_18px_-6px_rgba(34,211,238,0.7)] transition-colors hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <Download size={15} aria-hidden="true" />
                        Download resume
                    </a>
                    <button
                        type="button"
                        onClick={() => open("contact")}
                        className="flex flex-1 items-center justify-center gap-2 rounded-md border border-primary/50 bg-primary/5 px-4 py-3 text-xs font-medium tracking-wide text-foreground transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        Open Contact
                    </button>
                </div>

                {/* Quiet secondary — defer the philosophy to About. */}
                <button
                    type="button"
                    onClick={() => open("about")}
                    className="group inline-flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                >
                    Read the full story
                    <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="transition-transform motion-safe:group-hover:translate-x-0.5"
                    />
                </button>
            </section>
        </AppCanvas>
    );
}
