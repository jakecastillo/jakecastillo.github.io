"use client";

// The hero H1 is now STATIC and server-rendered so the value paints within ~1s
// and is readable to crawlers / AI screeners (no JS-gated typewriter on the
// LCP headline). The typed "signature" lives in the interactive terminal.
export default function HeaderTypewriter() {
  return (
    <h1 className="font-black uppercase leading-[0.92] tracking-tighter text-foreground">
      <span className="block text-8xl">
        <span className="text-laser text-glow">Software</span>
      </span>
      <span className="block text-8xl">Engineer.</span>
    </h1>
  );
}
