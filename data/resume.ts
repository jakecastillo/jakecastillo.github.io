// ——— Dynamic time anchors (jc-jtu) ———————————————————————————————————————
// The career clock starts at the CIMP internship (Jan 2020) — the same anchor
// the "six years" claims were hand-counted from. Durations are COMPUTED so
// copy never goes stale at an anniversary. Renders that interpolate these on
// SSR'd surfaces should carry suppressHydrationWarning: a visitor arriving
// after an anniversary that the last build predates would otherwise trip a
// hydration text mismatch (the value changes at most once a year; any
// re-render or rebuild self-heals it).
export const CAREER_START = new Date(2020, 0);

/** Whole years elapsed since `start`, anniversary-aware. */
export function yearsSince(start: Date, now: Date = new Date()): number {
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, Math.floor(months / 12));
}

const YEAR_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

/** Years of experience as a lowercase word ("six"), numeral past twenty. */
export function experienceYears(now: Date = new Date()): string {
  const n = yearsSince(CAREER_START, now);
  return YEAR_WORDS[n] ?? String(n);
}

/** Capitalized variant for sentence starts ("Six"). */
export function experienceYearsCap(now: Date = new Date()): string {
  const word = experienceYears(now);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export interface Education {
  institution: string;
  degree: string;
  graduation: string;
}

export interface Job {
  company: string;
  companyUrl?: string;
  title: string;
  period: string;
  context?: string;
  /** The card's mono proof line: 1-3 short receipt segments (named systems +
      public-record impact). Cards render ONLY context + proof (poster tier);
      `description` is the receipts tier, rendered by the terminal. */
  proof?: string[];
  description: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  issued: string;
  expires: string;
}

export interface Skills {
  languages: string[];
  databases: string[];
  frameworks: string[];
  platforms: string[];
  security: string[];
  ai: string[];
  practices: string[];
  softSkills: string[];
  roles: string[];
  interests: string[];
  hobbies: string[];
}

export interface ResumeData {
  name: string;
  role: string;
  tagline: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  summary: string;
  education: Education;
  experience: Job[];
  certifications: Certification[];
  skills: Skills;
}

export const resumeData: ResumeData = {
  name: "Jake Castillo",
  role: "Software Engineer",
  tagline: "Computer software/hardware design & innovation specialist.",
  // No phone number here on purpose: everything in this object ships in the
  // public client bundle whether or not it renders (jc-396).
  location: "Honolulu, HI",
  email: "jakecast@hawaii.edu",
  linkedin: "https://www.linkedin.com/in/jake-castillo-00567819b/",
  github: "https://github.com/jakecastillo",
  // First-person, opinionated voice (jc-1vb): this string renders in three
  // places — the Act 2 belief card under "BORING WHERE IT SHOULD BE. / BOLD
  // WHERE IT COUNTS.", plus the terminal's about.md and whois. It has to hold
  // that manifesto's tone, not collapse into LinkedIn boilerplate. Every claim
  // traces to facts elsewhere in this object (years computed from
  // CAREER_START; gov/edu/healthcare domains; back-end + cloud focus; AWS +
  // DevSecOps; full-stack→architect arc; CIMP-mentorship give-back origin) —
  // no new facts, no names, no figures.
  summary: `I've spent ${experienceYears()} years on back-end and cloud systems across government, education, and healthcare — domains where a wrong call is expensive and "it works on my machine" doesn't ship. I started full-stack and kept moving toward the architecture, because I'd rather own why a system is shaped the way it is than just get it to pass; today that means treating security and AWS as defaults, designed in from the start instead of bolted on later. I got into this through a mentorship program that bet on me, so I build things I'd actually want to hand to whoever inherits them.`,
  education: {
    institution: "University of Hawaii at Manoa",
    degree: "Bachelor of Science in Computer Engineering",
    graduation: "Dec 2020",
  },
  experience: [
    {
      company: "Pacific ImpactZone",
      companyUrl: "https://pacimpactzone.com",
      title: "DevSecOps Software Engineer",
      period: "Oct 2025–Present",
      context: "My current role — bringing security into cloud-native delivery.",
      // Current-employer hygiene: no enumeration of the security toolchain —
      // that describes their live control environment (jc-396).
      proof: [
        "security embedded across the delivery pipeline — issues surface before production",
      ],
      description: [
        "Lead DevSecOps initiatives, embedding automated security checks across CI/CD so issues surface before they reach production.",
        "Bring security and reliability practices into the delivery pipeline while keeping release cadence fast.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer",
      period: "Jan 2021–Oct 2025",
      context:
        "Public-sector, healthcare, and education systems — full-stack developer to technical architect and tech lead.",
      // PROTECTIVE disclosure posture (jc-396, owner decision after a
      // security review): no client or system names, and no uniquely
      // identifying figures — a unique public fact ("only statewide district
      // in the nation", "$380M/yr") is a unique identifier, and one search
      // resolves it. Domains + role arc + soft scale only. Stacks are never
      // bound to any specific system. The full named record stays in the
      // owner's private resume/LinkedIn — targeted disclosure, not broadcast.
      proof: [
        "legacy financial modernization",
        "statewide pandemic-response platforms",
        "election-transparency tooling",
      ],
      description: [
        "Backend developer and technical architect on a multi-phase modernization of a nine-figure public-sector financial platform.",
        "Led legacy platform migrations to React, NestJS/Prisma, and AWS Lambda, integrating a COTS ERP.",
        "Full-stack developer on a state government's election-transparency tooling.",
        "Tech lead across healthcare builds — EMR integration and a health-insurance member app delivered in a one-month sprint, guiding onshore developers and managing releases.",
        "Built and supported statewide public-education applications.",
        "Shipped pandemic-response software — statewide testing registration and government travel-authorization programs, plus thermal-camera screening deployments.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Summer Intern",
      period: "Jul 2020–Aug 2020",
      context: "Pandemic-response engineering between school terms.",
      proof: [
        "thermal-scanning deployments across Hawaiʻi's trans-Pacific airports",
      ],
      description: [
        "Partnered with an enterprise hardware vendor to install and maintain thermal-scanning systems across State of Hawaiʻi airports for COVID-19 mitigation.",
        "Ran regression testing for the program's health-screening mobile and web apps and supported operations and location-mapping planning.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "CIMP Intern",
      period: "Jan 2020–May 2020",
      context:
        "Community Innovation & Mentorship Program — my first engineering role.",
      proof: [
        "kiosk check-in and live queuing for a state public facility — my first shipped system",
      ],
      description: [
        "Built a kiosk check-in and live queuing system for a State of Hawaiʻi public facility — leading front-end development with CIMP mentors and interns.",
        "Planned and installed the system's hardware components.",
      ],
    },
  ],
  certifications: [
    {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      issued: "Aug 2023",
      expires: "Sep 2026",
    },
    {
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      issued: "Sep 2023",
      expires: "Sep 2026",
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "Go", "C#", "Rust", "C / C++", "SQL"],
    databases: ["PostgreSQL", "Redis", "Prisma", "Supabase", "Drizzle", "MySQL"],
    frameworks: ["React", "Next.js", "NestJS", ".NET", "Express", "FastAPI", "Tailwind CSS", "shadcn/ui", "Vue", "Angular", "Three.js"],
    platforms: ["AWS", "Terraform", "Docker", "Kubernetes", "GitHub Actions", "Helm", "Serverless", "Azure", "Vercel"],
    security: ["DevSecOps", "Cloud Security", "Policy-as-Code", "IaC Security", "SAST / Secret Scanning", "Supply-Chain Security", "GRC / CMMC"],
    ai: ["Multi-agent Systems", "LLM Integration", "Anthropic / Claude", "OpenAI", "Vercel AI SDK", "Pydantic", "NVIDIA Nemotron"],
    practices: ["IaC", "CI/CD", "Observability", "Vitest", "Playwright", "k6", "Agile / Scrum"],
    softSkills: ["Problem Solving", "Adaptability", "Communication", "Collaboration"],
    roles: ["DevSecOps Engineer", "Solutions Engineer", "Technical Architect", "Tech Lead", "Full-stack Developer", "DevOps Engineer", "Backend Developer"],
    interests: ["Machine Learning", "AI", "Cloud Architecture", "Data Analytics"],
    hobbies: ["Pickleball", "Video Games", "Cars"],
  },
};
