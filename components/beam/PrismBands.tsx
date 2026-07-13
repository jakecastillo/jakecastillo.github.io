"use client";

import { useMemo, useRef } from "react";
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

// Fan geometry (viewBox units). The vertex sits dead-center so the fan is
// symmetric (kills the old right bias); band terminals spread edge-to-edge so
// the spectrum spans the full container — the composed stage for the climax.
const VB_W = 800;
const VB_H = 210;
const APEX_X = 400;
const BASE_Y = 66; // prism base — bands leave here
const TERM_Y = 172; // band terminals
const LABEL_Y = 192;

/**
 * The prism moment — the climax stage. The ribbon's head (BeamRibbon) parks on
 * the vertex dot below; this SVG is the split: one beam in, one labeled band
 * out per skill group, each terminal naming the group it lands on. Strokes use
 * vector-effect: non-scaling-stroke so bands hold 2.5px at every viewport.
 * Drawn via stroke-dash scrub as the section scrolls through; decorative
 * (aria-hidden); reduced motion renders the fan fully drawn and labeled.
 */
export default function PrismBands({ labels }: { labels: string[] }) {
    const ref = useRef<SVGSVGElement>(null);
    const count = labels.length;

    const bands = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => {
                const t = count === 1 ? 0 : i / (count - 1);
                const x2 = 28 + t * (VB_W - 56);
                return {
                    d: `M ${APEX_X} ${BASE_Y} C ${APEX_X} ${BASE_Y + 48}, ${x2} ${TERM_Y - 66}, ${x2} ${TERM_Y}`,
                    x2,
                    color: bandColor(t),
                    label: labels[i],
                };
            }),
        [count, labels],
    );

    useGSAP(
        () => {
            if (
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
                return;
            const paths = ref.current?.querySelectorAll("path[data-band]");
            const texts = ref.current?.querySelectorAll("text");
            if (!paths?.length) return;
            paths.forEach((p) => {
                const len = (p as SVGPathElement).getTotalLength();
                (p as SVGPathElement).style.strokeDasharray = `${len}`;
                (p as SVGPathElement).style.strokeDashoffset = `${len}`;
            });
            const trigger = {
                trigger: ref.current,
                start: "top 85%",
                end: "bottom 45%",
                scrub: 0.4,
            } as const;
            gsap.to(paths, {
                strokeDashoffset: 0,
                stagger: 0.04,
                ease: "none",
                scrollTrigger: trigger,
            });
            // Labels arrive just behind their band's draw front.
            if (texts?.length) {
                gsap.fromTo(
                    texts,
                    { opacity: 0 },
                    {
                        opacity: 1,
                        stagger: 0.04,
                        ease: "none",
                        scrollTrigger: trigger,
                    },
                );
            }
        },
        { scope: ref },
    );

    return (
        <svg
            ref={ref}
            aria-hidden="true"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="pointer-events-none mx-auto -mb-2 block h-auto w-full opacity-90"
            fill="none"
        >
            {/* The prism itself — an etched glass wedge, not a floating dot.
                The incoming beam is the REAL ribbon (BeamRibbon), whose head
                parks on the vertex circle below — no private hairline. */}
            <path
                d={`M ${APEX_X} 22 L ${APEX_X - 26} ${BASE_Y} L ${APEX_X + 26} ${BASE_Y} Z`}
                stroke="#8b5cf6"
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                fill="rgba(139, 92, 246, 0.07)"
                style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }}
            />
            {/* Prism vertex — CSS pulse (not SMIL) so reduced-motion can kill it */}
            <circle
                cx={APEX_X}
                cy={BASE_Y - 16}
                r="4"
                fill="#a78bfa"
                className="prism-vertex"
                // Beam anchor: the ribbon's head lands on the prism vertex as
                // the stack act enters, and PARKS here until the fan below
                // completes (measured by useBeamAnchors).
                data-beam-anchor="prism"
            />
            {/* Fanned bands — one per skill group, terminal labeled. */}
            {bands.map((b, i) => (
                <g key={b.label}>
                    <path
                        data-band=""
                        d={b.d}
                        stroke={b.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        style={{ filter: `drop-shadow(0 0 5px ${b.color})` }}
                    />
                    <circle cx={b.x2} cy={TERM_Y} r="2.5" fill={b.color} />
                    <text
                        x={
                            i === 0
                                ? b.x2 - 6
                                : i === count - 1
                                  ? b.x2 + 6
                                  : b.x2
                        }
                        y={LABEL_Y}
                        textAnchor={
                            i === 0
                                ? "start"
                                : i === count - 1
                                  ? "end"
                                  : "middle"
                        }
                        fill={b.color}
                        fontSize="10"
                        letterSpacing="0.12em"
                        className="hidden font-mono sm:block"
                    >
                        {b.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}
