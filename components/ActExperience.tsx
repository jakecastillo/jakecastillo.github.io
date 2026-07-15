"use client";

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AnimatePresence,
    motion,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useTransform,
    type Variants,
} from "framer-motion";
import { resumeData, type Job } from "@/data/resume";
import { sections } from "@/data/sections";
import { DUR, EASE, fadeRight, staggerContainer } from "@/components/motion";
import EtchHeading from "@/components/beam/EtchHeading";
import { useReveal } from "@/hooks/useReveal";
import { selectExpPinned, useActStore } from "@/hooks/useActStore";
import { useScrollStore } from "@/hooks/useScrollStore";
import { ArrowDown, ArrowRight } from "lucide-react";

// Orchestrated reveal for the static list. `show` is the normal staggered
// entrance; `instant` is the arrival-snap / reduced-motion path — useReveal's
// orchestrate mode animates to the `instant` label, and BOTH levels must
// resolve it with zero-duration transitions, otherwise the children would
// still play their 0.45s variant fades (MotionProvider's reducedMotion="user"
// strips transforms, NOT opacity).
const listVariants: Variants = {
    ...staggerContainer,
    instant: { transition: { staggerChildren: 0, delayChildren: 0 } },
};

const itemVariants: Variants = {
    ...fadeRight,
    instant: { opacity: 1, x: 0, transition: { duration: 0 } },
};

// Run the upgrade before paint on the client so there's no static→immersive
// flash; fall back to useEffect on the server (no-op) to avoid the SSR warning.
const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Whether the immersive horizontal-scroll experience should run. Gated behind a
 * fine-pointer (mouse) device that is NOT requesting reduced motion, so touch /
 * coarse-pointer / reduced-motion users get the calm static vertical timeline.
 *
 * The `(min-width: 768px)` floor (jc-nwg) is load-bearing: card widths
 * (`w-[82vw]`) and TRACK_TRAVEL are tuned for desktop travel, so a narrow
 * fine-pointer window — a resized desktop browser, DevTools emulation, an
 * iPad + trackpad in Split View — otherwise mounted the pin at ~390px and
 * sheared cards off both viewport edges. The listener re-evaluates on `change`
 * so live resizing degrades gracefully into the composed StaticTimeline.
 *
 * Starts `false` so SSR/first paint matches the safe vertical fallback, then
 * upgrades on mount when appropriate.
 */
