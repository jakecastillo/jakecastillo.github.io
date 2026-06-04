"use client";

import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Torus } from "@react-three/drei";
import * as THREE from "three";
import { useBootStore } from "@/store/useBootStore";
import { useDesktopStore } from "@/store/useDesktopStore";

// Reveal "landing" tunables
const REVEAL_DURATION = 1.5; // seconds for the bloom spike to settle
const SNAP_DURATION = 0.35; // fast one-shot lock-ring "snap closed" window
const EMISSIVE_BASE = 0.25; // calm baseline emissive intensity
const EMISSIVE_PEAK = 2.6; // spike intensity on reveal (drives bloom)
const SCALE_BUMP = 0.08; // brief scale overshoot on reveal

// Whole-orb scale: the perimeter should FRAME the centered desktop/terminal,
// so the lattice + lock-ring read as a guarded boundary around the content.
const ORB_GROUP_SCALE = 1.35; // enlarge the perimeter to bracket the desktop

// Containment-field (geodesic shield-mesh) opacity tunables. The mesh reads as a
// contained boundary the inner core respects, rather than diffuse decoration.
// Lifted well above the previous ~0.08–0.16 so the lattice reads as STRUCTURE
// (a visible guarded perimeter) at a glance, even behind the centered window.
const MESH_OPACITY_BASE = 0.36; // settled shield-mesh opacity (clearly visible)
const MESH_OPACITY_START = 0.2; // pre-reveal / pre-lock opacity
const MESH_OPACITY_PEAK = 0.5; // spike opacity at the reveal "lock"

// Mobile damping: keep the orb a quiet backdrop so it never competes with body
// text in the content tabs. Scale down, drop opacity, and shift it low — but
// keep it PERCEPTIBLE (not invisible) so the brand perimeter still registers.
const MOBILE_GROUP_SCALE = 0.62; // shrink the whole orb on mobile
const MOBILE_GROUP_Y = -2.4; // push it below the reading area
const MOBILE_MESH_OPACITY = 0.14; // shield-mesh present but quiet on mobile
const MOBILE_RING_OPACITY = 0.22; // perimeter lock-ring perceptible on mobile

// R7 mobile seal envelope: mobile previously collapsed ring start/base/peak onto
// the single MOBILE_RING_OPACITY constant, so the seal+snap had ZERO amplitude
// (no visible snap). These give the mobile envelope real start->peak swing so the
// "boundary established" beat actually animates on phone (paired with the CSS
// cyan radial-glow burst in Scene.tsx that fakes the bloom mobile can't run).
const MOBILE_RING_OPACITY_START = 0.1; // pre-lock floor on mobile (faint)
const MOBILE_RING_OPACITY_PEAK = 0.5; // snap peak on mobile (clearly brighter)

// Secure-perimeter lock-ring tunables. An equatorial containment ring brackets
// the shield-mesh and, on reveal, SNAPS CLOSED to a brighter sealed state with a
// bright cyan bloom pulse — a one-shot, glanceable "boundary established" cue
// legible in a single frame, even thumbnail-size.
const RING_OPACITY_BASE = 0.6; // settled lock-ring opacity (clear boundary line)
const RING_OPACITY_START = 0.18; // pre-reveal / pre-lock opacity
const RING_OPACITY_PEAK = 1.0; // "locked" peak opacity on the snap
const RING_EMISSIVE_BASE = 1.3; // settled lock-ring glow
const RING_EMISSIVE_PEAK = 5.0; // glow at the moment of snap (drives cyan bloom)

// R1 re-snap (secure-action re-fire). The boot reveal is the FIRST lock and stays
// the brightest; deliberate secure actions (Contact open, Terminal audit/hire)
// re-arm a shorter snap whose emissive is capped BELOW the boot peak so re-snaps
// read as subordinate echoes of the original seal, not competing flashes.
const RING_EMISSIVE_RESNAP_PEAK = 3.0; // re-snap glow cap (< boot 5.0)
const RING_OPACITY_RESNAP_PEAK = 0.9; // re-snap opacity peak (< boot 1.0)

