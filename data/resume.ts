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
  phone: string;
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
  location: "Honolulu, HI",
  phone: "(808) 216-2163",
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
      description: [
        "Lead DevSecOps initiatives, embedding automated dependency, secret, and code scanning into CI/CD so issues surface before they reach production.",
        "Bring security and reliability practices into the delivery pipeline while keeping release cadence fast.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer",
      period: "Jan 2021–Oct 2025",
      context:
        "Hawaiʻi consultancy — government, healthcare, and enterprise clients.",
      // Scope + stack only — client systems and application names stay off
      // the public site (owner decision, jc-oer). Scale figures are from the
      // public record (agency annual reports, state budget/DOH releases,
      // territory procurement coverage — jc-cny); role claims stay strictly
      // from the owner's resume. Nothing invented.
      description: [
        "Backend developer and technical architect on a multi-phase financial-system modernization — moving the platform that administers roughly $380M a year across 4,000+ active research projects off a legacy AS400 + AngularJS stack to React, NestJS/Prisma, and AWS Lambda, integrated with an SAP COTS system.",
        "Full-stack developer on a state's legislatively mandated rebuild of its campaign-finance disclosure platform — the system journalists, watchdogs, and the public use to follow money in state politics, where single ballot measures have drawn $400M+.",
        "Tech lead across healthcare builds — owning third-party EMR integration for a cloud telehealth platform and delivering a Medicare Advantage member app in a one-month sprint, guiding onshore developers and managing releases.",
        "Built and supported applications (Vue / Express) for the only statewide public school district in the nation — roughly 165,000 students across nearly 300 schools.",
        "Shipped COVID-19 response software — a statewide testing-registration platform (React/Angular + PostgreSQL on AWS) and the travel-authorization system that repatriated 1,700+ residents of a U.S. Pacific territory, plus thermal-camera screening on the ground.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Summer Intern",
      period: "Jul 2020–Aug 2020",
      context: "Pandemic-response engineering between school terms.",
      description: [
        "Partnered with NEC Corporation to install and maintain thermal-scanning systems across State of Hawaiʻi airports for COVID-19 mitigation.",
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
      description: [
        "Built a kiosk check-in and live queuing system for the state facility that screens every pet entering Hawaiʻi — the front line of the nation's only rabies-free state — leading front-end development with CIMP mentors and interns.",
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
