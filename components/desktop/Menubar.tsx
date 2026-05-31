"use client";

import { motion } from "framer-motion";
import { useBootStore } from "@/store/useBootStore";
import { useDesktopStore } from "@/store/useDesktopStore";
import NowWidget from "./NowWidget";
import { APPS } from "./config/apps";

const MENUS = ["File", "Edit", "View", "Window"];

export default function Menubar() {
    const phase = useBootStore((s) => s.phase);
    const focusedId = useDesktopStore((s) => s.focusedId);

    const activeName = focusedId ? APPS[focusedId].name : "Desktop";

    return (
        <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={
                phase === "reveal" || phase === "ready"
                    ? { y: 0, opacity: 1 }
                    : { y: -40, opacity: 0 }
            }
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md border-b border-white/5 z-40 select-none"
        >
            <div className="flex items-center gap-5 font-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-primary font-bold tracking-wide">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                    jake
                </span>
                <span className="text-foreground font-semibold">{activeName}</span>
                {MENUS.map((m) => (
                    <span key={m} className="text-muted-foreground hover:text-foreground cursor-default">
                        {m}
                    </span>
                ))}
            </div>
            <NowWidget />
        </motion.div>
    );
}
