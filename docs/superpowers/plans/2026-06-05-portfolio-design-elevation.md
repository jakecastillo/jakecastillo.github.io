# Portfolio Design Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the Philosophy section into a general "Build Where the Risk Lives" solutions-architect process spine + architecture schematic, de-cliché the hero wordmark, add tactile/reveal polish, and make mobile invigorating (gyro tilt) — without changing any copy outside "How I Build."

**Architecture:** Surgical edits to an existing Next.js 16 / React 19 / Tailwind 4 / Framer Motion / React Three Fiber site ("Void & Laser" design system). New isolated components (`ProcessSpine`, `ArchitectureSchematic`, `TouchActive`, `TiltEnable`) + a shared `motion.ts` variant module; targeted edits to existing acts. Two parallel agents on disjoint files, then gyro as a follow-up, then verification.

**Tech Stack:** Next.js (app router, static export), React 19, Tailwind v4 (CSS-token theme in `app/globals.css`), Framer Motion (`MotionConfig reducedMotion="user"`), React Three Fiber + drei + postprocessing, Lenis, zustand, lucide-react.

---

## Project-specific conventions (READ FIRST — overrides the skill defaults)

- **No test runner exists** in this repo (no vitest/jest/playwright wired up). "Verification" for every task = `npm run typecheck` + `npm run lint` + `npm run build` all clean, **plus** the concrete visual/behavioral acceptance criteria listed per task. There are no unit-test steps.
- **Do NOT git commit or push.** Conservative profile: all work stays in the working tree for owner review. A single commit/branch decision happens at the very end, only if the owner asks. Ignore the skill's per-task "Commit" steps.
- **Design system:** dark Void & Laser. Tokens in `app/globals.css`: `--primary` (#8b5cf6 violet), `--accent` (#2dd4bf cyan, rare "signal"), `--foreground`, `--muted-foreground`, surface ladder (`--surface`…`--surface-overlay`), `--border*`. Utilities: `.panel`, `.text-glow`, `.glow-primary`, `.measure`/`.measure-narrow`, `.section-y`, `.container-page`, fluid `text-3xl…text-9xl`.
- **Reduced motion:** the app wraps everything in `MotionConfig reducedMotion="user"` (`components/MotionProvider.tsx`) which auto-drops `x`/`y`/`scale` transform keys, leaving opacity. So Framer variants need NO per-component reduced-motion branch — EXCEPT scroll-linked values (`useTransform` of scroll), which must be guarded with `useReducedMotion()` explicitly.
- **SSR safety:** components must render identical markup on server and first client paint. Don't branch markup on `useReducedMotion()`/`matchMedia` at render time without the established `useState(false)`-then-upgrade-in-effect pattern.
- **No fabricated metrics / no copy changes** anywhere except the "How I Build" block (already approved). The `ArchitectureSchematic` must be representative/illustrative only.

## File structure

| File | Responsibility | Action |
|------|----------------|--------|
| `components/HeaderTypewriter.tsx` | Hero H1 | Edit (de-gradient) |
| `components/motion.ts` | Shared reveal/stagger variants | Create |
| `components/TouchActive.tsx` | iOS `:active` enabler | Create |
| `app/layout.tsx` | Root layout | Edit (mount `TouchActive`) |
| `components/ActSkills.tsx` | Stack + certs | Edit (tap feedback, cert reveal) |
| `components/ActExperience.tsx` | Work timeline | Edit (static-list reveal variety only; immersive untouched) |
| `components/ActContact.tsx` | Contact | Edit (reveal variety) |
| `components/ProcessSpine.tsx` | Numbered scroll-drawn process spine | Create |
| `components/ArchitectureSchematic.tsx` | "Build where the risk lives" diagram | Create |
| `components/ActPhilosophy.tsx` | Philosophy section | Rewrite (vertical; spine + schematic + new copy; remove horizontal pin) |
| `hooks/useTiltStore.ts` | Shared "tilt enabled" flag | Create |
| `components/TiltEnable.tsx` | Icon-only tap-to-enable-tilt affordance | Create |
| `app/page.tsx` | Home | Edit (mount `TiltEnable` in hero) |
| `components/canvas/HoloLattice.tsx` | WebGL holo | Edit (gyro input) |

## Agent decomposition

- **Agent A (Philosophy):** Tasks 5 → 6 → 7 (one agent end-to-end; owns `ActPhilosophy.tsx` + the two new components). Touches NO other act and NOT `globals.css`.
- **Agent B (polish):** Tasks 1 → 2 → 3 → 4 (hero de-gradient, `motion.ts`, tap feedback, reveal variety). Owns `globals.css` if any utility is needed. Touches NO Philosophy files.
- **Agent C (gyro):** Task 8, dispatched only after A & B land and verify.
- **Then:** Task 9 verification (orchestrator).

Agents A and B run in parallel (disjoint files). Each runs its own `npm run typecheck && npm run lint && npm run build` before reporting.

---

### Task 1: Hero wordmark de-gradient

**Files:**
- Modify: `components/HeaderTypewriter.tsx`
- Check: `app/globals.css` (`.text-laser` definition, ~line 238)

- [ ] **Step 1: Swap the gradient class for solid violet + glow**

In `components/HeaderTypewriter.tsx`, change the "Software" span:

```tsx
// from:
<span className="text-laser text-glow">Software</span>
// to:
<span className="text-primary text-glow">Software</span>
```

- [ ] **Step 2: Confirm `.text-laser` is otherwise unused**

Run: `grep -rn "text-laser" app components --include=*.tsx --include=*.ts`
Expected: no remaining usages in `.tsx`. Leave the `.text-laser` utility defined in `globals.css` (harmless, no edit needed).

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all clean.
Visual acceptance: hero H1 reads "Software / Engineer." with "Software" a solid violet with the existing soft glow — **no** violet→cyan gradient wash.

---

### Task 2: Shared motion variants

**Files:**
- Create: `components/motion.ts`

- [ ] **Step 1: Create the variant module**

```tsx
// components/motion.ts
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
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: clean (module compiles; unused until Tasks 3–4 import it).

---

### Task 3: Tactile tap feedback (pills, cert cards, iOS enabler)

**Files:**
- Create: `components/TouchActive.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/ActSkills.tsx`

- [ ] **Step 1: Create the iOS `:active` enabler**

```tsx
// components/TouchActive.tsx
"use client";

import { useEffect } from "react";

// iOS Safari only applies :active styles while the document (or an ancestor) has
// a touchstart listener. Register one passive no-op so press-state CSS
// (active:scale / active:border) fires on tap for non-anchor elements too.
export default function TouchActive() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  return null;
}
```

- [ ] **Step 2: Mount it in the layout**

In `app/layout.tsx`, import and render inside `<MotionProvider>` (alongside `<SmoothScroll />`):

```tsx
import TouchActive from "@/components/TouchActive";
// ...inside <MotionProvider>, near <SmoothScroll />:
<TouchActive />
```

- [ ] **Step 3: Add press feedback to skill pills**

In `components/ActSkills.tsx`, the pill `<span>` className — replace `cursor-default` and extend transitions:

```tsx
// from:
className="rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-primary hover:bg-primary-muted cursor-default"
// to:
className="rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-sm text-muted-foreground transition-[color,background-color,border-color,transform,box-shadow] duration-150 hover:text-foreground hover:border-primary hover:bg-primary-muted active:scale-[0.96] active:border-primary active:shadow-[0_0_18px_-6px_rgba(139,92,246,0.55)] cursor-default"
```

- [ ] **Step 4: Add press/hover lift to certification cards**

In `components/ActSkills.tsx`, the cert card `motion.div` className:

```tsx
// from:
className="surface-2 p-8 rounded-lg hover:border-primary transition-colors"
// to:
className="surface-2 p-8 rounded-lg transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--glow-primary)] active:scale-[0.98]"
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all clean.
Acceptance: on a touch device / emulator, tapping a skill pill briefly scales it down + shows a violet edge glow; cert cards lift on hover and scale on press. Under reduced motion the scale is dropped (color/shadow remain). Desktop hover unchanged.

