"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Ember → ignited color ramp (jc-a7l). The pre-reveal state is a dimmer COLOR,
// not a low opacity, so the statement clears >= 3:1 against the (locally
// dimmed, ~= --background #060608) ground at EVERY scroll position:
//   plain words   #8a8a98 (--subtle-foreground)  ~5.9:1  → #ededf2 (--foreground)
//   violet words  #7c3aed (--primary-cta-hover)  ~3.5:1  → #8b5cf6 (--primary)
// All four values are existing tokens — no new colors.
const EMBER_PLAIN = "#8a8a98";
const LIT_PLAIN = "#ededf2";
const EMBER_VIOLET = "#7c3aed";
const LIT_VIOLET = "#8b5cf6";

const isViolet = (el: Element) => el.closest(".text-primary") !== null;

/**
 * The oversized manifesto moment: words sit as legible embers and ignite to
 * full as the beam passes — scrubbed to scroll, so the reader drags the light
 * across the statement. A narrow traveling glow (the visible CAUSE) crosses
 * the headline just ahead of the igniting words, on the same timeline.
 *
 * Scrub window is wide (top 75% → center 25%) so per-word velocity stays low
 * at a medium flick, and scrub is 0.25 — Lenis already supplies inertia, so a
 * heavier scrub double-smoothed into rubber-banding on direction flips.
 *
 * Tweens are built INSIDE onSplit (GSAP 3.13+ autoSplit contract) so a re-split
 * retargets fresh word elements; scrub-driven timelines rebuild idempotently
 * at the current scroll progress. Reduced motion: fully lit, static, no glow.
 */
export default function ManifestoReveal({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
                return;
            const root = ref.current;
            if (!root) return;
            const heading = root.querySelector<HTMLElement>(
                "[data-manifesto]",
            );
            const glow = root.querySelector<HTMLElement>(
                "[data-manifesto-glow]",
            );
            if (!heading) return;

            const split = SplitText.create(heading, {
                type: "words",
                autoSplit: true,
                onSplit: (self) => {
                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: root,
                            start: "top 75%",
                            end: "center 25%",
                            scrub: 0.25,
                        },
                    });
                    // The cause: a soft violet streak sweeps the full headline
                    // width, leading the ignition front. xPercent is relative
                    // to the streak's own width (1/3 of the wrapper), so -110
                    // → 340 carries it from fully off the left edge to fully
                    // off the right.
                    if (glow) {
                        tl.fromTo(
                            glow,
                            { xPercent: -110, opacity: 0 },
                            { opacity: 1, duration: 0.08, ease: "none" },
                            0,
                        )
                            .to(
                                glow,
                                { xPercent: 340, duration: 0.72, ease: "none" },
                                0,
                            )
                            .to(
                                glow,
                                { opacity: 0, duration: 0.12, ease: "none" },
                                0.72,
                            );
                    }
                    // The effect: words ignite ember → lit just behind the
                    // streak. Color ramp (not opacity) keeps every word >= 3:1
                    // at every scroll position.
                    tl.fromTo(
                        self.words,
                        {
                            color: (_i: number, el: Element) =>
                                isViolet(el) ? EMBER_VIOLET : EMBER_PLAIN,
                        },
                        {
                            color: (_i: number, el: Element) =>
                                isViolet(el) ? LIT_VIOLET : LIT_PLAIN,
                            duration: 0.45,
                            stagger: 0.06,
                            ease: "none",
                            // The tween sits at a non-zero timeline position;
                            // without this the ember start state would not
                            // render until the scrub reaches it — words would
                            // read fully lit, then SNAP dim (a rendering-error
                            // beat, the exact evidence this bead fixes).
                            immediateRender: true,
                        },
                        0.1,
                    );
                    return tl;
                },
            });
            return () => split.revert();
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className="relative">
            {/* Traveling glow — the beam's visible pass. opacity-0 at rest so
                SSR / reduced-motion / pre-trigger states show nothing. */}
            <span
                data-manifesto-glow
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-0"
                style={{
                    background:
                        "radial-gradient(closest-side, rgba(139, 92, 246, 0.18), transparent 72%)",
                }}
            />
            <h2 data-manifesto className={className}>
                {children}
            </h2>
        </div>
    );
}
