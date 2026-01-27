"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { resumeData } from "@/data/resume";

export default function ActPhilosophy() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    // Transform vertical scroll into horizontal movement
    // Adjust the range based on content width
    const x = useTransform(scrollYProgress, [0.2, 0.8], ["0%", "-50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-surface-elevated">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                <motion.div
                    style={{ x, opacity }}
                    className="flex gap-12 px-12 md:gap-32 md:px-32"
                >
                    {/* Slide 1: The Core Belief */}
                    <div className="flex-shrink-0 w-[80vw] md:w-[60vw]">
                        <h2 className="text-4xl md:text-6xl font-black mb-8 text-foreground">
                            ENGINEERING<br />
                            <span className="text-primary-hover">RESILIENT SYSTEMS.</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground w-3/4 leading-relaxed">
                            {resumeData.summary}
                        </p>
                    </div>

                    {/* Slide 2: The Process */}
                    <div className="flex-shrink-0 w-[80vw] md:w-[60vw] flex flex-col justify-center">
                        <div className="border-l-2 border-accent pl-8">
                            <h3 className="text-sm font-mono tracking-widest text-accent mb-4">SYSTEMS THINKING</h3>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-2xl md:text-4xl font-bold mb-2">Infrastructure Design.</h4>
                                    <p className="text-muted-foreground text-base md:text-xl max-w-2xl">
                                        Designing resilient, microservice-first platforms that modernize legacy stacks and scale cleanly with growth.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-2xl md:text-4xl font-bold mb-2">Cloud Orchestration.</h4>
                                    <p className="text-muted-foreground text-base md:text-xl max-w-2xl">
                                        Architecting self-healing AWS infrastructure with security and compliance embedded as code from day one.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-2xl md:text-4xl font-bold mb-2">Data Integrity.</h4>
                                    <p className="text-muted-foreground text-base md:text-xl max-w-2xl">
                                        Enforcing type safety and consistency across complex schemas with modern ORMs, constraints, and SQL strategy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slide 3: The Result */}
                    <div className="flex-shrink-0 w-[80vw] md:w-[60vw] flex items-center">
                        <h2 className="text-8xl md:text-[12rem] font-bold text-transparent"
                            style={{ WebkitTextStroke: '2px var(--muted-foreground)', opacity: 0.2 }}>
                            PRECISION
                        </h2>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
