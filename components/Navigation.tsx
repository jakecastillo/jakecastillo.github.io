"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { navSections } from "@/data/sections";
import { useScrollStore } from "@/hooks/useScrollStore";

function MagneticButton({
    children,
    href,
    onClick,
}: {
    children: React.ReactNode;
    href: string;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
    const ref = useRef<HTMLAnchorElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current!.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.1, y: middleY * 0.1 }); // Magnetic strength
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.div
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            <Link
                ref={ref}
                href={href}
                onClick={onClick}
                onMouseMove={handleMouse}
                onMouseLeave={reset}
                className="relative flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
            >
                {children}
            </Link>
        </motion.div>
    );
}

export default function Navigation() {
    const lenis = useScrollStore((state) => state.lenis);

    const handleNavClick = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!href.startsWith("#")) return;
        const targetId = href.slice(1);
        const target = document.getElementById(targetId);
        if (!target) return;

        event.preventDefault();
        if (lenis) {
            lenis.scrollTo(target, { offset: -8 });
        } else {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        window.history.replaceState(null, "", href);
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-black/5">
                {navSections.map((section) => (
                    <MagneticButton
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={handleNavClick(`#${section.id}`)}
                    >
                        <section.icon size={20} strokeWidth={1.5} />
                        <span className="sr-only">{section.navLabel}</span>
                    </MagneticButton>
                ))}
            </div>
        </div>
    );
}
