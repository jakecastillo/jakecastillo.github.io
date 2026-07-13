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
 * What DID matter was the refresh: Lenis initializes lazily (on idle), and
 * ScrollTrigger's start/end positions must be recomputed once its smoothing is
 * in play. Instead of a 1200ms magic timer that hoped Lenis had settled, we
 * refresh exactly once off the store's `lenis` field — the moment SmoothScroll
 * publishes the instance (or immediately, if it beat us here).
 */
export default function GsapProvider() {
    useEffect(() => {
        let refreshed = false;
        const refresh = () => {
            if (refreshed) return;
            refreshed = true;
            ScrollTrigger.refresh();
        };
        // Lenis may already be live before this effect runs.
        if (useScrollStore.getState().lenis) {
            refresh();
            return;
        }
        const unsub = useScrollStore.subscribe((state) => {
            if (state.lenis) {
                refresh();
                unsub();
            }
        });
        return () => unsub();
    }, []);
    return null;
}
