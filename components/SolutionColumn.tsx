"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
    BrainCircuit,
    MonitorSmartphone,
    Boxes,
    ShieldCheck,
    Server,
    type LucideIcon,
} from "lucide-react";
import { DUR, EASE } from "@/components/motion";

// THE WHOLE COLUMN (jc-g6e): the owner owns the entire vertical of a software
// solution and invents at the frontier. This is NOT the Skills prism (tech
// tags) and NOT the ProcessSpine (method) — it shows SPAN + where he innovates.
// Generalized on purpose (universal layers, zero client/project names —
// confidentiality) yet impactful: it claims the whole column and marks the one
// place the real bet lives. Frontier at the top, foundation at the bottom; one
// violet beam threads the stack down the left, lighting each layer as it passes
// — the same rail-draw + seated-node language as ProcessSpine so the two read
// as siblings, not two worlds in one act.

// [copy — owner approval pending] — generalized decorative system-speak; no
// client names, no numbers, no claims. Top → bottom = frontier → foundation.
const layers: {
    label: string;
    descriptor: string;
    icon: LucideIcon;
    bet?: boolean;
}[] = [
    {
        label: "INTELLIGENCE",
        descriptor: "applied AI · agents",
        icon: BrainCircuit,
        bet: true,
    },
    {
        label: "PRODUCT",
        descriptor: "the interface people use",
        icon: MonitorSmartphone,
    },
    { label: "SYSTEMS", descriptor: "services · data · APIs", icon: Boxes },
    { label: "SECURITY", descriptor: "compliant by design", icon: ShieldCheck },
    { label: "INFRASTRUCTURE", descriptor: "cloud · automated", icon: Server },
];

// Shared trace paint — the sanctioned violet, dimming as the beam grounds out.
// Lifted verbatim from the retired ArchitectureSchematic so the column's beam
// is the exact same paint the rest of the act uses.
const TRACE_V = {
    background:
        "linear-gradient(180deg, rgba(139,92,246,0.9), rgba(139,92,246,0.35))",
    boxShadow: "0 0 10px 1px rgba(139,92,246,0.4)",
} as const;

// Each node lights just after the drawing beam reaches its fraction: entry
// terminal first (0), then the five layers top→bottom, then the beam grounds.
const nodeDelay = (i: number) => 0.06 + i * 0.12;

