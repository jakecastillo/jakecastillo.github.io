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
 *
 * SINGLE OWNER (jc-aau): this component is the ONLY animator of the heading
 * subtree. Consumers must NOT wrap it in a framer whileInView fade — two
 * uncoordinated owners (framer fade + this GSAP timeline) raced and left the
 * lines never moving while the hairline swept alone. The optional `eyebrow`
 * rides the SAME timeline so the label + lines + hairline are one deterministic
 * sequence: eyebrow 0-0.25s, lines from 0.1s (0.7s, stagger 0.09), hairline at
 * "-=0.35".
 *
 * The tweens are built INSIDE onSplit per the GSAP 3.13+ autoSplit contract: a
 * re-split (font load / resize) rebuilds a fresh timeline against the new line
 * elements instead of orphaning the old targets (the root cause of the
 * non-deterministic, never-moving lines). Returning the timeline lets GSAP
 * revert it — ScrollTrigger included — before each re-split.
 *
 * Reduced motion: no split, no tween — the heading (and eyebrow) just are.
 */
export default function EtchHeading({
    as: Tag = "h2",
    className,
    children,
    eyebrow,
    eyebrowClassName,
    wrapperClassName,
}: {
    as?: ElementType;
    className?: string;
    children: ReactNode;
    eyebrow?: ReactNode;
    eyebrowClassName?: string;
    wrapperClassName?: string;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
                return;
            const root = wrapRef.current;
            if (!root) return;
            const heading = root.querySelector<HTMLElement>(
                "[data-beam-heading]",
            );
            const eyebrowEl = root.querySelector<HTMLElement>(
                "[data-beam-eyebrow]",
            );
            const etch = root.querySelector<HTMLElement>("[data-beam-etch]");
            if (!heading) return;

            const split = SplitText.create(heading, {
                type: "lines",
                mask: "lines",
                autoSplit: true, // re-split on font load / resize
                // Build the timeline INSIDE onSplit so every (re)split targets
                // the CURRENT line elements. Returning it lets GSAP revert the
                // previous timeline (+ its ScrollTrigger) before re-splitting.
                onSplit: (self) => {
                    // Hairline starts collapsed. Its fromTo sits at a non-zero
                    // timeline position so it does NOT immediate-render; without
                    // this it would sit fully drawn (a glow under hidden text)
                    // until the trigger fires.
                    if (etch) gsap.set(etch, { scaleX: 0 });

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: root,
                            start: "top 80%",
                            once: true,
                        },
                    });
                    if (eyebrowEl) {
                        tl.from(
                            eyebrowEl,
                            {
                                opacity: 0,
                                y: 14,
                                duration: 0.25,
                                ease: "power2.out",
                            },
                            0,
                        );
                    }
                    tl.from(
                        self.lines,
                        {
                            yPercent: 110,
                            duration: 0.7,
                            ease: "power4.out",
                            stagger: 0.09,
                        },
                        0.1,
                    );
                    if (etch) {
                        tl.fromTo(
                            etch,
                            { scaleX: 0 },
                            { scaleX: 1, duration: 0.5, ease: "power4.out" },
                            "-=0.35",
                        );
                    }
                    return tl;
                },
            });

            return () => split.revert();
        },
        { scope: wrapRef },
    );

    return (
        <div
            ref={wrapRef}
            className={wrapperClassName ? `relative ${wrapperClassName}` : "relative"}
        >
            {eyebrow != null && (
                <p data-beam-eyebrow className={eyebrowClassName}>
                    {eyebrow}
                </p>
            )}
            {createElement(Tag, { className, "data-beam-heading": true }, children)}
            <span
                data-beam-etch
                aria-hidden="true"
                className="mt-4 block h-px w-16 origin-left bg-gradient-to-r from-primary to-transparent shadow-[0_0_10px_1px_rgba(139,92,246,0.5)]"
            />
        </div>
    );
}
