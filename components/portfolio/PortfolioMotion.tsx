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
        // Stop loading feedback immediately when the enhancement cannot start.
        if (!disposed) document.body.classList.add("css-fallback");
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return null;
}
