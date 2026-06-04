"use client";

import { useEffect } from "react";
import { useDesktopStore, type AppId } from "@/store/useDesktopStore";
import { useBootStore } from "@/store/useBootStore";
import { DESKTOP_MEDIA_QUERY } from "@/hooks/useMediaQuery";
import { decode, encode, type UrlState } from "@/lib/urlState";

// Default landing (no ?open= deep-link): the Readme manifest, focused — a
// recruiter-readable proof screen that sells in 10s (R4). Readme is the only
// default-open window so the first impression is one clean focal point; the
// metaphor reveals itself as the visitor explores the dock.
const DEFAULT_OPEN: AppId[] = ["readme"];
const DEFAULT_FOCUS: AppId = "readme";

// Mobile breakpoint mirrors Desktop.tsx's shell switch via the shared
// DESKTOP_MEDIA_QUERY constant. MobileShell is a single-view shell driven only
// by focusedId, so on mobile the user only ever perceives ONE app as "open" at
// a time — even though every nav tap / terminal chip calls open(), which
// accumulates a persistent window in the store map.
function isDesktopViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

// Collapse a full window state down to what the current viewport actually
// presents as open. On desktop every window is a real, visible WindowFrame, so
// the URL mirrors the whole set. On mobile only the focused app is on screen, so
// the canonical URL reflects that single app — this stops chips/nav from piling
// invisible windows into ?open= (which would otherwise re-materialize on a
// resize-to-desktop or when the URL is shared/bookmarked).
function perceivedState(state: UrlState): UrlState {
  if (isDesktopViewport()) return state;
  if (!state.focus) return { open: [], minimized: [], focus: null };
  return { open: [state.focus], minimized: [], focus: state.focus };
}

function currentQuery(): string {
  return window.location.search ? window.location.search : window.location.pathname;
}

function writeUrl(state: UrlState): void {
  const next = encode(perceivedState(state));
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
        : { open: [...DEFAULT_OPEN], minimized: [], focus: DEFAULT_FOCUS };

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
