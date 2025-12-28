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
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  summary: string;
  education: Education;
  experience: Job[];
  certifications: Certification[];
  skills: Skills;
}

export const resumeData: ResumeData = {
  name: "Jake Castillo",
  location: "Honolulu, HI",
  phone: "(808) 216-2163",
  email: "jakecast@hawaii.edu",
  linkedin: "https://www.linkedin.com/in/jake-castillo-00567819b/",
  summary: "Computer software/hardware design and innovation specialist with a drive to give back to the community and a strong foundation in engineering principles across multiple platforms and technologies. Experienced in full-stack development (more towards back-end), testing, and debugging code with a focus on cloud development/architecture (AWS).",
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
        "Leading DevSecOps initiatives and implementing secure software development practices.",
        "Focusing on integrating security into the development lifecycle and ensuring robust, scalable solutions.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer",
      period: "Jan 2021–Oct 2025",
      description: [
        "Led system integration and modernization initiatives, including migration of legacy systems to contemporary architectures, streamlining DevOps practices, and enhancing maintenance processes to boost system performance and reliability.",
        "Designed and implemented scalable software solutions across multiple projects using technologies such as ReactJS, Prisma/NestJS, and PostgreSQL.",
        "Transitioned into support roles resolving user issues through bug fixes, system enhancements, and ongoing maintenance.",
        "Collaborated with cross-functional teams and stakeholders to deliver high-impact solutions and provided technical leadership as a subject matter expert (SME).",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Software Engineer (Part Time)",
      period: "Aug 2020–Jan 2021",
      description: [
        "Delivered technical support and system maintenance, including installation of thermal scanning systems across Hawaii airports to support COVID-19 mitigation efforts.",
        "Performed regression testing for LumiSight mobile and web applications and contributed to QA strategies and operational mapping.",
      ],
    },
    {
      company: "DataHouse",
      companyUrl: "https://www.datahouse.com",
      title: "Intern",
      period: "Jan 2020–Aug 2020",
      description: [
        "Partnered with mentors and peers to design and implement an efficient workflow solution for the Hawaii Animal Quarantine Holding Facility.",
        "Led front-end development efforts and the planning/installation of critical system hardware components.",
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
