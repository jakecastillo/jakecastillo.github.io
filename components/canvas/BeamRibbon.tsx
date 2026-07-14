"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useBeamStore } from "@/hooks/useBeamStore";
import { getBeamAnchorFrame } from "@/hooks/useBeamAnchors";
import { damp } from "./anim";

// Relay hold: the ribbon is the LAST leg of the boot relay (spark → line →
// underline → ribbon). It stays dark until the boot-line→underline crossfade
// has landed (bootDone + crossfade tail), then flares in from the head.
// Read via getState() inside useFrame — never a hook subscription — so the
// Canvas subtree never re-renders (React 19 constraint, see Scene.tsx).
const REVEAL_HOLD_MS = 700;

// The Beam — a scroll-drawn ribbon of light THREADING THE CONTENT. Its curve
// is built through the acts' real DOM anchors (hero underline end → philosophy
// spine top → prism vertex → beacon center), measured document-side by
// useBeamAnchors and published as plain data. The whole mesh translates with
// scroll (pinned to the content), and the hot head's arc position is keyed so
// it ARRIVES at each anchor exactly as its act enters the reading zone.
// Additive + toneMapped:false clears the Bloom 0.1 luminance threshold, so the
// ribbon reads as illumination in the void rather than a solid rope.

const VIOLET = new THREE.Color("#8b5cf6");
// The ONE sanctioned cyan — matches the --accent design token (globals.css).
const CYAN = new THREE.Color("#2dd4bf");

// Ribbon thickness in CSS px at the anchor plane (converted to world units at
// geometry-rebuild time so it stays constant across viewport sizes).
const RADIUS_PX = 2.4;

// Cursor heat (desktop, fine pointer): within this CSS-px radius of the
// pointer the ribbon warms toward cyan and bows toward the cursor.
const HEAT_RADIUS_PX = 110;
const BOW_PX = 2.5;
// First-contact bow pulse: the instant the pointer crosses INTO the heat radius
// the resting bow (BOW_PX) briefly overshoots so the ribbon snaps a noticeable
// lean toward the cursor, then settles back — making the otherwise-undiscoverable
// heat field announce itself on first contact. Peak = BOW_PX * (1 + GAIN).
// Imperative in useFrame off pointerPx; reduced motion is exempt (uBowAmp 0).
const BOW_PULSE_MS = 520;
const BOW_PULSE_GAIN = 1.6;
const BOW_PULSE_ATTACK = 0.18; // fraction of the window spent rising to the peak
// Curve proximity taps sampled at geometry-build time so the per-frame path can
// detect the pointer entering the heat radius via an early-out scan (first tap
// inside the radius wins) — no distance-to-curve solve per frame.
const BOW_SAMPLES = 256;
// The answered ask: one cyan shimmer travels tail→head along the ribbon.
const SHIMMER_MS = 900;
// Reduced-motion answer: instant brightness step, held briefly, stepped off.
const RM_FLASH_MS = 450;

// The prism weld — the site's one screenshottable frame. While the head PARKS
// on the prism vertex (uPrismFrac, during the frame.prismArriveScroll..
// prismHoldScroll window published by useBeamAnchors) the vertex blooms into a
// hot VIOLET node with a brief caustic flare — the unmistakable "beam-in" that
// the split spectrum fans out of. The weld is violet; cyan stays answer-only.
// Sized in CSS px along the tube, converted to arc fraction at geometry build.
const WELD_HALF_PX = 6; // node half-extent → a ~12px hot node (10-14px target)
const WELD_ENGAGE_FRAC = 0.02; // arc-fraction approach window the node blooms over
const WELD_FLARE_MS = 520; // brief arrival caustic overshoot (a single burst)

// The beacon dock — the ONE place the thread and the DOM touch in plain sight.
// While the head PARKS on the beacon anchor (arc fraction 1.0, the contact
// card's center — see Beacon.tsx) the tip blooms a SOFT VIOLET terminal swell,
// so the head reads as physically DOCKING into the card edge rather than fading
// out. Violet only — the standing dock never touches cyan; the sanctioned cyan
// answer pulse on Email-press rides over it via uShimmer/askAt and is untouched
// here. A brief arrival SETTLE (a one-shot swell overshoot easing to the
// standing presence) sells the "kiss". Distinct from the prism weld: that is a
// tight hot violet-white node mid-thread; this is a broader, softer violet
// swell at the terminus. Sized in CSS px along the tube → arc fraction at build.
const DOCK_HALF_PX = 10; // soft swell half-extent → a ~20px terminal bloom
const DOCK_ENGAGE_FRAC = 0.05; // arc-fraction approach window the swell eases in over
const DOCK_SETTLE_MS = 620; // gentle arrival settle (one soft press → rest)

