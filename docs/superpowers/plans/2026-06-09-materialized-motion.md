# Materialized Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the holo's hard "pop" with a shader-uniform boot-up (scanline wipe + bloom ramp + one-shot lock-pulse) and unify all page renders under one motion language, without regressing LCP/INP, battery, or accessibility.

**Architecture:** The boot is expressed entirely as GLSL uniforms (`uReveal`, `uIntensity`, `uPulse`) animated inside the existing `useFrame` with a frame-rate-independent `damp()` helper — never React state — so it composes with additive blending + the Bloom post-pass and plays for free on the 30fps demand loop. The hero text cascades on a **fixed timeline** (never awaiting the holo) so it degrades independently for reduced-motion/low-power users. One signature `clipReveal` "laser-wipe" echoes the scan on section headings; micro-interactions are affordance-first; perf work pauses the fixed canvas once scrolled past the hero and gives reduced-motion users a single frozen lit frame.

**Tech Stack:** Next.js 16 (App Router, static export), React 19, TypeScript, @react-three/fiber 9 + drei 10 + postprocessing 3 (Bloom), framer-motion 12, Lenis, Zustand, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-06-09-holo-and-render-animations-design.md`

**Branch:** `feat/materialized-motion` (already created; spec committed there).

---

## Testing approach (read first)

This project has **no unit-test runner** (only `lint`, `typecheck`, `build`, `dev`). We will **not** add one (YAGNI, out of scope). The acceptance gate for every task is:

1. `npm run typecheck` → no errors
2. `npm run lint` → no new errors
3. A **visual check** in `npm run dev` (http://localhost:3000) per the task's "Verify" block
4. `npm run build` at the milestone tasks (3, 5, 8, 11, 12)
5. Commit

The one piece of pure logic (the `damp()` helper, Task 1) gets an inline numeric sanity assertion you run with `node`, then delete — no framework.

Per-task commits keep the branch bisectable. Do **not** push or open a PR (conservative git policy) — that's the user's call at the end.

---

## File map

| File | Change |
|---|---|
| `components/canvas/anim.ts` | **Create** — `damp()` frame-rate-independent easing helper |
| `components/canvas/HoloLattice.tsx` | Boot uniforms + shader wipe/edge/pulse + `useFrame` envelope + `reducedMotion` prop |
| `components/Scene.tsx` | `reducedMotion` prop, hero-visibility frameloop pause, `BloomBoot` ramp, canvas opacity fade |
| `components/BackgroundScene.tsx` | Mount Scene for reduced-motion (single frame), tighten idle 400→280ms, pass `reducedMotion` |
| `app/page.tsx` | Hero cascade → `staggerContainer`+`fadeUp`; keep LCP chain painted; timed terminal reveal |
| `components/motion.ts` | Add `clipReveal` variant |
| `components/ActPhilosophy.tsx` | Laser-wipe heading (reduced-motion branch) |
| `components/ActSkills.tsx` | Laser-wipe heading (reduced-motion branch) |
| `components/ActContact.tsx` | Laser-wipe heading (reduced-motion branch); `.link-underline` on secondary labels |
| `components/StageManager.tsx` | Remove `useSpring` double-smoothing |
| `components/ScrollProgress.tsx` | Remove `useSpring` double-smoothing |
| `components/Navigation.tsx` | Magnetic dock → `useMotionValue`/`useSpring` + one-time rect + icon lag |
| `app/globals.css` | `.link-underline` utility + `.cta-sheen` utility |

---

## Task 1: `damp()` easing helper

**Files:**
- Create: `components/canvas/anim.ts`

- [ ] **Step 1: Create the helper**

```ts
// components/canvas/anim.ts
// Frame-rate-independent exponential smoothing (a.k.a. damp / "smooth-follow").
// Equivalent to maath's easing.damp, hand-rolled to avoid a new dependency.
// `lambda` is the decay rate (higher = faster convergence). At a fixed lambda
// the result is identical whether called at 30fps or 60fps, because it folds
// the real elapsed `delta` (seconds) into the exponent.
export function damp(current: number, target: number, lambda: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}
```

- [ ] **Step 2: Sanity-check frame-rate independence**

Run:

```bash
node --input-type=module -e "
import { damp } from './components/canvas/anim.ts';
" 2>/dev/null || node -e "
const damp=(c,t,l,d)=>c+(t-c)*(1-Math.exp(-l*d));
// simulate 1s at 30fps vs 60fps, target 1 from 0, lambda 3
let a=0; for(let i=0;i<30;i++) a=damp(a,1,3,1/30);
let b=0; for(let i=0;i<60;i++) b=damp(b,1,3,1/60);
console.log('30fps:',a.toFixed(4),'60fps:',b.toFixed(4),'delta:',Math.abs(a-b).toFixed(5));
if (Math.abs(a-b) > 0.01) { console.error('FAIL: not frame-rate independent'); process.exit(1); }
console.log('PASS');
"
```

Expected: both ≈ `0.9502`, delta < `0.01`, prints `PASS`.

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add components/canvas/anim.ts
git commit -m "feat(anim): frame-rate-independent damp() easing helper"
```

---

## Task 2: Holo boot-up shader envelope (`HoloLattice`)

**Files:**
- Modify: `components/canvas/HoloLattice.tsx`

This is the headline change: add three uniforms + a world-Y scanline wipe + intensity ramp + one-shot lock-pulse, all driven in the existing `useFrame`. The component gains a `reducedMotion` prop (the single source of truth, replacing its internal `matchMedia`).

- [ ] **Step 1: Add the geometry-radius constant + import `damp`**

At the top of the file, after the existing imports, add:

```ts
import { damp } from "./anim";
```