function useImmersive() {
    const prefersReducedMotion = useReducedMotion();
    const [canPin, setCanPin] = useState(false);

    useIsoLayoutEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const query = window.matchMedia(
            "(pointer: fine) and (hover: hover) and (min-width: 768px)",
        );
        const update = () => setCanPin(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    return canPin && !prefersReducedMotion;
}

// Act-opener poster lockup (jc-2np). Every other act enters on a giant
// type-display lockup; the Experience act previously entered on a lone
// "03 — WORK" chip floating in a near-empty field before the pin. This gives
// the act its display-tier title card in the SAME act-opener grammar as THE
// STACK — EtchHeading is the single owner of the reveal/etch sweep AND the
// reduced-motion path (heading just is), so no framer whileInView wrap. It
// renders in BOTH variants and, in the immersive case, plays in the pre-pin
// flow (outside the pinned section's useScroll target) so the pin math is
// untouched — see ImmersiveTimeline. Serves as the act's visible <h2>, so the
// old sr-only "Experience" heading retires in both variants.
function ActOpener() {
    return (
        <EtchHeading
            as="h2"
            className="type-display text-7xl text-foreground sm:text-8xl"
            eyebrow="work"
            eyebrowClassName="text-xs label-accent mb-4"
        >
            THE
            <br />
            <span className="text-primary">WORK.</span>
        </EtchHeading>
    );
}

export default function ActExperience() {
    const immersive = useImmersive();
    const total = resumeData.experience.length;

    // useScroll lives ONLY inside <ImmersiveTimeline/>, so it never runs while
    // its target ref is unmounted — that mismatch is what made framer-motion
    // throw "Target ref is defined but not hydrated".
    return immersive ? (
        <ImmersiveTimeline total={total} />
    ) : (
        <StaticTimeline total={total} />
    );
}

// Reduced-motion / touch / coarse-pointer: a static, vertical case-study list —
// no pin, no horizontal transform, no useScroll, opacity-only reveals.
function StaticTimeline({ total }: { total: number }) {
    const list = useReveal<HTMLOListElement>({ orchestrate: true });
    const reduced = useReducedMotion();

    // Drive the NN / TT counter off the timeline itself (jc-2fo): a mid-viewport
    // IntersectionObserver over the four <li> nodes updates the numeral as each
    // role crosses center — the same in-view trigger the act's beam-node ignite
    // already uses. A hard-coded "01" next to a live-looking fraction read as a
    // broken instrument, so the fraction now moves with the reading position.
    const sectionRef = useRef<HTMLElement>(null);
    const [activeStatic, setActiveStatic] = useState(0);
    useEffect(() => {
        const root = sectionRef.current;
        if (!root || typeof IntersectionObserver === "undefined") return;
        const nodes = Array.from(
            root.querySelectorAll<HTMLElement>("[data-static-index]"),
        );
        if (nodes.length === 0) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const idx = Number(
                        (entry.target as HTMLElement).dataset.staticIndex,
                    );
                    setActiveStatic((prev) => (prev === idx ? prev : idx));
                }
            },
            // Thin band at mid-viewport: whichever role crosses the center
            // owns the counter (matches the reading focus, not the fold edge).
            { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
        );
        nodes.forEach((node) => io.observe(node));
        return () => io.disconnect();
    }, []);

    return (
        // Mobile bottom padding compressed (jc-7am): the 8rem+safe reservation
        // (kept for md+ where the pinned/dock lane needs it) left a near-empty
        // band between the last role and THE STACK on a 390px column. Halve it
        // below md so the approach to the next act reads as one composed move,
        // not a scroll through void. md+ keeps the original reservation verbatim.
        <section ref={sectionRef} className="section-y container-page [padding-bottom:calc(4rem+env(safe-area-inset-bottom))] md:[padding-bottom:calc(8rem+env(safe-area-inset-bottom))]">
            {/* Display-tier opener (jc-2np): the calm static/reduced variant now
                enters on the same poster lockup as the immersive one, so Act 3
                reads with the act-opener grammar of every other act rather than
                a bare roles counter. It is the section's visible <h2>. */}
            <div className="mb-16">
                <ActOpener />
            </div>
            {/* Act-opener composed lockup (jc-7am). Below md the single left mono
                line stranded the opening frame — a full viewport of grid + a stray
                label. Recompose the SAME tokens (01 / 04 ROLES) into a centered
                lockup that the vertical beam center-snake (cx ≈ vw/2) threads, led
                by a beam node that ignites as the act enters so the long
                spine→prism travel is authored, not blank. Reduced motion renders
                the node already lit (no travel). md+ keeps the original left mono
                line verbatim, so nothing shifts at md and up. */}
            <div className="mb-12 flex flex-col items-center gap-3 text-center md:hidden">
                <motion.span
                    aria-hidden="true"
                    initial={reduced ? false : { opacity: 0.25, scale: 0.5 }}
                    whileInView={reduced ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: false, amount: 0.8 }}
                    transition={{ duration: DUR.base, ease: EASE }}
                    className="h-2.5 w-2.5 rounded-full bg-primary glow-primary"
                />
                <div className="flex items-baseline gap-2 font-mono tabular-nums">
                    <span className="relative inline-block text-3xl font-bold text-foreground">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.span
                                key={activeStatic}
                                initial={reduced ? false : { opacity: 0.4, textShadow: "0 0 12px rgba(139,92,246,0.9)" }}
                                animate={{ opacity: 1, textShadow: "0 0 0px rgba(139,92,246,0)" }}
                                transition={{ duration: DUR.base, ease: EASE }}
                                className="inline-block"
                            >
                                {format(activeStatic + 1)}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                    <span className="text-xl font-light text-subtle-foreground">/</span>
                    <span className="text-3xl font-bold text-subtle-foreground">{format(total)}</span>
                </div>
                <span className="text-xs label">
                    ROLES
                </span>
            </div>
            <p className="mb-12 hidden text-xs label md:block">
                {format(activeStatic + 1)} <span className="text-subtle-foreground">/ {format(total)} ROLES</span>
            </p>
            <motion.ol
                variants={listVariants}
                {...list}
                className="relative flex flex-col gap-16 pl-8 sm:pl-10"
            >
                <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 bottom-0 w-px bg-border-subtle" />
                <motion.span
                    aria-hidden="true"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: DUR.slow, ease: EASE }}
                    className="pointer-events-none absolute left-0 top-0 bottom-0 w-px origin-top bg-primary glow-primary"
                />
                {resumeData.experience.map((job, index) => (
                    <motion.li key={index} data-static-index={index} variants={itemVariants}>
                        <TimelineNode job={job} index={index} variant="vertical" />
                    </motion.li>
                ))}
            </motion.ol>
        </section>
    );
}

