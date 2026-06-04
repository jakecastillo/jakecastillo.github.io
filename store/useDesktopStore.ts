import { create } from "zustand";

// Single source of truth for app ids. AppId is derived from this, so the list
// never drifts (consumed by config/apps, config/dock, and lib/urlState).
export const APP_IDS = [
    "readme",
    "terminal",
    "about",
    "career",
    "stack",
    "projects",
    "contact",
] as const;

export type AppId = (typeof APP_IDS)[number];

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
    /**
     * Timestamp (ms) of the most recent deliberate "secure" action — the shared
     * trigger for the recurring perimeter SEAL. Subscribers (QuantumOrb) watch
     * this value; stamping a fresh Date.now() re-fires the lock-ring snap. Null
     * until the first secure action so the boot "first lock" stands alone.
     */
    secureActionAt: number | null;

    open: (id: AppId) => void;
    close: (id: AppId) => void;
    focus: (id: AppId) => void;
    toggleMin: (id: AppId) => void;
    toggleMax: (id: AppId) => void;
    restoreMaximized: () => void;
    setPos: (id: AppId, pos: { x: number; y: number }) => void;
    hydrate: (state: { open: AppId[]; minimized: AppId[]; focus: AppId | null }) => void;
    setPalette: (open: boolean) => void;
    /**
     * Stamp secureActionAt with a fresh current-time-in-ms value so subscribers
     * detect the change and re-arm the seal. Emitted from deliberate secure
     * actions (Contact-window open; Terminal audit/hire). Never emits audio.
     */
    pulseSecure: () => void;
    reset: () => void;
}

const STAGGER_PX = 32;
const ORIGIN = { x: 80, y: 80 };

// Nominal window footprint used to keep spawns on-screen and to center the
// first window. Kept conservative so any app's defaultSize stays fully visible.
const NOMINAL_W = 620;
const NOMINAL_H = 520;

// Spread new windows across the workspace so they don't spawn in a pile.
const SPAWN_SCATTER = [
    { x: 0.12, y: 0.1 },
    { x: 0.48, y: 0.08 },
    { x: 0.3, y: 0.28 },
    { x: 0.6, y: 0.24 },
    { x: 0.18, y: 0.4 },
    { x: 0.44, y: 0.4 },
];

function nextOrigin(existing: WindowState[]): { x: number; y: number } {
    const i = existing.length;
    if (typeof window === "undefined") {
        const offset = i * STAGGER_PX;
        return { x: ORIGIN.x + offset, y: ORIGIN.y + offset };
    }
    const W = window.innerWidth;
    const H = window.innerHeight;

    // F5: the FIRST window on an empty desktop reads cleanest centered rather
    // than tucked into a corner — it lands as the obvious focal point. Later
    // windows keep the scatter so a multi-window workspace stays legible.
    if (i === 0) {
        const x = Math.max(16, Math.round((W - NOMINAL_W) / 2));
        const y = Math.max(44, Math.round((H - NOMINAL_H) / 2));
        return { x, y };
    }

    const s = SPAWN_SCATTER[i % SPAWN_SCATTER.length];
    // Clamp against a nominal window footprint so spawns stay on-screen.
    const x = Math.max(16, Math.min(Math.round(W * s.x), W - NOMINAL_W));
    const y = Math.max(44, Math.min(Math.round(48 + H * s.y), H - NOMINAL_H));
    return { x, y };
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
    windows: {},
    topZ: 10,
    focusedId: null,
    paletteOpen: false,
    secureActionAt: null,

    open: (id) => {
        const state = get();
        const existing = state.windows[id];
        const nextZ = state.topZ + 1;

        // Opening Contact is a deliberate "secure" action: re-fire the perimeter
        // seal (R1). Stamped here so every entry point (dock, ⌘K, terminal,
        // deep-link click) re-arms the orb without each caller remembering to.
        if (id === "contact") get().pulseSecure();

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

    // Un-maximize every maximized window. Used before ✦ Tidy so maximized
    // windows rejoin physics and get arranged instead of hiding the rest.
    restoreMaximized: () => {
        const state = get();
        let changed = false;
        const next: Partial<Record<AppId, WindowState>> = { ...state.windows };
        for (const w of Object.values(next)) {
            if (w?.maximized) {
                next[w.id] = { ...w, maximized: false };
                changed = true;
            }
        }
        if (changed) set({ windows: next });
    },

    setPos: (id, pos) => {
        const state = get();
        const existing = state.windows[id];
        if (!existing) return;
        // Skip no-op writes so the physics settle callback doesn't churn React.
        if (existing.pos.x === pos.x && existing.pos.y === pos.y) return;
        set({
            windows: { ...state.windows, [id]: { ...existing, pos } },
        });
    },

    // Atomically build the windows map from a decoded URL state (one set(), so
    // minimized windows never flash open on load). Reuses nextOrigin for layout.
    hydrate: (state) => {
        const windows: Partial<Record<AppId, WindowState>> = {};
        let z = 10;
        for (const id of state.open) {
            z += 1;
            const existing = Object.values(windows).filter(
                (w): w is WindowState => Boolean(w),
            );
            windows[id] = {
                id,
                pos: nextOrigin(existing),
                z,
                minimized: state.minimized.includes(id),
                maximized: false,
            };
        }
        set({ windows, topZ: z, focusedId: state.focus });
    },

    setPalette: (open) => set({ paletteOpen: open }),

    // Stamp a fresh timestamp every call so even back-to-back secure actions
    // produce a new value subscribers can diff against (re-firing the seal).
    pulseSecure: () => set({ secureActionAt: Date.now() }),

    reset: () =>
        set({
            windows: {},
            topZ: 10,
            focusedId: null,
            paletteOpen: false,
            secureActionAt: null,
        }),
}));

// R9 sound layer (default-OFF, opt-in, reduced-motion-gated). The store is the
// single subscription owner for the two sound call sites (focus/open tick +
// secureActionAt SEAL tick), so they fire on BOTH the desktop and mobile shells
// — unlike the orb's own subscription, whose Canvas is unmounted on the
// low-power / mobile-scrim paths. Client-only (typeof window guard) so the
// static-export server build never touches Web Audio; the wiring sets up its own
// first-gesture AudioContext unlock and is a no-op until the user opts in.
if (typeof window !== "undefined") {
    void import("@/lib/sound").then((m) => m.initSoundWiring());
}