---

### Task 4: Reveal variety across acts (light touch)

**Files:**
- Modify: `components/ActExperience.tsx` (StaticTimeline only)
- Modify: `components/ActSkills.tsx` (cert group)
- Modify: `components/ActContact.tsx`

Goal per research: *variety/intent*, not more motion. Give each act ONE primary axis. Do **not** touch the immersive/horizontal timelines, the hero, or `ActPhilosophy` (Agent A owns that).

- [ ] **Step 1: ActExperience static list → directional reveal + stagger**

In `components/ActExperience.tsx`, `StaticTimeline`'s `<ol>` and `<motion.li>`: import shared variants and convert the opacity-only reveal to `fadeRight` with a container stagger.

```tsx
import { fadeRight, staggerContainer, viewportOnce } from "@/components/motion";
// ...
<motion.ol
  variants={staggerContainer}
  initial="hidden"
  whileInView="show"
  viewport={viewportOnce}
  className="relative flex flex-col gap-16 border-l border-border-subtle pl-8 sm:pl-10"
>
  {resumeData.experience.map((job, index) => (
    <motion.li key={index} variants={fadeRight}>
      <TimelineNode job={job} index={index} total={total} variant="vertical" />
    </motion.li>
  ))}
</motion.ol>
```
(Remove the old per-li `initial/whileInView/transition` opacity props now handled by variants.)

