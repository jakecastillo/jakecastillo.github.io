"use client";

import { motion } from "framer-motion";
import {
    Boxes,
    Cloud,
    Database,
    GitBranch,
    Activity,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { DUR, EASE } from "@/components/motion";

// A representative architecture sketch — not a real system diagram of any one
// project. It pictures the philosophy AS A CIRCUIT (jc-wpd): one violet trace
// carries the beam in through Edge and out through Data; the platform layers
// sit as etched nodes threaded ON the trace; a short drop connects the one
// glowing "bet" module (the risky/innovative piece) behind its clean seam.
// CI/CD + security (top) and observability (bottom) remain full-width bands
// wrapping the platform. Illustrative only.
const platform: { label: string; icon: LucideIcon }[] = [
    { label: "Edge", icon: Cloud },
    { label: "App", icon: Boxes },
    { label: "Services / API", icon: GitBranch },
    { label: "Data", icon: Database },
];

// Shared trace paint — the sanctioned violet, dimming toward its exit.
const TRACE_H = {
    background:
        "linear-gradient(90deg, rgba(139,92,246,0.9), rgba(139,92,246,0.35))",
    boxShadow: "0 0 10px 1px rgba(139,92,246,0.4)",
} as const;
const TRACE_V = {
    background:
        "linear-gradient(180deg, rgba(139,92,246,0.9), rgba(139,92,246,0.35))",
    boxShadow: "0 0 10px 1px rgba(139,92,246,0.4)",
} as const;

// Explicit initial/whileInView (NOT variants): the schematic is nested inside
// ActPhilosophy's variant-driven reveal wrapper, and named variants here would
// inherit that container's animation state — including the useReveal instant
// path, which animates to an inline target that never propagates and would
// strand variant children at `hidden`. Explicit props opt out of propagation.
// once:true so the drawn circuit never un-draws; MotionProvider's
// reducedMotion="user" strips the transform tween, so reduced-motion users see
// the trace snap straight to its final drawn state.
const draw = (axis: "x" | "y", delay = 0) => ({
    initial: axis === "x" ? { scaleX: 0 } : { scaleY: 0 },
    whileInView: axis === "x" ? { scaleX: 1 } : { scaleY: 1 },
    viewport: { once: true, amount: 0.3 } as const,
    transition: { duration: DUR.slow, ease: EASE, delay },
});

// A cross-cutting concern, drawn as a full-width band that frames the platform.
function Band({
    icon: Icon,
    label,
    tint,
    position,
}: {
    icon: LucideIcon;
    label: string;
    tint: string;
    position: "top" | "bottom";
}) {
    return (
        <div
            className={`flex items-center gap-2.5 bg-surface-overlay/50 px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground ${
                position === "top"
                    ? "border-b border-border-subtle"
                    : "border-t border-border-subtle"
            }`}
        >
            <Icon
                size={14}
                strokeWidth={1.75}
                aria-hidden="true"
                className={`shrink-0 ${tint}`}
            />
            {label}
        </div>
    );
}

export default function ArchitectureSchematic() {
    return (
        <figure
            role="img"
            aria-label="Architecture sketch: one violet beam trace enters the platform at the edge layer, threads through app, services, and data as nodes on the line, and exits after data. A short drop from the trace feeds one isolated, glowing 'the bet' module behind a clean interface. Full-width bands for CI/CD and security above and observability below wrap the whole platform."
            className="panel overflow-hidden p-0"
        >
            {/* Cross-cutting concern — wraps the whole platform */}
            <Band
                icon={GitBranch}
                label="CI/CD · Security"
                tint="text-primary"
                position="top"
            />

            <div aria-hidden="true" className="p-5 sm:p-6">
                {/* The platform row — nodes threaded on the beam trace. */}
                <div className="relative pl-6 sm:pl-0">
                    {/* Vertical trace (stacked layout, < sm): the beam runs down
                        the left rail through every node — matching the beam's
                        vertical snake on mobile. Reaches past the row to the
                        bet module below. */}
                    <motion.span
                        {...draw("y")}
                        className="absolute -bottom-12 top-0 left-[3px] w-px origin-top sm:hidden"
                        style={TRACE_V}
                    />
                    {/* Horizontal trace (sm+): enters at the panel's left edge
                        (before Edge), exits at its right edge (after Data). The
                        negative inset spans the body padding so the line truly
                        enters and exits the panel. */}
                    <motion.span
                        {...draw("x")}
                        className="absolute -left-5 -right-5 top-1/2 hidden h-px origin-left sm:-left-6 sm:-right-6 sm:block"
                        style={TRACE_H}
                    />
                    {/* Entry / exit terminals (sm+) */}
                    <span className="absolute -left-5 top-1/2 hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary sm:-left-6 sm:block" />
                    <span className="absolute -right-5 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/50 sm:-right-6 sm:block" />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        {platform.map((b) => (
                            <div
                                key={b.label}
                                className="relative flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-3 text-sm text-muted-foreground"
                            >
                                {/* Node seat on the mobile vertical trace */}
                                <span className="absolute -left-[24px] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary sm:hidden" />
                                <b.icon
                                    size={16}
                                    strokeWidth={1.75}
                                    className="shrink-0 text-primary/70"
                                />
                                {b.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Drop from the trace down to the bet — the one place the beam
                    leaves the boring platform. Hidden on the stacked layout,
                    where the vertical rail already reaches it. */}
                <div className="relative mx-auto hidden h-6 w-px sm:block">
                    <motion.span
                        {...draw("y", 0.35)}
                        className="absolute inset-0 origin-top"
                        style={TRACE_V}
                    />
                </div>

                {/* The bet — isolated, glowing module behind a clean seam.
                    Stacked label/desc under 480px (no more mid-word wrap);
                    text-balance keeps the description ragged, not torn. */}
                <div className="relative mt-3 pl-6 sm:mt-0 sm:pl-0">
                    <span className="absolute left-[3px] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary sm:hidden" />
                    <div className="flex flex-col gap-1.5 rounded-xl border border-primary/50 bg-primary-muted px-4 py-3 text-sm text-foreground glow-primary min-[480px]:flex-row min-[480px]:items-center min-[480px]:gap-3">
                        <span className="flex shrink-0 items-center gap-2 font-medium">
                            {/* Lock-pulse: the live node on the circuit. The
                                global reduced-motion rules hold it static. */}
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                            </span>
                            <Sparkles
                                size={16}
                                strokeWidth={1.75}
                                className="shrink-0 text-primary"
                            />
                            The bet
                        </span>
                        <span className="min-w-0 text-balance text-subtle-foreground">
                            — the risky, high-value piece, proven behind a clean
                            interface
                        </span>
                    </div>
                </div>
            </div>

            {/* Cross-cutting concern — wraps the whole platform */}
            <Band
                icon={Activity}
                label="Observability"
                tint="text-muted-foreground"
                position="bottom"
            />
        </figure>
    );
}
