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
      description: [
        "Lead DevSecOps initiatives, embedding security controls and automated checks directly into the CI/CD pipeline.",
        "Shift security left across the SDLC — threat modeling, dependency and secret scanning, and hardened, scalable cloud delivery.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer",
      period: "Jan 2021–Oct 2025",
      description: [
        "Led modernization of legacy systems to microservice architectures, streamlining DevOps and measurably improving reliability and performance.",
        "Designed and shipped scalable full-stack features across 4+ products with React, NestJS/Prisma, and PostgreSQL.",
        "Served as subject-matter expert and technical lead — partnering with cross-functional teams and resolving production issues through fixes and enhancements.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer (Part Time)",
      period: "Aug 2020–Jan 2021",
      description: [
        "Deployed thermal-scanning systems across Hawaii airports for COVID-19 mitigation, owning installation and field support.",
        "Ran regression testing for the LumiSight web and mobile apps and contributed to QA strategy and operational mapping.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Engineering Intern",
      period: "Jan 2020–Aug 2020",
      description: [
        "Designed and built a workflow solution for the Hawaii Animal Quarantine Holding Facility alongside mentors and peers.",
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
