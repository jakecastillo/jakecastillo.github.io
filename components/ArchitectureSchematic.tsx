"use client";

import {
    Boxes,
    Cloud,
    Database,
    GitBranch,
    Activity,
    Sparkles,
    type LucideIcon,
} from "lucide-react";

// A representative architecture sketch — not a real system diagram of any one
// project. It pictures the philosophy: a proven "boring" platform with one
// isolated, glowing "bet" (the risky/innovative piece) behind a clean seam.
// CI/CD + security (top) and observability (bottom) are full-width BANDS that
// visibly wrap the platform, so they read as cross-cutting concerns applied to
// everything inside the system — not floating labels. Illustrative only.
const platform: { label: string; icon: LucideIcon }[] = [
    { label: "Edge", icon: Cloud },
    { label: "App", icon: Boxes },
    { label: "Services / API", icon: GitBranch },
    { label: "Data", icon: Database },
];

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
            aria-label="Architecture sketch: a proven platform — edge, app, services, and data — wrapped by full-width bands for CI/CD and security above and observability below, with one isolated, highlighted 'the bet' module behind a clean interface."
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
                {/* The proven, "boring" platform */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {platform.map((b) => (
                        <div
                            key={b.label}
                            className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface/60 px-3 py-3 text-sm text-muted-foreground"
                        >
                            <b.icon
                                size={16}
                                strokeWidth={1.75}
                                className="shrink-0 text-muted-foreground"
                            />
                            {b.label}
                        </div>
                    ))}
                </div>

                {/* The bet — isolated, accent-glowing module behind a clean seam */}
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/50 bg-primary-muted px-3 py-3 text-sm text-foreground glow-primary">
                    <Sparkles
                        size={16}
                        strokeWidth={1.75}
                        className="shrink-0 text-primary"
                    />
                    <span className="font-medium">The bet</span>
                    <span className="text-subtle-foreground">
                        — the risky, high-value piece, proven behind a clean interface
                    </span>
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
