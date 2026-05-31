# jakeOS — Desktop-as-Portfolio Design

**Date:** 2026-05-31
**Branch:** `jake-os`
**Status:** Design — pending implementation plan

---

## 1. Intent

Transform `jakecastillo.github.io` from a long-scroll cinematic narrative (four Acts) into a **faux desktop operating system** that loads inside the visitor's browser. The desktop *is* the virtual business card: visually unmistakable in the first three seconds, immediately interactive, deep enough for engineers to poke at, shareable enough that a friend forwards the URL in Slack.

The boot loader, terminal, quantum-orb wallpaper, and magnetic dock that the site already ships are exactly the load-bearing pieces of an OS metaphor — this design integrates them into a coherent shell instead of treating them as scattered theatrical beats.

### Audience priorities

1. **Recruiters / hiring managers** — get the identity hit in <5 seconds without reading copy.
2. **Senior engineers** — poke at the terminal, palette, drag windows around, view source; the technical surface area is the flex.
3. **Friends** — forward a deep-link, screenshot the boot reveal, share a quote.
4. *(De-prioritized)* designers.

### Success criteria

- A visitor lands and within ~5 seconds sees a recognizable OS desktop with terminal already running.
- The terminal answers `whoami`, `ls`, `cd`, `cat`, `open <app>`, and shows résumé content interactively.
- ⌘K (or `/`) opens a Spotlight palette that searches apps, skills, and commands.
- Dragging a window past a screen edge snaps it. The dock shows running-app dots.
- Mobile visitors see a tab-bar shell with one app full-screen at a time — no broken desktop UI.
- A URL like `?open=terminal,career&focus=career` deep-links to that exact window state.
- Lighthouse perf score on desktop stays ≥ 85; bundle size does not regress vs. current `master`.

---

## 2. Non-goals (explicitly cut from v1)

- **Window resize handles.** Fixed default sizes per app; one maximize toggle.
- **Recruiter Mode toggle.** The desktop itself is the business card; a dedicated "resume view" adds modes without earning them.
- **Multi-desktop / virtual workspaces.**
- **Persistence across visits.** Windows always boot fresh.
- **Live GitHub commit sparkline.** Add later via a build-time JSON written by GH Actions — zero runtime API calls.
- **Now-playing / Spotify widget.**
- **Mini-games (Snake, Pong).** Easter-egg fodder for a future pass.
- **Light theme.**
- **Formal WCAG AA audit.** Baseline: semantic HTML, keyboard nav for palette, focus trap in palette, `prefers-reduced-motion` respect, `aria-label` on windows. Deeper audit deferred.

---

## 3. Stack & dependencies

### Kept (already shipping)

- Next.js 16 (App Router, `output: "export"`)
- React 19
- Tailwind v4
- framer-motion
- `@react-three/fiber` + `@react-three/drei` + `three` (wallpaper)
- `zustand` (state)
- `lucide-react` (icons)
- `typewriter-effect` (boot terminal; evaluate removal in Phase 3)

### Added

- **`cmdk`** (~5 kB gzipped) — Vercel's command-palette primitive for the Spotlight ⌘K UI.

### Removed

- **`lenis`** (~7 kB gzipped) — the desktop shell is a fixed-viewport surface with no page scroll, so smooth-scroll is no longer needed. Window content scrolls natively.
- **`next-sitemap`** stays; sitemap still useful for the static HTML SEO fallback.

### Net bundle change

Target: same or smaller than current `master`. `cmdk` add (≈5 kB) is more than offset by `lenis` removal (≈7 kB) and likely `typewriter-effect` removal in Phase 3.

### Static-export constraints honored

- No server-rendered data fetching.
- No API routes.
- No runtime secrets.
- URL query strings used for deep-linking — fully compatible with GitHub Pages static hosting.
- All "live" data (clock, uptime) computed client-side with native `Intl.DateTimeFormat`.

---

## 4. Architecture

### Four z-stacked layers

