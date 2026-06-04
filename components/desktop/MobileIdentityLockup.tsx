"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND } from "./config/brand";

/**
 * MobileIdentityLockup — mobile's one-time brand crescendo (R6).
 *
 * Mobile previously had NO hero beat: the desktop IdentityLockup +
 * SignatureStrapline are both mounted only in DesktopShell, and the POV line
 * was buried inside About. This is a COMPACT variant of IdentityLockup — same
 * staggered name -> role -> signature stack and the same reduced-motion static
 * path — tuned for a phone:
 *
 *   - Sizes step down (no md:text-7xl); the stack still reads as a beat.
 *   - The desktop full-screen radial VIGNETTE is DROPPED. Instead this renders
 *     a lighter scrim centered WITHIN <main> (it is `absolute inset-0` and the
 *     caller mounts it inside <main>), so it can never overlay the 36px top bar
 *     or the 64px bottom tab row. The orb scrim already owns the background, so
 *     this is NOT a third backdrop layer — just a soft local calm behind the
 *     text so the signature line lands as the one POV hit.
 *
 * Gating: the caller (MobileShell) only mounts this while isInteractive ===
 * "reveal", so the component owns just its own dwell + self-dismiss. It is
 * ALWAYS pointer-events:none + select-none + aria-hidden, and unmounts on
 * dismiss, so it can never trap a tab tap, a swipe, or scroll even mid-fade.
 *
 * prefers-reduced-motion: render statically (no sweep, no blur, no stagger,
 * shorter dwell) and clear on a plain fade.
 */
export default function MobileIdentityLockup() {
    // Resolve prefers-reduced-motion once, lazily, so it is stable for both the
    // dwell timing and the exit transition (mirrors IdentityLockup).
    const [reduced] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const [visible, setVisible] = useState(false);

    // Show on mount (the caller gates mounting on the reveal phase), hold for a
    // dwell, then self-dismiss. A genuine user gesture dismisses early so the
    // beat never blocks the first tab tap / swipe.
    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));

        // Shorter dwell than desktop — mobile attention is briefer and the
        // stack is smaller. Reduced-motion clears sooner with a plain fade.
        const dwell = reduced ? 1800 : 2800;
        const timer = setTimeout(() => setVisible(false), dwell);

        const skip = (e: Event) => {
            if (!e.isTrusted) return;
            setVisible(false);
        };
        // Attach dismiss listeners after a short grace so the beat always reads
        // (matches IdentityLockup's isTrusted + grace guard).
        const graceId = setTimeout(() => {
            window.addEventListener("pointerdown", skip);
            window.addEventListener("touchstart", skip, { passive: true });
            window.addEventListener("keydown", skip);
        }, 600);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timer);
            clearTimeout(graceId);
            window.removeEventListener("pointerdown", skip);
            window.removeEventListener("touchstart", skip);
            window.removeEventListener("keydown", skip);
        };
    }, [reduced]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    // absolute inset-0 — scoped to the <main> the caller mounts
                    // it inside, NOT fixed to the viewport, so it can never
                    // overlay the top bar or tab row. z above the stacked app
                    // tabs (z 0/1) but it is pointer-events:none regardless.
                    className="pointer-events-none absolute inset-0 z-20 flex select-none flex-col items-center justify-center px-6 text-center"
                    // Lighter LOCAL scrim than the desktop vignette: a soft dark
                    // radial calm behind the text only, fading to transparent
                    // before the edges so the revealed orb/void still breathe.
                    // Tinted to the scene void (#020617), no hard edge.
                    style={{
                        background:
                            "radial-gradient(circle at center, rgba(2,6,23,0.62) 0%, rgba(2,6,23,0.34) 55%, rgba(2,6,23,0) 100%)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={
                        reduced
                            ? { opacity: 0 }
                            : { opacity: 0, y: -12, filter: "blur(10px)" }
                    }
                    transition={{
                        duration: reduced ? 0.3 : 0.6,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    aria-hidden="true"
                >
                    <motion.h1
                        className="font-display text-4xl font-bold tracking-tighter text-foreground sm:text-5xl"
                        initial={reduced ? false : { opacity: 0, y: 12 }}
                        animate={reduced ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        style={
                            reduced
                                ? undefined
                                : {
                                      // One-shot violet->cyan glow sweep (same
                                      // keyframes as the desktop lockup).
                                      animation:
                                          "identity-sweep-mobile 1.5s ease-out forwards",
                                  }
                        }
                    >
                        {BRAND.name}
                    </motion.h1>
                    <motion.p
                        className="mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={reduced ? undefined : { opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: reduced ? 0 : 0.3,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {BRAND.role}
                    </motion.p>
                    <motion.p
                        className="mt-4 max-w-[24ch] font-display text-base tracking-tight text-foreground/90 sm:text-lg"
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={reduced ? undefined : { opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: reduced ? 0 : 0.6,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {BRAND.signature}
                    </motion.p>

                    {/* Scoped keyframes for the one-shot violet->cyan sweep.
                        Kept colored (violet/cyan glows, never black shadows) to
                        honor the VOID/LASER system. Named distinctly from the
                        desktop lockup's keyframes to avoid any global clash. */}
                    <style jsx>{`
                        @keyframes identity-sweep-mobile {
                            0% {
                                text-shadow: 0 0 0 rgba(139, 92, 246, 0);
                            }
                            35% {
                                text-shadow: 0 0 22px rgba(139, 92, 246, 0.55);
                            }
                            70% {
                                text-shadow: 0 0 22px rgba(34, 211, 238, 0.5);
                            }
                            100% {
                                text-shadow: 0 0 12px rgba(34, 211, 238, 0.25);
                            }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
