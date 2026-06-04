"use client";

import { useEffect, useState } from "react";

// "uptime" reads as years shipping production software (first production role:
// DataHouse, Jan 2020) — an experience signal, NOT a birth year. (The old value
// derived age from a 2000 birth year, which broadcast Jake's age in the menubar.)
const CAREER_START_YEAR = 2020;

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
  const uptime = now ? now.getFullYear() - CAREER_START_YEAR : null;

  // The live clock is the liveness cue — no separate throbbing "online" LED.
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
      <span className="text-muted-foreground/70" title="years shipping production software">
        ~uptime {uptime ?? "--"}y
      </span>
      <span className="text-border select-none" aria-hidden="true">
        ·
      </span>
      <span className="text-foreground tabular-nums">{time} HST</span>
    </div>
  );
}
