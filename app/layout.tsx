import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import SmoothScroll from "@/components/SmoothScroll";
import BackgroundScene from "@/components/BackgroundScene";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/MotionProvider";
import GsapProvider from "@/components/beam/GsapProvider";
import BootIgnition from "@/components/beam/BootIgnition";
import BrandMark from "@/components/BrandMark";
import TouchActive from "@/components/TouchActive";
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
const TITLE = "Jake Castillo | Software Engineer";
const DESCRIPTION =
  "Full-stack software engineer in Honolulu modernizing government and enterprise systems — migrating legacy platforms to modern React, NestJS, and AWS.";

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
    "Software engineer",
    "Full-stack engineer",
    "Legacy modernization",
    "AWS",
    "React",
    "NestJS",
    "Honolulu",
    "DevSecOps",
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
        alt: "Jake Castillo — Software Engineer",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", alt: "Jake Castillo — Software Engineer" }],
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
      knowsAbout: ["Full-stack development", "Legacy modernization", "AWS", "React", "NestJS", "DevSecOps", "TypeScript"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden grain vignette`}
      >
        {/* Pre-hydration boot cover — opaque background from first paint so the
            SSR hero never flashes before BootIgnition mounts on first visits.
            The inline script HIDES it (display:none) for repeat visits and
            reduced-motion; it must NOT remove the node, or React would hydrate
            the body and find this server-rendered child gone → hydration
            mismatch (React #418). BootIgnition removes the node for real after
            it mounts. The script does NOT write the seen flag (decideShouldPlay
            in BootIgnition stays the single writer). suppressHydrationWarning
            silences the dev warning for the script-added inline style. */}
        <div id="boot-cover" aria-hidden="true" suppressHydrationWarning />
        <noscript>
          <style>{`#boot-cover{display:none}`}</style>
        </noscript>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=false;try{s=sessionStorage.getItem('beam:boot')==='1'}catch(e){s=true}var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(s||r){document.getElementById('boot-cover')?.style.setProperty('display','none')}}catch(e){document.getElementById('boot-cover')?.style.setProperty('display','none')}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* Persistent brand mark (orbital glyph wordmark) + top scrim.
            Client component: yields the wordmark while the Experience act is pinned. */}
        <BrandMark />

        <MotionProvider>
          <BootIgnition />
          <SmoothScroll />
          <GsapProvider />
          <TouchActive />

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
        </MotionProvider>
      </body>
    </html>
  );
}