Replace the two color consts region by adding a shared radius constant next to them:

```ts
const VIOLET = new THREE.Color("#8b5cf6");
const CYAN = new THREE.Color("#22d3ee");
// Single source for the icosahedron radius: used by BOTH the geometry and the
// uRadius uniform so the world-Y scanline wipe maps correctly (spec §2.2).
const GEO_RADIUS = 1.3;
```

- [ ] **Step 2: Extend the fragment shader (uniforms + wipe + edge + pulse)**

Replace the entire `fragmentShader` template literal with:

```ts
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uReveal;   // 0..1 boot progress (master clock)
  uniform float uPulse;    // one-shot lock-pulse brightness
  uniform float uRadius;   // geometry radius, for world-Y normalization
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying float vWorldY;
  void main() {
    // Fresnel: bright at grazing angles (silhouette), dark facing the camera.
    float fres = pow(1.0 - clamp(dot(vNormalV, vViewV), 0.0, 1.0), uPower);
    // Hologram horizontal scanlines drifting upward.
    float scan = 0.82 + 0.18 * sin(vWorldY * 42.0 - uTime * 3.0);
    // Slow bright sweep band travelling up the form ("system online").
    float band = smoothstep(0.10, 0.0, abs(fract(vWorldY * 0.20 - uTime * 0.05) - 0.5));

    // --- Boot-up scanline reveal (smoothstep on ALPHA, never discard) ---
    // Normalize world-Y to 0..1 (bottom..top). Overshoot the threshold to 1.12
    // so at uReveal=1 every fragment (incl. the very top) is fully lit.
    float yN = clamp(vWorldY / uRadius * 0.5 + 0.5, 0.0, 1.0);
    float r = uReveal * 1.12;
    float wipe = smoothstep(yN - 0.05, yN + 0.05, r);     // form fills bottom->top
    float edge = smoothstep(0.06, 0.0, abs(r - yN));      // hot cyan scan bar at the line

    // Violet rim, cyan biased toward the sweep + brightest edges.
    vec3 col = mix(uViolet, uCyan, clamp(fres * 0.5 + band * 0.6, 0.0, 1.0));
    col = mix(col, uCyan, edge);                          // tint the scan line cyan
    float glow = uIntensity * (scan + band * 0.7) + uPulse * 1.5;
    vec3 outCol = col * glow * wipe + uCyan * edge * 1.6; // edge blooms even before fill
    float a = (fres * scan + band * 0.12) * wipe + edge * 0.6;
    gl_FragColor = vec4(outCol, a);
  }
`;
```

- [ ] **Step 3: Change the component signature + reduced-motion source**

Replace the function signature and the `reduced` `useMemo` block. Old:

```ts
export default function HoloLattice({ lowPower = false }: { lowPower?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const scrollOffset = useScrollStore((s) => s.offset);
  const tiltEnabled = useTiltStore((s) => s.enabled);

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
```

New:

```ts
export default function HoloLattice({
  lowPower = false,
  reducedMotion = false,
}: {
  lowPower?: boolean;
  reducedMotion?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const scrollOffset = useScrollStore((s) => s.offset);
  const tiltEnabled = useTiltStore((s) => s.enabled);

  // reducedMotion is now passed from BackgroundScene (single source of truth).
  const reduced = reducedMotion;

  // Lock-pulse latch (one-shot when uReveal crosses ~0.9).
  const locked = useRef(false);
  const lockStart = useRef(0);
```

> Note: the existing `useEffect`/event-listener blocks reference `reduced` — they keep working unchanged because `reduced` is still in scope.

- [ ] **Step 4: Add boot uniforms (resting intensity computed from `reducedMotion`)**

Replace the `uniforms` `useMemo`. Old:

```ts
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uViolet: { value: VIOLET },
      uCyan: { value: CYAN },
      uPower: { value: lowPower ? 2.0 : 2.7 },
      uIntensity: { value: lowPower ? 2.3 : 1.75 },
    }),
    [lowPower],
  );
```

New:

```ts
  // Resting (post-boot) rim intensity — the value uIntensity ramps UP to.
  const restingIntensity = lowPower ? 2.3 : 1.75;
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uViolet: { value: VIOLET },
      uCyan: { value: CYAN },
      uPower: { value: lowPower ? 2.0 : 2.7 },
      // reduced-motion: seed the LIT end-state (no boot). Otherwise start dark.
      uIntensity: { value: reducedMotion ? restingIntensity : 0 },
      uReveal: { value: reducedMotion ? 1 : 0 },
      uPulse: { value: 0 },
      uRadius: { value: GEO_RADIUS },
    }),
    [lowPower, reducedMotion, restingIntensity],
  );
```

- [ ] **Step 5: Use `GEO_RADIUS` in the geometry**

Replace:

```ts
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(1.3, lowPower ? 0 : 1),
    [lowPower],
  );
```

with:

```ts
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(GEO_RADIUS, lowPower ? 0 : 1),
    [lowPower],
  );
```

- [ ] **Step 6: Drive the boot envelope in `useFrame`**

Replace the entire `useFrame(...)` block. Old:

```ts
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    if (matRef.current) matRef.current.uniforms.uTime.value = t;

    if (reduced) {
      g.rotation.set(0.5, 0.6, 0);
      g.position.y = 0;
      return;
    }
    // Ease the parallax toward the cursor target.
    lerped.current.x += (pointer.current.x - lerped.current.x) * 0.045;
    lerped.current.y += (pointer.current.y - lerped.current.y) * 0.045;

    const s = scrollOffset * 0.0006;
    g.rotation.y = t * 0.07 + s + lerped.current.x * 0.28;
    g.rotation.x = Math.sin(t * 0.14) * 0.18 + s * 0.4 + lerped.current.y * 0.22;
    g.position.x = lerped.current.x * 0.18;
    g.position.y = Math.sin(t * 0.4) * 0.08 - lerped.current.y * 0.14;
  });
