import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import SmoothScroll from "@/components/SmoothScroll";
import Scene from "@/components/Scene";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jake Castillo | Software Engineer",
  description: "Constructing digital reality through code & design. Full-stack engineer specialized in high-performance web applications.",
  openGraph: {
    title: "Jake Castillo | Software Engineer",
    description: "Constructing digital reality through code & design.",
    url: "https://jakecastillo.github.io",
    siteName: "Jake Castillo",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden`}
      >
        <SmoothScroll />

        {/* Cinematic Background Layer */}
        <Scene />

        {/* Navigation Layer */}
        <Navigation />

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
