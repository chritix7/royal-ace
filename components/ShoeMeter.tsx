"use client";

import type { Game } from "../lib/useBlackjack";

/**
 * Shoe meter on the felt: cards left, a thin gold gauge, and the cut
 * card. A red tick on the gauge marks where the cut card sits; once
 * the shoe runs past it the pill switches to "Last hand" — the shoe
 * is shuffled before the next deal, as a dealer would announce.
 */
export default function ShoeMeter({ g, className = "" }: { g: Game; className?: string }) {
  const { s, totalCards, shoePct, cutPct, cutCardOut } = g;

  return (
    <div
      role="status"
      aria-label={
        cutCardOut
          ? "Cut card out: last hand before the shuffle"
          : `Shoe: ${s.shoe.length || totalCards} cards left`
      }
      className={`pointer-events-none flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors duration-500 sm:text-[11px] ${
        cutCardOut
          ? "border-[#e0a35b]/60 bg-[#2a1808]/70 text-[#f5c98a]"
          : "border-[#d7b45b]/30 bg-black/55 text-[#e5c779]"
      } ${className}`}
    >
      <span
        className={`uppercase tracking-[0.18em] ${
          cutCardOut ? "text-[#f5c98a]" : "text-[#d7b45b]/80"
        }`}
      >
        {cutCardOut ? "Last hand" : "Shoe"}
      </span>
      <span className="tabular-nums text-white/90">
        {s.shoe.length || totalCards}
      </span>
      <span
        aria-hidden
        className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/10 sm:w-14"
      >
        <span
          className={`block h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ${
            cutCardOut
              ? "from-[#e0a35b]/50 to-[#e0a35b]"
              : "from-[#d7b45b]/40 to-[#d7b45b]"
          }`}
          style={{ width: `${shoePct}%` }}
        />
        {/* The cut card */}
        <span
          className="absolute inset-y-0 w-[2px] bg-[#e2574c]"
          style={{ left: `${cutPct}%` }}
        />
      </span>
    </div>
  );
}
