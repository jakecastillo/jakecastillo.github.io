import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import SmoothScroll from "@/components/SmoothScroll";
import BackgroundScene from "@/components/BackgroundScene";
import QuantumLoader from "@/components/QuantumLoader";
import Footer from "@/components/Footer";
import { resumeData } from "@/data/resume";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://jakecastillo.github.io";
const TITLE = "Jake Castillo | DevSecOps Software Engineer";
const DESCRIPTION =
  "DevSecOps software engineer in Honolulu securing cloud-native AWS platforms — embedding security into the SDLC and shipping resilient, type-safe systems.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Jake Castillo",
  },
  description: DESCRIPTION,
  applicationName: "Jake Castillo",
  authors: [{ name: resumeData.name, url: SITE_URL }],
  creator: resumeData.name,
  keywords: [
    "Jake Castillo",
    "DevSecOps engineer",
    "Software engineer",
    "Cloud security",
    "AWS",
    "Honolulu",
    "Full-stack engineer",
    "Secure SDLC",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: SITE_URL,
    siteName: "Jake Castillo",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Jake Castillo — DevSecOps Software Engineer",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", alt: "Jake Castillo — DevSecOps Software Engineer" }],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#060608",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: resumeData.name,
      jobTitle: resumeData.role,
      description: DESCRIPTION,
      url: SITE_URL,
      image: `${SITE_URL}/og.png`,
      email: `mailto:${resumeData.email}`,
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
      knowsAbout: ["DevSecOps", "Cloud Security", "AWS", "CI/CD", "Full-stack development", "TypeScript"],
      sameAs: [resumeData.github, resumeData.linkedin],
    },
    {
      "@type": "WebSite",
      url: SITE_URL,
      name: "Jake Castillo",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden grain`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* Persistent brand mark (orbital glyph wordmark) */}
        <header className="fixed left-5 top-5 z-40">
          <a
            href="#home"
            aria-label="Jake Castillo — home"
            className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)]"
          >
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <defs>
                <linearGradient id="brandmark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#8b5cf6" />
                  <stop offset="1" stopColor="#2dd4bf" />
                </linearGradient>
              </defs>
              <circle cx="13" cy="13" r="11" fill="none" stroke="url(#brandmark)" strokeWidth="2" />
              <ellipse cx="13" cy="13" rx="11" ry="4.6" fill="none" stroke="#2dd4bf" strokeOpacity="0.55" />
              <circle cx="13" cy="13" r="3.6" fill="#8b5cf6" />
            </svg>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.3em] text-foreground/80 sm:inline">
              Jake Castillo
            </span>
          </a>
        </header>

        <QuantumLoader />
        <SmoothScroll />

        {/* Cinematic background (code-split, reduced-motion aware) */}
        <BackgroundScene />

        {/* Navigation */}
        <Navigation />

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col">
          <main id="main" className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
