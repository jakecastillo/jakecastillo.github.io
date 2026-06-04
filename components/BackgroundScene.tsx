"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Code-split the heavy Three.js scene out of the initial bundle and never let
// it block first paint / LCP. Reduced-motion (and low-end) users get a calm
// static gradient backdrop instead of the animated WebGL orb.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function BackgroundScene() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const start = () => setShow(true);
    if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(start);
    else setTimeout(start, 250);
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none">
      {/* Always-present ambient backdrop (also the reduced-motion fallback) */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      {show && <Scene />}
    </div>
  );
}
