# jakeOS — Visual & Interactive UI/UX Audit Design

**Date:** 2026-06-02
**Branch:** `jake-os`
**Status:** Design — approved, pending implementation plan
**Related:** [`2026-05-31-jakeos-design.md`](./2026-05-31-jakeos-design.md) (the system under audit)

---

## 1. Intent

The `jake-os` branch has shipped its full 5-phase build: a faux desktop OS portfolio
(`jakeOS`) with a boot→reveal morph, draggable windows, a magnetic dock, a ⌘K Spotlight
palette, an interactive terminal, deep-linking, and a separate mobile shell. The build is
functionally complete; window drag/physics is mid-rewrite (uncommitted `WindowFrame.tsx`
+ new `lib/windowPhysics.ts`).

This project is a **QA pass**, not a feature build. The goal: systematically prove jakeOS
delivers **powerful, polished UI/UX on both desktop and mobile**, capture every defect as a
bead, then auto-fix high-and-above severity via parallel sub-agents, and re-verify.

The rubric is the system's own spec — the [success criteria](./2026-05-31-jakeos-design.md)
and signature moments define "correct"; this audit checks the implementation against them
and against general UI/UX, accessibility, and runtime-health standards.

### Success criteria for the audit itself

- Every key state of both shells is exercised and screenshotted at desktop **and** mobile viewports.
- Console errors, page errors, and failed requests are captured for every scenario.
- Each defect is filed as a bead with severity, surface, repro, and a screenshot reference.
- Critical/high/medium beads are fixed and re-verified; the harness re-run shows no regressions.
- A final report enumerates findings, fixes, and residual low-severity items.

---

## 2. Decisions (confirmed)

| Decision | Choice |
| --- | --- |
| Issue tracking | **beads** — `brew install beads`, `bd init` in repo; one bead per finding. |
| Audit method | **Scripted Playwright capture** — `npm i -D playwright`, reuse cached Chromium 1208. |
| Fix policy | **Auto-fix critical + high + medium.** Low filed, not auto-fixed. |
| Audit target | **Current working tree**, including the in-flight `WindowFrame` drag rework. |

---

## 3. Setup (one-time)

1. `brew install beads`; `bd init` at repo root. Commit the resulting `.beads/` scaffold.
2. `npm i -D playwright` (Chromium 1208 already cached under `~/Library/Caches/ms-playwright`).
3. Serve target: `next dev` on `:3000` for live-app fidelity and fast iteration.
4. Harness at `scripts/audit/`; screenshots written to `scripts/audit/shots/` (gitignored).

---

## 4. The harness

A Playwright script driving Chromium in two profiles against the local dev server:

- **Desktop** — 1440×900 viewport, mouse + keyboard, no touch.
- **Mobile** — 390×844 viewport, touch enabled, deviceScaleFactor 3.

For every scenario the harness:

- Attaches listeners for `console` (error/warning), `pageerror`, and `requestfailed`,
  accumulating them into a per-run JSON log keyed by scenario + viewport.
- Drives the scripted interaction, waiting on real signals (selectors / boot phase) rather
  than fixed sleeps where possible.
- Screenshots each meaningful state into `shots/<viewport>/<scenario>-<step>.png`.

The harness is deterministic and re-runnable: it is both the discovery tool (first pass)
and the regression gate (post-fix pass).

---

## 5. Scenario matrix

### Desktop
1. Cold boot: `loading → booting → reveal → ready`; capture the boot-terminal→Terminal.app
   `layoutId` morph and the menubar/dock/wallpaper materialization.
2. Default ready state (Terminal open).
3. Dock: open About, Career, Stack, Contact — screenshot each window; verify running-dots.
4. Window machinery: drag by titlebar; snap left/right edge (cyan flash); maximize via top
   edge; minimize; close; focus glow on click; z-order when two windows overlap.
5. ⌘K Spotlight: open, type to filter (apps + commands + skills), arrow-key + Enter to
   launch, Esc to dismiss.
6. Terminal: `help`, `whoami`, `ls`, `cd`, `cat`, `open <app>`, `close <app>`, ↑/↓ history.
7. Hotkeys: ⌘W close, ⌘M minimize, ⌘1–⌘5 focus/open.
8. Deep-links: `?open=terminal,career&focus=career`; `?skip=1`.
9. `prefers-reduced-motion: reduce` reload — verify reduced motion / LiquidGlass skip.
10. Per-app content: overflow + native scroll inside each window.

