"use client";

import { useEffect, useState } from "react";
import { useBeamStore } from "@/hooks/useBeamStore";

const SEEN_KEY = "beam:boot";

/**
 * Play/skip decision, captured once per page load BEFORE the seen flag is
 * written. React StrictMode (dev) runs effect → cleanup → effect; deciding
 * from storage inside the effect made invocation 2 read the flag invocation 1
 * just wrote and early-return WITHOUT re-arming the timer/listeners cleanup
 * had torn down — a frozen, unskippable overlay. Both invocations must agree
 * on the same pre-write value so the second one re-arms identically.
 */
let shouldPlay: boolean | null = null;

function decideShouldPlay(): boolean {
    if (shouldPlay !== null) return shouldPlay;
    const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    let seen = false;
    try {
        seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
        /* storage blocked → treat as seen; never trap the user */
        seen = true;
    }
    shouldPlay = !reduced && !seen;
    if (shouldPlay) {
        try {
            sessionStorage.setItem(SEEN_KEY, "1");
        } catch {
            /* ignore */
        }
    }
    return shouldPlay;
}

/**
 * First-visit ignition overlay (≤1.5s, skippable, once per session).
 * Pure CSS keyframes — no motion lib on the critical path. The overlay is
 * rendered only when it will actually play, so LCP content underneath paints
 * normally on repeat visits and reduced-motion.
 */
export default function BootIgnition() {
    const setBootDone = useBeamStore((s) => s.setBootDone);
    const [play, setPlay] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const play = decideShouldPlay();
        // The pre-hydration cover has bridged paint→hydration; now that we know
        // whether the animated overlay plays, drop it. On the play branch the
        // z-100 overlay (same background) takes over seamlessly; on the skip
        // branch the real page shows through.
        document.getElementById("boot-cover")?.remove();
        if (!play) {
            setBootDone();
            return;
        }
        // Whether the overlay plays depends on sessionStorage + matchMedia,
        // which are unavailable during SSR/first render — so gating it in an
        // effect (one extra client render) is the correct, unavoidable pattern.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlay(true);

        let fadeTimer: number | undefined;
        const finish = () => {
            shouldPlay = false; // a real remount must not replay the boot
            setLeaving(true);
            setBootDone();
            // Let the fade-out class play, then unmount.
            fadeTimer = window.setTimeout(() => setPlay(false), 400);
        };
        const timer = window.setTimeout(finish, 1000); // flare+line = 1.0s, fade = 0.4s
        const skip = () => {
            window.clearTimeout(timer);
            finish();
        };
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });
        return () => {
            window.clearTimeout(timer);
            window.clearTimeout(fadeTimer);
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("keydown", skip);
        };
    }, [setBootDone]);

    if (!play) return null;

    return (
        <div
            aria-hidden="true"
            className={`boot-ignition ${leaving ? "boot-ignition--leaving" : ""}`}
        >
            <span className="boot-ignition__spark" />
            <span className="boot-ignition__line" />
        </div>
    );
}
