import { create } from "zustand";

export type BootPhase = "loading" | "booting" | "reveal" | "ready";

interface BootState {
    phase: BootPhase;
    setPhase: (phase: BootPhase) => void;
}

export const useBootStore = create<BootState>((set) => ({
    phase: "loading",
    setPhase: (phase) => set({ phase }),
}));
