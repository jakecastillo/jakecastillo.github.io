"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useBeamStore } from "@/hooks/useBeamStore";

/**
 * The beam's first DOM segment: a hairline that draws itself under the hero
 * name the moment the boot ignition hands off. Reduced motion renders it
 * fully drawn (static end-state), matching the site-wide equivalency rule.
 */
export default function HeroUnderline() {
    const bootDone = useBeamStore((s) => s.bootDone);
    const reduced = useReducedMotion();
    const drawn = reduced || bootDone;

    return (
        <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ scaleX: drawn ? 1 : 0 }}
            transition={
                reduced
                    ? { duration: 0 }
                    : { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
            }
            className="absolute -bottom-1.5 left-0 h-px w-full origin-left bg-gradient-to-r from-primary via-primary-hover to-transparent shadow-[0_0_12px_1px_rgba(139,92,246,0.6)]"
        />
    );
}
