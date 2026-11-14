"use client";

import type { Game } from "../lib/useBlackjack";
import { money } from "../lib/game";

/**
 * Golden Round banner. The round itself is decided and paid by the
 * game hook (`g.golden`, rolled when the hand is dealt: 1 hand in 15,
 * and every hand during a mirror minute such as 11:11); a winning
 * golden hand pays +10% on the main hands' profit, and that bonus is
 * part of the round's net (`roundBreakdown.golden`). This component
 * only displays it, from the deal until the table returns to betting.
 */
export default function LuckyRound({ g }: { g: Game }) {
  if (!g.golden || g.s.phase === "betting") return null;

  const bonus = g.roundBreakdown?.golden ?? 0;
  const paid = g.s.phase === "settled" && bonus > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 animate-insurance-slide-in whitespace-nowrap"
    >
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_6px_20px_rgba(229,199,121,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-sm sm:text-[11px] ${
          paid
            ? "border-[#d7b45b] bg-gradient-to-b from-[#f5d778] to-[#c89a3f] text-[#10130e]"
            : "border-[#d7b45b]/70 bg-gradient-to-b from-[#d7b45b]/30 to-[#d7b45b]/10 text-[#f5d778]"
        }`}
      >
        <span aria-hidden className="text-[12px]">★</span>
        <span>
          {paid
            ? `Golden win · +◈ ${money(bonus)}`
            : g.s.phase === "settled"
              ? "Golden Round"
              : "Golden Round · +10% on a win"}
        </span>
        <span aria-hidden className="text-[12px]">★</span>
      </div>
    </div>
  );
}
