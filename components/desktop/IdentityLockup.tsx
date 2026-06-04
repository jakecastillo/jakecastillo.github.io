"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBootStore } from "@/store/useBootStore";
import { BRAND } from "./config/brand";

/**
 * IdentityLockup — the first-frame identity hit, held as a designed hero beat.
 *
 * Driven by useBootStore phase: the moment the boot terminal hands off to
 * "reveal", a centered stack fades in over the freshly revealed desktop. It is
 * deliberately paced so the identity registers as a beat, not a flash:
 *
 *   BRAND.name       — font-display (Space Grotesk), large + tight tracking,
 *                      carrying a one-shot violet->cyan glow sweep.
 *   BRAND.role       — font-mono, uppercase, tracked, muted (the canonical role).
 *   BRAND.signature  — the memorable POV line, a touch larger than the role and
 *                      in text-foreground so it lands as the takeaway.
 *
 * The three lines stagger in, hold for ~3.2s, then exit on a blur + fade-up so
 * the desktop is never blocked. ANY pointerdown/keydown/wheel dismisses it
 * instantly (the same skip pattern QuantumLoader uses), and it is ALWAYS
 * pointer-events:none + unmounts on dismiss so it can never trap dock/menubar
 * clicks even mid-fade.
 *
 * prefers-reduced-motion: render statically (no sweep, no blur, no stagger,
 * shorter ~2s dwell) and clear with a plain fade so reduced-motion users get
 * the identity beat without sustained animation.
 *
 * Mounted only inside DesktopShell, above Scene (z-0) and below Palette (z-60).
 */
export default function IdentityLockup() {
    // Resolve prefers-reduced-motion once, lazily, so the value is stable for
    // both the dismiss timing and the exit transition without an effect write.
    const [reduced] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    const [visible, setVisible] = useState(false);

    // Arm the lockup EXACTLY ONCE the first time boot reaches reveal/ready, then
    // run the dwell timer + dismiss listeners independently of later phase
    // changes. We subscribe to the store directly (deps: [reduced] only) instead
    // of depending on a reactive `phase` value — otherwise the reveal->ready
    // transition (~520ms) would fire this effect's cleanup, clear the timer and
    // listeners, and strand the lockup on screen permanently.
    useEffect(() => {
        let armed = false;
        let cleanupLifecycle = () => {};

        const arm = () => {
            if (armed) return;
            armed = true;

            const raf = requestAnimationFrame(() => setVisible(true));
            // Held hero beat: dwell long enough for all three staggered lines to
            // land and read. Reduced-motion renders statically so it can clear
            // sooner with a plain fade.
            const dwell = reduced ? 2000 : 3200;
            const timer = setTimeout(() => setVisible(false), dwell);
            // A GENUINE user gesture dismisses early. Guard on e.isTrusted so a
            // stray synthetic/programmatic pointer/wheel event fired during mount
            // can't kill the beat (that was collapsing the lockup to a ~0.5s
            // flash), and only attach after a short grace so the beat always reads.
            const skip = (e: Event) => {
                if (!e.isTrusted) return;
                setVisible(false);
            };
            const graceId = setTimeout(() => {
                window.addEventListener("pointerdown", skip);
                window.addEventListener("keydown", skip);
                window.addEventListener("wheel", skip, { passive: true });
            }, 700);

            cleanupLifecycle = () => {
                cancelAnimationFrame(raf);
                clearTimeout(timer);
                clearTimeout(graceId);
                window.removeEventListener("pointerdown", skip);
                window.removeEventListener("keydown", skip);
                window.removeEventListener("wheel", skip);
            };
        };

        const initial = useBootStore.getState().phase;
        if (initial === "reveal" || initial === "ready") arm();
        const unsub = useBootStore.subscribe((s) => {
            if (s.phase === "reveal" || s.phase === "ready") arm();
        });

        return () => {
            unsub();
            cleanupLifecycle();
        };
    }, [reduced]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    // z between desktop chrome (z-10..z-50) and the palette
                    // (z-60). pointer-events:none always — it must never trap
                    // dock/menubar clicks even while fading.
                    className="fixed inset-0 z-[55] flex flex-col items-center justify-center px-6 text-center pointer-events-none select-none"
                    // Focused VOID vignette so the identity hit reads as an
                    // arresting, deliberate beat over the busy desktop — darkest
                    // at center behind the text, fading to transparent at the
                    // edges so the reveal still breathes. Cheaper than a
                    // full-screen backdrop-blur during the heavy reveal frame.
                    style={{
                        background:
                            "radial-gradient(circle at center, rgba(2,6,23,0.86) 0%, rgba(2,6,23,0.55) 52%, rgba(2,6,23,0) 100%)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={
                        reduced
                            ? { opacity: 0 }
                            : { opacity: 0, y: -16, filter: "blur(12px)" }
                    }
                    transition={{
                        duration: reduced ? 0.3 : 0.7,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    aria-hidden="true"
                >
                    <motion.h1
                        className="font-display font-bold text-5xl sm:text-6xl md:text-7xl tracking-tighter text-foreground"
                        initial={reduced ? false : { opacity: 0, y: 14 }}
                        animate={reduced ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={
                            reduced
                                ? undefined
                                : {
                                      // One-shot violet->cyan glow sweep.
                                      animation:
                                          "identity-sweep 1.6s ease-out forwards",
                                  }
                        }
                    >
                        {BRAND.name}
                    </motion.h1>
                    <motion.p
                        className="mt-4 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-muted-foreground"
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={reduced ? undefined : { opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.55,
                            delay: reduced ? 0 : 0.35,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {BRAND.role}
                    </motion.p>
                    <motion.p
                        className="mt-5 font-display text-base sm:text-lg md:text-xl tracking-tight text-foreground/90"
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={reduced ? undefined : { opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.55,
                            delay: reduced ? 0 : 0.7,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {BRAND.signature}
                    </motion.p>

                    {/* Scoped keyframes for the one-shot violet->cyan sweep.
                        Kept colored (violet/cyan glows, never black shadows) to
                        honor the VOID/LASER system. */}
                    <style jsx>{`
                        @keyframes identity-sweep {
                            0% {
                                text-shadow: 0 0 0 rgba(139, 92, 246, 0);
                            }
                            35% {
                                text-shadow: 0 0 28px rgba(139, 92, 246, 0.55);
                            }
                            70% {
                                text-shadow: 0 0 28px rgba(34, 211, 238, 0.5);
                            }
                            100% {
                                text-shadow: 0 0 14px rgba(34, 211, 238, 0.25);
                            }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
