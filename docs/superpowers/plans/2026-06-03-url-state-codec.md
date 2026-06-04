# URL State Codec — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled `hooks/useUrlSync.ts` with a single typed codec (`lib/urlState.ts`) that owns the store↔URL contract — encoding open + focus + minimized — fixing the 7 URL audit findings.

**Architecture:** A pure `decode`/`encode` codec (single source of truth, no React/DOM beyond `URLSearchParams`) consumed by a thin `useUrlSync` hook (seed-once + debounced mirror) and an atomic `hydrate` store action. App ids come from one runtime constant `APP_IDS` (the `AppId` type is derived from it), killing the duplicated list.

**Tech Stack:** TypeScript, Next.js 16 (static export), zustand. Unit tests via **vitest** (the one new dev-dependency; see Task 1 — swap for built-in `node:test` if you prefer zero deps).

**Spec:** [`docs/superpowers/specs/2026-06-03-url-state-codec-design.md`](../specs/2026-06-03-url-state-codec-design.md)

**Note on commits:** this repo is currently local-only (no pushes); the `Commit` steps below are local commits — do not push.

---

## File structure

| File | Responsibility |
| --- | --- |
| `store/useDesktopStore.ts` (edit) | `APP_IDS` const + derived `AppId`; new `hydrate()` action |
| `lib/urlState.ts` (new) | pure codec: `decode`, `encode`, `UrlState` |
| `lib/urlState.test.ts` (new) | codec unit tests |
| `store/useDesktopStore.test.ts` (new) | `hydrate` unit test |
| `vitest.config.ts` (new) | test runner + `@/` alias |
| `package.json` (edit) | `vitest` devDep + `test` scripts |
| `hooks/useUrlSync.ts` (rewrite) | thin seed + mirror over the codec |
| `scripts/audit/scenarios.desktop.mjs` (edit) | reload round-trip assertion |

---

## Task 1: Test tooling (vitest)

**Files:** Modify `package.json`; Create `vitest.config.ts`

- [ ] **Step 1: Install vitest**

```bash
npm i -D vitest
```

- [ ] **Step 2: Add test scripts to `package.json`** (in `scripts`, after `audit:ui`)

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: { environment: "node", include: ["**/*.test.ts"] },
});
```

- [ ] **Step 4: Verify the runner boots** (no tests yet = exit 0 with "No test files found")

Run: `npx vitest run`
Expected: exits without error (reports no test files).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add vitest runner"
```

---

## Task 2: `APP_IDS` single source of truth

**Files:** Modify `store/useDesktopStore.ts:3-9`

- [ ] **Step 1: Replace the hand-written `AppId` union with a derived one**

Replace:

```ts
export type AppId =
    | "terminal"
    | "about"
    | "career"
    | "stack"
    | "projects"
    | "contact";
```

with:

```ts
// Single source of truth for app ids. The AppId type is derived from this, so
// the list never drifts (used by config/apps, config/dock, and lib/urlState).
export const APP_IDS = [
    "terminal",
    "about",
    "career",
    "stack",
    "projects",
    "contact",
] as const;

export type AppId = (typeof APP_IDS)[number];
```

- [ ] **Step 2: Verify nothing broke**

Run: `npx tsc --noEmit`
Expected: clean (existing `AppId` consumers — `config/apps.ts`, `config/dock.ts`, `useUrlSync.ts` — still typecheck; `AppId` is unchanged in meaning).

- [ ] **Step 3: Commit**

```bash
git add store/useDesktopStore.ts
git commit -m "refactor(store): derive AppId from a single APP_IDS const"
```

---

## Task 3: Codec — `decode`

**Files:** Create `lib/urlState.ts`; Create `lib/urlState.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// lib/urlState.test.ts
import { describe, it, expect } from "vitest";
import { decode } from "@/lib/urlState";

describe("decode", () => {
  it("parses open/min/focus", () => {
    expect(decode("?open=terminal,about&min=about&focus=terminal")).toEqual({
      open: ["terminal", "about"], minimized: ["about"], focus: "terminal",
    });
  });
  it("lowercases, trims, drops unknown ids, dedups (order preserved)", () => {
    expect(decode("?open=Terminal, about , bogus,about")).toEqual({
      open: ["terminal", "about"], minimized: [], focus: null,
    });
  });
  it("constrains min ⊆ open and focus ∈ open", () => {
    expect(decode("?open=terminal&min=about&focus=about")).toEqual({
      open: ["terminal"], minimized: [], focus: null,
    });
  });
  it("empty search → empty state", () => {
    expect(decode("")).toEqual({ open: [], minimized: [], focus: null });
  });
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run lib/urlState.test.ts`
Expected: FAIL — cannot import `decode` (module not found).

