// scripts/audit/scenarios.mobile.mjs
import { BASE_URL, attachConsole, shot, waitReady } from "./lib/driver.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const APPS = ["Terminal", "About", "Career", "Stack", "Projects", "Contact"];

async function newPage(context, sink, scenario, profile) {
  const page = await context.newPage();
  attachConsole(page, sink, scenario, profile);
  await page.bringToFront();
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
    await sleep(1000); // let metric count-up settle before capture
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
