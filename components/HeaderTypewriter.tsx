"use client";

// The hero H1 is now STATIC and server-rendered so the value paints within ~1s
// and is readable to crawlers / AI screeners (no JS-gated typewriter on the
// LCP headline). The typed "signature" lives in the interactive terminal.
export default function HeaderTypewriter() {
  return (
    // Act-opener display grammar (jc-nc1, jc-if4): violet always carries the
    // CLAIM on the LAST line. The hero now owns the manifesto — a first-person
    // positioning statement, not a job title — so "systems we rely on" is the
    // claim and "I engineer the" sets it up. The job title demotes to the mono
    // eyebrow next to the name (page.tsx).
    // Hero-specific size steps (the scale's one deliberate break), measured:
    // "THE SYSTEMS" — the longest authored line — renders at 9.23px of width
    // per 1px of font-size in Archivo wdth-125, against a ~590px column at xl
    // and ~297px at 390w. Each step keeps every line single-line with slack;
    // the lockup must never soft-wrap (a wrapped manifesto pushes the terminal
    // below the fold).
    <h1 className="type-display text-foreground">
      <span className="block text-[1.9rem] sm:text-5xl lg:text-[2.75rem] xl:text-[3.625rem] 2xl:text-[4rem]">
        I engineer
      </span>
      <span className="block text-[1.9rem] sm:text-5xl lg:text-[2.75rem] xl:text-[3.625rem] 2xl:text-[4rem] text-primary text-glow">
        the systems
      </span>
      <span className="block text-[1.9rem] sm:text-5xl lg:text-[2.75rem] xl:text-[3.625rem] 2xl:text-[4rem] text-primary text-glow">
        we rely on.
      </span>
    </h1>
  );
}
