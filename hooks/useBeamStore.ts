import { create } from "zustand";

interface BeamState {
    /** Boot ignition finished (or was skipped: repeat visit / reduced motion). */
    bootDone: boolean;
    /**
     * The boot overlay is actually playing this page load (fresh visit,
     * motion allowed). Gates the hero identity cascade: it runs only when
     * there is a veil to hand off from — skip/reduced paths keep the
     * SSR-static hero for LCP.
     */
    bootPlayed: boolean;
    setBootDone: () => void;
    markBootPlaying: () => void;
}

export const useBeamStore = create<BeamState>((set) => ({
    bootDone: false,
    bootPlayed: false,
    // Idempotent: skip + watchdog + animationend can all race to end the boot.
    setBootDone: () => set((s) => (s.bootDone ? {} : { bootDone: true })),
    markBootPlaying: () =>
        set((s) => (s.bootPlayed ? {} : { bootPlayed: true })),
}));
