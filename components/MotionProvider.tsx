"use client";

import { MotionConfig } from "framer-motion";

// reducedMotion="user" makes framer-motion automatically skip transform/layout
// animations for users who request reduced motion (keeping opacity/colour fades).
// This lets every component render ONE constant `initial` markup — identical on
// server and client — instead of branching on useReducedMotion() at render time
// (which caused a hydration mismatch under prefers-reduced-motion).
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
