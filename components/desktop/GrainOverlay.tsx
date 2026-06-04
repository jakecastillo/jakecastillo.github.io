/**
 * GrainOverlay — the 2026 "premium finish" texture pass (R10a).
 *
 * A single, fully static SVG `feTurbulence` (type=fractalNoise) baked into a
 * data-URI background and laid over the whole shell at ~4% opacity with
 * `mix-blend-mode: soft-light`. It breaks up the flat near-black surfaces so
 * the void + radial vignettes never band on 8-bit panels, and it reads as a
 * deliberate, tactile finish rather than the default "smooth = unfinished"
 * gradient wash.
 *
 * Why inline data-URI: it ships zero network requests (static-export safe),
 * costs nothing on the critical path, and never animates — so it is inherently
 * reduced-motion-safe (there is no motion to suppress).
 *
 * Layering: mounted ONCE per shell (DesktopShell + MobileShell) at `z-[5]`, so
 * it sits ABOVE the z-0 orb/wallpaper + strapline but BELOW windows (z >= 11)
 * and the menubar/dock (z-40) — texture on the backdrop, never muddying app
 * text or the cyan ring bloom.
 *
 * `pointer-events-none` + `aria-hidden` + `select-none`: it is pure decoration
 * and can never intercept a click, drag, or focus, nor reach assistive tech.
 */

// fractalNoise turbulence at a fairly high base frequency reads as fine film
// grain rather than coarse clouds. baseFrequency ~0.9 + 2 octaves keeps the
// grain tight; stitchTiles="stitch" avoids visible seams when the tile repeats.
// The SVG is intentionally small (160x160) and tiled via background-repeat so
// the data-URI stays tiny.
const GRAIN_SVG = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">` +
        `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter>` +
        `<rect width="160" height="160" filter="url(#g)"/>` +
        `</svg>`,
);

const GRAIN_DATA_URI = `url("data:image/svg+xml,${GRAIN_SVG}")`;

export default function GrainOverlay() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[5] select-none"
            style={{
                backgroundImage: GRAIN_DATA_URI,
                // Tile the small grain texture across the viewport.
                backgroundRepeat: "repeat",
                backgroundSize: "160px 160px",
                // ~4% so it textures the void without softening body text or
                // dulling the cyan ring bloom. soft-light keeps it subordinate
                // to the underlying color (it nudges luminance, never recolors).
                opacity: 0.04,
                mixBlendMode: "soft-light",
            }}
        />
    );
}
