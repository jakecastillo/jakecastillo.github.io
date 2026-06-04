import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SceneLoader from "@/components/SceneLoader";
import QuantumLoader from "@/components/QuantumLoader";
import BootLayoutGroup from "@/components/BootLayoutGroup";
import { BRAND } from "@/components/desktop/config/brand";
import { resumeData } from "@/data/resume";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for editorial hierarchy (names, section heads). Geist Sans stays
// for body, Geist Mono for terminal/code. Distinct cut gives true type contrast.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const PAGE_TITLE = `${BRAND.name} | ${BRAND.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: PAGE_TITLE,
  // Descriptive tagline reads best for SEO / search snippets.
  description: BRAND.tagline,
  openGraph: {
    title: PAGE_TITLE,
    // Link unfurls lead with the sharp, ownable POV — not the generic tagline.
    description: BRAND.signature,
    url: BRAND.siteUrl,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: BRAND.signature,
  },
};

// Representative, recruiter/screener-facing skill set — single-sourced from
// resumeData so the structured data can never drift from the résumé. We curate a
// security/cloud-forward subset (not every hobby) and dedupe, since this feeds AI
// pre-screeners as `knowsAbout` and the Occupation `skills` string.
const knowsAbout = Array.from(
  new Set([
    "DevSecOps",
    "Cloud Security",
    "Secure Software Development Lifecycle (SSDLC)",
    "CI/CD Security",
    ...resumeData.skills.platforms, // AWS (infrastructure design)
    ...resumeData.skills.languages, // TypeScript, C, C++, SQL, ...
    ...resumeData.skills.frameworks, // NestJS, React, Next.js, ...
    ...resumeData.skills.databases, // PostgreSQL, MySQL
    ...resumeData.skills.interests, // Machine Learning, AI, Data Analytics
  ]),
);

// BRAND.availability is owned by the CONTENT agent and may not exist yet —
// reference it defensively so this stays build-safe regardless of wave order.
const availability = (BRAND as { availability?: string }).availability;

// Build-time JSON-LD Person object — single-sourced from BRAND + resumeData for
// SEO and AI screeners. Inlined at build time (static export), zero runtime cost.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: BRAND.name,
  jobTitle: BRAND.role,
  description: BRAND.tagline,
  url: BRAND.siteUrl,
  email: `mailto:${resumeData.email}`,
  // Third-party identity corroboration for entity reconciliation.
  sameAs: [resumeData.linkedin, "https://github.com/jakecastillo"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Honolulu",
    addressRegion: "HI",
    addressCountry: "US",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: resumeData.education.institution,
  },
  // The occupation block is what AI pre-screeners parse for role-fit signals.
  hasOccupation: {
    "@type": "Occupation",
    name: "DevSecOps Engineer",
    occupationalCategory: "15-1299.00", // O*NET-SOC: Computer Occupations, All Other
    description:
      "Integrates security into the software development lifecycle and builds secure, resilient systems on AWS.",
    skills: knowsAbout.join(", "),
  },
  knowsAbout,
  // Map AWS certifications to schema.org credentials for verifiable trust signals.
  hasCredential: resumeData.certifications.map((cert) => ({
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "certificate",
    name: cert.name,
    recognizedBy: {
      "@type": "Organization",
      name: cert.issuer,
    },
  })),
  // Only emit a seeking-work signal when CONTENT has supplied a real string.
  ...(availability ? { seeks: { "@type": "Demand", name: availability } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden`}
      >
        {/* Structured data: single-sourced Person identity for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />

        {/* Cinematic Background Layer (lazy-loaded so three.js leaves the critical path) */}
        <SceneLoader />

        {/* Boot + Content share a LayoutGroup so the terminal boot overlay can morph into the Terminal window */}
        <BootLayoutGroup>
          <QuantumLoader />
          <div className="relative z-10 flex flex-col min-h-screen">
            <main className="flex-grow">
              {children}
            </main>
          </div>
        </BootLayoutGroup>
      </body>
    </html>
  );
}
