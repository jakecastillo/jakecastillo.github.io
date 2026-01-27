import type Lenis from "lenis";
import { create } from "zustand";

interface ScrollState {
    offset: number;
    progress: number; // 0 to 1
    setScroll: (offset: number, progress: number) => void;
    lenis: Lenis | null;
    setLenis: (lenis: Lenis | null) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
    offset: 0,
    progress: 0,
    setScroll: (offset, progress) => set({ offset, progress }),
    lenis: null,
    setLenis: (lenis) => set({ lenis }),
}));
