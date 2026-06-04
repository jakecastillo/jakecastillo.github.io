// scripts/optimize-portrait.mjs
// Build-time portrait pipeline: read public/jake-portrait.jpeg, make a tight
// square head-crop, and emit public/portrait/jake-{128,256,512}.{webp,jpg}.
// images.unoptimized:true (static export) means there is NO runtime image
// optimization — every asset the site serves must be baked here at build time.
// Wired as the `prebuild` npm script so `next build` always ships fresh assets.
import { mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "jake-portrait.jpeg");
const OUT_DIR = path.join(ROOT, "public", "portrait");
const SIZES = [128, 256, 512];

// Head-crop tuned to the source framing. The portrait is ~square (2572x2573)
// with the subject's face in the upper-center. R7-5: loosen the crop slightly so
// the head has more breathing room — instead of grabbing the full largest square
// (which pinned the head to the top edge), we take a slightly inset square and a
// gentle top bias, leaving headroom above and air around the face. The webp+jpg
// outputs at 128/256/512 and the <80KB budget are unchanged.
const CROP_INSET = 0.06; // shrink the square this fraction per side for margin/air
const CROP_TOP_BIAS = 0.02; // gentle upward nudge so the face stays optically centered

async function main() {
  if (!existsSync(SRC)) {
    console.log(`PORTRAIT SKIP: source not found at ${path.relative(ROOT, SRC)}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const meta = await sharp(SRC).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error("Could not read source portrait dimensions");

  // Square head-crop: a slightly inset centered square (looser than full-frame for
  // breathing room), nudged gently up so the face reads optically centered.
  const maxSide = Math.min(w, h);
  const side = Math.round(maxSide * (1 - CROP_INSET));
  const left = Math.round((w - side) / 2);
  const top = Math.max(
    0,
    Math.min(h - side, Math.round((h - side) / 2 - side * CROP_TOP_BIAS))
  );
  const cropped = sharp(SRC).extract({ left, top, width: side, height: side });

  const written = [];
  for (const size of SIZES) {
    const base = cropped.clone().resize(size, size, { fit: "cover", position: "centre" });

    const webpPath = path.join(OUT_DIR, `jake-${size}.webp`);
    const jpgPath = path.join(OUT_DIR, `jake-${size}.jpg`);

    await base.clone().webp({ quality: 82, effort: 6 }).toFile(webpPath);
    await base
      .clone()
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toFile(jpgPath);

    const [webpKB, jpgKB] = await Promise.all([sizeKB(webpPath), sizeKB(jpgPath)]);
    written.push({ size, webpKB, jpgKB });
  }

  for (const { size, webpKB, jpgKB } of written) {
    console.log(`PORTRAIT ${size}px  webp ${webpKB}KB  jpg ${jpgKB}KB`);
  }

  // Acceptance guard: the 512 webp is the largest asset and must stay <80KB.
  const webp512 = written.find((r) => r.size === 512);
  if (webp512 && webp512.webpKB >= 80) {
    throw new Error(`512 webp is ${webp512.webpKB}KB (budget: <80KB)`);
  }

  console.log(`PORTRAIT DONE: ${written.length} sizes -> ${path.relative(ROOT, OUT_DIR)}`);
}

async function sizeKB(file) {
  const { size } = await stat(file);
  return Math.round((size / 1024) * 10) / 10;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
