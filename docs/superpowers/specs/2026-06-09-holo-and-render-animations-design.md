# Materialized Motion — holo boot-up + a professional pass on all page renders

**Date:** 2026-06-09
**Status:** Approved design (pending spec review) → implementation plan
**Owner:** Jake Castillo
**Scope decision:** Full pass (sections 1–5). Deferred: deep perf-infra tier
(`content-visibility:auto`, native CSS scroll-timeline rails, GL pipeline warm-up).

---

## 1. Problem & goal

The WebGL "holo" (a violet Fresnel-rim icosahedron + cyan wireframe + bloom) is
mounted via `{show && <Scene/>}` after a `requestIdleCallback`, so when it
appears it **snaps on at full intensity with no entrance transition** — it
"pops." Separately, the page's render animations are solid but uneven (the hero
mixes `initial={false}` and animated items via a hand-rolled `reveal`; section
reveals are a uniform fade-up) and there's no shared motion identity.

**Goal:** Replace the pop with a deliberate, on-brand **boot-up** entrance, and
unify every render under one restrained motion language anchored to it — without
regressing LCP/INP, battery, or accessibility.

### Guiding principle (from research)

> Make the holo boot-up the **conductor** of one shared, fixed-timeline motion
> language: a shader-uniform entrance + a single "laser-wipe" gesture echoed
> sparingly + affordance-first micro-interactions — paid for by pausing the
> persistent canvas once it scrolls out of the hero.

The codebase is already ~80% there; this is **consolidation + a few surgical
additions**, not a rebuild.

### Motion vocabulary (applies everywhere)

