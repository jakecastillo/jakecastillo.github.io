"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/Container";
import { contactLinks } from "@/data/links";
import { resumeData } from "@/data/resume";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ActContact() {
    const reduceMotion = useReducedMotion();

    const reveal = (delay = 0) =>
        reduceMotion
            ? {
                  initial: { opacity: 0 },
                  whileInView: { opacity: 1 },
                  viewport: { once: true, amount: 0.2 },
                  transition: { duration: 0.3 },
              }
            : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.2 },
                  transition: { duration: 0.3, ease: EASE, delay },
              };

    const primary = contactLinks.find((link) => link.primary);
    const secondary = contactLinks.filter((link) => !link.primary);

    return (
        <section className="relative py-32 min-h-[80vh] flex flex-col justify-center overflow-hidden">
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
                        <motion.div
                            {...reveal(0)}
                            className="mb-6 text-xs tracking-[0.3em] text-accent"
                        >
                            <span>{"/// SECURE_CHANNEL_ESTABLISHED"}</span>
                        </motion.div>

                        <motion.h2
                            {...reveal(reduceMotion ? 0 : 0.06)}
                            className="text-7xl font-bold text-foreground tracking-tighter"
                        >
                            INITIALIZE
                            <br />
                            CONNECTION
                            <span className="animate-pulse text-primary">_</span>
                        </motion.h2>

                        <motion.p
                            {...reveal(reduceMotion ? 0 : 0.12)}
                            className="measure mt-8 text-base text-muted-foreground"
                        >
                            Building secure-by-default pipelines and shipping software
                            with DevSecOps guardrails baked in. Open to platform
                            security, CI/CD hardening, and infrastructure roles — start
                            the handshake below.
                        </motion.p>
                    </div>

                    {/* Readability scrim keeps text >= 4.5:1 over the orb */}
                    <motion.div
                        {...reveal(reduceMotion ? 0 : 0.18)}
                        className="rounded-xl bg-background/70 backdrop-blur-sm p-6 sm:p-8"
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
                                className="group glow-primary flex min-h-11 items-center justify-between gap-4 rounded-lg bg-primary px-5 py-4 text-primary-foreground transition-[transform,box-shadow] hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.97]"
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
                                        <span className="truncate font-mono text-xs uppercase tracking-widest text-primary-foreground/80">
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
                        <ul className="mt-4 grid gap-1 text-left">
                            {secondary.map((link, index) => {
                                const Icon = link.icon;
                                return (
                                    <motion.li
                                        key={link.key}
                                        {...reveal(
                                            reduceMotion ? 0 : 0.24 + index * 0.06
                                        )}
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

                        {/* Stats row — inside the scrim for legibility over the orb */}
                        <div className="mt-8 flex flex-wrap justify-between gap-x-4 gap-y-2 border-t border-border-subtle pt-6 text-xs uppercase tracking-widest text-muted-foreground">
                            <span>UPTIME: 99.9%</span>
                            <span>ENCRYPTION: AES-256</span>
                            <span>LOCATION: {resumeData.location.toUpperCase()}</span>
                        </div>
                    </motion.div>
                </div>
            </Container>
        </section>
    );
}