```

New:

```ts
  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    const m = matRef.current;
    if (m) m.uniforms.uTime.value = t;

    if (reduced) {
      // Static LIT frame (frameloop is "never"/one-shot for this path anyway).
      g.rotation.set(0.5, 0.6, 0);
      g.scale.setScalar(1);
      return;
    }

    // --- Boot envelope (uniforms only; frame-rate independent via damp) ---
    if (m) {
      const rev = m.uniforms.uReveal;
      if (rev.value < 1) rev.value = Math.min(1, damp(rev.value, 1, 3, delta));
      m.uniforms.uIntensity.value = damp(
        m.uniforms.uIntensity.value,
        restingIntensity,
        3.2,
        delta,
      );
      // One-shot lock-pulse latched when the scan finishes (~0.9).
      if (!locked.current && rev.value > 0.9) {
        locked.current = true;
        lockStart.current = t;
      }
      if (locked.current) {
        const dt = t - lockStart.current;
        const pulse = Math.exp(-dt * 6) * Math.sin(dt * 30);
        m.uniforms.uPulse.value = Math.max(0, pulse) * 0.6;
      }
    }
    const pulseScale = 1 + (m ? m.uniforms.uPulse.value : 0) * 0.05;

    // Ease the parallax toward the cursor target.
    lerped.current.x += (pointer.current.x - lerped.current.x) * 0.045;
    lerped.current.y += (pointer.current.y - lerped.current.y) * 0.045;

    const s = scrollOffset * 0.0006;
    g.rotation.y = t * 0.07 + s + lerped.current.x * 0.28;
    g.rotation.x = Math.sin(t * 0.14) * 0.18 + s * 0.4 + lerped.current.y * 0.22;
    g.position.x = lerped.current.x * 0.18;
    g.position.y = Math.sin(t * 0.4) * 0.08 - lerped.current.y * 0.14;
    g.scale.setScalar(pulseScale);
  });
```

- [ ] **Step 7: Set a static rotation prop for the reduced-motion render**

The reduced path renders a single frame with `useFrame` never running, so the rotation must be on the JSX. Replace the opening group tag:

```tsx
    <group ref={groupRef} position={[0, 0, -1]}>
```

with:

```tsx
    <group
      ref={groupRef}
      position={[0, 0, -1]}
      rotation={reducedMotion ? [0.5, 0.6, 0] : [0, 0, 0]}
    >
