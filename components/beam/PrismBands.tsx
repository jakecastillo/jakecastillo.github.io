"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const VIOLET = { r: 139, g: 92, b: 246 };
const CYAN = { r: 45, g: 212, b: 191 };

/** Interpolate the sanctioned violet→cyan ramp — no new colors. */
export function bandColor(t: number) {
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
    return `rgb(${mix(VIOLET.r, CYAN.r)}, ${mix(VIOLET.g, CYAN.g)}, ${mix(VIOLET.b, CYAN.b)})`;
}

/** Same ramp with alpha — for tinted borders/washes on the landed groups. */
export function bandColorA(t: number, alpha: number) {
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
    return `rgba(${mix(VIOLET.r, CYAN.r)}, ${mix(VIOLET.g, CYAN.g)}, ${mix(VIOLET.b, CYAN.b)}, ${alpha})`;
}

// How far each terminal label's fill is lifted toward white for glance
// legibility. 0.3 == the label keeps >=70% of ITS band's own violet→cyan color
// (only a 30% luminance lift), so it still reads as its band — a tint of the
// same two-color ramp, never a third accent.
const LABEL_LIFT = 0.3;

/**
 * Terminal-label fill: the band's sanctioned violet→cyan color (bandColor's
 * exact ramp) lifted toward white so the small mono label clears legibility at
 * a glance against the void. The raw band color — especially the mid/violet
 * end — sits near the 4.5:1 floor at label size; lifting to >=70% band color
 * pushes every label well clear (the violet end lands ~8:1 on black) while
 * keeping its band identity.
 */
function labelColor(t: number) {
    const mix = (a: number, b: number) => a + (b - a) * t; // violet→cyan ramp
    const up = (c: number) => Math.round(c + (255 - c) * LABEL_LIFT);
    return `rgb(${up(mix(VIOLET.r, CYAN.r))}, ${up(mix(VIOLET.g, CYAN.g))}, ${up(mix(VIOLET.b, CYAN.b))})`;
}

// Fan geometry (viewBox units). Two art-directed layouts share one render path
// and one always-visible prism vertex (the single `data-beam-anchor="prism"`
// element useBeamAnchors queries — see the mount-time breakpoint switch below;
// two CSS-toggled anchors would hand it a display:none zero-rect and break the
// whole ribbon).
//
//   • DESKTOP (>=sm): the poster fan (jc-246). Vertex dead-center of its own
//     box so the split is symmetric; band terminals spread edge-to-edge and
//     carry mono labels. One half of a composed lockup: headline left, fan
//     right — the beam sweeps toward this lane before the prism weld.
//   • MOBILE (<sm, jc-uke): a portrait-native landing. The beam still enters
//     the prism, but the bands fall as short vertical drop-lines (vertical
//     tangent at BOTH ends of the ogee) that touch down on a spectrum row of
//     landing nodes spanning the card column's width below — the fan becomes a
//     LANDING onto the group cards, not a wide label spread. Labels are omitted
//     because the tinted cards immediately below ARE the labels: each card's
//     band-colored top border ignites in ramp order (ActSkills) as the row
//     lands.
//
// Both keep vector-effect: non-scaling-stroke and stay inside the viewBox
// (inset terminals + no drop past the box edge) so there is zero horizontal
// overflow at any width. `k1`/`k2` are the ogee control offsets that hold the
// vertical tangent leaving the prism (k1) and arriving at the terminal (k2).
type FanLayout = {
    W: number;
    H: number;
    apexX: number;
    prismTop: number;
    prismHalf: number;
    baseY: number; // prism base — bands leave here
    vertexR: number;
    termY: number; // band terminals / landing row
    labelY: number;
    inset: number; // terminal inset from the box edges
    k1: number;
    k2: number;
};

const DESKTOP_FAN: FanLayout = {
    W: 800,
    H: 210,
    apexX: 400,
    prismTop: 22,
    prismHalf: 26,
    baseY: 66,
    vertexR: 4,
    termY: 172,
    labelY: 192,
    inset: 28,
    k1: 48,
    k2: 66,
};

const MOBILE_FAN: FanLayout = {
    W: 360,
    H: 210,
    apexX: 180,
    prismTop: 16,
    prismHalf: 22,
    baseY: 62,
    vertexR: 4,
    termY: 190,
    labelY: 0,
    inset: 30,
    k1: 40,
    k2: 54,
};

// The vertex (beam weld / anchor) sits 16 units above the prism base in both
// layouts, matching the desktop composition the anchor math was tuned against.
const VERTEX_LIFT = 16;

