import type { LucideIcon } from "lucide-react";
import { Linkedin, Mail } from "lucide-react";
import { resumeData } from "@/data/resume";

export type ContactLink = {
  key: "email" | "linkedin";
  label: string;
  displayLabel: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

export const contactLinks: ContactLink[] = [
  {
    key: "email",
    label: "Email",
    displayLabel: "EMAIL_UPLINK",
    href: `mailto:${resumeData.email}`,
    icon: Mail,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    displayLabel: "LINKEDIN_SIGNAL",
    href: resumeData.linkedin,
    icon: Linkedin,
    external: true,
  },
];
