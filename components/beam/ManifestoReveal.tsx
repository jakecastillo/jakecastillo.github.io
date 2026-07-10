"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * The oversized manifesto moment: words start as faint embers (15% opacity)
 * and ignite to full as the beam passes — scrubbed to scroll, so the reader
 * drags the light across the statement. Reduced motion: fully lit, static.
 */
export default function ManifestoReveal({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    const ref = useRef<HTMLHeadingElement>(null);

    useGSAP(
        () => {
            if (
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
                return;
            if (!ref.current) return;
            const split = SplitText.create(ref.current, {
                type: "words",
                autoSplit: true,
            });
            gsap.fromTo(
                split.words,
                { opacity: 0.15 },
                {
                    opacity: 1,
                    stagger: 0.06,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ref.current,
                        start: "top 80%",
                        end: "bottom 55%",
                        scrub: 0.4,
                    },
                },
            );
            return () => split.revert();
        },
        { scope: ref },
    );

    return (
        <h2 ref={ref} className={className}>
            {children}
        </h2>
    );
}
