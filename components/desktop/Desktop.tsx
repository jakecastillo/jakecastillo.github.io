"use client";

import { LayoutGroup } from "framer-motion";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useUrlSync } from "@/hooks/useUrlSync";
import Menubar from "./Menubar";
import Dock from "./Dock";
import WindowFrame from "./WindowFrame";

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
                {Object.values(windows).map(
                    (w) => w && <WindowFrame key={w.id} window={w} />,
                )}
                <Dock />
            </div>
        </LayoutGroup>
    );
}