- [ ] **Step 3: Implement `decode` (+ types/helpers)**

```ts
// lib/urlState.ts
import { APP_IDS, type AppId } from "@/store/useDesktopStore";

export interface UrlState {
  open: AppId[];        // store/insertion order
  minimized: AppId[];   // subset of open
  focus: AppId | null;  // member of open, or null
}

const isAppId = (s: string): s is AppId => (APP_IDS as readonly string[]).includes(s);

function parseList(value: string | null): AppId[] {
  if (!value) return [];
  const out: AppId[] = [];
  for (const raw of value.split(",")) {
    const id = raw.trim().toLowerCase();
    if (isAppId(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function decode(search: string): UrlState {
  const params = new URLSearchParams(search);
  const open = parseList(params.get("open"));
  const minimized = parseList(params.get("min")).filter((id) => open.includes(id));
  const f = (params.get("focus") ?? "").trim().toLowerCase();
  const focus = isAppId(f) && open.includes(f) ? f : null;
  return { open, minimized, focus };
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npx vitest run lib/urlState.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/urlState.ts lib/urlState.test.ts
git commit -m "feat(url): add decode() codec"
```

---

## Task 4: Codec — `encode` + round-trip

**Files:** Modify `lib/urlState.ts`; Modify `lib/urlState.test.ts`

- [ ] **Step 1: Add failing tests**

```ts
// append to lib/urlState.test.ts
import { encode } from "@/lib/urlState";

describe("encode", () => {
  it("empty open → empty string", () => {
    expect(encode({ open: [], minimized: [], focus: null })).toBe("");
  });
  it("clean commas, omits null focus + empty min", () => {
    expect(encode({ open: ["terminal", "about"], minimized: [], focus: "terminal" }))
      .toBe("open=terminal,about&focus=terminal");
  });
  it("includes min when present", () => {
    expect(encode({ open: ["terminal", "about"], minimized: ["about"], focus: "terminal" }))
      .toBe("open=terminal,about&min=about&focus=terminal");
  });
});

describe("round-trip", () => {
  it("decode('?'+encode(s)) === s for valid states", () => {
    const s = { open: ["projects", "terminal", "about"], minimized: ["about"], focus: "projects" } as const;
    expect(decode("?" + encode(s))).toEqual(s);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run lib/urlState.test.ts`
Expected: FAIL — `encode` not exported.

- [ ] **Step 3: Implement `encode`** (append to `lib/urlState.ts`)

```ts
// App ids are lowercase [a-z] only, so literal commas need no escaping — keeps
// URLs clean (open=terminal,about) instead of percent-encoded.
export function encode(state: UrlState): string {
  if (state.open.length === 0) return "";
  const parts = [`open=${state.open.join(",")}`];
  const min = state.minimized.filter((id) => state.open.includes(id));
  if (min.length) parts.push(`min=${min.join(",")}`);
  if (state.focus && state.open.includes(state.focus)) parts.push(`focus=${state.focus}`);
  return parts.join("&");
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npx vitest run lib/urlState.test.ts`
Expected: PASS (all decode + encode + round-trip).

- [ ] **Step 5: Commit**

```bash
git add lib/urlState.ts lib/urlState.test.ts
git commit -m "feat(url): add encode() + round-trip"
```

---

## Task 5: Store — `hydrate()` action

**Files:** Modify `store/useDesktopStore.ts`; Create `store/useDesktopStore.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// store/useDesktopStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useDesktopStore } from "@/store/useDesktopStore";

describe("hydrate", () => {
  beforeEach(() => useDesktopStore.getState().reset());

  it("opens listed apps with minimized flags + focus, ascending z", () => {
    useDesktopStore.getState().hydrate({ open: ["terminal", "about"], minimized: ["about"], focus: "terminal" });
    const s = useDesktopStore.getState();
    expect(Object.keys(s.windows).sort()).toEqual(["about", "terminal"]);
    expect(s.windows.about?.minimized).toBe(true);
    expect(s.windows.terminal?.minimized).toBe(false);
    expect(s.focusedId).toBe("terminal");
    expect(s.windows.about!.z).toBeGreaterThan(s.windows.terminal!.z);
  });

  it("empty open clears windows", () => {
    useDesktopStore.getState().hydrate({ open: ["terminal"], minimized: [], focus: "terminal" });
    useDesktopStore.getState().hydrate({ open: [], minimized: [], focus: null });
    const s = useDesktopStore.getState();
    expect(Object.keys(s.windows)).toEqual([]);
    expect(s.focusedId).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run store/useDesktopStore.test.ts`
