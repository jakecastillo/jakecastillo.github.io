"use client";

import { useState } from "react";
import { Check, Copy, Mail, Linkedin, MapPin, Github } from "lucide-react";
import { resumeData } from "@/data/resume";
import { BRAND } from "@/components/desktop/config/brand";
import AppCanvas from "@/components/desktop/AppCanvas";

interface Row {
    key: string;
    label: string;
    /** Cosmetic label shown to the user. */
    displayText: string;
    /** Canonical value used for href + clipboard copy. */
    value: string;
    href?: string;
    icon: typeof Mail;
    copyable: boolean;
}

const rows = (): Row[] => [
    {
        key: "email",
        label: "Email",
        displayText: resumeData.email,
        value: resumeData.email,
        href: `mailto:${resumeData.email}`,
        icon: Mail,
        copyable: true,
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        displayText: "linkedin.com/in/jakecastillo",
        value: resumeData.linkedin,
        href: resumeData.linkedin,
        icon: Linkedin,
        copyable: true,
    },
    {
        key: "github",
        label: "GitHub",
        displayText: "github.com/jakecastillo",
        value: "https://github.com/jakecastillo",
        href: "https://github.com/jakecastillo",
        icon: Github,
        copyable: true,
    },
    {
        key: "location",
        label: "Location",
        displayText: resumeData.location,
        value: resumeData.location,
        icon: MapPin,
        copyable: false,
    },
];

export default function ContactApp() {
    const [copied, setCopied] = useState<string | null>(null);

    const copy = async (key: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // fallback for non-secure contexts
            const ta = document.createElement("textarea");
            ta.value = value;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <AppCanvas className="font-mono text-sm space-y-5">
            <header>
                <div className="text-[10px] tracking-[0.3em] text-accent/70 mb-1">
                    {`/// SECURE_CHANNEL_ESTABLISHED`}
                </div>
                <h2 className="text-xl font-black tracking-tight text-foreground">{resumeData.name}</h2>
                <p className="text-xs text-muted-foreground">{BRAND.role}</p>
            </header>

            <ul className="space-y-2">
                {rows().map((r) => {
                    const Icon = r.icon;
                    return (
                        <li
                            key={r.key}
                            className="flex items-center gap-3 p-3 rounded-md border border-border/40 bg-background/40 hover:border-accent/40 transition-colors motion-safe:active:scale-[0.98]"
                        >
                            <Icon size={16} className="text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] tracking-[0.25em] text-muted-foreground/70">
                                    {r.label}
                                </div>
                                {r.href ? (
                                    <a
                                        href={r.href}
                                        target={r.href.startsWith("http") ? "_blank" : undefined}
                                        rel="noopener noreferrer"
                                        className="text-foreground hover:text-accent transition-colors truncate text-xs block"
                                    >
                                        {r.displayText}
                                    </a>
                                ) : (
                                    <span className="text-foreground text-xs">{r.displayText}</span>
                                )}
                            </div>
                            {r.copyable && (
                                <button
                                    onClick={() => copy(r.key, r.value)}
                                    aria-label={`Copy ${r.label}`}
                                    className="text-muted-foreground hover:text-accent transition-colors"
                                >
                                    {copied === r.key ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </AppCanvas>
    );
}
