"use client";

import { useEffect } from "react";

/** Server-rendered content is useful before and without this enhancement. */
export function PortfolioMotion() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    import("@/lib/portfolio/runtime.js")
      .then(({ enhancePortfolio }) => {
        if (!disposed) cleanup = enhancePortfolio();
      })
      .catch(() => {
        /* Native links, disclosures and the static illustration remain usable. */
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return null;
}
