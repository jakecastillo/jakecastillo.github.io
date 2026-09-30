import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono, Libre_Caslon_Display } from "next/font/google";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
const display = Libre_Caslon_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
const title = "Jake Castillo | Software & Systems";
const description =
  "Software engineer in Honolulu connecting cloud platforms, applications, and applied AI—from architecture through implementation.";

export const metadata: Metadata = {
  metadataBase: new URL("https://jakecastillo.github.io"),
  title: { default: title, template: "%s | Jake Castillo" },
  description,
  applicationName: "Jake Castillo",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Jake Castillo",
    title,
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Jake Castillo — Complex systems. Clear solutions.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  themeColor: "#07110f",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
