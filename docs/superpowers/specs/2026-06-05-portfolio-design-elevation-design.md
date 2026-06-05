# Portfolio Design Elevation — Design Spec

**Date:** 2026-06-05
**Owner:** Jake Castillo
**Status:** Awaiting spec review → writing-plans

## 1. Context & goal

A surgical design/branding elevation of the existing Next.js 16 / React 19 / Tailwind 4 / Framer Motion / React Three Fiber portfolio (the "Void & Laser" system). The site is already high-craft; this pass refines it, reframes the "How I Build" section to read as a **solutions architect's process** (not a second résumé), and makes **mobile invigorating**, not merely responsive.

Direction was pressure-tested with a multi-agent research pass against 2025–2026 web design. Verdict: the existing aesthetic is strongly aligned with where 2026 is going; the work is to **sharpen substance over spectacle** and fix two specific things (a gradient-text cliché and horizontally-pinned prose).

## 2. Guardrails (non-negotiable)

- **No copy changes except (1) the "How I Build" block and (2) the owner-approved Philosophy headline swap "MODERNIZING THE" → "ENGINEER THE" (… SYSTEMS WE RELY ON.).** No fabricated metrics — trade-offs are qualitative, never invented numbers.
- Preserve **Void & Laser** tokens, WCAG contrast/focus rings, the **SSR-safe constant-initial-markup** pattern (no hydration mismatch), and the meticulous `prefers-reduced-motion` craft (reduce, don't remove).
- **Protect INP**: the continuous `pointermove` holo listener + spring magnetic dock are the real field-perf exposure. No new always-on main-thread listeners; throttle/passive where added.
- Don't restructure beyond what's specified. One WebGL moment only — no second 3D element, no WebGPU migration.
- Motion is transform/opacity only; reduced-motion collapses every reveal to opacity.

## 3. Locked decisions (from review)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Philosophy layout | **Vertical process spine**; convert Philosophy off the horizontal pin. Leave the Experience timeline horizontal. |
| 2 | "How I Build" framing | **4-step process spine** ("Build Where the Risk Lives"): Find the Constraints → Bet Where It Counts → Prove the Unknown → Build to Be Changed. General software-solutions + innovator; **no modernization framing**. |
| 3 | Hero wordmark | **"Software" → solid violet + existing `text-glow`**; drop the `.text-laser` violet→cyan gradient. |
| 4 | Architecture artifact | **Add one minimal, representative schematic** (legacy → modernized-on-AWS flow). Illustrative; no fabricated specifics. |
| 5 | Gyro tilt | **Keep, sequence last.** Reuse the holo parallax target (feed device-tilt where the cursor feeds on desktop). |
| 6 | Scope/ambition | Surgical + one signature (the process spine + its architecture capstone). |

## 4. Already landed (this session, build green)

- **Mobile holo visibility** — root cause: the `lowPower` path skipped the Bloom post-pass and the Fresnel rim/wireframe relied on bloom to glow. Fix: cheap half-res bloom on `lowPower` + in-shader brightness compensation (`uPower`/`uIntensity`/wireframe opacity) as a driver-failure fallback. (`components/Scene.tsx`, `components/canvas/HoloLattice.tsx`)
- **"SHIPPED" slide removed** (`SlideResult`) from `ActPhilosophy.tsx`. The desktop horizontal-pin `translateX %` was relative to the `container-page`-capped box, clipping the trailing slide — corrected to a full-bleed `vw`-driven track. **Note:** this horizontal-pin code is *superseded* by the vertical conversion in Workstream A below; the SHIPPED removal stays.

## 5. Workstreams

### A. Philosophy → vertical process spine + architecture schematic *(the core)*

Convert `components/ActPhilosophy.tsx` from the horizontal-pin/`useImmersive` branch into a single **vertical, content-first composition** (desktop + mobile share it; the old `PhilosophyImmersive`/horizontal `useScroll` is removed). Structure:

1. Eyebrow `02 / approach` + the existing `SlideBelief` headline & summary (unchanged copy).
2. Hairline divider.
3. **Process Spine** — new `components/ProcessSpine.tsx`, steps passed as props:
   - Vertical rail (left border) connecting four nodes; mono `01`–`04` indices in accent; title (foreground, bold) + body (muted).
   - **Scroll-drawn connector:** the rail draws top→bottom and each index ignites subtle→accent as the section scrolls in. Implement with Framer `useScroll`/`scaleY` (and/or CSS `animation-timeline: view()` behind `@supports` + reduced-motion). Scroll-linked = calm, no scroll-jacking.
   - **Reduced-motion:** rail fully drawn, all indices lit, static.
4. **Architecture schematic** — new `components/ArchitectureSchematic.tsx`: a small, on-brand diagram that *visualizes the "Build Where the Risk Lives" philosophy* (not a migration). A proven, "boring" platform — `Edge · App · API/Services · Data`, with cross-cutting `CI/CD · Security` (top rail) and `Observability` (bottom rail) — wrapping ONE highlighted, accent-glowing **"the bet"** module (the risky/innovative piece, e.g. an AI/integration component) isolated behind a clean seam so it can be proven and swapped. Representative/illustrative, general (greenfield or otherwise), no fabricated specifics. SVG or token-based CSS; accessible (`<figure>` + `role="img"` + descriptive label, decorative bits `aria-hidden`); reduced-motion safe. Turns atmosphere into concrete architect credibility.

### B. Hero wordmark de-gradient

`components/HeaderTypewriter.tsx`: change the `Software` span from `text-laser text-glow` → `text-primary text-glow`. Verify `.text-laser` is unused elsewhere (`grep`); leave the utility defined (harmless) or remove if confirmed unused.

### C. Tactile tap feedback (do first — safest)

Extend the existing `active:scale-[0.97]` + subtle violet glow press-state (already on CTAs/nav/contact) to the genuinely-new surfaces: **skill pills** (`ActSkills`) and **certification cards**. Short 100–150ms, transform/opacity only. Add an iOS `:active` enabler (empty `ontouchstart` / `cursor:pointer` so iOS Safari fires `:active`). **No real haptics** (iOS 26.5 removed the Taptic trick). Reduced-motion: keep color/opacity feedback, drop scale.

### D. Reveal variety refinement

Add `components/motion.ts` exporting a small set of shared, reduced-motion-safe variants (the existing reveals already do `translateY`+opacity — the gap is *uniformity*, not flatness). Give each act **one primary axis/intent** rather than the same fade everywhere; keep `viewport={{ once: true }}`. Light touch; do not turn every element into an animation.

### E. Gyro tilt (last)

`components/canvas/HoloLattice.tsx` (+ small `hooks/useTiltTarget.ts`): on coarse-pointer devices, feed `deviceorientation` into the same `pointer.current` lerp target the cursor feeds on desktop — reusing the existing parallax. Gated behind a **tap-triggered** `DeviceOrientationEvent.requestPermission()` (iOS) via an **icon-only ghost affordance** near the hero holo (no prose copy added; auto-hides after enable). Tiny damped amplitude. `prefers-reduced-motion` → off. Default/denied/unsupported → existing autonomous float. Only active when the holo is actually rendered.

## 6. New "How I Build" copy (APPROVED)

Theme: **"Build Where the Risk Lives"** — a general software-solutions architect + innovator. Domain-agnostic (fits greenfield, AI, or existing systems); **no modernization framing**. Each step carries one real, qualitative conviction/trade-off; no invented numbers. Selected via a generate→judge→synthesize panel, then trimmed to the spine rhythm.

- **01 · Find the Constraints** — "I separate the real constraints from the assumptions everyone's stopped questioning, and pressure-test the outcome before any code exists. I'd rather kill a weak idea in a week than build the wrong thing fluently."
- **02 · Bet Where It Counts** — "I pour design into the few decisions that are expensive to reverse and stay deliberately boring everywhere else — proven tools for the plumbing, so the real risk and invention land where they create value."
- **03 · Prove the Unknown** — "I build the scariest piece first — the unproven integration, the AI behavior, the assumption it all rests on — and put it in real hands while it's still cheap to be wrong."
- **04 · Build to Be Changed** — "Security, observability, and an honest record of why each call was made are part of the design, not a cleanup pass — I build for whoever inherits it a year from now, not for how clever it looks today."

Section eyebrow stays **"How I Build"**, with the theme line **"Build Where the Risk Lives"** added as a visible sub-headline beneath it (owner approved). Style it as a secondary display line consistent with the Void & Laser type scale — subordinate to the section heading, above the four steps.

## 7. Files

- **New:** `components/ProcessSpine.tsx`, `components/ArchitectureSchematic.tsx`, `components/motion.ts`, `hooks/useTiltTarget.ts`, a small tilt-enable affordance.
- **Edit:** `components/ActPhilosophy.tsx` (vertical conversion + spine + schematic + new step data), `components/HeaderTypewriter.tsx` (de-gradient), `components/ActSkills.tsx` (pill/card tap), `components/canvas/HoloLattice.tsx` (gyro input), `components/ActExperience.tsx` / `components/ActContact.tsx` / `app/page.tsx` (reveal variety + tap where relevant), minor `app/globals.css` utilities.

## 8. Acceptance criteria

- `npm run typecheck`, `npm run lint`, `npm run build` all pass.
- No copy changed except "How I Build" (+ the removed SHIPPED slide).
- Philosophy renders as a vertical spine on desktop **and** mobile; no horizontal pin; both fully readable 320→1920px+.
- Hero "Software" is solid violet, no gradient wash.
- Architecture schematic renders, is accessible, and contains no fabricated specifics.
- Skill pills + cert cards have visible press feedback (incl. iOS Safari).
- Gyro tilt is permission-gated, reduced-motion-off, with autonomous fallback; desktop cursor-parallax unchanged.
- `prefers-reduced-motion`: spine fully drawn/static, reveals = opacity only, no WebGL forced on.
- No new always-on main-thread listeners beyond the gated gyro handler.

## 9. Execution (sub-agent decomposition)

Parallel where files are disjoint; the Philosophy work is one agent end-to-end (spine + schematic + vertical conversion) to avoid churn:
- **Agent A:** Workstream A (ProcessSpine + ArchitectureSchematic + ActPhilosophy vertical conversion + step copy).
- **Agent B:** Workstreams C + D (tap feedback on pills/cards + `motion.ts` + reveal variety across Skills/Experience/Contact/hero). Does **not** touch ActPhilosophy.
- **Agent C:** Workstream B (hero de-gradient) — tiny; can fold into B.
- **Then:** Workstream E (gyro tilt) as a follow-up after A–C land and verify.
- **Verification pass:** build/typecheck/lint + manual mobile/reduced-motion/320px check.

## 10. Out of scope

WebGPU/TSL/R3F v10 migration; View Transitions API (no real routes); kinetic per-letter type; real web haptics; any second 3D element; copy changes outside "How I Build."
