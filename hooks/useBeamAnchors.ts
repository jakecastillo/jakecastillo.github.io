"use client";

import { useEffect } from "react";

// ---------------------------------------------------------------------------
// useBeamAnchors — the DOM side of the anchor-driven beam.
//
// Measures the real layout positions of the four story anchors (hero underline
// end, philosophy spine top, prism vertex, beacon center), converts them to
// DOCUMENT-space pixels, weaves shaping midpoints between them, and publishes
// plain data to a module-level frame object. BeamRibbon (inside the R3F
// Canvas) reads that object inside useFrame via `getBeamAnchorFrame()` and
// rebuilds its curve only when `version` bumps — never a hook subscription,
// never React state per scroll tick (React 19 Canvas constraint, see
// Scene.tsx).
//
// Coordinate contract with BeamRibbon:
//   - Points are document-space px (x from viewport left; y from document top).
//   - BeamRibbon maps them to world units at the z=0 plane (camera z=5,
//     fov 45): worldX = (x - vw/2) * unitsPerPx, worldY = (vh/2 - y) *
//     unitsPerPx, then translates the whole mesh by scrollY * unitsPerPx per
//     frame — the ribbon is PINNED to the content, threading it as it scrolls.
//   - `arriveScroll` on anchor points: the window scrollY at which the beam
//     head must sit exactly on that anchor (its act entering the reading
//     zone). BeamRibbon interpolates head arc-fraction between these stops.
// ---------------------------------------------------------------------------

export interface BeamAnchorPoint {
    /** Document-space px from the viewport's left edge. */
    x: number;
    /** Document-space px from the top of the document. */
    y: number;
    /** Depth for the curve at this point (world units; anchors sit at 0). */
    z: number;
    /** True story anchor (arrival keyframe) vs. shaping midpoint. */
    anchor: boolean;
    /** For anchors: scrollY at which the head arrives here. 0 on midpoints. */
    arriveScroll: number;
}

export interface BeamAnchorFrame {
    /** Bumped only when measured geometry actually changed. */
    version: number;
    points: BeamAnchorPoint[];
    viewportW: number;
    viewportH: number;
    /** World units per CSS px at the anchor z-plane (z=0, camera z=5 fov 45). */
    unitsPerPx: number;
    maxScroll: number;
    /** <768px — vertical center-snaking path. */
    mobile: boolean;
}

const frame: BeamAnchorFrame = {
    version: 0,
    points: [],
    viewportW: 0,
    viewportH: 0,
    unitsPerPx: 0,
    maxScroll: 0,
    mobile: false,
};

/** Read by BeamRibbon inside useFrame — plain data, no subscriptions. */
export function getBeamAnchorFrame(): BeamAnchorFrame {
    return frame;
}

// Camera constants mirrored from Scene.tsx (<Canvas camera={{ position:
// [0,0,5], fov: 45 }}>). At the z=0 anchor plane the view is
// 2 * d * tan(fov/2) world units tall.
const CAMERA_Z = 5;
const FOV_DEG = 45;
const VIEW_HEIGHT_WORLD =
    2 * CAMERA_Z * Math.tan((FOV_DEG * Math.PI) / 360);

/** Fraction of the viewport height an anchor sits at when its act "enters". */
const ARRIVAL_VIEWPORT_FRACTION = 0.72;

type AnchorRect = { x: number; y: number };

function measureAnchor(
    selector: string,
    scrollY: number,
    pick: (r: DOMRect) => { x: number; y: number },
): AnchorRect | null {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    const p = pick(r);
    return { x: p.x, y: p.y + scrollY };
}

function pushMid(
    out: BeamAnchorPoint[],
    from: AnchorRect,
    to: AnchorRect,
    tY: number,
    x: number,
    z: number,
) {
    out.push({
        x,
        y: from.y + (to.y - from.y) * tY,
        z,
        anchor: false,
        arriveScroll: 0,
    });
}

function computePoints(
    hero: AnchorRect,
    spine: AnchorRect,
    prism: AnchorRect,
    beacon: AnchorRect,
    vw: number,
    mobile: boolean,
): BeamAnchorPoint[] {
    const pts: BeamAnchorPoint[] = [];
    const anchor = (a: AnchorRect) =>
        pts.push({ x: a.x, y: a.y, z: 0, anchor: true, arriveScroll: 0 });

    if (mobile) {
        // Vertical center-snake: the thread runs down the middle of the
        // portrait column, breathing gently left/right between the real
        // anchors — a legible single vertical path, not corner scraps.
        const cx = vw / 2;
        const amp = vw * 0.17;
        anchor(hero);
        pushMid(pts, hero, spine, 0.35, cx + amp, -0.4);
        pushMid(pts, hero, spine, 0.72, cx - amp, -0.3);
        anchor(spine);
        pushMid(pts, spine, prism, 0.3, cx + amp, -0.5);
        pushMid(pts, spine, prism, 0.66, cx - amp * 0.8, -0.35);
        anchor(prism);
        pushMid(pts, prism, beacon, 0.5, cx + amp * 0.7, -0.4);
        anchor(beacon);
        return pts;
    }

    // Desktop weave: sweep out of the hero underline toward the right gutter,
    // dive back left into the spine top, thread the (pinned) experience act
    // with a wide S, kiss the prism vertex, then settle onto the beacon.
    anchor(hero);
    pushMid(pts, hero, spine, 0.34, vw * 0.74, -0.7);
    pushMid(pts, hero, spine, 0.74, vw * 0.3, -0.35);
    anchor(spine);
    pushMid(pts, spine, prism, 0.28, vw * 0.8, -0.9);
    pushMid(pts, spine, prism, 0.64, vw * 0.16, -0.5);
    anchor(prism);
    pushMid(pts, prism, beacon, 0.5, vw * 0.7, -0.7);
    anchor(beacon);
    return pts;
}

