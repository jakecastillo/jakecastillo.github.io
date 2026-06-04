import { BRAND } from "./config/brand";

interface WordmarkProps {
    /** Font size of the wordmark. Defaults to "11px" to match the menubar item exactly. */
    size?: string;
    className?: string;
}

/**
 * Canonical jake.os brand wordmark — the single source of identity across every surface.
 *
 * Renders BRAND.handle ("jake.os") as a status-dot + two-tone monospace lockup:
 * the name segment in violet (--primary) and the ".os" suffix in cyan (--accent).
 */
export default function Wordmark({ size = "11px", className = "" }: WordmarkProps) {
    // Derive both tones from the canonical string so identity stays single-sourced.
    const dot = BRAND.handle.indexOf(".");
    const name = dot === -1 ? BRAND.handle : BRAND.handle.slice(0, dot);
    const suffix = dot === -1 ? "" : BRAND.handle.slice(dot);

    return (
        <span
            className={`flex items-center gap-1.5 font-mono font-bold tracking-wide select-none ${className}`}
            style={{ fontSize: size }}
            aria-label={BRAND.handle}
        >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span aria-hidden="true">
                <span className="text-primary">{name}</span>
                <span className="text-accent">{suffix}</span>
            </span>
        </span>
    );
}
