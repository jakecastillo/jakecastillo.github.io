// scripts/audit/lib/driver.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export const BASE_URL = process.env.AUDIT_URL || "http://localhost:3000";
export const OUT_DIR = path.resolve("scripts/audit/out");
export const SHOTS_DIR = path.join(OUT_DIR, "shots");

export async function launch() {
  // Disable Chromium's background-tab timer throttling: Playwright's
  // non-foreground pages otherwise clamp setTimeout/setInterval to >=1s,
  // which makes the boot timers + typewriter (setTimeout-per-char) crawl and
  // produces false "stuck boot / stuck typewriter" readings.
  return chromium.launch({
    headless: true,
    args: [
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=CalculateNativeWinOcclusion",
    ],
  });
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
  // WebGL pages intermittently throw "Unable to capture screenshot" (GPU stall
  // on ReadPixels). Retry a few times before giving up.
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // caret:"initial" — do NOT inject caret-color:transparent (Playwright's
      // default), which can race React hydration on focused inputs and emit a
      // false "attributes didn't match" console.error.
      await page.screenshot({ path: file, caret: "initial" });
      return path.relative(OUT_DIR, file);
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw lastErr;
}

/** Wait until the desktop/mobile shell is interactive AND the reveal has settled. */
export async function waitReady(page, { needTerminal = false, timeout = 20000, settle = true } = {}) {
  // Dock Spotlight (desktop) OR mobile nav both render only in reveal/ready.
  await page.locator('button[aria-label="Spotlight"], nav button[aria-label="Terminal"]').first()
    .waitFor({ state: "visible", timeout }).catch(() => {});
  if (settle) {
    // Wait for the boot loader to fully dismiss (phase=ready, AnimatePresence exit done)…
    await page.waitForFunction(() => !/Initializing boot sequence/.test(document.body.innerText), { timeout: 8000 }).catch(() => {});
    // …and for the one-shot identity lockup (reveal name-hit, ~2.2s) + motion to settle,
    // so steady-state screenshots aren't captured mid-animation.
    await page.waitForTimeout(2600);
  }
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
