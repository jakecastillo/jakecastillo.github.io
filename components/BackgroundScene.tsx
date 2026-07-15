"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useBeamAnchors } from "@/hooks/useBeamAnchors";

// Code-split the heavy Three.js scene out of the initial bundle and never let
// it block first paint / LCP. Reduced-motion AND low-end / mobile users get a
// calm static gradient backdrop instead of the animated WebGL orb.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

// Narrowed Navigator surface for the optional hardware hints we gate on.
type HardwareNavigator = Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: { saveData?: boolean };
};

// Borderline devices still render the Scene, but in a cheaper "lowPower" mode.
// Treat sub-8-core / sub-8GB machines and sub-1024px viewports as borderline so
// the Scene can shed its most expensive effects (Environment map, glass lens).
function detectLowPower(): boolean {
    if (typeof window === "undefined") return false;
    const nav = navigator as HardwareNavigator;
    return (
        (nav.deviceMemory ?? 8) < 8 ||
        (nav.hardwareConcurrency ?? 8) < 8 ||
        window.innerWidth < 1024
    );
}

export default function BackgroundScene() {
    const [show, setShow] = useState(false);
    const [reduced, setReduced] = useState(false);
    // Computed once via lazy init (read outside render-time mutation). Safe on
    // the server, where it resolves to the static `false` fallback.
    const [lowPower] = useState(detectLowPower);

    // DOM-side anchor measurement for the beam ribbon: projects the acts'
    // real layout anchors to plain data the Canvas reads via getState-style
    // access inside useFrame (no React state per scroll tick).
    useBeamAnchors();

    // Cursor warm-up for the schematic grid (fine pointers only). A faint violet
    // radial puddle tracks the pointer, lifting the 40px grid lines from ~1.2%
    // to ~4% locally so the surface reacts to presence — the DOM/CSS twin of the
    // ribbon's cursor heat. Pure CSS custom properties updated by a rAF-throttled
    // pointermove handler: never React state, never the Canvas. The handler only
    // stashes coords + schedules a frame (sub-1ms); the flush writes three vars.
    // Coarse/touch pointers get nothing (the effect bails). Reduced motion
    // disables the warm-up entirely — the grid stays at its resting opacity and
    // nothing tracks the pointer. Violet-only; no cyan (answer-reserved).
    const gridWarmRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = gridWarmRef.current;
        if (!el) return;
        if (!window.matchMedia("(pointer: fine)").matches) return;
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        // Interaction-driven motion (a puddle tracking the pointer) is disabled
        // for reduced motion — the grid stays still at its resting opacity.
        if (reducedMotion) return;
        el.style.transition = "opacity 320ms ease";

        let raf = 0;
        let px = 0;
        let py = 0;
        const flush = () => {
            raf = 0;
            el.style.setProperty("--grid-x", `${px}px`);
            el.style.setProperty("--grid-y", `${py}px`);
            el.style.setProperty("--grid-heat", "0.05");
        };
        const onMove = (e: PointerEvent) => {
            px = e.clientX;
            py = e.clientY;
            if (!raf) raf = requestAnimationFrame(flush);
        };
        const onLeave = () => {
            if (raf) {
                cancelAnimationFrame(raf);
                raf = 0;
            }
            el.style.setProperty("--grid-heat", "0");
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        window.addEventListener("blur", onLeave);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener("pointermove", onMove);
            document.documentElement.removeEventListener(
                "pointerleave",
                onLeave,
            );
            window.removeEventListener("blur", onLeave);
        };
    }, []);

    useEffect(() => {
        // Skip WebGL entirely only for genuinely constrained devices (data-saver
        // / sub-4GB / sub-4-core): they keep the static gradient + aurora.
        const nav = navigator as HardwareNavigator;
        const lowMemory = (nav.deviceMemory ?? 8) < 4;
        const lowCores = (nav.hardwareConcurrency ?? 8) < 4;
        const saveData = nav.connection?.saveData === true;
        if (lowMemory || lowCores || saveData) return;

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReduced) {
            // Capable hardware + reduced motion: still mount the holo as a single
            // frozen LIT frame (brand identity intact) — no boot, no loop. Defer
            // the state updates out of the effect body (no synchronous setState).
            queueMicrotask(() => {
                setReduced(true);
                setShow(true);
            });
            return;
        }

        const w = window as unknown as {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        };
        const start = () => setShow(true);
        // Mount promptly (≤280ms) so the boot underlays the hero cascade rather
        // than arriving after it; the always-on aurora covers the brief gap.
        if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(start, { timeout: 280 });
        else setTimeout(start, 180);
    }, []);

    return (
        <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none">
            {/* Always-present ambient backdrop (also the reduced-motion / low-end fallback) */}
            <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
            {/* Site-wide schematic grid (jc-wpd): the 40px texture that used to
                live only in Act V, promoted UNDER the aurora as a whisper.
                --border lines (10% white) at 0.12 layer opacity ≈ 1.2%
                effective white — sub-1.5%, static CSS, zero motion. */}
            <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                    backgroundImage:
                        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />
            {/* Cursor warm-up (jc-nqz): the SAME 40px grid re-drawn in violet and
                clipped to a ~260px radial puddle that tracks the pointer, lifting
                the lines locally from ~1.2% to ~4%. Aligned to the same origin so
                it brightens the existing lines rather than offsetting a second
                grid. Position + intensity ride CSS vars set by the rAF-throttled
                handler above (fine pointers only); opacity 0 at rest keeps it
                invisible until first contact, and coarse/touch never arm it.
                Violet only — cyan stays answer-reserved. */}
            <div
                ref={gridWarmRef}
                className="absolute inset-0"
                style={{
                    opacity: "var(--grid-heat, 0)",
                    backgroundImage:
                        "linear-gradient(rgba(139,92,246,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.7) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                    WebkitMaskImage:
                        "radial-gradient(circle 260px at var(--grid-x, 50%) var(--grid-y, -300px), #000 0%, #000 20%, transparent 72%)",
                    maskImage:
                        "radial-gradient(circle 260px at var(--grid-x, 50%) var(--grid-y, -300px), #000 0%, #000 20%, transparent 72%)",
                }}
            />
            {/* Ambient aurora — drifting glows that make the whole backdrop feel alive,
                visible from first paint and on mobile (where the WebGL holo is gated off). */}
            <div className="aurora">
                <div className="aurora-blob aurora-blob--violet aurora-1" />
                <div className="aurora-blob aurora-blob--cyan aurora-2" />
                <div className="aurora-blob aurora-blob--violet aurora-3" />
            </div>
            {show && <Scene lowPower={lowPower} reducedMotion={reduced} />}
        </div>
    );
}
