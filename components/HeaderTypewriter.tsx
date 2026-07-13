"use client";

// The hero H1 is now STATIC and server-rendered so the value paints within ~1s
// and is readable to crawlers / AI screeners (no JS-gated typewriter on the
// LCP headline). The typed "signature" lives in the interactive terminal.
export default function HeaderTypewriter() {
  return (
    // Act-opener display grammar (jc-nc1): violet always carries the CLAIM
    // word on the LAST line — "Engineer." is the claim, "Software" qualifies.
    <h1 className="font-black uppercase leading-[0.92] tracking-tighter text-foreground [overflow-wrap:anywhere]">
      <span className="block text-7xl sm:text-8xl">Software</span>
      <span className="block text-7xl sm:text-8xl">
        <span className="text-primary text-glow">Engineer.</span>
      </span>
    </h1>
  );
}
