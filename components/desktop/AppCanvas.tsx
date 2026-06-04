"use client";

import type { ReactNode } from "react";

interface AppCanvasProps {
    children: ReactNode;
    /** Widen the readable measure for grid/gallery layouts (max-w-[92ch]). */
    wide?: boolean;
    /** Extra classes appended to the inner content column. */
    className?: string;
}

/**
 * Shared content shell for desktop apps. Provides a scrollable surface with a
 * measure-capped, centered column so prose stays readable across window sizes.
 *
 * One canonical spacing scale lives here so every app/maximized pane reads with
 * even rhythm:
 *   - matched gutters (px-6 py-6) so vertical and horizontal whitespace agree,
 *   - a default vertical gap (space-y-6 = 24px) between top-level blocks,
 *   - a single measure cap (72ch prose / 92ch wide grids).
 * Consumers may still tune the gap via `className` — the default sets the
 * baseline so panes that pass nothing get the same rhythm as the rest.
 *
 * The surface also paints a near-opaque void backdrop (bg-surface-window/95,
 * the same ramp-base token as the desktop window body). On desktop this is
 * harmless — it
 * sits inside the equally-tinted WindowFrame — but on mobile, where the shell
 * is transparent, it keeps the z-0 orb canvas from bleeding through below short
 * content so body text always reads on a calm backdrop.
 *
 * Pure Tailwind v4 — no JS measurement — so it stays static-export safe and
 * honors prefers-reduced-motion by doing nothing animated at all.
 */
export default function AppCanvas({ children, wide = false, className = "" }: AppCanvasProps) {
    return (
        <div className="h-full overflow-auto bg-surface-window/95">
            <div
                className={`mx-auto w-full px-6 py-6 space-y-6 ${
                    wide ? "max-w-[92ch]" : "max-w-[72ch]"
                } ${className}`.trim()}
            >
                {children}
            </div>
        </div>
    );
}
