import { create } from "zustand";
import { stageSections } from "@/data/sections";

interface ActState {
    activeActId: string;
    setActiveActId: (id: string) => void;
    // True only while the Experience act's PINNED immersive timeline is mounted
    // (fine-pointer + normal motion). The static/touch/reduced-motion fallback
    // never sets this, so chrome-yield choreography stays inert on those paths.
    expImmersive: boolean;
    setExpImmersive: (v: boolean) => void;
}

// Which act (page section) currently owns the reading zone. Written by
// StageManager's IntersectionObserver; read by DOM beam segments (hook
// subscription) AND by the canvas (getState() inside useFrame — never a
// hook, so the Canvas subtree never re-renders).
export const useActStore = create<ActState>((set) => ({
    activeActId: stageSections[0].id,
    setActiveActId: (id) =>
        set((s) => (s.activeActId === id ? s : { activeActId: id })),
    expImmersive: false,
    setExpImmersive: (v) =>
        set((s) => (s.expImmersive === v ? s : { expImmersive: v })),
}));

// Chrome should YIELD while the Experience act is pinned and being scrubbed:
// the reading zone is owned by #exp AND the immersive (pinned) timeline is live.
// One selector so the dock, act rail, and brand wordmark stay in lockstep.
export const selectExpPinned = (s: ActState) =>
    s.expImmersive && s.activeActId === "exp";
