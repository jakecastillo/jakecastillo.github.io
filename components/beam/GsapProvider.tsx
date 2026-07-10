"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useScrollStore } from "@/hooks/useScrollStore";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * One-time GSAP setup. Lenis drives window scroll natively, so ScrollTrigger's
 * own scroll listener already works; the store subscription below just keeps
 * trigger positions exact during Lenis's smoothed frames (belt and suspenders).
 */
export default function GsapProvider() {
    useEffect(() => {
        const unsub = useScrollStore.subscribe((state, prev) => {
            if (state.offset !== prev.offset) ScrollTrigger.update();
        });
        // Lenis inits on idle; refresh measurements once everything settles.
        const t = setTimeout(() => ScrollTrigger.refresh(), 1200);
        return () => {
            unsub();
            clearTimeout(t);
        };
    }, []);
    return null;
}
