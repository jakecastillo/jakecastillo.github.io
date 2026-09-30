import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const mark = await readFile("public/brand-jc.svg");
for (const size of [32, 48, 64, 192, 512])
  await sharp(mark)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
await sharp(mark)
  .resize(180, 180)
  .png()
  .toFile("public/icons/apple-touch-icon.png");
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#10231b" },
})
  .composite([
    { input: await sharp(mark).resize(320, 320).toBuffer(), left: 96, top: 96 },
  ])
  .png()
  .toFile("public/icons/icon-512-maskable.png");
const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="glow"><stop stop-color="#31442a"/><stop offset="1" stop-color="#07110f"/></radialGradient></defs><rect width="1200" height="630" fill="#07110f"/><ellipse cx="990" cy="370" rx="390" ry="420" fill="url(#glow)"/><g fill="none" stroke="#adc68c" opacity=".3"><path d="m760 240 180-90 180 90-180 90Zm0 65 180-90 180 90-180 90Zm0 65 180-90 180 90-180 90Z"/><circle cx="940" cy="360" r="180"/></g><text x="72" y="115" font-family="sans-serif" font-size="23" fill="#e8eedf">JAKE CASTILLO</text><text x="72" y="284" font-family="sans-serif" font-size="72" letter-spacing="-3" fill="#e8eedf">Complex systems.</text><text x="72" y="370" font-family="Georgia,serif" font-style="italic" font-size="78" fill="#dbf5a0">Clear solutions.</text><text x="76" y="538" font-family="monospace" font-size="19" fill="#b6c4ad">SOFTWARE &amp; SYSTEMS / HONOLULU, HAWAIʻI</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile("public/og.png");
await writeFile(
  "public/site.webmanifest",
  JSON.stringify(
    {
      name: "Jake Castillo — Software & Systems",
      short_name: "Jake Castillo",
      start_url: "/",
      display: "browser",
      background_color: "#07110f",
      theme_color: "#07110f",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/icons/icon-512-maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Generated app icons and social preview. No source photo or metadata is embedded.",
);