| z-index | Layer | Responsibility |
| --- | --- | --- |
| 0 | **Wallpaper** — `<Scene/>` (r3f canvas) | Quantum Orb always renders. Liquid Glass renders only when `(min-width: 768px) and (prefers-reduced-motion: no-preference)` and not flagged as low-power. |
| 10 | **Windows** — `<WindowFrame/>` | Each open app renders inside a `WindowFrame` with macOS-style chrome, framer-motion drag, snap-to-edge, focus glow. |
| 40 | **Chrome** — `<Menubar/>` (top), `<Dock/>` (bottom) | Menubar: `jake` lozenge + active app name + Honolulu clock + status glyphs. Dock: app launcher with running-dot indicators. |
| 60 | **Spotlight** — `<Palette/>` (cmdk) | ⌘K / Ctrl-K / `/` opens center-screen palette over a backdrop blur. Searches apps, skills, commands. |

### Single Zustand store — `useDesktopStore`

```ts
type AppId = "terminal" | "about" | "career" | "stack" | "contact";

type WindowState = {
  id: AppId;
  pos: { x: number; y: number };  // desktop shell only
  z: number;
  minimized: boolean;
  maximized: boolean;
};

type BootPhase = "loading" | "booting" | "reveal" | "ready";

type DesktopStore = {
  // window state
  windows: Partial<Record<AppId, WindowState>>;   // presence = open
  topZ: number;
  focusedId: AppId | null;

  // shell state
  paletteOpen: boolean;
  bootPhase: BootPhase;

  // actions
  open(id: AppId): void;          // also focuses
  close(id: AppId): void;
  focus(id: AppId): void;
  toggleMin(id: AppId): void;
  toggleMax(id: AppId): void;
  setPos(id: AppId, pos: { x: number; y: number }): void;
  setPalette(open: boolean): void;
  setBootPhase(p: BootPhase): void;
};
```

`useBootStore` stays as its own slice — it already owns the boot lifecycle and `QuantumLoader` reads from it. Extend its enum from the current two-state `isBootComplete` to a four-state machine: `loading → booting → reveal → ready`. The new `reveal` state is the morph phase between "boot logs finished" and "desktop fully interactive." `useDesktopStore` is the new store and owns only window + palette state; the two stores compose, neither replaces the other.

### URL sync (one-way write, two-way init)

A `useUrlSync` hook keeps the URL aligned with the store:

- **On mount:** read `?open=`, `?focus=`, `?skip=` and seed the store accordingly.
- **On store change:** debounce 200 ms, then `history.replaceState` with the new query string. Never `pushState` — desktop interactions should not pollute browser history.

URL contract:

- `?open=terminal,career` — comma-separated list of open apps. Unknown ids are silently dropped.
- `?focus=career` — which window is focused. If omitted, defaults to the last id in `?open=`. If specified but not in `?open=`, the window is opened too.
- `?skip=1` — bypass boot animation; jump directly to `reveal`.

---

## 5. App registry — `components/desktop/config/apps.ts`

Central registry: each app is one entry, no per-app routing or hidden coupling.

| id | name | icon | default size | opens at boot | source |
| --- | --- | --- | --- | --- | --- |
| `terminal` | Terminal | `Terminal` | 640×420 | ✅ yes | wraps existing `TerminalTyping.tsx` |
| `about` | About | `FileText` | 540×520 | no | content lifted from `ActPhilosophy.tsx` |
| `career` | Career | `Briefcase` | 720×500 | no | content lifted from `ActExperience.tsx` |
| `stack` | Stack | `Cpu` | 620×460 | no | content lifted from `ActSkills.tsx` |
| `contact` | Contact | `Mail` | 460×520 | no | content lifted from `ActContact.tsx` |

Apps are shell-agnostic React components: they render their own body and let the surrounding shell (`<WindowFrame>` on desktop, `<MobileScreen>` on phone) handle chrome.

Default open positions (desktop only) are computed at runtime to avoid stacking on top of each other — small offset cascade from a known origin, clamped to viewport.

### NowWidget (not an app)

A small strip pinned to the menubar's right side. Renders:

- Honolulu local time via `Intl.DateTimeFormat`, updates every 30 s.
- `● online` indicator (static green dot).
- `uptime 26y` (calculated from a static birth-year constant in `resume.ts`).

No external data fetches in v1.

---

## 6. Content reframing — Acts → Apps

