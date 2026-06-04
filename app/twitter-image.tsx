/*
 * Twitter / X large-summary card.
 *
 * Identical art direction to the Open Graph card, so re-export the same
 * build-time image route (default function + size/alt/contentType metadata).
 * Pairs with twitter:card="summary_large_image" set in app/layout.tsx by the
 * identity-consumers agent.
 */
export { default, alt, size, contentType } from "./opengraph-image";
export const dynamic = "force-static"; // required for next/og under output:"export"; must be declared, not re-exported
