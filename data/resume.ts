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
        "Hawaiʻi software & IT consultancy — I shipped and modernized systems for government, healthcare, and enterprise clients.",
      description: [
        "Backend developer and technical architect on the multi-phase RCUH financial-system modernization — migrating a legacy AS400 + AngularJS platform to React, NestJS/Prisma, and AWS Lambda, and integrating an SAP COTS system.",
        "Full-stack developer on the CAL-ACCESS Replacement System for the California Secretary of State — the public's window into the state's campaign-finance and lobbying disclosures.",
        "Tech lead across healthcare builds — owning 3rd-party EMR integration for Carespan and delivering the Astiva insurance app in a one-month sprint, guiding onshore developers and managing releases.",
        "Built and supported Hawaiʻi Department of Education applications (Vue / Express) and led DevOps and M&O for RCUH's legacy financial system as onshore tech lead and SME.",
        "Shipped COVID-19 response software — AlohaClear testing (React/Angular + PostgreSQL on AWS) and TalofaPass thermal-camera systems in American Samoa.",
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
        "Ran regression testing for the LumiSight mobile and web apps and supported operations and location-mapping planning.",
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
        "Built a queuing and check-in workflow for the State of Hawaiʻi Animal Quarantine Holding Facility with CIMP mentors and interns — leading front-end development.",
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
    languages: ["TypeScript", "JavaScript", "Python", "Go", "C#", "C / C++", "SQL"],
    databases: ["PostgreSQL", "Redis", "Prisma", "Drizzle", "MySQL"],
    frameworks: ["React", "Next.js", "NestJS", "Express", "FastAPI", "Vue", "Angular", ".NET", "Tailwind CSS", "shadcn/ui", "Three.js"],
    platforms: ["AWS", "Terraform", "Docker", "Kubernetes", "Helm", "GitHub Actions", "Serverless", "Azure"],
    ai: ["Vercel AI SDK", "OpenAI", "Multi-agent systems", "LLM integration", "Pydantic"],
    practices: ["DevSecOps", "Cloud Security", "IaC", "CI/CD", "Agile / Scrum", "Vitest", "Playwright", "k6"],
    softSkills: ["Problem Solving", "Adaptability", "Communication", "Collaboration"],
    roles: ["Full-stack Developer", "Technical Architect", "Tech Lead", "DevOps", "Backend Developer", "Support Engineer"],
    interests: ["Machine Learning", "AI", "Cloud Architecture", "Data Analytics"],
    hobbies: ["Pickleball", "Video Games", "Cars"],
  },
};
