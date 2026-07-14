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
  summary:
    "Computer software/hardware design and innovation specialist with a drive to give back to the community and a strong foundation in engineering principles across multiple platforms and technologies. Experienced in back-end development, testing, and debugging code with a focus on cloud development/architecture (AWS).",
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
