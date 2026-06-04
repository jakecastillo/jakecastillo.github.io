"use client";

import { useRef } from "react";
import { motion, type PanInfo } from "framer-motion";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { useUrlSync } from "@/hooks/useUrlSync";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { APPS } from "./config/apps";
import { DOCK_ORDER } from "./config/dock";
import NowWidget from "./NowWidget";
import Wordmark from "./Wordmark";
import GrainOverlay from "./GrainOverlay";
import MobileIdentityLockup from "./MobileIdentityLockup";

// R8 swipe nav tuning. The gesture is purely ADDITIVE to the tab bar — it only
// commits a switch when the horizontal intent is unambiguous so it never fights
// the vertical `overflow-auto` scroll inside an app.
//
//   AXIS_LOCK_RATIO — early in the pan, |dx| must dominate |dy| by this factor
//     for the gesture to be treated as horizontal. This is the load-bearing
//     guard against hijacking vertical scroll.
//   DISTANCE_THRESHOLD — a deliberate horizontal swipe (px) commits a switch.
//   VELOCITY_THRESHOLD — a fast flick commits even if short.
const AXIS_LOCK_RATIO = 1.4;
const AXIS_LOCK_MIN_PX = 10;
const DISTANCE_THRESHOLD = 64;
const VELOCITY_THRESHOLD = 360;