// Fraction of the strip's own width translated across the pinned scrub. Sized
// so the LAST case-study card settles dead-center at progress 1 — the old 0.70
// over-scrolled the final card off-screen-left and left a near-empty stage as
// the "final scrub frame" (jc-7e2). The keyboard focus-rescue inverse below
// reuses this exact fraction, so the two can never drift apart.
const TRACK_TRAVEL = 0.56;

// Act eyebrow, sourced from the SAME canonical namespace the stage rail / dock /
// boot log read (one namespace everywhere). Hardcoding a literal would fork that
// namespace and — because the Experience act is stageLabel "03" / stageTitle
// "work" — visibly contradict the rail's own "03 work" on the same screen.
const EXP_SECTION = sections.find((s) => s.id === "exp");
const ACT_EYEBROW =
    EXP_SECTION?.stageLabel && EXP_SECTION?.stageTitle
        ? `${EXP_SECTION.stageLabel} — ${EXP_SECTION.stageTitle.toUpperCase()}`
        : "WORK";

// Piecewise scrub map for the pin (jc-nwg): the flagship act was a
// constant-velocity conveyor — one linear progress→x with no card ever at rest,
// producing "sliced-card sandwich" mid-frames. Replace it with a plateau map
// that eases card-to-card and HOLDS at each card's centered position, so every
// role gets an authored dwell beat.
//
// Built generically from `total` (the card-content owner may re-shape the
// experience array; this must not assume a fixed count). The dwell:travel
// ratio r=0.42 is tuned so N=4 reproduces the approved
// [0,.19,.27,.46,.54,.73,.81,1] → [x0,x1,x1,x2,x2,x3,x3,x3] pattern: each of the
// N-1 transitions is a `travel` ramp followed by a `dwell` hold, and the final
// card holds through progress 1 (so it is still composed when the pin releases —
// no dead ride-out on an empty stage). `centers[i]` is the progress that centers
// card i, reused by the tick buttons and the keyboard focus-rescue so wayfinding
// and tabbing land on the same resolved frames the scrub rests on.
function buildDwellMap(total: number) {
    const trackPct = TRACK_TRAVEL * 100;
    const xAt = (i: number) =>
        total > 1 ? `-${((trackPct * i) / (total - 1)).toFixed(4)}%` : "0%";
    if (total <= 1) {
        return { xInput: [0, 1], xOutput: ["0%", "0%"], centers: [0] };
    }
    const r = 0.42;
    const travel = 1 / (total + r * (total - 1));
    const dwell = r * travel;
    const xInput: number[] = [0];
    const xOutput: string[] = [xAt(0)];
    const centers: number[] = [0];
    let p = 0;
    for (let k = 1; k < total; k++) {
        p += travel;
        xInput.push(p);
        xOutput.push(xAt(k));
        const dwellStart = p;
        p += dwell;
        xInput.push(p);
        xOutput.push(xAt(k));
        centers.push((dwellStart + p) / 2);
    }
    xInput.push(1);
    xOutput.push(xAt(total - 1));
    return { xInput, xOutput, centers };
}