const vertexShader = /* glsl */ `
  uniform vec2 uPointer;   // pointer in mesh-LOCAL world units (z=0 plane)
  uniform float uHeatR;    // cursor-heat radius (world units)
  uniform float uHeatGain; // 0..1 pointer-present engage (damped; RM steps)
  uniform float uBowAmp;   // bow displacement toward the pointer (world units)
  varying vec2 vUv;
  varying float vHeat;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Cursor heat falloff — 1 at the pointer, 0 at the radius edge. The
    // pointer uniform is pre-converted to mesh-local space CPU-side (the
    // mesh translates with scroll), so plain local-XY distance is correct.
    vec2 toPtr = uPointer - pos.xy;
    float dist = length(toPtr);
    float heat = smoothstep(uHeatR, uHeatR * 0.15, dist) * uHeatGain;
    vHeat = heat;
    // The bow: the ribbon leans 2-3px toward the cursor inside the radius.
    // Pure vertex displacement — geometry is never rebuilt for the pointer.
    if (dist > 1e-5) pos.xy += (toPtr / dist) * (heat * uBowAmp);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uHead;      // 0..1 live drawn progress (arc fraction)
  uniform float uBurn;      // max uHead ever reached — the beam's memory
  uniform float uReveal;    // 0..1 boot-relay gate: dark until the underline handoff
  uniform float uTime;
  uniform float uViewH;     // framebuffer height (px) for the viewport-edge fade
  uniform float uEdge;      // fade band height (px) at top/bottom viewport edges
  uniform float uPrismFrac; // arc fraction of the prism vertex (1.0 = disabled)
  uniform float uWeldGain;  // 0..1(+) prism-weld park presence (imperative, useFrame)
  uniform float uWeldHalf;  // weld node half-extent in arc fraction (~6px along tube)
  uniform float uDockGain;  // 0..1(+) beacon-dock park presence (imperative, useFrame)
  uniform float uDockHalf;  // dock swell half-extent in arc fraction (~10px along tube)
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform float uIntensity;
  uniform float uShimmer;  // arc position of the answer shimmer; <0 = inactive
  uniform float uAskFlash; // reduced-motion answer: instant brightness step
  varying vec2 vUv;
  varying float vHeat;     // cursor-heat influence from the vertex stage

  // 4x4 Bayer ordered dither — grain on the glow falloff ("human-made" texture).
  float bayer(vec2 p) {
    vec2 q = floor(mod(p, 4.0));
    float i = q.x + q.y * 4.0;
    // 4x4 Bayer matrix values /16, expressed procedurally-free as a lookup chain
    float m = 0.0;
    if (i < 1.0) m = 0.0;       else if (i < 2.0) m = 8.0;
    else if (i < 3.0) m = 2.0;  else if (i < 4.0) m = 10.0;
    else if (i < 5.0) m = 12.0; else if (i < 6.0) m = 4.0;
    else if (i < 7.0) m = 14.0; else if (i < 8.0) m = 6.0;
    else if (i < 9.0) m = 3.0;  else if (i < 10.0) m = 11.0;
    else if (i < 11.0) m = 1.0; else if (i < 12.0) m = 9.0;
    else if (i < 13.0) m = 15.0;else if (i < 14.0) m = 7.0;
    else if (i < 15.0) m = 13.0;else m = 5.0;
    return m / 16.0;
  }

  void main() {
    float along = vUv.x;
    // Live drawn body with a soft tail behind the head.
    float drawn = smoothstep(uHead, uHead - 0.015, along);
    // Memory: everything the head has EVER passed. Where the head retreated
    // (scroll-back), the travelled path keeps a faint ember — the story
    // doesn't un-happen.
    float burned = smoothstep(uBurn, uBurn - 0.015, along);
    float ember = clamp(burned - drawn, 0.0, 1.0) * 0.15;
    // Hot head: a tight cyan-white node exactly at the draw front.
    float head = smoothstep(0.02, 0.0, abs(along - uHead));
    // Energy flicker travelling along the live body (embers stay calm).
    float flow = 0.75 + 0.25 * sin(along * 42.0 - uTime * 2.4);
    // Cyan warm-up trailing the head, so the draw front reads as heat.
    float nearHead = smoothstep(0.12, 0.0, uHead - along) * drawn;
    // Post-prism recolor: the leg below the prism vertex carries the band
    // ramp (violet -> cyan) — the beam that resumes after the fan is the
    // split spectrum, not the raw violet thread. Ratio form (not smoothstep)
    // so uPrismFrac = 1.0 cleanly disables it before the first measurement.
    float post = clamp((along - uPrismFrac) / max(1.0 - uPrismFrac, 0.001), 0.0, 1.0);
    vec3 base = mix(uViolet, uCyan, post * 0.85);
    // Draw-front heat runs cyan — EXCEPT where the head is PARKED: at the prism
    // weld (hot violet-white) and at the beacon dock (soft violet). At both, the
    // dock/weld gain damps out the cyan tint (violet is the standing color;
    // cyan stays answer-only), so the parked head reads violet, not cyan.
    float headCyan = clamp(head * 0.85 + nearHead * 0.35, 0.0, 1.0)
                   * (1.0 - clamp(uWeldGain, 0.0, 1.0) * 0.92)
                   * (1.0 - clamp(uDockGain, 0.0, 1.0) * 0.92);
    vec3 col = mix(base, uCyan, headCyan);
    // --- The prism weld: a hot violet node + caustic flare at the vertex ------
    // While parked (uWeldGain>0) the vertex arc-fraction (uPrismFrac) blooms
    // into a ~12px hot node; a wider caustic skirt shimmers around it. uTime is
    // frozen under reduced motion, so the skirt bakes as static grain (no
    // travel). uWeldGain can briefly exceed 1 on arrival — the caustic flare.
    float weldD = abs(along - uPrismFrac);
    float weldCore = smoothstep(uWeldHalf, 0.0, weldD);
    float weldSkirt = smoothstep(uWeldHalf * 3.0, uWeldHalf, weldD);
    float caustic = 0.7 + 0.3 * sin(weldD / max(uWeldHalf, 1e-4) * 6.2831 - uTime * 5.0);
    vec3 weldCol = mix(uViolet, vec3(1.0), 0.6); // hot violet-white, never cyan
    col = mix(col, weldCol, clamp(weldCore * uWeldGain, 0.0, 1.0));
    float weldA = weldCore * uWeldGain * 1.2
                + weldSkirt * caustic * clamp(uWeldGain, 0.0, 1.0) * 0.5;
    // --- The beacon dock: a soft VIOLET terminal swell where the head kisses the
    // contact card edge (arc fraction 1.0). The docked tip pulls to a gently-warm
    // violet, OVERRIDING the post-prism spectrum ramp right at the terminus — the
    // thread reads as returning home to violet as it meets the DOM. Smooth (no
    // caustic term): reduced motion bakes it identically static (uDockGain pinned
    // to 1, uTime frozen), zero travel. uDockGain briefly exceeds 1 on arrival —
    // that is the settle press. Gated entirely by uDockGain, which the useFrame
    // driver holds at 0 until the head nears fraction 1.0, so the undrawn tube
    // ahead of the story is never painted.
    float dockD = 1.0 - along;
    float dockCore = smoothstep(uDockHalf, 0.0, dockD);
    float dockSkirt = smoothstep(uDockHalf * 3.0, uDockHalf, dockD);
    vec3 dockCol = mix(uViolet, vec3(1.0), 0.22); // soft violet, faintly warm center
    col = mix(col, dockCol, clamp(dockCore * uDockGain, 0.0, 1.0));
    col = mix(col, uViolet, clamp(dockSkirt * uDockGain * 0.5, 0.0, 1.0));
    float dockA = dockCore * uDockGain * 0.85
                + dockSkirt * clamp(uDockGain, 0.0, 1.0) * 0.3;
    float a = drawn * 0.42 * flow + ember * 0.42 + head * 0.9 + weldA + dockA;
    // Lit mask: interaction light only ever amplifies the drawn/burned body —
    // the pointer must never reveal the undrawn tube ahead of the story.
    float lit = clamp(drawn + ember + head, 0.0, 1.0);
    // (a) Cursor heat — the ribbon warms toward cyan near the pointer.
    col = mix(col, uCyan, vHeat * 0.5);
    a += vHeat * 0.3 * lit;
    // (b) The answered ask — one cyan shimmer travelling tail→head.
    float shim = smoothstep(0.055, 0.0, abs(along - uShimmer));
    col = mix(col, uCyan, shim * 0.85);
    a += shim * 0.45 * lit;
    // Reduced-motion answer: the whole drawn body steps brighter + cyan for a
    // beat — an instant state change instead of a travelling shimmer.
    col = mix(col, uCyan, uAskFlash * 0.35);
    a += uAskFlash * 0.25 * lit;
    // Ordered dither grain on the glow falloff — gated by the lit mask so
    // the undrawn tube stays truly invisible (no ghost path at page top).
    a += (bayer(gl_FragCoord.xy) - 0.5) * 0.06 * clamp(drawn + ember + head, 0.0, 1.0);
    // Viewport-edge fade: where the ribbon crosses the top/bottom screen
    // edge it dissolves instead of hard-clipping — no mid-air terminations.
    float edgeFade = smoothstep(0.0, uEdge, gl_FragCoord.y)
                   * (1.0 - smoothstep(uViewH - uEdge, uViewH, gl_FragCoord.y));
    // Boot-relay flare-in: alpha gated by uReveal; while revealing, the head
    // runs extra hot (the flare) and settles as uReveal reaches 1.
    float flare = 1.0 + (1.0 - uReveal) * head * 2.0;
    gl_FragColor = vec4(col * uIntensity * (1.0 + head * 2.5) * flare, clamp(a * uReveal * edgeFade, 0.0, 1.0));
  }
`;

