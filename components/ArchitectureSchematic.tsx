"use client";

import {
    Boxes,
    Cloud,
    Database,
    GitBranch,
    Activity,
    Sparkles,
} from "lucide-react";

// A representative architecture sketch — not a real system diagram of any one
// project. It pictures the philosophy: a proven "boring" platform with one
// isolated, glowing "bet" (the risky/innovative piece) behind a clean seam,
// wrapped by CI/CD+security and observability. Illustrative only.
const platform = [
    { label: "Edge", icon: Cloud },
    { label: "App", icon: Boxes },
    { label: "Services / API", icon: GitBranch },
    { label: "Data", icon: Database },
];

export default function ArchitectureSchematic() {
    return (
        <figure
            role="img"
            aria-label="Architecture sketch: a proven platform — edge, app, services, and data — wrapped by CI/CD and security above and observability below, with one isolated, highlighted 'the bet' module behind a clean interface."
            className="panel p-6 sm:p-8"
        >
            {/* Top rail — CI/CD · Security */}
            <p
                aria-hidden="true"
                className="mb-4 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-subtle-foreground"
            >
                <GitBranch size={13} strokeWidth={1.75} className="text-primary" />{" "}
                CI/CD · Security
            </p>

            <div
                aria-hidden="true"
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
                {platform.map((b) => (
                    <div
                        key={b.label}
                        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface/60 px-3 py-3 text-sm text-muted-foreground"
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

            {/* The bet — isolated, accent-glowing module behind a seam */}
            <div
                aria-hidden="true"
                className="mt-3 flex items-center gap-3 rounded-lg border border-primary/50 bg-primary-muted px-3 py-3 text-sm text-foreground glow-primary"
            >
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

            {/* Bottom rail — Observability */}
            <p
                aria-hidden="true"
                className="mt-4 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-subtle-foreground"
            >
                <Activity size={13} strokeWidth={1.75} className="text-accent" />{" "}
                Observability
            </p>
        </figure>
    );
}
