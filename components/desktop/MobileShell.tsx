"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { useUrlSync } from "@/hooks/useUrlSync";
import { APPS } from "./config/apps";
import { DOCK_ORDER } from "./config/dock";
import NowWidget from "./NowWidget";

export default function MobileShell() {
    const phase = useBootStore((s) => s.phase);
    const focusedId = useDesktopStore((s) => s.focusedId);
    const open = useDesktopStore((s) => s.open);

    useUrlSync();

    const isInteractive = phase === "ready" || phase === "reveal";
    const activeId: AppId = focusedId ?? "terminal";
    const Active = APPS[activeId].Component;

    return (
        <div
            className="fixed inset-0 z-10 flex flex-col"
            aria-hidden={!isInteractive}
            style={{ pointerEvents: isInteractive ? "auto" : "none" }}
        >
            <motion.header
                initial={{ y: -30, opacity: 0 }}
                animate={isInteractive ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="h-9 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md border-b border-white/5 font-mono text-[11px]"
            >
                <span className="flex items-center gap-1.5 text-primary font-bold">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                    jake.os / {APPS[activeId].name}
                </span>
                <NowWidget />
            </motion.header>

            <main className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeId}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 overflow-auto"
                    >
                        <Active />
                    </motion.div>
                </AnimatePresence>
            </main>

            <motion.nav
                initial={{ y: 60, opacity: 0 }}
                animate={isInteractive ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="h-16 flex items-center justify-around px-4 bg-black/50 backdrop-blur-xl border-t border-white/10"
            >
                {DOCK_ORDER.map((id) => {
                    const A = APPS[id];
                    const Icon = A.icon;
                    const active = id === activeId;
                    return (
                        <button
                            key={id}
                            onClick={() => open(id)}
                            aria-label={A.name}
                            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                                active ? "text-accent" : "text-muted-foreground"
                            }`}
                        >
                            <Icon size={20} strokeWidth={1.5} />
                        </button>
                    );
                })}
            </motion.nav>
        </div>
    );
}
