import type { LucideIcon } from "lucide-react";
import { Github, Linkedin, Mail } from "lucide-react";
import { resumeData } from "@/data/resume";

export type ContactLink = {
  key: "email" | "linkedin" | "github";
  label: string; // human, action-verb primary label
  displayLabel: string; // mono "signal" caption
  href: string;
  icon: LucideIcon;
  external?: boolean;
  download?: boolean;
  primary?: boolean; // the single dominant CTA
};

export const contactLinks: ContactLink[] = [
  {
    key: "email",
    label: "Email me",
    displayLabel: "jakecast@hawaii.edu",
    href: `mailto:${resumeData.email}`,
    icon: Mail,
    primary: true,
  },
  {
    key: "github",
    label: "View GitHub",
    displayLabel: "github.com/jakecastillo",
    href: resumeData.github,
    icon: Github,
    external: true,
  },
  {
    key: "linkedin",
    label: "Connect on LinkedIn",
    displayLabel: "linkedin.com/in/jake-castillo-00567819b",
    href: resumeData.linkedin,
    icon: Linkedin,
    external: true,
  },
];
