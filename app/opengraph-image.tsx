import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BRAND } from "@/components/desktop/config/brand";

/*
 * Build-time Open Graph / social card for the jake.os portfolio.
 *
 * Next's metadata image-route convention renders this to a static PNG at
 * `out/opengraph-image.png` during `next build` (output: "export"), so there
 * is NO server or edge runtime involved — keep the DEFAULT nodejs runtime so
 * `node:fs` works and the static export stays clean (do NOT add runtime="edge").
 *
 * VOID/LASER: #050505 void with violet (#8b5cf6) + cyan (#22d3ee) laser glow,
 * the two-tone jake.os wordmark, the single canonical BRAND identity, a faux
 * menubar strip, and the human-presence portrait (read as a JPEG buffer —
 * Satori cannot decode webp/avif, hence the .jpg source).
 */

export const dynamic = "force-static"; // required for next/og under output:"export"
export const alt = `${BRAND.name} — ${BRAND.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// VOID/LASER tokens mirrored from app/globals.css (Satori has no Tailwind/CSS vars).
const VOID = "#050505";
const VIOLET = "#8b5cf6";
const CYAN = "#22d3ee";
const FOREGROUND = "#e0e0e0";
const MUTED = "#a1a1aa";
const WINDOW = "#0a0a18";
const BORDER = "#27272a";

// Read the optimized portrait as a JPEG buffer -> data URI (build-time, nodejs).
function portraitDataUri(): string {
    const file = join(process.cwd(), "public", "portrait", "jake-256.jpg");
    const buffer = readFileSync(file);
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

export default function OpengraphImage() {
    const portrait = portraitDataUri();
    const dot = BRAND.handle.indexOf(".");
    const wordmarkName = dot === -1 ? BRAND.handle : BRAND.handle.slice(0, dot);
    const wordmarkSuffix = dot === -1 ? "" : BRAND.handle.slice(dot);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    backgroundColor: VOID,
                    fontFamily: "sans-serif",
                }}
            >
                {/* Laser glow — violet from top-left, cyan from bottom-right. */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        backgroundImage: `radial-gradient(900px 600px at 18% -10%, rgba(139,92,246,0.32), transparent 60%), radial-gradient(900px 600px at 100% 120%, rgba(34,211,238,0.22), transparent 55%)`,
                    }}
                />

                {/* Faux menubar strip — mirrors the desktop-OS metaphor. */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: 56,
                        paddingLeft: 56,
                        paddingRight: 56,
                        borderBottom: `1px solid ${BORDER}`,
                        backgroundColor: "rgba(10,10,24,0.6)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                            style={{
                                display: "flex",
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                backgroundColor: VIOLET,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                letterSpacing: 1,
                                fontFamily: "monospace",
                            }}
                        >
                            <span style={{ color: VIOLET }}>{wordmarkName}</span>
                            <span style={{ color: CYAN }}>{wordmarkSuffix}</span>
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: 18,
                            color: MUTED,
                            fontFamily: "monospace",
                            letterSpacing: 0.5,
                        }}
                    >
                        online · Honolulu
                    </span>
                </div>

                {/* Hero body — identity on the left, portrait on the right. */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingLeft: 72,
                        paddingRight: 72,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            maxWidth: 680,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 88,
                                fontWeight: 800,
                                lineHeight: 1.02,
                                color: FOREGROUND,
                                letterSpacing: -1.5,
                            }}
                        >
                            {BRAND.name}
                        </span>
                        <span
                            style={{
                                marginTop: 18,
                                fontSize: 30,
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color: CYAN,
                            }}
                        >
                            {BRAND.role}
                        </span>
                        {/* Signature — the ownable POV is the loud hook of the unfurl. */}
                        <span
                            style={{
                                marginTop: 22,
                                fontSize: 40,
                                fontWeight: 800,
                                lineHeight: 1.18,
                                color: FOREGROUND,
                                letterSpacing: -0.5,
                            }}
                        >
                            {BRAND.signature}
                        </span>
                        {/* Tagline demoted to a quiet, descriptive support line. */}
                        <span
                            style={{
                                marginTop: 18,
                                fontSize: 22,
                                lineHeight: 1.35,
                                color: MUTED,
                            }}
                        >
                            {BRAND.tagline}
                        </span>
                    </div>

                    {/* Right column — supporting mark, portrait, and a proof chip,
                        stacked and centered so the card reads as a composed whole. */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 18,
                        }}
                    >
                        {/* Small jake.os mark above the photo, echoing the menubar. */}
                        <span
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                letterSpacing: 1,
                                fontFamily: "monospace",
                            }}
                        >
                            <span style={{ color: VIOLET }}>{wordmarkName}</span>
                            <span style={{ color: CYAN }}>{wordmarkSuffix}</span>
                        </span>

                        {/* Portrait — human presence, framed in a laser-glow ring. */}
                        <div
                            style={{
                                display: "flex",
                                padding: 5,
                                borderRadius: 28,
                                backgroundImage: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                                boxShadow: "0 0 60px rgba(139,92,246,0.45)",
                            }}
                        >
                            <img
                                src={portrait}
                                alt=""
                                width={256}
                                height={256}
                                style={{
                                    width: 256,
                                    height: 256,
                                    borderRadius: 24,
                                    objectFit: "cover",
                                    border: `4px solid ${WINDOW}`,
                                }}
                            />
                        </div>

                        {/* Single proof metric chip — the flagship outcome, quantified. */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                paddingTop: 8,
                                paddingBottom: 8,
                                paddingLeft: 16,
                                paddingRight: 16,
                                borderRadius: 999,
                                border: `1px solid ${BORDER}`,
                                backgroundColor: "rgba(10,10,24,0.6)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    width: 8,
                                    height: 8,
                                    borderRadius: 999,
                                    backgroundColor: CYAN,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    fontFamily: "monospace",
                                    color: FOREGROUND,
                                    letterSpacing: 0.3,
                                }}
                            >
                                ~40% faster deploys
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
