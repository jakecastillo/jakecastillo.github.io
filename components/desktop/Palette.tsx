"use client";

import { Command } from "cmdk";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, Mail } from "lucide-react";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { APPS } from "./config/apps";
import { resumeData } from "@/data/resume";

// Tab-focusable descendants of a node, in DOM order, skipping disabled/hidden
// controls. Used to keep Tab/Shift+Tab cycling inside the modal (focus trap).
function getFocusable(root: HTMLElement): HTMLElement[] {
    const nodes = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(nodes).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0
    );
}

export default function Palette() {
    const paletteOpen = useDesktopStore((s) => s.paletteOpen);
    const setPalette = useDesktopStore((s) => s.setPalette);
    const open = useDesktopStore((s) => s.open);
    // The control that had focus when the palette opened — restored on close so
    // keyboard/SR users keep their place (WAI-ARIA dialog return-focus).
    const lastFocusedRef = useRef<HTMLElement | null>(null);
    // The palette's own container, used to scope the focus trap.
    const panelRef = useRef<HTMLDivElement | null>(null);

    // Capture the triggering control the instant the palette opens, BEFORE React
    // mounts the panel and cmdk's autoFocus input steals focus. The store
    // subscription's listener runs synchronously inside setPalette(true) (during
    // the originating event handler), so document.activeElement is still the real
    // trigger — the menubar/dock Spotlight button or whatever held focus when
    // ⌘K/"/" fired. Capturing in a post-render effect previously stored the
    // soon-detached cmdk input instead, which dropped focus to BODY on close.
    useEffect(() => {
        return useDesktopStore.subscribe((state, prev) => {
            if (state.paletteOpen && !prev.paletteOpen) {
                const active = document.activeElement as HTMLElement | null;
                lastFocusedRef.current =
                    active && active !== document.body ? active : null;
            }
        });
    }, []);

    // Restore focus to the trigger once the palette has closed. Guarded against a
    // detached/removed trigger so .focus() never silently drops focus to BODY.
    useEffect(() => {
        if (paletteOpen) return;
        const trigger = lastFocusedRef.current;
        lastFocusedRef.current = null;
        if (trigger && document.contains(trigger)) {
            trigger.focus();
        }
    }, [paletteOpen]);

    // While open: close on Escape and trap Tab/Shift+Tab focus within the panel
    // so it never escapes to the dimmed desktop/menubar behind the backdrop.
    useEffect(() => {
        if (!paletteOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setPalette(false);
                return;
            }
            if (e.key !== "Tab") return;
            const panel = panelRef.current;
            if (!panel) return;
            const focusable = getFocusable(panel);
            if (focusable.length === 0) {
                e.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement as HTMLElement | null;
            // Keep focus inside the panel: wrap at the edges, and pull focus back
            // in if it has somehow landed outside (e.g. on BODY).
            if (!active || !panel.contains(active)) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            } else if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        // Capture phase so we intercept Tab before it reaches background controls.
        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [paletteOpen, setPalette]);

    return (
        <AnimatePresence>
            {paletteOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setPalette(false)}
                    className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] backdrop-blur-md bg-black/40"
                >
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Spotlight"
                        initial={{ scale: 0.95, y: -8, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -8, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        // Command menu reads as a raised, lit panel: the lightest
                        // ramp step (surface-raised) + the --edge-light top inner
                        // highlight so it floats above the dimmed desktop.
                        className="w-[min(520px,90vw)] rounded-xl border border-white/10 bg-surface-raised/95 backdrop-blur-xl shadow-[var(--edge-light),0_25px_50px_-12px_rgba(0,0,0,0.85)] overflow-hidden"
                    >
                        <Command label="Spotlight" className="font-mono">
                            <Command.Input
                                autoFocus
                                placeholder="Search apps, commands, skills..."
                                className="w-full bg-transparent text-foreground text-sm px-4 py-3 outline-none border-b border-white/5 placeholder:text-muted-foreground"
                            />
                            <Command.List className="max-h-[320px] overflow-auto p-2">
                                <Command.Empty className="text-xs text-muted-foreground text-center py-6">
                                    No results.
                                </Command.Empty>

                                <Command.Group
                                    heading="Apps"
                                    className="text-[10px] tracking-[0.3em] text-muted-foreground/70 px-2 py-1"
                                >
                                    {(Object.keys(APPS) as AppId[]).map((id) => {
                                        const A = APPS[id];
                                        const Icon = A.icon;
                                        return (
                                            <Command.Item
                                                key={id}
                                                value={`open ${A.name}`}
                                                onSelect={() => {
                                                    open(id);
                                                    setPalette(false);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer data-[selected=true]:bg-primary/20 data-[selected=true]:text-foreground text-muted-foreground"
                                            >
                                                <Icon size={14} />
                                                Open {A.name}
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>

                                <Command.Group
                                    heading="Commands"
                                    className="text-[10px] tracking-[0.3em] text-muted-foreground/70 px-2 py-1 mt-2"
                                >
                                    <Command.Item
                                        value="download resume pdf cv"
                                        onSelect={() => {
                                            // Static-export safe: trigger a download
                                            // of the prebuilt /resume.pdf via a
                                            // synthetic anchor click — no server.
                                            const a = document.createElement("a");
                                            a.href = "/resume.pdf";
                                            a.download = "";
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            setPalette(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer data-[selected=true]:bg-primary/20 data-[selected=true]:text-foreground text-muted-foreground"
                                    >
                                        <FileDown size={14} />
                                        Download résumé (PDF)
                                    </Command.Item>
                                    <Command.Item
                                        value="copy email"
                                        onSelect={() => {
                                            navigator.clipboard?.writeText(resumeData.email);
                                            setPalette(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer data-[selected=true]:bg-primary/20 data-[selected=true]:text-foreground text-muted-foreground"
                                    >
                                        <Mail size={14} />
                                        Copy email — {resumeData.email}
                                    </Command.Item>
                                    <Command.Item
                                        value="visit linkedin"
                                        onSelect={() => {
                                            window.open(resumeData.linkedin, "_blank", "noopener");
                                            setPalette(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer data-[selected=true]:bg-primary/20 data-[selected=true]:text-foreground text-muted-foreground"
                                    >
                                        Visit LinkedIn
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group
                                    heading="Skills"
                                    className="text-[10px] tracking-[0.3em] text-muted-foreground/70 px-2 py-1 mt-2"
                                >
                                    {[
                                        ...resumeData.skills.languages,
                                        ...resumeData.skills.frameworks,
                                        ...resumeData.skills.databases,
                                    ].map((skill) => (
                                        <Command.Item
                                            key={skill}
                                            value={skill}
                                            onSelect={() => {
                                                open("stack");
                                                setPalette(false);
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer data-[selected=true]:bg-primary/20 data-[selected=true]:text-foreground text-muted-foreground"
                                        >
                                            {skill}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            </Command.List>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