| Was | Becomes | Visual change |
| --- | --- | --- |
| `ActPhilosophy` (3-slide horizontal scroll) | `AboutApp` (single document window) | Polished `about.md`: identity header + 3 stacked pillar cards. No scroll-jacking — tall window with native overflow. |
| `ActExperience` (horizontal timeline) | `CareerApp` (vertical card stack) | Four role cards top-to-bottom inside the window. Each: period chip, title, company, bullets. Click → expand inline. |
| `ActSkills` (full-page grid) | `StackApp` (tabbed pill grid) | Same skill groups (Languages, Frameworks, Cloud, Databases, Practices, Roles) as a 2-col grid; Certifications as a separate tab. |
| `ActContact` (full-bleed hero list) | `ContactApp` (vCard window) | Portrait thumb + name + role + 4 contact rows (email, github, linkedin, location) with copy buttons. `SECURE_CHANNEL_ESTABLISHED` tag stays as the window subtitle. |

`data/resume.ts` and `data/links.ts` remain the source of truth — no content migration; only presentation moves.

---

## 7. Mobile strategy

Below `768px`, the same `useDesktopStore` powers a different shell:

- **Wallpaper:** Quantum Orb renders. Liquid Glass is skipped (perf + battery).
- **Chrome:** minimal menubar at top (`< jake.os / <active app>` + time); tab-bar dock at bottom with 5 app icons.
- **Windows:** none. Tapping a dock icon sets `focusedId` and the corresponding `<MobileScreen>` slides in full-screen.
- **Terminal:** opens by default. Adds a horizontal scroll strip of quick-command chips (`help`, `ls`, `whoami`, `copy email`) above the input so visitors without a keyboard can still explore.
- **No drag, no z-index, no palette** (no keyboard surface to invoke it).

Shell selection:

```ts
const isDesktop = useMediaQuery("(min-width: 768px)");

return isDesktop ? <DesktopShell /> : <MobileShell />;
```

App components are shell-agnostic — only chrome differs.

---

## 8. Boot → Desktop transition

The signature reveal. Today's `QuantumLoader` fades out and the long-scroll page is revealed. New behavior: the boot terminal *becomes* the Terminal.app window, and the desktop chrome materializes around it. One continuous shot, no fade-cut.

### Timing

| t (s) | Event |
| --- | --- |
| 0.0 – 2.5 | Existing boot loader: systemd-style logs scroll. No change. |
| 2.5 – 3.5 | `$ login --user jake` types itself; `welcome back, jake_` printed. |
| 3.5 | `setBootPhase("reveal")`. |
| 3.5 – 4.3 | Boot terminal container (`layoutId="terminal-window"`) animates from fullscreen to target window rect (top-left, 640×420). Scanlines fade out. |
| 3.5 – 4.3 | `<Scene/>` opacity 0 → 1 (0.8 s). |
| 3.9 – 4.4 | `<Menubar/>` slides from `translateY(-100%)` to `0` (0.5 s ease-out). |
| 4.1 – 4.6 | `<Dock/>` fades + springs from `translateY(+100%)` to `0` (0.5 s). |
| 4.3 – 4.6 | Window chrome (titlebar dots, border) opacity 0 → 1. |
| 4.6 | `setBootPhase("ready")`; hotkeys + interactions enabled; NowWidget clock starts ticking. |

`framer-motion`'s `layoutId` shared between the boot terminal and the windowed Terminal.app does the morph — no new dep, no manual rect math.

### Fast path for repeat / deep-link visitors

`?skip=1` in the URL — or any non-empty `?open=` — skips the boot loader entirely and lands in `reveal` after 200 ms. Recruiters who get a shared deep-link get the desktop instantly.

---

## 9. Signature moments

| Moment | What happens | Audience |
| --- | --- | --- |
| **Boot → reveal** | Boot terminal shrinks into windowed Terminal.app; menubar/dock/wallpaper materialize around it. | Everyone — primary screenshot. |
| **⌘K Spotlight** | Center-screen palette over backdrop blur. Type to filter apps + commands + skills. Arrow keys + Enter. | Engineers. |
| **Snap-to-edge drag** | Drag past left/right edge → cyan flash → snaps to half. Top edge → maximize. Spring physics. | Engineers, friends. |
| **Terminal → window bridge** | `open about`, `open career`, `close career` in the terminal opens/closes that app's window. | Engineers. |
| **Dock magnetic + run dot** | Existing magnetic cursor stays. Open apps get a cyan dot below the icon. Click a running icon → focus that window. | Recruiters. |
| **Deep-link share** | `?open=terminal,career&focus=career` loads with exactly those windows open. | Friends, recruiters. |

