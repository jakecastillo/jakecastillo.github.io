"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme;
    const resolvedCurrent =
      current === "light" || current === "dark"
        ? current
        : window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
          ? "dark"
          : "light";

    const next = resolvedCurrent === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
    >
      <Sun size={18} className="hidden [html[data-theme='dark']_&]:block" />
      <Moon size={18} className="block [html[data-theme='dark']_&]:hidden" />
    </button>
  );
}
