"use client";

import { useEffect, useRef } from "react";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";

const APP_IDS: ReadonlyArray<AppId> = [
    "terminal",
    "about",
    "career",
    "stack",
    "contact",
];

function parseOpen(value: string | null): AppId[] {
    if (!value) return [];
    return value
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is AppId => (APP_IDS as readonly string[]).includes(s));
}

function parseFocus(value: string | null): AppId | null {
    if (!value) return null;
    return (APP_IDS as readonly string[]).includes(value)
        ? (value as AppId)
        : null;
}

export function useUrlSync() {
    const open = useDesktopStore((s) => s.open);
    const focus = useDesktopStore((s) => s.focus);
    const windows = useDesktopStore((s) => s.windows);
    const focusedId = useDesktopStore((s) => s.focusedId);
    const setPhase = useBootStore((s) => s.setPhase);
    const seededRef = useRef(false);

    // Initial seed from URL on mount.
    useEffect(() => {
        if (seededRef.current) return;
        seededRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const skipBoot =
            params.get("skip") === "1" || params.has("open") || params.has("focus");
        const openIds = parseOpen(params.get("open"));
        const focusId = parseFocus(params.get("focus"));

        if (skipBoot) {
            setPhase("reveal");
        }

        // Always ensure terminal is open by default once we're in `ready`.
        const finalOpen = openIds.length > 0 ? openIds : ["terminal" as AppId];
        for (const id of finalOpen) open(id);

        if (focusId && !finalOpen.includes(focusId)) {
            open(focusId);
        }
        if (focusId) {
            focus(focusId);
        } else if (finalOpen.length > 0) {
            focus(finalOpen[finalOpen.length - 1]);
        }
    }, [open, focus, setPhase]);

    // Mirror store → URL (debounced via raf).
    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            const params = new URLSearchParams(window.location.search);
            const openList = Object.keys(windows) as AppId[];

            if (openList.length === 0) {
                params.delete("open");
            } else {
                params.set("open", openList.join(","));
            }

            if (focusedId) {
                params.set("focus", focusedId);
            } else {
                params.delete("focus");
            }

            const next = params.toString();
            const target = next ? `?${next}` : window.location.pathname;
            window.history.replaceState(null, "", target);
        });

        return () => cancelAnimationFrame(rafId);
    }, [windows, focusedId]);
}
