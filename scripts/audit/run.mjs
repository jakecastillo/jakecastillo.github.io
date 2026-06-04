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
    if (r.status === "error") console.log(`[${r.profile}/${r.name}] ERROR: ${String(r.error).split("\n")[0]}`);
  }
  for (const e of sink) console.log(`[console ${e.profile}/${e.scenario}] ${e.kind}: ${e.text.slice(0, 200)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
