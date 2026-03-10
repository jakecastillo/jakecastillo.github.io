import { create } from "zustand";

interface BootState {
    isBootComplete: boolean;
    setBootComplete: (complete: boolean) => void;
}

export const useBootStore = create<BootState>((set) => ({
    isBootComplete: false,
    setBootComplete: (complete) => set({ isBootComplete: complete }),
}));
