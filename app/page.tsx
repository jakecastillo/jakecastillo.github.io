"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Cloud, GraduationCap, Github, Mail, MapPin } from "lucide-react";
import TerminalTyping from "@/components/TerminalTyping";
import StageManager from "@/components/StageManager";
import ActPhilosophy from "@/components/ActPhilosophy";
import ActExperience from "@/components/ActExperience";
import ActSkills from "@/components/ActSkills";
import ActContact from "@/components/ActContact";
import HeaderTypewriter from "@/components/HeaderTypewriter";
import Container from "@/components/Container";
import { resumeData } from "@/data/resume";

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.04 + i * 0.04, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const pills = [
  { label: "AWS Solutions Architect", icon: Cloud },
  { label: "B.S. Computer Engineering · UH Manoa", icon: GraduationCap },
  { label: "Honolulu, HI", icon: MapPin },
];

export default function Home() {
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
              where it stacks above the terminal over the living background. */}
          <div className="flex flex-col items-start gap-6 rounded-3xl border border-border-subtle bg-surface/80 px-5 py-7 text-left shadow-[var(--shadow-elev-1)] backdrop-blur sm:p-9 lg:col-span-7 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <motion.div
              custom={0}
              variants={reveal}
              initial={false}
              animate="show"
              className="flex items-center gap-3"
            >
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
              <span className="font-mono text-sm uppercase tracking-[0.35em] text-accent">
                {resumeData.name}
              </span>
            </motion.div>

            <motion.div custom={1} variants={reveal} initial={false} animate="show">
              <HeaderTypewriter />
            </motion.div>

            <motion.p
              custom={2}
              variants={reveal}
              initial={false}
              animate="show"
              className="measure text-balance text-xl font-medium text-foreground sm:text-2xl"
            >
              {resumeData.tagline}
            </motion.p>

            <motion.p
              custom={3}
              variants={reveal}
              initial={false}
              animate="show"
              className="measure text-base text-muted-foreground"
            >
              A strong foundation in engineering principles across platforms and
              technologies, with a focus on back-end and cloud development/architecture
              (AWS) &mdash; and a drive to give back to the community.
            </motion.p>

            <motion.ul
              custom={4}
              variants={reveal}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2"
            >
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

            <motion.div
              custom={5}
              variants={reveal}
              initial="hidden"
              animate="show"
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <a
                href={`mailto:${resumeData.email}`}
                className="group inline-flex items-center gap-2 rounded-full bg-primary-cta px-6 py-3 font-medium text-primary-foreground shadow-[var(--glow-primary)] transition-colors hover:bg-primary-cta-hover"
              >
                <Mail size={18} strokeWidth={2} aria-hidden="true" />
                Email me
              </a>
              <a
                href={resumeData.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View GitHub profile"
                className="group inline-flex min-h-[44px] items-center gap-2 px-2 py-3 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Github size={18} strokeWidth={2} aria-hidden="true" />
                GitHub
                <ArrowUpRight size={14} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </div>

          {/* Signature: interactive terminal */}
          <motion.div
            custom={6}
            variants={reveal}
            initial="hidden"
            animate="show"
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
