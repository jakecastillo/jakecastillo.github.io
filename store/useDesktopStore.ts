import { create } from "zustand";

export type AppId = "terminal" | "about" | "career" | "stack" | "contact";

export interface WindowState {
    id: AppId;
    pos: { x: number; y: number };
    z: number;
    minimized: boolean;
    maximized: boolean;
}

interface DesktopState {
    windows: Partial<Record<AppId, WindowState>>;
    topZ: number;
    focusedId: AppId | null;
    paletteOpen: boolean;

    open: (id: AppId) => void;
    close: (id: AppId) => void;
    focus: (id: AppId) => void;
    toggleMin: (id: AppId) => void;
    toggleMax: (id: AppId) => void;
    setPos: (id: AppId, pos: { x: number; y: number }) => void;
    setPalette: (open: boolean) => void;
    reset: () => void;
}

const STAGGER_PX = 32;
const ORIGIN = { x: 80, y: 80 };

function nextOrigin(existing: WindowState[]): { x: number; y: number } {
    const offset = existing.length * STAGGER_PX;
    return { x: ORIGIN.x + offset, y: ORIGIN.y + offset };
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
    windows: {},
    topZ: 10,
    focusedId: null,
    paletteOpen: false,

    open: (id) => {
        const state = get();
        const existing = state.windows[id];
        const nextZ = state.topZ + 1;

        if (existing) {
            set({
                windows: {
                    ...state.windows,
                    [id]: { ...existing, z: nextZ, minimized: false },
                },
                topZ: nextZ,
                focusedId: id,
            });
            return;
        }

        const openWindows = Object.values(state.windows).filter(
            (w): w is WindowState => Boolean(w),
        );
        const pos = nextOrigin(openWindows);

        set({
            windows: {
                ...state.windows,
                [id]: { id, pos, z: nextZ, minimized: false, maximized: false },
            },
            topZ: nextZ,
            focusedId: id,
        });
    },

    close: (id) => {
        const state = get();
        if (!state.windows[id]) return;
        const next = { ...state.windows };
        delete next[id];

        const remaining = Object.values(next).filter(
            (w): w is WindowState => Boolean(w),
        );
        const topRemaining = remaining.sort((a, b) => b.z - a.z)[0]?.id ?? null;

        set({
            windows: next,
            focusedId: state.focusedId === id ? topRemaining : state.focusedId,
        });
    },

    focus: (id) => {
        const state = get();
        const existing = state.windows[id];
        if (!existing) return;
        const nextZ = state.topZ + 1;
        set({
            windows: {
                ...state.windows,
                [id]: { ...existing, z: nextZ, minimized: false },
            },
            topZ: nextZ,
            focusedId: id,
        });
    },

    toggleMin: (id) => {
        const state = get();
        const existing = state.windows[id];
        if (!existing) return;
        set({
            windows: {
                ...state.windows,
                [id]: { ...existing, minimized: !existing.minimized },
            },
            focusedId:
                state.focusedId === id && !existing.minimized
                    ? null
                    : state.focusedId,
        });
    },

    toggleMax: (id) => {
        const state = get();
        const existing = state.windows[id];
        if (!existing) return;
        set({
            windows: {
                ...state.windows,
                [id]: { ...existing, maximized: !existing.maximized },
            },
        });
    },

    setPos: (id, pos) => {
        const state = get();
        const existing = state.windows[id];
        if (!existing) return;
        set({
            windows: { ...state.windows, [id]: { ...existing, pos } },
        });
    },

    setPalette: (open) => set({ paletteOpen: open }),
    reset: () => set({ windows: {}, topZ: 10, focusedId: null, paletteOpen: false }),
}));