---

## 10. Hotkeys

| Combo | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` / `/` | Open Spotlight palette |
| `Esc` | Close palette / dismiss focused window |
| `⌘W` / `Ctrl+W` | Close focused window |
| `⌘M` / `Ctrl+M` | Minimize focused window |
| `⌘1`–`⌘5` | Focus / open app at dock index |
| `Tab` (inside palette) | Cycle through results |
| `↑` / `↓` (in terminal) | Command history |

Handled by a single `useHotkeys` hook reading the store directly.

---

## 11. Performance & SEO

### Performance

- r3f canvas: `frameloop="demand"` whenever no user input or scroll for >2 s — pauses the render loop on idle.
- Liquid Glass conditionally mounted (desktop + non-reduced-motion).
- Window content lazy: app body components only mount when window is `open`.
- Boot terminal scrolls native (no virtualization needed at <100 log lines).
- Bundle: net target = ≤ current `master`. Verified with `next build` analyzer.

### SEO

The entire UI is a client-rendered canvas, so crawlers need a static HTML fallback. Approach:

- `app/page.tsx` renders a semantic HTML "résumé" version of the content (h1, sections, links) inside a wrapper using Tailwind's `sr-only` pattern — visually hidden but readable by crawlers and assistive tech.
- The interactive Desktop renders on top in a `<div aria-hidden="true">`.
- Search engines index the résumé; humans see jakeOS.
- `app/layout.tsx` metadata (OG title/description) stays as-is.

---

## 12. Build phases — 5 PRs into `jake-os`

Each PR is independently verifiable; the branch is shippable after Phase 3.

### Phase 1 — Foundation
- `store/useDesktopStore.ts` (zustand): types + actions.
- `hooks/useHotkeys.ts`: ⌘K, ⌘W, Esc, ⌘1–5.
- `hooks/useUrlSync.ts`: store ↔ `?open=`, `?focus=`, `?skip=`.
- Remove `lenis` dependency; delete `components/SmoothScroll.tsx`, `components/ScrollProgress.tsx`.

### Phase 2 — Window machinery
- `components/desktop/Desktop.tsx`: root container with wallpaper + chrome slots.
- `components/desktop/WindowFrame.tsx`: drag (framer-motion), focus glow, max/min/close, snap-to-edge.
- `components/desktop/Menubar.tsx`, `components/desktop/Dock.tsx`. Dock adapts current `components/Navigation.tsx` (kept magnetic effect).
- Extend `useBootStore` with `reveal` phase (keep as its own slice; do not fold into `useDesktopStore`).
- Wire the `framer-motion` `layoutId` morph between boot terminal and TerminalApp window.

### Phase 3 — Apps + content reframing
- `components/desktop/config/apps.ts` registry.
- `components/desktop/apps/TerminalApp.tsx` (wraps `TerminalTyping`; adds `open <app>` / `close <app>` commands).
- `components/desktop/apps/AboutApp.tsx`, `CareerApp.tsx`, `StackApp.tsx`, `ContactApp.tsx`.
- `components/desktop/NowWidget.tsx`.
- Delete `components/StageManager.tsx`, `components/HeaderTypewriter.tsx`, `components/Act*.tsx`.
- Replace `app/page.tsx` body to render `<Desktop/>` plus the SEO résumé fallback.

### Phase 4 — Palette + mobile
- `components/desktop/Palette.tsx` using `cmdk`: items = apps + commands + skills.
- `components/desktop/MobileShell.tsx`: full-screen single-app + tab-bar dock + quick-command chips.
- `useMediaQuery` breakpoint switch in `Desktop.tsx`.

### Phase 5 — Polish
- Snap-to-edge cyan flash, focus glow refinements, dock running-dot animation.
- `prefers-reduced-motion` and low-power-mode pruning (skip LiquidGlass, reduce orb pulse).
- Accessibility pass: `aria-label` on windows, focus trap in palette, Esc dismissal, focus restoration on close.
- Lighthouse + bundle audit; fix regressions.

---

## 13. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Mobile WebGL perf on low-end phones | LiquidGlass already conditional on `min-width:768`; orb-only on mobile; `frameloop="demand"` when no user input. |
| Bundle creep from new components | Drop `lenis` (~7 kB), possibly drop `typewriter-effect` if Phase 3 doesn't need it. Net target ≤ current. |
| Window drag conflicts with native touch scroll | Drag disabled in `MobileShell` entirely. On desktop, drag handle is the titlebar only; window content keeps native scroll. |
| Boot sequence feels too long for repeat visitors | `?skip=1` and any non-empty `?open=` short-circuits to `reveal`. |
| SEO — content is canvas / client-rendered | Off-screen semantic résumé HTML in `app/page.tsx` for crawlers. |
| `cmdk` styling drift from VOID & LASER palette | Override `cmdk` styles with Tailwind classes in `Palette.tsx`; treat the lib as headless. |
| Boot loader morph fails to register `layoutId` because two roots | Mount both boot terminal and TerminalApp under the same framer-motion `LayoutGroup` for the morph window. |

---

## 14. Open questions

These are not blockers; flag during implementation.

1. **Default open-window cascade origin** — top-left vs. center? Top-left mirrors macOS; center mirrors Linux DEs.
2. **Dock icon for Spotlight** — separate magnifying-glass icon, or invoked only via keyboard? Keyboard-only is cleaner; magnifier discoverable.
3. **`open <app>` aliases in terminal** — should `vim about.md` work too? Engineer-flex bonus; trivial to add.
4. **Konami code easter egg** — drop a hidden game window? Mark as v2 scope creep but worth a placeholder hook.

---

## 15. File layout — added / changed / removed

```
app/
  page.tsx                            CHANGED  — renders <Desktop/> + SEO résumé fallback
  layout.tsx                          CHANGED  — drop <Navigation/> + <SmoothScroll/>
  globals.css                         CHANGED  — desktop tokens, palette overrides