function framesDiffer(a: BeamAnchorPoint[], b: BeamAnchorPoint[]): boolean {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
        if (
            Math.abs(a[i].x - b[i].x) > 0.5 ||
            Math.abs(a[i].y - b[i].y) > 0.5 ||
            Math.abs(a[i].arriveScroll - b[i].arriveScroll) > 0.5
        ) {
            return true;
        }
    }
    return false;
}

function measure(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (vw === 0 || vh === 0) return;
    const scrollY = window.scrollY;

    const hero = measureAnchor("[data-boot-anchor]", scrollY, (r) => ({
        // The underline runs the width of the name span; the beam picks up
        // from its right end (the relay handoff point).
        x: r.right,
        y: r.bottom,
    }));
    const spine = measureAnchor('[data-beam-anchor="spine"]', scrollY, (r) => ({
        // Rail center sits ~3.5px in from the <ol> edge, top-3 below its top.
        x: r.left + 3.5,
        y: r.top + 12,
    }));
    const prism = measureAnchor('[data-beam-anchor="prism"]', scrollY, (r) => ({
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
    }));
    const beacon = measureAnchor(
        '[data-beam-anchor="beacon"]',
        scrollY,
        (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }),
    );
    if (!hero || !spine || !prism || !beacon) {
        // All-or-nothing by design (a partial path would thread wrong), but a
        // missing anchor must not fail silently — the ribbon simply never
        // appears. Surface it for whoever renames/unmounts an anchor element.
        if (process.env.NODE_ENV !== "production") {
            console.warn(
                "[beam] anchor missing — ribbon hidden:",
                { hero: !!hero, spine: !!spine, prism: !!prism, beacon: !!beacon },
            );
        }
        return;
    }

    const doc = document.documentElement;
    const maxScroll = Math.max(0, doc.scrollHeight - vh);
    const mobile = vw < 768;
    const points = computePoints(hero, spine, prism, beacon, vw, mobile);

    // Arrival keyframes: the head lands on each anchor as it crosses the
    // reading zone (ARRIVAL_VIEWPORT_FRACTION of the viewport), clamped to
    // reachable scroll and kept strictly increasing. The final anchor (the
    // beacon) parks the head — for any scroll past its stop the head holds
    // there, never running below the fold.
    let prev = 0;
    for (const p of points) {
        if (!p.anchor) continue;
        const stop = Math.min(
            Math.max(p.y - vh * ARRIVAL_VIEWPORT_FRACTION, 0),
            maxScroll,
        );
        p.arriveScroll = Math.max(stop, prev === 0 ? 0 : prev + 1);
        prev = p.arriveScroll;
    }

    if (
        !framesDiffer(points, frame.points) &&
        frame.viewportW === vw &&
        frame.viewportH === vh
    ) {
        return; // nothing moved — no geometry rebuild
    }

    frame.points = points;
    frame.viewportW = vw;
    frame.viewportH = vh;
    frame.unitsPerPx = VIEW_HEIGHT_WORLD / vh;
    frame.maxScroll = maxScroll;
    frame.mobile = mobile;
    frame.version++;
}

/**
 * Mount once on the DOM side (BackgroundScene). Re-measures on resize, on
 * document-height changes (GSAP pin-spacers, image/font reflow), and on a
 * low-frequency scroll throttle as self-healing — each pass is 4 rect reads.
 */
export function useBeamAnchors(): void {
    useEffect(() => {
        let raf = 0;
        const schedule = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(measure);
        };

        // First measure after layout settles (double-rAF clears hydration +
        // first paint), then again once fonts land.
        raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(measure);
        });
        if ("fonts" in document) {
            document.fonts.ready.then(schedule).catch(() => {});
        }

        window.addEventListener("resize", schedule);

        // Document height changes (ScrollTrigger pin-spacer insertion, lazy
        // content) move every downstream anchor — remeasure.
        let ro: ResizeObserver | null = null;
        if ("ResizeObserver" in window) {
            ro = new ResizeObserver(schedule);
            ro.observe(document.documentElement);
            ro.observe(document.body);
        }

        // Scroll self-heal, throttled hard (≥600ms between passes). The
        // measure() diff-gate means this almost never bumps `version`.
        let lastScrollMeasure = 0;
        const onScroll = () => {
            const now = performance.now();
            if (now - lastScrollMeasure < 600) return;
            lastScrollMeasure = now;
            schedule();
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", schedule);
            window.removeEventListener("scroll", onScroll);
            ro?.disconnect();
        };
    }, []);
}
