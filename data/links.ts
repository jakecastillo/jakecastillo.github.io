import type { LucideIcon } from "lucide-react";
import { Download, Github, Linkedin, Mail } from "lucide-react";
import { resumeData } from "@/data/resume";

export type ContactLink = {
  key: "email" | "linkedin" | "github" | "resume";
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
    displayLabel: "EMAIL_UPLINK",
    href: `mailto:${resumeData.email}`,
    icon: Mail,
    primary: true,
  },
  {
    key: "github",
    label: "View GitHub",
    displayLabel: "GITHUB_REPO",
    href: resumeData.github,
    icon: Github,
    external: true,
  },
  {
    key: "linkedin",
    label: "Connect on LinkedIn",
    displayLabel: "LINKEDIN_SIGNAL",
    href: resumeData.linkedin,
    icon: Linkedin,
    external: true,
  },
  {
    key: "resume",
    label: "Download résumé",
    displayLabel: "RESUME.PDF",
    href: "/resume.pdf",
    icon: Download,
    download: true,
  },
];
