"use client";

import { createElement, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * Section-heading reveal: lines rise out of a mask as the beam "etches" them,
 * finished by a hairline sweep. Fires once per heading at top 80%.
 * Reduced motion: no split, no tween — the heading just is (equivalent state).
 */
export default function EtchHeading({
    as: Tag = "h2",
    className,
    children,
}: {
    as?: ElementType;
    className?: string;
    children: ReactNode;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
                return;
            const heading = wrapRef.current?.firstElementChild;
            const etch = wrapRef.current?.querySelector<HTMLElement>(
                "[data-beam-etch]",
            );
            if (!heading) return;

            const split = SplitText.create(heading, {
                type: "lines",
                mask: "lines",
                autoSplit: true, // re-split on font load / resize
            });
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: wrapRef.current,
                    start: "top 80%",
                    once: true,
                },
            });
            tl.from(split.lines, {
                yPercent: 110,
                duration: 0.7,
                ease: "power4.out",
                stagger: 0.09,
            });
            if (etch) {
                tl.fromTo(
                    etch,
                    { scaleX: 0 },
                    { scaleX: 1, duration: 0.5, ease: "power4.out" },
                    "-=0.35",
                );
            }
            return () => split.revert();
        },
        { scope: wrapRef },
    );

    return (
        <div ref={wrapRef} className="relative">
            {createElement(Tag, { className }, children)}
            <span
                data-beam-etch
                aria-hidden="true"
                className="mt-4 block h-px w-16 origin-left bg-gradient-to-r from-primary to-transparent shadow-[0_0_10px_1px_rgba(139,92,246,0.5)]"
            />
        </div>
    );
}
