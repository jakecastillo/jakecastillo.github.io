import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const port = Number(process.env.PORT || 4174);
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const content = await readFile(file);
    res
      .writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      })
      .end(content);
  } catch {
    res
      .writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
      .end(await readFile(resolve(root, "404.html")).catch(() => "Not found"));
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Static production preview: http://127.0.0.1:${port}`),
);
