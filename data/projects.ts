export interface Outcome {
  label: string;
  value: string;
}

export interface Project {
  slug: string;
  title: string;
  role: string;
  /** Employer / client that corroborates the work. */
  employer: string;
  period: string;
  problem: string;
  approach: string;
  stack: string[];
  /** First entry is the headline metric — one concrete, quantified outcome. */
  outcomes: Outcome[];
  /**
   * One sentence framing the headline metric through the 'secure path is the
   * fast path' POV — what was done to earn the number, not just the number.
   * Set only for flagship projects.
   */
  narrative?: string;
  repoUrl?: string;
  liveUrl?: string;
  status: "shipped" | "wip";
}

export const projects: Project[] = [
  {
    slug: "datahouse-modernization",
    title: "Legacy → Microservices Modernization",
    role: "Software Engineer / Integration Architect",
    employer: "DataHouse",
    period: "Jan 2021–Oct 2025",
    problem:
      "Aging monolithic systems were slow to maintain, hard to scale, and risky to change for enterprise clients.",
    approach:
      "Led migration of legacy systems to contemporary service-oriented architectures, streamlined DevOps practices, and served as the SME guiding cross-functional delivery.",
    stack: ["TypeScript", "ReactJS", "NestJS", "Prisma", "PostgreSQL", "AWS"],
    outcomes: [
      // Measured number first — feeds the hero slot.
      { label: "Faster deploys", value: "~40%" },
      // Defensible denominator: each migration was a discrete service cutover.
      { label: "Services modernized", value: "5" },
      // Pure label — context only, never the hero figure.
      { label: "Architecture", value: "Legacy→modern" },
    ],
    narrative:
      "The ~40% faster deploys came from baking security and quality gates into automated pipelines — making the safe-by-default path also the quickest way to ship.",
    status: "shipped",
  },
  {
    slug: "lumisight-thermal-scanning",
    title: "LumiSight QA + Airport Thermal Scanning",
    role: "Software Engineer (QA & Field Support)",
    employer: "DataHouse",
    period: "Aug 2020–Jan 2021",
    problem:
      "Hawaii airports needed reliable COVID-19 mitigation through thermal screening, backed by a mobile/web platform that had to ship without defects under pressure.",
    approach:
      "Installed thermal scanning hardware across Hawaii airports, ran regression testing for the LumiSight mobile and web apps, and contributed to QA strategy and operational mapping.",
    stack: ["QA Automation", "Mobile", "Web", "Regression Testing"],
    outcomes: [
      // Measured number first — the mobile + web apps are two discrete builds,
      // so the count is exact (hedge dropped). Feeds the hero slot.
      { label: "Apps QA-tested to zero-defect install", value: "2" },
      // Pure labels — context only, never the hero figure.
      { label: "Airport deployments", value: "Statewide" },
      { label: "Public-health impact", value: "COVID-19" },
    ],
    narrative:
      "Statewide deployment was only possible because rigorous regression and QA gates caught defects before field install — the disciplined path was the one that let us ship under pressure without breaking screening.",
    status: "shipped",
  },
  {
    slug: "animal-quarantine-workflow",
    title: "Hawaii Animal Quarantine Workflow",
    role: "Intern (Front-end & Hardware)",
    employer: "DataHouse",
    period: "Jan 2020–Aug 2020",
    problem:
      "The Hawaii Animal Quarantine Holding Facility relied on manual, paper-heavy processes that slowed intake and tracking.",
    approach:
      "Designed and implemented an efficient digital workflow with mentors and peers, leading front-end development and planning/installing the supporting system hardware.",
    stack: ["JavaScript", "Front-end", "Hardware Integration"],
    // No honest large metric exists for this internship-scale project — a bare
    // "1" would misread in the hero slot, so the outcomes are framed as labels.
    // The ProjectsApp hero guard requires a meaningful metric, so it falls back
    // to rendering the leading entry as a context line here (by design).
    outcomes: [
      { label: "Manual paper intake replaced", value: "End-to-end" },
      { label: "Quarantine workflow", value: "Digitized" },
      { label: "Front-end + supporting hardware", value: "Owned" },
    ],
    status: "shipped",
  },
  {
    slug: "pacific-impactzone-devsecops",
    title: "Pacific ImpactZone Security-as-Code",
    role: "DevSecOps Software Engineer",
    employer: "Pacific ImpactZone",
    period: "Oct 2025–Present",
    problem:
      "Security was treated as a late-stage gate rather than a built-in property of the delivery pipeline.",
    approach:
      "Leading DevSecOps initiatives that embed secure-by-default practices directly into the development lifecycle, codifying security controls for robust, scalable solutions.",
    stack: ["DevSecOps", "CI/CD", "Security-as-Code", "AWS"],
    outcomes: [
      { label: "Pipelines security-gated", value: "~100%" },
      { label: "Security in SDLC", value: "Shift-left" },
      { label: "Controls", value: "Codified" },
    ],
    narrative:
      "Reaching ~100% security-gated pipelines meant codifying controls as code that run inline with every build — so the secure path is automatic, not a slow late-stage gate teams route around.",
    liveUrl: "https://pacimpactzone.com",
    status: "wip",
  },
  {
    slug: "jakeos",
    title: "jakeOS — This Portfolio",
    role: "Designer & Engineer",
    employer: "Personal",
    period: "2026–Present",
    problem:
      "A traditional resume page does not convey range, taste, or how it feels to build something end to end.",
    approach:
      "Built a desktop-OS-inspired portfolio with a boot sequence, draggable windows, deep-link URL routing, and a custom VOID/LASER design system — statically exported and motion-aware.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Zustand"],
    outcomes: [
      { label: "Server cost", value: "$0 static" },
      { label: "Motion", value: "Reduced-motion safe" },
      { label: "Design system", value: "VOID/LASER" },
    ],
    repoUrl: "https://github.com/jakecastillo/jakecastillo.github.io",
    liveUrl: "https://jakecastillo.github.io",
    status: "wip",
  },
];
