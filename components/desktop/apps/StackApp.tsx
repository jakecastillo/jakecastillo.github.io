"use client";

import { useState } from "react";
import { resumeData } from "@/data/resume";
import AppCanvas from "@/components/desktop/AppCanvas";

const TABS = [
    { id: "skills", label: "Skills" },
    { id: "certs", label: "Certifications" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type SkillKey = keyof typeof resumeData.skills;

interface SkillGroup {
    title: string;
    key: SkillKey;
    /** Primary (lead) skills/roles to emphasize over the muted remainder. */
    primary: string[];
}

/**
 * Lead skills/roles are emphasized (larger + brighter accent border + glow);
 * everything else is demoted to muted secondary chips. This introduces a light
 * visual tier so the densest panel reads with editorial hierarchy instead of a
 * flat wall of uniform pills. `primary` entries are matched against the data —
 * anything absent simply falls through to the secondary tier, so the data file
 * stays the single source of truth.
 */
const SKILL_GROUPS: SkillGroup[] = [
    { title: "LANGUAGES", key: "languages", primary: ["TypeScript", "JavaScript"] },
    { title: "FRAMEWORKS", key: "frameworks", primary: ["React", "Next.js", "NestJS", "Node.js"] },
    { title: "CLOUD", key: "platforms", primary: ["AWS (infrastructure design)"] },
    { title: "DATABASES", key: "databases", primary: ["PostgreSQL"] },
    { title: "PRACTICES", key: "practices", primary: [] },
    { title: "ROLES", key: "roles", primary: ["Integration Architect", "Solutions Architect", "Tech Lead"] },
];

function partition(items: string[], primary: string[]) {
    const lead = items.filter((s) => primary.includes(s));
    const rest = items.filter((s) => !primary.includes(s));
    return { lead, rest };
}

export default function StackApp() {
    const [tab, setTab] = useState<TabId>("skills");

    return (
        <AppCanvas wide className="font-mono text-sm space-y-6">
            <header className="flex items-center justify-between">
                <h2 className="font-display text-xl font-black tracking-tight text-foreground">
                    Technical Arsenal
                </h2>
                <div className="flex gap-1 text-[11px]">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-3 py-1 rounded-full border transition-colors ${
                                tab === t.id
                                    ? "border-accent text-accent"
                                    : "border-border/40 text-muted-foreground hover:border-foreground/40"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </header>

            {tab === "skills" && (
                <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
                    {SKILL_GROUPS.map((g) => {
                        const { lead, rest } = partition(resumeData.skills[g.key], g.primary);
                        return (
                            <section key={g.key} className="space-y-3">
                                <h3 className="font-display text-[10px] font-bold tracking-[0.3em] text-accent border-l-2 border-primary pl-2">
                                    {g.title}
                                </h3>

                                {/* PRIMARY tier — larger, brighter, glow */}
                                {lead.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {lead.map((s) => (
                                            <span
                                                key={s}
                                                className="font-display px-3 py-1 text-[13px] font-bold leading-none border border-primary/50 bg-primary-muted text-foreground rounded-full shadow-[var(--shadow-glow)] transition-colors hover:border-primary motion-safe:active:scale-[0.98]"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* SECONDARY tier — muted, demoted */}
                                {rest.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {rest.map((s) => (
                                            <span
                                                key={s}
                                                className="px-2 py-0.5 text-[11px] border border-border/50 rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors motion-safe:active:scale-[0.98]"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {tab === "certs" && (
                <div className="space-y-3">
                    <div className="font-display text-[10px] tracking-[0.3em] text-accent border-l-2 border-primary pl-2">{`// TRUST_STORE`}</div>
                    {resumeData.certifications.map((c) => (
                        <div
                            key={c.name}
                            className="p-3 rounded-md border border-border/40 bg-background/40"
                        >
                            <h3 className="font-display font-bold text-foreground">{c.name}</h3>
                            <p className="text-xs text-muted-foreground">
                                {c.issuer} · {c.issued} – {c.expires}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </AppCanvas>
    );
}
