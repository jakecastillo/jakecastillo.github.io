"use client";

import { contactLinks } from "@/data/links";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-border-subtle">
      <div className="container-page flex flex-col items-center justify-between gap-5 py-10 sm:flex-row">
        <p className="font-mono text-xs text-subtle-foreground">
          © {year} Jake Castillo · Built with Next.js &amp; Three.js
        </p>
        <nav aria-label="Footer social links" className="flex items-center gap-5">
          {contactLinks.map((l) => (
            <a
              key={l.key}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              download={l.download || undefined}
              aria-label={l.label}
              className="text-subtle-foreground transition-colors hover:text-primary"
            >
              <l.icon size={18} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
