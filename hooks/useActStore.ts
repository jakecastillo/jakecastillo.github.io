import { create } from "zustand";
import { stageSections } from "@/data/sections";

interface ActState {
    activeActId: string;
    setActiveActId: (id: string) => void;
}

// Which act (page section) currently owns the reading zone. Written by
// StageManager's IntersectionObserver; read by DOM beam segments (hook
// subscription) AND by the canvas (getState() inside useFrame — never a
// hook, so the Canvas subtree never re-renders).
export const useActStore = create<ActState>((set) => ({
    activeActId: stageSections[0].id,
    setActiveActId: (id) =>
        set((s) => (s.activeActId === id ? s : { activeActId: id })),
}));
