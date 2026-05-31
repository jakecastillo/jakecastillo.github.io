"use client";

import { useEffect, useState } from "react";

const BIRTH_YEAR = 1999; // 26y uptime as of 2026 per resume.summary

function formatHonolulu(now: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Pacific/Honolulu",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(now);
}

function uptimeYears(): number {
    return new Date().getFullYear() - BIRTH_YEAR;
}

export default function NowWidget() {
    const [time, setTime] = useState(() => formatHonolulu(new Date()));

    useEffect(() => {
        const tick = () => setTime(formatHonolulu(new Date()));
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                online
            </span>
            <span>uptime {uptimeYears()}y</span>
            <span className="text-foreground tabular-nums">{time} HST</span>
        </div>
    );
}
