"use client";

import { useEffect } from "react";

// iOS Safari only applies :active styles while the document (or an ancestor) has
// a touchstart listener. Register one passive no-op so press-state CSS
// (active:scale / active:border) fires on tap for non-anchor elements too.
export default function TouchActive() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  return null;
}
