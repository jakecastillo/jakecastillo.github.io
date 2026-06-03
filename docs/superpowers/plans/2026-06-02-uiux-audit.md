# jakeOS UI/UX Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive jakeOS in a real browser at desktop + mobile viewports, capture every UI/UX defect as a bead, then auto-fix critical/high/medium via parallel sub-agents and re-verify.

**Architecture:** A Playwright (library, not test-runner) harness launches Chromium against `next dev`, runs a scripted scenario matrix per viewport profile, captures screenshots + console/page/request logs into `scripts/audit/out/`. A human/agent grading pass reads the artifacts and files beads via `bd`. A Workflow fan-out fixes beads grouped by source file, then the harness re-runs as the regression gate.

**Tech Stack:** Node 22, Playwright (cached Chromium 1208), beads (`bd`), Next.js 16 dev server, the existing jakeOS React/zustand app.

**Spec:** [`docs/superpowers/specs/2026-06-02-uiux-audit-design.md`](../specs/2026-06-02-uiux-audit-design.md)

---

## Selector reference (verified against current source)

These are the stable hooks the harness targets. No `data-testid`s exist; we rely on roles/aria.

| Target | Selector |
| --- | --- |
| Dock app button (desktop) | `getByRole('button', { name: '<App>', exact: true })` — names: Terminal, About, Career, Stack, Contact |
| Dock Spotlight button | `getByRole('button', { name: 'Spotlight', exact: true })` — present only in `reveal`/`ready` |
| Window | `[role="dialog"][aria-label="<App> window"]` (e.g. `About window`) |
| Window close/min/max | within dialog: `[aria-label="Close"]` / `[aria-label="Minimize"]` / `[aria-label="Maximize"]` |
| Window titlebar drag point | top-center of the dialog bounding box, `y = box.y + 15` (avoids traffic-light buttons at left) |
| Menubar Tidy button | `getByRole('button', { name: 'Tidy windows into a grid' })` |
| Terminal interactive input | `[aria-label="Terminal input"]` (appears only after the boot typewriter completes) |
| Terminal mobile quick-chips | buttons with text `help`, `ls`, `whoami`, `open about`, `copy email` (visible `md:hidden` → mobile only) |
| Palette input | `input[placeholder^="Search apps"]` (cmdk, autofocus) |
| Mobile nav button | `getByRole('button', { name: '<App>', exact: true })` inside the bottom `nav` |

**Boot timing facts** (from `QuantumLoader.tsx` + `useUrlSync.ts`):
- Cold load: `loading` (≥500ms, ≤1200ms) → `booting` → `reveal` (+480ms) → `ready` (+1000ms). Roughly ready in 1.5–2.7s.
- **Any `pointerdown` / `keydown` / `wheel` during boot jumps straight to `ready`** — so the boot-capture scenario must screenshot via timeouts only, never interacting until ready.
- `?skip=1` (or any `?open=`/`?focus=`) → `reveal` immediately, `ready` after 800ms.
- `prefers-reduced-motion: reduce` → `ready` immediately and `windowPhysics` runs in static (no matter-js) mode.
- Terminal is **always opened by default** (`useUrlSync` seeds `["terminal"]` when no `?open=`).

---

## Task 1: Install tooling (beads + Playwright)

**Files:**
- Modify: `package.json` (adds `playwright` devDependency)
- Create: `.beads/` (via `bd init`)

- [ ] **Step 1: Install beads**

```bash
brew install beads
bd --version   # expect 1.0.5 or newer
```

- [ ] **Step 2: Initialize the bead database at repo root**

```bash
cd /Users/jakecastillo/Documents/GitHub/jakecastillo.github.io
bd init
bd quickstart 2>/dev/null | head -40 || true   # print usage for reference
```

Expected: a `.beads/` directory is created. `bd list` runs without error (empty list).

- [ ] **Step 3: Add Playwright (library)**

```bash
npm i -D playwright
npx playwright install chromium   # reuses cached chromium-1208 if present
node -e "const {chromium}=require('playwright');console.log('playwright ok')"
```

Expected: prints `playwright ok`.

- [ ] **Step 4: Commit tooling**

