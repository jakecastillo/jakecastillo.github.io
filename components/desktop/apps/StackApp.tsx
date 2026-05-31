"use client";

import { useState } from "react";
import { resumeData } from "@/data/resume";

const TABS = [
    { id: "skills", label: "Skills" },
    { id: "certs", label: "Certifications" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SKILL_GROUPS: { title: string; key: keyof typeof resumeData.skills }[] = [
    { title: "LANGUAGES", key: "languages" },
    { title: "FRAMEWORKS", key: "frameworks" },
    { title: "CLOUD", key: "platforms" },
    { title: "DATABASES", key: "databases" },
    { title: "PRACTICES", key: "practices" },
    { title: "ROLES", key: "roles" },
];

export default function StackApp() {
    const [tab, setTab] = useState<TabId>("skills");

    return (
        <div className="p-6 font-mono text-sm space-y-5">
            <header className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight text-foreground">Technical Arsenal</h2>
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
                <div className="grid grid-cols-2 gap-4">
                    {SKILL_GROUPS.map((g) => (
                        <div key={g.key}>
                            <h3 className="text-[10px] tracking-[0.3em] text-accent mb-2 border-l-2 border-primary pl-2">
                                {g.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {resumeData.skills[g.key].map((s) => (
                                    <span
                                        key={s}
                                        className="px-2 py-0.5 text-[11px] border border-border/50 rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === "certs" && (
                <div className="space-y-3">
                    {resumeData.certifications.map((c) => (
                        <div
                            key={c.name}
                            className="p-3 rounded-md border border-border/40 bg-background/40"
                        >
                            <h3 className="font-bold text-foreground">{c.name}</h3>
                            <p className="text-xs text-muted-foreground">
                                {c.issuer} · {c.issued} – {c.expires}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
