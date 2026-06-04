"use client";

import { useEffect, useState } from "react";

// Joke "uptime" since boot. Tuned so the computed value matches the canonical
// "Uptime: 26 years" surfaced in whoami/resume.summary (26y as of 2026).
const BIRTH_YEAR = 2000;

function formatHonolulu(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Honolulu",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

export default function NowWidget() {
  // Render a stable placeholder on first paint: under output:"export" the HTML is
  // generated at build time, so rendering new Date() during the initial render
  // would mismatch the client clock and trip a React hydration error. Real
  // values are filled in only after mount.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const time = now ? formatHonolulu(now) : "--:--";
  const uptime = now ? now.getFullYear() - BIRTH_YEAR : null;

  return (
    <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        online
      </span>
      <span className="text-border select-none" aria-hidden="true">
        ·
      </span>
      <span
        className="text-muted-foreground/70 italic decoration-dotted decoration-muted-foreground/40 underline underline-offset-2 cursor-help"
        title={`Jake's uptime since boot — est. ${BIRTH_YEAR}`}
        aria-label={`Easter egg: Jake's uptime is about ${uptime ?? "twenty-something"} years since ${BIRTH_YEAR}`}
      >
        ~uptime {uptime ?? "--"}y
      </span>
      <span className="text-border select-none" aria-hidden="true">
        ·
      </span>
      <span className="text-foreground tabular-nums">{time} HST</span>
    </div>
  );
}