```bash
git add package.json package-lock.json yarn.lock .beads .gitignore 2>/dev/null
git commit -m "chore(audit): add beads + playwright tooling"
```

(If `bd init` writes a DB file that should not be committed, respect whatever `.beads/.gitignore` it generates — commit the config, not transient state.)

---

## Task 2: Gitignore audit artifacts

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Append the audit output dir to `.gitignore`**

Add these lines:

```
# UI/UX audit artifacts (screenshots, logs)
scripts/audit/out/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore && git commit -m "chore(audit): ignore audit output artifacts"
```

---

## Task 3: Harness — viewport profiles

**Files:**
- Create: `scripts/audit/lib/profiles.mjs`

- [ ] **Step 1: Write the profiles module**

```js
// scripts/audit/lib/profiles.mjs
import { devices } from "playwright";

/**
 * Two audit profiles. Desktop is a generous laptop viewport; mobile uses
 * Playwright's iPhone 13 descriptor (390x844, touch, dSF 3).
 */
export const PROFILES = {
  desktop: {
    name: "desktop",
    contextOptions: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
  },
  mobile: {
    name: "mobile",
    contextOptions: {
      ...devices["iPhone 13"], // viewport 390x844, touch, mobile UA
    },
  },
};
```

- [ ] **Step 2: Sanity check it imports**

```bash
node -e "import('./scripts/audit/lib/profiles.mjs').then(m=>console.log(Object.keys(m.PROFILES)))"
```

Expected: `[ 'desktop', 'mobile' ]`

---

## Task 4: Harness — driver (browser, collectors, helpers)

**Files:**
- Create: `scripts/audit/lib/driver.mjs`

- [ ] **Step 1: Write the driver**

```js
// scripts/audit/lib/driver.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export const BASE_URL = process.env.AUDIT_URL || "http://localhost:3000";
export const OUT_DIR = path.resolve("scripts/audit/out");
export const SHOTS_DIR = path.join(OUT_DIR, "shots");

export async function launch() {
  return chromium.launch({ headless: true });
}

/** Console/page/request error sink, scoped to a scenario+profile. */
export function attachConsole(page, sink, scenario, profile) {
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") {
      sink.push({ profile, scenario, kind: `console.${t}`, text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    sink.push({ profile, scenario, kind: "pageerror", text: String(err?.stack || err?.message || err) });
  });
  page.on("requestfailed", (req) => {
    const f = req.failure();
    // Ignore intentional aborts (e.g. canceled prefetch) which are not defects.
    if (f && /aborted|ERR_ABORTED/i.test(f.errorText || "")) return;
    sink.push({ profile, scenario, kind: "requestfailed", text: `${req.url()} :: ${f?.errorText}` });
  });
}

export async function shot(page, profile, scenario, step) {
  const dir = path.join(SHOTS_DIR, profile);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${scenario}__${step}.png`);
  await page.screenshot({ path: file });
  return path.relative(OUT_DIR, file);
}

/** Wait until the desktop/mobile shell is interactive (dock present). */
export async function waitReady(page, { needTerminal = false, timeout = 20000 } = {}) {
  // Dock Spotlight (desktop) OR mobile nav both render only in reveal/ready.
  await page.locator('button[aria-label="Spotlight"], nav button[aria-label="Terminal"]').first()
    .waitFor({ state: "visible", timeout }).catch(() => {});
  if (needTerminal) {
    await page.locator('[aria-label="Terminal input"]')
      .waitFor({ state: "visible", timeout }).catch(() => {});
  }
}

/** Read the current transform of a window (to assert drags moved it). */
export async function windowTransform(page, appName) {
  const el = page.locator(`[role="dialog"][aria-label="${appName} window"]`).first();
  if ((await el.count()) === 0) return null;
  return el.evaluate((n) => getComputedStyle(n).transform);
}
```

- [ ] **Step 2: Sanity check import**

```bash
node -e "import('./scripts/audit/lib/driver.mjs').then(m=>console.log(typeof m.launch, m.BASE_URL))"
```

Expected: `function http://localhost:3000`

---

## Task 5: Harness — desktop scenarios

**Files:**
- Create: `scripts/audit/scenarios.desktop.mjs`

