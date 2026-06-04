# jakeOS — Visual & Interactive UI/UX Audit Report

**Date:** 2026-06-02
**Branch:** `jake-os`
**Scope:** Full interactive + visual audit of the jakeOS desktop OS portfolio on desktop (1440×900) and mobile (390×844), plus a design-system consistency pass. Defects tracked as beads (`bd`); critical/high/medium auto-fixed via sub-agents; design alignment applied with user sign-off.
**Spec / plan:** [`specs/2026-06-02-uiux-audit-design.md`](../specs/2026-06-02-uiux-audit-design.md) · [`plans/2026-06-02-uiux-audit.md`](../plans/2026-06-02-uiux-audit.md)

---

## 1. Outcome

The build is **high quality**. The interactive surfaces — dock, window machinery (drag/tidy/maximize/minimize/close, z-order), ⌘K Spotlight, hotkeys, deep-links, and the four content apps (About / Career / Stack / Contact) — all work and look polished on **both** web and mobile.

The audit found one real problem cluster (the **Terminal**) plus design-consistency drift on the **boot loader** and terminal. All critical/high/medium items are fixed and re-verified; the harness now reports **12/12 scenarios pass, 0 console errors** (the 4 remaining console entries are benign WebGL screenshot-capture warnings — see §5).

| Metric | Discovery run | Final run |
| --- | --- | --- |
| Scenarios pass / fail / error | 10 / 2 / 0 | **12 / 0 / 0** |
| Terminal time-to-interactive (skip) | **>30 s** | **66 ms** |
| Terminal time-to-interactive (cold) | >30 s | **271 ms** |
| Console errors (clean load) | (masked) | **0** |

---

## 2. Methodology

- **Harness:** `scripts/audit/` — Playwright (library) driving headless Chromium against `next dev`, two profiles (desktop 1440×900; mobile iPhone-13 390×844). 12 scenarios cover boot, dock, windows, palette, terminal, hotkeys, deep-links, app content, reduced-motion, and the mobile shell. Screenshots + console/page/request capture per scenario. Run with `npm run audit:ui`.
- **Anti-artifact discipline.** Several first-pass "failures" were proven to be *test artifacts*, not app bugs, before any were filed or fixed:
  - Chromium **background-timer throttling** made boot timers + the typewriter crawl → added `--disable-background-timer-throttling` (+ siblings) and `bringToFront()`.
  - A focused **probe** (`scripts/audit/out/probe.mjs`) measured true time-to-interactive and DOM state without screenshots.
  - A **console-only probe** (`scripts/audit/out/console-probe.mjs`) proved real page loads emit **0 console errors**, isolating the harness's caret/WebGL screenshot artifacts.

---

## 3. Findings

