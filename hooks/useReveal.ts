"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TargetAndTransition } from "framer-motion";

// Cheap opacity/y reveals re-fire on the return journey: once:false plus a
// bottom margin so the trigger fires a touch late (no flicker on a normal
// forward scroll) and performs again on the way back up — mirroring the GSAP
// scrubbed systems that already reverse.
export const revealViewport = {
    once: false,
    amount: 0.2,
    margin: "0px 0px -10% 0px",
} as const;

// Instant final state for a leaf reveal. Covers every `show` shape used in the
// app (opacity + the y/x/scale transforms MotionProvider drops for reduced
// users), with a zero-duration transition so there is no fade — a plain
// `transition` prop would lose to the variant's own transition, so we set the
// target inline instead of resolving the `show` label.
const INSTANT_LEAF: TargetAndTransition = {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
};

type Attach<T> = (node: T | null) => void;

type RevealResult<T> =
    | {
          ref: Attach<T>;
          initial: false;
          animate: TargetAndTransition | "show";
          transition: { duration: 0 };
      }
    | {
          ref: Attach<T>;
          initial: "hidden";
          whileInView: "show";
          viewport: typeof revealViewport;
      };

/**
 * Wiring for a cheap opacity/y reveal on a framer-motion element whose variants
 * define `hidden` + `show`. Returns one flat props object (callback `ref`
 * included) to spread onto the motion element — a single spread with no
 * `.ref`/`.current` member access in render keeps the React Compiler's "no refs
 * during render" rule happy.
 *
 * Fixes two failure modes flagged by jc-sj2:
 *
 *  1. Arrival on opacity-0 content — a hash deep-link, restored scroll, or
 *     programmatic warp lands with a reveal already at or above the fold that
 *     whileInView never re-shows (once:true froze it, and content scrolled
 *     fully above the viewport never intersects at all). We measure the rect
 *     after mount — retried across a few frames because the deep-link scroll
 *     lands *after* hydration — and, if the element has already been reached,
 *     snap it to the final state instantly (no fade-pop).
 *  2. Dead return journey — once:true froze every reveal after one pass. We use
 *     once:false so cheap reveals perform again when scrubbed back up.
 *
 * Reduced motion: every instance renders its final state instantly, no opacity
 * animation and no re-fire, honouring the "arrivals show final state instantly"
 * contract. We read `prefers-reduced-motion` off matchMedia directly (same as
 * SmoothScroll/EtchHeading) — framer's `useReducedMotion()` misses the initial
 * media state in some engines and left reduced users mid-fade.
 *
 * `orchestrate: true` — for a stagger PARENT that drives child variants by
 * label: instant mode animates to the `show` label so children still inherit
 * it (a plain inline target would not propagate).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
    { orchestrate = false }: { orchestrate?: boolean } = {},
): RevealResult<T> {
    const [instant, setInstant] = useState(false);
    const elRef = useRef<T | null>(null);

    // Stable ref callback (no deps) — only stores the node, so it never causes a
    // re-attach and reads no ref during render.
    const ref = useCallback((node: T | null) => {
        elRef.current = node;
    }, []);

    useEffect(() => {
        if (instant) return;

        const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
        // Reduced motion: final state instantly, no animation, no re-fire.
        if (mql.matches) {
            setInstant(true);
            return;
        }
        const onReduced = () => {
            if (mql.matches) setInstant(true);
        };
        mql.addEventListener("change", onReduced);

        // A deep-link / restored-scroll jump can settle a few frames after
        // mount, so re-measure briefly before giving up. Anything still below
        // the fold stays scroll-triggered (whileInView) and animates on the way
        // in — only content already reached snaps.
        let raf = 0;
        let frames = 0;
        const check = () => {
            const el = elRef.current;
            if (el && el.getBoundingClientRect().top < window.innerHeight) {
                setInstant(true);
                return;
            }
            if (++frames < 30) raf = requestAnimationFrame(check);
        };
        raf = requestAnimationFrame(check);

        return () => {
            mql.removeEventListener("change", onReduced);
            cancelAnimationFrame(raf);
        };
    }, [instant]);

    if (instant) {
        return {
            ref,
            initial: false,
            animate: orchestrate ? "show" : INSTANT_LEAF,
            transition: { duration: 0 },
        };
    }
    return { ref, initial: "hidden", whileInView: "show", viewport: revealViewport };
}