// Full-sphere "closure" cue (R9-1). The equatorial lock-ring reads as a flat
// horizontal BAND on its own; two faint violet MERIDIAN great-circle arcs run
// orthogonal to it (vertical, pole-to-pole) so the eye closes the silhouette and
// the perimeter reads as a spherical secure-perimeter ORB at a glance — even
// thumbnail-size. Kept barely-visible (~6–9% opacity) so it adds spherical
// shape WITHOUT visual noise, and they reuse the violet lattice color so no new
// visual language is introduced. Cheap thin tori → no meaningful poly increase.
const MERIDIAN_OPACITY = 0.08; // settled meridian opacity on desktop (~8%)
const MERIDIAN_OPACITY_START = 0.03; // pre-reveal opacity (fades in with the seal)
const MOBILE_MERIDIAN_OPACITY = 0.04; // meridians barely-there on mobile

// R2 reactive-orb tunables ----------------------------------------------------

// Pointer-parallax: how far (radians) the whole orb tilts toward the cursor. A
// few degrees — enough to read as "alive / tracking", never enough to disorient.
const PARALLAX_MAX = 0.14; // ~8° of tilt at the screen edges
const PARALLAX_LERP = 0.06; // per-frame easing toward the pointer target

// Window-aware recede: as open windows accumulate, the perimeter CONTRACTS toward
// a corner and DIMS (never brightens — protects open-window text contrast). The
// "perimeter contracts as the system is used" enacts the security thesis without
// fighting legibility. Recede saturates by RECEDE_SATURATE_AT open windows.
const RECEDE_SATURATE_AT = 3; // recede is fully applied at N open windows
const RECEDE_SCALE_MIN = 0.74; // how far the group shrinks when fully receded
const RECEDE_CORNER = new THREE.Vector3(2.2, 1.3, 0); // target corner offset
const RECEDE_LERP = 0.08; // per-frame easing of the recede transform
// When fully receded, dim the desktop lattice/ring toward (but not below) the
// mobile floor so open-window text keeps its contrast headroom.
const RECEDE_DIM_FLOOR = 0.45; // multiplier applied to settled opacity at full recede

// Per-focused-app emissive nudge ("live status readout"): each app maps to a
// small additive core-emissive bump, strictly within the existing violet core —
// no new hues, just a faint breathing-by-context cue. Kept tiny so it never
// competes with the reveal spike or the recede dimming.
const FOCUS_EMISSIVE_NUDGE: Record<string, number> = {
    terminal: 0.1,
    about: 0.05,
    career: 0.06,
    stack: 0.08,
    projects: 0.07,
    contact: 0.12,
    readme: 0.04,
};

// Minimal structural view of the desktop store. PLATFORM owns the canonical
// shape; we read defensively (optional secureActionAt) so this compiles and runs
// whether or not the secure-action field has landed yet at gate time.
type DesktopStoreShape = {
    windows: Record<string, unknown>;
    focusedId: string | null;
    secureActionAt?: number | null;
};

function readDesktop(): {
    openCount: number;
    focusedId: string | null;
    secureActionAt: number | null;
} {
    const s = useDesktopStore.getState() as unknown as DesktopStoreShape;
    const windows = s.windows ?? {};
    let openCount = 0;
    for (const id in windows) {
        if (windows[id]) openCount += 1;
    }
    return {
        openCount,
        focusedId: s.focusedId ?? null,
        secureActionAt: s.secureActionAt ?? null,
    };
}

