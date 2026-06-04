"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useUrlSync } from "@/hooks/useUrlSync";
import { useMediaQuery, DESKTOP_MEDIA_QUERY } from "@/hooks/useMediaQuery";
import Menubar from "./Menubar";
import Dock from "./Dock";
import WindowFrame from "./WindowFrame";
import Palette from "./Palette";
import IdentityLockup from "./IdentityLockup";
import GrainOverlay from "./GrainOverlay";
import MobileShell from "./MobileShell";
import { APPS } from "./config/apps";
import { BRAND } from "./config/brand";
import { windowPhysics } from "@/lib/windowPhysics";

export default function Desktop() {
    // The windowed desktop shell needs both the width AND the height to host its
    // draggable windows (default heights 420-520px in config/apps). A width-only
    // `(min-width: 768px)` check flipped landscape phones (e.g. 844x390) into the
    // desktop shell, cramming draggable windows into a ~390px-tall area where
    // they can't fit and dragging is hostile on touch. Requiring a minimum
    // height keeps short landscape phones on the touch-first mobile shell while
    // leaving real tablets/desktops unchanged (jakecastillo_github_io-a1k).
    const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

    return isDesktop ? <DesktopShell /> : <MobileShell />;
}

function DesktopShell() {
    const phase = useBootStore((s) => s.phase);
    const windows = useDesktopStore((s) => s.windows);

    useHotkeys();
    useUrlSync();

    useEffect(() => {
        windowPhysics.init();
    }, []);

    const isInteractive = phase === "ready" || phase === "reveal";

    // Bare-desktop affordances key off this: nothing open across the window map.
    const noWindowsOpen = Object.values(windows).every((w) => !w);

    // F5: discoverability for an empty desktop. Shown ONLY when the boot
    // sequence has fully settled (phase === "ready") and no windows are open,
    // so it never competes with the IdentityLockup beat during reveal. It
    // fades out the instant any window opens.
    const showEmptyHint = phase === "ready" && noWindowsOpen;

    return (
        <div
            className="fixed inset-0 z-10"
            aria-hidden={!isInteractive}
            style={{ pointerEvents: isInteractive ? "auto" : "none" }}
        >
            {/* R10a grain: a static texture pass at z-[5] — above the z-0 orb +
                strapline, below windows (z >= 11) and the menubar/dock (z-40).
                pointer-events:none, so it never intercepts a drag/click. */}
            <GrainOverlay />
            {/* Strapline reads on a BARE desktop only — once any window is open
                it recedes, so it never duplicates the README window's signature
                headline (which now opens by default). */}
            <SignatureStrapline show={phase === "ready" && noWindowsOpen} />
            <Menubar />
            <EmptyDesktopHint show={showEmptyHint} />
            {Object.values(windows).map((w) => {
                if (!w) return null;
                const { Component } = APPS[w.id];
                return (
                    <WindowFrame key={w.id} window={w}>
                        <Component />
                    </WindowFrame>
                );
            })}
            <Dock />
            <IdentityLockup />
            <Palette />
        </div>
    );
}

/**
 * EmptyDesktopHint — faint, centered discoverability prompt for first-time
 * visitors who land on a bare desktop. It points to the two ways in (the dock
 * and ⌘K) and dissolves the moment any window opens.
 *
 * pointer-events:none always, so it can never intercept dock/menubar clicks or
 * a drag through the workspace. Sits below the dock (z-40) and palette (z-60).
 */
function EmptyDesktopHint({ show }: { show: boolean }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: show ? 0.4 : 0,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    aria-hidden="true"
                >
                    <p className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-muted-foreground/60">
                        Open an app from the dock
                        <span className="mx-2 text-muted-foreground/30">·</span>
                        or press{" "}
                        <kbd className="font-mono text-accent/80 normal-case tracking-normal">
                            ⌘K
                        </kbd>
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * SignatureStrapline — the ownable POV ('I make the secure path the fast path.')
 * rendered as an ALWAYS-ON, wallpaper-level hero line so the brand's point of
 * view is part of the desktop's first glance, not only the OG card / About.
 *
 * It lives at z-0 (below every window, which start at z >= 11, and below the
 * menubar/dock at z-40), pinned to the lower-center of the workspace above the
 * dock. Open windows therefore sit ON TOP of it and it quietly recedes — it
 * reads on a bare/just-revealed desktop and never clutters a working one.
 *
 * The signature uses font-display (Space Grotesk) at a tasteful size with a
 * bright-but-restrained violet->cyan gradient, echoing the VOID/LASER system
 * without the strong glow the IdentityLockup beat carries. Gradient stops sit at
 * high opacity (~0.7) and a soft colored backing glow (violet+cyan drop-shadows,
 * never a black shadow) lifts it to comfortable AA legibility on near-black at
 * every viewport size. It fades in once boot has fully settled (phase ===
 * "ready") so it doesn't compete with the reveal beat.
 *
 * Central-density easing (R10): the icosahedron lattice + equatorial lock-ring
 * sit dead-center of the viewport and the reveal bloom converges there too, so
 * the line is pulled DOWN (bottom-20, clear of the dock at bottom-6) for extra
 * vertical separation from the ring, and a localized soft VOID radial backing
 * (a dark, blurred ellipse behind the text only) tamps down the brightest
 * lattice right where the cyan end of the gradient would otherwise fight it —
 * preserving the R9 AA legibility win while letting the centre breathe.
 *
 * pointer-events:none + select-none always — it can never intercept a drag
 * across the workspace, a dock/menubar click, or window interaction.
 *
 * prefers-reduced-motion: appears with a plain, near-instant fade (no rise).
 */
function SignatureStrapline({ show }: { show: boolean }) {
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-x-0 bottom-20 z-0 flex justify-center px-6 pointer-events-none select-none"
                    initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: reduced ? 0.2 : 1.1,
                        delay: reduced ? 0 : 0.5,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    aria-hidden="true"
                >
                    <div className="relative flex justify-center">
                        {/* Localized VOID backing: a soft, dark radial ellipse
                            scoped to the line (NOT a full-screen scrim) calms the
                            brightest central lattice directly behind the text so
                            the cyan gradient end isn't competing with the ring's
                            glow. Tinted to #020617 (the scene void) and heavily
                            blurred so it has no hard edge; it scales/fades with
                            the line via the parent motion.div. */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[200%] w-[140%] -translate-x-1/2 -translate-y-1/2 blur-2xl"
                            style={{
                                background:
                                    "radial-gradient(ellipse at center, rgba(2,6,23,0.78) 0%, rgba(2,6,23,0.5) 45%, rgba(2,6,23,0) 72%)",
                            }}
                        />
                        <p
                            className="relative font-display font-semibold text-xl sm:text-2xl md:text-3xl tracking-tight text-center max-w-[20ch] bg-clip-text text-transparent"
                            style={{
                                backgroundImage:
                                    "linear-gradient(110deg, rgba(167,139,250,0.92), rgba(103,232,249,0.92))",
                                // Soft colored backing glow lifts the gradient text
                                // to comfortable AA on near-black. drop-shadow (not
                                // text-shadow) so the halo follows the clipped
                                // gradient even though the fill is transparent;
                                // kept violet/cyan to honor VOID/LASER (never a
                                // black shadow).
                                filter: "drop-shadow(0 0 18px rgba(139,92,246,0.45)) drop-shadow(0 0 10px rgba(34,211,238,0.35))",
                            }}
                        >
                            {BRAND.signature}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
