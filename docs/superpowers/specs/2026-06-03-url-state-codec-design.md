# URL State Codec — Design

**Date:** 2026-06-03
**Branch:** `jake-os`
**Status:** Design — approved, pending implementation plan
**Motivation:** The current `hooks/useUrlSync.ts` is hard to manage and the interaction audit confirmed 7 URL/deep-link defects. This replaces it with a single typed codec that owns the store↔URL contract.

---

## 1. Intent

Make jakeOS's query-string state **easy to manage and correct**: one module is the single source of truth for serializing window state to the URL and parsing it back. Encode **open apps + focus + minimized**; use `replaceState`; zero new dependencies (static-export safe).

### Decisions (confirmed)
- **Architecture:** typed codec module, no deps.
- **Encoded state:** open + focus + minimized (NOT positions/maximized).
- **History:** `replaceState` only (URL stays shareable/bookmarkable; Back exits the app — accepted).

### Audit findings this resolves
| Bead area | Finding | Resolution |
| --- | --- | --- |
| url | `APP_IDS` duplicated, hand-maintained, drifts from registry | Derive ids from the `APPS` registry |
| url | App ids case-sensitive; plausible values silently dropped | `decode` lowercases/trims/normalizes |
| url | `?focus=X` not in `?open` force-opens an extra window | `decode` constrains `focus ∈ open`; seed owns defaults |
| url | `?focus=X` with no `?open` spuriously opens Terminal | seed default logic is explicit, not a side effect |
| url | `?skip=1` retained forever, pollutes shared links | strip `skip` after seeding |
| url | Minimized state lost on round-trip (reopens un-minimized + focused) | encode `min=`; `hydrate` restores minimized |
| url | `replaceState` churn (writes every rAF) | debounce + write only when the encoded string changes |

Out of scope (separate beads): window positions/maximized in URL; pushState/Back-navigation; terminal-chips-accumulate-windows (a chips UX bug, not URL plumbing).

---

## 2. Architecture

Three focused units.

### 2.1 `lib/urlState.ts` — the pure codec (no React, no DOM beyond `URLSearchParams`)

The single source of truth for the contract. Pure and unit-testable.

```ts
import { APPS } from "@/components/desktop/config/apps";
import type { AppId } from "@/store/useDesktopStore";

export interface UrlState {
  open: AppId[];          // store/insertion order
  minimized: AppId[];     // subset of open
  focus: AppId | null;    // member of open, or null
}

const APP_IDS = Object.keys(APPS) as AppId[];           // derived, never duplicated
const isAppId = (s: string): s is AppId => (APP_IDS as string[]).includes(s);

// querystring → normalized, validated UrlState
export function decode(search: string): UrlState { /* see §3 */ }

// UrlState → canonical querystring (no leading "?"); "" when empty
export function encode(state: UrlState): string { /* see §3 */ }
```

Params: `open=a,b,c` · `min=b` (omitted when empty) · `focus=a` (omitted when null). When `open` is empty the whole string is empty (→ clean path).

### 2.2 `store/useDesktopStore.ts` — add `hydrate(state: UrlState)`

One atomic action that builds the `windows` map in a single `set()` so minimized windows never flash open on load:

```ts
hydrate: (state: UrlState) => void;
```

Behavior: for each id in `state.open` (in order), create a `WindowState` with a position from the existing `nextOrigin` cascade, `minimized: state.minimized.includes(id)`, `maximized: false`, and ascending `z`; set `topZ` accordingly; set `focusedId = state.focus`. Reuses `nextOrigin`; introduces no new positioning logic.

### 2.3 `hooks/useUrlSync.ts` — thin orchestrator (rewritten)

- **Seed (once, on mount):**
  1. `const decoded = decode(window.location.search)`.
  2. `skipBoot = new URLSearchParams(location.search).get("skip") === "1" || decoded.open.length > 0 || decoded.focus !== null` → if so `setPhase("reveal")`.
  3. If `decoded.open.length === 0`, apply `DEFAULT_OPEN = ["terminal","about"]` with `focus = "terminal"`; else use `decoded` (focus = `decoded.focus ?? last(open)`).
  4. `hydrate(finalState)`.
  5. Strip `skip` from the URL and write the canonical `encode(finalState)` via `replaceState`.
- **Mirror (on store change):** subscribe to a derived `{ open, minimized, focus }` slice; debounce ~150 ms; compute `next = encode(...)`; `replaceState` **only if** `next !== current` query string.
- `replaceState` only. No `popstate` listener (documented: Back exits).

---

## 3. Codec semantics (precise)

**`decode(search)`**
1. Parse with `URLSearchParams`.
2. `open` = split `open` on `,`, `trim().toLowerCase()`, keep `isAppId`, dedupe (first wins, preserve order).
3. `minimized` = same parse of `min`, then intersect with `open`.
4. `focus` = `trim().toLowerCase()` of `focus`; keep only if `isAppId` AND `∈ open`; else `null`.
5. Return `{ open, minimized, focus }`. Never throws; unknown/garbage silently dropped.

**`encode(state)`**
1. If `open.length === 0` → return `""`.
2. `open=open.join(",")`; if `minimized.length` → `min=(minimized ∩ open).join(",")`; if `focus && open.includes(focus)` → `focus=focus`.
3. Build with `URLSearchParams` for consistent escaping; return `params.toString()`.

**Round-trip invariant:** `decode(encode(s)) ≡ normalize(s)` for any `s` whose `open` ids are valid (tested).

---

## 4. Testing

- **Unit (`lib/urlState.ts`)** — TDD:
  - round-trip: `decode(encode(s)) === s` for representative states (empty, single, multi, minimized subset, focus).
  - normalization: uppercase ids, whitespace, duplicates, unknown ids dropped.
  - constraints: `min ⊄ open` trimmed to intersection; `focus ∉ open` → null; `focus` with empty `open` → null.
  - empty state → `""`.
- **Integration** — extend the Playwright deep-link scenario: load `?open=terminal,about,projects&focus=projects`, minimize one, reload, assert the workspace (open set + minimized + focus) is restored; assert `?skip=1` is gone from the URL after load.

---

## 5. File layout

```
lib/urlState.ts                 NEW   — pure codec (decode/encode, derived APP_IDS)
store/useDesktopStore.ts        EDIT  — add hydrate(state)
hooks/useUrlSync.ts             REWRITE — thin seed + mirror over the codec
lib/urlState.test.* (or scripts/audit) — codec unit tests
scripts/audit/scenarios.desktop.mjs    EDIT — reload round-trip assertion
```

---

## 6. Risks & mitigations
| Risk | Mitigation |
| --- | --- |
| `hydrate` bypasses `open()`'s focus/z bookkeeping | Mirror `open()`'s invariants (ascending z, topZ, focusedId) inside one `set()`; unit-cover. |
| Mirror writes during the seed (feedback loop) | Seed writes the canonical URL itself; mirror dedups on the encoded string so the seed's write is a no-op. |
| Debounce drops the final state on rapid changes | Trailing-edge debounce + flush on unmount. |
| Static export: no `useSearchParams`/router | Use `window.location` + `history.replaceState` directly (client component), as today. |