- [ ] **Step 2: ActSkills cert cards → scaleIn**

In `components/ActSkills.tsx`, change the cert card `motion.div` `variants={item}` to `variants={scaleIn}` (import `scaleIn` from `@/components/motion`). Leave the skill-group pills using the existing local `item` variant (already staggered) to avoid churn.

- [ ] **Step 3: ActContact → fadeUp on the action card**

In `components/ActContact.tsx`, leave the left-column `reveal()` calls as-is (they already read well), but give the right-hand action card a distinct entrance: wrap/replace its `{...reveal(0.18)}` with `variants={scaleIn} initial="hidden" whileInView="show" viewport={viewportOnce}` (import `scaleIn`, `viewportOnce`). Keep the secondary-link list reveals unchanged.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all clean.
Acceptance: scrolling reveals now differ per section (timeline slides in from the left rail; cert cards scale in; contact card scales in). Reduced motion → all collapse to opacity fades. No layout shift; `once: true` retained.

---

### Task 5: ProcessSpine component

**Files:**
- Create: `components/ProcessSpine.tsx`

- [ ] **Step 1: Create the component**

A numbered vertical spine with a scroll-drawn connector. Scroll-linked draw is guarded for reduced motion (rail shown full + static).

```tsx
// components/ProcessSpine.tsx
"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export type ProcessStep = { index: string; title: string; body: string };

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ProcessSpine({ steps }: { steps: ProcessStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  // Connector draws top→bottom as the list passes through the reading zone.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 65%"],
  });
  const drawn = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <ol ref={ref} className="relative flex flex-col gap-10 pl-8 sm:gap-12 sm:pl-10">
      {/* Rail track (faint, full height) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[3px] top-3 bottom-3 w-px bg-border-subtle"
      />
      {/* Drawn rail — scroll-linked; full + static under reduced motion */}
      <motion.span
        aria-hidden="true"
        style={{ scaleY: reduced ? 1 : drawn }}
        className="pointer-events-none absolute left-[3px] top-3 bottom-3 w-px origin-top bg-primary glow-primary"
      />

      {steps.map((step, i) => (
        <motion.li
          key={step.index}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.4, ease: EASE, delay: i * 0.04 }}
          className="relative"
        >
          {/* Node dot on the rail */}
          <span
            aria-hidden="true"
            className="absolute -left-8 top-2 h-2.5 w-2.5 rounded-full bg-primary glow-primary sm:-left-10"
            style={{ left: "-1.75rem" }}
          />
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tabular-nums tracking-[0.3em] text-accent">
              {step.index}
            </span>
            <h4 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {step.title}
            </h4>
          </div>
          <p className="measure-narrow mt-3 text-base leading-relaxed text-muted-foreground">
            {step.body}
          </p>
        </motion.li>
      ))}
    </ol>
  );
}
```
Note: the node-dot horizontal offset must visually sit on the rail (`left-[3px]`). Tune the dot `left` so it centers on the rail at both `pl-8` and `sm:pl-10`; use a single consistent offset (the rail is at `left-[3px]` relative to the `<ol>`, so the dot should center there). The agent should verify the dot sits on the line and adjust the offset value rather than leaving the inline `style` hack if a Tailwind class is cleaner.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: clean (component compiles; consumed in Task 7).
Acceptance (after Task 7 wires it): on scroll the violet rail draws top→bottom and each step fades in; node dots sit centered on the rail; reduced motion shows the rail fully drawn and static; semantics are `<ol><li>`.

---

### Task 6: ArchitectureSchematic component

**Files:**
- Create: `components/ArchitectureSchematic.tsx`

