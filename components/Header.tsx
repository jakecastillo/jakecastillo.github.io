"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, User, Briefcase, Code, Mail } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: User },
  { href: "/experience", label: "Experience", icon: Briefcase },
  { href: "/skills", label: "Skills", icon: Code },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur border-b border-border shadow-sm supports-[backdrop-filter]:bg-surface/75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-foreground">
            Jake Castillo
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
              >
                <item.icon size={16} className="text-primary mr-2" />
                {item.label}
              </Link>
            ))}
            </nav>
            <ThemeToggle />
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={16} className="text-primary mr-2" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
