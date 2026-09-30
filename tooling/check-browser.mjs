import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const origin = "http://127.0.0.1:4175";
const server = spawn(process.execPath, ["tooling/serve.mjs"], {
  env: { ...process.env, PORT: "4175" },
  stdio: "ignore",
});
let browser;
async function ready() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(origin)).ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error("Export preview did not start");
}
try {
  await ready();
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.locator("body.cinematic").waitFor();
  await page.locator(".webgl-system").waitFor();
  assert.equal(await page.locator("h1").count(), 1);
  for (let i = 0; i < 5; i++) {
    await page.locator(".chapter-navigation a").nth(i).click();
    await page.waitForFunction(
      (index) =>
        document.querySelector(".scene-copy.current")?.dataset.scene ===
        String(index),
      i,
    );
    assert.equal(
      await page.locator(".chapter-navigation [aria-current]").count(),
      1,
    );
    assert.equal(
      await page.locator(".scene-copy:not(.current):not([inert])").count(),
      0,
    );
  }
  await page.getByRole("link", { name: "Work", exact: true }).click();
  await page.locator("#architecture-detail summary").press("Enter");
  await page.locator("#architecture-detail[open]").waitFor();
  for (let i = 0; i < 3; i++)
    await page.locator("#architecture-detail summary").press("Enter");
  assert.equal(
    await page.locator("#architecture-detail").getAttribute("open"),
    null,
  );
  await page.goto(origin + "/#architecture-detail");
  await page.locator("#architecture-detail[open]").waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector("#architecture-detail").getBoundingClientRect()
        .top < innerHeight,
  );
  for (const [width, height] of [
    [320, 700],
    [390, 844],
    [768, 1024],
    [844, 390],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("link", { name: "Work history", exact: true }).click();
    await page.waitForTimeout(200);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Overflow at ${width}x${height}`,
    );
  }
  assert.equal(await page.locator(".career-timeline>li").count(), 4);
  assert.equal(await page.locator(".stack-list li").count(), 64);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    accessibility.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
    "Accessibility violations",
  );
  await page.goto(origin + "/#history");
  await page.waitForFunction(
    () =>
      document.querySelector("#history").getBoundingClientRect().top <
      innerHeight,
  );
  await page.reload();
  await page.waitForFunction(
    () =>
      document.querySelector("#history").getBoundingClientRect().top <
      innerHeight,
  );
  await page.goto(origin + "/#exp");
  await page.waitForURL("**/#history");
  // GPU loss must preserve the reading experience, not leave an empty hero.
  await page.goto(origin);
  await page.locator("canvas.webgl-system").waitFor();
  await page
    .locator("canvas.webgl-system")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await page.waitForFunction(
    () => !document.body.classList.contains("webgl-ready"),
  );
  assert.equal(await page.locator(".mobile-system").isVisible(), true);
  assert.deepEqual(errors, [], "Unexpected browser exceptions");

  await context.close();
  console.log(
    "Navigation, responsive, accessibility, and GPU fallback checks passed.",
  );
  // Android-sized touch viewport with WebGL unavailable: the scene must still animate.
  const phone = await browser.newContext({
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  await phone.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/.test(type)) return null;
      return getContext.call(this, type, ...args);
    };
  });
  const phonePage = await phone.newPage();
  phonePage.on("pageerror", (error) => errors.push(error.message));
  await phonePage.goto(origin);
  await phonePage.locator("body.mobile-scene.compact").waitFor();
  assert.equal(await phonePage.locator("canvas.webgl-system").count(), 0);
  assert.equal(await phonePage.locator(".mobile-system").isVisible(), true);
  for (let i = 1; i < 5; i++) {
    await phonePage.locator(".chapter-navigation a").nth(i).tap();
    await phonePage.waitForFunction((index) => {
      const p = Number(
        document.querySelector(".mobile-system").dataset.progress,
      );
      return p > (index - 1) / 4 && p < index / 4;
    }, i);
    await phonePage.waitForFunction(
      (index) =>
        document.querySelector(".mobile-system").dataset.progress ===
        (index / 4).toFixed(3),
      i,
    );
    assert.equal(
      await phonePage.locator(".scene-copy.current").getAttribute("data-scene"),
      String(i),
    );
    assert.equal(
      await phonePage.locator(".scene-copy:not(.current):not([inert])").count(),
      0,
    );
    const layout = await phonePage.evaluate(() => {
      const text = document
        .querySelector(".scene-copy.current")
        .getBoundingClientRect();
      const scene = document
        .querySelector(".mobile-system")
        .getBoundingClientRect();
      const dock = document
        .querySelector(".chapter-navigation")
        .getBoundingClientRect();
      return (
        text.bottom <= scene.top &&
        scene.bottom <= dock.top &&
        document.documentElement.scrollWidth <= innerWidth
      );
    });
    assert.equal(layout, true, "Phone text, scene, and dock must not overlap");
  }
  await phonePage.locator(".chapter-navigation a").nth(0).tap();
  await phonePage.locator(".chapter-navigation a").nth(2).tap();
  await phonePage.waitForFunction(
    () => document.querySelector(".mobile-system").dataset.progress === "0.500",
  );
  await phonePage.setViewportSize({ width: 851, height: 393 });
  assert.equal(await phonePage.locator(".mobile-system").isVisible(), true);
  assert.equal(await phonePage.locator("canvas.webgl-system").count(), 0);
  await phonePage.setViewportSize({ width: 360, height: 740 });
  await phonePage.emulateMedia({ reducedMotion: "reduce" });
  await phonePage.locator("body.is-reading").waitFor();
  assert.equal(await phonePage.locator(".mobile-system").isVisible(), true);
  await phonePage.waitForFunction(
    () => document.querySelector(".mobile-system").dataset.progress === "0.000",
  );
  await phone.close();
  const phonePlain = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  const phonePlainPage = await phonePlain.newPage();
  await phonePlainPage.goto(origin);
  assert.equal(
    await phonePlainPage.locator(".mobile-system").isVisible(),
    true,
  );
  await phonePlain.close();
  console.log(
    "Mobile SVG, touch transitions, rotation, reduced motion, and no-JS fallback passed.",
  );
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  reducedPage.on("pageerror", (error) => errors.push(error.message));
  await reducedPage.goto(origin);
  await reducedPage.locator("body.is-reading").waitFor();
  assert.equal(
    await reducedPage.locator("canvas.webgl-system").count(),
    0,
    "Reduced motion should not initialize WebGL",
  );
  // Let Chromium establish the initial media-query state before changing it.
  await reducedPage.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await reducedPage.emulateMedia({ reducedMotion: "no-preference" });
  await reducedPage.locator("canvas.webgl-system").waitFor();
  await reducedPage.emulateMedia({ reducedMotion: "reduce" });
  await reducedPage.locator("body.is-reading").waitFor();
  await reduced.close();
  const plain = await browser.newContext({ javaScriptEnabled: false });
  const plainPage = await plain.newPage();
  await plainPage.goto(origin);
  assert.equal(await plainPage.locator(".career-timeline>li").count(), 4);
  await plainPage.getByRole("link", { name: "Work", exact: true }).click();
  await plainPage.locator("#architecture-detail summary").click();
  assert.notEqual(
    await plainPage.locator("#architecture-detail").getAttribute("open"),
    null,
  );
  assert.equal(await plainPage.locator("h1").isVisible(), true);
  await plain.close();
  assert.deepEqual(errors, [], "Unexpected browser exceptions");
  console.log(
    "Browser checks passed: chapters, focus, disclosures, deep links, responsive layouts, accessibility, reduced motion, no-JS, and GPU fallback.",
  );
} finally {
  await browser?.close();
  server.kill();
}