Visualizes "Build Where the Risk Lives": a proven, boring **platform** wrapping ONE highlighted **"the bet"** module behind a clean seam, with `CI/CD · Security` (top rail) and `Observability` (bottom rail). Representative/illustrative; no fabricated specifics. Accessible.

- [ ] **Step 1: Create the component**

```tsx
// components/ArchitectureSchematic.tsx
"use client";

import { Boxes, Cloud, Database, GitBranch, Activity, Sparkles } from "lucide-react";

// A representative architecture sketch — not a real system diagram of any one
// project. It pictures the philosophy: a proven "boring" platform with one
// isolated, glowing "bet" (the risky/innovative piece) behind a clean seam,
// wrapped by CI/CD+security and observability. Illustrative only.
const platform = [
  { label: "Edge", icon: Cloud },
  { label: "App", icon: Boxes },
  { label: "Services / API", icon: GitBranch },
  { label: "Data", icon: Database },
];

export default function ArchitectureSchematic() {
  return (
    <figure
      role="img"
      aria-label="Architecture sketch: a proven platform — edge, app, services, and data — wrapped by CI/CD and security above and observability below, with one isolated, highlighted 'the bet' module behind a clean interface."
      className="panel p-6 sm:p-8"
    >
      {/* Top rail — CI/CD · Security */}
      <p aria-hidden="true" className="mb-4 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-subtle-foreground">
        <GitBranch size={13} strokeWidth={1.75} className="text-primary" /> CI/CD · Security
      </p>

      <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {platform.map((b) => (
          <div key={b.label} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface/60 px-3 py-3 text-sm text-muted-foreground">
            <b.icon size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
            {b.label}
          </div>
        ))}
      </div>

      {/* The bet — isolated, accent-glowing module behind a seam */}
      <div aria-hidden="true" className="mt-3 flex items-center gap-3 rounded-lg border border-primary/50 bg-primary-muted px-3 py-3 text-sm text-foreground glow-primary">
        <Sparkles size={16} strokeWidth={1.75} className="shrink-0 text-primary" />
        <span className="font-medium">The bet</span>
        <span className="text-subtle-foreground">— the risky, high-value piece, proven behind a clean interface</span>
      </div>

      {/* Bottom rail — Observability */}
      <p aria-hidden="true" className="mt-4 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-subtle-foreground">
        <Activity size={13} strokeWidth={1.75} className="text-accent" /> Observability
      </p>
    </figure>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: clean.
Acceptance: renders a compact, on-brand diagram; the "bet" row visibly stands out (accent border + glow) vs the boring platform blocks; the decorative grid is `aria-hidden` while the `<figure role="img" aria-label>` gives a screen-reader description; reflows 320→1280px (2-col → 4-col). No fabricated metrics/specific product names.

---

### Task 7: ActPhilosophy → vertical composition (spine + schematic + new copy)

**Files:**
- Rewrite: `components/ActPhilosophy.tsx`

Removes the horizontal pin (`useImmersive`/`PhilosophyImmersive`/`PhilosophyStatic`, `useScroll`/`useTransform` horizontal travel — superseded). New single vertical section. Keeps the Belief block copy unchanged; adds the "How I Build" eyebrow + "Build Where the Risk Lives" sub-headline + ProcessSpine + ArchitectureSchematic.

> ✅ **Owner-approved copy change:** the Belief headline becomes "ENGINEER THE / SYSTEMS WE RELY ON." (was "MODERNIZING THE …"), aligning it with the de-modernization reframe. This + the "How I Build" block are the ONLY copy changes in this pass.

- [ ] **Step 1: Replace the file contents**

```tsx
// components/ActPhilosophy.tsx
"use client";

import { motion } from "framer-motion";
import { resumeData } from "@/data/resume";
import ProcessSpine, { type ProcessStep } from "@/components/ProcessSpine";
import ArchitectureSchematic from "@/components/ArchitectureSchematic";

const EASE = [0.16, 1, 0.3, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.4, ease: EASE },
} as const;

