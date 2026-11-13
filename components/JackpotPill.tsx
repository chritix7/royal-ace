"use client";

import { useEffect, useRef, useState } from "react";
import { useBjJackpot } from "../lib/bjJackpot";
import { money } from "../lib/game";

/**
 * Display-only pill for the progressive side-bet jackpot. Pulses a
 * subtle highlight whenever the pot ticks up, so the player feels the
 * contribution without needing to watch the number.
 *
 * The pot itself lives in `lib/jackpot.ts` — the blackjack hook pokes
 * `contribute()` from the deal path and `payout()` on a jackpot win.
 */
export default function JackpotPill({ className = "" }: { className?: string }) {
  const pot = useBjJackpot();
  const prevRef = useRef(pot);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (pot !== prevRef.current) {
      setBump(true);
      prevRef.current = pot;
      const tid = window.setTimeout(() => setBump(false), 650);
      return () => window.clearTimeout(tid);
    }
  }, [pot]);

  return (
    <div
      aria-label={`Progressive jackpot ◈ ${money(pot)}`}
      title="Progressive side-bet jackpot — contributes to Royal Ace's shared pool"
      className={`pointer-events-none inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm transition-[transform,box-shadow,border-color,color] duration-300 sm:text-[11px] ${
        bump
          ? "scale-[1.04] border-[#d7b45b] bg-gradient-to-b from-[#f5d778]/40 to-[#d7b45b]/20 text-[#f5d778] shadow-[0_0_16px_rgba(229,199,121,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
          : "border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1612]/85 to-[#0a0806]/85 text-[#e5c779] shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(229,199,121,0.12)]"
      } ${className}`}
    >
      <span aria-hidden className="text-[10px] leading-none text-[#d7b45b]">
        ♦
      </span>
      <span className="font-black tracking-widest">Jackpot</span>
      <span className="tabular-nums text-[#f5d778]">◈ {money(pot)}</span>
    </div>
  );
}
