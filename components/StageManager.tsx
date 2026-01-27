"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stageSections } from "@/data/sections";

export default function StageManager() {
    const [currentAct, setCurrentAct] = useState(stageSections[0]);

    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight;

            // Calculate active section based on proximity to center of viewport
            // simple strategy: check which element is most visible

            let maxVisibility = 0;
            let activeAct = stageSections[0];

            for (const act of stageSections) {
                const element = document.getElementById(act.id);
                if (element) {
                    const rect = element.getBoundingClientRect();

                    // Calculate intersection height
                    const intersectionTop = Math.max(0, rect.top);
                    const intersectionBottom = Math.min(windowHeight, rect.bottom);
                    const visibleHeight = Math.max(0, intersectionBottom - intersectionTop);

                    if (visibleHeight > maxVisibility) {
                        maxVisibility = visibleHeight;
                        activeAct = act;
                    }
                }
            }

            setCurrentAct(activeAct);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed top-12 left-12 z-40 hidden lg:block mix-blend-difference">
            <div className="flex flex-col items-start gap-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentAct.stageLabel}-${currentAct.stageTitle}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col"
                    >
                        <span className="text-[10px] font-mono tracking-[0.4em] text-white/50 mb-1">
                            {currentAct.stageLabel}
                        </span>
                        <span className="text-lg font-black tracking-tighter text-white">
                            {currentAct.stageTitle}
                        </span>
                    </motion.div>
                </AnimatePresence>

                {/* Cinematic Vertical Progress Marker */}
                <div className="w-px h-16 bg-white/10 mt-6 relative">
                    <motion.div
                        className="absolute top-0 left-0 w-full bg-white"
                        initial={{ height: "0%" }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </div>
    );
}
