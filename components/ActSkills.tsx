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
import { DUR, EASE, STAGGER } from "@/components/motion";
import { useReveal } from "@/hooks/useReveal";
import { TechIcon } from "@/components/TechIcon";
import { resumeData } from "@/data/resume";

// --- Band-arrival reveal vocabulary -----------------------------------------
// Each skill group is an orchestrated container: its band-colored top border
// DRAWS first (the band landing on the block), then the header and content
// settle in. Every variant set defines `instant` (final state, duration 0) so
// useReveal's instant path — reduced motion / deep-link arrivals — renders the
// fully composed state with zero animation (see hooks/useReveal.ts).
const landGroup: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: STAGGER.base,
            delayChildren: STAGGER.tight,
        },
    },
    instant: { transition: { staggerChildren: 0, delayChildren: 0 } },
};
const landLine: Variants = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: DUR.slow, ease: EASE } },
    instant: { scaleX: 1, transition: { duration: 0 } },
};
const landChild: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
    instant: { opacity: 1, y: 0, transition: { duration: 0 } },
};

// Certs = beam terminals: one orchestrated row; the rail draws through, then
// the two seals stagger in (0.08) — never lockstep, never remounted.
const certRow: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: STAGGER.base,
            delayChildren: STAGGER.tight,
        },
    },
    instant: { transition: { staggerChildren: 0, delayChildren: 0 } },
};
const certRailH: Variants = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: DUR.slow, ease: EASE } },
    instant: { scaleX: 1, transition: { duration: 0 } },
};
const certRailV: Variants = {
    hidden: { scaleY: 0 },
    show: { scaleY: 1, transition: { duration: DUR.slow, ease: EASE } },
    instant: { scaleY: 1, transition: { duration: 0 } },
};
const certSeal: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: DUR.base, ease: EASE },
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

// ROLES reframed as a trajectory, not a heap (jc-ahr — copy approved in the
// beam-r4 spec: "a visible arc says 'grew into architecture'; a comma list
// says 'keyword stuffing'"). Same true titles as resumeData.skills.roles,
// condensed to the growth arc and de-duplicated of the two redundant
// entries (Solutions Engineer, DevOps Engineer).
const ROLE_TRAJECTORY = [
    "Backend Developer",
    "Full-stack",
    "Tech Lead",
    "Technical Architect",
    "DevSecOps",
];

/** Band-ramp position for group i — shared by the fan and the landed tints. */
const bandT = (i: number) =>
    groups.length === 1 ? 0 : i / (groups.length - 1);

export default function ActSkills() {
    // The visitor's hand on the spectrum: hovering a group header lights its
    // prism band while the others yield (PrismBands renders the response).
    const [hotBand, setHotBand] = useState<number | null>(null);
    return (
        /* max-md:-mt-8 (jc-7am): below md the gap between Experience's last role
           and THE STACK spent the top half of a 390px frame on bare beam over
           grid. Pull the whole act (border + heading) up 2rem into Experience's
           compressed bottom band so THE STACK heading enters the frame sooner —
           a clean act weld, not a scroll through void. The negative margin lands
           inside the prior act's empty padding (no card collision) and the prism
           vertex anchor is DOM-measured, so the beam re-welds automatically.
           Zero effect at md+ (original spacing). */
        <section className="section-y relative border-t border-border overflow-hidden max-md:-mt-8">
            {/* Background wash + single restrained violet glow blob (decorative). */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50 pointer-events-none"
            />
            {/* Decorative violet glow. Pre-rendered as a radial-gradient paint
                instead of a 600px bg-primary/10 circle under blur-[140px]: the
                filtered version forced a full-viewport composite layer that the
                compositor re-rasterized at the Skills act boundary (jc-g2l). A
                gradient background-image is visually equivalent with zero filter
                cost. */}
            <div
                aria-hidden="true"
                className="absolute w-[600px] h-[600px] -right-40 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.06) 40%, rgba(139,92,246,0) 72%)",
                }}
            />

            <Container className="relative z-10">
                {/* Composed lockup (jc-246): THE STACK anchors the left and the
                    prism fan radiates to its right as ONE frame with focal
                    structure — no more parallel strips with dead void beside the
                    headline. Below xl it stacks (headline above a full-width fan,
                    labels at full size); at xl+ the fan takes the wide right lane
                    the beam already sweeps toward before the prism weld, so the
                    label terminals still render ~12.6px at 1440.
                    Act-opener grammar (jc-nc1): caps black display, violet on the
                    claim line; ONE eyebrow spec; the act number lives on the
                    stage rail alone — no doubled "04". */}
                <div className="mb-16 grid grid-cols-1 items-center gap-8 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-12">
                    <EtchHeading
                        as="h2"
                        className="type-display text-7xl sm:text-8xl"
                        eyebrow="stack"
                        eyebrowClassName="text-xs label-accent mb-4"
                    >
                        THE
                        <br />
                        <span className="text-primary">STACK</span>
                    </EtchHeading>

                    <PrismBands
                        labels={groups.map((g) => g.title)}
                        hotBand={hotBand}
                    />
                </div>

                {/* The landed spectrum — one cell per band, each tinted by its
                    band's ramp position. Seated on a readable panel; each cell
                    owns its own reveal (no panel-level gate).
                    4+3 composition (jc-es0): at lg+ the panel runs a 12-col
                    grid — row 1 is the first four groups at col-span-3 each
                    (=12), row 2 is the remaining three at col-span-4 each
                    (=12), so it wraps with no leftover hole and no orphan
                    column (previously lg:grid-cols-4 left a bare cell beside
                    PRACTICES). */}
                <div className="panel grid grid-cols-1 items-start gap-x-8 gap-y-12 p-8 sm:grid-cols-2 sm:p-10 lg:grid-cols-12 lg:p-12">
                    {groups.map((group, i) => (
                        <SkillGroup
                            key={group.title}
                            icon={group.icon}
                            title={group.title}
                            skills={group.skills}
                            iconChips={group.iconChips}
                            t={bandT(i)}
                            onHotChange={(on) => setHotBand(on ? i : null)}
                            className={i < 4 ? "lg:col-span-3" : "lg:col-span-4"}
                        />
                    ))}

                    {/* ROLES trajectory — seated inside the panel as its
                        footer strip (full span) instead of floating in open
                        space between the panel edge and the CERTIFICATIONS
                        rule, so it reads as the spectrum's ground wire, not
                        stray copy (jc-es0/jc-ahr, copy approved in the
                        beam-r4 spec). */}
                    <div className="col-span-1 border-t border-border-subtle pt-6 sm:col-span-2 lg:col-span-12">
                        <p className="font-mono text-xs leading-relaxed tracking-wide text-muted-foreground">
                            <span className="text-primary">ROLES&nbsp;—&nbsp;</span>
                            {ROLE_TRAJECTORY.map((role, i) => (
                                <span
                                    key={role}
                                    className={
                                        i === ROLE_TRAJECTORY.length - 1
                                            ? "font-semibold text-foreground"
                                            : undefined
                                    }
                                >
                                    {role}
                                    {i < ROLE_TRAJECTORY.length - 1 && (
                                        <span className="text-primary/50">
                                            {" "}
                                            →{" "}
                                        </span>
                                    )}
                                </span>
                            ))}
                        </p>
                    </div>
                </div>

                <CertTerminals />
            </Container>
        </section>
    );
}

