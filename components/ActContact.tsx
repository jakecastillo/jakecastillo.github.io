"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import Container from "@/components/Container";
import Beacon from "@/components/beam/Beacon";
import EtchHeading from "@/components/beam/EtchHeading";
import { DUR, EASE, STAGGER, scaleIn } from "@/components/motion";
import { useBeamStore } from "@/hooks/useBeamStore";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useReveal } from "@/hooks/useReveal";
import { contactLinks } from "@/data/links";
import { resumeData } from "@/data/resume";

// Constant markup (no useReducedMotion branch) so SSR == client; MotionProvider
// drops the y transform for reduced-motion users automatically. `custom`
// supplies the stagger delay; arrival-snap/re-fire wiring lives in useReveal.
const reveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: (delay: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: DUR.base, ease: EASE, delay },
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
                className="group flex min-h-11 items-center justify-between gap-4 rounded-xl border-b border-border-subtle px-3 py-3 transition-[color,border-color,transform] hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.97]"
            >
                <span className="flex min-w-0 items-center gap-4">
                    <Icon
                        aria-hidden="true"
                        // Shared hover micro-language (jc-rdm): the row's leading
                        // icon lifts + grows a hair and warms toward primary in one
                        // move. `transition` covers both color and the standalone
                        // translate/scale props; motion-safe gates only the travel,
                        // so reduced motion keeps the warm and drops the lift.
                        className="h-5 w-5 shrink-0 origin-center text-muted-foreground transition group-hover:text-primary motion-safe:group-hover:-translate-y-px motion-safe:group-hover:scale-[1.06]"
                    />
                    <span className="flex min-w-0 flex-col">
                        <span className="link-underline-onhover truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
                            {link.label}
                        </span>
                        <span className="line-clamp-2 break-all font-mono text-xs tracking-wide text-subtle-foreground sm:truncate">
                            {link.displayLabel}
                        </span>
                    </span>
                </span>
                <ArrowUpRight
                    aria-hidden="true"
                    // Trailing arrow reveals up-right on row hover (its own
                    // established affordance). The travel is now motion-safe-gated
                    // so reduced motion reveals via opacity ALONE — no slide (jc-rdm
                    // parity fix); the arrow is already primary, so it stays warm.
                    className="h-5 w-5 shrink-0 text-primary opacity-0 transition-all group-hover:opacity-100 motion-safe:-translate-x-2 motion-safe:translate-y-2 motion-safe:group-hover:translate-x-0 motion-safe:group-hover:translate-y-0"
                />
            </a>
        </motion.li>
    );
}