| Bead | Sev | Surface | Status | Issue |
| --- | --- | --- | --- | --- |
| `v62` | P0 | both | ✅ fixed | Terminal never became interactive (input gated behind a ~45 s typewriter replay; measured >30 s) |
| `ihy` | P1 | both | ✅ fixed | Terminal drew duplicate macOS chrome inside `WindowFrame` (two titlebars) |
| `4b4` | P1 | both | ✅ fixed | Terminal didn't fill its window/screen (fixed 360 px + `max-w-xl`); dead space, esp. mobile |
| `ou9` | P2 | both | ✅ fixed | Boot/page-load broke VOID/LASER palette (black bg, green systemd `[OK]`, RGB CRT, white bar) |
| `8n5` | P2 | both | ✅ fixed | Terminal off-palette (`#1c1c1c`/`#f1f1f1`) + Menlo font instead of VOID navy + Geist Mono |
| `7ph` | P2 | both | ✅ fixed | `NowWidget` rendered `new Date()` at initial render → static-export hydration-mismatch risk |
| `t0e` | P3 | both | ⬜ open | `uptime 27y` (menubar) vs `whoami` "26 years" — needs Jake's real DOB to pick 26 vs 27 |
| `4t4` | P3 | desktop | ⬜ open | Boot→Terminal `layoutId="terminal-window"` has no matching destination → morph degrades to fade |
| `yxo` | P3 | desktop | ⬜ open | Esc doesn't dismiss the focused window (spec lists it; only palette is wired) |
| `ohk` | P3 | desktop | ⬜ open | Spec divergence: snap-to-edge + cyan flash replaced by matter-js physics + "Tidy" (intentional WIP — don't revert; update the spec) |

---

## 4. Fixes applied

### Terminal cluster — `components/TerminalTyping.tsx` (+ `apps/TerminalApp.tsx`)
`TerminalTyping` is no longer the boot terminal (`QuantumLoader` owns boot), so its boot-replay machinery was dead weight. Removed the phase state machine + `<Typewriter>` + `window.terminalTypewriter`/`isBootComplete` `.start()` race; the interactive prompt now renders on mount with the transcript pre-printed (**66 ms** to typeable). Deleted the component's own macOS chrome (traffic lights + "jake — -zsh" bar) → single `WindowFrame` titlebar. Root is now `w-full h-full` (no `max-w-xl`/`mx-auto`/fixed height) → fills the window on desktop and the full screen on mobile. All commands, history, autocomplete, Ctrl+L, chips, and the open/close bridge preserved.

### Boot re-skin — `components/QuantumLoader.tsx` (VOID/LASER, user-approved)
`bg-black` → deep navy void `#020617` (matches the wallpaper sky for a seamless reveal); `[OK]` → accent cyan; `$ login` → primary violet; `welcome back` → cyan glow; progress bar → violet→cyan gradient; RGB CRT scanlines → subtle cyan. Already on Geist Mono.

### Terminal palette/font — `TerminalTyping.tsx` + `TerminalApp.tsx`
`bg-[#1c1c1c]` → `bg-[#0a0a18]` (matches `WindowFrame`); `text-[#f1f1f1]` → `text-foreground`; chips → `text-muted-foreground`; removed the hardcoded `Menlo/Monaco` font so it inherits **Geist Mono** (`font-mono` token).

### Hydration hardening — `components/desktop/NowWidget.tsx`
Mount-gates the clock/uptime: renders a stable placeholder on first paint and sets `new Date()` only in `useEffect`, so the static-export build-time HTML matches the client (no hydration mismatch). Verified 0 console errors on clean load.

---

## 5. Refuted false-positives (did NOT file/fix)

Rigor note — these *looked* like bugs in raw screenshots but were proven to be test/environment artifacts:

- **Boot screen behind the palette** — Chromium background-timer throttling; gone once disabled.
- **Reduced-motion "broken chrome"** — transient capture; probe at 6 s showed menubar + dock present.
- **Mobile "stuck boot"** — the mobile `nav` exists in the DOM under the boot overlay, so `waitReady` resolved at 71 ms and screenshotted mid-boot; mobile boot completes fine.
- **Hydration `console.error` in-harness** — Playwright's default screenshot `caret: "hide"` injected `caret-color: transparent` into the focused input during hydration. Real loads = 0 errors. Harness now uses `caret: "initial"`.
- **Palette Esc "didn't close"** — timing flake; passes consistently now.
- **WebGL "GPU stall due to ReadPixels" warnings (×4)** — emitted by `page.screenshot()` reading the live WebGL canvas; not present on real loads.

---

## 6. What's strong (no action needed)

- **Content apps** (About / Career / Stack / Contact) — correct use of design tokens (`text-accent`, `text-primary`, `text-muted-foreground`, `border-border`, `font-mono`); polished on desktop and full-bleed on mobile with working copy buttons.
- **Window machinery** — matter-js physics drag, "Tidy" grid, maximize, minimize, close, focus glow, z-order all correct.
- **Spotlight, hotkeys, deep-links** — all functional.

---

## 7. Residual open items (P3, your call)

- `t0e` **uptime 26 vs 27** — confirm your birth year; then align `NowWidget` `BIRTH_YEAR` with the `whoami` "26 years" / résumé. (Not auto-fixed — don't want to guess your age.)
- `4t4` **boot→terminal morph** — decide: wire `layoutId="terminal-window"` onto the Terminal window for the spec'd morph, or accept the fade and update the spec.
- `yxo` **Esc dismiss window** — one-line add in `hooks/useHotkeys.ts` if you want spec parity.
- `ohk` **physics vs spec** — update `specs/2026-05-31-jakeos-design.md` §9 to document the physics/Tidy redesign (or restore snap-to-edge). Intentional WIP — not a regression.

---

## 8. Running the audit

```bash
npm run dev          # serve at :3000
npm run audit:ui     # 12 scenarios × 2 profiles → screenshots + findings.json in scripts/audit/out/
```

`scripts/audit/out/` is gitignored (screenshots/logs). The harness doubles as a regression gate.
