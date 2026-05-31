"use client";

import { useEffect } from "react";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";

const DOCK_ORDER: AppId[] = ["terminal", "about", "career", "stack", "contact"];

export function useHotkeys() {
    const open = useDesktopStore((s) => s.open);
    const close = useDesktopStore((s) => s.close);
    const toggleMin = useDesktopStore((s) => s.toggleMin);
    const focusedId = useDesktopStore((s) => s.focusedId);
    const paletteOpen = useDesktopStore((s) => s.paletteOpen);
    const setPalette = useDesktopStore((s) => s.setPalette);
    const phase = useBootStore((s) => s.phase);

    useEffect(() => {
        if (phase !== "ready") return;

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
    }, [phase, paletteOpen, focusedId, open, close, toggleMin, setPalette]);
}