export default function ActContact() {
    const badge = useReveal<HTMLDivElement>();
    const intro = useReveal<HTMLParagraphElement>();
    const portrait = useReveal<HTMLDivElement>();
    const card = useReveal<HTMLDivElement>();

    const primary = contactLinks.find((link) => link.primary);
    const secondary = contactLinks.filter((link) => !link.primary);

    // jc-hrn: the site's biggest ask leans toward the cursor. Fine-pointer +
    // motion-safe gated inside the hook; its arrow parallaxes a hair ahead.
    // Both bags are spread (never member-accessed) to satisfy the no-refs rule.
    const [emailBind, emailIconBind] = useMagnetic<HTMLDivElement>();

    // jc-jmg: copy-to-clipboard affordance beside the mailto CTA (which stays
    // the primary click). Success flips to a cyan "copied" confirmation — the
    // reserved answer grammar — then steps back after a beat.
    const [copied, setCopied] = useState(false);
    const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const copyEmail = async () => {
        const email = resumeData.email;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(email);
            } else {
                // Fallback for older / non-secure contexts.
                const ta = document.createElement("textarea");
                ta.value = email;
                ta.setAttribute("readonly", "");
                ta.style.position = "absolute";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopied(true);
            if (copyResetRef.current) clearTimeout(copyResetRef.current);
            copyResetRef.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // Silent — the mailto path is untouched and remains available.
        }
    };
    useEffect(
        () => () => {
            if (copyResetRef.current) clearTimeout(copyResetRef.current);
        },
        []
    );

    // The answered ask: the primary CTA (the ask) drives the beacon behind it
    // and the beam. Hover/focus warms the beacon; pointerdown (works on touch)
    // fires the cyan answer pulse AND rings the ribbon via the beam store.
    const [ctaHot, setCtaHot] = useState(false);
    const [askCount, setAskCount] = useState(0);
    const fireAsk = () => {
        // ONE ask, three synchronized answers: this bump drives the beacon
        // (askKey), the card-border glow below (askCount), and — via the SAME
        // handler — useBeamStore.ask(), which the ribbon shader reads for its
        // cyan shimmer. DOM twin and shader shimmer therefore fire together.
        setAskCount((c) => c + 1);
        useBeamStore.getState().ask();
    };

    // Reduced-motion card answer: the cyan border steps ON at the press and
    // steps OFF after a beat — a state change, never a travel. JS state (not a
    // keyframe) because the global reduced-motion cap zeroes keyframe
    // durations, which would swallow a border flash. Timing mirrors the
    // ribbon's RM answer (~450ms). The "on" write defers a tick (never
    // synchronous inside the effect — React Compiler cascading-render rule).
    const reduced = useReducedMotion();
    const [rmAnswer, setRmAnswer] = useState(false);
    useEffect(() => {
        if (!reduced || askCount === 0) return;
        const on = setTimeout(() => setRmAnswer(true), 0);
        const off = setTimeout(() => setRmAnswer(false), 450);
        return () => {
            clearTimeout(on);
            clearTimeout(off);
        };
    }, [askCount, reduced]);

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
            {/* The 40px grid texture is now a SITE-WIDE atmosphere layer
                (BackgroundScene, jc-wpd) — the act-local copy is gone so the
                texture reads as one world, not a one-act flourish. */}
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
                        {/* Cyan kept as the ONE genuine "available/online" signal in view.
                            Label rides the shared eyebrow spec (mono, caps, 0.3em) but
                            stays muted — violet next to the cyan dot would double-accent
                            a status badge (jc-nc1). */}
                        <motion.div
                            variants={reveal}
                            custom={0}
                            {...badge}
                            className="mb-6 flex items-center gap-2 text-xs label"
                        >
                            <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full bg-accent"
                            />
                            <span>Available for new work</span>
                        </motion.div>

                        {/* Act-opener display grammar (jc-nc1): ALL-CAPS black with
                            violet on the claim (last line) — caps via CSS, wording
                            untouched. */}
                        <EtchHeading
                            as="h2"
                            className="type-display text-7xl text-foreground sm:text-8xl"
                        >
                            Let&rsquo;s build something
                            <br />
                            <span className="text-primary text-glow">
                                that lasts
                                <span className="animate-pulse">.</span>
                            </span>
                        </EtchHeading>

                        <motion.p
                            variants={reveal}
                            custom={0.12}
                            {...intro}
                            className="measure mt-8 text-base text-muted-foreground"
                        >
                            I design and ship software solutions &mdash; the systems
                            people rely on, end to end. Open to engineering, cloud,
                            and platform work. I read every message.
                        </motion.p>

                        {/* jc-743: the operator, finally revealed. The human
                            appeared once at 44px in the hero and never again;
                            the closing act surfaces the person behind the
                            system. Treated to belong to the world, not pasted
                            on: the source is flattened to grayscale, hue-shifted
                            to the system's violet (mix-blend color), rim-lit
                            from the top-left (screen), and its busy garden
                            background is sunk into the void by a radial mask +
                            bottom gradient — so the face emerges from the dark
                            rather than sitting in a rectangle. The site-wide
                            film grain (.grain, z-60) already passes over it, so
                            the portrait shares the same grain as everything
                            else — no local dither needed. Its reveal rides the
                            shared `reveal` variant; MotionProvider drops the y
                            for reduced-motion users, and the treatment is pure
                            static CSS, so the calm frame is equally covered. */}
                        <motion.div
                            variants={reveal}
                            custom={0.2}
                            {...portrait}
                            aria-hidden="true"
                            className="pointer-events-none mt-12 w-36 select-none sm:mt-14 sm:w-44 lg:w-48"
                        >
                            <div
                                className="relative aspect-[4/5] w-full overflow-hidden"
                                style={{
                                    WebkitMaskImage:
                                        "radial-gradient(115% 130% at 50% 30%, #000 45%, transparent 78%)",
                                    maskImage:
                                        "radial-gradient(115% 130% at 50% 30%, #000 45%, transparent 78%)",
                                }}
                            >
                                <picture>
                                    <source
                                        srcSet="/portrait/jake-640.avif"
                                        type="image/avif"
                                    />
                                    <source
                                        srcSet="/portrait/jake-640.webp"
                                        type="image/webp"
                                    />
                                    <img
                                        src="/portrait/jake-640.jpg"
                                        alt=""
                                        width={640}
                                        height={640}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover object-[50%_18%]"
                                        style={{
                                            filter: "grayscale(1) contrast(1.05) brightness(0.82)",
                                        }}
                                    />
                                </picture>
                                {/* Violet duotone hue — keeps luminance, shifts
                                    the grayscale toward the system accent. */}
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{
                                        background: "var(--primary)",
                                        mixBlendMode: "color",
                                        opacity: 0.55,
                                    }}
                                />
                                {/* Top-left violet rim-light. */}
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, color-mix(in srgb, var(--primary-hover) 55%, transparent), transparent 45%)",
                                        mixBlendMode: "screen",
                                    }}
                                />
                                {/* Sink the busy source background into the void. */}
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{
                                        background:
                                            "linear-gradient(to bottom, transparent 42%, var(--background))",
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Readability scrim: luminance-elevated surface (subtle border +
                        tint) keeps text >= 4.5:1 over the orb */}
                    <motion.div
                        variants={scaleIn}
                        {...card}
                        className="relative rounded-xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-8"
                    >
                        <Beacon hot={ctaHot} askKey={askCount} />

                        {/* PRIMARY CTA — dominant, filled violet. Wrapped in a
                            magnetic-lean layer (jc-hrn): the site's biggest ask
                            leans toward the cursor. Framer drives the wrapper's
                            `transform`; the pill keeps its own hover/active
                            classes on `scale`/`background` (Tailwind v4 uses
                            individual props, so the two compose, never fight).
                            The lean is fine-pointer + motion-safe gated inside
                            useMagnetic — coarse/reduced-motion get a static
                            pill. */}
                        {primary ? (
                            <motion.div {...emailBind} className="relative">
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
                                    // ONE primary-CTA voice (jc-nc1): filled violet PILL,
                                    // sans, sentence case — same shape as the hero's
                                    // "Email me" CTA.
                                    className="group glow-primary cta-sheen flex min-h-11 items-center justify-between gap-4 rounded-full bg-primary-cta px-7 py-4 text-white transition-[background-color,transform,box-shadow] hover:bg-primary-cta-hover active:scale-[0.97]"
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
                                            <span className="line-clamp-2 break-all font-mono text-xs tracking-wide text-white/80 sm:truncate">
                                                {primary.displayLabel}
                                            </span>
                                        </span>
                                    </span>
                                    {/* Wrapper carries the magnetic parallax
                                        (framer `transform`); the icon keeps its
                                        own hover nudge on `translate`/`scale`
                                        (jc-rdm), so the arrow leads the pill a
                                        hair toward the cursor. */}
                                    <motion.span
                                        {...emailIconBind}
                                        className="inline-flex shrink-0"
                                    >
                                        <ArrowUpRight
                                            aria-hidden="true"
                                            // Same hover micro-language as the dock + link
                                            // rows (jc-rdm): a 1px up-right nudge + faint
                                            // grow, motion-safe-gated so reduced motion is
                                            // fully static. White-on-violet, so no warm.
                                            className="h-6 w-6 origin-center transition-transform motion-safe:group-hover:-translate-y-px motion-safe:group-hover:translate-x-px motion-safe:group-hover:scale-[1.06]"
                                        />
                                    </motion.span>
                                </a>
                            </motion.div>
                        ) : null}

                        {/* jc-jmg: mailto is a dead-end without a mail handler, so
                            offer a copy-to-clipboard escape hatch beside it. The
                            pill above stays the primary click; this is the quiet
                            secondary affordance. Success flips to a cyan check +
                            "Copied" — the reserved answer grammar — announced via
                            aria-live, then steps back after a beat. Pure state
                            swap, no travel, so it is identical under reduced
                            motion. 44px touch target via min-h-11. */}
                        {primary ? (
                            <button
                                type="button"
                                onClick={copyEmail}
                                aria-live="polite"
                                className="group -mx-2 mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-mono text-xs tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)]"
                            >
                                {copied ? (
                                    <>
                                        <Check
                                            aria-hidden="true"
                                            className="h-4 w-4 shrink-0 text-accent"
                                        />
                                        <span className="text-accent">
                                            Copied to clipboard
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Copy
                                            aria-hidden="true"
                                            className="h-4 w-4 shrink-0 text-subtle-foreground transition-colors group-hover:text-primary"
                                        />
                                        <span className="text-subtle-foreground transition-colors group-hover:text-foreground">
                                            Copy email address
                                        </span>
                                    </>
                                )}
                            </button>
                        ) : null}

                        {/* SECONDARY links — clearly subordinate */}
                        <ul className="mt-6 grid grid-cols-1 gap-2 text-left">
                            {secondary.map((link, index) => (
                                <ContactLink
                                    key={link.key}
                                    link={link}
                                    delay={0.24 + index * STAGGER.tight}
                                />
                            ))}
                        </ul>

                        {/* Credibility markers — verifiable, derived from resumeData.
                            One restrained terminal flourish: the ~/ prompt glyph. */}
                        <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-subtle pt-6 text-xs label">
                            <li aria-hidden="true" className="text-subtle-foreground">
                                ~/
                            </li>
                            {credibility.map((marker) => (
                                <li key={marker}>{marker}</li>
                            ))}
                        </ul>

                        {/* The card's cyan ANSWER — the DOM twin of the ribbon's
                            shader shimmer. Keyed off askCount (bumped in the same
                            handler as useBeamStore.ask()), so this border-glow
                            ripples the instant the ribbon shimmers. Cyan exists
                            ONLY for this ~0.9s ripple — answer-only, never
                            standing/ambient. inset-0 rides the card's padding box,
                            so the ring hugs the real border; the box-shadow blooms
                            the edge outward then fades. */}
                        {askCount > 0 && !reduced && (
                            <motion.div
                                key={askCount}
                                aria-hidden="true"
                                data-answer-border=""
                                className="pointer-events-none absolute inset-0 rounded-[inherit] border border-accent"
                                initial={{ opacity: 0.9 }}
                                animate={{
                                    opacity: [0.9, 0.6, 0],
                                    // Every length carries an explicit px so
                                    // all three keyframes share one template
                                    // (unitless "0" vs "28px" would break the
                                    // framer-motion box-shadow interpolation).
                                    boxShadow: [
                                        "0px 0px 0px 0px rgba(45,212,191,0), inset 0px 0px 10px 0px rgba(45,212,191,0.3)",
                                        "0px 0px 28px 3px rgba(45,212,191,0.45), inset 0px 0px 20px 0px rgba(45,212,191,0.25)",
                                        "0px 0px 48px 10px rgba(45,212,191,0), inset 0px 0px 26px 0px rgba(45,212,191,0)",
                                    ],
                                }}
                                transition={{
                                    duration: 0.9,
                                    times: [0, 0.4, 1],
                                    ease: "easeOut",
                                }}
                            />
                        )}
                        {askCount > 0 && reduced && rmAnswer && (
                            <div
                                aria-hidden="true"
                                data-answer-border-flash=""
                                className="pointer-events-none absolute inset-0 rounded-[inherit] border border-accent"
                                style={{
                                    opacity: 0.7,
                                    boxShadow:
                                        "0 0 24px 2px rgba(45,212,191,0.4), inset 0 0 18px 0 rgba(45,212,191,0.25)",
                                }}
                            />
                        )}
                    </motion.div>
                </div>
            </Container>
        </section>
    );
}
