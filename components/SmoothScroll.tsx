"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useScrollStore } from "@/hooks/useScrollStore";

export default function SmoothScroll() {
    const setScroll = useScrollStore((state) => state.setScroll);
    const setLenis = useScrollStore((state) => state.setLenis);

    useEffect(() => {
        // Respect reduced-motion: skip smooth-scroll hijacking entirely.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        // Teardown state is captured in closures so deferred init still
        // cleans up correctly even if the effect unmounts before idle fires.
        let lenis: Lenis | null = null;
        let rafId: number | null = null;
        let cancelled = false;

        // Defer Lenis init until after first paint / idle so it stays off the
        // critical path and reduces first-load work.
        const idleHandle = scheduleIdle(() => {
            if (cancelled) return;

            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: "vertical",
                gestureOrientation: "vertical",
                smoothWheel: true,
                syncTouch: false, // never smooth/hijack native touch scrolling
                wheelMultiplier: 1,
                touchMultiplier: 2,
            });

            lenis.on(
                "scroll",
                ({ scroll, progress }: { scroll: number; progress: number }) => {
                    setScroll(scroll, progress);
                }
            );
            setLenis(lenis);

            const raf = (time: number) => {
                lenis?.raf(time);
                rafId = requestAnimationFrame(raf);
            };

            rafId = requestAnimationFrame(raf);
        });

        return () => {
            cancelled = true;
            cancelIdle(idleHandle);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            setLenis(null);
            // `lenis.destroy()` removes the scroll listener registered above.
            lenis?.destroy();
            lenis = null;
        };
    }, [setLenis, setScroll]);

    return null;
}

type IdleHandle =
    | { type: "idle"; id: number }
    | { type: "timeout"; id: ReturnType<typeof setTimeout> };

// requestIdleCallback when available, with a setTimeout fallback (Safari).
function scheduleIdle(callback: () => void): IdleHandle {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        return {
            type: "idle",
            id: window.requestIdleCallback(callback, { timeout: 1000 }),
        };
    }
    return { type: "timeout", id: setTimeout(callback, 200) };
}

function cancelIdle(handle: IdleHandle): void {
    if (handle.type === "idle") {
        if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
            window.cancelIdleCallback(handle.id);
        }
    } else {
        clearTimeout(handle.id);
    }
}
