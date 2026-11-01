"use client";

/**
 * Vegas felt overlay — currently a no-op.
 *
 * Per Alex, the Vegas theme now matches the other three themes
 * exactly (just a different base-color gradient in game.ts), with no
 * overlay on top. Nothing to render here yet.
 *
 * Kept as a dedicated component so when we iterate again (shimmer,
 * emblems, gold accents, whatever lands in the final direction) the
 * content goes back here and Table / BlackjackImmersive don't need
 * to change.
 */

export default function VegasFeltOverlay() {
  return null;
}
