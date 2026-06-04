"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Code-split the heavy Three.js scene out of the initial bundle and never let
// it block first paint / LCP. Reduced-motion AND low-end / mobile users get a
// calm static gradient backdrop instead of the animated WebGL orb.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

// Narrowed Navigator surface for the optional hardware hints we gate on.
type HardwareNavigator = Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
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
    // Computed once via lazy init (read outside render-time mutation). Safe on
    // the server, where it resolves to the static `false` fallback.
    const [lowPower] = useState(detectLowPower);

    useEffect(() => {
        // 1) Honour reduced-motion: keep only the static backdrop.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        // 2) Mobile / low-end gate — never mount WebGL on coarse pointers,
        //    narrow viewports, or memory/CPU-constrained devices.
        const nav = navigator as HardwareNavigator;
        const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const narrowViewport = window.innerWidth < 768;
        const lowMemory = (nav.deviceMemory ?? 8) < 4;
        const lowCores = (nav.hardwareConcurrency ?? 8) < 4;

        if (coarsePointer || narrowViewport || lowMemory || lowCores) return;

        const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
        const start = () => setShow(true);
        if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(start);
        else setTimeout(start, 250);
    }, []);

    return (
        <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none">
            {/* Always-present ambient backdrop (also the reduced-motion / low-end fallback) */}
            <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
            {show && <Scene lowPower={lowPower} />}
        </div>
    );
}
