"use client";

import { create } from "zustand";
import { useCallback, useEffect, useState } from "react";
import type React from "react";
import {
    useMotionValue,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion";

interface TiltState {
    enabled: boolean;
    enable: () => void;
}

export const useTiltStore = create<TiltState>((set) => ({
    enabled: false,
    enable: () => set({ enabled: true }),
}));

// --- Pointer-tracked 3D lean -------------------------------------------------
// The zustand store above governs the OPT-IN device-tilt parallax on the WebGL
// background (a coarse-pointer gyroscope affordance). This hook is its
// fine-pointer cousin: a springed 3D lean that tracks the cursor across a
// surface, capped so it reads as a quiet parallax tell — never a flip. It is
// motion-safe + fine-pointer ONLY; coarse (touch) and reduced-motion callers
// get inert MotionValues pinned at 0 (identity transform), so the resting
// composition is byte-for-byte unchanged from the static seal.
const TILT_CAP = 5; // deg — the ~4-6deg lean ceiling
// One springed feel: short and critically damped enough to settle without a
// visible overshoot ring, matching the brand's expo-out restraint.
const TILT_SPRING = { stiffness: 220, damping: 20, mass: 0.4 } as const;

export interface PointerTilt {
    /** Attach to the tracking surface (the hover target). */
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerLeave: () => void;
    /** Springed lean — feed to a motion element's style (with transformPerspective). */
    rotateX: MotionValue<number>;
    rotateY: MotionValue<number>;
    /** True only where a fine pointer can hover AND motion is welcome. */
    active: boolean;
}

/**
 * Pointer-tracked, springed 3D lean for a single surface. Track the pointer on
 * the hover target (`onPointerMove`/`onPointerLeave`) and apply `rotateX`/
 * `rotateY` to the element that should lean, alongside a `transformPerspective`
 * so the tilt reads as depth. The lean is capped at TILT_CAP degrees and
 * springs back to flat on leave. Inert unless fine-pointer + motion-safe.
 */
export function usePointerTilt(): PointerTilt {
    // Start inert (SSR-safe), then light up only where the affordance belongs.
    const [active, setActive] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setActive(fine.matches && !reduce.matches);
        update();
        fine.addEventListener("change", update);
        reduce.addEventListener("change", update);
        return () => {
            fine.removeEventListener("change", update);
            reduce.removeEventListener("change", update);
        };
    }, []);

    // -0.5..0.5 across the surface, springed into the capped lean. rotateX is
    // inverted so the pointer draws the near edge toward the viewer.
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const rotateX = useSpring(
        useTransform(py, [-0.5, 0.5], [TILT_CAP, -TILT_CAP]),
        TILT_SPRING,
    );
    const rotateY = useSpring(
        useTransform(px, [-0.5, 0.5], [-TILT_CAP, TILT_CAP]),
        TILT_SPRING,
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!active) return;
            const rect = e.currentTarget.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            px.set((e.clientX - rect.left) / rect.width - 0.5);
            py.set((e.clientY - rect.top) / rect.height - 0.5);
        },
        [active, px, py],
    );
    const onPointerLeave = useCallback(() => {
        px.set(0);
        py.set(0);
    }, [px, py]);

    return { onPointerMove, onPointerLeave, rotateX, rotateY, active };
}
