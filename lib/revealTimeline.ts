/**
 * ONE clock for the post-boot desktop reveal.
 *
 * The old intro hand-tuned a different magic delay in five files (Menubar 0.4,
 * Dock 0.6, Scene 0.7, IdentityLockup dwell 3.2s, ...) and fired them the same
 * instant the boot overlay began its 0.8s exit fade — so the loader and the
 * desktop animated on top of each other. These offsets (seconds, measured from
 * phase === "reveal") are the single source of truth instead, sequenced so the
 * overlay has cleared before chrome paints.
 */
export const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

export const REVEAL = {
    /** The orb cross-fades in at +0 — it is visually continuous with the boot
     *  seal lattice, so the reveal reads as a handoff, not a second startup. */
    orb: 0,
    orbDuration: 0.6,
    /** Chrome settles AFTER the boot overlay clears its ~0.35s exit, so the
     *  loader and the desktop are never painted at the same time. */
    chrome: 0.38,
    chromeStagger: 0.1,
    chromeDuration: 0.5,
    /** The README identity header lands last — the single focal beat. */
    readme: 0.5,
    readmeDuration: 0.42,
} as const;
