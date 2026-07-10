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
    Workflow,
    type LucideIcon,
} from "lucide-react";
import Container from "@/components/Container";
import EtchHeading from "@/components/beam/EtchHeading";
import PrismBands from "@/components/beam/PrismBands";
import { scaleIn } from "@/components/motion";
import { useReveal } from "@/hooks/useReveal";
import { TechIcon } from "@/components/TechIcon";
import { resumeData } from "@/data/resume";

const EASE = [0.16, 1, 0.3, 1] as const;

// Constant variants (no useReducedMotion branch) so SSR == client markup;
// MotionProvider auto-drops the y transform for reduced-motion users. Each cell
// reveals on its own (per-group, not one tall panel-level trigger) so a
// deep-link to #skills can never land on a viewport of opacity-0 content that
// only pops after ~700px more scroll.
const reveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: EASE },
    },
};

// Even, balanced groups — each carries a meaningful glyph so the stack reads as
// a scannable matrix instead of a wall of pills (and no longer crams the rail).
const groups: { title: string; icon: LucideIcon; skills: string[]; showIcons: boolean }[] = [
    { title: "LANGUAGES", icon: Code2, skills: resumeData.skills.languages, showIcons: true },
    { title: "FRAMEWORKS", icon: Boxes, skills: resumeData.skills.frameworks, showIcons: true },
    { title: "CLOUD & DEVOPS", icon: Cloud, skills: resumeData.skills.platforms, showIcons: true },
    { title: "SECURITY", icon: ShieldCheck, skills: resumeData.skills.security, showIcons: false },
    { title: "AI / ML", icon: BrainCircuit, skills: resumeData.skills.ai, showIcons: true },
    { title: "DATA", icon: Database, skills: resumeData.skills.databases, showIcons: true },
    { title: "PRACTICES", icon: Workflow, skills: resumeData.skills.practices, showIcons: false },
    { title: "ROLES", icon: Users, skills: resumeData.skills.roles, showIcons: false },
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
                <EtchHeading
                    as="h2"
                    className="text-7xl font-bold tracking-tight leading-[0.95] [overflow-wrap:anywhere]"
                    eyebrow="04 / stack"
                    eyebrowClassName="text-xs font-mono tracking-[0.25em] text-primary mb-4"
                    wrapperClassName="mb-16 max-w-3xl"
                >
                    THE
                    <br />
                    <span className="text-primary">STACK</span>
                </EtchHeading>

                <PrismBands count={groups.length} />

                {/* Even responsive matrix — every group an equal cell so nothing
                    crams into a single rail. Seated on a readable panel so the
                    pills stay legible over the living background. Each cell owns
                    its own reveal (no panel-level gate), so nothing waits behind
                    a 2000px+ container to satisfy an amount threshold. */}
                <div className="panel grid grid-cols-1 items-start gap-x-10 gap-y-12 p-8 sm:grid-cols-2 sm:p-10 lg:grid-cols-3 lg:p-12">
                    {groups.map((group) => (
                        <SkillGroup
                            key={group.title}
                            icon={group.icon}
                            title={group.title}
                            skills={group.skills}
                            showIcons={group.showIcons}
                        />
                    ))}
                </div>

                <div className="mt-24 pt-12 border-t border-border">
                    <h3 className="text-xs font-mono tracking-[0.25em] text-muted-foreground mb-8">CERTIFICATIONS</h3>
                    <div className="flex flex-wrap gap-8">
                        {resumeData.certifications.map((cert) => (
                            <CertCard key={cert.name} name={cert.name} issuer={cert.issuer} />
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}

function CertCard({ name, issuer }: { name: string; issuer: string }) {
    const cert = useReveal<HTMLDivElement>();
    return (
        <motion.div
            variants={scaleIn}
            {...cert}
            className="surface-2 p-8 rounded-lg transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--glow-primary)] active:scale-[0.98]"
        >
            <h4 className="text-xl font-bold tracking-tight mb-3">{name}</h4>
            <p className="text-sm text-muted-foreground">{issuer}</p>
        </motion.div>
    );
}

function SkillGroup({
    title,
    skills,
    icon: Icon,
    showIcons,
}: {
    title: string;
    skills: string[];
    icon: LucideIcon;
    showIcons: boolean;
}) {
    const group = useReveal<HTMLDivElement>();
    return (
        <motion.div variants={reveal} {...group}>
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
                        className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-sm text-muted-foreground transition-[color,background-color,border-color,transform,box-shadow] duration-150 hover:text-foreground hover:border-primary hover:bg-primary-muted active:scale-[0.96] active:border-primary active:shadow-[0_0_18px_-6px_rgba(139,92,246,0.55)] cursor-default"
                    >
                        {showIcons && (
                            <TechIcon
                                name={skill}
                                className="shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-primary-hover"
                            />
                        )}
                        {skill}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
