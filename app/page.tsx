"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Cloud, GraduationCap, Github, Mail, MapPin } from "lucide-react";
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
                positioning job. Facts only: cloud/AWS work, Honolulu base. */}
            <motion.p
              variants={heroChild}
              initial={false}
              className="measure text-balance text-xl font-medium text-foreground sm:text-2xl"
            >
              I architect and ship cloud solutions, end to end &mdash; from
              Honolulu.
            </motion.p>

            <motion.div
              variants={heroStagger}
              custom={bootPlayed ? 0.55 : 0.04}
              initial="hidden"
              animate={heroState}
              className="flex w-full flex-col items-start gap-6"
            >
              {/* Proof paragraph (jc-78t, jc-oer): concrete track record in
                  place of the paraphrased objective — scope + stacks only, no
                  client systems or application names (owner decision). All
                  facts live in data/resume.ts; the span (Jan 2020 CIMP intern
                  → present) supports "six years". No invented numbers. */}
              <motion.p
                variants={fadeUp}
                className="measure text-base text-muted-foreground"
              >
                Six years shipping for government, education, and healthcare
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
                <a
                  href={`mailto:${resumeData.email}`}
                  className="cta-sheen group inline-flex items-center gap-2 rounded-full bg-primary-cta px-6 py-3 font-medium text-primary-foreground shadow-[var(--glow-primary)] transition-[background-color,transform,box-shadow] hover:bg-primary-cta-hover active:scale-[0.97]"
                >
                  <Mail size={18} strokeWidth={2} aria-hidden="true" />
                  Email me
                </a>
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
            className="w-full lg:col-span-5 lg:self-end lg:pb-9"
          >
            <TerminalTyping />
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