Each scenario is `async (page, profile, sink) => { steps: [...] }`. Every scenario is independently wrapped by the runner; here we just do the work and return step records.

- [ ] **Step 1: Write the desktop scenarios**

```js
// scripts/audit/scenarios.desktop.mjs
import { BASE_URL, attachConsole, shot, waitReady, windowTransform } from "./lib/driver.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const APPS = ["About", "Career", "Stack", "Contact"];

async function newPage(context, sink, scenario, profile) {
  const page = await context.newPage();
  attachConsole(page, sink, scenario, profile);
  return page;
}

/** 1. Cold boot capture — never interact (interaction skips boot). */
export async function boot(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "boot", profile);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  steps.push({ label: "t=0 loading", shot: await shot(page, profile, "boot", "01-loading") });
  await sleep(700);
  steps.push({ label: "t=0.7 booting", shot: await shot(page, profile, "boot", "02-booting") });
  await sleep(700);
  steps.push({ label: "t=1.4 reveal/ready", shot: await shot(page, profile, "boot", "03-reveal") });
  await waitReady(page);
  await sleep(400);
  steps.push({ label: "ready", shot: await shot(page, profile, "boot", "04-ready") });
  await page.close();
  return steps;
}

/** 2. Default ready state + 3. open each dock app. */
export async function dockApps(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "dock", profile);
  await page.goto(`${BASE_URL}?skip=1`, { waitUntil: "domcontentloaded" });
  await waitReady(page, { needTerminal: true });
  steps.push({ label: "default (terminal)", shot: await shot(page, profile, "dock", "00-default") });
  for (const app of APPS) {
    await page.getByRole("button", { name: app, exact: true }).first().click();
    await sleep(600);
    const present = await page.locator(`[role="dialog"][aria-label="${app} window"]`).count();
    steps.push({
      label: `open ${app}`,
      shot: await shot(page, profile, "dock", `open-${app.toLowerCase()}`),
      note: present ? `${app} window present` : `FAIL: ${app} window not found`,
    });
  }
  await page.close();
  return steps;
}

/** 4. Window machinery: drag(physics), maximize, minimize, close, focus/z-order. */
export async function windows(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "windows", profile);
  await page.goto(`${BASE_URL}?open=about,career&focus=career`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(700);
  steps.push({ label: "two windows", shot: await shot(page, profile, "windows", "00-two") });

  // Drag "About" by its titlebar and fling it.
  const before = await windowTransform(page, "About");
  const dlg = page.locator('[role="dialog"][aria-label="About window"]').first();
  const box = await dlg.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + 15);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(box.x + box.width / 2 + i * 22, box.y + 15 + i * 10); await sleep(16); }
    await page.mouse.up();
    await sleep(900); // let physics settle
  }
  const after = await windowTransform(page, "About");
  steps.push({
    label: "drag About",
    shot: await shot(page, profile, "windows", "01-drag"),
    note: before === after ? "FAIL: window did not move on drag" : "moved",
  });

  // Tidy (menubar) — windows rain into a grid.
  await page.getByRole("button", { name: "Tidy windows into a grid" }).click().catch(() => {});
  await sleep(1200);
  steps.push({ label: "tidy", shot: await shot(page, profile, "windows", "02-tidy") });

  // Maximize About.
  await page.locator('[role="dialog"][aria-label="About window"] [aria-label="Maximize"]').click().catch(() => {});
  await sleep(400);
  steps.push({ label: "maximize About", shot: await shot(page, profile, "windows", "03-max") });

  // Minimize About (should disappear).
  await page.locator('[role="dialog"][aria-label="About window"] [aria-label="Minimize"]').click().catch(() => {});
  await sleep(400);
  const minGone = (await page.locator('[role="dialog"][aria-label="About window"]').count()) === 0;
  steps.push({ label: "minimize About", shot: await shot(page, profile, "windows", "04-min"), note: minGone ? "hidden ok" : "FAIL: still visible" });

  // Close Career.
  await page.locator('[role="dialog"][aria-label="Career window"] [aria-label="Close"]').click().catch(() => {});
  await sleep(300);
  const careerGone = (await page.locator('[role="dialog"][aria-label="Career window"]').count()) === 0;
  steps.push({ label: "close Career", shot: await shot(page, profile, "windows", "05-close"), note: careerGone ? "closed ok" : "FAIL: still present" });

  await page.close();
  return steps;
}

/** 5. ⌘K Spotlight palette: open, filter, select, esc. */
export async function palette(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "palette", profile);
  await page.goto(`${BASE_URL}?skip=1`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(300);
  await page.keyboard.press("Control+k");
  await sleep(300);
  const input = page.locator('input[placeholder^="Search apps"]');
  const opened = await input.isVisible().catch(() => false);
  steps.push({ label: "open palette", shot: await shot(page, profile, "palette", "00-open"), note: opened ? "ok" : "FAIL: palette did not open with Ctrl+K" });
  if (opened) {
    await input.fill("career");
    await sleep(300);
    steps.push({ label: "filter 'career'", shot: await shot(page, profile, "palette", "01-filter") });
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await sleep(600);
    const careerOpen = await page.locator('[role="dialog"][aria-label="Career window"]').count();
    steps.push({ label: "select → open", shot: await shot(page, profile, "palette", "02-selected"), note: careerOpen ? "career opened" : "FAIL: selection did not open career" });
    await page.keyboard.press("Control+k");
    await sleep(200);
    await page.keyboard.press("Escape");
    await sleep(300);
    const stillOpen = await page.locator('input[placeholder^="Search apps"]').isVisible().catch(() => false);
    steps.push({ label: "esc closes", shot: await shot(page, profile, "palette", "03-esc"), note: stillOpen ? "FAIL: Esc did not close" : "closed ok" });
  }
  await page.close();
  return steps;
}

/** 6. Terminal command bridge + history. */
export async function terminal(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "terminal", profile);
  await page.goto(`${BASE_URL}?skip=1`, { waitUntil: "domcontentloaded" });
  await waitReady(page, { needTerminal: true });
  const input = page.locator('[aria-label="Terminal input"]');
  const ready = await input.isVisible().catch(() => false);
  steps.push({ label: "terminal ready", shot: await shot(page, profile, "terminal", "00-ready"), note: ready ? "ok" : "FAIL: terminal input never appeared (typewriter may be stuck)" });
  if (ready) {
    for (const cmd of ["help", "whoami", "ls", "open about", "close about"]) {
      await input.fill(cmd);
      await page.keyboard.press("Enter");
      await sleep(400);
    }
    steps.push({ label: "ran commands", shot: await shot(page, profile, "terminal", "01-commands") });
    const aboutOpened = await page.locator('[role="dialog"][aria-label="About window"]').count();
    steps.push({ label: "open/close bridge", note: `about window count after open+close: ${aboutOpened}` });
    // history
    await page.keyboard.press("ArrowUp");
    await sleep(150);
    steps.push({ label: "history ↑", shot: await shot(page, profile, "terminal", "02-history") });
  }
  await page.close();
  return steps;
}

/** 7. Hotkeys: ⌘W close, ⌘M minimize, ⌘1..5 focus/open. */
export async function hotkeys(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "hotkeys", profile);
  await page.goto(`${BASE_URL}?skip=1`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(300);
  await page.locator("body").click({ position: { x: 700, y: 450 } }); // focus desktop, not terminal input
  await page.keyboard.press("Control+3"); // career (index 3 in DOCK_ORDER)
  await sleep(500);
  const careerOpen = await page.locator('[role="dialog"][aria-label="Career window"]').count();
  steps.push({ label: "Ctrl+3 opens Career", shot: await shot(page, profile, "hotkeys", "00-ctrl3"), note: careerOpen ? "ok" : "FAIL" });
  await page.keyboard.press("Control+m"); // minimize focused
  await sleep(400);
  steps.push({ label: "Ctrl+M minimize", shot: await shot(page, profile, "hotkeys", "01-min") });
  await page.keyboard.press("Control+3"); // restore focus career
  await sleep(300);
  await page.keyboard.press("Control+w"); // close focused
  await sleep(400);
  const careerGone = (await page.locator('[role="dialog"][aria-label="Career window"]').count()) === 0;
  steps.push({ label: "Ctrl+W close", shot: await shot(page, profile, "hotkeys", "02-close"), note: careerGone ? "ok" : "FAIL: still present" });
  await page.close();
  return steps;
}

/** 8. Deep-link seeding. */
export async function deeplink(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "deeplink", profile);
  await page.goto(`${BASE_URL}?open=terminal,career,stack&focus=career`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(800);
  const counts = {};
  for (const app of ["Terminal", "Career", "Stack"]) {
    counts[app] = await page.locator(`[role="dialog"][aria-label="${app} window"]`).count();
  }
  steps.push({ label: "deep-link 3 windows", shot: await shot(page, profile, "deeplink", "00-seeded"), note: JSON.stringify(counts) });
  await page.close();
  return steps;
}

/** 9. prefers-reduced-motion (separate context handled by runner; here just capture). */
export async function reducedMotion(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "reduced-motion", profile);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(600);
  steps.push({ label: "reduced-motion ready", shot: await shot(page, profile, "reduced-motion", "00-ready") });
  await page.close();
  return steps;
}

/** 10. Per-app content overflow/scroll. */
export async function appContent(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "app-content", profile);
  await page.goto(`${BASE_URL}?open=about,career,stack,contact`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(800);
  for (const app of APPS) {
    const dlg = page.locator(`[role="dialog"][aria-label="${app} window"]`).first();
    if (await dlg.count()) {
      await dlg.click({ position: { x: 30, y: 5 } }).catch(() => {}); // focus via titlebar
      await sleep(200);
      const overflow = await dlg.evaluate((n) => {
        const body = n.querySelector(".overflow-auto");
        return body ? { sh: body.scrollHeight, ch: body.clientHeight } : null;
      });
      steps.push({ label: `${app} content`, shot: await shot(page, profile, "app-content", app.toLowerCase()), note: JSON.stringify(overflow) });
    }
  }
  await page.close();
  return steps;
}

export const DESKTOP_SCENARIOS = [boot, dockApps, windows, palette, terminal, hotkeys, deeplink, appContent];
export const DESKTOP_REDUCED = [reducedMotion];
```

