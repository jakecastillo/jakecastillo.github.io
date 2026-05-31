import type { AppId } from "@/store/useDesktopStore";

interface AppEntry {
    id: AppId;
    name: string;
    defaultSize: { w: number; h: number };
}

export const APPS: Record<AppId, AppEntry> = {
    terminal: { id: "terminal", name: "Terminal", defaultSize: { w: 640, h: 420 } },
    about: { id: "about", name: "About", defaultSize: { w: 540, h: 520 } },
    career: { id: "career", name: "Career", defaultSize: { w: 720, h: 500 } },
    stack: { id: "stack", name: "Stack", defaultSize: { w: 620, h: 460 } },
    contact: { id: "contact", name: "Contact", defaultSize: { w: 460, h: 520 } },
};
