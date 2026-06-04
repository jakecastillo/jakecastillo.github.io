"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBootStore } from "@/store/useBootStore";

const BASE_LOGS = [
    "[  OK  ] Started Kernel Logging Service.",
    "[  OK  ] Reached target System Initialization.",
    "[  OK  ] Listening on Load Balancing Socket.",
    "[  OK  ] Started Network Manager.",
    "[  OK  ] Started WPA supplicant.",
    "[  OK  ] Reached target Network.",
    "[  OK  ] Secure perimeter established.",
    "Mounting /sys/kernel/debug...",
    "[  OK  ] Mounted /sys/kernel/debug.",
    "Starting WebGL Context Initialization...",
    "[  OK  ] Started WebGL Context Initialization.",
    "Starting Quantum Orb Subroutine...",
    "Starting Liquid Glass Shaders...",
    "[  OK  ] Compiled PBR Shaders.",
    "Generating Displacement Maps...",
    "Synchronizing Animation Frame Loop...",
    "[  OK  ] Resolved texture dependencies.",
    "Mounting DOM Nodes...",
];

export default function QuantumLoader() {
    const storeSetPhase = useBootStore((s) => s.setPhase);
    const storePhase = useBootStore((s) => s.phase);
    const [localPhase, setLocalPhase] = useState<"loading" | "booting">("loading");
    const [logs, setLogs] = useState<string[]>(["Initializing boot sequence..."]);
    const containerRef = useRef<HTMLDivElement>(null);

    const [displayProgress, setDisplayProgress] = useState(0);
    // The boot loader is intentionally time-based: <Scene/> is deferred behind
    // SceneLoader's idle callback and only fades in at the reveal phase, so there
    // is no in-flight Canvas Suspense load to gate on while the terminal paints.
    // A fixed minimum dwell gives the boot CRT its beat without ever hanging.
    const minLoadTimeMs = 500;
    const startTimeRef = useRef(0);
    // Set when the skip fast-path or reduced-motion guard short-circuits the boot.
    // The loading interval reads this each tick and bails, so it can never revert
    // a later phase (reveal/ready) back to "booting". A ref (not state) is used so
    // we never call setState synchronously inside an effect body.
    const fastPathRef = useRef(false);

    // Honor ?skip=1 (and deep-links) fast-path boot parameter. Mark the fast path
    // so the loading interval bails and never clobbers "reveal" back to "booting".
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("skip") === "1" || params.has("open") || params.has("focus")) {
            fastPathRef.current = true;
            storeSetPhase("reveal");
            const id = setTimeout(() => storeSetPhase("ready"), 800);
            return () => clearTimeout(id);
        }
    }, [storeSetPhase]);

    // Reduced-motion users skip the boot entirely; any interaction skips it too.
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            // Mark the fast path so the loading interval can't revert to "booting"
            // and replay the full reveal->ready animation over the live desktop.
            fastPathRef.current = true;
            storeSetPhase("ready");
            return;
        }
        const skip = () => {
            if (useBootStore.getState().phase !== "ready") {
                fastPathRef.current = true;
                storeSetPhase("ready");
            }
        };
        window.addEventListener("pointerdown", skip);
        window.addEventListener("keydown", skip);
        window.addEventListener("wheel", skip, { passive: true });
        return () => {
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("keydown", skip);
            window.removeEventListener("wheel", skip);
        };
    }, [storeSetPhase]);

    // Simulate progress and logs (time-based; see minLoadTimeMs note above).
    useEffect(() => {
        if (localPhase !== "loading") return;
        if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
        }

        const interval = setInterval(() => {
            // A fast path (skip / reduced-motion / interaction) already drove the
            // phase forward — stop here so we never revert it to "booting".
            if (fastPathRef.current) {
                clearInterval(interval);
                return;
            }

            const elapsed = Date.now() - startTimeRef.current;
            const timeProgress = Math.min((elapsed / minLoadTimeMs) * 100, 100);
            setDisplayProgress(timeProgress);

            setLogs((prev) => {
                if (Math.random() > 0.7) return prev;
                const newLog = BASE_LOGS[Math.floor(Math.random() * BASE_LOGS.length)];
                return [...prev, newLog].slice(-30);
            });

            // Hand off to the booting beat once the minimum dwell has elapsed.
            if (elapsed >= minLoadTimeMs) {
                clearInterval(interval);
                setLocalPhase("booting");
                storeSetPhase("booting");
            }
        }, 80);

        return () => clearInterval(interval);
    }, [localPhase, storeSetPhase]);

    // Handle booting phase text sequence
    useEffect(() => {
        if (localPhase !== "booting") return;

        const ids: ReturnType<typeof setTimeout>[] = [];
        ids.push(setTimeout(() => setLogs(p => [...p, "[  OK  ] All services started successfully."]), 80));
        ids.push(setTimeout(() => setLogs(p => [...p, "$ login --user jake"]), 200));
        ids.push(setTimeout(() => setLogs(p => [...p, "welcome back, jake_"]), 360));
        ids.push(setTimeout(() => storeSetPhase("reveal"), 480));
        ids.push(setTimeout(() => storeSetPhase("ready"), 1000));

        return () => {
            ids.forEach((id) => clearTimeout(id));
        };
    }, [localPhase, storeSetPhase]);

    // Scroll to bottom of logs when new ones arrive
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs]);

    // Helper to format logs (makes "[  OK  ]" green)
    const formatLog = (log: string, index: number) => {
        if (log.startsWith("[  OK  ]")) {
            return (
                <div key={index} className="opacity-90 flex gap-2">
                    <span className="text-foreground/50">[</span>
                    <span className="text-accent font-bold">  OK  </span>
                    <span className="text-foreground/50">]</span>
                    <span className="text-muted-foreground">{log.substring(8)}</span>
                </div>
            );
        }
        if (log.startsWith("$ ")) {
            // command echo — laser violet
            return (
                <div key={index} className="opacity-90 text-primary">
                    {log}
                </div>
            );
        }
        if (log.startsWith("welcome")) {
            // login confirmation — cyan with glow
            return (
                <div
                    key={index}
                    className="text-accent"
                    style={{ textShadow: "0 0 12px rgba(34,211,238,0.45)" }}
                >
                    {log}
                </div>
            );
        }
        return (
            <div key={index} className="opacity-90 text-muted-foreground">
                {log}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {storePhase !== "ready" && storePhase !== "reveal" && (
                <motion.div
                    // No shared-layout morph: there is no destination element with
                    // a matching layoutId, so a lone layoutId here only drove a
                    // spurious layout transition that re-inflated the overlay and
                    // stalled AnimatePresence's unmount. The overlay simply fades.
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden bg-[#020617] font-mono text-sm sm:text-base"
                    // Exit fully to opacity 0 (not 0.0001) so AnimatePresence fires
                    // exit-complete and unmounts the fixed z-50 node promptly.
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    {/* Background terminal overlay */}
                    <div
                        ref={containerRef}
                        className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-end overflow-hidden"
                    >
                        {logs.map((log, i) => formatLog(log, i))}

                        {localPhase === "loading" && (
                            <div className="mt-4 border-t border-white/10 pt-4 flex items-center gap-4 text-muted-foreground">
                                <span className="font-bold text-primary">root@system:~#</span>
                                <div className="flex-1 h-1 bg-white/5 overflow-hidden relative rounded-full">
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary to-accent"
                                        style={{ width: `${displayProgress}%`, transition: "width 0.1s linear" }}
                                    />
                                </div>
                                <span className="text-accent/70">[{Math.floor(displayProgress)}%]</span>
                            </div>
                        )}
                    </div>

                    {/* CRT scanline overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.12]"
                        style={{
                            background: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(34,211,238,0.04), rgba(139,92,246,0.03))",
                            backgroundSize: "100% 2px, 100% 100%"
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
