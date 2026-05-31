"use client";

import { Command } from "cmdk";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { APPS } from "./config/apps";
import { resumeData } from "@/data/resume";

export default function Palette() {
    const paletteOpen = useDesktopStore((s) => s.paletteOpen);
    const setPalette = useDesktopStore((s) => s.setPalette);
    const open = useDesktopStore((s) => s.open);

    useEffect(() => {
        if (!paletteOpen) return;
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPalette(false);
        };
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
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
                        initial={{ scale: 0.95, y: -8, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -8, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-[min(520px,90vw)] rounded-xl border border-white/10 bg-[#0a0a18]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
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
                                        value="copy email"
                                        onSelect={() => {
                                            navigator.clipboard?.writeText(resumeData.email);
                                            setPalette(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer data-[selected=true]:bg-primary/20 data-[selected=true]:text-foreground text-muted-foreground"
                                    >
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