// Fine-pointer + normal-motion: the pinned horizontal timeline. Always renders
// its ref'd <section>, so useScroll has a hydrated target.
function ImmersiveTimeline({ total }: { total: number }) {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: targetRef });

    const { xInput, xOutput, centers } = useMemo(
        () => buildDwellMap(total),
        [total],
    );
    const x = useTransform(scrollYProgress, xInput, xOutput);

    // Authored exit (jc-nwg). The cyan hot-head is NOT a standing element — cyan
    // is the site's rare "answer" signal, never ambient — so it stays dark
    // through the whole scrub and IGNITES only in the last ~10% of progress,
    // where it detaches from the rail tip and accelerates off the right edge:
    // the beam leaving THIS act for the prism. The sticky div's overflow-hidden
    // clips its departure. No standing accent = grammar restored; a moving head
    // = the release is authored, not a dead fade.
    const headOpacity = useTransform(
        scrollYProgress,
        [0.87, 0.92, 1],
        [0, 1, 1],
    );
    const headLeft = useTransform(
        scrollYProgress,
        [0.9, 0.94, 0.97, 1],
        ["100%", "108%", "122%", "158%"],
    );

    // Progress-chrome handoff (jc-7e2). The SCROLL TO EXPLORE / NN·TT rail lives
    // at the bottom of the h-screen sticky div, so once the pin RELEASES it
    // rides the whole viewport upward and strands itself at the top over the
    // incoming STACK act. Fade IN only after the pin engages (progress clamps at
    // 0 through the approach, so opacity stays 0), hold composed for essentially
    // the whole scrub, then fade out only in the final sliver — the hot-head's
    // off-right departure (above), not a whole-chrome retreat, is now the exit
    // gesture, and the persistent act lockup + dwelled final card keep the frame
    // composed to the very end (no more emptiest-frame finale, jc-d5d). Progress
    // clamps past 1, so opacity holds at 0 for the entire unpin.
    const chromeOpacity = useTransform(
        scrollYProgress,
        [0, 0.05, 0.96, 1],
        [0, 1, 1, 0],
    );
    // Keep the now-interactive rail (tick buttons) out of the tab order and
    // pointer path while the chrome is faded out (approach + unpin), so a
    // keyboard user can never land focus on an invisible control.
    const chromeVisibility = useTransform(chromeOpacity, (o) =>
        o < 0.02 ? "hidden" : "visible",
    );

    // Announce to the chrome-yield choreography (dock / act rail / brand
    // wordmark) that the PINNED experience is live, so fixed chrome can slide
    // out of the collision zone while this act is scrubbed. Cleared on unmount
    // so the calm static fallback never triggers the auto-hide.
    const setExpImmersive = useActStore((s) => s.setExpImmersive);
    useEffect(() => {
        setExpImmersive(true);
        return () => setExpImmersive(false);
    }, [setExpImmersive]);

    // Promote the x-translated track to its own compositor layer ONLY while the
    // pin is engaged and scrubbed (selectExpPinned), then release the hint so a
    // standing will-change doesn't hold GPU memory once the act scrolls away
    // (jc-g2l).
    const pinned = useActStore(selectExpPinned);

    // Map scroll progress → active node index for the counter, the ghost numeral
    // and the active tick. The plateau map holds each card centered at
    // `centers[i]`, so the active card is the one whose dwell center is nearest —
    // the numeral crossfades mid-travel between plateaus, not at a fixed
    // round-off that could flip inside a dwell.
    const [active, setActive] = useState(0);
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < centers.length; i++) {
            const d = Math.abs(latest - centers[i]);
            if (d < bestDist) {
                bestDist = d;
                best = i;
            }
        }
        setActive((prev) => (prev === best ? prev : best));
    });

    // Jump the pin to the scroll position that centers a given progress. Shared
    // by the rail tick buttons (smooth) and the keyboard focus-rescue
    // (immediate) so the two wayfinding paths can never drift from the scrub's
    // own dwell math.
    const lenis = useScrollStore((state) => state.lenis);
    const scrollToProgress = useCallback(
        (progress: number, immediate: boolean) => {
            const section = targetRef.current;
            if (!section) return;
            const current = lenis ? lenis.scroll : window.scrollY;
            const absTop = section.getBoundingClientRect().top + current;
            const scrollable = Math.max(
                1,
                section.offsetHeight - window.innerHeight,
            );
            const clamped = Math.min(1, Math.max(0, progress));
            const y = absTop + clamped * scrollable;
            if (lenis) {
                lenis.scrollTo(y, immediate ? { immediate: true } : undefined);
            } else {
                window.scrollTo(0, y);
            }
        },
        [lenis],
    );

    // Keyboard focus rescue. In the pin a card's on-screen X is driven by
    // vertical scroll, so tabbing to an off-viewport VIEW COMPANY would either
    // fly the page 1000s of px with the focus ring invisible the whole flight,
    // or strand the ring off-screen entirely. On focusin outside the viewport we
    // jump the pin *immediately* to the dwell center of the focused node's card,
    // so the ring is on-screen at once and tabbing lands as discrete stops (no
    // scrub-through). Immediate == parity with the reduced-motion path.
    useEffect(() => {
        const section = targetRef.current;
        if (!section) return;

        const handleFocusIn = (event: FocusEvent) => {
            const el = event.target as HTMLElement | null;
            if (!el || !section.contains(el)) return;

            const rect = el.getBoundingClientRect();
            const onScreen =
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.right <= window.innerWidth;
            if (onScreen) return;

            const node = el.closest<HTMLElement>("[data-node-index]");
            const index = node ? Number(node.dataset.nodeIndex) : 0;
            const target =
                centers[index] ?? (total > 1 ? index / (total - 1) : 0);
            scrollToProgress(target, true);
        };

        section.addEventListener("focusin", handleFocusIn);
        return () => section.removeEventListener("focusin", handleFocusIn);
    }, [centers, scrollToProgress, total]);

    return (
        <>
            {/* Pre-pin poster opener (jc-2np). Deliberately OUTSIDE targetRef:
                useScroll measures targetRef's own 300vh geometry against the
                viewport (offset "start start" → "end end"), so the opener only
                pushes the pin's start further down the page — scrollYProgress
                still maps 0→1 across the same 300vh and every scrub/dwell/exit
                offset composes unchanged. A centered ~70vh title card that
                scrolls up and away just before the sticky section tops out and
                the pin engages. */}
            <div className="container-page section-y flex min-h-[70vh] flex-col justify-center">
                <ActOpener />
            </div>
            <section ref={targetRef} className="relative h-[300vh]">
                <div className="sticky top-0 h-screen overflow-hidden">
                {/* Persistent act lockup (jc-d5d). The dock + brand wordmark yield
                    the top-left lane during the pin, so the 300vh act was
                    anonymous floating cards. A fixed mono eyebrow reclaims that
                    lane as the act's identity — outside the card mask so it never
                    dissolves at the frame edge. The frost pill (chrome-exclusion
                    grammar, jc-pbf) keeps tall cards scrubbing beneath it from
                    colliding text-on-text with the lockup. */}
                <div className="container-page pointer-events-none absolute inset-x-0 top-6 z-20 md:top-8">
                    <span className="inline-flex rounded-full border border-border-subtle bg-surface-overlay/80 px-3 py-1.5 text-xs backdrop-blur-xl label-accent">
                        {ACT_EYEBROW}
                    </span>
                </div>

                {/* Oversized ghost numeral of the ACTIVE card, reusing the per-card
                    watermark grammar (text-input · opacity 0.08) promoted to a
                    stage element on the right field the chrome vacated. Crossfades
                    on card change and fills the finale's empty right half. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 hidden select-none md:block"
                >
                    <AnimatePresence initial={false}>
                        <motion.span
                            key={active}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.08 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: DUR.slow, ease: EASE }}
                            className="absolute right-[4vw] top-1/2 -translate-y-1/2 font-bold leading-none tabular-nums text-input text-[16rem] lg:text-[22rem]"
                        >
                            {format(active + 1)}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Card track viewport. Its OWN overflow-hidden + mask fade the
                    cards at the frame edges (jc-nwg) so they dissolve like the
                    WebGL ribbon instead of shearing off raw; the mask lives here,
                    not on the sticky div, so the act lockup + progress chrome
                    (siblings) stay crisp. pb reserves the bottom lane so vertically
                    centered cards never scrub into the progress row. */}
                <div className="absolute inset-0 flex items-center overflow-hidden pb-16 lg:pb-20 [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
                    <motion.div
                        style={{ x, willChange: pinned ? "transform" : undefined }}
                        className="relative flex gap-12 px-6 sm:px-12 md:gap-24 md:px-24"
                    >
                        {/* Continuous timeline line */}
                        <div className="absolute left-0 top-0 hidden h-[1px] w-full -translate-y-12 bg-border md:block" aria-hidden="true" />

                        {/* Intro spacer */}
                        <div className="w-0 shrink-0 md:w-[8vw]" />

                        {resumeData.experience.map((job, index) => (
                            <TimelineNode
                                key={index}
                                job={job}
                                index={index}
                                variant="horizontal"
                                isActive={index === active}
                            />
                        ))}

                        {/* Outro spacer — right-side runway so the last node can reach
                            dead-center (TRACK_TRAVEL) with no hard container edge behind it */}
                        <div className="w-[24vw] shrink-0 md:w-[28vw]" />
                    </motion.div>
                </div>

                {/* Bottom exclusion scrim (jc-nwg): background→transparent behind
                    the progress row so any tall card scrubbing under it fades out
                    instead of colliding text-on-text with SCROLL TO EXPLORE. Rides
                    the chrome's own opacity so it retires with the rail. */}
                <motion.div
                    style={{ opacity: chromeOpacity }}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-background to-transparent"
                />

                {/* Progress + node counter: shows how many entries exist and where you are.
                    Hugs the bottom edge (bottom-6, no lg lift) so the tallest case-study
                    card — which can exceed a short viewport — keeps its in-card VIEW
                    COMPANY clear of the "SCROLL TO EXPLORE" label. The dock yields this
                    lane during the pin, so nothing competes for the bottom band. */}
                <motion.div
                    style={{ opacity: chromeOpacity, visibility: chromeVisibility }}
                    className="container-page absolute inset-x-0 bottom-6 z-20 flex flex-col gap-3"
                >
                    <div className="flex items-center justify-between text-xs label">
                        <span className="flex items-center gap-2">
                            {/* Static indicator, not an affordance: the jc-rdm hover
                                micro-language is reserved for interactive elements
                                (dock buttons, VIEW COMPANY, contact links), so this
                                non-interactive progress label keeps a still arrow. */}
                            SCROLL TO EXPLORE <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {/* aria-label only (no aria-live) — the counter is a static
                            queryable label, not an announcement stream that would
                            fire on every scrub tick. */}
                        <span
                            className="tabular-nums"
                            aria-label={`Role ${format(active + 1)} of ${format(total)}`}
                        >
                            <motion.span
                                key={active}
                                initial={{ opacity: 0.4, textShadow: "0 0 12px rgba(139,92,246,0.9)" }}
                                animate={{ opacity: 1, textShadow: "0 0 0px rgba(139,92,246,0)" }}
                                transition={{ duration: DUR.base, ease: EASE }}
                                className="inline-block text-foreground"
                            >
                                {format(active + 1)}
                            </motion.span>
                            <span className="text-subtle-foreground"> / {format(total)}</span>
                        </span>
                    </div>
                    {/* The rail is the act's wayfinding instrument (jc-5ur): a violet
                        fill under N tick-dot buttons at each role's node position,
                        each jumping the pin to that card's dwell center via the same
                        scrollToProgress the focus-rescue uses. Active tick violet.
                        The cyan hot-head is NOT here in the standing state — it only
                        ignites off-right on the exit beat. */}
                    <div className="relative h-[2px] w-full rounded-full bg-border-subtle">
                        <motion.div
                            aria-hidden="true"
                            style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
                            className="h-full w-full rounded-full bg-primary glow-primary"
                        />
                        {/* Hot-head: dark through the whole scrub, ignites cyan and
                            accelerates off the right edge only on the exit beat. */}
                        <motion.span
                            aria-hidden="true"
                            style={{ left: headLeft, opacity: headOpacity }}
                            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_14px_3px_rgba(45,212,191,0.55)]"
                        />
                        {centers.map((center, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => scrollToProgress(center, false)}
                                aria-label={`Go to role ${format(index + 1)} of ${format(total)}: ${resumeData.experience[index].title}`}
                                aria-current={index === active ? "true" : undefined}
                                style={{
                                    left:
                                        total > 1
                                            ? `${(index / (total - 1)) * 100}%`
                                            : "0%",
                                }}
                                className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                        index === active
                                            ? "bg-primary glow-primary"
                                            : "bg-border-strong"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
            </section>
        </>
    );
}