Expected: FAIL — `hydrate is not a function`.

- [ ] **Step 3: Add `hydrate` to the interface** (in `DesktopState`, after `setPos`)

```ts
    hydrate: (state: { open: AppId[]; minimized: AppId[]; focus: AppId | null }) => void;
```

- [ ] **Step 4: Implement `hydrate`** (in the `create(...)` object, after `setPos`)

```ts
    // Atomically build the windows map from a decoded URL state (one set(), so
    // minimized windows never flash open on load). Reuses nextOrigin for layout.
    hydrate: (state) => {
        const windows: Partial<Record<AppId, WindowState>> = {};
        let z = 10;
        for (const id of state.open) {
            z += 1;
            const existing = Object.values(windows).filter(
                (w): w is WindowState => Boolean(w),
            );
            windows[id] = {
                id,
                pos: nextOrigin(existing),
                z,
                minimized: state.minimized.includes(id),
                maximized: false,
            };
        }
        set({ windows, topZ: z, focusedId: state.focus });
    },
```

- [ ] **Step 5: Run — verify pass**

Run: `npx vitest run store/useDesktopStore.test.ts && npx tsc --noEmit`
Expected: PASS + tsc clean.

- [ ] **Step 6: Commit**

```bash
git add store/useDesktopStore.ts store/useDesktopStore.test.ts
git commit -m "feat(store): add hydrate() to atomically seed windows from URL state"
```

---

## Task 6: Rewrite `useUrlSync`

**Files:** Modify `hooks/useUrlSync.ts` (full replacement)

- [ ] **Step 1: Replace the file contents**

```ts
"use client";

import { useEffect } from "react";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { decode, encode, type UrlState } from "@/lib/urlState";

// Default landing (no ?open= deep-link): Terminal + About, Terminal focused.
const DEFAULT_OPEN: AppId[] = ["terminal", "about"];

function currentQuery(): string {
  return window.location.search ? window.location.search : window.location.pathname;
}

function writeUrl(state: UrlState): void {
  const next = encode(state);
  const target = next ? `?${next}` : window.location.pathname;
  if (target !== currentQuery()) {
    window.history.replaceState(null, "", target);
  }
}

export function useUrlSync() {
  const hydrate = useDesktopStore((s) => s.hydrate);
  const setPhase = useBootStore((s) => s.setPhase);

  // Seed once on mount: decode → hydrate → strip ?skip → canonicalize URL.
  useEffect(() => {
    const search = window.location.search;
    const decoded = decode(search);
    const skip = new URLSearchParams(search).get("skip") === "1";
    if (skip || decoded.open.length > 0 || decoded.focus !== null) {
      setPhase("reveal");
    }

    const seed: UrlState =
      decoded.open.length > 0
        ? {
            open: decoded.open,
            minimized: decoded.minimized,
            focus: decoded.focus ?? decoded.open[decoded.open.length - 1],
          }
        : { open: [...DEFAULT_OPEN], minimized: [], focus: "terminal" };

    hydrate(seed);
    writeUrl(seed); // canonical URL; drops ?skip and any garbage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror store → URL (debounced, write-only-on-change).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      const s = useDesktopStore.getState();
      const open = Object.keys(s.windows) as AppId[];
      const minimized = open.filter((id) => s.windows[id]?.minimized);
      writeUrl({ open, minimized, focus: s.focusedId });
    };
    const unsub = useDesktopStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(flush, 150);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);
}
```

- [ ] **Step 2: Verify types + lint**

Run: `npx tsc --noEmit && npx eslint hooks/useUrlSync.ts`
Expected: clean. (The hook no longer imports `parseOpen`/`parseFocus`/a local `APP_IDS` — all gone.)

- [ ] **Step 3: Manual smoke test** (dev server running on :3000)

1. Load `http://localhost:3000/` → Terminal + About open, Terminal focused, URL becomes `?open=terminal,about&focus=terminal` (no `?skip`).
2. Load `http://localhost:3000/?open=projects,about&focus=projects&skip=1` → Projects + About open, Projects focused, `?skip` stripped from URL.
3. Open Stack, minimize About → URL reflects `min=about`; reload → About restored minimized, Stack still open.
4. Load `http://localhost:3000/?open=BOGUS,Terminal` → only Terminal opens (case-normalized, garbage dropped).

