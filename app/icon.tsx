import { ImageResponse } from "next/og";

/*
 * Build-time favicon derived from the jake.os wordmark mark.
 *
 * Next's icon convention renders this to a static PNG and injects the matching
 * <link rel="icon"> tags at build time (output: "export") — no edge runtime.
 * Renders a violet -> cyan two-tone "j" glyph on the VOID background so the
 * single brand identity reaches the browser tab too.
 */

const VOID = "#050505";
const VIOLET = "#8b5cf6";
const CYAN = "#22d3ee";

export const dynamic = "force-static"; // required for next/og under output:"export"
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: VOID,
                    borderRadius: 7,
                    backgroundImage: `radial-gradient(20px 20px at 30% 20%, rgba(139,92,246,0.55), transparent 70%), radial-gradient(20px 20px at 80% 90%, rgba(34,211,238,0.45), transparent 70%)`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        fontSize: 26,
                        fontWeight: 800,
                        fontFamily: "monospace",
                        lineHeight: 1,
                    }}
                >
                    <span style={{ color: VIOLET }}>j</span>
                    <span style={{ color: CYAN }}>.</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
