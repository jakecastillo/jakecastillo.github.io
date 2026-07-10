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
    // Scroll-restored loads (mid-page refresh) skip ignition: the relay ends
    // by landing on the hero underline, which is off-screen mid-document —
    // playing it there hands the light off to nothing. Seen flag stays
    // unwritten so a later top-of-page load still gets its first boot.
    const scrolled = window.scrollY > 4;
    shouldPlay = !reduced && !seen && !scrolled;
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
 * Landing target for the relay: where the boot line must end up, expressed as
 * the transform that moves the full-width centered line onto the hero
 * underline's rect. Measured from the SSR-static hero (which IS the final
 * layout — the cascade only snaps it hidden AFTER this effect's render
 * commits). Falls back to an off-screen top exit if the anchor is missing.
 */
function measureLanding(): {
    x: number;
    y: number;
    scale: number;
} {
    const anchor = document.querySelector("[data-boot-anchor]");
    // Layout viewport (clientWidth/Height), NOT innerWidth: the fixed overlay
    // is laid out EXCLUDING the scrollbar, and innerWidth includes it —
    // a classic ~15px landing error on scrollbar-visible platforms.
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    if (anchor) {
        const r = anchor.getBoundingClientRect();
        // When re-measured mid-boot (webfont has settled the name's width by
        // then), the identity cascade has already snapped the column hidden
        // with a translate offset — subtract accumulated ancestor translation
        // to recover the SETTLED rect the underline will occupy.
        let dx = 0;
        let dy = 0;
        for (
            let el: Element | null = anchor;
            el && el.id !== "home";
            el = el.parentElement
        ) {
            const t = getComputedStyle(el).transform;
            if (t && t !== "none") {
                const m = new DOMMatrixReadOnly(t);
                dx += m.m41;
                dy += m.m42;
            }
        }
        const left = r.left - dx;
        const bottom = r.bottom - dy;
        if (r.width > 8 && bottom > 0 && bottom < vh) {
            return {
                // Line element spans the viewport at top:50%; translate its
                // center onto the underline (span bottom + 6px offset, 1px
                // tall) and scale to the span width.
                x: left + r.width / 2 - vw / 2,
                y: bottom + 5 - vh / 2,
                scale: Math.max(r.width / vw, 0.02),
            };
        }
    }
    // No anchor (defensive): rise off the top and let the crossfade cover it.
    return { x: 0, y: -(vh * 0.54), scale: 0.25 };
}

/**
 * First-visit ignition overlay (veil gone ≤1.1s, skippable, once per session).
 * Pure CSS keyframes — no motion lib on the critical path. The overlay is
 * rendered only when it will actually play, so LCP content underneath paints
 * normally on repeat visits and reduced-motion.
 *
 * The relay (one continuous light): spark ignites → line draws out of it
 * center-out → spark rides the line as it lands on the hero underline's
 * measured rect (veil dissolving underneath) → the name cascades up to meet
 * it → boot line opacity-crossfades 1:1 into HeroUnderline at the same rect →
 * only then does the ribbon head flare in (BeamRibbon holds on bootDoneAt).
 * The overlay therefore outlives the veil: after `beam-line-land` ends, the
 * container is inert (pointer-events none, veil visibility:hidden) and only
 * the landed hairline remains, waiting for its CSS-scheduled handoff fade.
 */
