import { create } from "zustand";

interface BeamState {
    /** Boot ignition finished (or was skipped: repeat visit / reduced motion). */
    bootDone: boolean;
    /**
     * performance.now() at the moment bootDone flipped (0 = not yet). Read via
     * getState() inside R3F useFrame loops — never subscribed to — so the
     * Canvas subtree can sequence off the boot without ever re-rendering
     * (re-rendering it crashes React 19's dev reconciler).
     */
    bootDoneAt: number;
    /**
     * The boot overlay is actually playing this page load (fresh visit,
     * motion allowed). Gates the hero identity cascade: it runs only when
     * there is a veil to hand off from — skip/reduced paths keep the
     * SSR-static hero for LCP.
     */
    bootPlayed: boolean;
    /**
     * The boot line's handoff fade has begun (its CSS animation started, or
     * the boot was skipped). HeroUnderline keys its crossfade-in on THIS —
     * not on bootDone — so both halves of the crossfade follow the same
     * clock even when a stalled main thread delays animation events.
     */
    handoff: boolean;
    /**
     * performance.now() of the last "answered ask" — the visitor pressing the
     * contact CTA (pointerdown, so it works on touch). BeamRibbon reads this
     * via getState() inside useFrame (never a subscription) and answers with
     * one cyan shimmer along the ribbon; 0 = never asked.
     */
    askAt: number;
    setBootDone: () => void;
    markBootPlaying: () => void;
    markHandoff: () => void;
    ask: () => void;
}

export const useBeamStore = create<BeamState>((set) => ({
    bootDone: false,
    bootDoneAt: 0,
    bootPlayed: false,
    handoff: false,
    askAt: 0,
    // Idempotent: skip + watchdog + animationend can all race to end the boot.
    setBootDone: () =>
        set((s) =>
            s.bootDone
                ? {}
                : { bootDone: true, bootDoneAt: performance.now() },
        ),
    markBootPlaying: () =>
        set((s) => (s.bootPlayed ? {} : { bootPlayed: true })),
    markHandoff: () => set((s) => (s.handoff ? {} : { handoff: true })),
    ask: () => set({ askAt: performance.now() }),
}));
