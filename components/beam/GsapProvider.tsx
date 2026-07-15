"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useScrollStore } from "@/hooks/useScrollStore";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * One-time GSAP setup. Lenis drives window scroll natively, so ScrollTrigger's
 * own scroll listener already fires on every frame — a store subscription that
 * also called ScrollTrigger.update() just double-fired the same work (jc-aia),
 * so it's gone.
 *
 * What DID matter was the refresh: trigger start/end positions are cached at
 * setup, before late webfont/image layout shifts settle. Instead of a 1200ms
 * magic timer that hoped everything had settled, ScrollTrigger.refresh() fires
 * exactly once per page load, from whichever signal applies:
 *
 * - Primary: the store's `lenis` field — the moment SmoothScroll publishes
 *   the instance (or immediately, if it beat this effect).
 * - Fallback: SmoothScroll never constructs Lenis under prefers-reduced-motion,
 *   so that signal never comes for the reduced-motion cohort. For them,
 *   fonts.ready + window load — a strictly better "layout has settled" proxy
 *   than the old blind timer — drives the one refresh instead.
 */

/** Exactly-once latch, module-level so a StrictMode double-invoke (mount →
    cleanup → remount) cannot run the refresh twice. */
let didRefresh = false;

export default function GsapProvider() {
    useEffect(() => {
        if (didRefresh) return;
        let disposed = false;
        let unsub: (() => void) | null = null;
        const refresh = () => {
            if (didRefresh || disposed) return;
            didRefresh = true;
            ScrollTrigger.refresh();
            unsub?.();
            unsub = null;
        };

        // Primary: Lenis may already be live before this effect runs.
        if (useScrollStore.getState().lenis) {
            refresh();
        } else {
            unsub = useScrollStore.subscribe((state) => {
                if (state.lenis) refresh();
            });
        }

        // Fallback for the no-Lenis (reduced-motion) path. The lenis check at
        // resolution time keeps the two paths exclusive: if Lenis exists by
        // settle, its path owns the refresh (didRefresh also guards), and the
        // `disposed` flag makes a post-unmount resolution a no-op.
        const loaded =
            document.readyState === "complete"
                ? Promise.resolve()
                : new Promise<void>((resolve) =>
                      window.addEventListener("load", () => resolve(), {
                          once: true,
                      }),
                  );
        Promise.all([document.fonts.ready, loaded]).then(() => {
            if (!useScrollStore.getState().lenis) refresh();
        });

        return () => {
            disposed = true;
            unsub?.();
            unsub = null;
        };
    }, []);
    return null;
}