components/
  desktop/                            NEW
    Desktop.tsx                       NEW
    Menubar.tsx                       NEW
    Dock.tsx                          NEW (adapted from Navigation.tsx)
    WindowFrame.tsx                   NEW
    Palette.tsx                       NEW (cmdk)
    MobileShell.tsx                   NEW
    NowWidget.tsx                     NEW
    apps/
      TerminalApp.tsx                 NEW (wraps existing TerminalTyping)
      AboutApp.tsx                    NEW (content lifted from ActPhilosophy)
      CareerApp.tsx                   NEW (content lifted from ActExperience)
      StackApp.tsx                    NEW (content lifted from ActSkills)
      ContactApp.tsx                  NEW (content lifted from ActContact)
    config/
      apps.ts                         NEW

  QuantumLoader.tsx                   CHANGED  — emit "reveal" phase + layoutId
  TerminalTyping.tsx                  CHANGED  — accept embedded mode prop; expose runCommand
  Scene.tsx                           CHANGED  — opacity-driven fade in on "reveal"
  Navigation.tsx                      REMOVED  (replaced by Dock.tsx)
  StageManager.tsx                    REMOVED
  ScrollProgress.tsx                  REMOVED
  SmoothScroll.tsx                    REMOVED
  HeaderTypewriter.tsx                REMOVED
  ActPhilosophy.tsx                   REMOVED
  ActExperience.tsx                   REMOVED
  ActSkills.tsx                       REMOVED
  ActContact.tsx                      REMOVED

store/
  useDesktopStore.ts                  NEW
  useBootStore.ts                     CHANGED  — phase enum extended

hooks/
  useHotkeys.ts                       NEW
  useUrlSync.ts                       NEW
  useMediaQuery.ts                    NEW
  useScrollStore.ts                   REMOVED  (no page scroll in desktop shell)

data/
  resume.ts                           UNCHANGED
  links.ts                            UNCHANGED
  sections.ts                         CHANGED  — dock entries instead of nav sections

package.json
  + cmdk
  - lenis
  - (evaluate) typewriter-effect
```

---

## 16. Out of scope reminder

If during implementation a temptation arises to add window resize, a Recruiter Mode toggle, a Spotify widget, mini-games, or a light theme — those are explicit v2 scope. Add them in a follow-up branch; do not let them block `jake-os` shipping.
