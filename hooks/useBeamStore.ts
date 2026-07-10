import { create } from "zustand";

interface BeamState {
    /** Boot ignition finished (or was skipped: repeat visit / reduced motion). */
    bootDone: boolean;
    setBootDone: () => void;
}

export const useBeamStore = create<BeamState>((set) => ({
    bootDone: false,
    setBootDone: () => set({ bootDone: true }),
}));
