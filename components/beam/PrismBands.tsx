"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const VIOLET = { r: 139, g: 92, b: 246 };
const CYAN = { r: 45, g: 212, b: 191 };

/** Interpolate the sanctioned violet→cyan ramp — no new colors. */
function bandColor(t: number) {
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
    return `rgb(${mix(VIOLET.r, CYAN.r)}, ${mix(VIOLET.g, CYAN.g)}, ${mix(VIOLET.b, CYAN.b)})`;
}

/**
 * The prism moment: one beam in, N bands out. SVG paths drawn via
 * stroke-dash scrub as the section scrolls through. Decorative (aria-hidden);
 * reduced motion renders all paths fully drawn.
 */
export default function PrismBands({ count = 8 }: { count?: number }) {
    const ref = useRef<SVGSVGElement>(null);

    const bands = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => {
                const t = count === 1 ? 0 : i / (count - 1);
                // Fan from the prism vertex (x=200,y=60) to spread endpoints.
                const x2 = 40 + t * 720;
                return {
                    d: `M 200 60 C 200 ${90 + t * 20}, ${x2} ${100 - t * 10}, ${x2} 140`,
                    color: bandColor(t),
                };
            }),
        [count],
    );

    useGSAP(
        () => {
            if (
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
                return;
            const paths = ref.current?.querySelectorAll("path");
            if (!paths?.length) return;
            paths.forEach((p) => {
                const len = p.getTotalLength();
                p.style.strokeDasharray = `${len}`;
                p.style.strokeDashoffset = `${len}`;
            });
            gsap.to(paths, {
                strokeDashoffset: 0,
                stagger: 0.04,
                ease: "none",
                scrollTrigger: {
                    trigger: ref.current,
                    start: "top 85%",
                    end: "bottom 45%",
                    scrub: 0.4,
                },
            });
        },
        { scope: ref },
    );

    return (
        <svg
            ref={ref}
            aria-hidden="true"
            viewBox="0 0 800 140"
            className="pointer-events-none mx-auto -mb-4 block h-auto w-full max-w-4xl opacity-80"
            fill="none"
        >
            {/* Incoming beam */}
            <path d="M 200 0 L 200 52" stroke="#8b5cf6" strokeWidth="1.5" />
            {/* Prism vertex */}
            <circle cx="200" cy="56" r="3" fill="#a78bfa">
                <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="2.4s"
                    repeatCount="indefinite"
                />
            </circle>
            {/* Fanned bands */}
            {bands.map((b, i) => (
                <path
                    key={i}
                    d={b.d}
                    stroke={b.color}
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${b.color})` }}
                />
            ))}
        </svg>
    );
}
