// scripts/audit/scenarios.desktop.mjs
import { BASE_URL, attachConsole, shot, waitReady, windowTransform } from "./lib/driver.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const APPS = ["About", "Career", "Stack", "Projects", "Contact"];

async function newPage(context, sink, scenario, profile) {
  const page = await context.newPage();
  attachConsole(page, sink, scenario, profile);
  await page.bringToFront();
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
    await sleep(1000); // let window settle + metric count-up finish before capture
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

/** 11. URL round-trip: minimized state survives a reload + ?skip is stripped. */
export async function urlroundtrip(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "urlroundtrip", profile);
  // About focused → on top → its Minimize button is reachable (not occluded).
  await page.goto(`${BASE_URL}?open=terminal,about&focus=about&skip=1`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.locator('[role="dialog"][aria-label="About window"] [aria-label="Minimize"]').click().catch(() => {});
  await sleep(500);
  const urlAfter = await page.evaluate(() => window.location.search);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(500);
  const restored = {
    terminal: await page.locator('[role="dialog"][aria-label="Terminal window"]').count(),
    aboutVisible: await page.locator('[role="dialog"][aria-label="About window"]').count(),
  };
  const ok = urlAfter.includes("min=about") && !urlAfter.includes("skip") && restored.terminal === 1 && restored.aboutVisible === 0;
  steps.push({
    label: "url round-trip",
    shot: await shot(page, profile, "urlroundtrip", "00-after-reload"),
    note: `urlAfterMin=${urlAfter} | skipStripped=${!urlAfter.includes("skip")} | restored=${JSON.stringify(restored)} (About minimized => count 0)` + (ok ? " ok" : " FAIL"),
  });
  await page.close();
  return steps;
}

export const DESKTOP_SCENARIOS = [boot, dockApps, windows, palette, terminal, hotkeys, deeplink, appContent, urlroundtrip];
export const DESKTOP_REDUCED = [reducedMotion];
