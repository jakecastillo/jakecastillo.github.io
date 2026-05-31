import type { AppId } from "@/store/useDesktopStore";
import type { LucideIcon } from "lucide-react";
import { Briefcase, Cpu, FileText, Mail, Terminal } from "lucide-react";
import type { ComponentType } from "react";
import TerminalApp from "../apps/TerminalApp";
import AboutApp from "../apps/AboutApp";
import CareerApp from "../apps/CareerApp";
import StackApp from "../apps/StackApp";
import ContactApp from "../apps/ContactApp";

export interface AppEntry {
    id: AppId;
    name: string;
    icon: LucideIcon;
    defaultSize: { w: number; h: number };
    Component: ComponentType;
}

export const APPS: Record<AppId, AppEntry> = {
    terminal: {
        id: "terminal",
        name: "Terminal",
        icon: Terminal,
        defaultSize: { w: 640, h: 420 },
        Component: TerminalApp,
    },
    about: {
        id: "about",
        name: "About",
        icon: FileText,
        defaultSize: { w: 540, h: 520 },
        Component: AboutApp,
    },
    career: {
        id: "career",
        name: "Career",
        icon: Briefcase,
        defaultSize: { w: 720, h: 500 },
        Component: CareerApp,
    },
    stack: {
        id: "stack",
        name: "Stack",
        icon: Cpu,
        defaultSize: { w: 620, h: 460 },
        Component: StackApp,
    },
    contact: {
        id: "contact",
        name: "Contact",
        icon: Mail,
        defaultSize: { w: 460, h: 520 },
        Component: ContactApp,
    },
};
