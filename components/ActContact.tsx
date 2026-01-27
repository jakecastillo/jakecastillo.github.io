"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { contactLinks } from "@/data/links";
import { resumeData } from "@/data/resume";

export default function ActContact() {
    return (
        <section className="min-h-screen bg-black flex flex-col items-center justify-center p-6 border-t border-primary/20 relative overflow-hidden">
            {/* Background Grid noise */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />

            <div className="max-w-3xl w-full font-mono z-10">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mb-8 text-xs tracking-[0.3em] text-accent/60"
                >
                    <span>{"/// SECURE_CHANNEL_ESTABLISHED"}</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold text-foreground mb-16 tracking-tighter"
                >
                    INITIALIZE<br />CONNECTION<span className="animate-pulse text-primary">_</span>
                </motion.h2>

                <div className="grid gap-8 text-xl md:text-2xl">
                    {contactLinks.map((link, index) => (
                        <a
                            key={link.key}
                            href={link.href}
                            target={link.external ? "_blank" : undefined}
                            rel={link.external ? "noopener noreferrer" : undefined}
                            className="group flex items-center justify-between border-b border-border/30 pb-4 hover:border-primary transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4 group-hover:text-primary transition-colors">
                                <span className="text-sm opacity-30 group-hover:opacity-100">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span>{link.displayLabel}</span>
                            </div>
                            <ArrowUpRight className="opacity-0 group-hover:opacity-100 -translate-y-2 translate-x-2 transition-all" />
                        </a>
                    ))}
                </div>

                <div className="mt-32 border-t border-border/10 pt-6 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground/40">
                    <span>LATENCY: 12ms</span>
                    <span>ENCRYPTION: AES-256</span>
                    <span>LOCATION: {resumeData.location.toUpperCase()}</span>
                </div>
            </div>
        </section>
    );
}