export default function QuantumOrb({
    isDesktop = true,
    allowMotion = true,
}: {
    isDesktop?: boolean;
    allowMotion?: boolean;
}) {
    // recedeGroupRef wraps the inner orb so the window-aware recede (scale +
    // corner translate) and the pointer-parallax tilt compose cleanly on top of
    // the per-element rotation/hover the inner refs already drive.
    const recedeGroupRef = useRef<THREE.Group>(null);
    const orbRef = useRef<THREE.Mesh>(null);
    const meshShellRef = useRef<THREE.LineSegments>(null);
    const lockRingRef = useRef<THREE.Mesh>(null);
    const meridiansRef = useRef<THREE.Group>(null);
    const orbMatRef = useRef<ComponentRef<typeof MeshDistortMaterial>>(null);
    const meshMatRef = useRef<THREE.LineBasicMaterial>(null);
    const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
    // Two faint violet meridian arcs (closure cue); one ref each, both driven
    // identically per frame — same mutable-handle pattern as the mats above.
    const meridianMatRefA = useRef<THREE.MeshBasicMaterial>(null);
    const meridianMatRefB = useRef<THREE.MeshBasicMaterial>(null);

    const phase = useBootStore((s) => s.phase);
    const invalidate = useThree((s) => s.invalidate);

    // Timestamp (clock seconds) when the reveal landing began; null until armed.
    const revealStartRef = useRef<number | null>(null);
    // Guard so the one-shot landing only arms once when entering reveal.
    const armedRef = useRef(false);

    // R1 re-snap: clock-seconds timestamp when the current re-snap began; null
    // when idle. Kept SEPARATE from revealStartRef so a re-snap never disturbs
    // the boot landing envelope, and re-arms are ignored while one is in flight.
    const snapStartRef = useRef<number | null>(null);
    // Last secureActionAt we acted on, so the store subscription only re-arms on
    // a genuinely new stamp (not on unrelated store writes).
    const lastSecureAtRef = useRef<number | null>(null);

    // R2 smoothed recede progress [0..1] (eased toward the target each frame) and
    // the smoothed pointer-parallax tilt, kept in refs so reduced-motion's demand
    // frameloop can resume them mid-transition without React churn.
    const recedeRef = useRef(0);
    const parallaxRef = useRef({ x: 0, y: 0 });
    const focusEmissiveRef = useRef(0);

    // Stable phase offset to keep motion organic without impure render-time randomness
    const phaseOffset = Math.PI * 0.61803398875;

    // Wireframe geometries built once. The geodesic icosahedron reads as a
    // hexagonal/triangular shield-mesh; wireframe edges turn it into a lattice.
    const shellGeometry = useMemo(() => {
        // detail 1 keeps the triangle count low (perf) while still reading as a
        // geometric containment lattice rather than a smooth sphere. The larger
        // radius (was 2.35) lets the perimeter frame the centered desktop window.
        const base = new THREE.IcosahedronGeometry(2.8, 1);
        return new THREE.WireframeGeometry(base);
    }, []);
    useEffect(() => () => shellGeometry.dispose(), [shellGeometry]);

    // Arm the one-shot landing when the phase first reaches reveal (or ready).
    useEffect(() => {
        if ((phase === "reveal" || phase === "ready") && !armedRef.current) {
            armedRef.current = true;
            // Mark with a sentinel; useFrame converts it to an absolute clock time.
            revealStartRef.current = -1;
        }
    }, [phase]);

    // R2 + R1 store subscription. Runs OUTSIDE React render (no re-render churn).
    // Critical: reduced-motion uses frameloop="demand", so per-frame lerps don't
    // tick on their own — we invalidate() on window-count / focus / secure-action
    // change to drive the recede + re-snap transitions to completion.
    useEffect(() => {
        // Seed baselines so the first transition starts from the current truth.
        const initial = readDesktop();
        let lastCount = initial.openCount;
        let lastFocus = initial.focusedId;
        lastSecureAtRef.current = initial.secureActionAt;

        const unsubscribe = useDesktopStore.subscribe(() => {
            const { openCount, focusedId, secureActionAt } = readDesktop();

            // Window count or focus changed → the recede target / focus nudge
            // moved; request frames so the eased transition actually renders
            // (a no-op cost under "always"; the whole point under "demand").
            if (openCount !== lastCount || focusedId !== lastFocus) {
                lastCount = openCount;
                lastFocus = focusedId;
                invalidate();
            }

            // R1 re-snap: desktop + motion only. Mobile has no bloom and the orb
            // is below-fold, so a re-snap there is invisible waste; reduced-motion
            // keeps the static-locked perimeter. Ignore re-arms while one is in
            // flight (snapStartRef set) so rapid actions don't strobe.
            if (
                allowMotion &&
                isDesktop &&
                secureActionAt != null &&
                secureActionAt !== lastSecureAtRef.current
            ) {
                lastSecureAtRef.current = secureActionAt;
                if (snapStartRef.current === null) {
                    // Sentinel; useFrame converts to an absolute clock time.
                    snapStartRef.current = -1;
                    invalidate();
                }
            }
        });
        return unsubscribe;
    }, [allowMotion, isDesktop, invalidate]);

    // Apply the eased recede progress to the wrapper group: shrink toward
    // RECEDE_SCALE_MIN and translate toward the corner. Pointer-parallax writes
    // rotation on the same group (motion path only), so transforms compose.
    // Declared before useFrame so it is initialized before its first call.
    const applyRecedeTransform = (p: number) => {
        const g = recedeGroupRef.current;
        if (!g) return;
        const baseScale = isDesktop ? ORB_GROUP_SCALE : MOBILE_GROUP_SCALE;
        const scaleMul = 1 - (1 - RECEDE_SCALE_MIN) * p;
        g.scale.setScalar(baseScale * scaleMul);
        g.position.set(
            RECEDE_CORNER.x * p,
            RECEDE_CORNER.y * p,
            RECEDE_CORNER.z * p,
        );
    };

    useFrame((state) => {
        if (!orbRef.current || !meshShellRef.current) return;

        const { openCount, focusedId } = readDesktop();

        // Window-aware recede progress: 0 (empty desktop) → 1 (>= saturate count).
        // Mobile never recedes (the orb is already a quiet, shrunk backdrop).
        const recedeTarget =
            isDesktop && RECEDE_SATURATE_AT > 0
                ? Math.min(openCount / RECEDE_SATURATE_AT, 1)
                : 0;

        // Reduced-motion fast-path: render a flat, brighter-but-STATIC orb with
        // the secure perimeter already "locked" — no rotation, hover, pulsing,
        // or reveal animation. Honors prefers-reduced-motion; one demand render
        // is enough to show an established boundary (no per-frame work). The
        // recede still SETTLES (eased) so opening windows visibly contracts +
        // dims the perimeter even under reduced motion — driven by invalidate().
        if (!allowMotion) {
            // Ease recede toward target; snap when essentially arrived so the
            // demand frameloop can stop requesting frames.
            recedeRef.current = THREE.MathUtils.lerp(
                recedeRef.current,
                recedeTarget,
                RECEDE_LERP,
            );
            if (Math.abs(recedeRef.current - recedeTarget) < 0.002) {
                recedeRef.current = recedeTarget;
            } else {
                invalidate();
            }
            applyRecedeTransform(recedeRef.current);

            // Dim factor: 1 at rest → RECEDE_DIM_FLOOR multiplier fully receded.
            const dim = 1 - (1 - RECEDE_DIM_FLOOR) * recedeRef.current;
            const meshSettled =
                (isDesktop ? MESH_OPACITY_BASE : MOBILE_MESH_OPACITY) * dim;
            const ringSettled =
                (isDesktop ? RING_OPACITY_BASE : MOBILE_RING_OPACITY) * dim;
            if (orbMatRef.current) {
                orbMatRef.current.emissiveIntensity =
                    (isDesktop ? EMISSIVE_BASE : EMISSIVE_BASE * 0.35) * dim;
            }
            if (meshMatRef.current) {
                meshMatRef.current.opacity = meshSettled;
            }
            if (ringMatRef.current) {
                ringMatRef.current.opacity = ringSettled;
                ringMatRef.current.emissiveIntensity =
                    (isDesktop
                        ? RING_EMISSIVE_BASE
                        : RING_EMISSIVE_BASE * 0.35) * dim;
            }
            // Static path: show the closed-sphere cue already settled (dimmed
            // with the recede so it never out-reads the receded ring).
            const meridianSettled =
                (isDesktop ? MERIDIAN_OPACITY : MOBILE_MERIDIAN_OPACITY) * dim;
            if (meridianMatRefA.current) {
                meridianMatRefA.current.opacity = meridianSettled;
            }
            if (meridianMatRefB.current) {
                meridianMatRefB.current.opacity = meridianSettled;
            }
            return;
        }

        const time = state.clock.getElapsedTime();

        // Ease the smoothed recede progress toward its target every frame.
        recedeRef.current = THREE.MathUtils.lerp(
            recedeRef.current,
            recedeTarget,
            RECEDE_LERP,
        );
        applyRecedeTransform(recedeRef.current);
        // Recede dimming multiplier (never brightens; floors at RECEDE_DIM_FLOOR).
        const dim = 1 - (1 - RECEDE_DIM_FLOOR) * recedeRef.current;

        // Pointer-parallax: tilt the whole orb a few degrees toward the cursor.
        // state.pointer is normalized device coords in [-1, 1]; map to a small
        // tilt and ease so it tracks smoothly. Desktop-meaningful, but harmless
        // on mobile (touch leaves pointer near 0). Entirely gated behind motion.
        const targetTiltX = -state.pointer.y * PARALLAX_MAX;
        const targetTiltY = state.pointer.x * PARALLAX_MAX;
        parallaxRef.current.x = THREE.MathUtils.lerp(
            parallaxRef.current.x,
            targetTiltX,
            PARALLAX_LERP,
        );
        parallaxRef.current.y = THREE.MathUtils.lerp(
            parallaxRef.current.y,
            targetTiltY,
            PARALLAX_LERP,
        );
        if (recedeGroupRef.current) {
            recedeGroupRef.current.rotation.x = parallaxRef.current.x;
            recedeGroupRef.current.rotation.y = parallaxRef.current.y;
        }

        // Mobile multipliers keep the perimeter present but quiet. On mobile the
        // ring envelope now has real amplitude (R7): start/base/peak no longer
        // collapse to one constant, so the seal + snap is actually visible.
        const meshTargetBase = isDesktop ? MESH_OPACITY_BASE : MOBILE_MESH_OPACITY;
        const meshTargetStart = isDesktop
            ? MESH_OPACITY_START
            : MOBILE_MESH_OPACITY;
        const meshTargetPeak = isDesktop ? MESH_OPACITY_PEAK : MOBILE_MESH_OPACITY;
        const ringTargetBase = isDesktop ? RING_OPACITY_BASE : MOBILE_RING_OPACITY;
        const ringTargetStart = isDesktop
            ? RING_OPACITY_START
            : MOBILE_RING_OPACITY_START;
        const ringTargetPeak = isDesktop
            ? RING_OPACITY_PEAK
            : MOBILE_RING_OPACITY_PEAK;

        // Very subtle base rotation
        const baseRotX = time * 0.05 + phaseOffset;
        const baseRotY = time * 0.08 + phaseOffset;

        orbRef.current.rotation.x = baseRotX;
        orbRef.current.rotation.y = baseRotY;

        // Shield-mesh shell rotates slowly so the lattice reads as a guarded,
        // structured boundary the inner core sits contained within.
        meshShellRef.current.rotation.x = -baseRotX * 0.4;
        meshShellRef.current.rotation.y = baseRotY * 0.5;

        // The lock-ring stays nearly fixed in orientation so it reads as a stable
        // perimeter line, drifting only slightly so it never looks frozen.
        if (lockRingRef.current) {
            lockRingRef.current.rotation.z = baseRotY * 0.15;
        }

        // Meridian closure arcs drift slowly (matching the shell cadence) so the
        // full-sphere silhouette reads as part of the structured lattice rather
        // than a static decal — but never enough to add visual noise.
        if (meridiansRef.current) {
            meridiansRef.current.rotation.y = baseRotY * 0.5;
        }

        // Gentle hovering effect
        const hoverY = Math.sin(time * 0.5) * 0.2;
        orbRef.current.position.y = hoverY;
        meshShellRef.current.position.y = hoverY;
        if (lockRingRef.current) {
            lockRingRef.current.position.y = hoverY;
        }
        if (meridiansRef.current) {
            meridiansRef.current.position.y = hoverY;
        }

        // Pulsing scale effect (calm baseline)
        let scale = 1 + Math.sin(time * 1.2) * 0.02;

        // One-shot reveal "landing + lock": brief emissive/opacity spike with a
        // slight scale bump that decays back to a calm baseline over
        // REVEAL_DURATION. The lock-ring snaps brighter to echo the
        // "Secure perimeter established" beat.
        let emissive = EMISSIVE_BASE;
        let meshOpacity = meshTargetStart;
        let ringOpacity = ringTargetStart;
        let ringEmissive = RING_EMISSIVE_BASE;

        // Meridian closure arcs: faint settled target, fading up from a near-zero
        // start as the perimeter seals so the sphere "closes" alongside the lock.
        const meridianTargetBase = isDesktop
            ? MERIDIAN_OPACITY
            : MOBILE_MERIDIAN_OPACITY;
        let meridianOpacity = isDesktop
            ? MERIDIAN_OPACITY_START
            : MOBILE_MERIDIAN_OPACITY;

        if (revealStartRef.current !== null) {
            if (revealStartRef.current < 0) {
                revealStartRef.current = time;
            }

            const elapsed = time - revealStartRef.current;
            const t = Math.min(elapsed / REVEAL_DURATION, 1);

            // Spike envelope: fast attack, smooth decay back toward baseline.
            // sin(pi * t) gives a single hump peaking at t = 0.5.
            const spike = Math.sin(Math.PI * t);
            // Monotonic "seal" envelope: ring ramps from start -> base as the
            // perimeter completes and stays locked (does not fall back to start).
            const seal = THREE.MathUtils.smoothstep(t, 0, 0.6);
            // One-shot "snap closed": a fast, bright cyan bloom pulse on the
            // lock-ring confined to SNAP_DURATION so "boundary established" reads
            // in a SINGLE frame even thumbnail-size. ts in [0,1] over the snap;
            // sin(pi * ts) gives a sharp peak then a quick fall to zero.
            const ts = Math.min(elapsed / SNAP_DURATION, 1);
            const snap = ts < 1 ? Math.sin(Math.PI * ts) : 0;

            emissive = EMISSIVE_BASE + (EMISSIVE_PEAK - EMISSIVE_BASE) * spike;
            meshOpacity =
                meshTargetBase + (meshTargetPeak - meshTargetBase) * spike;
            // Lock-ring: seal it monotonically to the locked baseline, then add a
            // sharp snap pulse on top (drives the bright cyan bloom).
            ringOpacity =
                ringTargetStart +
                (ringTargetBase - ringTargetStart) * seal +
                (ringTargetPeak - ringTargetBase) * snap;
            ringEmissive =
                RING_EMISSIVE_BASE +
                (RING_EMISSIVE_PEAK - RING_EMISSIVE_BASE) * snap;
            // The sphere "closes" monotonically with the seal so the full-sphere
            // read lands together with the locked perimeter.
            meridianOpacity =
                meridianOpacity + (meridianTargetBase - meridianOpacity) * seal;
            scale += SCALE_BUMP * spike;

            if (t >= 1) {
                // Landing finished: settle at calm/locked baselines and stop ramping.
                emissive = EMISSIVE_BASE;
                meshOpacity = meshTargetBase;
                ringOpacity = ringTargetBase;
                ringEmissive = RING_EMISSIVE_BASE;
                meridianOpacity = meridianTargetBase;
                revealStartRef.current = null;
            }
        }

        // R1 re-snap on a deliberate secure action (desktop + motion only — the
        // subscription already gates arming). A shorter SNAP_DURATION pulse on
        // the lock-ring, capped BELOW the boot peak so it stays subordinate to
        // the first lock. Composed ON TOP of the settled/locked baseline so it
        // never disturbs the boot landing envelope above.
        if (snapStartRef.current !== null) {
            if (snapStartRef.current < 0) {
                snapStartRef.current = time;
            }
            const rts = Math.min((time - snapStartRef.current) / SNAP_DURATION, 1);
            const resnap = rts < 1 ? Math.sin(Math.PI * rts) : 0;

            // Layer the re-snap over whatever the ring opacity/emissive already
            // is (locked baseline once the boot landing settled), taking the max
            // so a re-snap mid-landing never DIMS an in-progress brighter snap.
            ringOpacity = Math.max(
                ringOpacity,
                ringTargetBase +
                    (RING_OPACITY_RESNAP_PEAK - ringTargetBase) * resnap,
            );
            ringEmissive = Math.max(
                ringEmissive,
                RING_EMISSIVE_BASE +
                    (RING_EMISSIVE_RESNAP_PEAK - RING_EMISSIVE_BASE) * resnap,
            );

            if (rts >= 1) {
                snapStartRef.current = null;
            }
        }

        // Per-focused-app emissive nudge: a faint, eased additive bump to the
        // violet core keyed to the focused app — a "live status readout" within
        // the existing two-color system (no new hues). Eased so focus changes
        // breathe rather than pop.
        const nudgeTarget = focusedId
            ? FOCUS_EMISSIVE_NUDGE[focusedId] ?? 0
            : 0;
        focusEmissiveRef.current = THREE.MathUtils.lerp(
            focusEmissiveRef.current,
            nudgeTarget,
            0.05,
        );

        // Recede dimming: DIM the perimeter uniformly as it recedes so receded
        // windows keep their text contrast (never brighten). The reveal spike
        // fires on an empty desktop (recede ~0, dim ~1) so the boot "land" is
        // unaffected; this only bites once windows are actually open.
        ringOpacity = ringOpacity * dim;
        meshOpacity = meshOpacity * dim;
        meridianOpacity = meridianOpacity * dim;

        orbRef.current.scale.setScalar(scale);
        meshShellRef.current.scale.setScalar(scale);
        if (lockRingRef.current) {
            lockRingRef.current.scale.setScalar(scale);
        }
        if (meridiansRef.current) {
            meridiansRef.current.scale.setScalar(scale);
        }

        if (orbMatRef.current) {
            // Calm the core glow on mobile so it can't bleed through content; add
            // the focus nudge, then dim with the recede.
            const coreBase = isDesktop ? emissive : emissive * 0.35;
            orbMatRef.current.emissiveIntensity =
                (coreBase + focusEmissiveRef.current) * dim;
        }
        if (meshMatRef.current) {
            meshMatRef.current.opacity = meshOpacity;
        }
        if (ringMatRef.current) {
            ringMatRef.current.opacity = ringOpacity;
            ringMatRef.current.emissiveIntensity = isDesktop
                ? ringEmissive
                : ringEmissive * 0.35;
        }
        if (meridianMatRefA.current) {
            meridianMatRefA.current.opacity = meridianOpacity;
        }
        if (meridianMatRefB.current) {
            meridianMatRefB.current.opacity = meridianOpacity;
        }
    });

    return (
        <group position={[0, isDesktop ? 0 : MOBILE_GROUP_Y, -2]}>
            {/* Recede wrapper: window-aware contract + corner translate (R2) and
                pointer-parallax tilt write here so they compose on top of the
                per-element rotation/hover inside. Initial scale matches the
                surface so the first frame (incl. reduced-motion demand) is
                correct before useFrame runs. */}
            <group
                ref={recedeGroupRef}
                scale={isDesktop ? ORB_GROUP_SCALE : MOBILE_GROUP_SCALE}
            >
                {/* Inner Core — the contained payload that respects the boundary. */}
                <Sphere ref={orbRef} args={[1.0, 24, 24]}>
                    {/* Reduced segments (32 -> 24) to lighten the 3D payload. */}
                    <MeshDistortMaterial
                        ref={orbMatRef}
                        color="#0f172a"
                        emissive="#8b5cf6"
                        emissiveIntensity={EMISSIVE_BASE}
                        toneMapped={false}
                        roughness={0.2}
                        metalness={0.8}
                        distort={0.3}
                        speed={2}
                    />
                </Sphere>

                {/* Containment shield-mesh: a geodesic (triangular/hex) violet
                    lattice that forms a contained perimeter around the core. The
                    geometric edges read as a guarded boundary in <2s, tying the
                    orb to the DevSecOps story ("the secure path is the fast path")
                    without inventing new visual language. WireframeGeometry on a
                    low-detail icosahedron keeps the edge count cheap. */}
                <lineSegments ref={meshShellRef} geometry={shellGeometry}>
                    <lineBasicMaterial
                        ref={meshMatRef}
                        color="#8b5cf6"
                        toneMapped={false}
                        transparent
                        // Initial value is the locked BASE so reduced-motion
                        // (demand frameloop) shows an established perimeter even
                        // if useFrame does not re-run. The animated path
                        // overrides this each frame when motion is allowed.
                        opacity={MESH_OPACITY_BASE}
                    />
                </lineSegments>

                {/* Full-sphere closure cue (R9-1): two faint violet MERIDIAN
                    great-circle arcs run vertically (pole-to-pole), orthogonal to
                    the equatorial lock-ring, so the eye closes the silhouette and
                    the perimeter reads as a spherical ORB at a glance / thumbnail.
                    Each arc is barely-visible (~8% opacity) and reuses the violet
                    lattice color — added shape, no added noise, no new visual
                    language. Thin low-segment tori → negligible poly cost. */}
                <group ref={meridiansRef}>
                    {/* Meridian arc A (vertical great circle, XY plane). */}
                    <Torus args={[2.9, 0.022, 6, 96]}>
                        <meshBasicMaterial
                            ref={meridianMatRefA}
                            color="#8b5cf6"
                            toneMapped={false}
                            transparent
                            // Initial value is the settled cue so reduced-motion
                            // (demand frameloop) shows a closed sphere even if
                            // useFrame does not re-run; the seal animation fades it
                            // up from near-zero when motion is allowed.
                            opacity={MERIDIAN_OPACITY}
                        />
                    </Torus>
                    {/* Meridian arc B: same great circle rotated 90° about Y so the
                        two vertical arcs cross at the poles and bracket the sphere. */}
                    <Torus
                        args={[2.9, 0.022, 6, 96]}
                        rotation={[0, Math.PI / 2, 0]}
                    >
                        <meshBasicMaterial
                            ref={meridianMatRefB}
                            color="#8b5cf6"
                            toneMapped={false}
                            transparent
                            opacity={MERIDIAN_OPACITY}
                        />
                    </Torus>
                </group>

                {/* Secure-perimeter lock-ring: an equatorial cyan containment ring
                    that brackets the shield-mesh. On reveal it completes/"locks"
                    (a one-shot brightness + opacity ramp) to echo the
                    "Secure perimeter established" beat — the glanceable boundary cue. */}
                <Torus ref={lockRingRef} args={[2.9, 0.035, 8, 96]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial
                        ref={ringMatRef}
                        color="#22d3ee"
                        emissive="#22d3ee"
                        emissiveIntensity={RING_EMISSIVE_BASE}
                        toneMapped={false}
                        transparent
                        // Initial value is the locked BASE so reduced-motion
                        // shows the sealed perimeter; the snap animation drives
                        // the brighter one-shot peak when motion is allowed.
                        opacity={RING_OPACITY_BASE}
                    />
                </Torus>
            </group>
        </group>
    );
}
