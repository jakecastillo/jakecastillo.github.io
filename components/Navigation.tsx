"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";
import Link from "next/link";
import { ChevronsDown } from "lucide-react";
import { navSections } from "@/data/sections";
import { useScrollStore } from "@/hooks/useScrollStore";
import { selectExpPinned, useActStore } from "@/hooks/useActStore";

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
        const query = window.matchMedia(
            "(pointer: fine) and (hover: hover) and (min-width: 768px)"
        );
        const update = () => setFinePointer(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    return finePointer && !prefersReducedMotion;
}

/**
 * The id of the section currently dominating the viewport, used to highlight the
 * matching dock button. Reads the SAME activeActId that StageManager's single
 * IntersectionObserver writes (shared via useActStore) — the second, duplicate
 * observer that used to run here was removed (jc-g2l) to halve the per-boundary
 * observer + setState work. Deep-link / back-forward immediacy is preserved:
 * StageManager seeds activeActId from the URL hash on mount and on
 * hashchange/popstate. Every act id (home/about/exp/skills/contact) is also a
 * dock id, so the value maps 1:1 onto the buttons.
 */
function useActiveSection() {
    return useActStore((s) => s.activeActId);
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
    // Latest pointer position + the pending rAF id, so many mousemove events
    // between two frames coalesce into ONE transform write per frame.
    const pointer = useRef({ x: 0, y: 0 });
    const frame = useRef<number | null>(null);

    // One-shot press ring (jc-16m): a violet ring pings out from the pressed
    // chip on every activation (tap OR click — not fine-pointer-gated like the
    // magnetic pull, since touch users get it too). `pulseId` increments per
    // press; changing the key remounts the ring so framer replays initial→animate
    // from scratch on every press, and `onAnimationComplete` unmounts it again so
    // no stale ring nodes accumulate. Reduced-motion never increments the id, so
    // the ring never mounts — only the existing active-state change survives.
    const prefersReducedMotion = useReducedMotion();
    const [pulseId, setPulseId] = useState(0);

    // Motion values update the transform OFF the React render path (no re-render
    // of this fixed dock per mousemove). Springs add the heavy/premium glide.
    const mvX = useMotionValue(0);
    const mvY = useMotionValue(0);
    const x = useSpring(mvX, { stiffness: 150, damping: 20, mass: 0.1 });
    const y = useSpring(mvY, { stiffness: 150, damping: 20, mass: 0.1 });
    // Icon leads the chip slightly (parallax) → tactile sense of mass. Total
    // icon travel = chip + 0.4·chip = 1.4·chip, which the MAX cap keeps in the
    // 4–6px band.
    const iconX = useTransform(x, (v) => v * 0.4);
    const iconY = useTransform(y, (v) => v * 0.4);

    // rAF-throttled magnetic pull. PULL is the follow ratio; MAX hard-caps the
    // chip lean so the effect stays a subtle few px toward the cursor
    // REGARDLESS of chip width — the active chip is far wider than the 44px icon
    // buttons, so an uncapped 0.18 ratio would overshoot toward ~10px on it.
    const applyPull = () => {
        frame.current = null;
        const r = rect.current;
        if (!r) return;
        const PULL = 0.18;
        const MAX = 4;
        const clamp = (v: number) => (v < -MAX ? -MAX : v > MAX ? MAX : v);
        mvX.set(clamp((pointer.current.x - (r.left + r.width / 2)) * PULL));
        mvY.set(clamp((pointer.current.y - (r.top + r.height / 2)) * PULL));
    };

    // Read the bounding rect ONCE on enter (not per move) to avoid layout thrash.
    const handleEnter = () => {
        if (enableMotion && ref.current) rect.current = ref.current.getBoundingClientRect();
    };
    const handleMove = (e: React.MouseEvent) => {
        if (!enableMotion || !rect.current) return;
        pointer.current.x = e.clientX;
        pointer.current.y = e.clientY;
        if (frame.current === null) frame.current = requestAnimationFrame(applyPull);
    };
    const reset = () => {
        if (frame.current !== null) {
            cancelAnimationFrame(frame.current);
            frame.current = null;
        }
        mvX.set(0);
        mvY.set(0);
    };

    // Cancel any pending frame on unmount; and if motion becomes disabled
    // (pointer went coarse / reduced-motion toggled on) settle the chip back to
    // the static 0,0 end state so nothing is left leaning.
    useEffect(() => {
        if (!enableMotion) {
            if (frame.current !== null) {
                cancelAnimationFrame(frame.current);
                frame.current = null;
            }
            mvX.set(0);
            mvY.set(0);
        }
        return () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current);
        };
    }, [enableMotion, mvX, mvY]);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!prefersReducedMotion) setPulseId((id) => id + 1);
        onClick?.(event);
    };

    return (
        <motion.div style={{ x, y }} className="group relative">
            {/* Tooltip — visible on hover AND keyboard focus for discoverability.
                Rides the shared 200ms/--ease-beam transition default (jc-nc1):
                one timing grammar with the rest of the chrome. */}
            <span
                role="tooltip"
                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-surface-overlay px-2.5 py-1 text-xs font-medium leading-none tracking-wide text-foreground opacity-0 translate-y-1 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_8px_24px_-18px_rgba(0,0,0,0.5)] transition-all group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 coarse:hidden"
            >
                {label}
            </span>

            <Link
                ref={ref}
                href={href}
                onClick={handleClick}
                onMouseEnter={handleEnter}
                onMouseMove={handleMove}
                onMouseLeave={reset}
                aria-current={isActive ? "page" : undefined}
                // coarse: overrides restack the chip icon-over-label (jc-2cx) —
                // every dock item (not just the active one) gets a legible touch
                // label, since coarse pointers never see the hover tooltip above.
                // The chip grows past the 44px floor rather than clipping the
                // label; min-h/min-w keep the touch target itself never shrinking
                // under 44px.
                className={`relative flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-full transition-colors active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:bg-surface-overlay coarse:h-auto coarse:flex-col coarse:justify-center coarse:gap-0.5 coarse:py-1.5 ${
                    isActive
                        ? "bg-primary-muted px-3 text-primary hover:bg-primary-muted lg:px-4 coarse:px-2"
                        : "w-11 min-w-[44px] text-muted-foreground hover:text-primary coarse:w-auto coarse:min-w-[44px] coarse:px-2"
                }`}
            >
                <motion.span style={{ x: iconX, y: iconY }} className="inline-flex">
                    {children}
                </motion.span>
                {/* Single label span = the link's accessible name. Visually hidden
                    except on the ACTIVE item on desktop (lg+), where it surfaces as
                    the dock's inline leading text segment. Touch gets its OWN
                    always-visible micro-label below (next span) instead of this one,
                    since flex-row inline text doesn't fit the icon-over-label coarse
                    layout. The visible text always matches the accessible name
                    (WCAG 2.5.3). */}
                <span
                    className={
                        isActive
                            ? "sr-only whitespace-nowrap text-sm font-medium lg:not-sr-only"
                            : "sr-only"
                    }
                >
                    {label}
                </span>
                {/* Touch micro-label (jc-2cx): every chip, active or not, gets a
                    tiny mono caption under the icon on coarse pointers — decorative
                    only (the span above already carries the accessible name), so
                    this one is aria-hidden to avoid double-announcing to AT. */}
                <span
                    aria-hidden="true"
                    className="hidden whitespace-nowrap text-[9px] font-mono uppercase leading-none tracking-[0.04em] text-current coarse:block"
                >
                    {label}
                </span>
                {/* Active indicator dot beneath the icon. Coarse drops it — the
                    tinted chip + colored micro-label above already carry the active
                    state there, so a second dot under the label would just be
                    visual noise stacked below the text. */}
                <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary transition-opacity coarse:hidden ${
                        isActive ? "opacity-100" : "opacity-0"
                    }`}
                />
                {/* One-shot press ring (jc-16m): pings violet from the pressed chip.
                    AnimatePresence removes it again once the animation completes, so
                    presses never accumulate stale nodes. */}
                <AnimatePresence>
                    {pulseId > 0 && (
                        <motion.span
                            key={pulseId}
                            aria-hidden="true"
                            initial={{ scale: 0.7, opacity: 0.6 }}
                            animate={{ scale: 1.7, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            onAnimationComplete={() => setPulseId(0)}
                            className="pointer-events-none absolute inset-0 rounded-full border-2 border-[color:var(--primary)]"
                        />
                    )}
                </AnimatePresence>
            </Link>
        </motion.div>
    );
}

export default function Navigation() {
    const lenis = useScrollStore((state) => state.lenis);
    const enableMotion = useEnableMotion();
    const activeId = useActiveSection();
    // While the Experience act is pinned + scrubbed, the dock shares the
    // bottom-center lane with the act's own progress row. Yield: slide down +
    // fade so the progress bar / hot head own that lane, then breathe back in.
    const pinned = useActStore(selectExpPinned);

    // Escape hatch (jc-42a): the pin runs the Experience act for ~300vh with
    // the dock yielded, so a visitor who wants OUT has no wayfinding for the
    // whole scrub. The next act in nav order (not hardcoded — reads the same
    // navSections list the dock renders) gets a standing skip affordance that
    // lives ONLY while pinned, in the top-right corner: clear of the pin's own
    // bottom-center progress row (the exact collision the dock's own yield was
    // built to avoid), so nothing new re-introduces it.
    const nextSection = useMemo(() => {
        const expIndex = navSections.findIndex((s) => s.id === "exp");
        return expIndex === -1 ? undefined : navSections[expIndex + 1];
    }, []);

    const handleNavClick =
        (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
            if (!href.startsWith("#")) return;
            const targetId = href.slice(1);
            const target = document.getElementById(targetId);
            if (!target) return;

            event.preventDefault();
            if (lenis) {
                // Distance-scaled duration: a fixed 0.9s warp teleport-blurs
                // through everything on long jumps (top → contact peaked at
                // ~42k px/s). Scale time with distance so near jumps stay
                // snappy and far jumps read as a deliberate flight, sharing the
                // same exp easing as the wheel so nothing fights the raf loop.
                const distance = Math.abs(target.getBoundingClientRect().top);
                lenis.scrollTo(target, {
                    offset: -8,
                    duration: Math.min(2.2, 0.9 + distance / 4500),
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                });
            } else {
                // No Lenis: either reduced-motion (jump instantly, matching the
                // disabled-smoothing parity) or Lenis hasn't idle-initialised yet
                // (a brief smooth native scroll is fine).
                const reduce = window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches;
                target.scrollIntoView({
                    behavior: reduce ? "auto" : "smooth",
                    block: "start",
                });
            }
            window.history.replaceState(null, "", href);
        };

    return (
        <>
        {/* De-gated from the boot sequence: the dock mounts immediately and
            fades/lifts in on its own, so navigation is available before (and
            independent of) the terminal boot animation finishing. */}
        <motion.nav
            aria-label="Primary"
            // React 19 `inert` fully removes the yielded dock from pointer + tab
            // + a11y trees, so it can't catch clicks meant for the pinned act or
            // trap keyboard focus behind an invisible chrome layer.
            inert={pinned ? true : undefined}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: pinned ? 0 : 1, y: pinned ? 28 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] ${
                pinned ? "pointer-events-none" : "pointer-events-auto"
            }`}
        >
            {/* The current section is surfaced as the ACTIVE dock item's inline
                label (visible on touch + desktop), so no separate chip floats
                over page content — taps above the dock reach the content behind. */}
            <ul className="flex items-center gap-1.5 rounded-full border border-border bg-surface-overlay/80 px-3 py-2 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_18px_48px_-28px_rgba(0,0,0,0.55),0_0_60px_-30px_rgba(139,92,246,0.25)] backdrop-blur-xl sm:gap-2 sm:px-4">
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
                                // Shared hover micro-language (jc-rdm): a quiet
                                // lift + faint grow that warms with the button's
                                // existing hover:text-primary. Lives on the icon
                                // (not the magnetic wrapper) so it rides its own
                                // `translate`/`scale` props while framer keeps the
                                // parallax on the parent's `transform` — the two
                                // compose natively in Tailwind v4, never fight.
                                // motion-safe-gated so reduced motion drops the
                                // travel entirely and only the color warms.
                                className="origin-center transition-transform motion-safe:group-hover:-translate-y-px motion-safe:group-hover:scale-[1.06]"
                            />
                        </MagneticButton>
                    </li>
                ))}
            </ul>
        </motion.nav>

        {nextSection && (
            <motion.div
                // Inverse of the dock's inert/pointer-events swap above: this
                // affordance is a no-op (and out of the tab order) except
                // during the exact window it exists for.
                inert={pinned ? undefined : true}
                initial={false}
                animate={{ opacity: pinned ? 1 : 0, scale: pinned ? 1 : 0.85 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed right-5 top-5 z-40 ${
                    pinned ? "pointer-events-auto" : "pointer-events-none"
                }`}
            >
                <Link
                    href={`#${nextSection.id}`}
                    onClick={handleNavClick(`#${nextSection.id}`)}
                    aria-label={`Skip to ${nextSection.navLabel}`}
                    tabIndex={pinned ? 0 : -1}
                    className="group relative flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full border border-border bg-surface-overlay/80 text-muted-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_18px_48px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-colors hover:bg-surface-overlay hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.92]"
                >
                    <span
                        role="tooltip"
                        className="pointer-events-none absolute -bottom-9 right-0 whitespace-nowrap rounded-full border border-border bg-surface-overlay px-2.5 py-1 text-xs font-medium leading-none tracking-wide text-foreground opacity-0 translate-y-[-4px] shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_8px_24px_-18px_rgba(0,0,0,0.5)] transition-all group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 coarse:hidden"
                    >
                        Skip to {nextSection.navLabel}
                    </span>
                    <ChevronsDown
                        size={18}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="origin-center transition-transform motion-safe:group-hover:translate-y-px motion-safe:group-hover:scale-[1.06]"
                    />
                </Link>
            </motion.div>
        )}
        </>
    );
}
