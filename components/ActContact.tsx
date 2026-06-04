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
                  transition: { duration: 0.4 },
              }
            : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.2 },
                  transition: { duration: 0.5, ease: EASE, delay },
              };

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

            <Container className="relative z-10 w-full max-w-4xl text-center">
                <motion.div
                    {...reveal(0)}
                    className="mb-8 text-xs tracking-[0.3em] text-accent"
                >
                    <span>{"/// SECURE_CHANNEL_ESTABLISHED"}</span>
                </motion.div>

                <motion.h2
                    {...reveal(0.06)}
                    className="text-7xl font-bold text-foreground mb-16 tracking-tighter"
                >
                    INITIALIZE
                    <br />
                    CONNECTION
                    <span className="animate-pulse text-primary">_</span>
                </motion.h2>

                <ul className="grid gap-4 text-left">
                    {contactLinks.map((link, index) => {
                        const Icon = link.icon;
                        return (
                            <motion.li
                                key={link.key}
                                {...reveal(reduceMotion ? 0 : 0.12 + index * 0.08)}
                            >
                                <a
                                    href={link.href}
                                    target={link.external ? "_blank" : undefined}
                                    rel={link.external ? "noopener noreferrer" : undefined}
                                    download={link.download ? "" : undefined}
                                    className="group flex items-center justify-between gap-4 rounded-lg border-b border-border-subtle px-3 py-4 transition-[color,border-color,transform] hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.97]"
                                >
                                    <span className="flex min-w-0 items-center gap-4">
                                        <span className="font-mono text-xs text-subtle-foreground transition-colors group-hover:text-primary">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <Icon
                                            aria-hidden="true"
                                            className="h-6 w-6 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                                        />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate text-2xl font-semibold text-foreground transition-colors group-hover:text-primary">
                                                {link.label}
                                            </span>
                                            <span className="truncate font-mono text-xs uppercase tracking-widest text-subtle-foreground">
                                                {link.displayLabel}
                                            </span>
                                        </span>
                                    </span>
                                    <ArrowUpRight
                                        aria-hidden="true"
                                        className="h-6 w-6 shrink-0 -translate-x-2 translate-y-2 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                                    />
                                </a>
                            </motion.li>
                        );
                    })}
                </ul>

                <motion.div
                    {...reveal(reduceMotion ? 0 : 0.5)}
                    className="mt-32 border-t border-border-subtle pt-6 flex flex-wrap justify-between gap-4 text-xs uppercase tracking-widest text-muted-foreground"
                >
                    <span>LATENCY: 12ms</span>
                    <span>ENCRYPTION: AES-256</span>
                    <span>LOCATION: {resumeData.location.toUpperCase()}</span>
                </motion.div>
            </Container>
        </section>
    );
}