- [ ] **Step 4: Commit**

```bash
git add hooks/useUrlSync.ts
git commit -m "refactor(url): rewrite useUrlSync over the urlState codec (open+focus+minimized, replaceState, strip skip)"
```

---

## Task 7: Harness — reload round-trip assertion

**Files:** Modify `scripts/audit/scenarios.desktop.mjs`

- [ ] **Step 1: Add a `urlroundtrip` scenario** (after the `deeplink` function; export it in `DESKTOP_SCENARIOS`)

```js
/** 11. URL round-trip: minimized state + skip-strip survive a reload. */
export async function urlroundtrip(context, sink, profile) {
  const steps = [];
  const page = await newPage(context, sink, "urlroundtrip", profile);
  await page.goto(`${BASE_URL}?open=terminal,about,projects&focus=projects&skip=1`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  // minimize About via its titlebar Minimize button
  await page.locator('[role="dialog"][aria-label="About window"] [aria-label="Minimize"]').click().catch(() => {});
  await sleep(400);
  const urlAfter = await page.evaluate(() => window.location.search);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitReady(page);
  await sleep(400);
  const restored = {
    terminal: await page.locator('[role="dialog"][aria-label="Terminal window"]').count(),
    projects: await page.locator('[role="dialog"][aria-label="Projects window"]').count(),
    aboutVisible: await page.locator('[role="dialog"][aria-label="About window"]').count(),
  };
  steps.push({
    label: "url round-trip",
    shot: await shot(page, profile, "urlroundtrip", "00-after-reload"),
    note:
      `urlAfterMin=${urlAfter} | skipStripped=${!urlAfter.includes("skip")} | ` +
      `restored=${JSON.stringify(restored)} (About should be minimized => count 0)` +
      (urlAfter.includes("min=about") && !urlAfter.includes("skip") ? " ok" : " FAIL"),
  });
  await page.close();
  return steps;
}
```

Then add `urlroundtrip` to the `DESKTOP_SCENARIOS` array.

- [ ] **Step 2: Run the harness**

Run: `npm run audit:ui`
Expected: `[desktop/urlroundtrip] url round-trip: ... min=about ... skipStripped=true ... ok`, totals show 0 errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/audit/scenarios.desktop.mjs
git commit -m "test(audit): URL round-trip reload scenario"
```

---

## Task 8: Final verification + close beads

- [ ] **Step 1: Full gate**

```bash
npx vitest run && npx tsc --noEmit && npm run lint && npm run build
```
Expected: tests pass, tsc clean, lint clean, build green.

- [ ] **Step 2: Close the resolved URL beads**

```bash
bd list -l cluster:url --status open   # confirm ids
bd close <id...> --reason "Resolved by URL state codec (lib/urlState.ts + hydrate + useUrlSync rewrite)"
```
Resolves: duplicated APP_IDS, case-sensitivity, ?focus force-open, ?focus-no-open-terminal, ?skip retained, minimized round-trip, replaceState churn. (Leave the terminal-chips-accumulate bead open — separate chips fix.)

- [ ] **Step 3: Commit any remaining**

```bash
git add -A && git commit -m "docs: url codec complete; close url-cluster beads"
```

---

## Self-review

- **Spec coverage:** codec module (T3–4) ✓ · derived APP_IDS (T2) ✓ · hydrate (T5) ✓ · seed+strip-skip+default (T6) ✓ · mirror debounce+dedup (T6) ✓ · replaceState/no-popstate (T6) ✓ · open+focus+minimized encoding (T3–4) ✓ · unit tests (T1,3,4,5) ✓ · integration round-trip (T7) ✓. All 7 URL audit findings mapped (T8). Out-of-scope items (positions, pushState, chips) correctly excluded.
- **Placeholder scan:** every step has complete code/commands.
- **Type consistency:** `UrlState`, `AppId`, `APP_IDS`, `decode`, `encode`, `hydrate(state)` signatures match across tasks; `hydrate`'s structural param matches `UrlState` (no circular import).
- **Decision flagged:** Task 1 adds `vitest` (one devDep). Zero-dep alternative: author tests as `*.test.mjs` run with `node --test` — but TS + `@/` alias + the zustand import make vitest the lower-friction choice.
