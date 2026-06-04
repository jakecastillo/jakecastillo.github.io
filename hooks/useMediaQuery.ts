"use client";

import { useEffect, useState } from "react";

// Single source of truth for the "is this a desktop layout?" breakpoint.
// Width AND height are checked so landscape phones (e.g. 844×390) stay on the
// mobile shell instead of getting the full windowed desktop. Consumed by
// Desktop.tsx (shell switch), Scene.tsx (3D wallpaper gate), and useUrlSync.ts
// (URL mirroring) so the three never drift apart.
export const DESKTOP_MEDIA_QUERY = "(min-width: 768px) and (min-height: 600px)";

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia(query);
        const update = () => setMatches(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, [query]);

    return matches;
}
