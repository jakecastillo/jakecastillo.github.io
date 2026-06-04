"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useBootStore } from "@/store/useBootStore";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getFlag, setFlag, SPOTLIGHT_HINT_SEEN } from "@/lib/firstRun";
import { isSoundOn, setSoundOn } from "@/lib/sound";
import NowWidget from "./NowWidget";
import Wordmark from "./Wordmark";
import { APPS } from "./config/apps";
import { BRAND } from "./config/brand";
import { windowPhysics } from "@/lib/windowPhysics";

const MENUS = ["File", "Edit", "View"];

export default function Menubar() {
    const phase = useBootStore((s) => s.phase);
    const focusedId = useDesktopStore((s) => s.focusedId);
    const setPalette = useDesktopStore((s) => s.setPalette);
    const paletteOpen = useDesktopStore((s) => s.paletteOpen);
    const restoreMaximized = useDesktopStore((s) => s.restoreMaximized);
    const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

    // Platform-aware shortcut label. Read after mount so the SSR/build-time HTML
    // (no `navigator`) and the first client paint agree — no hydration mismatch.
    const [shortcut, setShortcut] = useState("⌘K");
    // First-visit hint pulse. Gated on a localStorage flag read in useEffect so
    // the static export hydrates cleanly; pulse stops once the palette opens.
    const [pulse, setPulse] = useState(false);
    // R9 sound opt-in (default OFF). Mirrors the SPOTLIGHT_HINT_SEEN flag pattern:
    // the value is read post-mount so the build-time HTML (storage-less) and the
    // first client paint agree — the button renders muted on the server and only
    // flips on if the user has previously opted in.
    const [soundOn, setSoundOnState] = useState(false);

    useEffect(() => {
        // Defer the client-only reads through a callback so the effect body
        // doesn't call setState synchronously (matches the NowWidget pattern).
        const hydrateFromClient = () => {
            const isMac = /mac|iphone|ipad|ipod/i.test(
                navigator.platform || navigator.userAgent,
            );
            setShortcut(isMac ? "⌘K" : "Ctrl K");
            setPulse(!getFlag(SPOTLIGHT_HINT_SEEN));
            setSoundOnState(isSoundOn());
        };
        hydrateFromClient();
    }, []);

    // Kill the hint permanently the first time the palette opens.
    useEffect(() => {
        if (!paletteOpen || !pulse) return;
        const dismiss = () => {
            setPulse(false);
            setFlag(SPOTLIGHT_HINT_SEEN, true);
        };
        dismiss();
    }, [paletteOpen, pulse]);

    const showPulse = pulse && !reduceMotion;

    const handleSpotlight = () => {
        if (pulse) {
            setPulse(false);
            setFlag(SPOTLIGHT_HINT_SEEN, true);
        }
        setPalette(true);
    };

    // R9 sound toggle. setSoundOn persists the flag AND (when turning on) unlocks
    // the AudioContext inside this click gesture so the first tick can play
    // immediately. Default-off polish — reduced-motion still silences playback in
    // lib/sound regardless of this flag.
    const handleSoundToggle = () => {
        const next = !soundOn;
        setSoundOn(next);
        setSoundOnState(next);
    };

    const activeName = focusedId ? APPS[focusedId].name : "Desktop";

    // ✦ Tidy: first un-maximize any maximized window so it rejoins physics
    // (maximized windows aren't registered, so Tidy would otherwise leave the
    // rest hidden behind it), then arrange on the next frame once it remounts.
    const handleTidy = () => {
        restoreMaximized();
        // Double rAF: let React commit the un-maximize and run WindowFrame's
        // register effect (which creates the physics body) before we arrange.
        requestAnimationFrame(() =>
            requestAnimationFrame(() => windowPhysics.runTidy()),
        );
    };

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
            <div className="flex min-w-0 items-center gap-4 font-mono text-[11px]">
                <Wordmark size="11px" />
                <span className="shrink-0 whitespace-nowrap text-foreground font-semibold">{activeName}</span>
                {/* Decorative menus are deferred until there is room (lg+) so the
                    32px bar never crowds the right-hand controls at the desktop
                    breakpoint floor (768px). */}
                {MENUS.map((m) => (
                    <span key={m} className="hidden lg:inline whitespace-nowrap text-muted-foreground hover:text-foreground cursor-default">
                        {m}
                    </span>
                ))}
                <button
                    onClick={handleTidy}
                    className="shrink-0 whitespace-nowrap text-accent/90 hover:text-accent transition-colors cursor-pointer"
                    aria-label="Tidy windows into a grid"
                >
                    ✦ Tidy
                </button>
            </div>
            <div className="flex shrink-0 items-center gap-4">
                {/* Terse availability echo (R15). A rationed-cyan status dot
                    (cyan == active/live signal) + label; the dot pulse is
                    motion-safe only so reduced-motion stays static. Deferred to
                    lg+ so the 32px bar never crowds at the 768px desktop floor.
                    Full string from BRAND on hover. Referenced defensively. */}
                {BRAND.availability && (
                    <span
                        className="hidden lg:flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground"
                        title={BRAND.availability}
                    >
                        <span
                            aria-hidden="true"
                            className="w-1.5 h-1.5 rounded-full bg-signal shadow-[0_0_6px_var(--signal)] motion-safe:animate-pulse"
                        />
                        open to work
                    </span>
                )}
                {/* R9 Sound toggle. Default OFF; opt-in synthesized Web Audio
                    (focus + perimeter-seal ticks). aria-pressed reflects state;
                    the lucide glyph swaps muted/active and the accent (cyan ==
                    active signal) lights only when on. Icon-only on narrow bars,
                    label appears from md so the mono register stays tidy. */}
                <button
                    onClick={handleSoundToggle}
                    aria-label={soundOn ? "Mute interface sounds" : "Unmute interface sounds"}
                    aria-pressed={soundOn}
                    title={soundOn ? "Sound on — click to mute" : "Sound off — click to unmute"}
                    className={`flex items-center gap-1.5 font-mono text-[11px] transition-colors cursor-pointer ${
                        soundOn
                            ? "text-accent/90 hover:text-accent"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {soundOn ? (
                        <Volume2 aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
                    ) : (
                        <VolumeX aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
                    )}
                    <span aria-hidden="true" className="hidden lg:inline">
                        Sound
                    </span>
                </button>
                <motion.button
                    onClick={handleSpotlight}
                    aria-label={`Open Spotlight (${shortcut})`}
                    className="group flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground cursor-pointer"
                    animate={
                        showPulse
                            ? {
                                  boxShadow: [
                                      "0 0 0px 0px rgba(139,92,246,0)",
                                      "0 0 10px 1px rgba(139,92,246,0.55)",
                                      "0 0 10px 1px rgba(34,211,238,0.55)",
                                      "0 0 0px 0px rgba(34,211,238,0)",
                                  ],
                                  borderColor: [
                                      "rgba(139,92,246,0.4)",
                                      "rgba(139,92,246,0.8)",
                                      "rgba(34,211,238,0.8)",
                                      "rgba(34,211,238,0.4)",
                                  ],
                              }
                            : {}
                    }
                    transition={
                        showPulse
                            ? { duration: 1.1, repeat: 2, ease: "easeInOut" }
                            : { duration: 0.2 }
                    }
                >
                    <span className="text-accent/80 group-hover:text-accent" aria-hidden="true">
                        ✦
                    </span>
                    <span aria-hidden="true">Spotlight</span>
                    <kbd className="rounded border border-border bg-black/30 px-1 text-[10px] text-muted-foreground/80">
                        {shortcut}
                    </kbd>
                </motion.button>
                <NowWidget />
            </div>
        </motion.div>
    );
}
