import type { AppId } from "@/store/useDesktopStore";
import type { LucideIcon } from "lucide-react";
import { Briefcase, Cpu, FileText, Mail, Terminal } from "lucide-react";

interface AppEntry {
    id: AppId;
    name: string;
    icon: LucideIcon;
    defaultSize: { w: number; h: number };
}

export const APPS: Record<AppId, AppEntry> = {
    terminal: { id: "terminal", name: "Terminal", icon: Terminal, defaultSize: { w: 640, h: 420 } },
    about: { id: "about", name: "About", icon: FileText, defaultSize: { w: 540, h: 520 } },
    career: { id: "career", name: "Career", icon: Briefcase, defaultSize: { w: 720, h: 500 } },
    stack: { id: "stack", name: "Stack", icon: Cpu, defaultSize: { w: 620, h: 460 } },
    contact: { id: "contact", name: "Contact", icon: Mail, defaultSize: { w: 460, h: 520 } },
};