- [ ] **Step 2: Sanity check import**

```bash
node -e "import('./scripts/audit/scenarios.desktop.mjs').then(m=>console.log(m.DESKTOP_SCENARIOS.length,'desktop scenarios'))"
```

Expected: `8 desktop scenarios`

---

## Task 6: Harness — mobile scenarios

**Files:**
- Create: `scripts/audit/scenarios.mobile.mjs`

- [ ] **Step 1: Write the mobile scenarios**

```js
// scripts/audit/scenarios.mobile.mjs
import { BASE_URL, attachConsole, shot, waitReady } from "./lib/driver.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const APPS = ["Terminal", "About", "Career", "Stack", "Contact"];

async function newPage(context, sink, scenario, profile) {
  const page = await context.newPage();
  attachConsole(page, sink, scenario, profile);
  return page;
}

/** 1. Cold boot → mobile shell. */
export async function mboot(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "mobile-boot", profile);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(600);
  steps.push({ label: "mobile ready", shot: await shot(page, profile, "mobile-boot", "00-ready") });
  // leak check: no desktop window chrome, no palette, no dock-spotlight
  const leaks = {
    dialog: await page.locator('[role="dialog"]').count(),
    spotlight: await page.locator('button[aria-label="Spotlight"]').count(),
  };
  steps.push({ label: "no desktop leaks", note: JSON.stringify(leaks) + (leaks.dialog || leaks.spotlight ? " FAIL: desktop chrome leaked" : " ok") });
  // horizontal overflow check
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  steps.push({ label: "no h-overflow", note: JSON.stringify(overflow) + (overflow.sw > overflow.iw + 1 ? " FAIL: horizontal overflow" : " ok") });
  await page.close();
  return steps;
}

/** 2. Tab-bar: tap each app, capture full-screen slide-in. */
export async function mtabs(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "mobile-tabs", profile);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(500);
  for (const app of APPS) {
    await page.locator(`nav button[aria-label="${app}"]`).click().catch(() => {});
    await sleep(500);
    steps.push({ label: `tab ${app}`, shot: await shot(page, profile, "mobile-tabs", app.toLowerCase()) });
  }
  await page.close();
  return steps;
}

/** 3. Terminal quick-command chips. */
export async function mchips(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "mobile-chips", profile);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await waitReady(page, { needTerminal: true });
  await sleep(400);
  for (const chip of ["help", "ls", "whoami", "copy email"]) {
    await page.getByRole("button", { name: chip, exact: true }).first().click().catch(() => {});
    await sleep(400);
  }
  steps.push({ label: "chips ran", shot: await shot(page, profile, "mobile-chips", "00-after") });
  await page.close();
  return steps;
}

export const MOBILE_SCENARIOS = [mboot, mtabs, mchips];
```

