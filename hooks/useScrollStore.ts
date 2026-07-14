import type Lenis from "lenis";
import { create } from "zustand";

interface ScrollState {
    offset: number;
    progress: number; // 0 to 1
    // Live scroll velocity straight from Lenis (~px/frame; signed). 0 while
    // idle and under reduced motion (Lenis never runs), so consumers can treat
    // it as a pure "scroll energy" signal that settles to nothing at rest.
    velocity: number;
    setScroll: (offset: number, progress: number, velocity: number) => void;
    lenis: Lenis | null;
    setLenis: (lenis: Lenis | null) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
    offset: 0,
    progress: 0,
    velocity: 0,
    setScroll: (offset, progress, velocity) =>
        set({ offset, progress, velocity }),
    lenis: null,
    setLenis: (lenis) => set({ lenis }),
}));
