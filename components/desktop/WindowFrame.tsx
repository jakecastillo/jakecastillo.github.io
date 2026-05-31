"use client";

import { motion, useDragControls } from "framer-motion";
import { X, Minus, Square } from "lucide-react";
import { useDesktopStore, type WindowState } from "@/store/useDesktopStore";
import { APPS } from "./config/apps";

interface Props {
    window: WindowState;
    children?: React.ReactNode;
}

export default function WindowFrame({ window: win, children }: Props) {
    const focus = useDesktopStore((s) => s.focus);
    const close = useDesktopStore((s) => s.close);
    const toggleMin = useDesktopStore((s) => s.toggleMin);
    const toggleMax = useDesktopStore((s) => s.toggleMax);
    const setPos = useDesktopStore((s) => s.setPos);
    const focusedId = useDesktopStore((s) => s.focusedId);

    const dragControls = useDragControls();

    const isFocused = focusedId === win.id;
    const size = APPS[win.id].defaultSize;
    const name = APPS[win.id].name;

    if (win.minimized) return null;

    const isMax = win.maximized;
    const style: React.CSSProperties = isMax
        ? { left: 16, top: 40, right: 16, bottom: 88, zIndex: win.z }
        : { left: win.pos.x, top: win.pos.y, width: size.w, height: size.h, zIndex: win.z };

    return (
        <motion.div
            layoutId={win.id === "terminal" ? "terminal-window" : undefined}
            drag={!isMax}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            onDragEnd={(_, info) => {
                setPos(win.id, {
                    x: Math.max(0, win.pos.x + info.offset.x),
                    y: Math.max(32, win.pos.y + info.offset.y),
                });
            }}
            onMouseDown={() => focus(win.id)}
            className={`absolute rounded-lg overflow-hidden bg-[#0a0a18]/95 backdrop-blur-md border ${
                isFocused
                    ? "border-accent/40 shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_30px_60px_-20px_rgba(0,0,0,0.8)]"
                    : "border-white/10 shadow-2xl"
            }`}
            style={style}
            transition={{ layout: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
        >
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="h-[30px] flex items-center px-3 bg-[#13132a] border-b border-white/5 select-none cursor-grab active:cursor-grabbing"
            >
                <div className="flex gap-1.5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            close(win.id);
                        }}
                        aria-label="Close"
                        className="w-3 h-3 rounded-full bg-[#ff5f57] hover:opacity-80 transition-opacity group"
                    >
                        <X className="w-2 h-2 m-auto opacity-0 group-hover:opacity-100" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMin(win.id);
                        }}
                        aria-label="Minimize"
                        className="w-3 h-3 rounded-full bg-[#febc2e] hover:opacity-80 transition-opacity group"
                    >
                        <Minus className="w-2 h-2 m-auto opacity-0 group-hover:opacity-100" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMax(win.id);
                        }}
                        aria-label="Maximize"
                        className="w-3 h-3 rounded-full bg-[#28c840] hover:opacity-80 transition-opacity group"
                    >
                        <Square className="w-1.5 h-1.5 m-auto opacity-0 group-hover:opacity-100" />
                    </button>
                </div>
                <div className="flex-1 text-center text-[11px] font-mono text-muted-foreground">
                    {name}
                </div>
                <div className="w-12" />
            </div>
            <div className="relative w-full h-[calc(100%-30px)] overflow-auto">
                {children}
            </div>
        </motion.div>
    );
}