- [ ] **Step 2: Sanity check import**

```bash
node -e "import('./scripts/audit/scenarios.mobile.mjs').then(m=>console.log(m.MOBILE_SCENARIOS.length,'mobile scenarios'))"
```

Expected: `3 mobile scenarios`

---

## Task 7: Harness — runner/orchestrator

**Files:**
- Create: `scripts/audit/run.mjs`

- [ ] **Step 1: Write the runner**

```js
// scripts/audit/run.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { launch, OUT_DIR } from "./lib/driver.mjs";
import { PROFILES } from "./lib/profiles.mjs";
import { DESKTOP_SCENARIOS, DESKTOP_REDUCED } from "./scenarios.desktop.mjs";
import { MOBILE_SCENARIOS } from "./scenarios.mobile.mjs";

async function runScenario(fn, context, sink, profile) {
  const name = fn.name;
  try {
    const steps = await fn(context, sink, profile);
    const fails = steps.filter((s) => /FAIL/.test(s.note || ""));
    return { name, status: fails.length ? "fail" : "pass", steps };
  } catch (err) {
    return { name, status: "error", error: String(err?.stack || err), steps: [] };
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await launch();
  const sink = []; // console/page/request errors
  const results = [];

  // Desktop (normal motion)
  {
    const ctx = await browser.newContext(PROFILES.desktop.contextOptions);
    for (const fn of DESKTOP_SCENARIOS) results.push({ profile: "desktop", ...(await runScenario(fn, ctx, sink, "desktop")) });
    await ctx.close();
  }
  // Desktop (reduced motion)
  {
    const ctx = await browser.newContext({ ...PROFILES.desktop.contextOptions, reducedMotion: "reduce" });
    for (const fn of DESKTOP_REDUCED) results.push({ profile: "desktop-rm", ...(await runScenario(fn, ctx, sink, "desktop-rm")) });
    await ctx.close();
  }
  // Mobile
  {
    const ctx = await browser.newContext(PROFILES.mobile.contextOptions);
    for (const fn of MOBILE_SCENARIOS) results.push({ profile: "mobile", ...(await runScenario(fn, ctx, sink, "mobile")) });
    await ctx.close();
  }

  await browser.close();

  const report = {
    generatedNote: "stamp time externally",
    base: process.env.AUDIT_URL || "http://localhost:3000",
    totals: {
      scenarios: results.length,
      pass: results.filter((r) => r.status === "pass").length,
      fail: results.filter((r) => r.status === "fail").length,
      error: results.filter((r) => r.status === "error").length,
      consoleIssues: sink.length,
    },
    results,
    consoleSink: sink,
  };
  await writeFile(path.join(OUT_DIR, "findings.json"), JSON.stringify(report, null, 2));
  console.log("AUDIT DONE:", JSON.stringify(report.totals));
  // Print step-level FAIL/note lines for quick triage.
  for (const r of results) {
    for (const s of r.steps || []) {
      if (s.note) console.log(`[${r.profile}/${r.name}] ${s.label}: ${s.note}`);
    }
    if (r.status === "error") console.log(`[${r.profile}/${r.name}] ERROR: ${r.error.split("\\n")[0]}`);
  }
  for (const e of sink) console.log(`[console ${e.profile}/${e.scenario}] ${e.kind}: ${e.text.slice(0, 200)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add an npm script**

In `package.json` `scripts`, add:

```json
"audit:ui": "node scripts/audit/run.mjs"
```

- [ ] **Step 3: Commit the harness**

```bash
git add scripts/audit package.json && git commit -m "test(audit): add playwright ui/ux audit harness"
```

---

## Task 8: Run the discovery audit

**Files:** none (produces `scripts/audit/out/`)

- [ ] **Step 1: Start the dev server (background)**

```bash
npm run dev   # run in background; wait for "Ready" / port 3000
```

Verify: `curl -sI http://localhost:3000 | head -1` returns `HTTP/1.1 200 OK`.

- [ ] **Step 2: Run the harness**

```bash
npm run audit:ui
```

Expected: prints `AUDIT DONE: {...totals...}` and per-step notes. Screenshots land in `scripts/audit/out/shots/{desktop,desktop-rm,mobile}/`, summary in `scripts/audit/out/findings.json`.

- [ ] **Step 3: Confirm artifacts exist**

```bash
find scripts/audit/out/shots -name '*.png' | wc -l   # expect dozens
node -e "const f=require('./scripts/audit/out/findings.json');console.log(f.totals)"
```

---

## Task 9: Grade artifacts → file beads

**This is the visual judgment pass.** Read every screenshot and the `findings.json` notes + `consoleSink`, grade against the spec's [audit dimensions](../specs/2026-06-02-uiux-audit-design.md#6-audit-dimensions-defect-criteria), and file one bead per distinct defect.

Under ultracode this runs as a **Workflow fan-out**: one grading agent per scenario-group (boot, windows, palette, terminal, hotkeys, dock, deeplink, app-content, mobile-*, reduced-motion), each reading its screenshots + the relevant `findings.json` slice + the implicated source files, returning structured findings. A dedup/merge step removes duplicates across groups; an adversarial verify step confirms each finding is real before filing. See the orchestration block at the end of this plan.

- [ ] **Step 1: For each finding, create a bead**

```bash
bd create "<title>" \
  -p <0-3>  \
  -t bug \
  -d "Surface: <desktop|mobile|both>
Severity: <critical|high|medium|low>
Component: <path>
Repro: <steps + viewport + ?query>
Expected: <...>
Actual: <...>
Screenshot: scripts/audit/out/shots/<path>.png"
```

(Map severity→priority: critical=0, high=1, medium=2, low=3. Use `bd create --help` to confirm flag names on the installed version; adjust `-p/-t/-d` to match.)

- [ ] **Step 2: Verify the backlog**

```bash
bd list
bd ready   # if supported: shows actionable beads
```

**Known candidate defects to confirm or refute during grading** (found while reading source — do NOT pre-file; verify visually first):
1. **Nested terminal chrome** — `TerminalApp` renders `TerminalTyping`, which draws its *own* macOS window card (traffic lights + "jake — -zsh" + fixed `height:360px`, `max-w-xl`, `mx-auto`) *inside* the `WindowFrame` (which already has a titlebar at 640×420). Likely double chrome + terminal not filling the window. (`components/TerminalTyping.tsx:445`, `components/desktop/apps/TerminalApp.tsx`)
2. **Typewriter race when Terminal opens post-boot** — `window.terminalTypewriter.start()` fires on `isBootComplete`, but the typewriter only registers in `onInit` during the internal `typing` phase; on the `?skip=1`/post-boot path `start()` may run before registration, leaving the terminal stuck on the typing animation and the input never appearing. (`components/TerminalTyping.tsx:432-436, 468-489`)
3. **Boot→window `layoutId` morph has no destination** — `QuantumLoader` sets `layoutId="terminal-window"` but `WindowFrame`/`TerminalApp` render plain divs with no matching `layoutId`, so the signature "boot terminal becomes the window" morph likely degrades to a plain opacity fade. (`components/QuantumLoader.tsx:148`, `components/desktop/WindowFrame.tsx`)
4. **Snap-to-edge + cyan flash removed** — the WIP `windowPhysics` (matter-js) replaced the spec'd edge-snap/maximize-on-top-drag with fling physics + a "Tidy" grid button. This is an intentional redesign; file as a **spec-divergence note (low)**, not a regression to revert.
5. **Esc does not dismiss focused window** — spec lists Esc to dismiss focused window; `useHotkeys` only wires Esc to close the palette. (`hooks/useHotkeys.ts:41`)
6. **Mobile terminal sizing** — the same fixed-`360px` `max-w-xl` terminal card renders inside the mobile full-screen `main`, likely floating rather than filling. (`components/desktop/MobileShell.tsx:41-54` + `TerminalTyping`)

- [ ] **Step 3: Commit the bead database state** (if `bd` tracks issues in-repo)

```bash
git add .beads && git commit -m "chore(audit): file UI/UX findings as beads" || echo "nothing to commit"
```

---

## Task 10: Auto-fix beads (critical + high + medium) via parallel sub-agents

**Policy:** fix critical/high/medium; leave low filed. Group beads by source file so no two agents edit the same file concurrently.

- [ ] **Step 1: Pull the actionable backlog**

```bash
bd list --json 2>/dev/null || bd list
```

Partition beads into file-groups (by the `Component:` line). Each group is one fix unit.

- [ ] **Step 2: Dispatch one sub-agent per file-group** (Workflow `pipeline`/`parallel`)

Each agent's brief:
- Read the bead(s) for its file + the cited screenshot(s).
- Reproduce mentally against the source; implement the **minimal** fix. No opportunistic refactors. Honor jakeOS v2 non-goals (no resize handles, recruiter mode, light theme, Spotify, mini-games).
- Verify: `npx tsc --noEmit` clean, `npx eslint <files>` clean, and re-run the specific harness scenario for that area (`AUDIT_URL` already up) confirming the FAIL note is gone.
- Update the bead: `bd update <id> --status <done|closed>` with a one-line note on the fix (confirm status verbs via `bd update --help`).
- Commit: `git add <files> && git commit -m "fix(<area>): <bead title> (bead <id>)"`.

- [ ] **Step 3: Adversarial verify each fix** (Workflow)

For each claimed fix, a second agent re-runs the relevant scenario and inspects the new screenshot to confirm the defect is gone and nothing regressed. If refuted, reopen the bead (`bd update <id> --status open`) and re-dispatch.

---

## Task 11: Regression re-run + final report

**Files:**
- Create: `docs/superpowers/audits/2026-06-02-uiux-audit-report.md`

- [ ] **Step 1: Re-run the full harness**

```bash
npm run audit:ui
node -e "const f=require('./scripts/audit/out/findings.json');console.log(f.totals)"
```

Expected: `fail` + `error` + `consoleIssues` lower than the discovery run; any new failures become new beads.

- [ ] **Step 2: Write the report**

Include: scope, totals before/after, table of beads (id, title, severity, surface, status), before/after screenshot refs for fixed items, and the residual low-severity list with rationale.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/audits .beads 2>/dev/null
git commit -m "docs(audit): jakeOS UI/UX audit report + resolved beads"
```

---

## Self-review

- **Spec coverage:** setup (T1–2) ✓ · harness desktop+mobile (T3–7) ✓ · all scenario-matrix items (T5–6) ✓ · audit dimensions graded (T9) ✓ · beads with severity/surface/repro/shot (T9) ✓ · auto-fix critical+high+medium grouped by file (T10) ✓ · regression gate + report (T11) ✓.
- **Placeholder scan:** harness code is complete and runnable; `bd` flag names flagged to confirm against the installed CLI (`--help`) since the exact verb set can vary by version — this is the one deliberate runtime check, not a placeholder.
- **Type/selector consistency:** scenario selectors match the verified Selector Reference; `waitReady`, `shot`, `windowTransform`, `attachConsole` signatures are consistent across driver/scenarios/runner.
- **WIP handling:** drag/physics divergences flagged as notes, not auto-reverts (candidate #4).

---

## Orchestration note (ultracode execution)

Grading (T9) and fixing (T10) run as Workflow fan-outs, not solo:
- **Grade:** `pipeline` over scenario-groups → each agent returns `{findings:[{title,severity,surface,component,repro,expected,actual,shot}]}` (schema-validated) → barrier dedup/merge → adversarial verify per finding → file survivors as beads.
- **Fix:** `parallel` over file-groups (worktree isolation only if groups touch shared files) → per-group fix+verify → adversarial re-verify → reopen-and-retry losers → regression harness re-run.
