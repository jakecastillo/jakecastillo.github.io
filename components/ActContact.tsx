"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/Container";
import { contactLinks } from "@/data/links";
import { resumeData } from "@/data/resume";

const EASE = [0.16, 1, 0.3, 1] as const;

// Constant markup (no useReducedMotion branch) so SSR == client; MotionProvider
// drops the y transform for reduced-motion users automatically.
const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.3, ease: EASE, delay },
});

export default function ActContact() {

    const primary = contactLinks.find((link) => link.primary);
    const secondary = contactLinks.filter((link) => !link.primary);

    // Verifiable, non-numeric markers — real credentials + role + location only.
    const credibility = [
        "AWS SOLUTIONS ARCHITECT",
        "AWS CLOUD PRACTITIONER",
        "DEVSECOPS",
        resumeData.location.toUpperCase(),
    ];

    return (
        <section
            className="section-y relative min-h-[80vh] flex flex-col justify-center overflow-hidden"
            style={{
                // Final act: clear the fixed bottom dock so its content/markers
                // never overlap at 375px, including iOS safe-area inset.
                paddingBottom: "calc(8rem + env(safe-area-inset-bottom))",
            }}
        >
            {/* Background grid — decorative */}
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <Container className="relative z-10 w-full max-w-5xl">
                {/* Asymmetric focal hierarchy: heading + intent on the left, action stack weighted right */}
                <div className="grid items-start gap-10 md:grid-cols-[1.1fr_minmax(0,1fr)] md:gap-16">
                    <div className="md:pt-4">
                        {/* Cyan kept as the ONE genuine "available/online" signal in view */}
                        <motion.div
                            {...reveal(0)}
                            className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground"
                        >
                            <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full bg-accent"
                            />
                            <span>Available for new work</span>
                        </motion.div>

                        <motion.h2
                            {...reveal(0.06)}
                            className="text-7xl font-bold text-foreground tracking-tight [overflow-wrap:anywhere]"
                        >
                            Let&rsquo;s build
                            <br />
                            something secure
                            <span className="animate-pulse text-primary">.</span>
                        </motion.h2>

                        <motion.p
                            {...reveal(0.12)}
                            className="measure mt-8 text-base text-muted-foreground"
                        >
                            I build secure-by-default pipelines and ship software with
                            DevSecOps guardrails baked in. I&rsquo;m open to platform
                            security, CI/CD hardening, and infrastructure roles &mdash;
                            and I read every message. Reach out below.
                        </motion.p>
                    </div>

                    {/* Readability scrim: luminance-elevated surface (subtle border +
                        tint) keeps text >= 4.5:1 over the orb */}
                    <motion.div
                        {...reveal(0.18)}
                        className="rounded-xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-8"
                    >
                        {/* PRIMARY CTA — dominant, filled violet */}
                        {primary ? (
                            <a
                                href={primary.href}
                                target={primary.external ? "_blank" : undefined}
                                rel={
                                    primary.external
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                download={primary.download ? "" : undefined}
                                className="group glow-primary flex min-h-11 items-center justify-between gap-4 rounded-lg bg-primary-cta px-6 py-4 text-white transition-[transform,box-shadow] hover:bg-primary-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.97]"
                            >
                                <span className="flex min-w-0 items-center gap-3">
                                    <primary.icon
                                        aria-hidden="true"
                                        className="h-6 w-6 shrink-0"
                                    />
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate text-2xl font-semibold">
                                            {primary.label}
                                        </span>
                                        <span className="truncate font-mono text-xs uppercase tracking-widest text-white/80">
                                            {primary.displayLabel}
                                        </span>
                                    </span>
                                </span>
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className="h-6 w-6 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                />
                            </a>
                        ) : null}

                        {/* SECONDARY links — clearly subordinate */}
                        <ul className="mt-6 grid gap-2 text-left">
                            {secondary.map((link, index) => {
                                const Icon = link.icon;
                                return (
                                    <motion.li
                                        key={link.key}
                                        {...reveal(0.24 + index * 0.06)}
                                    >
                                        <a
                                            href={link.href}
                                            target={
                                                link.external ? "_blank" : undefined
                                            }
                                            rel={
                                                link.external
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                            download={link.download ? "" : undefined}
                                            className="group flex min-h-11 items-center justify-between gap-4 rounded-lg border-b border-border-subtle px-3 py-3 transition-[color,border-color,transform] hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.97]"
                                        >
                                            <span className="flex min-w-0 items-center gap-4">
                                                <Icon
                                                    aria-hidden="true"
                                                    className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                                                />
                                                <span className="flex min-w-0 flex-col">
                                                    <span className="truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
                                                        {link.label}
                                                    </span>
                                                    <span className="truncate font-mono text-xs uppercase tracking-widest text-subtle-foreground">
                                                        {link.displayLabel}
                                                    </span>
                                                </span>
                                            </span>
                                            <ArrowUpRight
                                                aria-hidden="true"
                                                className="h-5 w-5 shrink-0 -translate-x-2 translate-y-2 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                                            />
                                        </a>
                                    </motion.li>
                                );
                            })}
                        </ul>

                        {/* Credibility markers — verifiable, derived from resumeData.
                            One restrained terminal flourish: the ~/ prompt glyph. */}
                        <dl className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-border-subtle pt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                            <span aria-hidden="true" className="text-subtle-foreground">
                                ~/
                            </span>
                            {credibility.map((marker) => (
                                <dd key={marker} className="m-0">
                                    {marker}
                                </dd>
                            ))}
                        </dl>
                    </motion.div>
                </div>
            </Container>
        </section>
    );
}
