import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

// Run deliberately when the studio recipe or Three.js changes, not on every
// build. Both original resolutions and every half-float texel are preserved.
const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  if (path === "/")
    return response.end("<!doctype html><title>Studio bake</title>");
  if (!/^\/three\.(?:module|core)\.js$/.test(path)) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader("Content-Type", "text/javascript");
  response.end(
    await readFile(
      new URL("../node_modules/three/build" + path, import.meta.url),
    ),
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const destination = new URL("../public/environment/", import.meta.url);
  await mkdir(destination, { recursive: true });
  for (const size of [64, 256]) {
    const encoded = await page.evaluate(async (size) => {
      const THREE = await import("/three.module.js");
      const lightweight = size === 64;
      const renderer = new THREE.WebGLRenderer({
        antialias: !lightweight,
        alpha: true,
        powerPreference: "low-power",
      });
      renderer.setClearColor(0x07100e, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
      // A procedural studio environment provides reflections without external HDR assets.
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x23332a);
      const envGeometries = [],
        envMaterials = [];
      [
        [0, 8, 0, 14, 4],
        [-8, 1, 4, 5, 12],
        [7, 3, -4, 4, 9],
      ].forEach(([x, y, z, w, h]) => {
        const g = new THREE.PlaneGeometry(w, h);
        const m = new THREE.MeshBasicMaterial({
          color: 0xe7ffd0,
          side: THREE.DoubleSide,
        });
        const plane = new THREE.Mesh(g, m);
        plane.position.set(x, y, z);
        plane.lookAt(0, 0, 0);
        envScene.add(plane);
        envGeometries.push(g);
        envMaterials.push(m);
      });
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(envScene, 0.025, 0.1, 100, {
        size: lightweight ? 64 : 256,
      });

      const pixels = new Uint16Array(
        environment.width * environment.height * 4,
      );
      await renderer.readRenderTargetPixelsAsync(
        environment,
        0,
        0,
        environment.width,
        environment.height,
        pixels,
      );
      const bytes = new Uint8Array(pixels.buffer);
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 32768)
        binary += String.fromCharCode(
          ...bytes.subarray(offset, offset + 32768),
        );
      environment.dispose();
      pmrem.dispose();
      envGeometries.forEach((g) => g.dispose());
      envMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      return btoa(binary);
    }, size);
    const raw = Buffer.from(encoded, "base64");
    const compressed = gzipSync(raw, { level: 9 });
    const file = new URL(`studio-r182-${size}.bin.gz`, destination);
    await writeFile(file, compressed);
    console.log(
      `${size}px studio: ${raw.length} bytes -> ${compressed.length} bytes`,
    );
  }
} finally {
  await browser?.close();
  server.close();
}
