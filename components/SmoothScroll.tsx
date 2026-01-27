"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useScrollStore } from "@/hooks/useScrollStore";

export default function SmoothScroll() {
    const setScroll = useScrollStore((state) => state.setScroll);
    const setLenis = useScrollStore((state) => state.setLenis);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        lenis.on('scroll', ({ scroll, progress }: { scroll: number; progress: number }) => {
            setScroll(scroll, progress);
        });
        setLenis(lenis);

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            setLenis(null);
            lenis.destroy();
        };
    }, [setLenis, setScroll]);

    return null;
}
