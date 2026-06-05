"use client";

import { motion, type Variants } from "framer-motion";
import {
    BrainCircuit,
    Boxes,
    Cloud,
    Code2,
    Database,
    ShieldCheck,
    Users,
    type LucideIcon,
} from "lucide-react";
import Container from "@/components/Container";
import { resumeData } from "@/data/resume";

const EASE = [0.16, 1, 0.3, 1] as const;

// Constant variants (no useReducedMotion branch) so SSR == client markup;
// MotionProvider auto-drops the y transform for reduced-motion users.
const groupContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: EASE },
    },
};

// Even, balanced groups — each carries a meaningful glyph so the stack reads as
// a scannable matrix instead of a wall of pills (and no longer crams the rail).
const groups: { title: string; icon: LucideIcon; skills: string[] }[] = [
    { title: "LANGUAGES", icon: Code2, skills: resumeData.skills.languages },
    { title: "FRAMEWORKS", icon: Boxes, skills: resumeData.skills.frameworks },
    { title: "CLOUD & DEVOPS", icon: Cloud, skills: resumeData.skills.platforms },
    { title: "AI / ML", icon: BrainCircuit, skills: resumeData.skills.ai },
    { title: "DATA", icon: Database, skills: resumeData.skills.databases },
    { title: "PRACTICES", icon: ShieldCheck, skills: resumeData.skills.practices },
    { title: "ROLES", icon: Users, skills: resumeData.skills.roles },
];

export default function ActSkills() {
    return (
        <section className="section-y relative border-t border-border overflow-hidden">
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
                {/* Offset oversized heading — overhangs the grid for asymmetric tension. */}
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="mb-16 max-w-3xl"
                >
                    <p className="text-xs font-mono tracking-[0.25em] text-primary mb-4">
                        04 / stack
                    </p>
                    <h2 className="text-7xl font-bold tracking-tight leading-[0.95] [overflow-wrap:anywhere]">
                        THE
                        <br />
                        <span className="text-primary">STACK</span>
                    </h2>
                </motion.header>

                {/* Even responsive matrix — every group an equal cell so nothing
                    crams into a single rail. Seated on a readable panel so the
                    pills stay legible over the living background. */}
                <motion.div
                    variants={groupContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    className="panel grid grid-cols-1 items-start gap-x-10 gap-y-12 p-8 sm:grid-cols-2 sm:p-10 lg:grid-cols-3 lg:p-12"
                >
                    {groups.map((group) => (
                        <SkillGroup
                            key={group.title}
                            variants={item}
                            icon={group.icon}
                            title={group.title}
                            skills={group.skills}
                        />
                    ))}
                </motion.div>

                <div className="mt-24 pt-12 border-t border-border">
                    <h3 className="text-xs font-mono tracking-[0.25em] text-muted-foreground mb-8">CERTIFICATIONS</h3>
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
                                className="surface-2 p-8 rounded-lg hover:border-primary transition-colors"
                            >
                                <h4 className="text-xl font-bold tracking-tight mb-3">{cert.name}</h4>
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
    icon: Icon,
}: {
    title: string;
    skills: string[];
    variants: Variants;
    icon: LucideIcon;
}) {
    return (
        <motion.div variants={variants}>
            <h3 className="mb-5 flex items-center gap-2.5 font-mono text-base font-bold tracking-tight text-foreground">
                <Icon
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.75}
                    className="shrink-0 text-primary"
                />
                <span>{title}</span>
            </h3>
            <div className="flex flex-wrap gap-2.5">
                {skills.map((skill) => (
                    <span
                        key={skill}
                        className="rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-primary hover:bg-primary-muted cursor-default"
                    >
                        {skill}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
