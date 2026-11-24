"use client";

import { useRef } from "react";
import ChipButton from "./ChipButton";
import { CHIPS } from "../lib/game";

/**
 * Horizontal chip selector. `visibleCount` chips fit the width; the rest
 * are a finger swipe away (phones), or behind the ◂ ▸ arrows on a
 * computer with a mouse. The edges fade to show there is more.
 *
 *  - `visibleCount = 3` → sidebar (classic view)
 *  - `visibleCount = 5` → immersive bet area
 */
export default function ChipRail({
  visibleCount,
  onPick,
  disabledFor,
  size = "md",
  tight = false,
}: {
  visibleCount: number;
  onPick: (value: number) => void;
  disabledFor: (value: number) => boolean;
  size?: "xs" | "sm" | "md";
  /** Phones: slimmer gaps so 4 chips fit a narrow column. */
  tight?: boolean;
}) {
  const row = useRef<HTMLDivElement>(null);
  const step = (dir: number) => {
    const el = row.current;
    if (el) el.scrollBy({ left: (dir * el.clientWidth) / visibleCount, behavior: "smooth" });
  };
  const arrowClass = `chip-rail-arrow ${tight ? "h-8 w-5" : "h-9 w-7"} shrink-0 items-center justify-center rounded-full border border-[#d7b45b]/25 bg-gradient-to-b from-[#1a2219] to-[#0e1310] text-[11px] font-black text-[#e5c779] outline-none transition hover:border-[#d7b45b]/70 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#e5c779]`;

  return (
    <div className={`flex items-center ${tight ? "gap-1" : "gap-1.5"}`}>
      <button type="button" onClick={() => step(-1)} aria-label="Previous denominations" className={arrowClass}>
        ◂
      </button>
      <div ref={row} className="chip-rail min-w-0 flex-1" role="group" aria-label="Chip denominations">
        {CHIPS.map((v) => (
          <span key={v} className="chip-rail__cell" style={{ flexBasis: `${100 / visibleCount}%` }}>
            <ChipButton value={v} size={size} disabled={disabledFor(v)} onClick={() => onPick(v)} />
          </span>
        ))}
      </div>
      <button type="button" onClick={() => step(1)} aria-label="More denominations" className={arrowClass}>
        ▸
      </button>
    </div>
  );
}
