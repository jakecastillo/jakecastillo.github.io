"use client";

import { LayoutGroup } from "framer-motion";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useUrlSync } from "@/hooks/useUrlSync";
import { APPS } from "./config/apps";
import Menubar from "./Menubar";
import Dock from "./Dock";
import WindowFrame from "./WindowFrame";
import Palette from "./Palette";

export default function Desktop() {
    const phase = useBootStore((s) => s.phase);
    const windows = useDesktopStore((s) => s.windows);

    useHotkeys();
    useUrlSync();

    const isInteractive = phase === "ready" || phase === "reveal";

    return (
        <LayoutGroup>
            <div
                className="fixed inset-0 z-10"
                aria-hidden={!isInteractive}
                style={{ pointerEvents: isInteractive ? "auto" : "none" }}
            >
                <Menubar />
                {Object.values(windows).map((w) => {
                    if (!w) return null;
                    const { Component } = APPS[w.id];
                    return (
                        <WindowFrame key={w.id} window={w}>
                            <Component />
                        </WindowFrame>
                    );
                })}
                <Dock />
                <Palette />
            </div>
        </LayoutGroup>
    );
}