function format(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
}

function TimelineNode({
    job,
    index,
    variant,
    isActive = false,
}: {
    job: Job;
    index: number;
    variant: "horizontal" | "vertical";
    isActive?: boolean;
}) {
    const numeral = format(index + 1);
    const isHorizontal = variant === "horizontal";

    return (
        <div
            data-node-index={index}
            // In the pinned horizontal timeline the scroll-current role is
            // driven by vertical scroll, so a screen-reader virtual cursor
            // (JAWS/NVDA browse mode) reads nodes without ever moving DOM focus
            // — the focusin pin-rescue never fires for it. Marking the
            // scroll-current node aria-current gives that cursor an orientation
            // anchor that tracks the visible pin (jc-sna). Horizontal only: the
            // static list shows every role at once, so "current" is meaningless
            // there.
            aria-current={isHorizontal && isActive ? "true" : undefined}
            className={
                isHorizontal
                    ? "relative flex w-[82vw] shrink-0 flex-col justify-start sm:w-[80vw] md:w-[60vw] lg:w-[44vw]"
                    : "relative flex flex-col justify-start"
            }
        >
            {/* Timeline dot */}
            <div
                className={
                    isHorizontal
                        ? "absolute left-0 top-0 hidden h-3 w-3 -translate-y-[calc(3rem+5px)] rounded-full bg-primary glow-primary md:block"
                        : "absolute left-0 top-1.5 h-3 w-3 -translate-x-[calc(2rem+6.5px)] rounded-full bg-primary glow-primary sm:-translate-x-[calc(2.5rem+6.5px)]"
                }
                aria-hidden="true"
            />

            {/* Readability scrim: luminance-elevated surface (subtle border + tint)
                keeps muted text ≥4.5:1 even over the bright orb core. surface/90
                (jc-wpd): off-stage cards at the pin's viewport edge exit as a
                dim surface, not raw text bleeding over the previous card. */}
            <div className="rounded-xl border border-border-subtle bg-surface/90 p-8 backdrop-blur-sm">
                {/* POSTER tier (jc-105): the card is an impression, not a
                    briefing. One canonical title per position set big; the
                    sub-roles compress into the context arc line; ONE mono
                    proof line carries the strongest named receipts. The full
                    `description` bullets are the receipts tier — rendered by
                    the terminal (~/experience, ~/work), never here. The role
                    numeral lives on the bottom progress counter (and the
                    watermark), so the eyebrow carries company · period. */}
                <header className="mb-6 flex flex-col gap-3">
                    <span className="text-xs label">
                        {job.company} <span className="text-subtle-foreground">· {job.period}</span>
                    </span>
                    <h3 className="text-4xl font-black uppercase leading-[0.98] tracking-tight text-foreground text-glow [text-wrap:balance] sm:text-5xl">
                        {job.title}
                    </h3>
                    {job.context && (
                        <p className="max-w-[46ch] text-base leading-relaxed text-muted-foreground">
                            {renderDecisionClause(job.context)}
                        </p>
                    )}
                </header>

                {job.proof && job.proof.length > 0 && (
                    <p className="mb-2 border-l-2 border-primary pl-4 font-mono text-xs leading-relaxed text-muted-foreground">
                        {job.proof.map((segment, i) => (
                            <span key={i}>
                                {i > 0 && (
                                    <span className="text-subtle-foreground"> · </span>
                                )}
                                {renderProofSegment(segment)}
                            </span>
                        ))}
                    </p>
                )}

                {/* Company link lives INSIDE the scrim panel so it can never
                    float below the card and graze the viewport bottom / collide
                    with the fixed progress row's "SCROLL TO EXPLORE" label as
                    cards scrub. Voice: the ONE secondary CTA (mono uppercase
                    GHOST pill) — the filled violet pill is reserved for the
                    primary ask (jc-nc1). */}
                {job.companyUrl && (
                    <a
                        href={job.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-6 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full border border-primary/40 bg-transparent px-6 py-3 font-mono text-sm tracking-wider text-primary-hover transition-[color,border-color,background-color,transform] hover:border-primary hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
                    >
                        {/* Shared hover micro-language (jc-rdm): nudge along the
                            arrow's axis (right) + faint grow, motion-safe-gated. The
                            arrow already inherits the pill's primary, so no separate
                            warm — label + arrow stay one color. */}
                        VIEW COMPANY <ArrowRight className="h-3.5 w-3.5 origin-center transition-transform motion-safe:group-hover:translate-x-px motion-safe:group-hover:scale-[1.06]" aria-hidden="true" />
                    </a>
                )}
            </div>

            {/* Faint watermark numeral — kept subtle behind the content */}
            <div
                className="pointer-events-none absolute -bottom-8 left-0 -z-10 select-none text-9xl font-bold leading-none text-input opacity-[0.08]"
                aria-hidden="true"
            >
                {numeral}
            </div>
        </div>
    );
}

/**
 * Renders a bullet as a clean "decision clause": the lead clause (text before
 * the first em-dash) is emphasized, the rationale after it stays muted. Falls
 * back to plain text when no em-dash is present.
 */
// Proof segments speak in the terminal's voice: mono text with any load-
// bearing figures lit in signal cyan — the same "cyan = the answer" grammar
// the rest of the system reserves for payoffs.
function renderProofSegment(segment: string) {
    const parts = segment.split(/(~?\$?\d[\d,]*(?:\.\d+)?(?:[MKB]|%)?(?:\/yr)?\+?)/g);
    return parts.map((part, i) =>
        /^~?\$?\d/.test(part) ? (
            <span key={i} className="font-semibold text-accent">
                {part}
            </span>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

function renderDecisionClause(text: string) {
    const splitAt = text.indexOf("—");
    if (splitAt === -1) return text;

    const lead = text.slice(0, splitAt).trimEnd();
    const rest = text.slice(splitAt + 1).trimStart();

    return (
        <>
            <span className="text-foreground">{lead}</span>
            <span className="text-subtle-foreground"> — </span>
            {rest}
        </>
    );
}
