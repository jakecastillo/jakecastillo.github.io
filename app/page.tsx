"use client";

import { motion } from "framer-motion";
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

  return (
    <div className="relative w-full">
      <StageManager />

      {/* Act I: The Statement */}
      <section
        id="home"
        aria-label="Introduction"
        className="relative flex min-h-screen items-center py-24"
      >
        <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Identity + CTAs — open on desktop; carries a readable card on mobile,
              where it stacks above the terminal over the living background.
              When the boot overlay actually plays (bootPlayed), the identity
              children snap to `hidden` under the opaque veil, then cascade
              name → title → tagline as the veil clears. On skip/reduced/repeat
              paths `animate` stays undefined: the SSR-static hero is LCP. */}
          <motion.div
            variants={heroCascade}
            initial={false}
            animate={bootPlayed ? heroState : undefined}
            className="flex flex-col items-start gap-6 rounded-3xl border border-border-subtle bg-surface/80 px-5 py-7 text-left shadow-[var(--shadow-elev-1)] backdrop-blur sm:p-9 lg:col-span-7 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none"
          >
            <motion.div variants={heroChild} initial={false} className="flex items-center gap-3">
              <span className="relative inline-block h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
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
                className="relative inline-block font-mono text-sm uppercase tracking-[0.35em] text-accent"
              >
                {resumeData.name}
                <HeroUnderline />
              </span>
            </motion.div>

            <motion.div variants={heroChild} initial={false}>
              <HeaderTypewriter />
            </motion.div>

            <motion.p
              variants={heroChild}
              initial={false}
              className="measure text-balance text-xl font-medium text-foreground sm:text-2xl"
            >
              {resumeData.tagline}
            </motion.p>

            <motion.div
              variants={heroStagger}
              custom={bootPlayed ? 0.55 : 0.04}
              initial="hidden"
              animate={heroState}
              className="flex w-full flex-col items-start gap-6"
            >
              <motion.p
                variants={fadeUp}
                className="measure text-base text-muted-foreground"
              >
                A strong foundation in engineering principles across platforms and
                technologies, with a focus on back-end and cloud development/architecture
                (AWS) &mdash; and a drive to give back to the community.
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
                  className="cta-sheen group inline-flex items-center gap-2 rounded-full bg-primary-cta px-6 py-3 font-medium text-primary-foreground shadow-[var(--glow-primary)] transition-colors hover:bg-primary-cta-hover"
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
          <motion.div
            variants={heroTerminal}
            custom={bootPlayed ? 0.65 : 0}
            initial="hidden"
            animate={heroState}
            className="w-full lg:col-span-5"
          >
            <TerminalTyping />
          </motion.div>
        </Container>

        {/* Scroll indicator — offset to the left gutter so it clears the
            centered quick-nav dock (which owns the bottom-center lane). */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          aria-hidden="true"
          className="absolute bottom-8 left-6 flex flex-col items-center gap-2 text-muted-foreground sm:left-10 lg:left-12"
        >
          <span className="font-mono text-xs uppercase tracking-widest">Scroll</span>
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