/**
 * The prism moment — the climax stage. The ribbon's head (BeamRibbon) parks on
 * the vertex dot below; this SVG is the split: one beam in, one band out per
 * skill group. Strokes use vector-effect: non-scaling-stroke so bands hold
 * 2.5px at every viewport. Drawn via stroke-dash scrub as the section scrolls
 * through; decorative (aria-hidden); reduced motion renders the landed end
 * state with zero travel.
 *
 * Responsive (see DESKTOP_FAN / MOBILE_FAN): >=sm renders the wide poster fan
 * with mono terminal labels; <sm renders a portrait landing where the bands
 * drop onto a spectrum row of nodes over the card column — the tinted cards
 * immediately below ARE the labels, so the mono terminals are omitted there.
 *
 * `hotBand`: the visitor's hand on the spectrum — hovering a skill group
 * header (ActSkills) thickens/brightens its band while the others dim.
 * Transitions are plain CSS, so the global reduced-motion cap turns them
 * into near-instant state changes automatically.
 */
export default function PrismBands({
    labels,
    hotBand = null,
}: {
    labels: string[];
    hotBand?: number | null;
}) {
    const ref = useRef<SVGSVGElement>(null);
    const count = labels.length;

    // Which fan to render. SSR + first paint start on the desktop poster fan
    // (the safe, label-bearing layout), then upgrade to the portrait landing
    // once we can read the viewport — same SSR-safe pattern as useImmersive.
    // This is a rare breakpoint-crossing re-render, NEVER per-scroll/pointer,
    // and PrismBands lives OUTSIDE the R3F Canvas, so it does not touch the
    // Canvas no-re-render rule. Exactly one <svg> (and therefore exactly one
    // `data-beam-anchor="prism"`) is ever in the DOM, so useBeamAnchors always
    // measures a real, visible vertex.
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        // Below Tailwind `sm` (640px) is where the desktop labels were hidden.
        const query = window.matchMedia("(max-width: 639px)");
        const update = () => setIsMobile(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    const L = isMobile ? MOBILE_FAN : DESKTOP_FAN;
    const vertexCy = L.baseY - VERTEX_LIFT;

    const bands = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => {
                const t = count === 1 ? 0 : i / (count - 1);
                const x2 = L.inset + t * (L.W - 2 * L.inset);
                return {
                    // Ogee with a vertical tangent leaving the prism (control 1
                    // shares the apex x) and a vertical tangent arriving at the
                    // terminal (control 2 shares x2) — desktop it spreads wide,
                    // mobile it reads as a short vertical drop-line touching down.
                    d: `M ${L.apexX} ${L.baseY} C ${L.apexX} ${L.baseY + L.k1}, ${x2} ${L.termY - L.k2}, ${x2} ${L.termY}`,
                    x2,
                    color: bandColor(t),
                    labelFill: labelColor(t),
                    label: labels[i],
                };
            }),
        [count, labels, L],
    );

    useGSAP(
        () => {
            if (
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
                return;
            const paths = ref.current?.querySelectorAll("path[data-band]");
            // Terminals that ignite with their band's arrival: desktop mono
            // labels, or the mobile landing nodes. Only one kind exists per
            // layout, so this yields exactly `count` elements in band order.
            const terms = ref.current?.querySelectorAll(
                "text, [data-band-land]",
            );
            if (!paths?.length) return;
            paths.forEach((p) => {
                const len = (p as SVGPathElement).getTotalLength();
                (p as SVGPathElement).style.strokeDasharray = `${len}`;
                (p as SVGPathElement).style.strokeDashoffset = `${len}`;
            });
            // scrub 0.25 (jc-a7l): Lenis already supplies inertia — a heavier
            // scrub double-smoothed into rubber-banding on direction flips.
            const trigger = {
                trigger: ref.current,
                start: "top 85%",
                end: "bottom 45%",
                scrub: 0.25,
            } as const;
            // ONE coordinated timeline (jc-246): each band draws on its own
            // staggered slot and ITS terminal (label / landing node) ramps
            // opacity with that band's draw COMPLETION — not one shared tween
            // that lit every terminal off the first band's front. Terminal i
            // starts at ~65% of band i's draw and lands full just as the band
            // touches down, so all seven arrive in violet→cyan cascade and are
            // fully opaque by the time the fan parks (progress 1). Reduced
            // motion returns above, leaving the fully-drawn, fully-landed
            // static end state (paths never get a dash offset; terminals keep
            // their default opacity: 1).
            const DRAW = 1; // draw duration per band (timeline units)
            const SLOT = 0.5; // per-band stagger between draw starts
            const tl = gsap.timeline({ scrollTrigger: trigger });
            paths.forEach((p, i) => {
                const at = i * SLOT;
                tl.to(p, { strokeDashoffset: 0, duration: DRAW, ease: "none" }, at);
                const term = terms?.[i];
                if (term) {
                    tl.fromTo(
                        term,
                        { opacity: 0 },
                        { opacity: 1, duration: DRAW * 0.5, ease: "none" },
                        at + DRAW * 0.65,
                    );
                }
            });
        },
        // Re-run on a layout swap (incl. the one-time desktop→portrait upgrade
        // on every phone load, since SSR starts on the desktop fan). revertOnUpdate
        // is REQUIRED: without it @gsap/react defers cleanup to unmount and would
        // stack a second ScrollTrigger + timeline onto the same React-reused path
        // nodes. With it, the old context is reverted (old ScrollTrigger killed,
        // its inline styles restored) BEFORE the new geometry is measured and wired.
        { scope: ref, dependencies: [isMobile], revertOnUpdate: true },
    );

    return (
        <svg
            ref={ref}
            aria-hidden="true"
            viewBox={`0 0 ${L.W} ${L.H}`}
            className="pointer-events-none mx-auto -mb-2 block h-auto w-full opacity-90"
            fill="none"
        >
            {/* The prism itself — an etched glass wedge, not a floating dot.
                The incoming beam is the REAL ribbon (BeamRibbon), whose head
                parks on the vertex circle below — no private hairline. */}
            <path
                d={`M ${L.apexX} ${L.prismTop} L ${L.apexX - L.prismHalf} ${L.baseY} L ${L.apexX + L.prismHalf} ${L.baseY} Z`}
                stroke="#8b5cf6"
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                fill="rgba(139, 92, 246, 0.07)"
                style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }}
            />
            {/* Prism vertex — CSS pulse (not SMIL) so reduced-motion can kill it */}
            <circle
                cx={L.apexX}
                cy={vertexCy}
                r={L.vertexR}
                fill="#a78bfa"
                className="prism-vertex"
                // Beam anchor: the ribbon's head lands on the prism vertex as
                // the stack act enters, and PARKS here until the fan below
                // completes (measured by useBeamAnchors).
                data-beam-anchor="prism"
            />
            {/* Fanned bands — one per skill group. Hovering a group header
                makes its band hot (thicker, brighter) while the rest of the
                spectrum yields. GSAP owns strokeDash* on the paths; React only
                ever touches opacity/width/filter here. */}
            {bands.map((b, i) => (
                <g
                    key={b.label}
                    data-band-hot={hotBand === i ? "" : undefined}
                    style={{
                        opacity: hotBand !== null && hotBand !== i ? 0.3 : 1,
                        transition: "opacity 0.25s ease",
                    }}
                >
                    <path
                        data-band=""
                        d={b.d}
                        stroke={b.color}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        style={{
                            strokeWidth: hotBand === i ? 4 : 2.5,
                            filter: `drop-shadow(0 0 ${hotBand === i ? 9 : 5}px ${b.color})`,
                            transition:
                                "stroke-width 0.25s ease, filter 0.25s ease",
                        }}
                    />
                    {isMobile ? (
                        // Landing node: the band touches down on the spectrum
                        // row that spans the card column below — the fan is a
                        // landing, and each node ignites in ramp order as its
                        // drop-line lands (GSAP fades it with the band draw;
                        // reduced motion leaves it at its default opacity: 1).
                        // The tinted cards immediately below are the labels, so
                        // no mono terminal text is needed here.
                        <circle
                            data-band-land=""
                            cx={b.x2}
                            cy={L.termY}
                            r="3.5"
                            fill={b.color}
                            style={{
                                filter: `drop-shadow(0 0 6px ${b.color})`,
                            }}
                        />
                    ) : (
                        <>
                            <circle
                                cx={b.x2}
                                cy={L.termY}
                                r="2.5"
                                fill={b.color}
                            />
                            <text
                                x={
                                    i === 0
                                        ? b.x2 - 6
                                        : i === count - 1
                                          ? b.x2 + 6
                                          : b.x2
                                }
                                y={L.labelY}
                                textAnchor={
                                    i === 0
                                        ? "start"
                                        : i === count - 1
                                          ? "end"
                                          : "middle"
                                }
                                // Lifted band fill (>=70% band color) + a hair
                                // of dark shadow so each terminal reads at a
                                // glance over the void/glow rather than dropping
                                // out near the void floor.
                                fill={b.labelFill}
                                fontSize="12"
                                letterSpacing="0.12em"
                                style={{
                                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.75))",
                                }}
                                className="hidden font-mono font-medium sm:block"
                            >
                                {b.label}
                            </text>
                        </>
                    )}
                </g>
            ))}
        </svg>
    );
}
