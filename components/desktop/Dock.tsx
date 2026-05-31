"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { APPS } from "./config/apps";

const DOCK_ORDER: AppId[] = ["terminal", "about", "career", "stack", "contact"];

function MagneticIcon({
    onClick,
    label,
    children,
    running,
}: {
    onClick: () => void;
    label: string;
    children: React.ReactNode;
    running?: boolean;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const onMove = (e: React.MouseEvent) => {
        const { left, top, width, height } = ref.current!.getBoundingClientRect();
        setPos({
            x: (e.clientX - (left + width / 2)) * 0.1,
            y: (e.clientY - (top + height / 2)) * 0.1,
        });
    };

    return (
        <motion.div animate={pos} transition={{ type: "spring", stiffness: 150, damping: 15 }}>
            <button
                ref={ref}
                onClick={onClick}
                onMouseMove={onMove}
                onMouseLeave={() => setPos({ x: 0, y: 0 })}
                aria-label={label}
                className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
                {children}
                {running && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
            </button>
        </motion.div>
    );
}

export default function Dock() {
    const phase = useBootStore((s) => s.phase);
    const open = useDesktopStore((s) => s.open);
    const setPalette = useDesktopStore((s) => s.setPalette);
    const windows = useDesktopStore((s) => s.windows);

    return (
        <AnimatePresence>
            {(phase === "reveal" || phase === "ready") && (
                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
                >
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                        {DOCK_ORDER.map((id) => {
                            const App = APPS[id];
                            const Icon = App.icon;
                            return (
                                <MagneticIcon
                                    key={id}
                                    label={App.name}
                                    onClick={() => open(id)}
                                    running={Boolean(windows[id])}
                                >
                                    <Icon size={20} strokeWidth={1.5} />
                                </MagneticIcon>
                            );
                        })}
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <MagneticIcon label="Spotlight" onClick={() => setPalette(true)}>
                            <Search size={20} strokeWidth={1.5} />
                        </MagneticIcon>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