export default function SolutionColumn() {
    // Explicit initial/whileInView (NOT variants): SolutionColumn is nested
    // inside ActPhilosophy's variant-driven reveal wrapper, and named variants
    // here would inherit that container's animation state — including the
    // useReveal instant path, which animates to an inline target that never
    // propagates and would strand variant children at `hidden`. Explicit target
    // objects (below) opt out of that propagation entirely.
    //
    // once:true so the drawn beam never un-draws. The node/terminal ignites
    // animate OPACITY only (never a transform) — that keeps their Tailwind
    // centering transforms (`-translate-y-1/2` / `-translate-x-1/2`) intact
    // under framer. Under reduced motion we don't tween at all: the beam renders
    // fully drawn and every node/terminal renders lit, a single identical static
    // frame with zero travel — the exact reduced-motion contract ProcessSpine
    // honours (its dots snap to opacity 1), so the two instruments match.
    const reduced = useReducedMotion();

    const draw = reduced
        ? { initial: false as const, animate: { scaleY: 1 } }
        : {
              initial: { scaleY: 0 },
              whileInView: { scaleY: 1 },
              viewport: { once: true, amount: 0.3 } as const,
              transition: { duration: DUR.slow, ease: EASE },
          };

    const ignite = (delay: number) =>
        reduced
            ? { initial: false as const, animate: { opacity: 1 } }
            : {
                  initial: { opacity: 0.15 },
                  whileInView: { opacity: 1 },
                  viewport: { once: true, amount: 0.3 } as const,
                  transition: { duration: DUR.base, ease: EASE, delay },
              };

    return (
        <figure
            role="img"
            aria-label="Solution column: a single violet beam runs down the left edge and lights five stacked layers of a software solution from the frontier at the top to the foundation at the bottom — Intelligence (applied AI and agents, marked as the bet, where invention lives), Product (the interface people use), Systems (services, data and APIs), Security (compliant by design), and Infrastructure (cloud, automated). The beam enters at the top and grounds into the foundation at the bottom. One thread, every layer: from infrastructure to intelligence, the whole solution is built in one hand — betting where the risk lives."
            className="relative"
        >
            {/* Decorative to AT — the aria-label above carries the full reading. */}
            <div aria-hidden="true" className="relative pl-8 sm:pl-10">
                {/* Faint unlit rail (full height) — the beam's track before it
                    draws, exactly like the ProcessSpine rail. */}
                <span className="pointer-events-none absolute top-2 bottom-2 left-[3px] w-px bg-border-subtle" />
                {/* The beam — violet trace drawing top→bottom on reveal. */}
                <motion.span
                    {...draw}
                    className="pointer-events-none absolute top-2 bottom-2 left-[3px] w-px origin-top"
                    style={TRACE_V}
                />
                {/* Entry terminal — the beam enters at the frontier (top). */}
                <motion.span
                    {...ignite(0)}
                    className="absolute top-2 left-[3.5px] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary glow-primary"
                />
                {/* Grounding terminal — the beam settles into the foundation. */}
                <motion.span
                    {...ignite(nodeDelay(layers.length))}
                    className="absolute bottom-2 left-[3.5px] h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/50"
                />

                <div className="flex flex-col gap-4 sm:gap-5">
                    {layers.map((layer, i) => {
                        const Icon = layer.icon;
                        const isBet = !!layer.bet;
                        return (
                            <div
                                key={layer.label}
                                className={`relative flex items-start gap-3 rounded-xl px-4 ${
                                    isBet
                                        ? "border border-primary/50 bg-primary-muted py-4 glow-primary"
                                        : "border border-border-subtle bg-surface py-3.5"
                                }`}
                            >
                                {/* Seated node dot — centered on the beam at
                                    left-[3px] (rail center ≈ 3.5px; a 10px dot
                                    set back 33.5px / 41.5px lands its center on
                                    the rail at both breakpoints — the exact
                                    ProcessSpine seat). Ignites as the beam passes. */}
                                {isBet ? (
                                    <motion.span
                                        {...ignite(nodeDelay(i))}
                                        className="absolute top-1/2 -left-[33.5px] flex h-2.5 w-2.5 -translate-y-1/2 sm:-left-[41.5px]"
                                    >
                                        {/* Lock-pulse: the live node at the
                                            frontier. Held static under reduced
                                            motion by the global rule. */}
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary glow-primary" />
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        {...ignite(nodeDelay(i))}
                                        className="absolute top-1/2 -left-[33.5px] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-primary glow-primary sm:-left-[41.5px]"
                                    />
                                )}
                                <Icon
                                    size={18}
                                    strokeWidth={1.75}
                                    className={`mt-0.5 shrink-0 ${
                                        isBet ? "text-primary" : "text-primary/70"
                                    }`}
                                />
                                <div className="min-w-0">
                                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-foreground">
                                        {layer.label}
                                    </p>
                                    <p className="mt-1 text-sm text-subtle-foreground">
                                        {layer.descriptor}
                                    </p>
                                    {/* [copy — owner approval pending] */}
                                    {isBet && (
                                        <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-primary [overflow-wrap:anywhere]">
                                            the bet — where invention lives
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* [copy — owner approval pending] */}
            <figcaption className="mt-8 sm:mt-10">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-primary/80">
                    the whole column
                </p>
                <p className="measure-narrow mt-3 text-balance text-base leading-relaxed text-muted-foreground">
                    One thread, every layer. From infrastructure to
                    intelligence, I build the whole solution — and bet where the
                    risk lives.
                </p>
            </figcaption>
        </figure>
    );
}
