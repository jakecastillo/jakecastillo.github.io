// scripts/generate-resume-pdf.mjs
// Build-time resume PDF generator: read the single source of truth in
// data/resume.ts, render a clean ONE-PAGE VOID & LASER (dark, violet/cyan)
// resume to HTML, and print it to public/resume.pdf with headless Chromium.
//
// Static export (output:"export") means there is NO runtime — the PDF is the
// downloadable artifact behind the Dock/Palette/Terminal "resume" action, so it
// must be baked here at build time. Wired into `prebuild` AFTER optimize-portrait
// and made tolerant (`|| echo`) so a missing browser never hard-fails a build.
//
// Data strategy: data/resume.ts is TypeScript, but `resumeData` is a pure object
// literal with no runtime expressions. Rather than maintain a drift-prone inline
// copy, we read the file, slice out the literal, strip TS type annotations, and
// evaluate just that object — so the PDF can never silently go stale vs the site.

import { mkdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "data", "resume.ts");
const OUT = path.join(ROOT, "public", "resume.pdf");

// ---------------------------------------------------------------------------
// 1. Load resume data from the TS single source of truth.
// ---------------------------------------------------------------------------
async function loadResumeData() {
  const file = await readFile(SRC, "utf8");

  // Grab the `resumeData` object literal: from the first `{` after the
  // declaration to its matching closing brace (brace-balanced, string-aware).
  const declIdx = file.indexOf("resumeData");
  if (declIdx === -1) throw new Error("resumeData declaration not found in data/resume.ts");
  const braceStart = file.indexOf("{", declIdx);
  if (braceStart === -1) throw new Error("resumeData object literal not found");

  let depth = 0;
  let inStr = null; // current string-delimiter char, or null
  let end = -1;
  for (let i = braceStart; i < file.length; i++) {
    const ch = file[i];
    const prev = file[i - 1];
    if (inStr) {
      if (ch === inStr && prev !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error("Could not find end of resumeData object literal");

  const literal = file.slice(braceStart, end + 1);

  // Evaluate the literal in a bare function scope. It is a plain data object
  // (strings/arrays/objects only — verified: no function calls or imports
  // referenced inside the value), so this is a contained, deterministic eval of
  // first-party build-time source, not untrusted input.
  const data = Function(`"use strict"; return (${literal});`)();

  // Minimal shape guard so a future refactor fails loudly instead of silently.
  for (const key of ["name", "email", "summary", "experience", "skills"]) {
    if (data[key] == null) throw new Error(`resumeData is missing "${key}"`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// 2. HTML rendering (VOID & LASER print theme).
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// linkedin handle for a tidy printed label (the href keeps the full URL)
function linkedinLabel(url) {
  const m = /linkedin\.com\/in\/([^/?#]+)/i.exec(String(url || ""));
  return m ? `linkedin.com/in/${m[1]}` : url;
}

function renderHTML(d) {
  const skills = d.skills || {};
  // Ordered, labeled skill groups — only render the ones that have entries.
  const skillGroups = [
    ["Languages", skills.languages],
    ["Frameworks", skills.frameworks],
    ["Databases", skills.databases],
    ["Platforms", skills.platforms],
    ["Practices", skills.practices],
    ["Roles", skills.roles],
  ].filter(([, list]) => Array.isArray(list) && list.length);

  const experienceHTML = (d.experience || [])
    .map((job) => {
      const bullets = (job.description || [])
        .map((line) => `<li>${esc(line)}</li>`)
        .join("");
      const outcomes = (job.outcomes || [])
        .map(
          (o) =>
            `<span class="metric"><b>${esc(o.value)}</b> ${esc(o.label)}</span>`
        )
        .join("");
      return `
        <article class="job">
          <div class="job-head">
            <div class="job-title">
              <h3>${esc(job.title)}</h3>
              <span class="company">${esc(job.company)}</span>
            </div>
            <span class="period">${esc(job.period)}</span>
          </div>
          ${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
          ${outcomes ? `<div class="metrics">${outcomes}</div>` : ""}
        </article>`;
    })
    .join("");

  const certsHTML = (d.certifications || [])
    .map(
      (c) =>
        `<li><b>${esc(c.name)}</b><span class="cert-meta">${esc(
          c.issuer
        )} · ${esc(c.issued)}</span></li>`
    )
    .join("");

  const skillsHTML = skillGroups
    .map(
      ([label, list]) =>
        `<div class="skill-row"><span class="skill-label">${esc(
          label
        )}</span><span class="skill-vals">${list
          .map((s) => esc(s))
          .join(" · ")}</span></div>`
    )
    .join("");

  const edu = d.education || {};

  // Contact line pieces (only those present).
  const contact = [
    d.location && `<span>${esc(d.location)}</span>`,
    d.email &&
      `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`,
    d.phone && `<span>${esc(d.phone)}</span>`,
    d.linkedin &&
      `<a href="${esc(d.linkedin)}">${esc(linkedinLabel(d.linkedin))}</a>`,
  ]
    .filter(Boolean)
    .join('<span class="dot">·</span>');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  :root {
    --void: #050505;
    --surface: #0a0a18;
    --chrome: #13132a;
    --primary: #8b5cf6;   /* violet — dominant identity */
    --accent: #22d3ee;    /* cyan — rationed, active/secure signal */
    --ink: #f4f4f8;
    --muted: #a9a9c4;
    --faint: #6f6f8e;
    --hair: rgba(139, 92, 246, 0.22);
    --hair-soft: rgba(255, 255, 255, 0.07);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: var(--void); }
  body {
    font-family: "Geist Sans", -apple-system, "Helvetica Neue", Arial, sans-serif;
    color: var(--ink);
    font-size: 9.4px;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    /* Page background: deep void with two restrained corner glows (violet
       dominant, cyan accent) — colored glow, never black shadow. */
    background:
      radial-gradient(120% 80% at 0% 0%, rgba(139, 92, 246, 0.14), transparent 55%),
      radial-gradient(90% 70% at 100% 100%, rgba(34, 211, 238, 0.08), transparent 50%),
      var(--void);
    padding: 30px 34px 26px;
    min-height: 100%;
  }
  a { color: var(--accent); text-decoration: none; }

  /* ---- Header ---- */
  header {
    border-bottom: 1px solid var(--hair);
    padding-bottom: 12px;
    margin-bottom: 13px;
  }
  .name {
    font-family: "Space Grotesk", "Geist Sans", sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.05;
    color: #fff;
  }
  .role {
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--primary);
    margin-top: 5px;
  }
  .contact {
    margin-top: 9px;
    color: var(--muted);
    font-size: 8.8px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0;
  }
  .contact .dot { color: var(--faint); margin: 0 7px; }
  .summary {
    margin-top: 10px;
    color: var(--muted);
    font-size: 9.3px;
    line-height: 1.5;
    max-width: 95%;
  }

  /* ---- Layout: main column + sidebar ---- */
  .body { display: flex; gap: 22px; }
  .main { flex: 1 1 auto; min-width: 0; }
  .side { flex: 0 0 168px; }

  /* ---- Section kicker (monospace security register) ---- */
  .kicker {
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .kicker::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--hair-soft), transparent);
  }
  section { margin-bottom: 14px; }
  .side section { margin-bottom: 13px; }

  /* ---- Experience ---- */
  .job { margin-bottom: 11px; }
  .job:last-child { margin-bottom: 0; }
  .job-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .job-title { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .job h3 {
    font-family: "Space Grotesk", "Geist Sans", sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
  }
  .company {
    font-size: 9px;
    color: var(--primary);
    font-weight: 500;
  }
  .period {
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    font-size: 8px;
    color: var(--faint);
    white-space: nowrap;
    letter-spacing: 0.02em;
  }
  .bullets { list-style: none; margin-top: 5px; }
  .bullets li {
    position: relative;
    padding-left: 12px;
    color: var(--muted);
    margin-bottom: 2.5px;
    font-size: 9px;
    line-height: 1.42;
  }
  .bullets li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 5px;
    width: 4px;
    height: 4px;
    border-radius: 1px;
    background: var(--primary);
    transform: rotate(45deg);
  }
  .metrics { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .metric {
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    font-size: 7.8px;
    color: var(--muted);
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid var(--hair);
    border-radius: 4px;
    padding: 2px 7px;
    letter-spacing: 0.01em;
  }
  .metric b { color: var(--accent); font-weight: 600; }

  /* ---- Sidebar: skills / certs / education ---- */
  .skill-row { margin-bottom: 7px; }
  .skill-row:last-child { margin-bottom: 0; }
  .skill-label {
    display: block;
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    font-size: 7.6px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 2px;
  }
  .skill-vals { color: var(--muted); font-size: 8.6px; line-height: 1.4; }

  .certs { list-style: none; }
  .certs li { margin-bottom: 7px; }
  .certs li:last-child { margin-bottom: 0; }
  .certs b { display: block; color: var(--ink); font-size: 8.8px; font-weight: 600; }
  .cert-meta {
    display: block;
    color: var(--faint);
    font-size: 8px;
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    margin-top: 1px;
  }

  .edu-degree { color: var(--ink); font-size: 9px; font-weight: 600; }
  .edu-inst { color: var(--muted); font-size: 8.6px; margin-top: 1px; }
  .edu-grad {
    color: var(--faint);
    font-size: 8px;
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    margin-top: 1px;
  }

  /* ---- Footer ---- */
  .foot {
    margin-top: 16px;
    padding-top: 9px;
    border-top: 1px solid var(--hair-soft);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
    font-size: 7.4px;
    letter-spacing: 0.06em;
    color: var(--faint);
  }
  .foot .seal { color: var(--accent); }
</style>
</head>
<body>
  <div class="page">
    <header>
      <div class="name">${esc(d.name)}</div>
      <div class="role">DevSecOps Engineer · Security-minded full-stack + cloud (AWS)</div>
      <div class="contact">${contact}</div>
      ${d.summary ? `<p class="summary">${esc(d.summary)}</p>` : ""}
    </header>

    <div class="body">
      <div class="main">
        <section>
          <div class="kicker">// AUDIT_LOG</div>
          ${experienceHTML}
        </section>
      </div>

      <aside class="side">
        <section>
          <div class="kicker">// CAPABILITIES</div>
          ${skillsHTML}
        </section>

        ${
          certsHTML
            ? `<section>
                 <div class="kicker">// TRUST_STORE</div>
                 <ul class="certs">${certsHTML}</ul>
               </section>`
            : ""
        }

        ${
          edu.degree
            ? `<section>
                 <div class="kicker">// EDUCATION</div>
                 <div class="edu-degree">${esc(edu.degree)}</div>
                 <div class="edu-inst">${esc(edu.institution)}</div>
                 <div class="edu-grad">${esc(edu.graduation)}</div>
               </section>`
            : ""
        }
      </aside>
    </div>

    <div class="foot">
      <span>${esc(d.name)} — résumé</span>
      <span class="seal">SECURE_CHANNEL_ESTABLISHED ✓</span>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 3. Print to PDF with headless Chromium.
// ---------------------------------------------------------------------------
async function main() {
  if (!existsSync(SRC)) {
    console.log(`RESUME SKIP: source not found at ${path.relative(ROOT, SRC)}`);
    return;
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("RESUME SKIP: playwright not installed (run `npm i`)");
    return;
  }

  const data = await loadResumeData();
  const html = renderHTML(data);

  await mkdir(path.dirname(OUT), { recursive: true });

  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    // Browser binary missing — emit the exact remediation, then exit cleanly so
    // the tolerant prebuild chain does not hard-fail the whole build.
    console.log(
      "RESUME SKIP: could not launch chromium — run `npx playwright install chromium`"
    );
    console.log(String(e?.message || e).split("\n")[0]);
    return;
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({
      path: OUT,
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await browser.close();
  }

  const { size } = await stat(OUT);
  const kb = Math.round((size / 1024) * 10) / 10;
  if (size < 5 * 1024) {
    throw new Error(`resume.pdf is only ${kb}KB (expected > 5KB) — render likely failed`);
  }
  console.log(`RESUME DONE: ${path.relative(ROOT, OUT)}  ${kb}KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
