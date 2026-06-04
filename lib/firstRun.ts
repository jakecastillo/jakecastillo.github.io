/**
 * Tiny SSR-safe localStorage helpers for "first run" gating.
 *
 * Under output:"export" the HTML is generated at build time, so any read of
 * browser-only state (localStorage) must happen AFTER mount (in useEffect) to
 * avoid a hydration mismatch. These helpers also guard `typeof window` so they
 * are safe to import from anywhere, including server-rendered code paths.
 */

/**
 * Reads a localStorage flag. Returns `false` on the server, when the key is
 * absent, or when storage access throws (private mode / blocked cookies).
 */
export function getFlag(key: string): boolean {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
}

/**
 * Persists a localStorage flag. No-op on the server or when storage throws.
 */
export function setFlag(key: string, value: boolean): void {
    if (typeof window === "undefined") return;
    try {
        if (value) {
            window.localStorage.setItem(key, "1");
        } else {
            window.localStorage.removeItem(key);
        }
    } catch {
        // Ignore — storage may be unavailable (private mode / blocked cookies).
    }
}

/** Canonical flag key: set once the Spotlight hint chip has been seen. */
export const SPOTLIGHT_HINT_SEEN = "jakeos:spotlight-hint-seen";