export default function BeamRibbon({
    lowPower = false,
    reducedMotion = false,
}: {
    lowPower?: boolean;
    reducedMotion?: boolean;
}) {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    // Rebuild bookkeeping — refs only, mutated inside useFrame (at most once
    // per anchor-frame version, i.e. on resize/layout change, never per frame).
    const builtVersion = useRef(-1);
    const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
    const stopScroll = useRef<number[]>([]);
    const stopFrac = useRef<number[]>([]);
    const unitsPerPx = useRef(0);
    const viewportW = useRef(0);
    const viewportH = useRef(0);

    // Cursor heat — raw viewport px, written by a window-level listener (the
    // canvas is pointer-events-none; same channel as HoloLattice's lean) and
    // converted to mesh-local units per frame (the mapping shifts with scroll).
    const pointerPx = useRef({ x: 0, y: 0, active: false });
    // First-contact bow pulse bookkeeping (refs only, mutated in useFrame): the
    // resting bow amplitude to overshoot from, the build-time curve taps, the
    // inside/outside latch (so the pulse fires only on the outside→inside edge),
    // and the pulse-start timestamp.
    const restBowAmp = useRef(0);
    const curveSamples = useRef<Float32Array | null>(null);
    const insideHeat = useRef(false);
    const bowPulseStart = useRef(0);
    // The answered ask — timestamps only; consumed inside useFrame.
    const lastAskAt = useRef(0);
    const shimmerStart = useRef(0);
    const flashUntil = useRef(0);
    // The prism weld — arrival caustic-flare bookkeeping (refs only; the flare
    // fires once each time the head welds, re-arming after the head leaves).
    const weldArmed = useRef(true);
    const weldFlareUntil = useRef(0);
    // The beacon dock — arrival-settle bookkeeping (refs only; a soft one-shot
    // press fires each time the head docks, re-arming after the head leaves so a
    // scroll-back re-dock settles again).
    const dockArmed = useRef(true);
    const dockSettleUntil = useRef(0);

    // Stable function selector — same pattern as LoopDriver; selecting
    // invalidate never re-renders the Canvas subtree (React 19 constraint).
    const invalidate = useThree((s) => s.invalidate);

    useEffect(() => {
        // Fine pointers only: cursor heat is a desktop interaction by nature —
        // never ship a dead pointermove→uniform loop on touch devices.
        if (!window.matchMedia("(pointer: fine)").matches) return;
        const onMove = (e: PointerEvent) => {
            pointerPx.current.x = e.clientX;
            pointerPx.current.y = e.clientY;
            pointerPx.current.active = true;
            // Reduced motion renders on demand only (no continuous loop) —
            // ask for a frame so the instant heat step is actually visible.
            if (reducedMotion) invalidate();
        };
        const onLeave = () => {
            pointerPx.current.active = false;
            if (reducedMotion) invalidate(); // render the heat-off step
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        window.addEventListener("blur", onLeave);
        return () => {
            window.removeEventListener("pointermove", onMove);
            document.documentElement.removeEventListener(
                "pointerleave",
                onLeave,
            );
            window.removeEventListener("blur", onLeave);
        };
    }, [reducedMotion, invalidate]);

    // Reduced motion has no continuous loop, so the answered ask must request
    // its own frames: one to step uAskFlash on, one after RM_FLASH_MS to step
    // it off (otherwise the flash would stick — a standing-cyan violation).
    // zustand's subscribe is a plain callback, not a React subscription — it
    // cannot re-render the Canvas subtree.
    useEffect(() => {
        if (!reducedMotion) return;
        let offTimer = 0;
        const unsub = useBeamStore.subscribe((s, prev) => {
            if (s.askAt !== prev.askAt && s.askAt > 0) {
                invalidate();
                window.clearTimeout(offTimer);
                offTimer = window.setTimeout(() => invalidate(), RM_FLASH_MS + 60);
            }
        });
        return () => {
            window.clearTimeout(offTimer);
            unsub();
        };
    }, [reducedMotion, invalidate]);
    // Placeholder geometry until the first anchor measurement lands; the mesh
    // stays invisible until then.
    const initialGeometry = useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -1, 0),
        ]);
        return new THREE.TubeGeometry(curve, 2, 0.01, 3, false);
    }, []);

    const uniforms = useMemo(
        () => ({
            uHead: { value: reducedMotion ? 1 : 0 },
            uBurn: { value: reducedMotion ? 1 : 0 },
            uReveal: { value: reducedMotion ? 1 : 0 },
            uTime: { value: 0 },
            uViewH: { value: 1 },
            uEdge: { value: 0 },
            uPrismFrac: { value: 1 },
            uWeldGain: { value: 0 },
            uWeldHalf: { value: 0.01 },
            uDockGain: { value: reducedMotion ? 1 : 0 },
            uDockHalf: { value: 0.01 },
            uViolet: { value: VIOLET },
            uCyan: { value: CYAN },
            uIntensity: { value: lowPower ? 2.4 : 2.1 },
            uPointer: { value: new THREE.Vector2(0, 0) },
            uHeatR: { value: 0 },
            uHeatGain: { value: 0 },
            uBowAmp: { value: 0 },
            uShimmer: { value: -1 },
            uAskFlash: { value: 0 },
        }),
        [lowPower, reducedMotion],
    );

    useFrame((state, delta) => {
        const m = matRef.current;
        const mesh = meshRef.current;
        if (!m || !mesh) return;

        const frame = getBeamAnchorFrame();

        // --- Rebuild (anchor-change only: resize / layout shift, NOT scroll) ---
        if (frame.version !== builtVersion.current && frame.points.length >= 4) {
            builtVersion.current = frame.version;
            unitsPerPx.current = frame.unitsPerPx;
            viewportW.current = frame.viewportW;
            viewportH.current = frame.viewportH;
            // Safety (dev only): the anchor measure now reads
            // documentElement.clientWidth, which MUST equal the R3F canvas CSS
            // width this projection targets. If they diverge the ribbon misses
            // its anchors. Assert only — never re-derive here (a second
            // correction on top of the already-correct frame would double it).
            if (
                process.env.NODE_ENV !== "production" &&
                Math.abs(frame.viewportW - state.size.width) > 1
            ) {
                console.warn(
                    "[beam] viewportW %o diverges from canvas width %o — anchors will miss",
                    frame.viewportW,
                    state.size.width,
                );
            }
            const u = frame.unitsPerPx;
            const vw = frame.viewportW;
            const vh = frame.viewportH;
            // Document px → world units at the z=0 plane, for scrollY = 0.
            // Per frame the mesh translates up by scrollY * unitsPerPx, keeping
            // every point glued to its document position.
            const vecs = frame.points.map(
                (p) =>
                    new THREE.Vector3(
                        (p.x - vw / 2) * u,
                        (vh / 2 - p.y) * u,
                        p.z,
                    ),
            );
            const curve = new THREE.CatmullRomCurve3(vecs);
            curveRef.current = curve;
            const old = mesh.geometry;
            mesh.geometry = new THREE.TubeGeometry(
                curve,
                lowPower ? 220 : 480,
                RADIUS_PX * u,
                lowPower ? 4 : 8,
                false,
            );
            old.dispose();
            mesh.visible = true;

            // Interaction scales in world units — px-true at every viewport.
            m.uniforms.uHeatR.value = HEAT_RADIUS_PX * u;
            // Reduced motion: heat still answers (brightness step) but the
            // ribbon never travels — no bow displacement.
            m.uniforms.uBowAmp.value = reducedMotion ? 0 : BOW_PX * u;
            // Resting bow the first-contact pulse overshoots from and settles
            // back to each frame (non-RM). RM keeps it 0 — no travel, no pulse.
            restBowAmp.current = reducedMotion ? 0 : BOW_PX * u;
            // Sample the curve into flat local-space taps for pointer-entry
            // detection (built here, on resize only; read-only per frame). The
            // taps live in the same untranslated local space as the vertices,
            // so the per-frame path compares them against the mesh-local pointer
            // directly. getPointAt writes into a reused scratch — no per-tap alloc.
            let sbuf = curveSamples.current;
            if (!sbuf) {
                sbuf = new Float32Array(BOW_SAMPLES * 2);
                curveSamples.current = sbuf;
            }
            const sp = new THREE.Vector3();
            for (let i = 0; i < BOW_SAMPLES; i++) {
                curve.getPointAt(i / (BOW_SAMPLES - 1), sp);
                sbuf[i * 2] = sp.x;
                sbuf[i * 2 + 1] = sp.y;
            }

            // Arc-length fractions of the anchor control points (TubeGeometry
            // samples arc-uniformly, so vUv.x IS arc fraction). Arrays rebuilt
            // here only — read-only in the per-frame path below.
            const DIV = 512;
            const lengths = curve.getLengths(DIV);
            const total = lengths[DIV];
            // Weld node half-extent: WELD_HALF_PX along the tube expressed in
            // arc fraction (TubeGeometry samples arc-uniformly, so vUv.x IS arc
            // fraction). px→world = px*u; world→arc-frac = /total. So a ~12px
            // hot node stays px-true across every viewport size.
            m.uniforms.uWeldHalf.value = (WELD_HALF_PX * u) / total;
            // Dock swell half-extent: DOCK_HALF_PX along the tube in arc fraction
            // (same px→world→arc-frac conversion as the weld), so the ~20px soft
            // terminal bloom stays px-true across every viewport size.
            m.uniforms.uDockHalf.value = (DOCK_HALF_PX * u) / total;
            const n = frame.points.length;
            const ss: number[] = [];
            const sf: number[] = [];
            for (let i = 0; i < n; i++) {
                const p = frame.points[i];
                if (!p.anchor) continue;
                const t = i / (n - 1);
                const f = lengths[Math.round(t * DIV)] / total;
                ss.push(p.arriveScroll);
                sf.push(f);
                // Park window (prism): duplicate the stop at the SAME arc
                // fraction — between arriveScroll and holdScroll the
                // interpolation below is flat, so the head sits welded to the
                // vertex while the fan draws, and only resumes (recolored by
                // the band ramp) once the fan completes.
                if (p.holdScroll && p.holdScroll > p.arriveScroll) {
                    ss.push(p.holdScroll);
                    sf.push(f);
                    m.uniforms.uPrismFrac.value = f;
                }
            }
            // The final anchor is the curve's last point — force exact 1 so
            // the head parks flush on the beacon.
            if (sf.length > 0) sf[sf.length - 1] = 1;
            stopScroll.current = ss;
            stopFrac.current = sf;
        }
        if (!mesh.visible || curveRef.current === null) return;

        // --- Per-frame: uniform writes + one mesh translation. No allocations. ---
        const scrollY = window.scrollY;
        mesh.position.y = scrollY * unitsPerPx.current;

        // Cursor heat: viewport px → mesh-LOCAL world units. Same mapping the
        // anchors use ((vh/2 - y) * u is world space at the z=0 plane), minus
        // the mesh's live scroll translation so the shader compares apples to
        // apples against untranslated vertex positions.
        const u = unitsPerPx.current;
        const ptr = pointerPx.current;
        if (ptr.active && u > 0) {
            m.uniforms.uPointer.value.set(
                (ptr.x - viewportW.current / 2) * u,
                (viewportH.current / 2 - ptr.y) * u - mesh.position.y,
            );
        }
        const gainTarget = ptr.active ? 1 : 0;
        m.uniforms.uHeatGain.value = reducedMotion
            ? gainTarget // instant step — RM still answers, just without travel
            : damp(m.uniforms.uHeatGain.value, gainTarget, 6, delta);

        // First-contact bow pulse (fine pointer, motion on). The instant the
        // pointer crosses INTO the heat radius, overshoot the resting bow so the
        // thread snaps a lean toward the cursor, then settle back to BOW_PX.
        // Entry is detected by scanning the build-time curve taps against the
        // mesh-local pointer, early-out on the first tap inside the radius; the
        // insideHeat latch makes the pulse fire only on the outside→inside edge
        // (re-arming when the pointer leaves the field). All imperative — refs +
        // one uniform, no React state, no Canvas re-render. RM is skipped
        // entirely, leaving uBowAmp at its build value (0): no pulse, no travel.
        if (!reducedMotion) {
            const sbuf = curveSamples.current;
            let nowInside = false;
            if (ptr.active && sbuf) {
                const px = m.uniforms.uPointer.value.x;
                const py = m.uniforms.uPointer.value.y;
                const r = m.uniforms.uHeatR.value;
                const r2 = r * r;
                for (let i = 0; i < sbuf.length; i += 2) {
                    const dx = sbuf[i] - px;
                    const dy = sbuf[i + 1] - py;
                    if (dx * dx + dy * dy <= r2) {
                        nowInside = true;
                        break;
                    }
                }
            }
            const now = performance.now();
            if (nowInside && !insideHeat.current) bowPulseStart.current = now;
            insideHeat.current = nowInside;
            let env = 0;
            if (bowPulseStart.current > 0) {
                const t = (now - bowPulseStart.current) / BOW_PULSE_MS;
                if (t >= 1) {
                    bowPulseStart.current = 0; // settled — no standing overshoot
                } else if (t < BOW_PULSE_ATTACK) {
                    env = t / BOW_PULSE_ATTACK; // fast attack to the overshoot
                } else {
                    const decay =
                        1 - (t - BOW_PULSE_ATTACK) / (1 - BOW_PULSE_ATTACK);
                    env = decay * decay; // ease back down to the resting bow
                }
            }
            m.uniforms.uBowAmp.value =
                restBowAmp.current * (1 + env * BOW_PULSE_GAIN);
        }

        // The answered ask: latch each new askAt (getState() — never a
        // subscription) into either the travelling shimmer or the RM flash.
        const beam = useBeamStore.getState();
        if (beam.askAt !== lastAskAt.current) {
            lastAskAt.current = beam.askAt;
            if (beam.askAt > 0) {
                if (reducedMotion) {
                    flashUntil.current = performance.now() + RM_FLASH_MS;
                } else {
                    shimmerStart.current = performance.now();
                }
            }
        }

        // Framebuffer height in device px (gl_FragCoord space) for the
        // viewport-edge fade band.
        const bufH = state.gl.domElement.height;
        m.uniforms.uViewH.value = bufH;
        m.uniforms.uEdge.value = bufH * 0.06;

        // Head target: piecewise-linear arc fraction between arrival stops —
        // the head lands on each anchor exactly as its act enters, and holds
        // at the beacon (fraction 1) for any scroll past the last stop.
        const ss = stopScroll.current;
        const sf = stopFrac.current;
        let target = sf[sf.length - 1];
        if (scrollY <= ss[0]) {
            target = sf[0];
        } else {
            for (let i = 1; i < ss.length; i++) {
                if (scrollY < ss[i]) {
                    target =
                        sf[i - 1] +
                        ((sf[i] - sf[i - 1]) * (scrollY - ss[i - 1])) /
                            (ss[i] - ss[i - 1]);
                    break;
                }
            }
        }

        if (reducedMotion) {
            // Static fully-drawn path through the same anchors; frozen time.
            m.uniforms.uHead.value = 1;
            m.uniforms.uBurn.value = 1;
            m.uniforms.uReveal.value = 1;
            // RM answer: brightness steps on, holds RM_FLASH_MS, steps off —
            // an instant state change, never a travelling shimmer.
            m.uniforms.uAskFlash.value =
                performance.now() < flashUntil.current ? 1 : 0;
            m.uniforms.uShimmer.value = -1;
        } else {
            m.uniforms.uTime.value = state.clock.getElapsedTime();
            // The answer shimmer: one cyan band running tail→head (arc 0 up
            // to the live head), then rearming (uShimmer < 0 = inactive).
            if (shimmerStart.current > 0) {
                const t =
                    (performance.now() - shimmerStart.current) / SHIMMER_MS;
                if (t >= 1) {
                    shimmerStart.current = 0;
                    m.uniforms.uShimmer.value = -1;
                } else {
                    m.uniforms.uShimmer.value =
                        t * (m.uniforms.uHead.value + 0.08);
                }
            }
            // Boot-relay gate: hold the ribbon dark until the underline
            // crossfade has landed (bootDone + hold), then damp uReveal up.
            const { bootDone, bootDoneAt } = beam;
            const held =
                !bootDone || performance.now() - bootDoneAt < REVEAL_HOLD_MS;
            m.uniforms.uReveal.value = held
                ? 0
                : damp(m.uniforms.uReveal.value, 1, 3.5, delta);
            // Chase the arrival-keyed target with a light damp so the head
            // glides; memory only ever ratchets forward.
            m.uniforms.uHead.value = damp(
                m.uniforms.uHead.value,
                target,
                6,
                delta,
            );
            m.uniforms.uBurn.value = Math.max(
                m.uniforms.uBurn.value,
                m.uniforms.uHead.value,
            );
        }

        // --- Prism weld: bloom the vertex while the head is welded to it ------
        // Presence is driven off the LIVE head↔vertex arc proximity, so it holds
        // at 1 through the whole park window (uHead is pinned to uPrismFrac by
        // the duplicated stop) and blooms/fades naturally on approach + exit —
        // including on scroll-back. A brief caustic flare overshoots once each
        // time the head lands. All imperative: refs + one uniform, no re-render.
        if (reducedMotion) {
            // Fully-bloomed static end state; no flare travel (uTime frozen, so
            // the caustic skirt is static grain). This is the screenshottable
            // prism-split frame at rest.
            m.uniforms.uWeldGain.value = 1;
        } else {
            const prismFrac = m.uniforms.uPrismFrac.value;
            let weld = 0;
            if (prismFrac < 0.999) {
                const d = Math.abs(m.uniforms.uHead.value - prismFrac);
                const p = Math.max(0, 1 - d / WELD_ENGAGE_FRAC);
                weld = p * p; // ease-in as the head nears the vertex
            }
            const now = performance.now();
            if (weld > 0.85 && weldArmed.current) {
                weldArmed.current = false;
                weldFlareUntil.current = now + WELD_FLARE_MS;
            } else if (weld < 0.4) {
                weldArmed.current = true; // re-arm for the next (scroll-back) weld
            }
            const flare =
                now < weldFlareUntil.current
                    ? (weldFlareUntil.current - now) / WELD_FLARE_MS // 1→0 decay
                    : 0;
            m.uniforms.uWeldGain.value = Math.min(weld + flare * 0.6, 1.6);
        }

        // --- Beacon dock: soft violet terminal swell as the head parks flush on
        // the contact card edge (arc fraction 1.0) ---------------------------
        // Presence is driven off the LIVE head↔terminus proximity, so the swell
        // eases in as the head settles onto the beacon and fades on scroll-back —
        // no subscription, refs + one uniform, no Canvas re-render. A brief
        // arrival settle (one soft press easing to the standing swell) sells the
        // "kiss". Violet stays violet: the swell never introduces cyan.
        if (reducedMotion) {
            // Static docked end state — a soft violet swell at rest (uTime is
            // frozen, so the swell is a still glow). No settle travel.
            m.uniforms.uDockGain.value = 1;
        } else {
            const d = 1 - m.uniforms.uHead.value; // >= 0; 0 == fully docked
            const p = Math.max(0, 1 - d / DOCK_ENGAGE_FRAC);
            const dock = p * p; // ease-in as the head settles onto the card edge
            const now = performance.now();
            if (dock > 0.85 && dockArmed.current) {
                dockArmed.current = false;
                dockSettleUntil.current = now + DOCK_SETTLE_MS;
            } else if (dock < 0.4) {
                dockArmed.current = true; // re-arm for the next (scroll-back) dock
            }
            const settle =
                now < dockSettleUntil.current
                    ? (dockSettleUntil.current - now) / DOCK_SETTLE_MS // 1→0 decay
                    : 0;
            m.uniforms.uDockGain.value = Math.min(dock + settle * 0.45, 1.5);
        }
    });

    return (
        <mesh ref={meshRef} geometry={initialGeometry} visible={false} frustumCulled={false}>
            <shaderMaterial
                ref={matRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
            />
        </mesh>
    );
}
