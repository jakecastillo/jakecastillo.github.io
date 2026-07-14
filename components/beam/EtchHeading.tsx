"use client";

import { createElement, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase);

// ONE easing grammar (jc-nc1): register the brand expo-out as a named GSAP
// ease so GSAP tweens share the exact curve of --ease-beam / motion.ts EASE.
// CustomEase.create is idempotent for a given id (re-registering overwrites).
CustomEase.create("beam", "0.16, 1, 0.3, 1");

/**
 * Section-heading reveal: lines rise out of a mask as the beam "etches" them,
 * finished by a hairline sweep. Fires once per heading at top 80%.
 *
 * SINGLE OWNER (jc-aau): this component is the ONLY animator of the heading
 * subtree. Consumers must NOT wrap it in a framer whileInView fade — two
 * uncoordinated owners (framer fade + this GSAP timeline) raced and left the
 * lines never moving while the hairline swept alone. The optional `eyebrow`
 * rides the SAME timeline so the label + lines + hairline are one deterministic
 * sequence: eyebrow 0-0.2s, lines from 0.1s (0.7s, stagger 0.08), hairline at
 * "-=0.35". All tweens ride the "beam" CustomEase (jc-nc1).
 *
 * The tweens are built INSIDE onSplit per the GSAP 3.13+ autoSplit contract: a
 * re-split (font load / resize) rebuilds a fresh timeline against the new line
 * elements instead of orphaning the old targets (the root cause of the
 * non-deterministic, never-moving lines). Returning the timeline lets GSAP
 * revert it — ScrollTrigger included — before each re-split.
 *
 * Played guard (jc-cbm, jc-2r1): once the reveal has STARTED (its ScrollTrigger
 * has fired), a later re-split — a resize or font swap landing DURING or after
 * the reveal — must NOT rebuild the tween + once:true ScrollTrigger. GSAP would
 * revert the running/finished timeline and the fresh trigger, already past its
 * start, would re-fire: a visible flash/replay. The `played` latch is therefore
 * set on the timeline's onStart (trigger-fire), not onComplete — jc-2r1: an
 * onComplete latch left a MID-reveal re-split (trigger fired, timeline still
 * running) in the rebuild branch, re-arming a once:true trigger that re-fired.
 * Once latched we instead gsap.set the new line elements straight to their final
 * state (landing the remainder of the reveal) and return nothing, so there is no
 * timeline to revert and no trigger to re-arm.
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

            // Latched true when the reveal timeline STARTS (its ScrollTrigger
            // fires), NOT when it completes — jc-2r1: an onComplete latch left a
            // re-split landing mid-reveal in the rebuild branch, re-arming a
            // once:true trigger that re-fired. Survives across autoSplit
            // re-splits (closure over this single useGSAP run).
            let played = false;

            const split = SplitText.create(heading, {
                type: "lines",
                mask: "lines",
                autoSplit: true, // re-split on font load / resize
                // Build the timeline INSIDE onSplit so every (re)split targets
                // the CURRENT line elements. Returning it lets GSAP revert the
                // previous timeline (+ its ScrollTrigger) before re-splitting.
                onSplit: (self) => {
                    // Reveal already in flight or done: a re-split must land the
                    // new lines final and NOTHING else — no tween, no
                    // ScrollTrigger to re-fire (jc-2r1).
                    if (played) {
                        gsap.set(self.lines, { yPercent: 0 });
                        if (eyebrowEl)
                            gsap.set(eyebrowEl, { opacity: 1, y: 0 });
                        if (etch) gsap.set(etch, { scaleX: 1 });
                        return;
                    }

                    // Hairline starts collapsed. Its fromTo sits at a non-zero
                    // timeline position so it does NOT immediate-render; without
                    // this it would sit fully drawn (a glow under hidden text)
                    // until the trigger fires.
                    if (etch) gsap.set(etch, { scaleX: 0 });

                    const tl = gsap.timeline({
                        // Latch on trigger-fire (onStart), not onComplete: a
                        // re-split landing mid-reveal must fall into the played
                        // branch above and land final — not rebuild a once:true
                        // trigger that re-fires (jc-2r1).
                        onStart: () => {
                            played = true;
                        },
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
                                duration: 0.2,
                                ease: "beam",
                            },
                            0,
                        );
                    }
                    tl.from(
                        self.lines,
                        {
                            yPercent: 110,
                            duration: 0.7,
                            ease: "beam",
                            stagger: 0.08,
                        },
                        0.1,
                    );
                    if (etch) {
                        tl.fromTo(
                            etch,
                            { scaleX: 0 },
                            { scaleX: 1, duration: 0.4, ease: "beam" },
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