- **Easing:** keep the existing expo-out `EASE = [0.16, 1, 0.3, 1]` as the one
  curve for all entrances — fast departure, long graceful settle ("jumps then
  settles," confident not bouncy).
- **Travel:** transform/opacity only (GPU-composited). Small distances
  (`y: 16–24`, `scale` from `0.96` never `0`). Above-the-fold choreography
  settles by **~1.0–1.2s**.
- **Signature gesture:** a bottom-to-top / left-to-right **scanline wipe**,
  used in exactly two places — the holo boot and the four section headings.
- **Accent discipline:** violet owns interactive state; cyan stays a rare
  "signal" tint (the wipe edge, mono eyebrows). No second always-looping
  animation beyond the existing aurora drift + hero gradient-text shimmer.

---

## 2. Workstream 1 — Holo boot-up (the headline fix)

**Files:** `components/canvas/HoloLattice.tsx`, `components/Scene.tsx`,
`components/BackgroundScene.tsx`. **Easing helper:** a frame-rate-independent
`damp(current, target, smoothing, delta)` — hand-rolled inline by default (see
Open Question #1), equivalent to `maath` `easing.damp`.

The entire boot is expressed as **shader uniforms animated in the existing
`useFrame`**, never React state — so it composes with additive blending + the
Bloom post-pass and plays for free on the throttled 30fps demand loop.
Below, "`damp(...)`" refers to that helper.

### 2.1 Uniforms & envelope (`HoloLattice`)

Add three uniforms to the `uniforms` `useMemo`:

- `uReveal: { value: 0 }` — master 0→1 boot progress (the clock everything reads).
- `uIntensity: { value: 0 }` — promoted from today's **static** literal to an
  animated value; rests at `1.75` (full) / `2.3` (low-power).
- `uPulse: { value: 0 }` — one-shot lock-pulse brightness boost.

In `useFrame` (frame-rate-independent via `maath` `easing.damp`, `BOOT_DUR ≈ 1.4s`):

1. Capture `bootStart` on the first tick; `bp = clamp((t - bootStart)/BOOT_DUR, 0, 1)`.
2. `easing.damp(uReveal, "value", 1, ~0.35, delta)` (or drive directly from `bp`
   with expo-out) so the value chases 1 identically at 30 and 60 fps.
3. Ramp `uIntensity` 0 → resting value, **phased just behind** `uReveal`.
4. **Lock-pulse:** when `uReveal` first crosses `~0.9`, latch `lockStart`; set
   `pulse = exp(-(t-lockStart)*6) * sin((t-lockStart)*30)`; apply
   `group.scale = 1 + pulse*0.04` and `uPulse = pulse*0.6`. One-shot only.

### 2.2 Fragment shader — world-Y scanline wipe

Reuse the **existing** `vWorldY` (no new geometry):

- Normalize: `float yN = vWorldY / RADIUS * 0.5 + 0.5;` where `RADIUS` is derived
  from geometry (uniform `uMinY/uMaxY` or a `uRadius`), **not** hardcoded 1.3 in
  two places.
- Reveal gate on **alpha** (never `discard` — additive bloom needs soft alpha):
  `float wipe = smoothstep(uReveal - 0.06, uReveal + 0.02, 1.0 - yN);` multiply
  final color + alpha by `wipe`.
- Hot scan edge: `float edge = smoothstep(0.04, 0.0, abs((1.0 - yN) - uReveal));`
  add `edge` into the cyan mix and brightness (`edge*1.5`) so the wipe line is a
  bright cyan bar that bloom blooms into a glowing sweep.
- Fold `uPulse` into the Fresnel/edge brightness for the lock flash.

### 2.3 Bloom intensity ramp (`Scene`)

- Initialize `<Bloom intensity={0} … />`.
- Add a tiny `Boot` child inside `<EffectComposer>` holding a `bloomRef`; in its
  `useFrame`, `easing.damp(bloomRef.current, "intensity", target, 0.5, delta)`
  with `target` = `1.05` (full) / `0.9` (low-power) — the values already in
  `Scene.tsx`. Start ramping when `uReveal > 0.15` (just behind the wipe).
- Share the boot progress with `Boot` via a ref (not state).

### 2.4 Canvas-wrapper fade (compile-jank mask)

- Wrap the `Canvas` div in a framer-motion `opacity 0→1` over ~600ms, fired on
  `Canvas onCreated` (so a *painted* frame fades in, not a blank one). Opacity
  only. This must **not** gate LCP text (the holo is decorative + idle-mounted).
- Init `uReveal:0` and `Bloom.intensity:0` so nothing flashes full-bright for a
  frame before the boot starts.

### 2.5 Demand-loop hygiene

Under `frameloop="demand"` (low-power) the ramp only advances if something
invalidates each frame. The existing `FrameThrottle` (30fps) covers it — confirm
an invalidator is alive for the full ~1.5s boot window after mount. (Optional,
deferred: `frameloop="always"` for the first ~1.5s then drop to demand.)

---

## 3. Workstream 2 — Coordinated hero (fixed timeline, no handshake)

**Files:** `app/page.tsx`, `components/BackgroundScene.tsx`, `components/motion.ts`.

The hero text and the holo boot are coordinated by a **shared fixed timeline**,
**not** an event handshake — because the holo is absent for
reduced-motion / data-saver / low-core users, the text must never await it.

### 3.1 Consolidate the cascade

- Replace `page.tsx`'s local `reveal` (lines ~16–23, hand-rolled `custom={i}`
  delays that drift from `motion.ts`) with `motion.ts`'s `staggerContainer` on
  the identity column + plain `fadeUp` children. One source of timing truth;
  reduced-motion handling becomes automatic.
- `staggerChildren ≈ 0.06–0.08`, `delayChildren ≈ 0.1`.

### 3.2 Protect LCP — do NOT demote the headline

- Keep the **avatar row, `HeaderTypewriter` H1 wrapper, and tagline** on
  `initial={false}` "settle" (they're already painted server-side). Never put the
  LCP text into `initial="hidden"` / `opacity:0` (Chrome excludes `opacity:0`
  from LCP candidacy → inflated LCP). If a fade is ever needed, start at `0.1`.
- Reserve `hidden→show` strictly for **pills, CTA row, terminal column**.

### 3.3 The engineered coincidence

- Tighten `BackgroundScene` `requestIdleCallback` timeout **400 → ~280ms** so the
  boot underlays the cascade rather than arriving after it.
- Tune so the holo **lock-pulse lands as the final hero item (terminal/CTA)
  settles, ~1.0–1.2s** — the single coincidence that reads as "the system comes
  online exactly as the copy finishes assembling."
- No shared Zustand event, no awaiting. Verify the rendezvous on a real mid-tier
  phone (the 30fps boot feels different from a 120Hz desktop).

### First-load timeline (target, ms)

```
0      static gradient + aurora painted; LCP H1 server-painted in final position
0–150  LCP chain plays initial={false} "settle" (visible even if hydration lags)
150–900 identity-column cascade (paragraph → pills → CTAs → terminal), stagger ~0.07
~280   holo mounts; ~1.4s shader boot begins: scanline wipe bottom→top under the
       settling text; Bloom.intensity ramps 0→target just behind the wipe
~1.0–1.2 holo lock-pulse fires as the last text item settles  ← "system online"
```

---

## 4. Workstream 3 — Scroll-reveal pass (all renders)

**Files:** `components/motion.ts`, `components/ActPhilosophy.tsx`,
`components/ActExperience.tsx`, `components/ActSkills.tsx`,
`components/ActContact.tsx`, `components/StageManager.tsx`,
`components/ScrollProgress.tsx`.

### 4.1 Keep the house default

`whileInView` + `viewportOnce` ({ once: true, amount: 0.2 }) stays the default
for content reveals. Optionally add `margin: "0px 0px -10% 0px"` so cards finish
revealing just before reaching reading height. Standardize all Acts on the shared
variants + `EASE`; small travel only.

### 4.2 Signature `clipReveal` "laser-wipe" heading (the one flourish)

Add to `motion.ts`:

```ts
export const clipReveal: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
  show:   { clipPath: "inset(0 0 0 0)", opacity: 1,
            transition: { duration: 0.5, ease: EASE } },
};
```

Apply via `whileInView` + `viewportOnce` to the **four major section headings
only** (Philosophy "ENGINEER THE SYSTEMS…", Experience heading, Skills "THE
STACK", Contact heading). Optional 1px cyan leading-edge that travels with the
wipe (the rare signal tint). Headings + 1–2 accents per page max.

> **A11y gate (must):** `MotionConfig reducedMotion="user"` does **not** auto-drop
> `clipPath`. Branch manually:
> `const reduced = useReducedMotion(); variants={reduced ? fadeUp : clipReveal}`.

### 4.3 Fix the double-smoothing bug

`StageManager` and `ScrollProgress` wrap a **Lenis-driven** `scrollYProgress` in
`useSpring`. Lenis already eases native scroll, so this double-smooths into a
laggy/floaty rail. **Remove the `useSpring`**; drive `scaleY`/`scaleX` straight
from `scrollYProgress`. Keep the existing reduced-motion static branch.

---

## 5. Workstream 4 — Micro-interactions (affordance, not spectacle)

**Files:** `app/globals.css`, `components/Navigation.tsx`, `components/Footer.tsx`,
`components/ActContact.tsx`, `app/page.tsx`.

Spend the interaction budget on **affordance**. One or two signals per element —
affordance cues (underline/arrow) for links, depth cues (lift/glow) for cards,
press (scale) everywhere.

### 5.1 Universal affordance trio

- **`.link-underline`** utility in `globals.css`: a 1px (not 2px) violet `::after`,
  `transform: scaleX(0)→1`, `transform-origin` right→left on
  `:hover`/`:focus-visible`. Use on text + footer links. (Body-copy links that
  wrap → `background-size` gradient variant instead, which doesn't clip at line
  breaks.) The global reduced-motion transition cap already neutralizes it.
- **Arrow-nudge** on directional links (already on the GitHub link, Contact,
  Experience CTAs) — extend consistently: `ArrowUpRight` diagonal for external,
  `ArrowRight` horizontal for in-page; `≤4px` travel.
- **Press:** standardize `active:scale-[0.97]` on buttons, `active:scale-[0.99]`
  on large cards (you already ship `TouchActive.tsx` for iOS `:active`).

### 5.2 Magnetic dock refactor (`Navigation`)

Refactor `MagneticButton` from `useState`+`animate` (re-renders the **fixed** dock
on every `mousemove` + reads `getBoundingClientRect` per frame = layout thrash) to
motion values:

```ts
const mx = useMotionValue(0), my = useMotionValue(0);
const x = useSpring(mx, { stiffness: 150, damping: 20, mass: 0.1 });
// read rect once on mouseenter; on move mx.set(offsetX * 0.18)
```

Add a child `<motion.span style={{ x: useTransform(x, v => v*0.4) }}>` so the icon
lags the chip (tactile mass). Keep the `useEnableMotion()` gate (pointer:fine +
!reduced-motion) and `active:scale-[0.92]` press. This is the biggest INP win on
the site and makes the pull feel heavier/premium.

### 5.3 One specular sheen

A single hover-triggered, **one-shot** specular sweep on the filled violet Email
CTA only (`::before` diagonal gradient, low alpha ~0.15–0.2, `overflow:hidden`,
translateX on `:hover`). No looping sheens; no second always-animating gradient.

---

## 6. Workstream 5 — Perf + accessibility

**Files:** `components/Scene.tsx`, `hooks/useScrollStore.ts` (or an
`IntersectionObserver` on `#home`), `components/canvas/HoloLattice.tsx`,
`components/BackgroundScene.tsx`.

### 6.1 Pause the persistent holo offscreen (must — biggest battery win)

`BackgroundScene` is `fixed inset-0`, so `Scene` renders **+ runs the Bloom
post-pass for the entire page scroll** even though it's only visible behind the
hero. Extend the existing `frameloop = hidden ? "never" : …` with a second
boolean fed from the already-wired `useScrollStore.offset` (or an
`IntersectionObserver` on `#home`): once scrolled **~1.2 viewports** past, set
`frameloop="never"` and let the pure-CSS aurora carry the lower page. Zero visual
cost.

### 6.2 Reduced-motion = a frozen **lit** holo (calm, not off)

- In `HoloLattice`'s existing `reduced` branch: seed `uReveal=1`,
  `uIntensity`=resting, **skip** the scanline ramp + lock-pulse → a static lit
  holo (brand identity intact). The boot's **end-state** is allowed under WCAG
  2.3.3; only the transition is removed.
- Upgrade `BackgroundScene`: for capable hardware under reduced-motion, still
  mount `Scene` and render **exactly one frame** (`frameloop="never"` after one
  `invalidate()`, `uTime` frozen) instead of the gradient-only fallback. Continue
  to skip WebGL entirely only for the data-saver / sub-4GB / sub-4-core tier.

### 6.3 A11y invariants to preserve

- `clipPath`, shader-uniform ramps, and any CSS `@keyframes` are **not**
  neutralized by `MotionConfig` — each needs its own reduced-motion branch
  (§4.2, §6.2).
- Keep all entrance motion transform/opacity only; keep magnetic dock +
  immersive timeline gated to `pointer:fine` + `!reduced-motion`.
- Don't pin `will-change` on framer-motion reveals (it toggles its own);
  reserve permanent `will-change` for the 3 aurora blobs.

---

## 7. Risks & how we mitigate

| Risk | Mitigation |
|---|---|
| LCP regression from animating hero text | Keep LCP chain on `initial={false}`; never `opacity:0`-from-hidden (§3.2). |
| Boot looks janky on mid-tier mobile | `easing.damp(...delta)` for FR-independence; verify rendezvous on a real phone (§3.3). |
| `clipPath` wipe shown to reduced-motion users | Manual `useReducedMotion()` branch (§4.2). |
| Hard scan edge starves the glow | `smoothstep` on **alpha**, never `discard` (§2.2). |
| Holo flashes full-bright for one frame | Init `uReveal:0` + `Bloom.intensity:0`; gate start to after first paint (§2.4). |
| Double-eased rails feel floaty | Remove `useSpring` over Lenis-driven progress (§4.3). |

---

## 8. Verification

- **Visual:** boot plays once on load (scan bottom→top, glow ramps, single lock
  pulse), then settles into the existing idle rotation/parallax. Hero cascade
  finishes ~1.0–1.2s with the pulse landing on the last item.
- **Reduced-motion** (`prefers-reduced-motion: reduce`): static lit holo, no
  ramp/pulse; hero is an opacity-led fade; rails static. No motion.
- **Low-power / mobile** (DevTools throttle, real phone): boot plays at 30fps;
  holo pauses after scrolling past the hero (verify GPU goes idle in DevTools >
  Rendering / Performance).
- **LCP/INP:** Lighthouse + (ideally) a real-device check — LCP not regressed
  (hero text still painted ≤ ~1s), no new long tasks during entrance.
- **Layers:** DevTools > Rendering > Layer borders shows ~3 aurora layers + 1
  canvas, not one per revealed section.
- **Build/lint/types:** `npm run lint`, `npm run typecheck`, `npm run build`.

---

## 9. Out of scope / deferred

- Copy, layout/IA, new sections, color-system changes.
- **Deferred perf-infra tier:** `content-visibility:auto` on below-fold Acts;
  native CSS scroll-timeline (`animation-timeline: view()/scroll()`) for the
  decorative rails behind `@supports`; `frameloop="always"` GL warm-up window.
  (Revisit after the full pass ships.)

---

## 10. Resolved decisions

1. **Easing helper — hand-roll, no new dependency.** Implement a ~6-line
   frame-rate-independent `damp(current, target, smoothing, delta)` helper
   (exp-decay lerp) rather than adding `maath`. _(approved 2026-06-09)_
2. **Boot duration — `1.4s`, tuned live.** Start at `BOOT_DUR = 1.4s` and fine-
   tune against the hero cascade during implementation so the lock-pulse lands as
   the last hero item settles. _(approved 2026-06-09)_
