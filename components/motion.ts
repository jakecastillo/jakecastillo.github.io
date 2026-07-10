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

/* ---- Hero boot handoff choreography ------------------------------------
   setBootDone() fires when the boot line LANDS on the hero underline's rect
   (~1.2s; the veil's compositor fade is already done at ~1.1s). delayChildren
   0.15 starts the identity cascade just after the landing settles — the name
   rises up to MEET the landed line, which then crossfades 1:1 into
   HeroUnderline. Identity leads (0.15s), the terminal answers 0.5s later
   (0.65s). All delays are custom-driven so the skip/repeat/reduced paths
   stay instant. */

/** Identity column container — cascades name → title → tagline. */
export const heroCascade: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.15, staggerChildren: 0.1 } },
};

/** Identity column child. Instant to `hidden` (it happens under the opaque
    veil), 0.5s settle to `show`. */
export const heroChild: Variants = {
  hidden: { opacity: 0, y: 12, transition: { duration: 0 } },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Secondary hero block (description/pills/CTAs) — delay via `custom` so it
    follows the identity cascade on boot, but fires immediately on skip. */
export const heroStagger: Variants = {
  hidden: {},
  show: (delay: number = 0.04) => ({
    transition: { staggerChildren: 0.08, delayChildren: delay },
  }),
};

/** Terminal reveal — delay lives IN the variant transition (a `transition`
    prop on the component loses to the variant's own transition, which is how
    the old 0.55s delay became dead code). `custom` supplies the delay. */
export const heroTerminal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE, delay },
  }),
};

export const viewportOnce = { once: true, amount: 0.2 } as const;
