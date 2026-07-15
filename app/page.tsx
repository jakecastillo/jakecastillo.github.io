"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Check, Cloud, Copy, GraduationCap, Github, Mail, MapPin } from "lucide-react";
import { fadeUp, heroCascade, heroChild, heroStagger, heroTerminal } from "@/components/motion";
import TerminalTyping from "@/components/TerminalTyping";
import StageManager from "@/components/StageManager";
import ActPhilosophy from "@/components/ActPhilosophy";
import ActExperience from "@/components/ActExperience";
import ActSkills from "@/components/ActSkills";
import ActContact from "@/components/ActContact";
import HeaderTypewriter from "@/components/HeaderTypewriter";
import TiltEnable from "@/components/TiltEnable";
import Container from "@/components/Container";
import HeroUnderline from "@/components/beam/HeroUnderline";
import { useBeamStore } from "@/hooks/useBeamStore";
import { useScrollStore } from "@/hooks/useScrollStore";
import { resumeData } from "@/data/resume";

const pills = [
  { label: "AWS Solutions Architect", icon: Cloud },
  { label: "B.S. Computer Engineering · UH Manoa", icon: GraduationCap },
  { label: "Honolulu, HI", icon: MapPin },
];

export default function Home() {
  const bootDone = useBeamStore((s) => s.bootDone);
  const bootPlayed = useBeamStore((s) => s.bootPlayed);
  const heroState = bootDone ? "show" : "hidden";

  // Fade the hero SCROLL cue out over the first sliver of scroll: it shares the
  // left gutter with the fixed act rail, so once the page moves the rail owns
  // that lane and the cue must clear it (scroll-linked, so it stays calm under
  // reduced motion — opacity only).
  const { scrollY } = useScroll();
  const scrollCueOpacity = useTransform(scrollY, [0, 160], [1, 0]);

  // Forward path INTO the journey (jc-zww): a "See the work" affordance beside
  // the two exit CTAs (mailto + GitHub both leave the site). It flies to the
  // Experience act using the EXACT same Lenis mechanism the dock uses
  // (Navigation.handleNavClick) — distance-scaled duration, shared exp easing,
  // -8px offset — so the invitation and the dock resolve to one flight grammar.
  // Degrades to a native #exp anchor jump when JS/Lenis is unavailable.
  const lenis = useScrollStore((s) => s.lenis);
  const handleSeeWork = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("exp");
    if (!target) return; // let the native anchor resolve
    event.preventDefault();
    if (lenis) {
      const distance = Math.abs(target.getBoundingClientRect().top);
      lenis.scrollTo(target, {
        offset: -8,
        duration: Math.min(2.2, 0.9 + distance / 4500),
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    window.history.replaceState(null, "", "#exp");
  };

  // Copy-to-clipboard for the primary CTA (jc-67x): the "Email me" pill is a raw
  // mailto that dead-ends on handler-less machines. A split-action copy glyph
  // sits beside it — primary click stays mailto; this lifts the address to the
  // clipboard with a cyan-tick confirmation (cyan = the answer beat). The
  // execCommand path is the fallback for browsers without the async Clipboard
  // API (mirrors the terminal's own `copy email` command).
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );
  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resumeData.email);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = resumeData.email;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions/secure-context): the mailto pill remains
      // the working primary path, so no user-facing error is needed here.
    }
  };

  return (
    <div className="relative w-full">
      <StageManager />

      {/* Act I: The Statement */}
      <section
        id="home"
        aria-label="Introduction"
        className="relative flex min-h-screen items-center pt-24 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-24"
      >
        <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Identity + CTAs — a readable card on mobile, and a whisper of the
              same scrim at lg (jc-l14): the tagline/paragraph cross the fixed
              holo mesh at 1440/1920, so the full-bleed lg column keeps a quiet
              bg-surface veil + light blur (borderless, shadowless — reads as
              local darkening, not a card) instead of going fully transparent.
              Contrast verified analytically (jc-x1n): the mesh wires render at
              0.1–0.3 opacity over #060608, so the brightest realistic pixel is
              a violet-wire crossing (L~0.083). Compositing surface #0c0c10 @55%
              over it (sRGB source-over) yields L~0.024; muted-foreground
              #a7a7b4 text then measures 5.9:1 (tagline #ededf2 far higher) —
              clears WCAG 4.5:1 with margin. Bumped /50 → /55 for headroom.
              When the boot overlay actually plays (bootPlayed), the identity
              children snap to `hidden` under the opaque veil, then cascade
              name → title → tagline as the veil clears. On skip/reduced/repeat
              paths `animate` stays undefined: the SSR-static hero is LCP. */}
          <motion.div
            variants={heroCascade}
            initial={false}
            animate={bootPlayed ? heroState : undefined}
            className="flex flex-col items-start gap-6 rounded-3xl border border-border-subtle bg-surface/80 px-5 py-7 text-left shadow-[var(--shadow-elev-1)] backdrop-blur sm:p-9 lg:col-span-7 lg:border-0 lg:bg-surface/55 lg:shadow-none lg:backdrop-blur-[3px]"
          >
            <motion.div variants={heroChild} initial={false} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="relative inline-block h-11 w-11 shrink-0 rounded-full bg-primary p-[2px]">
                <span className="block h-full w-full overflow-hidden rounded-full border-2 border-background">
                  <picture>
                    <source srcSet="/portrait/jake-320.avif" type="image/avif" />
                    <source srcSet="/portrait/jake-320.webp" type="image/webp" />
                    <img
                      src="/portrait/jake-320.jpg"
                      alt="Jake Castillo"
                      width={44}
                      height={44}
                      fetchPriority="high"
                      className="h-full w-full object-cover"
                    />
                  </picture>
                </span>
              </span>
              {/* data-boot-anchor: BootIgnition measures this span's rect (the
                  SSR-static layout IS the final layout) so the boot line can
                  land exactly on HeroUnderline's rect before the crossfade. */}
              <span
                data-boot-anchor
                className="relative inline-block text-xs label"
              >
                {resumeData.name}
                <HeroUnderline />
              </span>
              {/* Job title demoted here (jc-if4): the H1 now carries the
                  manifesto, so the résumé role rides the eyebrow as a quiet
                  qualifier next to the name. */}
              <span aria-hidden="true" className="text-xs label text-subtle-foreground">
                ·
              </span>
              <span className="text-xs label text-subtle-foreground">
                {resumeData.role}
              </span>
            </motion.div>

            <motion.div variants={heroChild} initial={false}>
              <HeaderTypewriter />
            </motion.div>

            {/* Hero tagline — human voice, deduped (jc-78t): the recycled
                résumé-objective sentence (resumeData.tagline / summary) is
                retired from the first viewport; this one line does the
                positioning job. Location stays on the pill row, not here. */}
            <motion.p
              variants={heroChild}
              initial={false}
              className="measure text-balance text-xl font-medium text-foreground sm:text-2xl"
            >
              I architect and ship cloud solutions, end to end.
            </motion.p>

            <motion.div
              variants={heroStagger}
              custom={bootPlayed ? 0.55 : 0.04}
              initial="hidden"
              animate={heroState}
              className="flex w-full flex-col items-start gap-6"
            >
              {/* Proof paragraph (jc-78t, jc-396): concrete track record in
                  place of the paraphrased objective — PROTECTIVE posture: no
                  client or system names anywhere on the site (owner decision
                  after a security review). All facts live in data/resume.ts;
                  the span (Jan 2020 CIMP intern → present) supports "six
                  years". No invented numbers. */}
              <motion.p
                variants={fadeUp}
                className="measure text-base text-muted-foreground"
              >
                Six years building for government, education, and healthcare
                teams — from legacy modernization to cloud-native delivery.
                AWS-certified architect; DevSecOps by default.
              </motion.p>

              <motion.ul variants={fadeUp} className="flex flex-wrap gap-2">
                {pills.map((p) => (
                  <li
                    key={p.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm"
                  >
                    <p.icon size={13} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-primary" />
                    {p.label}
                  </li>
                ))}
              </motion.ul>

              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-1">
                {/* Split-action: mailto stays the primary click; the adjacent
                    glyph copies the address so handler-less machines aren't a
                    dead-end (jc-67x). */}
                <div className="inline-flex items-center gap-2">
                  <a
                    href={`mailto:${resumeData.email}`}
                    className="cta-sheen group inline-flex items-center gap-2 rounded-full bg-primary-cta px-6 py-3 font-medium text-primary-foreground shadow-[var(--glow-primary)] transition-[background-color,transform,box-shadow] hover:bg-primary-cta-hover active:scale-[0.97]"
                  >
                    <Mail size={18} strokeWidth={2} aria-hidden="true" />
                    Email me
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    aria-label="Copy email address"
                    className="group relative inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface/60 text-muted-foreground backdrop-blur-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.92]"
                  >
                    {copied ? (
                      <Check size={16} strokeWidth={2.5} aria-hidden="true" className="text-accent" />
                    ) : (
                      <Copy
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="origin-center transition-transform motion-safe:group-hover:-translate-y-px motion-safe:group-hover:scale-[1.06]"
                      />
                    )}
                    {/* Confirmation — cyan tick is the answer beat; the pill
                        echoes the dock tooltip grammar. Opacity-only reveal so
                        reduced motion needs no separate path. */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-surface-overlay px-2.5 py-1 text-xs font-medium leading-none tracking-wide text-accent shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_8px_24px_-18px_rgba(0,0,0,0.5)] transition-opacity duration-200 ${
                        copied ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      Copied
                    </span>
                  </button>
                  {/* Reliable AT announcement: text content flips empty →
                      filled on copy, which screen readers voice. */}
                  <span role="status" aria-live="polite" className="sr-only">
                    {copied ? "Email address copied to clipboard" : ""}
                  </span>
                </div>
                <a
                  href={resumeData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View GitHub profile"
                  className="link-underline group inline-flex min-h-[44px] items-center gap-2 px-2 py-3 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Github size={18} strokeWidth={2} aria-hidden="true" />
                  GitHub
                  <ArrowUpRight size={14} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </motion.div>

              {/* Journey invitation (jc-zww): the only affordance that leads
                  INTO the page rather than off it. A ghost mono link — same
                  weight/idiom as GitHub above, never a competing pill — with a
                  descending arrow that reads as "go down into the work". */}
              <motion.a
                variants={fadeUp}
                href="#exp"
                onClick={handleSeeWork}
                className="link-underline group inline-flex min-h-[44px] items-center gap-2 px-2 py-3 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                See the work
                <ArrowDown
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="transition-transform motion-safe:group-hover:translate-y-0.5"
                />
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Signature: interactive terminal — answers 0.5s after the identity
              column leads (delay baked into the heroTerminal variant; a
              `transition` prop here would be dead code against it). */}
          {/* Bottom-align the terminal to the identity card's CTA baseline
              (jc-if4): the grid is items-center, so a shorter terminal used to
              float mid-cell and leave a dead zone beneath it at 1440x900.
              self-end drops the cell to the row's bottom (the tall identity
              card defines it); the lg:pb-9 offset lifts the terminal's status
              bar back up by the card's own bottom padding (p-9) so it lands on
              the CTA row, not the card's outer edge. */}
          <motion.div
            variants={heroTerminal}
            custom={bootPlayed ? 0.65 : 0}
            initial="hidden"
            animate={heroState}
            className="flex w-full flex-col lg:col-span-5 lg:self-stretch"
          >
            {/* HUD annotation cluster (jc-67x) — settles the upper-right void
                above the console at lg without adding a competing element: a
                quiet mono readout in the console's own leader-dot grammar. The
                coordinate is Honolulu at city resolution (already disclosed on
                the location pill — no new/identifying data); the beam-linked
                node echoes the terminal's `link BEAM ok`. Ambient violet dot
                (cyan stays reserved for answer beats); no motion, so reduced
                motion needs no branch. Desktop-only: the mobile stack has no
                void to fill. mt-auto below drops the terminal to the same CTA
                baseline it held before (was lg:self-end + lg:pb-9). */}
            <div
              aria-hidden="true"
              className="hidden font-mono text-[0.6875rem] uppercase leading-relaxed tracking-[0.2em] text-subtle-foreground lg:flex lg:flex-col lg:items-end lg:gap-1 lg:pb-8 lg:pr-1"
            >
              <span>21.3&deg; N &middot; 157.9&deg; W</span>
              <span className="flex items-center gap-2">
                <span>beam</span>
                <span className="text-muted-foreground">linked</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_1px_rgba(139,92,246,0.55)]" />
              </span>
            </div>
            <div className="lg:mt-auto lg:pb-9">
              <TerminalTyping />
            </div>
          </motion.div>
        </Container>

        {/* Scroll indicator — offset to the left gutter so it clears the
            centered quick-nav dock (which owns the bottom-center lane). */}
        <motion.div
          style={{ opacity: scrollCueOpacity }}
          aria-hidden="true"
          className="absolute bottom-8 left-6 flex flex-col items-center gap-2 text-muted-foreground sm:left-10 lg:left-12"
        >
          <span className="text-xs label">Scroll</span>
          <ArrowDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
        </motion.div>

        {/* Tilt affordance — mirrors the scroll cue in the right gutter. Inert on
            desktop / reduced-motion; self-reveals only on touch devices. */}
        <div className="absolute bottom-8 right-6 sm:right-10 lg:right-12">
          <TiltEnable />
        </div>
      </section>

      {/* Act II: Philosophy */}
      <div id="about">
        <ActPhilosophy />
      </div>

      {/* Act III: Experience & Skills */}
      <div id="exp">
        <ActExperience />
      </div>
      <div id="skills">
        <ActSkills />
      </div>

      {/* Act IV: Connection */}
      <div id="contact">
        <ActContact />
      </div>
    </div>
  );
}
