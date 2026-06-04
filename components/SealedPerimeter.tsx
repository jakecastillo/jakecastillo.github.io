"use client";

/**
 * Static, WebGL-free "sealed perimeter" — a faint violet containment lattice
 * (concentric great-circle rings + meridian/parallel spokes) with the cyan
 * lock-ring sealed at the equator. The frozen twin of the live QuantumOrb's
 * "secure perimeter established" read, in two colors and zero motion by default.
 *
 * Shared by two callers so the boot beat and the low-power backdrop speak the
 * exact same visual language (the boot seal hands off seamlessly into the live
 * orb, which is the same lattice):
 *   - placement="center" + draw : the boot intro beat (centered, brighter, the
 *     cyan ring animates CLOSED once via stroke-dashoffset).
 *   - placement="backdrop"      : Scene's low-power / reduced-motion / save-data
 *     fallback when the WebGL Canvas is skipped (quiet, dropped low on mobile).
 *
 * Honors prefers-reduced-motion: the global reduced-motion net collapses the
 * seal-draw animation so the ring renders already-closed (the established state).
 */
export default function SealedPerimeter({
    isDesktop,
    draw = false,
    placement = "backdrop",
}: {
    isDesktop: boolean;
    /** Animate the cyan lock-ring drawing closed once (the boot seal beat). */
    draw?: boolean;
    placement?: "center" | "backdrop";
}) {
    const centered = placement === "center";
    const size = centered
        ? "min(46vmin, 460px)"
        : isDesktop
          ? "min(62vmin, 620px)"
          : "min(78vw, 360px)";
    const top = centered ? "50%" : isDesktop ? "50%" : "78%";
    const wrapOpacity = centered ? 0.95 : isDesktop ? 0.85 : 0.5;

    return (
        <div
            aria-hidden
            className="absolute inset-0 overflow-hidden"
            style={{ background: "#020617" }}
        >
            <div
                className="absolute"
                style={{
                    width: size,
                    height: size,
                    left: "50%",
                    top,
                    transform: "translate(-50%, -50%)",
                    opacity: wrapOpacity,
                }}
            >
                <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" aria-hidden>
                    {/* Violet containment lattice (shield-mesh, frozen): two
                        concentric rings + light meridian/parallel spokes so it
                        reads as a structured guarded boundary. Violet only. */}
                    <g stroke="#8b5cf6" strokeWidth="0.6" opacity={centered ? 0.32 : 0.28}>
                        <circle cx="100" cy="100" r="78" />
                        <circle cx="100" cy="100" r="60" />
                        <ellipse cx="100" cy="100" rx="30" ry="78" />
                        <ellipse cx="100" cy="100" rx="60" ry="78" />
                        <ellipse cx="100" cy="100" rx="78" ry="30" />
                        <ellipse cx="100" cy="100" rx="78" ry="60" />
                    </g>
                    {/* Sealed cyan lock-ring at the equator (--accent, the secure
                        signal). On the boot beat it draws closed once; otherwise it
                        renders already-sealed. */}
                    <ellipse
                        cx="100"
                        cy="100"
                        rx="80"
                        ry="22"
                        stroke="#22d3ee"
                        strokeWidth="1.4"
                        opacity="0.7"
                        className={draw ? "seal-ring-draw" : undefined}
                    />
                    {/* Faint violet core hint so the silhouette has a center of mass. */}
                    <circle cx="100" cy="100" r="22" fill="#8b5cf6" opacity="0.06" />
                </svg>
            </div>
        </div>
    );
}
