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
    stageLabel: "ACT I",
    stageTitle: "THE STATEMENT",
  },
  {
    id: "about",
    navLabel: "About",
    icon: Brain,
    showInNav: true,
    stageLabel: "ACT II",
    stageTitle: "PHILOSOPHY",
  },
  {
    id: "exp",
    navLabel: "Exp",
    icon: Briefcase,
    showInNav: true,
    stageLabel: "ACT III",
    stageTitle: "EXPERIENCE",
  },
  {
    id: "skills",
    navLabel: "Skills",
    icon: Code,
    showInNav: false,
    stageLabel: "ACT III",
    stageTitle: "CAPABILITIES",
  },
  {
    id: "contact",
    navLabel: "Contact",
    icon: Mail,
    showInNav: true,
    stageLabel: "ACT IV",
    stageTitle: "CONNECTION",
  },
];

export const navSections = sections.filter((section) => section.showInNav);

export const stageSections = sections.filter(
  (
    section
  ): section is Section & { stageLabel: string; stageTitle: string } =>
    Boolean(section.stageLabel && section.stageTitle)
);
