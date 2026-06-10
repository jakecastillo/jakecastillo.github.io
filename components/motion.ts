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

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

export const viewportOnce = { once: true, amount: 0.2 } as const;
