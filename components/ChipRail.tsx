"use client";

import { useState } from "react";
import ChipButton from "./ChipButton";
import { CHIPS } from "../lib/game";


/**
 * Horizontal, scrollable chip selector. Shows `visibleCount` chip
 * denominations at a time, with a gold-tinted ◂ arrow on the left and
 * ▸ arrow on the right. Each arrow slides the visible window by one
 * chip so the player can scan the whole ladder (10 → 50,000) without
 * the row overflowing the sidebar (or the immersive bet area).
 *
 *  - `visibleCount = 3` → sidebar (classic view)
 *  - `visibleCount = 5` → immersive bet area
 *
 * The `size` is forwarded to ChipButton: "md" (h-11) for the sidebar,
 * "sm" (h-9) for the immersive strip.
 */
export default function ChipRail({
  visibleCount,
  onPick,
  disabledFor,
  size = "md",
}: {
  visibleCount: number;
  onPick: (value: number) => void;
  disabledFor: (value: number) => boolean;
  size?: "sm" | "md";
}) {
  const [start, setStart] = useState(0);
  const maxStart = Math.max(0, CHIPS.length - visibleCount);
  const atStart = start <= 0;
  const atEnd = start >= maxStart;
  const slice = CHIPS.slice(start, start + visibleCount);

  // Shared premium arrow pill — gradient glass body, inset top
  // highlight, gold hover + press-down 1px. Disabled state dims.
  const arrowClass =
    "flex h-9 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7b45b]/25 bg-gradient-to-b from-[#1a2219] to-[#0e1310] text-[11px] font-black text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.12),0_1px_0_rgba(0,0,0,0.5)] outline-none transition-[filter,transform,border-color] hover:border-[#d7b45b]/70 hover:brightness-110 enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-25";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setStart(Math.max(0, start - 1))}
        disabled={atStart}
        aria-label="Previous denominations"
        className={arrowClass}
      >
        ◂
      </button>

      <div
        className="grid flex-1 place-items-center gap-1"
        role="group"
        aria-label="Chip denominations"
        style={{ gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))` }}
      >
        {slice.map((v) => (
          <ChipButton
            key={v}
            value={v}
            size={size}
            disabled={disabledFor(v)}
            onClick={() => onPick(v)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setStart(Math.min(maxStart, start + 1))}
        disabled={atEnd}
        aria-label="More denominations"
        className={arrowClass}
      >
        ▸
      </button>
    </div>
  );
}
