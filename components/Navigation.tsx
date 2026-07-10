"use client";

import { useEffect, useRef, useState } from "react";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";
import Link from "next/link";
import { navSections, sections } from "@/data/sections";
import { useScrollStore } from "@/hooks/useScrollStore";

// All section ids we observe to determine what's in view. Every section is now
// a dock item (home, about, exp, skills, contact), so the active-section
// highlight must resolve correctly for all five ids — including "skills".
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

    // Deep-link / back-forward arrival: bind the highlight straight to the URL
    // hash so a cold-load of /#skills (or a browser back to a hash) lights the
    // matching dock item immediately, instead of leaving a stale "home"/wrong
    // section lit until the observer catches up. The observer below refines it
    // as the user scrolls.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const syncFromHash = () => {
            const id = window.location.hash.slice(1);
            if (id && observedIds.includes(id)) setActiveId(id);
        };
        syncFromHash();
        window.addEventListener("hashchange", syncFromHash);
        window.addEventListener("popstate", syncFromHash);
        return () => {
            window.removeEventListener("hashchange", syncFromHash);
            window.removeEventListener("popstate", syncFromHash);
        };
    }, []);

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
    const rect = useRef<DOMRect | null>(null);

    // Motion values update the transform OFF the React render path (no re-render
    // of this fixed dock per mousemove). Springs add the heavy/premium glide.
    const mvX = useMotionValue(0);
    const mvY = useMotionValue(0);
    const x = useSpring(mvX, { stiffness: 150, damping: 20, mass: 0.1 });
    const y = useSpring(mvY, { stiffness: 150, damping: 20, mass: 0.1 });
    // Icon lags the chip slightly → tactile sense of mass.
    const iconX = useTransform(x, (v) => v * 0.4);
    const iconY = useTransform(y, (v) => v * 0.4);

    // Read the bounding rect ONCE on enter (not per move) to avoid layout thrash.
    const handleEnter = () => {
        if (enableMotion && ref.current) rect.current = ref.current.getBoundingClientRect();
    };
    const handleMove = (e: React.MouseEvent) => {
        if (!enableMotion || !rect.current) return;
        const r = rect.current;
        mvX.set((e.clientX - (r.left + r.width / 2)) * 0.18);
        mvY.set((e.clientY - (r.top + r.height / 2)) * 0.18);
    };
    const reset = () => {
        mvX.set(0);
        mvY.set(0);
    };

    return (
        <motion.div style={{ x, y }} className="group relative">
            {/* Tooltip — visible on hover AND keyboard focus for discoverability.
                The label/indicator swap is intentionally asymmetric: the resting
                (exit) state carries a shorter duration (120ms) than the
                hover/focus (enter) state (180ms), so it leaves slightly faster
                than it arrives. */}
            <span
                role="tooltip"
                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-overlay px-2.5 py-1 text-xs font-medium leading-none tracking-wide text-foreground opacity-0 translate-y-1 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_8px_24px_-18px_rgba(0,0,0,0.5)] transition-all duration-[120ms] ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:duration-[180ms] group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:duration-[180ms] coarse:hidden"
            >
                {label}
            </span>

            <Link
                ref={ref}
                href={href}
                onClick={onClick}
                onMouseEnter={handleEnter}
                onMouseMove={handleMove}
                onMouseLeave={reset}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-full transition-colors ease-out active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:bg-surface-overlay ${
                    isActive
                        ? "bg-primary-muted px-3 text-primary duration-200 hover:bg-primary-muted lg:px-4"
                        : "w-11 min-w-[44px] text-muted-foreground duration-[140ms] hover:text-primary"
                }`}
            >
                <motion.span style={{ x: iconX, y: iconY }} className="inline-flex">
                    {children}
                </motion.span>
                {/* Single label span = the link's accessible name. Visually hidden
                    except on the ACTIVE item, where it surfaces as the dock's
                    leading text segment on touch (coarse pointers, which never see
                    the hover tooltip) and on desktop (lg+). The visible text always
                    matches the accessible name (WCAG 2.5.3). */}
                <span
                    className={
                        isActive
                            ? "sr-only whitespace-nowrap text-sm font-medium coarse:not-sr-only lg:not-sr-only"
                            : "sr-only"
                    }
                >
                    {label}
                </span>
                {/* Active indicator dot beneath the icon. */}
                <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary transition-opacity ease-out ${
                        isActive
                            ? "opacity-100 duration-200"
                            : "opacity-0 duration-[140ms]"
                    }`}
                />
            </Link>
        </motion.div>
    );
}

export default function Navigation() {
    const lenis = useScrollStore((state) => state.lenis);
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
        // De-gated from the boot sequence: the dock mounts immediately and
        // fades/lifts in on its own, so navigation is available before (and
        // independent of) the terminal boot animation finishing.
        <motion.nav
            aria-label="Primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]"
        >
            {/* The current section is surfaced as the ACTIVE dock item's inline
                label (visible on touch + desktop), so no separate chip floats
                over page content — taps above the dock reach the content behind. */}
            <ul className="flex items-center gap-1.5 rounded-full border border-border bg-surface-overlay/70 px-3 py-2 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_18px_48px_-28px_rgba(0,0,0,0.55),0_0_60px_-30px_rgba(139,92,246,0.25)] backdrop-blur-xl sm:gap-2 sm:px-4">
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
    );
}
