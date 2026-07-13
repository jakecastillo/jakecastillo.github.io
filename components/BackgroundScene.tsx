"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
