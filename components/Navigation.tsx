"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { navSections, sections } from "@/data/sections";
import { useScrollStore } from "@/hooks/useScrollStore";
import { useBootStore } from "@/store/useBootStore";

// All section ids we observe to determine what's in view (includes "skills",
// which has no nav button but should not falsely keep "exp" active).
const observedIds = sections.map((section) => section.id);

/**
 * Tracks whether the device is a fine-pointer (e.g. mouse) device that is not
 * requesting reduced motion. Magnetic / scale flourishes are gated behind this
 * so touch + coarse-pointer + reduced-motion users get a calm, static dock.
 */
function useEnableMotion() {
    const prefersReducedMotion = useReducedMotion();
    const [finePointer, setFinePointer] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const query = window.matchMedia("(pointer: fine) and (hover: hover)");
        const update = () => setFinePointer(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    return finePointer && !prefersReducedMotion;
}

/**
 * Observes the section elements and reports the id of the section currently
 * dominating the viewport, so the dock can highlight the matching button.
 */
function useActiveSection() {
    const [activeId, setActiveId] = useState<string>(observedIds[0] ?? "home");

    useEffect(() => {
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
            return;
        }

        const visibility = new Map<string, number>();
        const elements = observedIds
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);

        if (elements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    visibility.set(
                        entry.target.id,
                        entry.isIntersecting ? entry.intersectionRatio : 0
                    );
                });

                let bestId = "";
                let bestRatio = 0;
                visibility.forEach((ratio, id) => {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestId = id;
                    }
                });

                if (bestId && bestRatio > 0) {
                    setActiveId(bestId);
                }
            },
            {
                // Bias toward the middle band of the viewport so the active
                // section flips as a section crosses center, not its edge.
                rootMargin: "-35% 0px -35% 0px",
                threshold: [0, 0.25, 0.5, 0.75, 1],
            }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return activeId;
}

function MagneticButton({
    children,
    label,
    href,
    isActive,
    enableMotion,
    onClick,
}: {
    children: React.ReactNode;
    label: string;
    href: string;
    isActive: boolean;
    enableMotion: boolean;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
    const ref = useRef<HTMLAnchorElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent) => {
        if (!enableMotion || !ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.1, y: middleY * 0.1 }); // Magnetic strength
    };

    const reset = () => setPosition({ x: 0, y: 0 });

    // Only drive the spring transform when motion is enabled; otherwise stay put.
    const { x, y } = enableMotion ? position : { x: 0, y: 0 };

    return (
        <motion.div
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className="group relative"
        >
            {/* Tooltip — visible on hover AND keyboard focus for discoverability. */}
            <span
                role="tooltip"
                className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-overlay px-2.5 py-1 text-xs font-medium text-foreground opacity-0 translate-y-1 shadow-md transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
            >
                {label}
            </span>

            <Link
                ref={ref}
                href={href}
                onClick={onClick}
                onMouseMove={handleMouse}
                onMouseLeave={reset}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:bg-white/10 ${
                    isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                }`}
            >
                {children}
                {/* Active indicator dot beneath the icon. */}
                <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary transition-opacity duration-200 ${
                        isActive ? "opacity-100" : "opacity-0"
                    }`}
                />
                <span className="sr-only">{label}</span>
            </Link>
        </motion.div>
    );
}

export default function Navigation() {
    const lenis = useScrollStore((state) => state.lenis);
    const isBootComplete = useBootStore((state) => state.isBootComplete);
    const prefersReducedMotion = useReducedMotion();
    const enableMotion = useEnableMotion();
    const activeId = useActiveSection();

    const handleNavClick =
        (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
            if (!href.startsWith("#")) return;
            const targetId = href.slice(1);
            const target = document.getElementById(targetId);
            if (!target) return;

            event.preventDefault();
            if (lenis) {
                lenis.scrollTo(target, { offset: -8 });
            } else {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            window.history.replaceState(null, "", href);
        };

    return (
        <AnimatePresence>
            {isBootComplete && (
                <motion.nav
                    aria-label="Primary"
                    initial={
                        prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: 20 }
                    }
                    animate={
                        prefersReducedMotion
                            ? { opacity: 1 }
                            : { opacity: 1, y: 0 }
                    }
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.5,
                        delay: 0.4,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="pointer-events-auto fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
                >
                    <ul className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
                        {navSections.map((section) => (
                            <li key={section.id}>
                                <MagneticButton
                                    href={`#${section.id}`}
                                    label={section.navLabel}
                                    isActive={activeId === section.id}
                                    enableMotion={enableMotion}
                                    onClick={handleNavClick(`#${section.id}`)}
                                >
                                    <section.icon
                                        size={20}
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />
                                </MagneticButton>
                            </li>
                        ))}
                    </ul>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
