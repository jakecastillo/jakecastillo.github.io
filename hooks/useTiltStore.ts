import { create } from "zustand";

interface TiltState {
    enabled: boolean;
    enable: () => void;
}

export const useTiltStore = create<TiltState>((set) => ({
    enabled: false,
    enable: () => set({ enabled: true }),
}));