export default function MobileShell() {
    const phase = useBootStore((s) => s.phase);
    const focusedId = useDesktopStore((s) => s.focusedId);
    const windows = useDesktopStore((s) => s.windows);
    const open = useDesktopStore((s) => s.open);
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

    useUrlSync();

    const isInteractive = phase === "ready" || phase === "reveal";
    // R4-mobile: land on the README manifest by default, mirroring desktop —
    // not the Terminal fun-fact.
    const activeId: AppId = focusedId ?? "readme";

    // Keep every opened app MOUNTED and just toggle which one is visible, so
    // switching tabs never tears down an app's local state. This mirrors the
    // desktop shell, where windows stay mounted in the store's `windows` map —
    // the Terminal's output/history/in-progress input survive a tab switch
    // instead of being remounted fresh (jakecastillo_github_io-ehx).
    //
    // Terminal is always mounted (it's a stateful shell whose scrollback should
    // survive a tab switch); the active tab and every other opened window are
    // mounted on demand once they appear in the store. The active tab
    // fades/slides in over the rest.
    const mountedIds: AppId[] = DOCK_ORDER.filter(
        (id) => id === "terminal" || id === activeId || Boolean(windows[id]),
    );

    // R8 axis-lock state. We track whether the in-flight pan has committed to
    // the horizontal axis (or been rejected as vertical) so panEnd can ignore
    // gestures that were really vertical scrolls. Refs (not state) so updating
    // mid-gesture never triggers a re-render.
    const axisRef = useRef<"none" | "x" | "y">("none");

    const activeIndex = DOCK_ORDER.indexOf(activeId);

    // R8: switch to the neighbour app in DOCK_ORDER. Clamped at the ends (no
    // wrap). Haptic tick on a real switch, feature-detected + reduced-motion
    // gated. Returns whether a switch happened (so callers can rubber-band the
    // edge instead).
    const switchByDelta = (delta: number): boolean => {
        const nextIndex = activeIndex + delta;
        if (nextIndex < 0 || nextIndex >= DOCK_ORDER.length) return false;
        const nextId = DOCK_ORDER[nextIndex];
        if (nextId === activeId) return false;
        // Android-only light haptic on tab switch; skipped under reduced motion
        // and where the API is absent (most iOS browsers, desktop).
        if (!reduced && typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(8);
        }
        open(nextId);
        return true;
    };

    const handlePan = (_e: PointerEvent, info: PanInfo) => {
        // Commit the gesture to an axis as soon as its intent is clear. Once
        // locked it stays locked for the rest of the gesture, so a swipe that
        // started horizontal won't flip to vertical mid-drag (and vice versa).
        if (axisRef.current !== "none") return;
        const { x, y } = info.offset;
        const ax = Math.abs(x);
        const ay = Math.abs(y);
        if (ax < AXIS_LOCK_MIN_PX && ay < AXIS_LOCK_MIN_PX) return;
        // Horizontal only if dx clearly dominates dy — otherwise treat it as a
        // vertical scroll and stay out of the way.
        axisRef.current = ax > ay * AXIS_LOCK_RATIO ? "x" : "y";
    };

    const handlePanEnd = (_e: PointerEvent, info: PanInfo) => {
        const committedHorizontal = axisRef.current === "x";
        axisRef.current = "none";
        if (!committedHorizontal) return;

        const { offset, velocity } = info;
        // A deliberate drag OR a fast flick crosses the threshold.
        const crossed =
            Math.abs(offset.x) > DISTANCE_THRESHOLD ||
            Math.abs(velocity.x) > VELOCITY_THRESHOLD;
        if (!crossed) return;

        // Natural direction: swipe LEFT (negative dx) advances to the NEXT app;
        // swipe RIGHT goes to the PREVIOUS. switchByDelta clamps at both ends,
        // so an over-swipe at an edge is simply a no-op (the panel springs back
        // since drag is never applied to the track).
        switchByDelta(offset.x < 0 ? 1 : -1);
    };

    return (
        <div
            className="fixed inset-0 z-10 flex flex-col"
            aria-hidden={!isInteractive}
            style={{ pointerEvents: isInteractive ? "auto" : "none" }}
        >
            {/* R10a grain: static texture at z-[5] — above the z-0 orb, below
                this shell's header/main/nav. pointer-events:none, never
                intercepts a tap or swipe. */}
            <GrainOverlay />

            <motion.header
                initial={{ y: -30, opacity: 0 }}
                animate={isInteractive ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="relative z-10 h-9 flex items-center justify-between gap-3 px-4 bg-black/40 backdrop-blur-md border-b border-white/5 font-mono text-[11px]"
            >
                {/* min-w-0 + truncate lets the title give way before the status
                    widget, and whitespace-nowrap keeps it on a single line so it
                    can never wrap and overflow the fixed 36px header
                    (jakecastillo_github_io-5nw). */}
                <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap font-bold">
                    <Wordmark size="11px" />
                    <span className="truncate text-muted-foreground">
                        / {APPS[activeId].name}
                    </span>
                </span>
                {/* shrink-0 + nowrap keeps the status widget on one line; it wins
                    the space contest against the truncating title. */}
                <span className="shrink-0 whitespace-nowrap">
                    <NowWidget />
                </span>
            </motion.header>

            {/* R8: the swipe surface. onPan/onPanEnd (NOT drag="x") — the tabs
                are stacked position:absolute, not a horizontal track, so we
                read the gesture and call open() rather than translating a rail.
                touch-action: pan-y keeps native vertical scrolling responsive
                while we own horizontal intent. */}
            <motion.main
                className="relative z-10 flex-1 overflow-hidden"
                style={{ touchAction: "pan-y" }}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
            >
                {mountedIds.map((id) => {
                    const Active = APPS[id].Component;
                    const isActive = id === activeId;
                    return (
                        <motion.div
                            key={id}
                            aria-hidden={!isActive}
                            initial={false}
                            animate={
                                isActive
                                    ? { opacity: 1, x: 0 }
                                    : { opacity: 0, x: reduced ? 0 : -16 }
                            }
                            transition={{ duration: reduced ? 0 : 0.25 }}
                            className="absolute inset-0 overflow-auto"
                            style={{
                                // Inactive tabs stay mounted but are visually
                                // hidden and inert — no pointer capture, removed
                                // from the tab order, state intact.
                                pointerEvents: isActive ? "auto" : "none",
                                visibility: isActive ? "visible" : "hidden",
                                zIndex: isActive ? 1 : 0,
                            }}
                        >
                            <Active />
                        </motion.div>
                    );
                })}

                {/* R6: mobile's one-time brand crescendo. Mounted INSIDE <main>
                    (so its local scrim can never overlay the top bar or tab
                    row) and only during the reveal phase — it self-dismisses
                    after a short dwell or on first gesture. pointer-events:none,
                    so it never blocks a tab tap or the swipe surface. */}
                {isInteractive && phase === "reveal" && <MobileIdentityLockup />}
            </motion.main>

            <motion.nav
                initial={{ y: 60, opacity: 0 }}
                animate={isInteractive ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                aria-label="App switcher"
                className="relative z-10 flex min-h-16 items-center justify-around px-4 bg-black/50 backdrop-blur-xl border-t border-white/10"
                // Reserve the home-indicator safe area below the tab row so the
                // OS gesture bar can't shrink the effective hit area on notched
                // phones (jakecastillo_github_io-qr1).
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
                {DOCK_ORDER.map((id) => {
                    const A = APPS[id];
                    const Icon = A.icon;
                    const active = id === activeId;
                    return (
                        <button
                            key={id}
                            onClick={() => open(id)}
                            aria-label={A.name}
                            // aria-current exposes the active tab to assistive
                            // tech, and the indicator dot below conveys the same
                            // state without relying on color alone
                            // (jakecastillo_github_io-m07).
                            aria-current={active ? "page" : undefined}
                            // 44x44 minimum touch target (WCAG 2.5.5 / Apple HIG)
                            // (jakecastillo_github_io-qr1). active:scale-[0.98]
                            // gives the tap physical feedback on touch (R8) — a
                            // transform only on :active, so it never competes
                            // with the boot/reveal motion and degrades cleanly.
                            className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-lg transition-colors active:scale-[0.98] ${
                                active ? "text-accent" : "text-muted-foreground"
                            }`}
                        >
                            <Icon size={20} strokeWidth={1.5} />
                            {/* Non-color active indicator: a small dot under the
                                active icon so color-blind users and AT both get
                                the current-tab cue. */}
                            <span
                                aria-hidden="true"
                                className={`absolute bottom-1 h-1 w-1 rounded-full bg-accent transition-opacity ${
                                    active ? "opacity-100" : "opacity-0"
                                }`}
                            />
                        </button>
                    );
                })}
            </motion.nav>
        </div>
    );
}
