"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, Search } from "lucide-react";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { APPS } from "./config/apps";
import { DOCK_ORDER } from "./config/dock";

function MagneticIcon({
    onClick,
    href,
    download,
    label,
    children,
    running,
    reduceMotion,
}: {
    onClick?: () => void;
    /** When set, the control renders as an anchor (e.g. a download link). */
    href?: string;
    download?: boolean;
    label: string;
    children: React.ReactNode;
    running?: boolean;
    reduceMotion: boolean;
}) {
    const ref = useRef<HTMLElement>(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);

    const onMove = (e: React.MouseEvent) => {
        if (reduceMotion) return;
        const { left, top, width, height } = ref.current!.getBoundingClientRect();
        setPos({
            x: (e.clientX - (left + width / 2)) * 0.1,
            y: (e.clientY - (top + height / 2)) * 0.1,
        });
    };

    const onLeave = () => {
        setPos({ x: 0, y: 0 });
        setHovered(false);
    };

    // Steady-state hover delight. Full motion lifts + scales on a spring;
    // reduced-motion drops the transform/spring and leans on the color/opacity
    // hover already baked into the control class.
    const lift = hovered && !reduceMotion ? { y: pos.y - 4, x: pos.x, scale: 1.12 } : pos;

    // Hover is neutral lift-only (white surface brighten + foreground text): the
    // spring lift+scale carries the delight, so idle hover no longer spends the
    // rationed cyan. Cyan/signal is reserved for the running-app dot — so it now
    // MEANS "active", not "hovered".
    const controlClass =
        "relative flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors";

    const interaction = {
        onMouseMove: onMove,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: onLeave,
        onFocus: () => setHovered(true),
        onBlur: () => setHovered(false),
        "aria-label": label,
        className: controlClass,
    };

    const inner = (
        <>
            {children}
            {running && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-signal" />
            )}
        </>
    );

    return (
        <motion.div
            animate={lift}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            className="relative"
        >
            <AnimatePresence>
                {hovered && (
                    <motion.span
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-surface-raised/90 px-2 py-1 font-mono text-[11px] text-foreground backdrop-blur-md shadow-lg"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
            {href ? (
                <a
                    ref={ref as React.RefObject<HTMLAnchorElement>}
                    href={href}
                    download={download}
                    {...interaction}
                >
                    {inner}
                </a>
            ) : (
                <button
                    ref={ref as React.RefObject<HTMLButtonElement>}
                    onClick={onClick}
                    {...interaction}
                >
                    {inner}
                </button>
            )}
        </motion.div>
    );
}

export default function Dock() {
    const phase = useBootStore((s) => s.phase);
    const open = useDesktopStore((s) => s.open);
    const setPalette = useDesktopStore((s) => s.setPalette);
    const windows = useDesktopStore((s) => s.windows);
    const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

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
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface-chrome/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[var(--edge-light),0_25px_50px_-12px_rgba(0,0,0,0.85)]">
                        {DOCK_ORDER.map((id) => {
                            const App = APPS[id];
                            const Icon = App.icon;
                            return (
                                <MagneticIcon
                                    key={id}
                                    label={App.name}
                                    onClick={() => open(id)}
                                    running={Boolean(windows[id])}
                                    reduceMotion={reduceMotion}
                                >
                                    <Icon size={20} strokeWidth={1.5} />
                                </MagneticIcon>
                            );
                        })}
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <MagneticIcon
                            label="Download résumé (PDF)"
                            href="/resume.pdf"
                            download
                            reduceMotion={reduceMotion}
                        >
                            <FileDown size={20} strokeWidth={1.5} />
                        </MagneticIcon>
                        <MagneticIcon
                            label="Spotlight"
                            onClick={() => setPalette(true)}
                            reduceMotion={reduceMotion}
                        >
                            <Search size={20} strokeWidth={1.5} />
                        </MagneticIcon>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
