"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Lazy-load the r3f/three WebGL wallpaper so the ~heavy three.js bundle leaves
// the initial critical path (improves FCP/LCP/TBT). ssr:false is valid here
// because this is a Client Component. The boot loader (QuantumLoader) paints
// first and its phase machine has a time-based fallback, so the canvas mounting
// a beat later is safe; <Scene/> only fades in at the "reveal" phase anyway.
const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function SceneLoader() {
  // Defer mounting the dynamic Scene until AFTER first paint to cut LCP/TBT.
  // Even with ssr:false + next/dynamic, mounting <Scene/> immediately schedules
  // the three.js chunk load + WebGL Canvas init while the boot terminal is still
  // painting. We hold it back behind an idle/post-paint flag so the first frame
  // is identity + boot only. requestIdleCallback yields to the browser until the
  // main thread is quiet; setTimeout(~200ms) is the fallback for Safari/older.
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => setIdle(true), { timeout: 1000 });
    } else {
      timeoutId = setTimeout(() => setIdle(true), 200);
    }

    return () => {
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  // Render nothing until idle so three.js never competes with first paint.
  // Scene keeps its own reveal-phase opacity fade once it does mount.
  if (!idle) return null;

  return <Scene />;
}
