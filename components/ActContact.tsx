"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/Container";
import Beacon from "@/components/beam/Beacon";
import EtchHeading from "@/components/beam/EtchHeading";
import { scaleIn } from "@/components/motion";
import { useBeamStore } from "@/hooks/useBeamStore";
import { useReveal } from "@/hooks/useReveal";
import { contactLinks } from "@/data/links";
import { resumeData } from "@/data/resume";

const EASE = [0.16, 1, 0.3, 1] as const;

// Constant markup (no useReducedMotion branch) so SSR == client; MotionProvider
// drops the y transform for reduced-motion users automatically. `custom`
// supplies the stagger delay; arrival-snap/re-fire wiring lives in useReveal.
const reveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: (delay: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: EASE, delay },
    }),
};

// Secondary contact link — its own reveal so a deep-link / back-nav to #contact
// never lands it blank, and it performs again when scrubbed back up.
function ContactLink({
    link,
    delay,
}: {
    link: (typeof contactLinks)[number];
    delay: number;
}) {
    const item = useReveal<HTMLLIElement>();
    const Icon = link.icon;
    return (
        <motion.li variants={reveal} custom={delay} {...item}>
            <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                download={link.download ? "" : undefined}
                className="group flex min-h-11 items-center justify-between gap-4 rounded-lg border-b border-border-subtle px-3 py-3 transition-[color,border-color,transform] hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.97]"
            >
                <span className="flex min-w-0 items-center gap-4">
                    <Icon
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    />
                    <span className="flex min-w-0 flex-col">
                        <span className="link-underline-onhover truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
                            {link.label}
                        </span>
                        <span className="truncate font-mono text-xs tracking-wide text-subtle-foreground">
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
}

export default function ActContact() {
    const badge = useReveal<HTMLDivElement>();
    const intro = useReveal<HTMLParagraphElement>();
    const card = useReveal<HTMLDivElement>();

    const primary = contactLinks.find((link) => link.primary);
    const secondary = contactLinks.filter((link) => !link.primary);

    // The answered ask: the primary CTA (the ask) drives the beacon behind it
    // and the beam. Hover/focus warms the beacon; pointerdown (works on touch)
    // fires the cyan answer pulse AND rings the ribbon via the beam store.
    const [ctaHot, setCtaHot] = useState(false);
    const [askCount, setAskCount] = useState(0);
    const fireAsk = () => {
        setAskCount((c) => c + 1);
        useBeamStore.getState().ask();
    };

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
                <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[1.1fr_minmax(0,1fr)] md:gap-16">
                    <div className="relative md:pt-4">
                        {/* Local radial darkening (jc-l14): the headline, eyebrow
                            and intro sit open over the viewport-fixed holo rim.
                            Rather than boxing the asymmetric composition into a
                            card, a feathered background-token veil scrolls WITH
                            the column, so the holo yields exactly where the text
                            is and stays vivid everywhere else. `filter: blur`
                            feathers the edges (no hard scrim rectangle); static
                            CSS, so the reduced-motion frame is equally covered. */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-[3rem] sm:-inset-x-12 sm:-inset-y-8"
                            style={{
                                background:
                                    "color-mix(in srgb, var(--background) 92%, transparent)",
                                filter: "blur(28px)",
                            }}
                        />
                        {/* Cyan kept as the ONE genuine "available/online" signal in view */}
                        <motion.div
                            variants={reveal}
                            custom={0}
                            {...badge}
                            className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground"
                        >
                            <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full bg-accent"
                            />
                            <span>Available for new work</span>
                        </motion.div>

                        <EtchHeading
                            as="h2"
                            className="text-7xl font-bold text-foreground tracking-tight [overflow-wrap:anywhere]"
                        >
                            Let&rsquo;s build
                            <br />
                            something good
                            <span className="animate-pulse text-primary">.</span>
                        </EtchHeading>

                        <motion.p
                            variants={reveal}
                            custom={0.12}
                            {...intro}
                            className="measure mt-8 text-base text-muted-foreground"
                        >
                            I design and ship software solutions &mdash; modernizing
                            the systems teams rely on, end to end. Open to engineering,
                            cloud, and platform work, and I read every message. Reach
                            out below.
                        </motion.p>
                    </div>

                    {/* Readability scrim: luminance-elevated surface (subtle border +
                        tint) keeps text >= 4.5:1 over the orb */}
                    <motion.div
                        variants={scaleIn}
                        {...card}
                        className="relative rounded-xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-8"
                    >
                        <Beacon hot={ctaHot} askKey={askCount} />

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
                                onPointerEnter={() => setCtaHot(true)}
                                onPointerLeave={() => setCtaHot(false)}
                                onFocus={() => setCtaHot(true)}
                                onBlur={() => setCtaHot(false)}
                                onPointerDown={fireAsk}
                                // Keyboard activation never emits pointerdown;
                                // detail === 0 marks a keyboard-driven click.
                                onClick={(e) => {
                                    if (e.detail === 0) fireAsk();
                                }}
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
                                        <span className="truncate font-mono text-xs tracking-wide text-white/80">
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
                        <ul className="mt-6 grid grid-cols-1 gap-2 text-left">
                            {secondary.map((link, index) => (
                                <ContactLink
                                    key={link.key}
                                    link={link}
                                    delay={0.24 + index * 0.06}
                                />
                            ))}
                        </ul>

                        {/* Credibility markers — verifiable, derived from resumeData.
                            One restrained terminal flourish: the ~/ prompt glyph. */}
                        <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-subtle pt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                            <li aria-hidden="true" className="text-subtle-foreground">
                                ~/
                            </li>
                            {credibility.map((marker) => (
                                <li key={marker}>{marker}</li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </Container>
        </section>
    );
}
