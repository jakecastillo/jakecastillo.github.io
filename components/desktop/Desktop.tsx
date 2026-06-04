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
import GrainOverlay from "./GrainOverlay";
import MobileShell from "./MobileShell";
import { APPS } from "./config/apps";
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

    // Discoverability for an empty desktop. Shown ONLY when the boot sequence
    // has fully settled (phase === "ready") and no windows are open, so it never
    // competes with the reveal. It fades out the instant any window opens.
    const showEmptyHint = phase === "ready" && noWindowsOpen;

    return (
        <div
            className="fixed inset-0 z-10"
            aria-hidden={!isInteractive}
            style={{ pointerEvents: isInteractive ? "auto" : "none" }}
        >
            {/* R10a grain: a static texture pass at z-[5] — above the z-0 orb,
                below windows (z >= 11) and the menubar/dock (z-40).
                pointer-events:none, so it never intercepts a drag/click. */}
            <GrainOverlay />
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

