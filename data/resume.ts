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
  role: "DevSecOps Software Engineer",
  tagline: "Securing cloud-native platforms — from the pipeline to production.",
  location: "Honolulu, HI",
  phone: "(808) 216-2163",
  email: "jakecast@hawaii.edu",
  linkedin: "https://www.linkedin.com/in/jake-castillo-00567819b/",
  github: "https://github.com/jakecastillo",
  summary: "I'm a DevSecOps software engineer who secures cloud-native AWS platforms — embedding security into the development lifecycle, modernizing legacy systems, and shipping resilient, type-safe services. AWS Solutions Architect & Cloud Practitioner certified, based in Honolulu.",
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
      context: "Mission-driven platform — securing cloud-native delivery end to end.",
      description: [
        "Lead DevSecOps initiatives, embedding automated dependency, secret, and SAST scanning into CI/CD so vulnerabilities are caught pre-merge instead of in production.",
        "Shift security left across the SDLC with threat modeling and policy-as-code — hardening cloud delivery without slowing release cadence.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer",
      period: "Jan 2021–Oct 2025",
      context: "Hawaiʻi's largest software consultancy — modernizing enterprise & government systems.",
      description: [
        "Re-architected a brittle legacy monolith into 12+ NestJS microservices serving 10k+ users across 4+ products — isolating failure domains to cut production incidents and unplanned downtime over a 5-year tenure.",
        "Built full-stack features end-to-end with React, NestJS/Prisma, and PostgreSQL, enforcing schema-level type safety to eliminate a class of runtime data bugs.",
        "Acted as technical SME and lead across cross-functional teams, owning production support and long-term maintainability.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer (Part Time)",
      period: "Aug 2020–Jan 2021",
      context: "Pandemic-response engineering under tight public-health deadlines.",
      description: [
        "Deployed thermal-scanning systems across Hawaii's airports for COVID-19 mitigation — owning installation, field support, and rollout.",
        "Ran regression testing for the LumiSight web and mobile apps and helped shape QA strategy and operational mapping.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Engineering Intern",
      period: "Jan 2020–Aug 2020",
      context: "First engineering role — hardware-meets-software systems for state facilities.",
      description: [
        "Designed and shipped a workflow solution for the Hawaii Animal Quarantine Holding Facility alongside mentors and peers.",
        "Led front-end development and planned and installed critical system hardware.",
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
    languages: ["JavaScript", "TypeScript", "C", "C++", "SQL", "HTML"],
    databases: ["MySQL", "PostgreSQL"],
    frameworks: ["NestJS", "Express", "Node.js", "Angular", "React", "Vue", "Prisma", "Next.js", "AI Agent Integration"],
    platforms: ["AWS (infrastructure design)"],
    practices: ["Agile", "DRY", "YAGNI"],
    softSkills: ["Problem Solving", "Adaptability", "Communication", "Collaboration"],
    roles: ["Integration Architect", "Solutions Architect", "Tech Lead", "DevOps", "Full-stack Developer", "Support Engineer"],
    interests: ["Machine Learning", "AI", "AWS infrastructure design", "Data Analytics"],
    hobbies: ["Pickleball", "Video Games", "Cars"],
  },
};