/** Credential CLASS chip, derived from the AWS cert name — a decorative,
    factual label (no invented claim, no metric). Foundational/Associate cover
    the two certs today; Professional/Specialty are wired for future rungs so
    the two cards always read as matched, tiered credentials. */
function certTier(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("practitioner")) return "FOUNDATIONAL";
    if (n.includes("professional")) return "PROFESSIONAL";
    if (n.includes("specialty")) return "SPECIALTY";
    if (n.includes("associate")) return "ASSOCIATE";
    return "CERTIFIED";
}

/** Certifications as beam terminals: the recolored ribbon's rail runs the full
    row and threads through two etched seals — a violet credential MEDALLION
    holding the AWS mark, a tiered class chip, real issue + validity dates, and
    the violet hairline etch per the EtchHeading language. */
function CertTerminals() {
    const row = useReveal<HTMLDivElement>({ orchestrate: true });
    return (
        <div className="mt-24 pt-12 border-t border-border">
            <h3 className="text-xs label-accent mb-10">
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
                    {resumeData.certifications.map((cert) => {
                        const tier = certTier(cert.name);
                        return (
                            <motion.article
                                key={cert.name}
                                variants={certSeal}
                                className="group surface-2 relative overflow-hidden rounded-xl p-8 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--glow-primary)]"
                            >
                                {/* Violet hairline etch (EtchHeading language). */}
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-primary/70 via-primary/25 to-transparent"
                                />
                                <div className="relative flex items-start gap-5">
                                    {/* Credential MEDALLION: a layered violet ring — a
                                        1px minted outer edge with faint concentric
                                        guilloché lines and a soft glow, an inset disc the
                                        AWS mark is seated on. Static (no pulse) → its
                                        resting composition is identical under reduced
                                        motion. */}
                                    <span
                                        className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
                                        style={{
                                            // Minted double-edge on the system's own violet
                                            // glow (--glow-primary) — no bespoke bloom or
                                            // banknote guilloche; austere like the rest of the act.
                                            backgroundImage:
                                                "radial-gradient(circle at 50% 38%, rgba(139,92,246,0.22), rgba(139,92,246,0.05) 58%, transparent 72%)",
                                            boxShadow:
                                                "0 0 0 1px rgba(139,92,246,0.5), var(--glow-primary), inset 0 1px 0 rgba(255,255,255,0.05)",
                                        }}
                                    >
                                        {/* Inset disc — the seated field; its inner
                                            hairline ring gives the medallion its minted
                                            double edge. */}
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-[3px] rounded-full bg-surface"
                                            style={{
                                                boxShadow:
                                                    "inset 0 0 0 1px rgba(139,92,246,0.22), inset 0 2px 6px -3px rgba(0,0,0,0.7)",
                                            }}
                                        />
                                        <TechIcon
                                            name="AWS"
                                            className="relative h-7 w-7 text-primary"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        {/* Tier chip — decorative credential class,
                                            derived from the cert name. */}
                                        <div className="mb-3">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.6875rem] font-medium leading-none label-accent">
                                                <span
                                                    aria-hidden="true"
                                                    className="h-1 w-1 shrink-0 rotate-45 bg-primary"
                                                />
                                                {/* [copy — owner approval pending] */}
                                                {tier}
                                            </span>
                                        </div>
                                        <h4 className="mb-1.5 text-balance text-lg font-bold leading-snug tracking-tight">
                                            {cert.name}
                                        </h4>
                                        <p className="mb-4 text-sm text-muted-foreground">
                                            {cert.issuer}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] label">
                                            <span className="text-primary">
                                                ISSUED {cert.issued.toUpperCase()}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className="h-1 w-1 shrink-0 rotate-45 bg-primary/40"
                                            />
                                            {/* [copy — owner approval pending] */}
                                            <span className="text-muted-foreground">
                                                VALID THROUGH{" "}
                                                {cert.expires.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Credential hover SHEEN (jc-ddj): one slow violet light
                                    pass glancing across the face on hover. Fine-pointer +
                                    motion ONLY — coarse (touch) and reduced-motion render
                                    nothing (display:none → element removed, zero travel).
                                    The transition lives only in the hover state, so the
                                    band snaps back on leave (the .cta-sheen grammar); the
                                    card's overflow-hidden clips it. Transform only; timing
                                    from the shared DUR/EASE tokens. */}
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-y-0 -inset-x-4 -translate-x-[130%] transition-none group-hover:translate-x-[130%] group-hover:transition-transform motion-reduce:hidden coarse:hidden"
                                    style={{
                                        background:
                                            "linear-gradient(105deg, transparent 42%, rgba(139,92,246,0.20) 50%, transparent 58%)",
                                        // Matches the .cta-sheen instrument exactly (0.55s
                                        // var(--ease-beam)) so both sheens read as one gesture.
                                        transitionDuration: "0.55s",
                                        transitionTimingFunction: `cubic-bezier(${EASE.join(", ")})`,
                                    }}
                                />
                            </motion.article>
                        );
                    })}
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
    className,
}: {
    title: string;
    skills: string[];
    icon: LucideIcon;
    iconChips: boolean;
    t: number;
    /** Hover intent on the group header — lights this group's prism band. */
    onHotChange?: (hot: boolean) => void;
    /** Grid placement (col-span) supplied by the parent's 4+3 layout. */
    className?: string;
}) {
    const group = useReveal<HTMLDivElement>({ orchestrate: true });
    // Local warmth (jc-es0): the group header's hover was the act's one
    // micro-interaction, but its only reward (lighting the PrismBands fan
    // above the fold) is often scrolled out of frame. Bring the response
    // local — the icon glows, the top border brightens, and the core chips'
    // borders step up — so hovering a group is never a dead gesture.
    const [isHot, setIsHot] = useState(false);
    const color = bandColor(t);
    const core = skills.slice(0, CORE_COUNT);
    const rest = skills.slice(CORE_COUNT);
    const handleHot = (hot: boolean) => {
        onHotChange?.(hot);
        setIsHot(hot);
    };
    return (
        <motion.div variants={landGroup} {...group} className={className}>
            {/* The band lands here: a 1px top border in this group's band
                color, drawn left-to-right as the block reveals. Its glow
                steps up (0.45 → 0.8 alpha) while the group is hot. */}
            <motion.span
                aria-hidden="true"
                variants={landLine}
                className="mb-5 block h-px w-full origin-left transition-[box-shadow] motion-reduce:transition-none"
                style={{
                    background: `linear-gradient(90deg, ${color}, ${bandColorA(t, 0)})`,
                    boxShadow: `0 0 ${isHot ? 14 : 8}px ${bandColorA(t, isHot ? 0.8 : 0.45)}`,
                }}
            />
            <motion.h3
                variants={landChild}
                onPointerEnter={() => handleHot(true)}
                onPointerLeave={() => handleHot(false)}
                className="mb-5 flex items-center gap-2.5 font-mono text-base font-bold tracking-tight text-foreground"
            >
                <Icon
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.75}
                    className="shrink-0 transition-[filter] motion-reduce:transition-none"
                    style={{
                        color,
                        filter: `drop-shadow(0 0 ${isHot ? 7 : 0}px ${bandColorA(t, isHot ? 0.75 : 0)})`,
                    }}
                />
                <span>{title}</span>
            </motion.h3>
            {/* Core skills — display weight, uniform leading mark. Border
                warms with the group (0.35 → 0.75 alpha) so the densest
                interactive-looking surface on the page stops reading as
                inert on hover, while staying cursor-default (not links). */}
            <motion.div
                variants={landChild}
                className="flex flex-wrap gap-2"
            >
                {core.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex items-center gap-2 rounded-full border bg-surface/70 px-3 py-1.5 text-sm font-semibold text-foreground cursor-default transition-[border-color] motion-reduce:transition-none"
                        style={{ borderColor: bandColorA(t, isHot ? 0.75 : 0.35) }}
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
