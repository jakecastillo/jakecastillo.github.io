import type { LucideIcon } from "lucide-react";
import { Brain, Briefcase, Code, Home, Mail } from "lucide-react";

export type Section = {
  id: string;
  navLabel: string;
  icon: LucideIcon;
  showInNav: boolean;
  stageLabel?: string;
  stageTitle?: string;
};

export const sections: Section[] = [
  {
    id: "home",
    navLabel: "Home",
    icon: Home,
    showInNav: true,
    stageLabel: "01",
    stageTitle: "whoami",
  },
  {
    id: "about",
    navLabel: "About",
    icon: Brain,
    showInNav: true,
    stageLabel: "02",
    stageTitle: "approach",
  },
  {
    id: "exp",
    navLabel: "Work",
    icon: Briefcase,
    showInNav: true,
    stageLabel: "03",
    stageTitle: "work",
  },
  {
    id: "skills",
    navLabel: "Stack",
    icon: Code,
    showInNav: true,
    stageLabel: "04",
    stageTitle: "stack",
  },
  {
    id: "contact",
    navLabel: "Contact",
    icon: Mail,
    showInNav: true,
    stageLabel: "05",
    stageTitle: "contact",
  },
];

export const navSections = sections.filter((section) => section.showInNav);

export const stageSections = sections.filter(
  (
    section
  ): section is Section & { stageLabel: string; stageTitle: string } =>
    Boolean(section.stageLabel && section.stageTitle)
);
