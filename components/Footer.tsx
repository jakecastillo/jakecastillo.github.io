"use client";

import { contactLinks } from "@/data/links";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-border-subtle">
      {/* Bottom padding clears the fixed dock at EVERY width (the dock exists
          at all breakpoints; at 768 the centered dock band otherwise buries the
          copyright line): dock offset (1rem, sm+: 2rem) + ~62px band +
          breathing room, plus the same safe-area inset the dock adds. */}
      <div className="container-page flex flex-col items-center justify-between gap-5 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:flex-row sm:pb-[calc(8rem+env(safe-area-inset-bottom))]">
        <p className="font-mono text-xs text-subtle-foreground">
          © {year} Jake Castillo · Built with Next.js &amp; Three.js
        </p>
        <nav aria-label="Footer social links" className="flex items-center gap-1">
          {contactLinks.map((l) => (
            <a
              key={l.key}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              download={l.download || undefined}
              aria-label={l.label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)]"
            >
              <l.icon size={18} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