### Mobile
1. Cold boot → mobile shell (no window chrome).
2. Tab-bar dock: tap each of the 5 apps; capture full-screen slide-in.
3. Terminal quick-command chips: `help`, `ls`, `whoami`, `copy email`.
4. Leak check: no drag, no palette, no desktop window frame present.
5. Touch-scroll within app content.
6. No horizontal overflow; safe-area respected.

---

## 6. Audit dimensions (defect criteria)

Every state is graded on:

- **Functional correctness** — behavior matches the jakeOS spec (snap, palette filter,
  terminal command bridge, deep-link seeding, hotkeys).
- **Visual fidelity** — layout, alignment, spacing, overflow/clipping, z-index correctness,
  contrast/legibility, VOID/LASER palette consistency, no empty/broken states.
- **Responsiveness** — 768px shell switch is clean; no horizontal scroll; touch targets ≥ ~44px.
- **Accessibility** — visible focus, palette focus-trap + restoration, dialog roles,
  `aria-label`s on windows, `prefers-reduced-motion` honored, keyboard navigability.
- **Console / runtime health** — zero console errors/warnings, no failed requests, no
  unhandled rejections, no React hydration/key warnings.
- **The "powerful" bar** — each surface feels deep and first-class on **both** web and
  mobile; nothing reads as stubbed, placeholder, or half-built (excepting the WIP drag work,
  which is flagged rather than treated as a regression).

---

## 7. Findings → beads

Each finding is one bead:

- **Title** — terse, specific.
- **Severity** — critical / high / medium / low (rubric below).
- **Surface** — desktop / mobile / both.
- **Component / file** — best-guess source location.
- **Repro** — steps + viewport.
- **Expected vs actual.**
- **Screenshot ref** — path under `shots/`.

Severity rubric:

| Severity | Definition |
| --- | --- |
| critical | Broken/unusable, crash, blank app, or console error on load. |
| high | Core interaction broken or clearly wrong; major visual break; mobile unusable. |
| medium | Noticeable visual/UX defect, minor interaction glitch, or accessibility gap. |
| low | Polish nit. |

Beads are tagged (e.g. `surface:mobile`, `dim:a11y`, `area:window`) so fix dispatch can
group them.

---

## 8. Fix execution — auto-fix above severity

- **Threshold:** critical + high + medium are auto-fixed. Low is filed and left for the user.
- **Dispatch:** one sub-agent per bead, **grouped by source file** so no two agents edit the
  same file concurrently. Conflicting groups run sequentially or in isolated worktrees.
- **Per-agent loop:** read the bead → implement the minimal fix → verify (re-run that
  Playwright scenario + `tsc --noEmit` + `eslint`) → mark the bead resolved with a note.
- **Scope discipline:** each agent fixes only its bead. No opportunistic refactors; the
  jakeOS spec's v2 non-goals (resize handles, recruiter mode, light theme, etc.) stay out.
- **Regression gate:** re-run the full harness after fixes; any new failure becomes a new bead.

---

## 9. Deliverables

- Populated `bd` database (all findings, with resolution state).
- Committed harness under `scripts/audit/` + a final markdown audit report
  (`docs/superpowers/audits/2026-06-02-uiux-audit-report.md`) with findings, before/after
  evidence, and residual low-severity items.
- Fixes committed on `jake-os`.

---

## 10. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Uncommitted WindowFrame drag rework is mid-flight | Audit working tree as-is; flag obviously-WIP drag behavior rather than auto-fixing the part under active reconstruction. |
| Parallel sub-agents editing the same file | Group beads by file; conflicting groups run sequentially / in worktrees. |
| Auto-fix scope creep into v2 features | Agents fix only their bead; v2 non-goals explicitly out of scope. |
| Dev-mode vs static-export (`output: "export"`) differences | UI/UX audit in dev is faithful; note any prod-build-only concerns separately. |
| Flaky timing on boot/morph capture | Wait on boot-phase state + selectors, not fixed sleeps. |

---

## 11. Out of scope

- Building new jakeOS features or v2 items.
- Full Lighthouse/perf-budget audit (light perf signals only; deep perf is a separate pass).
- Content/copy rewrites beyond fixing broken or placeholder states.
