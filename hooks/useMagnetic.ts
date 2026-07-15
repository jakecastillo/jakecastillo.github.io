"use client";

import {
    type MouseEvent as ReactMouseEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";

type UseMagneticOptions = {
    /** Follow ratio: how strongly the element leans toward the cursor. */
    pull?: number;
    /** Hard px cap on the lean, so wide elements never overshoot a subtle few px. */
    max?: number;
    /** Icon lead ratio — the icon parallaxes slightly AHEAD of the element (mass). */
    parallax?: number;
};

/**
 * A small rAF-throttled magnetic-lean hook. Springed, hard-capped to a few px,
 * and gated behind fine-pointer + motion-safe so touch / coarse-pointer /
 * reduced-motion users get a fully static control. Physics mirror Navigation's
 * MagneticButton (stiffness 150 / damping 20 / mass 0.1); the rAF coalesces
 * many mousemove events into ONE transform write per frame, and the rect is
 * read once on enter (never per move) to avoid layout thrash.
 *
 * Returns a `[bind, icon]` tuple of flat prop bags to SPREAD: `bind` onto the
 * leaning element (callback ref + spring transform + mouse handlers), `icon`
 * onto a child that should parallax slightly ahead of it.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(
    options: UseMagneticOptions = {}
) {
    const { pull = 0.18, max = 6, parallax = 0.4 } = options;

    const prefersReducedMotion = useReducedMotion();
    const [finePointer, setFinePointer] = useState(false);
    const enabled = finePointer && !prefersReducedMotion;

    // Callback ref: only stores the node, so the hook returns a FUNCTION (not a
    // raw ref object). A returned raw ref taints the whole result object under
    // the React Compiler's "no refs during render" rule the moment a consumer
    // reads any member of it — the callback keeps that spread/access clean.
    const elRef = useRef<T | null>(null);
    const ref = useCallback((node: T | null) => {
        elRef.current = node;
    }, []);
    const rect = useRef<DOMRect | null>(null);
    const pointer = useRef({ x: 0, y: 0 });
    const frame = useRef<number | null>(null);

    // Motion values drive the transform OFF the React render path; springs add
    // the heavy/premium glide. The icon leads the element slightly (parallax).
    const mvX = useMotionValue(0);
    const mvY = useMotionValue(0);
    const x = useSpring(mvX, { stiffness: 150, damping: 20, mass: 0.1 });
    const y = useSpring(mvY, { stiffness: 150, damping: 20, mass: 0.1 });
    const iconX = useTransform(x, (v) => v * parallax);
    const iconY = useTransform(y, (v) => v * parallax);

    // Only fine-pointer, hover-capable, >= md devices lean; anything else stays
    // static. Kept in sync so a pointer/viewport change settles the element.
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const query = window.matchMedia(
            "(pointer: fine) and (hover: hover) and (min-width: 768px)"
        );
        const update = () => setFinePointer(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    const applyPull = () => {
        frame.current = null;
        const r = rect.current;
        if (!r) return;
        const clamp = (v: number) => (v < -max ? -max : v > max ? max : v);
        mvX.set(clamp((pointer.current.x - (r.left + r.width / 2)) * pull));
        mvY.set(clamp((pointer.current.y - (r.top + r.height / 2)) * pull));
    };

    // Read the rect ONCE on enter (not per move) to avoid layout thrash.
    const onMouseEnter = () => {
        if (enabled && elRef.current)
            rect.current = elRef.current.getBoundingClientRect();
    };
    const onMouseMove = (e: ReactMouseEvent) => {
        if (!enabled || !rect.current) return;
        pointer.current.x = e.clientX;
        pointer.current.y = e.clientY;
        if (frame.current === null) frame.current = requestAnimationFrame(applyPull);
    };
    const onMouseLeave = () => {
        if (frame.current !== null) {
            cancelAnimationFrame(frame.current);
            frame.current = null;
        }
        mvX.set(0);
        mvY.set(0);
    };

    // If motion becomes disabled mid-session (pointer went coarse / reduced-motion
    // toggled on), settle back to the static 0,0 end state; always cancel a
    // pending frame on unmount.
    useEffect(() => {
        if (!enabled) {
            if (frame.current !== null) {
                cancelAnimationFrame(frame.current);
                frame.current = null;
            }
            mvX.set(0);
            mvY.set(0);
        }
        return () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current);
        };
    }, [enabled, mvX, mvY]);

    // Two flat, SPREADABLE prop bags (never member-accessed by the consumer):
    // `bind` for the leaning element (callback ref + spring transform + mouse
    // handlers), `icon` for a parallaxing child. Spreading — like useReveal —
    // sidesteps the React Compiler's "no refs during render" rule that a bare
    // `.ref` member access on the result would trip.
    const bind = {
        ref,
        style: { x, y },
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
    };
    const icon = { style: { x: iconX, y: iconY } };
    return [bind, icon] as const;
}
