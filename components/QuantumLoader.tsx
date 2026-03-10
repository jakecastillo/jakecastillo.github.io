"use client";

import { useProgress } from "@react-three/drei";
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
    const { progress, active } = useProgress();
    const setBootComplete = useBootStore((state) => state.setBootComplete);
    const [phase, setPhase] = useState<"loading" | "booting" | "done">("loading");
    const [logs, setLogs] = useState<string[]>(["Initializing boot sequence..."]);
    const containerRef = useRef<HTMLDivElement>(null);

    // We want to enforce a minimum loading time for the cinematic effect
    const [displayProgress, setDisplayProgress] = useState(0);
    const minLoadTimeMs = 2500;
    const startTimeRef = useRef(0);

    // Simulate progress and logs
    useEffect(() => {
        if (phase !== "loading") return;
        if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
        }

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const timeProgress = Math.min((elapsed / minLoadTimeMs) * 100, 100);

            const visualProgress = elapsed > minLoadTimeMs ? Math.max(progress, 100) : timeProgress;
            setDisplayProgress(visualProgress);

            // Add a realistic log line
            setLogs((prev) => {
                // Occasional delay in logs for realism
                if (Math.random() > 0.7) return prev;
                const newLog = BASE_LOGS[Math.floor(Math.random() * BASE_LOGS.length)];
                const newLogs = [...prev, newLog];
                return newLogs.slice(-30);
            });

            // Check for completion
            if ((progress === 100 || !active) && elapsed >= minLoadTimeMs) {
                clearInterval(interval);
                setPhase("booting");
            }
        }, 80);

        return () => clearInterval(interval);
    }, [progress, active, phase]);

    // Handle booting phase text sequence
    useEffect(() => {
        if (phase === "booting") {
            // Sequence of final terminal commands before entering UI
            setTimeout(() => setLogs(p => [...p, ""]), 100);
            setTimeout(() => setLogs(p => [...p, "[  OK  ] All services started successfully."]), 300);
            setTimeout(() => setLogs(p => [...p, "Boot sequence complete."]), 600);
            setTimeout(() => setLogs(p => [...p, "Starting UI session..._"]), 1000);
            // End the sequence
            setTimeout(() => {
                setPhase("done");
                setBootComplete(true);
            }, 1600);
        }
    }, [phase, setBootComplete]);

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
                    <span className="text-white">[</span>
                    <span className="text-green-500 font-bold">  OK  </span>
                    <span className="text-white">]</span>
                    <span className="text-gray-300">{log.substring(8)}</span>
                </div>
            );
        }
        return (
            <div key={index} className="opacity-90 text-gray-300">
                {log}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {phase !== "done" && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden bg-black font-mono text-sm sm:text-base"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    {/* Background terminal overlay */}
                    <div
                        ref={containerRef}
                        className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-end overflow-hidden"
                    >
                        {logs.map((log, i) => formatLog(log, i))}

                        {phase === "loading" && (
                            <div className="mt-4 border-t border-gray-800 pt-4 flex items-center gap-4 text-gray-300">
                                <span className="font-bold text-gray-400">root@system:~#</span>
                                <div className="flex-1 h-1 bg-gray-900 overflow-hidden relative opacity-50">
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-white"
                                        style={{ width: `${displayProgress}%`, transition: "width 0.1s linear" }}
                                    />
                                </div>
                                <span className="opacity-50">[{Math.floor(displayProgress)}%]</span>
                            </div>
                        )}
                    </div>

                    {/* CRT scanline overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                            backgroundSize: "100% 2px, 3px 100%"
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
