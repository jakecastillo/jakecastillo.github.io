"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
    BrainCircuit,
    Boxes,
    Cloud,
    Code2,
    Database,
    ShieldCheck,
    Workflow,
    type LucideIcon,
} from "lucide-react";
import Container from "@/components/Container";
import EtchHeading from "@/components/beam/EtchHeading";
import PrismBands, { bandColor, bandColorA } from "@/components/beam/PrismBands";
import { useReveal } from "@/hooks/useReveal";
import { TechIcon } from "@/components/TechIcon";
import { resumeData } from "@/data/resume";

const EASE = [0.16, 1, 0.3, 1] as const;

// --- Band-arrival reveal vocabulary -----------------------------------------
// Each skill group is an orchestrated container: its band-colored top border
// DRAWS first (the band landing on the block), then the header and content
// settle in. Every variant set defines `instant` (final state, duration 0) so
// useReveal's instant path — reduced motion / deep-link arrivals — renders the
// fully composed state with zero animation (see hooks/useReveal.ts).
const landGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
    instant: { transition: { staggerChildren: 0, delayChildren: 0 } },
};
const landLine: Variants = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: 0.55, ease: EASE } },
    instant: { scaleX: 1, transition: { duration: 0 } },
};
const landChild: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
    instant: { opacity: 1, y: 0, transition: { duration: 0 } },
};

// Certs = beam terminals: one orchestrated row; the rail draws through, then
// the two seals stagger in (0.08) — never lockstep, never remounted.
const certRow: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
    instant: { transition: { staggerChildren: 0, delayChildren: 0 } },
};
const certRailH: Variants = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: 0.8, ease: EASE } },
    instant: { scaleX: 1, transition: { duration: 0 } },
};
const certRailV: Variants = {
    hidden: { scaleY: 0 },
    show: { scaleY: 1, transition: { duration: 0.8, ease: EASE } },
    instant: { scaleY: 1, transition: { duration: 0 } },
};
const certSeal: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: EASE },
    },
    instant: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
};

// The spectrum: one group per prism band, in band order (violet → cyan).
// `iconChips` is a per-group policy — a group shows brand glyphs on its core
// chips ONLY when its core skills all have real marks (TechIcon coverage);
// otherwise every chip in that group carries a band-colored diamond instead.
// No group ever mixes glyph and no-glyph items.
const groups: {
    title: string;
    icon: LucideIcon;
    skills: string[];
    iconChips: boolean;
}[] = [
    { title: "LANGUAGES", icon: Code2, skills: resumeData.skills.languages, iconChips: true },
    { title: "FRAMEWORKS", icon: Boxes, skills: resumeData.skills.frameworks, iconChips: true },
    { title: "CLOUD & DEVOPS", icon: Cloud, skills: resumeData.skills.platforms, iconChips: true },
    { title: "SECURITY", icon: ShieldCheck, skills: resumeData.skills.security, iconChips: false },
    { title: "AI / ML", icon: BrainCircuit, skills: resumeData.skills.ai, iconChips: false },
    { title: "DATA", icon: Database, skills: resumeData.skills.databases, iconChips: true },
    { title: "PRACTICES", icon: Workflow, skills: resumeData.skills.practices, iconChips: false },
];

// Focal hierarchy: the first CORE_COUNT skills of each group (existing resume
// order — no invented proficiency claims) render as display chips; the rest
// demote to a compact mono list.
const CORE_COUNT = 3;

/** Band-ramp position for group i — shared by the fan and the landed tints. */
const bandT = (i: number) =>
    groups.length === 1 ? 0 : i / (groups.length - 1);

export default function ActSkills() {
    // The visitor's hand on the spectrum: hovering a group header lights its
    // prism band while the others yield (PrismBands renders the response).
    const [hotBand, setHotBand] = useState<number | null>(null);
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

                <PrismBands
                    labels={groups.map((g) => g.title)}
                    hotBand={hotBand}
                />

                {/* The landed spectrum — one cell per band, each tinted by its
                    band's ramp position. Seated on a readable panel; each cell
                    owns its own reveal (no panel-level gate). */}
                <div className="panel grid grid-cols-1 items-start gap-x-8 gap-y-12 p-8 sm:grid-cols-2 sm:p-10 lg:grid-cols-4 lg:p-12">
                    {groups.map((group, i) => (
                        <SkillGroup
                            key={group.title}
                            icon={group.icon}
                            title={group.title}
                            skills={group.skills}
                            iconChips={group.iconChips}
                            t={bandT(i)}
                            onHotChange={(on) => setHotBand(on ? i : null)}
                        />
                    ))}
                </div>

                {/* Roles are copy, not stack — one mono line instead of a pill
                    group. [copy — owner approval] pending; see bead jc-ahr. */}
                <p className="mt-6 font-mono text-xs leading-relaxed tracking-wide text-muted-foreground">
                    <span className="text-primary">ROLES&nbsp;—&nbsp;</span>
                    {resumeData.skills.roles.join(" · ")}
                </p>

                <CertTerminals />
            </Container>
        </section>
    );
}

