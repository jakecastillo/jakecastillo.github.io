"use client";

import { useEffect, useRef } from "react";
import { X, Minus, Square } from "lucide-react";
import { useDesktopStore, type WindowState } from "@/store/useDesktopStore";
import { APPS } from "./config/apps";
import { windowPhysics } from "@/lib/windowPhysics";

interface Props {
    window: WindowState;
    children?: React.ReactNode;
}

// Wire physics -> store exactly once: when a window comes to rest, persist its
// top-left so maximize/restore and minimize/restore return it there (not spawn).
let settleWired = false;

// Keyboard nudge step (px). Shift = larger jumps for faster repositioning.
const NUDGE = 16;
const NUDGE_FAST = 64;

export default function WindowFrame({ window: win, children }: Props) {
    const focus = useDesktopStore((s) => s.focus);
    const close = useDesktopStore((s) => s.close);
    const toggleMin = useDesktopStore((s) => s.toggleMin);
    const toggleMax = useDesktopStore((s) => s.toggleMax);
    const focusedId = useDesktopStore((s) => s.focusedId);

    const ref = useRef<HTMLDivElement>(null);

    // Persist physics-driven rest positions back into the store (once globally).
    useEffect(() => {
        if (settleWired) return;
        settleWired = true;
        windowPhysics.setOnSettle((id, pos) =>
            useDesktopStore.getState().setPos(id as WindowState["id"], pos),
        );
    }, []);

    const isFocused = focusedId === win.id;
    const size = APPS[win.id].defaultSize;
    const name = APPS[win.id].name;
    const isMax = win.maximized;

    // Hand the element to the physics manager while it's a free-floating window.
    // (Maximized/minimized windows opt out — they aren't physical.) Including
    // win.minimized in the deps is load-bearing: minimizing unmounts the div
    // (return null below) but without the dep the effect never re-ran, so the
    // stale element stayed registered and restore left the window frozen.
    useEffect(() => {
        const el = ref.current;
        if (!el || isMax || win.minimized) return;
        windowPhysics.register(win.id, el, size.w, size.h, win.pos);
        return () => windowPhysics.unregister(win.id);
        // win.pos is the resting position (physics persists it back on settle),
        // so restore from minimize/maximize re-spawns where the user left it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [win.id, isMax, win.minimized, size.w, size.h]);

    useEffect(() => {
        if (isFocused) windowPhysics.setFocused(win.id);
    }, [isFocused, win.id]);

    if (win.minimized) return null;

    // Keyboard window management (a11y): a focused, non-maximized window can be
    // moved with the arrow keys (Shift for larger steps) — the only previous way
    // to reposition was a mouse drag. Maximized windows are pinned, so skip.
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (isMax) return;
        const step = e.shiftKey ? NUDGE_FAST : NUDGE;
        let dx = 0;
        let dy = 0;
        switch (e.key) {
            case "ArrowLeft":
                dx = -step;
                break;
            case "ArrowRight":
                dx = step;
                break;
            case "ArrowUp":
                dy = -step;
                break;
            case "ArrowDown":
                dy = step;
                break;
            default:
                return;
        }
        e.preventDefault();
        windowPhysics.nudge(win.id, dx, dy);
    };

    const titleBar = (
        <div
            onPointerDown={(e) => {
                focus(win.id);
                if (!isMax) windowPhysics.grab(win.id, e.clientX, e.clientY);
            }}
            // Title bar sits a step lighter than the window body (surface-chrome
            // > surface-window) so the frame reads as a lit, layered object —
            // depth by elevation, not glow.
            className={`h-[30px] flex items-center px-3 bg-surface-chrome border-b border-white/5 select-none ${
                isMax ? "" : "cursor-grab active:cursor-grabbing"
            }`}
        >
            {/* In-world window controls (no literal macOS traffic-lights): a
                monochrome violet/cyan dot whose lucide glyph is the resting
                state at low opacity and sharpens on hover. Violet = passive
                (close/minimize), cyan/signal = the active maximize affordance.
                aria-labels + behavior preserved. */}
            <div className="flex gap-1.5">
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        close(win.id);
                    }}
                    aria-label="Close"
                    className="grid place-items-center w-3.5 h-3.5 rounded-full bg-primary/20 text-primary/70 hover:bg-primary/30 hover:text-primary transition-colors group"
                >
                    <X className="w-2 h-2 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                </button>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMin(win.id);
                    }}
                    aria-label="Minimize"
                    className="grid place-items-center w-3.5 h-3.5 rounded-full bg-primary/20 text-primary/70 hover:bg-primary/30 hover:text-primary transition-colors group"
                >
                    <Minus className="w-2 h-2 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                </button>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMax(win.id);
                    }}
                    aria-label="Maximize"
                    className="grid place-items-center w-3.5 h-3.5 rounded-full bg-signal/20 text-signal/70 hover:bg-signal/30 hover:text-signal transition-colors group"
                >
                    <Square className="w-1.5 h-1.5 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                </button>
            </div>
            <div className="flex-1 text-center text-[11px] font-mono text-muted-foreground">
                {name}
            </div>
            <div className="w-12" />
        </div>
    );

    // Window body is the ramp base (surface-window); the focused state keeps the
    // rationed cyan/signal perimeter (the active-window cue), the resting state a
    // neutral border. Both compose --edge-light (inset top highlight) so the
    // panel reads as a physically lit object, not a flat plane.
    const chrome = `rounded-lg overflow-hidden bg-surface-window/95 backdrop-blur-md border ${
        isFocused
            ? "border-accent/40 shadow-[var(--edge-light),0_0_0_1px_rgba(34,211,238,0.4),0_30px_60px_-20px_rgba(0,0,0,0.8)]"
            : "border-white/10 shadow-[var(--edge-light),0_25px_50px_-12px_rgba(0,0,0,0.85)]"
    }`;

    if (isMax) {
        return (
            <div
                role="dialog"
                aria-label={`${name} window`}
                onMouseDown={() => focus(win.id)}
                className={`fixed ${chrome}`}
                style={{ left: 16, top: 40, right: 16, bottom: 96, zIndex: win.z }}
            >
                {titleBar}
                <div className="relative w-full h-[calc(100%-30px)] overflow-auto">{children}</div>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            role="dialog"
            aria-label={`${name} window`}
            // Advertise the keyboard-move affordance the standards-based way
            // (concise accessible name + ARIA shortcut hint) instead of padding
            // the label, which made every window announce a long sentence.
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseDown={() => focus(win.id)}
            className={`absolute left-0 top-0 will-change-transform outline-none focus-visible:ring-1 focus-visible:ring-accent/50 ${chrome}`}
            style={{
                width: size.w,
                height: size.h,
                zIndex: win.z,
                transform: `translate3d(${win.pos.x}px, ${win.pos.y}px, 0)`,
            }}
        >
            {titleBar}
            <div className="relative w-full h-[calc(100%-30px)] overflow-auto">{children}</div>
        </div>
    );
}
