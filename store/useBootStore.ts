import { create } from "zustand";

export type BootPhase = "loading" | "booting" | "reveal" | "ready";

interface BootState {
    phase: BootPhase;
    setPhase: (phase: BootPhase) => void;

    /** @deprecated use `phase === "ready"`. Kept temporarily for incremental migration. */
    isBootComplete: boolean;
    /** @deprecated call `setPhase("ready")` instead. */
    setBootComplete: (complete: boolean) => void;
}

export const useBootStore = create<BootState>((set) => ({
    phase: "loading",
    setPhase: (phase) => set({ phase, isBootComplete: phase === "ready" }),

    isBootComplete: false,
    setBootComplete: (complete) =>
        set({ isBootComplete: complete, phase: complete ? "ready" : "booting" }),
}));
