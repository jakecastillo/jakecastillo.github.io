"use client";

import { useEffect, useRef, useState } from "react";
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
    const markBootPlaying = useBeamStore((s) => s.markBootPlaying);
    const [play, setPlay] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

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
        // Tell the hero its identity cascade will run — it snaps to `hidden`
        // under the opaque overlay so the reveal plays FOR the visitor.
        markBootPlaying();
        // Whether the overlay plays depends on sessionStorage + matchMedia,
        // which are unavailable during SSR/first render — so gating it in an
        // effect (one extra client render) is the correct, unavoidable pattern.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlay(true);

        let finished = false;
        let fadeTimer: number | undefined;
        const finish = () => {
            if (finished) return; // animationend, watchdog and skip can race
            finished = true;
            shouldPlay = false; // a real remount must not replay the boot
            window.clearTimeout(watchdog);
            // Drop the skip listeners now — an unfired one must not linger
            // (and re-run finish) after the boot has ended.
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("keydown", skip);
            window.removeEventListener("animationend", onAnimationEnd);
            // The veil's boot-veil-fade is scheduled at 1.15s (self-clearing
            // even if this handler runs late). If we're ending EARLY (skip),
            // pull the fade forward by rewriting its delay to the animation's
            // own elapsed time — the same 0.3s fade, just starting now. Past
            // 1.15s the fade is already underway/done: leave it alone.
            const el = overlayRef.current;
            const veil = el
                ?.getAnimations()
                .find(
                    (a): a is CSSAnimation =>
                        a instanceof CSSAnimation &&
                        a.animationName === "boot-veil-fade",
                );
            const elapsed = Number(veil?.currentTime ?? NaN);
            if (el && veil && Number.isFinite(elapsed) && elapsed < 1150) {
                el.style.animationDelay = `${Math.max(0, Math.round(elapsed))}ms`;
            }
            setLeaving(true);
            setBootDone();
            // Let the 0.3s fade-out play, then unmount.
            fadeTimer = window.setTimeout(() => setPlay(false), 350);
        };
        // End the boot the moment the line's rise keyframe actually completes
        // (animation events bubble to window), with a generous timer as a
        // watchdog — a saturated main thread can never hold the veil hostage.
        const onAnimationEnd = (e: AnimationEvent) => {
            if (e.animationName === "beam-line-rise") finish();
        };
        const skip = () => finish();
        const watchdog = window.setTimeout(finish, 1600); // rise ends ~1.15s
        window.addEventListener("animationend", onAnimationEnd);
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });
        return () => {
            window.clearTimeout(watchdog);
            window.clearTimeout(fadeTimer);
            window.removeEventListener("animationend", onAnimationEnd);
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("keydown", skip);
        };
    }, [setBootDone, markBootPlaying]);

    if (!play) return null;

    return (
        <div
            ref={overlayRef}
            aria-hidden="true"
            className={`boot-ignition ${leaving ? "boot-ignition--leaving" : ""}`}
        >
            <span className="boot-ignition__spark" />
            <span className="boot-ignition__line" />
            <span className="boot-ignition__skip">
                tap / press any key to skip
            </span>
        </div>
    );
}
