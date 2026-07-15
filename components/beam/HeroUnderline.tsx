"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useBeamStore } from "@/hooks/useBeamStore";

/**
 * The beam's first DOM segment: the hairline under the hero name.
 *
 * Boot relay (bootPlayed): the ignition line LANDS on this exact rect, so
 * this underline mounts already-drawn (scaleX 1) at opacity 0 and crossfades
 * in 1:1 with the boot line's handoff fade — keyed on the `handoff` flag,
 * which BootIgnition raises the instant that CSS fade actually starts, so
 * both halves of the crossfade share one clock. The boot line IS the
 * underline; no second draw.
 *
 * Skip/repeat paths (no boot line on screen): the original self-draw plays.
 * Reduced motion renders it fully drawn (static end-state), matching the
 * site-wide equivalency rule.
 */
export default function HeroUnderline() {
    const bootDone = useBeamStore((s) => s.bootDone);
    const bootPlayed = useBeamStore((s) => s.bootPlayed);
    const handoff = useBeamStore((s) => s.handoff);
    const reduced = useReducedMotion();
    const drawn = reduced || bootDone;

    return (
        <motion.span
            aria-hidden="true"
            initial={false}
            animate={
                bootPlayed
                    ? { scaleX: 1, opacity: handoff ? 1 : 0 }
                    : { scaleX: drawn ? 1 : 0, opacity: 1 }
            }
            transition={
                reduced
                    ? { duration: 0 }
                    : bootPlayed
                      ? { duration: 0.25, ease: "easeOut" }
                      : { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
            }
            className="absolute -bottom-1.5 left-0 h-px w-full origin-left bg-gradient-to-r from-primary via-primary-hover to-transparent shadow-[0_0_12px_1px_rgba(139,92,246,0.6)]"
        />
    );
}
