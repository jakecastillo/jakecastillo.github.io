"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Container from "@/components/Container";
import { resumeData } from "@/data/resume";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ActSkills() {
    const reduceMotion = useReducedMotion();

    // Container drives the stagger; children only animate opacity when motion is reduced.
    const groupContainer: Variants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
        },
    };

    const item: Variants = {
        hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: EASE },
        },
    };

    return (
        <section className="relative py-32 border-t border-border overflow-hidden">
            {/* Background wash + single restrained violet glow blob (decorative). */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50 pointer-events-none"
            />
            <div
                aria-hidden="true"
                className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] -right-40 top-1/2 -translate-y-1/2 pointer-events-none"
            />

            <Container className="relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="text-6xl font-bold tracking-tighter mb-16"
                >
                    TECHNICAL ARSENAL
                </motion.h2>

                <motion.div
                    variants={groupContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3"
                >
                    <SkillGroup variants={item} title="LANGUAGES" skills={resumeData.skills.languages} />
                    <SkillGroup variants={item} title="FRAMEWORKS" skills={resumeData.skills.frameworks} />
                    <SkillGroup variants={item} title="CLOUD & INFRA" skills={resumeData.skills.platforms} />
                    <SkillGroup variants={item} title="DATABASES" skills={resumeData.skills.databases} />
                    <SkillGroup variants={item} title="PRACTICES" skills={resumeData.skills.practices} />
                    <SkillGroup variants={item} title="ROLES" skills={resumeData.skills.roles} />
                </motion.div>

                <div className="mt-24 pt-12 border-t border-border">
                    <h3 className="text-xs font-mono tracking-[0.5em] text-accent mb-8">CERTIFICATIONS</h3>
                    <motion.div
                        variants={groupContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="flex flex-wrap gap-8"
                    >
                        {resumeData.certifications.map((cert) => (
                            <motion.div
                                key={cert.name}
                                variants={item}
                                className="surface-2 p-6 rounded-lg hover:border-primary transition-colors"
                            >
                                <h4 className="text-xl font-bold mb-2">{cert.name}</h4>
                                <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </Container>
        </section>
    );
}

function SkillGroup({
    title,
    skills,
    variants,
}: {
    title: string;
    skills: string[];
    variants: Variants;
}) {
    return (
        <motion.div variants={variants}>
            <h3 className="text-lg font-mono font-bold text-foreground mb-6 border-l-2 border-primary pl-4">
                {title}
            </h3>
            <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                    <span
                        key={skill}
                        className="px-4 py-2 text-sm rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary-muted transition-colors cursor-default"
                    >
                        {skill}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
