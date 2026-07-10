"use client";

import { useEffect, useState } from "react";
import { useBeamStore } from "@/hooks/useBeamStore";

const SEEN_KEY = "beam:boot";

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
        if (reduced || seen) {
            setBootDone();
            return;
        }
        try {
            sessionStorage.setItem(SEEN_KEY, "1");
        } catch {
            /* ignore */
        }
        // Whether the overlay plays depends on sessionStorage + matchMedia,
        // which are unavailable during SSR/first render — so gating it in an
        // effect (one extra client render) is the correct, unavoidable pattern.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlay(true);

        const finish = () => {
            setLeaving(true);
            setBootDone();
            // Let the fade-out class play, then unmount.
            window.setTimeout(() => setPlay(false), 400);
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