/** Certifications as beam terminals: the recolored ribbon's rail runs the full
    row and threads through two etched seals — mono AWS mark in a hairline
    ring, real issue dates, violet hairline etch per the EtchHeading language. */
function CertTerminals() {
    const row = useReveal<HTMLDivElement>({ orchestrate: true });
    return (
        <div className="mt-24 pt-12 border-t border-border">
            <h3 className="text-xs font-mono tracking-[0.25em] text-muted-foreground mb-10">
                CERTIFICATIONS
            </h3>
            <motion.div variants={certRow} {...row} className="relative">
                {/* The terminal rail — the band-ramp beam threading the seals.
                    Horizontal on md+ (through both cards' midline), vertical on
                    mobile (matching the beam's vertical snake). */}
                <motion.span
                    aria-hidden="true"
                    variants={certRailH}
                    className="absolute inset-x-0 top-1/2 hidden h-px origin-left md:block"
                    style={{
                        background:
                            "linear-gradient(90deg, #8b5cf6, #2dd4bf)",
                        boxShadow: "0 0 10px 1px rgba(139,92,246,0.4)",
                    }}
                />
                <motion.span
                    aria-hidden="true"
                    variants={certRailV}
                    className="absolute inset-y-0 left-1/2 w-px origin-top md:hidden"
                    style={{
                        background:
                            "linear-gradient(180deg, #8b5cf6, #2dd4bf)",
                        boxShadow: "0 0 10px 1px rgba(139,92,246,0.4)",
                    }}
                />
                {/* Terminal caps at the rail's ends (md+). */}
                <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b5cf6] md:block"
                />
                <span
                    aria-hidden="true"
                    className="absolute right-0 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#2dd4bf] md:block"
                />

                <div className="relative mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
                    {resumeData.certifications.map((cert) => (
                        <motion.article
                            key={cert.name}
                            variants={certSeal}
                            className="surface-2 relative overflow-hidden rounded-lg p-8 transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--glow-primary)]"
                        >
                            {/* Violet hairline etch (EtchHeading language). */}
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-primary/70 via-primary/25 to-transparent"
                            />
                            <div className="flex items-start gap-5">
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/5 shadow-[0_0_14px_-4px_rgba(139,92,246,0.6)]">
                                    <TechIcon
                                        name="AWS"
                                        className="h-7 w-7 text-primary"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <h4 className="mb-2 text-lg font-bold leading-snug tracking-tight">
                                        {cert.name}
                                    </h4>
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        {cert.issuer}
                                    </p>
                                    <p className="font-mono text-xs tracking-[0.18em] text-primary">
                                        ISSUED{" "}
                                        {cert.issued.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function SkillGroup({
    title,
    skills,
    icon: Icon,
    iconChips,
    t,
    onHotChange,
}: {
    title: string;
    skills: string[];
    icon: LucideIcon;
    iconChips: boolean;
    t: number;
    /** Hover intent on the group header — lights this group's prism band. */
    onHotChange?: (hot: boolean) => void;
}) {
    const group = useReveal<HTMLDivElement>({ orchestrate: true });
    const color = bandColor(t);
    const core = skills.slice(0, CORE_COUNT);
    const rest = skills.slice(CORE_COUNT);
    return (
        <motion.div variants={landGroup} {...group}>
            {/* The band lands here: a 1px top border in this group's band
                color, drawn left-to-right as the block reveals. */}
            <motion.span
                aria-hidden="true"
                variants={landLine}
                className="mb-5 block h-px w-full origin-left"
                style={{
                    background: `linear-gradient(90deg, ${color}, ${bandColorA(t, 0)})`,
                    boxShadow: `0 0 8px ${bandColorA(t, 0.45)}`,
                }}
            />
            <motion.h3
                variants={landChild}
                onPointerEnter={() => onHotChange?.(true)}
                onPointerLeave={() => onHotChange?.(false)}
                className="mb-5 flex items-center gap-2.5 font-mono text-base font-bold tracking-tight text-foreground"
            >
                <Icon
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.75}
                    className="shrink-0"
                    style={{ color }}
                />
                <span>{title}</span>
            </motion.h3>
            {/* Core skills — display weight, uniform leading mark. */}
            <motion.div
                variants={landChild}
                className="flex flex-wrap gap-2"
            >
                {core.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex items-center gap-2 rounded-md border bg-surface/70 px-3 py-1.5 text-sm font-semibold text-foreground cursor-default"
                        style={{ borderColor: bandColorA(t, 0.35) }}
                    >
                        {iconChips ? (
                            <TechIcon
                                name={skill}
                                className="shrink-0"
                            />
                        ) : (
                            <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 shrink-0 rotate-45"
                                style={{ background: color }}
                            />
                        )}
                        {skill}
                    </span>
                ))}
            </motion.div>
            {/* Supporting skills — compact mono list, demoted below the core. */}
            {rest.length > 0 && (
                <motion.p
                    variants={landChild}
                    className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground"
                >
                    {rest.join(" · ")}
                </motion.p>
            )}
        </motion.div>
    );
}