export default function BootIgnition() {
    const setBootDone = useBeamStore((s) => s.setBootDone);
    const markBootPlaying = useBeamStore((s) => s.markBootPlaying);
    const markHandoff = useBeamStore((s) => s.markHandoff);
    // The landing transform doubles as the play flag: non-null ⇒ overlay up.
    const [landing, setLanding] = useState<{
        x: number;
        y: number;
        scale: number;
    } | null>(null);
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
        // effect (one extra client render) is the correct, unavoidable
        // pattern. The landing rect is measured from the SSR-static hero
        // BEFORE React commits the re-renders queued here (markBootPlaying
        // snaps the identity column hidden only after this effect returns).
        setLanding(measureLanding());

        let finished = false;
        let fadeTimer: number | undefined;
        let watchdog: number | undefined;
        let watchdogRetries = 2;
        /**
         * Two exits, one relay:
         * - natural (land animationend): the landed line must SURVIVE the
         *   boot to crossfade into HeroUnderline — no fade here; its CSS
         *   handoff keyframe (1.6s) does the 1:1 crossfade, and we unmount
         *   after it completes.
         * - skipped (tap/key/watchdog): jump to the settled state — fade the
         *   whole container out (the container carries no opacity animation,
         *   so a CSS transition fires reliably; the veil child keeps its own
         *   compositor-scheduled fade as the JS-free failsafe).
         */
        const finish = (skipped: boolean) => {
            if (finished) return; // animationend, watchdog and skip can race
            finished = true;
            shouldPlay = false; // a real remount must not replay the boot
            window.clearTimeout(watchdog);
            // Drop the skip listeners now — an unfired one must not linger
            // (and re-run finish) after the boot has ended.
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("keydown", skip);
            window.removeEventListener("animationend", onAnimationEnd);
            setBootDone();
            if (skipped) {
                // No boot line survives a skip — let the underline come in
                // with the cascade immediately.
                markHandoff();
                setLeaving(true);
                // Let the 0.25s container fade play, then unmount.
                fadeTimer = window.setTimeout(() => setLanding(null), 350);
            } else {
                // Keep the landed hairline mounted through its handoff fade
                // (CSS-scheduled 1.6→1.85s from overlay mount ≈ land end
                // +0.65s), then unmount with margin. markHandoff here is a
                // failsafe: the animationstart listener below normally fires
                // it, but the underline must never stay hidden past unmount.
                fadeTimer = window.setTimeout(() => {
                    markHandoff();
                    setLanding(null);
                }, 800);
            }
        };
        // End the boot the moment the line's landing keyframe completes
        // (animation events bubble to window), with a generous timer as a
        // watchdog — a saturated main thread can never hold the veil hostage
        // (and the veil's own compositor fade self-clears regardless).
        const onAnimationEnd = (e: AnimationEvent) => {
            if (e.animationName === "beam-line-land") finish(false);
        };
        // Crossfade sync: the boot line's fade-out is CSS-clocked from mount;
        // keying HeroUnderline's fade-in on the SAME animation's start (not
        // on bootDone) keeps the two halves of the crossfade on one clock
        // even when a stalled main thread delays animation events.
        const onAnimationStart = (e: AnimationEvent) => {
            if (e.animationName === "beam-line-handoff") markHandoff();
        };
        const skip = () => finish(true);
        // Watchdog (land ends ~1.2s): a stalled main thread can delay the
        // ANIMATIONS' start (they only begin at the first style commit), not
        // just the animationend delivery — so before condemning the boot,
        // check the land animation's actual state. Finished with the event
        // still queued → take the natural path (preserve the crossfade);
        // late but running → extend twice; anything else → skip-style fade.
        const onWatchdog = () => {
            const land = document
                .querySelector(".boot-ignition__line")
                ?.getAnimations()
                .find(
                    (a): a is CSSAnimation =>
                        a instanceof CSSAnimation &&
                        a.animationName === "beam-line-land",
                );
            if (land?.playState === "finished") {
                finish(false);
                return;
            }
            if (watchdogRetries-- > 0 && land?.playState === "running") {
                watchdog = window.setTimeout(onWatchdog, 600);
                return;
            }
            finish(true);
        };
        watchdog = window.setTimeout(onWatchdog, 1700);
        // Refine the landing target just before the land animation begins
        // (mount+0.85s): the initial measurement runs at hydration, before
        // the webfont settles the name's metrics (~5px drift measured).
        // Custom properties are read live by the keyframe, so updating them
        // during the land's delay phase is safe.
        const refine = window.setTimeout(() => {
            const el = overlayRef.current;
            if (finished || !el) return;
            const l = measureLanding();
            el.style.setProperty("--land-x", `${l.x}px`);
            el.style.setProperty("--land-y", `${l.y}px`);
            el.style.setProperty("--land-scale", `${l.scale}`);
        }, 700);
        window.addEventListener("animationend", onAnimationEnd);
        window.addEventListener("animationstart", onAnimationStart);
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });
        return () => {
            window.clearTimeout(watchdog);
            window.clearTimeout(fadeTimer);
            window.clearTimeout(refine);
            window.removeEventListener("animationend", onAnimationEnd);
            window.removeEventListener("animationstart", onAnimationStart);
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("keydown", skip);
        };
    }, [setBootDone, markBootPlaying, markHandoff]);

    if (!landing) return null;

    return (
        <div
            ref={overlayRef}
            aria-hidden="true"
            className={`boot-ignition ${leaving ? "boot-ignition--leaving" : ""}`}
            style={
                {
                    "--land-x": `${landing.x}px`,
                    "--land-y": `${landing.y}px`,
                    "--land-scale": `${landing.scale}`,
                } as React.CSSProperties
            }
        >
            <span className="boot-ignition__veil" />
            <span className="boot-ignition__spark" />
            <span className="boot-ignition__line" />
            <span className="boot-ignition__skip">
                tap / press any key to skip
            </span>
        </div>
    );
}
