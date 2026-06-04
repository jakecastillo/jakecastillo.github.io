"use client";

import { useEffect, useState } from "react";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { DOCK_ORDER } from "@/components/desktop/config/dock";

// Matches QuantumLoader's boot-overlay exit transition (0.8s). We wait this long
// after the OS reports "ready" before arming hotkeys, so ⌘K / "/" can't open the
// Spotlight palette over the still-painting boot/reveal overlay mid-exit.
const REVEAL_SETTLE_MS = 800;

export function useHotkeys() {
    const open = useDesktopStore((s) => s.open);
    const close = useDesktopStore((s) => s.close);
    const toggleMin = useDesktopStore((s) => s.toggleMin);
    const focusedId = useDesktopStore((s) => s.focusedId);
    const paletteOpen = useDesktopStore((s) => s.paletteOpen);
    const setPalette = useDesktopStore((s) => s.setPalette);
    const phase = useBootStore((s) => s.phase);

    // Gate hotkeys until the boot reveal has fully settled. Reduced-motion users
    // jump straight to "ready" with no visible reveal/exit, so there's nothing to
    // wait for — arm immediately to keep the OS responsive. Transitions run via a
    // timer (settle delay, or 0ms for the immediate cases) and the effect cleanup
    // disarms on the way out, so we never call setState synchronously in-effect.
    const [revealSettled, setRevealSettled] = useState(false);

    useEffect(() => {
        if (phase !== "ready") {
            const reset = setTimeout(() => setRevealSettled(false), 0);
            return () => clearTimeout(reset);
        }
        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const delay = prefersReducedMotion ? 0 : REVEAL_SETTLE_MS;
        const t = setTimeout(() => setRevealSettled(true), delay);
        return () => clearTimeout(t);
    }, [phase]);

    useEffect(() => {
        if (phase !== "ready" || !revealSettled) return;

        function onKeyDown(e: KeyboardEvent) {
            const mod = e.metaKey || e.ctrlKey;
            const target = e.target as HTMLElement | null;
            const isTyping =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable;

            // Palette: cmd+K, ctrl+K, or "/" (when not typing)
            if (mod && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPalette(!paletteOpen);
                return;
            }
            if (!isTyping && e.key === "/") {
                e.preventDefault();
                setPalette(!paletteOpen);
                return;
            }

            // Esc closes palette
            if (e.key === "Escape" && paletteOpen) {
                e.preventDefault();
                setPalette(false);
                return;
            }

            // While the modal Spotlight palette is the active surface, window
            // actions (close / minimize / open-focus) must not pass through to
            // the windows behind it. Only the palette's own keys (handled above)
            // are live; everything else is a no-op until the palette closes.
            if (paletteOpen) return;

            // cmd+W closes focused window
            if (mod && e.key.toLowerCase() === "w" && focusedId) {
                e.preventDefault();
                close(focusedId);
                return;
            }

            // cmd+M minimizes focused window
            if (mod && e.key.toLowerCase() === "m" && focusedId) {
                e.preventDefault();
                toggleMin(focusedId);
                return;
            }

            // cmd+1..5 focuses / opens dock app
            if (mod && /^[1-5]$/.test(e.key)) {
                e.preventDefault();
                const id = DOCK_ORDER[Number(e.key) - 1];
                if (id) open(id);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [phase, revealSettled, paletteOpen, focusedId, open, close, toggleMin, setPalette]);
}