// "Build Where the Risk Lives" — general software-solutions + innovator process.
// Owner-approved copy; the ONLY copy change in this pass.
const processSteps: ProcessStep[] = [
  {
    index: "01",
    title: "Find the Constraints",
    body: "I separate the real constraints from the assumptions everyone's stopped questioning, and pressure-test the outcome before any code exists. I'd rather kill a weak idea in a week than build the wrong thing fluently.",
  },
  {
    index: "02",
    title: "Bet Where It Counts",
    body: "I pour design into the few decisions that are expensive to reverse and stay deliberately boring everywhere else — proven tools for the plumbing, so the real risk and invention land where they create value.",
  },
  {
    index: "03",
    title: "Prove the Unknown",
    body: "I build the scariest piece first — the unproven integration, the AI behavior, the assumption it all rests on — and put it in real hands while it's still cheap to be wrong.",
  },
  {
    index: "04",
    title: "Build to Be Changed",
    body: "Security, observability, and an honest record of why each call was made are part of the design, not a cleanup pass — I build for whoever inherits it a year from now, not for how clever it looks today.",
  },
];

export default function ActPhilosophy() {
  return (
    <section className="section-y container-page">
      {/* Belief */}
      <motion.div {...reveal} className="panel flex flex-col p-8 sm:p-12 lg:p-16">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.35em] text-primary">
          02 / approach
        </p>
        <h2 className="text-6xl font-black leading-[1.05] tracking-tight text-foreground [overflow-wrap:anywhere]">
          ENGINEER THE
          <br />
          <span className="text-primary text-glow">SYSTEMS WE RELY ON.</span>
        </h2>
        <div className="mt-8 mb-7 h-px w-12 bg-border-strong" />
        <p className="measure text-lg leading-relaxed text-muted-foreground">
          {resumeData.summary}
        </p>
      </motion.div>

      {/* How I Build */}
      <div className="mt-20 sm:mt-28">
        <motion.header {...reveal} className="mb-10 sm:mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            How I Build
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Build Where the Risk Lives<span className="text-primary">.</span>
          </p>
        </motion.header>

        <ProcessSpine steps={processSteps} />

        <motion.div {...reveal} className="mt-16 sm:mt-20">
          <ArchitectureSchematic />
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Confirm no dangling references**

Run: `grep -rn "ActPhilosophy\|PhilosophyImmersive\|PhilosophyStatic" app components --include=*.tsx`
Expected: `app/page.tsx` imports/uses `ActPhilosophy` (unchanged); no references to the removed inner components. `app/page.tsx` wraps it in `<div id="about">` — leave that as-is.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all clean (watch for now-unused imports — there should be none left).
Acceptance: Philosophy renders as ONE vertical section on **both** desktop and mobile (no horizontal pin, no scroll-jacking); Belief panel → "How I Build" eyebrow + "Build Where the Risk Lives." sub-headline → 4-step spine (rail draws on scroll) → architecture schematic. Fully readable 320→1920px. Reduced motion: spine static/full, blocks fade in via opacity. The Experience section (`ActExperience`) still uses its horizontal pin (untouched).

---

### Task 8: Gyro tilt on the holo (sequence LAST)

**Files:**
- Create: `hooks/useTiltStore.ts`
- Create: `components/TiltEnable.tsx`
- Modify: `app/page.tsx` (mount `TiltEnable` in the hero)
- Modify: `components/canvas/HoloLattice.tsx` (consume tilt, add deviceorientation listener)

- [ ] **Step 1: Shared "tilt enabled" store**

```tsx
// hooks/useTiltStore.ts
import { create } from "zustand";

interface TiltState {
  enabled: boolean;
  enable: () => void;
}

export const useTiltStore = create<TiltState>((set) => ({
  enabled: false,
  enable: () => set({ enabled: true }),
}));
```

- [ ] **Step 2: Icon-only tap-to-enable affordance**

Coarse-pointer + non-reduced-motion only; hidden once enabled or after a timeout. Triggers iOS permission inside the click handler (required by iOS). On Android (no `requestPermission`), enable directly.

```tsx
// components/TiltEnable.tsx
"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { useTiltStore } from "@/hooks/useTiltStore";

type DOEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export default function TiltEnable() {
  const enabled = useTiltStore((s) => s.enabled);
  const enable = useTiltStore((s) => s.enable);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasDO = typeof window.DeviceOrientationEvent !== "undefined";
    if (coarse && !reduced && hasDO) setShow(true);
  }, []);

  if (!show || enabled) return null;

  const onEnable = async () => {
    const DO = window.DeviceOrientationEvent as DOEventCtor | undefined;
    try {
      if (DO && typeof DO.requestPermission === "function") {
        const res = await DO.requestPermission();
        if (res !== "granted") {
          setShow(false);
          return;
        }
      }
      enable();
      setShow(false);
    } catch {
      setShow(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onEnable}
      aria-label="Make the background react to device tilt"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-overlay/70 text-muted-foreground backdrop-blur-xl transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.95]"
    >
      <Compass size={18} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
```

- [ ] **Step 3: Mount the affordance in the hero**

In `app/page.tsx`, render `<TiltEnable />` somewhere unobtrusive in the hero `<section id="home">` (e.g. near the scroll indicator). Import it. It self-hides on non-touch / reduced-motion / once enabled, so it is inert on desktop.

- [ ] **Step 4: Feed device tilt into HoloLattice parallax**

In `components/canvas/HoloLattice.tsx`, after the existing `pointermove` effect, add a gated `deviceorientation` listener that writes the SAME `pointer.current` target the cursor uses. Read the store flag:

```tsx
import { useTiltStore } from "@/hooks/useTiltStore";
// ...inside the component:
const tiltEnabled = useTiltStore((s) => s.enabled);

useEffect(() => {
  if (reduced || !tiltEnabled) return;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const onTilt = (e: DeviceOrientationEvent) => {
    // gamma: left/right [-90,90]; beta: front/back [-180,180].
    // Small damped amplitude so the holo leans, not lurches.
    if (e.gamma != null) pointer.current.x = clamp(e.gamma / 35);
    if (e.beta != null) pointer.current.y = clamp((e.beta - 45) / 35);
  };
  window.addEventListener("deviceorientation", onTilt, { passive: true });
  return () => window.removeEventListener("deviceorientation", onTilt);
}, [reduced, tiltEnabled]);
```
The existing `useFrame` lerp toward `pointer.current` already smooths it — no other change needed. Amplitude divisor (35) and beta neutral (45°, a typical hand-hold angle) are reasonable defaults; flag as an on-device tuning nudge.

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all clean.
Acceptance: desktop cursor parallax unchanged (no `requestPermission`, affordance hidden). On a touch device, the compass affordance appears; tapping prompts iOS motion permission; once granted the holo leans with device tilt (subtle, damped). Reduced motion → affordance hidden, no listener. Denied/unsupported → autonomous float remains. No always-on listener before enable.

---

### Task 9: Verification pass + consistency review

**Files:** none (verification only)

- [ ] **Step 1: Static gates**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: typecheck clean; lint 0 errors (pre-existing `scripts/audit/out/*.mjs` warnings OK); build "Compiled successfully".

- [ ] **Step 2: Manual matrix (describe results)**

- Desktop ≥1280px: Philosophy vertical (spine draws, schematic visible); hero "Software" solid violet; cursor parallax intact; Experience still horizontal-pinned.
- Mobile emulation (~390px, e.g. S26 Ultra): holo visible; pills/cards press feedback; tilt affordance present; reveals choreographed; no horizontal overflow at 320px.
- `prefers-reduced-motion`: spine full/static; reveals = opacity; no WebGL forced; tilt affordance hidden.

- [ ] **Step 3: Copy & scope audit**

Run: `git diff --stat`
Confirm only the planned files changed and copy changes are limited to: the "How I Build" block, the approved "ENGINEER THE …" headline swap, and the earlier SHIPPED removal.

---

## Self-review (completed by planner)

- **Spec coverage:** Philosophy vertical spine (T5–T7) ✓; new copy (T7) ✓; sub-headline (T7) ✓; architecture schematic (T6) ✓; hero de-gradient (T1) ✓; tap feedback (T3) ✓; reveal variety (T4) ✓; gyro tilt (T8) ✓; mobile holo + SHIPPED already landed ✓; a11y/reduced-motion/SSR/INP guardrails embedded per task ✓.
- **Placeholder scan:** no TBD/TODO; code provided for each code step; sensor tuning values given with a flagged on-device nudge.
- **Type consistency:** `ProcessStep { index,title,body }` defined in T5, consumed identically in T7; `useTiltStore { enabled, enable }` defined in T8.1, consumed in T8.2/T8.4; `motion.ts` exports (`fadeUp/fadeRight/scaleIn/staggerContainer/viewportOnce`) defined T2, consumed T4.
- **Open owner decision (non-blocking for most tasks):** Belief headline "MODERNIZING THE SYSTEMS WE RELY ON." conflicts with the reframe — flagged in T7 / T9.3.
