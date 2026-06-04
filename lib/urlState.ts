import { APP_IDS, type AppId } from "@/store/useDesktopStore";

export interface UrlState {
  open: AppId[]; // store/insertion order
  minimized: AppId[]; // subset of open
  focus: AppId | null; // member of open, or null
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

/** Parse a query string into a normalized, validated UrlState. Never throws. */
export function decode(search: string): UrlState {
  const params = new URLSearchParams(search);
  const open = parseList(params.get("open"));
  const minimized = parseList(params.get("min")).filter((id) => open.includes(id));
  const f = (params.get("focus") ?? "").trim().toLowerCase();
  const focus = isAppId(f) && open.includes(f) ? f : null;
  return { open, minimized, focus };
}

/**
 * Serialize UrlState to a canonical query string (no leading "?"); "" when empty.
 * App ids are lowercase [a-z] only, so literal commas need no escaping — this
 * keeps URLs clean (open=terminal,about) rather than percent-encoded.
 */
export function encode(state: UrlState): string {
  if (state.open.length === 0) return "";
  const parts = [`open=${state.open.join(",")}`];
  const min = state.minimized.filter((id) => state.open.includes(id));
  if (min.length) parts.push(`min=${min.join(",")}`);
  if (state.focus && state.open.includes(state.focus)) parts.push(`focus=${state.focus}`);
  return parts.join("&");
}