```

- [ ] **Step 8: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors. (`useMemo` is still imported/used; `reduced` is still referenced by the event-listener effects.)

- [ ] **Step 9: Commit**

```bash
git add components/canvas/HoloLattice.tsx components/canvas/anim.ts
git commit -m "feat(holo): shader boot-up envelope (uReveal scan wipe + intensity ramp + lock pulse)"
```

> Visual verification happens in Task 3 once Scene wires the bloom ramp + canvas fade.

---

## Task 3: Bloom ramp, frameloop pause, canvas fade (`Scene`)

**Files:**
- Modify: `components/Scene.tsx`

- [ ] **Step 1: Update imports**

Replace:

```ts
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import HoloLattice from "./canvas/HoloLattice";
```

with:

```ts
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import HoloLattice from "./canvas/HoloLattice";
import { damp } from "./canvas/anim";
```

- [ ] **Step 2: Add the `reducedMotion` prop**

Replace the `SceneProps` interface + signature:

```ts
interface SceneProps {
    lowPower?: boolean;
}
```

→

```ts
interface SceneProps {
    lowPower?: boolean;
    /** Reduced-motion: render a single frozen LIT frame, no boot animation. */
    reducedMotion?: boolean;
}
```

and

```ts
export default function Scene({ lowPower = false }: SceneProps) {
```

→

```ts
export default function Scene({ lowPower = false, reducedMotion = false }: SceneProps) {
```

- [ ] **Step 3: Add `BloomBoot` + `RenderOnce` helper components**

After the existing `FrameThrottle` component (before `export default function Scene`), add:

```tsx
/** Minimal shape we mutate on the Bloom effect ref. */
type BloomLike = { intensity: number };

/**
 * Ramps Bloom.intensity 0 → target during the boot ("powering on"), phased a
 * beat behind the scan via a small start delay. Mutates the effect ref in
 * useFrame — no React state, frame-rate independent.
 */
function BloomBoot({ bloomRef, target }: { bloomRef: React.RefObject<BloomLike | null>; target: number }) {
    useFrame((state, delta) => {
        const b = bloomRef.current;
        if (!b) return;
        if (state.clock.elapsedTime < 0.18) return; // phase behind the wipe
        b.intensity = damp(b.intensity, target, 3, delta);
    });
    return null;
}

/** Renders exactly one frame (reduced-motion still-frame under frameloop="never"). */
function RenderOnce() {
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        invalidate();
    }, [invalidate]);
    return null;
}
```

- [ ] **Step 4: Add hero-visibility pause + bloom ref + created state**

Inside `Scene`, after the existing `hidden` state + its effect, add:

```tsx
    // Pause the persistent fixed canvas once the hero scrolls out of view —
    // it otherwise renders + runs the bloom pass for the entire page scroll.
    const [heroVisible, setHeroVisible] = useState(true);
    useEffect(() => {
        if (reducedMotion) return; // reduced path renders one frame, nothing to pause
        const el = document.getElementById("home");
        if (!el || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver(
            ([entry]) => setHeroVisible(entry.isIntersecting),
            // keep rendering a little past the hero edge, then stop
            { rootMargin: "200px 0px 200px 0px", threshold: 0 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [reducedMotion]);

    const bloomRef = useRef<BloomLike | null>(null);
    const [created, setCreated] = useState(false);
    const bloomTarget = lowPower ? 0.9 : 1.05;
```

- [ ] **Step 5: Replace the `frameloop` computation**

Replace:

```tsx
    const frameloop = hidden ? "never" : lowPower ? "demand" : "always";
```

with:

```tsx
    // reduced-motion: one frame then idle. Otherwise: never when hidden or
    // scrolled past the hero; demand+throttle on low-power; always on desktop.
    const frameloop: "never" | "demand" | "always" = reducedMotion
        ? "demand"
        : hidden || !heroVisible
          ? "never"
          : lowPower
            ? "demand"
            : "always";
```

- [ ] **Step 6: Wrap the Canvas in a fade-in wrapper + wire `onCreated`**

Replace the outer wrapper + `<Canvas …>` open tag. Old:

```tsx
    return (
        <div className="absolute inset-0">
            <Canvas
                gl={{
```

New:

```tsx
    return (
        <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: created ? 1 : 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <Canvas
                onCreated={() => setCreated(true)}
                gl={{
```

And change the matching closing tags at the end of the component:

```tsx
            </Canvas>
        </div>
    );
```

→

```tsx
            </Canvas>
        </motion.div>
    );
```

- [ ] **Step 7: Pass `reducedMotion` to HoloLattice + swap Bloom for the boot/static variants**

Replace the `<HoloLattice lowPower={lowPower} />` line:

```tsx
                    <HoloLattice lowPower={lowPower} reducedMotion={reducedMotion} />
```

Replace the entire `<EffectComposer> … </EffectComposer>` block with:

```tsx
                    <EffectComposer>
                        {lowPower ? (
                            <Bloom
                                ref={bloomRef}
                                intensity={reducedMotion ? bloomTarget : 0}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.5}
                                radius={0.7}
                                levels={5}
                                resolutionScale={0.5}
                                mipmapBlur
                            />
                        ) : (
                            <Bloom
                                ref={bloomRef}
                                intensity={reducedMotion ? bloomTarget : 0}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.5}
                                radius={0.75}
                                mipmapBlur
                            />
                        )}
                    </EffectComposer>

                    {/* Boot the bloom up (skipped under reduced motion). */}
                    {!reducedMotion && <BloomBoot bloomRef={bloomRef} target={bloomTarget} />}
                    {/* Reduced motion: force a single rendered frame. */}
                    {reducedMotion && <RenderOnce />}
```

> The `ref` on drei's `Bloom` resolves to the effect instance, which exposes a writable `intensity`. The `BloomLike` cast keeps TypeScript honest without pulling the full effect type.

- [ ] **Step 8: Typecheck + lint + build**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: clean. (If TS complains about the `Bloom` `ref` type, change `bloomRef` to `useRef<BloomLike | null>(null)` and add `ref={bloomRef as unknown as React.Ref<never>}` — but the plain `BloomLike` ref should resolve.)

- [ ] **Step 9: Visual verify (the core moment)**

Run `npm run dev`, open http://localhost:3000 in a fresh tab (hard-reload to replay the boot):

- The holo **does not pop** — a cyan scan bar sweeps **bottom→top**, the form fills behind it, the glow ramps up, and there's a single subtle "lock" flash/scale at the end, then it settles into the slow idle rotation.
- Scroll down past the hero, open DevTools → **Performance/Rendering**: the canvas stops re-rendering (GPU idle). Scroll back up: it resumes idle rotation (no re-boot).

- [ ] **Step 10: Commit**

```bash
git add components/Scene.tsx
git commit -m "feat(holo): bloom-intensity boot ramp, hero-scroll frameloop pause, canvas fade-in"
```

---

## Task 4: Mount holo for reduced-motion + tighten idle mount (`BackgroundScene`)

**Files:**
- Modify: `components/BackgroundScene.tsx`

- [ ] **Step 1: Add reduced-motion state**

Replace:

```tsx
export default function BackgroundScene() {
    const [show, setShow] = useState(false);
    // Computed once via lazy init (read outside render-time mutation). Safe on
    // the server, where it resolves to the static `false` fallback.
    const [lowPower] = useState(detectLowPower);
```

with:

```tsx
export default function BackgroundScene() {
    const [show, setShow] = useState(false);
    const [reduced, setReduced] = useState(false);
    // Computed once via lazy init (read outside render-time mutation). Safe on
    // the server, where it resolves to the static `false` fallback.
    const [lowPower] = useState(detectLowPower);
```

- [ ] **Step 2: Restructure the mount effect**

Replace the entire `useEffect(() => { … }, []);` block:

```tsx
    useEffect(() => {
        // 1) Honour reduced-motion: keep only the static backdrop.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        // 2) Low-end gate. Mobile / touch DOES get the holo now (in a cheaper
        //    low-res mode — see detectLowPower → Scene), so we only skip WebGL
        //    for data-saver and genuinely memory/CPU-constrained devices where
        //    it would jank or drain battery.
        const nav = navigator as HardwareNavigator;
        const lowMemory = (nav.deviceMemory ?? 8) < 4;
        const lowCores = (nav.hardwareConcurrency ?? 8) < 4;
        const saveData = nav.connection?.saveData === true;

        if (lowMemory || lowCores || saveData) return;

        const w = window as unknown as {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        };
        const start = () => setShow(true);
        // Mount soon (idle, but within 400ms) so the holo doesn't visibly lag the
        // page; the always-on aurora covers the brief gap before it appears.
        if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(start, { timeout: 400 });
        else setTimeout(start, 200);
    }, []);
```

with:

```tsx
    useEffect(() => {
        // Skip WebGL entirely only for genuinely constrained devices (data-saver
        // / sub-4GB / sub-4-core): they keep the static gradient + aurora.
        const nav = navigator as HardwareNavigator;
        const lowMemory = (nav.deviceMemory ?? 8) < 4;
        const lowCores = (nav.hardwareConcurrency ?? 8) < 4;
        const saveData = nav.connection?.saveData === true;
        if (lowMemory || lowCores || saveData) return;

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setReduced(prefersReduced);

        if (prefersReduced) {
            // Capable hardware + reduced motion: still mount the holo as a single
            // frozen LIT frame (brand identity intact) — no boot, no loop.
            setShow(true);
            return;
        }

        const w = window as unknown as {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        };
        const start = () => setShow(true);
        // Mount promptly (≤280ms) so the boot underlays the hero cascade rather
        // than arriving after it; the always-on aurora covers the brief gap.
        if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(start, { timeout: 280 });
        else setTimeout(start, 180);
    }, []);
```

- [ ] **Step 3: Pass `reducedMotion` to Scene**

Replace:

```tsx
            {show && <Scene lowPower={lowPower} />}
```

with:

```tsx
            {show && <Scene lowPower={lowPower} reducedMotion={reduced} />}
```

- [ ] **Step 4: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 5: Visual verify reduced-motion path**

In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", hard-reload:

- The holo appears as a **static lit orb** (violet rim + cyan wireframe, no scan, no rotation, no pulse) faded in once — **not** the gradient-only blank, and **not** a hard pop.
- Turn the emulation off, reload: full boot animation returns.

- [ ] **Step 6: Commit**

```bash
git add components/BackgroundScene.tsx
git commit -m "feat(holo): reduced-motion lit still-frame + tighten idle mount to 280ms"
```

---

## Task 5: Coordinated hero cascade (`page.tsx`)

**Files:**
- Modify: `app/page.tsx`

Consolidate the hand-rolled `reveal` onto `motion.ts`'s `staggerContainer` + `fadeUp`, keep the LCP chain (avatar, H1, tagline) painted (`initial={false}`), and reserve `hidden→show` for the lower group + terminal.

- [ ] **Step 1: Swap imports + delete the local `reveal`**

Replace:

```tsx
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Cloud, GraduationCap, Github, Mail, MapPin } from "lucide-react";
```

with:

```tsx
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Cloud, GraduationCap, Github, Mail, MapPin } from "lucide-react";
import { fadeUp, staggerContainer } from "@/components/motion";
```

Delete the local `reveal` constant entirely:

```tsx
const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.04 + i * 0.04, ease: [0.16, 1, 0.3, 1] as const },
  }),
};
```

- [ ] **Step 2: Repaint the LCP chain (avatar, H1, tagline) as settled, not animated-in**

Replace the avatar `motion.div`, the `HeaderTypewriter` `motion.div`, and the tagline `motion.p`. Old (three blocks):

```tsx
            <motion.div
              custom={0}
              variants={reveal}
              initial={false}
              animate="show"
              className="flex items-center gap-3"
            >
```
…
```tsx
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
```

New — keep them as plain `motion` elements that render in final state (no enter animation, so LCP/CLS are untouched):

```tsx
            <motion.div initial={false} className="flex items-center gap-3">
```
…
```tsx
            <motion.div initial={false}>
              <HeaderTypewriter />
            </motion.div>

            <motion.p
              initial={false}
              className="measure text-balance text-xl font-medium text-foreground sm:text-2xl"
            >
              {resumeData.tagline}
            </motion.p>
```

(Only the opening tags change — leave the inner avatar/picture markup and the tagline text exactly as-is.)

- [ ] **Step 3: Wrap the lower group in a stagger container**

The lower group is the descriptive paragraph + pills `<ul>` + CTA row. Replace those three blocks. Old:

```tsx
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
```

New — one stagger container wrapping `fadeUp` children (note the wrapper repeats the column's `flex flex-col items-start gap-6` so spacing is identical):

```tsx
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
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
```

> The `cta-sheen` and `link-underline` classes are defined in Task 9/11; harmless no-ops until then.

- [ ] **Step 4: Time the terminal column to land last (~1s)**

Replace the terminal `motion.div`. Old:

```tsx
          <motion.div
            custom={6}
            variants={reveal}
            initial="hidden"
            animate="show"
            className="w-full lg:col-span-5"
          >
            <TerminalTyping />
          </motion.div>
```

New:

```tsx
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
            className="w-full lg:col-span-5"
          >
            <TerminalTyping />
          </motion.div>
```

- [ ] **Step 5: Typecheck + lint + build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 6: Visual verify the coincidence**

`npm run dev`, hard-reload the home page:

- H1 "Software Engineer." is painted **immediately** (no fade from nothing).
- Below it, paragraph → pills → CTAs cascade up in a tidy stagger; the terminal settles last around the same beat the holo's lock-pulse fires (~1.0–1.2s). If the pulse lands noticeably before/after the terminal, nudge `BOOT_DUR`/terminal `delay` (note in commit).
- Lighthouse (or DevTools Performance) shows LCP not regressed vs. `master`.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat(hero): consolidate cascade onto staggerContainer, keep LCP chain painted, time terminal to boot"
```

---

## Task 6: Add the `clipReveal` laser-wipe variant (`motion.ts`)

**Files:**
- Modify: `components/motion.ts`

- [ ] **Step 1: Append the variant**

After `scaleIn` (before `staggerContainer`), add:

```ts
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
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add components/motion.ts
git commit -m "feat(motion): add clipReveal laser-wipe heading variant"
```

---

## Task 7: Apply the laser-wipe to section headings

**Files:**
- Modify: `components/ActPhilosophy.tsx`, `components/ActSkills.tsx`, `components/ActContact.tsx`

We apply `clipReveal` to the three **visible** section headings (Philosophy, Skills, Contact). `ActExperience`'s section heading is `sr-only` and the act already carries its own horizontal-scroll motion language, so it's intentionally excluded.

- [ ] **Step 1: ActPhilosophy heading**

In `components/ActPhilosophy.tsx`, update the import line:

```tsx
import { motion } from "framer-motion";
```
→
```tsx
import { motion, useReducedMotion } from "framer-motion";
```

Add the `fadeUp`/`clipReveal` import (the file currently imports nothing from `motion.ts`):

```tsx
import { clipReveal, fadeUp } from "@/components/motion";
```

Inside `export default function ActPhilosophy() {`, add at the top of the body:

```tsx
    const reducedMotion = useReducedMotion();
    const headingVariants = reducedMotion ? fadeUp : clipReveal;
```

Replace the `<h2>` (the "ENGINEER THE / SYSTEMS WE RELY ON." heading) with a `motion.h2`:

```tsx
                <motion.h2
                    variants={headingVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    className="text-6xl font-black leading-[1.05] tracking-tight text-foreground [overflow-wrap:anywhere]"
                >
                    ENGINEER THE
                    <br />
                    <span className="text-primary text-glow">
                        SYSTEMS WE RELY ON.
                    </span>
                </motion.h2>
```

- [ ] **Step 2: ActSkills heading**

In `components/ActSkills.tsx`, update imports:

```tsx
import { motion, type Variants } from "framer-motion";
```
→
```tsx
import { motion, useReducedMotion, type Variants } from "framer-motion";
```

```tsx
import { scaleIn } from "@/components/motion";
```
→
```tsx
import { scaleIn, clipReveal, fadeUp } from "@/components/motion";
```

Inside `export default function ActSkills() {`, add:

```tsx
    const reducedMotion = useReducedMotion();
    const headingVariants = reducedMotion ? fadeUp : clipReveal;
```

Replace the `<h2>` inside the `motion.header` (the "THE / STACK" heading) with:

```tsx
                    <motion.h2
                        variants={headingVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.3 }}
                        className="text-7xl font-bold tracking-tight leading-[0.95] [overflow-wrap:anywhere]"
                    >
                        THE
                        <br />
                        <span className="text-primary">STACK</span>
                    </motion.h2>
```

(The surrounding `motion.header` keeps its own fade — that's fine; the heading clip plays inside it.)

- [ ] **Step 3: ActContact heading**

In `components/ActContact.tsx`, update imports:

```tsx
import { motion } from "framer-motion";
```
→
```tsx
import { motion, useReducedMotion } from "framer-motion";
```

```tsx
import { scaleIn, viewportOnce } from "@/components/motion";
```
→
```tsx
import { scaleIn, viewportOnce, clipReveal, fadeUp } from "@/components/motion";
```

Inside `export default function ActContact() {`, after the `primary`/`secondary`/`credibility` consts, add:

```tsx
    const reducedMotion = useReducedMotion();
    const headingVariants = reducedMotion ? fadeUp : clipReveal;
```

Replace the `motion.h2` (the "Let's build / something good." heading). Old:

```tsx
                        <motion.h2
                            {...reveal(0.06)}
                            className="text-7xl font-bold text-foreground tracking-tight [overflow-wrap:anywhere]"
                        >
                            Let&rsquo;s build
                            <br />
                            something good
                            <span className="animate-pulse text-primary">.</span>
                        </motion.h2>
```

New:

```tsx
                        <motion.h2
                            variants={headingVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.3 }}
                            className="text-7xl font-bold text-foreground tracking-tight [overflow-wrap:anywhere]"
                        >
                            Let&rsquo;s build
                            <br />
                            something good
                            <span className="animate-pulse text-primary">.</span>
                        </motion.h2>
```

- [ ] **Step 4: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 5: Visual verify**

`npm run dev`: scroll to Philosophy, Skills, Contact — each heading **wipes in left→right** once. Toggle DevTools reduced-motion emulation: headings instead **fade up** (no wipe). Confirm no clipped/half-hidden headings persist after reveal.

- [ ] **Step 6: Commit**

```bash
git add components/ActPhilosophy.tsx components/ActSkills.tsx components/ActContact.tsx
git commit -m "feat(reveals): laser-wipe section headings with reduced-motion fade fallback"
```

---

## Task 8: Remove double-smoothing on scroll rails

**Files:**
- Modify: `components/StageManager.tsx`, `components/ScrollProgress.tsx`

Lenis already eases the native scroll; wrapping `scrollYProgress` in `useSpring` double-smooths into a laggy/floaty rail.

- [ ] **Step 1: StageManager**

Update the import:

```tsx
import {
    motion,
    AnimatePresence,
    useScroll,
    useSpring,
} from "framer-motion";
```
→
```tsx
import { motion, AnimatePresence, useScroll } from "framer-motion";
```

Replace:

```tsx
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
        restDelta: 0.001,
    });
```
with:
```tsx
    // Drive the marker straight from scrollYProgress — Lenis already eases the
    // scroll, so an extra useSpring would double-smooth into a floaty rail.
    const { scrollYProgress } = useScroll();
```

Replace the marker's style:

```tsx
                        style={{ height: "100%", scaleY: smoothProgress }}
```
with:
```tsx
                        style={{ height: "100%", scaleY: scrollYProgress }}
```

- [ ] **Step 2: ScrollProgress**

Update the import:

```tsx
import { motion, useScroll, useSpring } from "framer-motion";
```
→
```tsx
import { motion, useScroll } from "framer-motion";
```

Replace:

```tsx
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
```
with:
```tsx
  // Lenis already eases scroll; bind scaleX directly (no double-smoothing).
  const { scrollYProgress } = useScroll();
```

Replace the style:

```tsx
      style={{ scaleX, opacity: isVisible ? 1 : 0 }}
```
with:
```tsx
      style={{ scaleX: scrollYProgress, opacity: isVisible ? 1 : 0 }}
```

- [ ] **Step 3: Typecheck + lint + build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 4: Visual verify**

`npm run dev`: scroll — the top progress bar and the left act-marker rail track the wheel **tightly** (no lagging catch-up after you stop). Reduced-motion still fine (rails were never transform-looping).

- [ ] **Step 5: Commit**

```bash
git add components/StageManager.tsx components/ScrollProgress.tsx
git commit -m "fix(scroll): drop useSpring double-smoothing over Lenis-driven progress"
```

---

## Task 9: `.link-underline` utility + apply to text links

**Files:**
- Modify: `app/globals.css`, `components/ActContact.tsx`

(The hero GitHub link already got the class in Task 5 Step 3.)

- [ ] **Step 1: Add the utility to globals.css**

After the `.text-laser` block (near the "Animated gradient text" section), add:

```css
/* Affordance underline for text links — 1px violet hairline that wipes in from
   the leading edge. transform-only (compositor-cheap); the global reduced-motion
   transition cap turns it into a near-instant state swap. */
.link-underline {
  position: relative;
}
.link-underline::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 1px;
  width: 100%;
  background: var(--primary);
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.link-underline:hover::after,
.link-underline:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left center;
}
```

- [ ] **Step 2: Apply to ActContact secondary link labels**

In `components/ActContact.tsx`, the secondary link's primary label span currently reads:

```tsx
                                                    <span className="truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
                                                        {link.label}
                                                    </span>
```

Change it to add `link-underline group-hover:[&::after]:scale-x-100`? No — keep it CSS-driven: wrap the label with the utility on hover via the parent group. Simplest robust approach — apply the utility class directly to the label span and let its own `:hover` drive it is wrong (hover is on the anchor). Instead add a parent-group-driven variant. Replace the span with:

```tsx
                                                    <span className="link-underline-onhover truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
                                                        {link.label}
                                                    </span>
```

- [ ] **Step 3: Add the group-hover underline variant to globals.css**

Append below `.link-underline` in `app/globals.css`:

```css
/* Group-driven variant: underline reveals when the ANCESTOR .group is hovered
   (for links where the hover target is a wrapping anchor, not the text span). */
.link-underline-onhover {
  position: relative;
}
.link-underline-onhover::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 1px;
  width: 100%;
  background: var(--primary);
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.group:hover .link-underline-onhover::after,
.group:focus-visible .link-underline-onhover::after {
  transform: scaleX(1);
  transform-origin: left center;
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 5: Visual verify**

`npm run dev`: hover the hero "GitHub" link → violet underline wipes in left→right; hover a Contact secondary link → its label underlines. Keyboard-tab to them → same on focus.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css components/ActContact.tsx
git commit -m "feat(links): link-underline affordance utility on text links"
```

---

## Task 10: Magnetic dock refactor (`Navigation`)

**Files:**
- Modify: `components/Navigation.tsx`

Move the magnetic pull off the React render path (motion values + one-time rect read) and lag the icon for tactile mass.

- [ ] **Step 1: Update imports**

```tsx
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
```
→
```tsx
import { useEffect, useRef, useState } from "react";
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";
```

- [ ] **Step 2: Replace the `MagneticButton` body (state → motion values)**

Replace everything from `const ref = useRef<HTMLAnchorElement>(null);` down to the `return (` inside `MagneticButton`. Old:

```tsx
    const ref = useRef<HTMLAnchorElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent) => {
        if (!enableMotion || !ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.1, y: middleY * 0.1 }); // Magnetic strength
    };

    const reset = () => setPosition({ x: 0, y: 0 });

    // Only drive the spring transform when motion is enabled; otherwise stay put.
    const { x, y } = enableMotion ? position : { x: 0, y: 0 };

    return (
        <motion.div
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className="group relative"
        >
```

New:

```tsx
    const ref = useRef<HTMLAnchorElement>(null);
    const rect = useRef<DOMRect | null>(null);

    // Motion values update the transform OFF the React render path (no re-render
    // of this fixed dock per mousemove). Springs add the heavy/premium glide.
    const mvX = useMotionValue(0);
    const mvY = useMotionValue(0);
    const x = useSpring(mvX, { stiffness: 150, damping: 20, mass: 0.1 });
    const y = useSpring(mvY, { stiffness: 150, damping: 20, mass: 0.1 });
    // Icon lags the chip slightly → tactile sense of mass.
    const iconX = useTransform(x, (v) => v * 0.4);
    const iconY = useTransform(y, (v) => v * 0.4);

    // Read the bounding rect ONCE on enter (not per move) to avoid layout thrash.
    const handleEnter = () => {
        if (enableMotion && ref.current) rect.current = ref.current.getBoundingClientRect();
    };
    const handleMove = (e: React.MouseEvent) => {
        if (!enableMotion || !rect.current) return;
        const r = rect.current;
        mvX.set((e.clientX - (r.left + r.width / 2)) * 0.18);
        mvY.set((e.clientY - (r.top + r.height / 2)) * 0.18);
    };
    const reset = () => {
        mvX.set(0);
        mvY.set(0);
    };

    return (
        <motion.div style={{ x, y }} className="group relative">
```

- [ ] **Step 3: Wire the new handlers on the `Link` + lag the icon**

In the `Link`, replace:

```tsx
            <Link
                ref={ref}
                href={href}
                onClick={onClick}
                onMouseMove={handleMouse}
                onMouseLeave={reset}
```
with:
```tsx
            <Link
                ref={ref}
                href={href}
                onClick={onClick}
                onMouseEnter={handleEnter}
                onMouseMove={handleMove}
                onMouseLeave={reset}
```

Wrap the icon `{children}` so it lags. Replace:

```tsx
            >
                {children}
                {/* Single label span = the link's accessible name. Visually hidden
```
with:
```tsx
            >
                <motion.span style={{ x: iconX, y: iconY }} className="inline-flex">
                    {children}
                </motion.span>
                {/* Single label span = the link's accessible name. Visually hidden
```

- [ ] **Step 4: Confirm `useState` is still used elsewhere**

`useState` is still used by `useEnableMotion`/`useActiveSection`, so the import stays. Run:

```bash
npm run typecheck && npm run lint
```

Expected: clean (no "unused `useState`").

- [ ] **Step 5: Visual verify**

`npm run dev` on desktop (fine pointer): hover the bottom dock — chips pull toward the cursor with a heavier, smoother glide; the icon trails the chip slightly. In DevTools → Performance, recording a hover sweep shows **no per-frame React commits** on the nav. Touch/reduced-motion: dock stays static.

- [ ] **Step 6: Commit**

```bash
git add components/Navigation.tsx
git commit -m "perf(nav): magnetic dock via motion values + one-time rect read + icon lag"
```

---

## Task 11: Email-CTA specular sheen

**Files:**
- Modify: `app/globals.css`

(The hero "Email me" anchor already got the `cta-sheen` class in Task 5 Step 3.)

- [ ] **Step 1: Add the `.cta-sheen` utility**

After the `.link-underline-onhover` block in `app/globals.css`, add:

```css
/* One-shot specular sweep for the single filled violet CTA. Hover-triggered,
   never looping. Low-alpha so it reads as a sheen, not a flash. Gated to
   hover-capable pointers; the global reduced-motion cap shortens it harmlessly. */
.cta-sheen {
  position: relative;
  overflow: hidden;
}
.cta-sheen::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255, 255, 255, 0.18) 50%,
    transparent 70%
  );
  transform: translateX(-120%);
}
@media (hover: hover) {
  .cta-sheen:hover::before {
    transform: translateX(120%);
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
}
```

- [ ] **Step 2: Typecheck + lint + build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 3: Visual verify**

`npm run dev`: hover the hero "Email me" button → a soft diagonal highlight sweeps across once and stops (no loop). The button's existing glow/colors are unchanged. Tap target / focus ring intact.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(cta): one-shot specular sheen on the Email CTA"
```

---

## Task 12: Full-site verification pass

**Files:** none (verification + final build).

- [ ] **Step 1: Static gates**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all clean.

- [ ] **Step 2: Desktop, full-motion** (`npm run dev`, fresh hard-reload)

- [ ] Holo boots (scan bottom→top, glow ramps, single lock-pulse), then idles — **no pop**.
- [ ] Hero H1 painted instantly; paragraph/pills/CTAs cascade; terminal lands ~with the lock-pulse.
- [ ] Section headings laser-wipe (Philosophy, Skills, Contact).
- [ ] Progress bar + act-marker track scroll tightly.
- [ ] Dock magnetic pull is smooth; link underlines + Email sheen + arrow nudges work.
- [ ] Scroll past hero → holo render loop goes idle (DevTools Rendering/Performance); scroll back → resumes, no re-boot.

- [ ] **Step 3: Reduced motion** (DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload)

- [ ] Holo = static lit orb (no scan/rotation/pulse), faded in once.
- [ ] Hero + headings = opacity-led (no wipes, no large travel).
- [ ] No looping animations except the (frozen) aurora.

- [ ] **Step 4: Mobile / low-power** (DevTools device toolbar + 4× CPU throttle, reload)

- [ ] Holo boots at ~30fps and reads correctly (scan + glow visible).
- [ ] No long-task jank during entrance; page scrolls smoothly.

- [ ] **Step 5: Layer hygiene** (DevTools → Rendering → Layer borders)

- [ ] ~3 aurora layers + 1 canvas — **not** one resident layer per revealed section.

- [ ] **Step 6: Final state — report, do not push**

```bash
git status
git log --oneline master..HEAD
```

Summarize changed files + verification results for the user. **Do not push or open a PR** (conservative git policy) — leave that to the user.

---

## Self-review notes (author)

- **Spec coverage:** §2 holo boot → Tasks 1–4; §3 hero → Task 5; §4 scroll-reveal (clipReveal + double-smoothing fix) → Tasks 6–8; §5 micro-interactions → Tasks 9–11; §6 perf (scroll-pause) + a11y (reduced-motion lit frame) → Tasks 2–4. Deferred infra (content-visibility, native scroll-timeline, GL warm-up) intentionally omitted per scope.
- **Scope nuance:** §4.2 named "four" headings; ActExperience's heading is `sr-only`, so only the three visible headings get the wipe (noted in Task 7). This is an honest, intentional deviation from the spec's count.
- **Type consistency:** `damp(current, target, lambda, delta)` signature is identical across `HoloLattice`, `BloomBoot`. `reducedMotion` prop threads `BackgroundScene → Scene → HoloLattice`. `BloomLike = { intensity: number }` is the one bloom-ref shape.
- **No placeholders:** every code step shows full before/after. The only "tune live" item (BOOT_DUR vs terminal delay) is an approved open decision, surfaced in Task 5 Step 6.
