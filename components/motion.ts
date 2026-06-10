import type { Variants } from "framer-motion";

// Shared reveal vocabulary. MotionProvider uses reducedMotion="user", so the
// x/y/scale transform keys are auto-dropped under prefers-reduced-motion,
// leaving a gentle opacity fade — no per-component branching required.
const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

// Signature "laser wipe" — a left-to-right clip reveal that rhymes with the
// holo boot's scanline. NOTE: MotionConfig reducedMotion="user" does NOT
// auto-drop clipPath, so consumers MUST branch to fadeUp under reduced motion
// (see ActPhilosophy/ActSkills/ActContact). Use on section headings only.
export const clipReveal: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
  show: {
    clipPath: "inset(0 0 0 0)",
    opacity: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

export const viewportOnce = { once: true, amount: 0.2 } as const;
