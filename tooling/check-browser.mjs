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
  // Mobile keeps the real 3D scene and follows native scrolling in both directions.
  const phone = await browser.newContext({
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const phonePage = await phone.newPage();
  phonePage.on("pageerror", (error) => errors.push(error.message));
  let releaseScripts;
  const scriptGate = new Promise((resolve) => {
    releaseScripts = resolve;
  });
  await phonePage.route("**/*.js", async (route) => {
    await scriptGate;
    await route.continue();
  });
  await phonePage.goto(origin, { waitUntil: "commit" });
  await phonePage.locator("h1").waitFor();
  await phonePage.evaluate(() => document.fonts.ready);
  await phonePage.locator(".scene-loader").waitFor();
  assert.equal(
    await phonePage.locator(".mobile-system").isVisible(),
    false,
    "The fallback must not flash before the scene loads",
  );
  const initialScene = await phonePage.locator(".system-theater").boundingBox();
  const initialStage = await phonePage.locator(".cinema-stage").boundingBox();
  releaseScripts();
  await phonePage.locator("body.webgl-ready").waitFor();
  const loadedScene = await phonePage.locator(".system-theater").boundingBox();
  const loadedStage = await phonePage.locator(".cinema-stage").boundingBox();
  assert.deepEqual(
    loadedScene,
    initialScene,
    "Loading must not move or resize the visual slot",
  );
  assert.deepEqual(
    loadedStage,
    initialStage,
    "Enhancement must not shift the hero",
  );
  await phonePage.locator(".scene-loader").waitFor({ state: "hidden" });
  await phonePage.unroute("**/*.js");
  assert.equal(
    await phonePage.locator("canvas.webgl-system").getAttribute("data-quality"),
    "mobile",
  );
  assert.equal(await phonePage.locator(".mobile-system").isVisible(), false);
  assert.equal(await phonePage.locator("body.compact").count(), 0);
  const initialBuffer = await phonePage
    .locator("canvas")
    .evaluate((canvas) => ({
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
    }));
  assert.ok(
    initialBuffer.width >= initialBuffer.cssWidth * 2,
    "High-density phones should render above CSS resolution",
  );
  assert.ok(
    initialBuffer.width <= initialBuffer.cssWidth * 2.5 + 1,
    "Phone rendering should stay within the 2.5x density ceiling",
  );
  assert.ok(
    initialBuffer.width * initialBuffer.height <= 900_000,
    "Phone drawing buffer must stay within its pixel budget",
  );
  const scrollChapter = async (page, progress) => {
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.evaluate((p) => {
      const track = document.querySelector(".scroll-track");
      const stage = document.querySelector(".cinema-stage");
      const start = track.getBoundingClientRect().top + scrollY;
      scrollTo({
        top: start + (track.offsetHeight - stage.offsetHeight) * p,
        behavior: "instant",
      });
    }, progress);
    await page.waitForFunction(
      (p) =>
        Math.abs(
          Number(document.querySelector(".mobile-system").dataset.progress) - p,
        ) < 0.005,
      progress,
    );
  };
  for (const i of [0, 1, 2, 3, 4, 3, 2, 1, 0]) {
    await scrollChapter(phonePage, i / 4);
    assert.equal(
      await phonePage.locator(".scene-copy.current").getAttribute("data-scene"),
      String(i),
    );
    assert.equal(
      await phonePage.locator(".scene-copy:not(.current):not([inert])").count(),
      0,
    );
    assert.equal(
      await phonePage
        .locator(".cinema-stage")
        .evaluate((stage) => getComputedStyle(stage).position),
      "sticky",
    );
  }
  await scrollChapter(phonePage, 0.5);
  await phonePage.waitForFunction(
    () =>
      Math.abs(
        Number(document.querySelector("canvas.webgl-system").dataset.progress) -
          0.385,
      ) < 0.01,
  );
  console.log(
    "Mobile rendering:",
    await phonePage.locator("canvas").evaluate((canvas) => ({
      quality: canvas.dataset.quality,
      drawCalls: canvas.dataset.drawCalls,
      triangles: canvas.dataset.triangles,
      width: canvas.width,
      cssWidth: canvas.clientWidth,
    })),
  );
  // A browser toolbar can change height without rotating the device. The
  // sticky composition and its scroll range should remain exactly unchanged.
  await scrollChapter(phonePage, 0.03);
  const stableLayout = async () =>
    phonePage.evaluate(() => ({
      scroll: scrollY,
      stage: document
        .querySelector(".cinema-stage")
        .getBoundingClientRect()
        .toJSON(),
      scene: document
        .querySelector(".system-theater")
        .getBoundingClientRect()
        .toJSON(),
      track: document.querySelector(".scroll-track").offsetHeight,
      progress: document.querySelector(".mobile-system").dataset.progress,
    }));
  const beforeToolbar = await stableLayout();
  await phonePage.setViewportSize({ width: 393, height: 920 });
  await phonePage.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.deepEqual(
    await stableLayout(),
    beforeToolbar,
    "Toolbar collapse must not pull down the page or jump the scroll animation",
  );
  await phonePage.setViewportSize({ width: 393, height: 851 });
  await phonePage.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.deepEqual(
    await stableLayout(),
    beforeToolbar,
    "Toolbar expansion must preserve the scene",
  );
  for (const [width, height] of [
    [412, 915],
    [360, 740],
    [320, 640],
    [851, 393],
    [393, 751],
    [393, 851],
  ]) {
    await phonePage.setViewportSize({ width, height });
    await scrollChapter(phonePage, 0.5);
    const layout = await phonePage.evaluate(() => {
      const text = document
        .querySelector(".scene-copy.current")
        .getBoundingClientRect();
      const scene = document
        .querySelector(".system-theater")
        .getBoundingClientRect();
      const dock = document
        .querySelector(".chapter-navigation")
        .getBoundingClientRect();
      return (
        (text.bottom <= scene.top || text.right <= scene.left) &&
        scene.bottom <= dock.top &&
        document.documentElement.scrollWidth <= innerWidth &&
        scene.height >= 180 &&
        dock.bottom <= innerHeight + 1 &&
        document.querySelector("canvas.webgl-system").width *
          document.querySelector("canvas.webgl-system").height <=
          900_000
      );
    });
    assert.equal(layout, true, `Mobile scene layout at ${width}x${height}`);
  }
  await phonePage.getByRole("link", { name: "Work", exact: true }).click();
  await phonePage.waitForFunction(
    () =>
      document
        .querySelector(".work-group")
        .style.getPropertyValue("--area-progress") !== "",
  );
  await phonePage
    .getByRole("link", { name: "Work history", exact: true })
    .click();
  await phonePage.waitForFunction(
    () =>
      document
        .querySelector(".career-timeline")
        .style.getPropertyValue("--career-progress") !== "",
  );
  await phonePage.emulateMedia({ reducedMotion: "reduce" });
  await phonePage.locator("body.is-reading").waitFor();
  await phone.close();
  // A delayed reflection asset must not delay native navigation. Once ready,
  // the scene joins the current scroll position instead of resetting the intro.
  const pending = await browser.newContext({
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
  });
  const pendingPage = await pending.newPage();
  pendingPage.on("pageerror", (error) => errors.push(error.message));
  let releaseEnvironment;
  const environmentGate = new Promise((resolve) => {
    releaseEnvironment = resolve;
  });
  await pendingPage.route("**/environment/*.bin.gz", async (route) => {
    await environmentGate;
    await route.continue();
  });
  await pendingPage.goto(origin);
  await pendingPage.locator("body.cinematic").waitFor();
  await scrollChapter(pendingPage, 0.5);
  assert.equal(
    await pendingPage.locator(".scene-copy.current").getAttribute("data-scene"),
    "2",
  );
  assert.equal(await pendingPage.locator("canvas.webgl-system").count(), 0);
  releaseEnvironment();
  await pendingPage.locator("body.webgl-ready").waitFor();
  assert.equal(
    await pendingPage
      .locator("canvas.webgl-system")
      .getAttribute("data-progress"),
    "0.385",
  );
  await pending.close();

  // Hold shader readiness pending, even if the driver has cached the programs.
  for (const cancellation of ["reduced-motion", "pagehide", "context-loss"]) {
    const pendingCompile = await browser.newContext();
    await pendingCompile.addInitScript(() => {
      window.liveGraphicsWorkers = 0;
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args);
          window.liveGraphicsWorkers++;
        }
        terminate() {
          if (!this.stopped) window.liveGraphicsWorkers--;
          this.stopped = true;
          super.terminate();
        }
      };
      const original = WebGL2RenderingContext.prototype.getProgramParameter;
      const getExtension = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function (name) {
        if (name === "KHR_parallel_shader_compile")
          return { COMPLETION_STATUS_KHR: 0x91b1 };
        return getExtension.call(this, name);
      };
      window.shaderChecks = 0;
      window.holdShaders = true;
      WebGL2RenderingContext.prototype.getProgramParameter = function (
        program,
        parameter,
      ) {
        if (parameter === 0x91b1) {
          window.shaderChecks++;
          return !window.holdShaders;
        }
        return original.call(this, program, parameter);
      };
    });
    const preparing = await pendingCompile.newPage();
    preparing.on("pageerror", (error) => errors.push(error.message));
    await preparing.goto(origin);
    await preparing.waitForFunction(() => window.shaderChecks > 0);
    if (cancellation === "reduced-motion")
      await preparing.emulateMedia({ reducedMotion: "reduce" });
    else if (cancellation === "pagehide")
      await preparing.evaluate(() =>
        dispatchEvent(new PageTransitionEvent("pagehide")),
      );
    else
      await preparing
        .locator("canvas.webgl-system")
        .evaluate((canvas) =>
          canvas.dispatchEvent(
            new Event("webglcontextlost", { cancelable: true }),
          ),
        );
    await preparing.waitForFunction(
      () => !document.querySelector("canvas.webgl-system"),
    );
    assert.equal(
      await preparing.evaluate(() => window.liveGraphicsWorkers),
      0,
      "Graphics warmup workers must be released",
    );
    const stoppedChecks = await preparing.evaluate(() => window.shaderChecks);
    await preparing.waitForTimeout(60);
    assert.equal(
      await preparing.evaluate(() => window.shaderChecks),
      stoppedChecks,
      `Shader polling must stop after ${cancellation}`,
    );
    if (cancellation === "reduced-motion") {
      await preparing.evaluate(() => {
        window.holdShaders = false;
      });
      await preparing.emulateMedia({ reducedMotion: "no-preference" });
      await preparing.locator("body.webgl-ready").waitFor();
      assert.equal(await preparing.locator("canvas.webgl-system").count(), 1);
    }
    await pendingCompile.close();
  }
  // Worker startup and parallel compilation are optional optimizations.
  // A browser without either must retain the complete WebGL scene.
  const serial = await browser.newContext();
  await serial.addInitScript(() => {
    window.Worker = class {
      constructor() {
        throw new Error("Workers unavailable");
      }
    };
    const original = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (name) {
      return name === "KHR_parallel_shader_compile"
        ? null
        : original.call(this, name);
    };
  });
  const serialPage = await serial.newPage();
  serialPage.on("pageerror", (error) => errors.push(error.message));
  await serialPage.goto(origin);
  await serialPage.locator("body.webgl-ready").waitFor();
  assert.equal(
    await serialPage
      .locator("canvas.webgl-system")
      .getAttribute("data-quality"),
    "full",
  );
  await serial.close();
  const missingEnvironment = await browser.newContext();
  const missingPage = await missingEnvironment.newPage();
  missingPage.on("pageerror", (error) => errors.push(error.message));
  await missingPage.route("**/environment/*.bin.gz", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await missingPage.goto(origin);
  await missingPage.locator("body.css-fallback").waitFor();
  assert.equal(await missingPage.locator("canvas.webgl-system").count(), 0);
  await missingPage.getByRole("link", { name: "Work", exact: true }).click();
  assert.equal(await missingPage.locator("#work").isVisible(), true);
  await missingEnvironment.close();
  console.log(
    "Delayed startup, current-scroll reveal, shader cancellation, and missing-environment fallback passed.",
  );
  const unavailable = await browser.newContext({
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
  });
  await unavailable.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : original.call(this, type, ...args);
    };
  });
  const unavailablePage = await unavailable.newPage();
  await unavailablePage.goto(origin);
  await unavailablePage.locator("body.css-fallback").waitFor();
  assert.equal(
    await unavailablePage.locator(".mobile-system").isVisible(),
    true,
  );
  await scrollChapter(unavailablePage, 0.75);
  await unavailable.close();
  const stalled = await browser.newContext({
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
  });
  const stalledPage = await stalled.newPage();
  await stalledPage.route("**/*.js", (route) => route.abort());
  await stalledPage.goto(origin);
  await stalledPage.locator(".scene-loader").waitFor();
  const stalledScene = await stalledPage
    .locator(".system-theater")
    .boundingBox();
  await stalledPage.locator(".mobile-system").waitFor({ timeout: 12000 });
  assert.equal(
    await stalledPage.locator(".scene-loader").isVisible(),
    false,
    "Loading feedback must be bounded even if all JavaScript fails",
  );
  assert.deepEqual(
    await stalledPage.locator(".system-theater").boundingBox(),
    stalledScene,
  );
  await stalledPage.getByRole("link", { name: "Work", exact: true }).click();
  assert.equal(await stalledPage.locator("#work").isVisible(), true);
  await stalled.close();
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
    "Mobile WebGL, forward/reverse scroll, rotation, record animations, and GPU/no-JS fallback passed.",
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
