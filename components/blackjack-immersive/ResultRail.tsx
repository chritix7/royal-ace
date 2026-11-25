"use client";

import type { Game } from "../../lib/useBlackjack";
import { signed } from "./styles";
import CountUp from "../CountUp";

export default function ResultRail({
  g,
  onNewRound,
}: {
  g: Game;
  onNewRound: () => void;
}) {
  // The next round starts from the console (Deal again): this panel only reads the result.
  void onNewRound;
  const { s, roundBreakdown } = g;
  const showResult = s.phase === "settled" && roundBreakdown;

  return (
    <aside
      className="absolute left-4 top-[calc(50%+14px)] z-30 hidden -translate-y-1/2 md:block"
      aria-live="polite"
    >
      <div
        className={`origin-left transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showResult
            ? "scale-100 opacity-100"
            : "scale-[0.94] opacity-95"
        }`}
      >
        {showResult ? (
          <div
            key={`result-${s.net}-${roundBreakdown.total}`}
            className="blur-in w-56 overflow-hidden rounded-2xl border border-[#d7b45b]/45 bg-gradient-to-b from-[#101713]/95 to-[#0a100c]/95 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <div className="border-b border-[#d7b45b]/20 bg-[#d7b45b]/10 px-3.5 py-2.5">
              {/* The dealer's call for the round ("Dealer busts", "Push"…). */}
              <p className="font-display text-[10px] font-black uppercase leading-snug tracking-[0.16em] text-[#e5c779]">
                {s.message}
              </p>

              <p
                className={`mt-0.5 text-2xl font-black leading-tight tabular-nums ${
                  roundBreakdown.total > 0
                    ? "text-[#f5d778]"
                    : roundBreakdown.total < 0
                    ? "text-red-300"
                    : "text-white/70"
                }`}
              >
                <CountUp value={roundBreakdown.total} format={signed} />
              </p>
            </div>

            {/* Only the lines that moved chips this round: the main
                hands always, the rest when they are not zero. The
                total is the big figure above, so it isn't repeated. */}
            <dl className="space-y-1.5 px-3.5 py-2.5 text-[11px]">
              {[
                ["Main hands", roundBreakdown.main],
                ["Insurance", roundBreakdown.insurance],
                ["Perfect Pairs", roundBreakdown.perfectPairs],
                ["21+3", roundBreakdown.twentyOnePlusThree],
                ["★ Golden bonus", roundBreakdown.golden ?? 0],
              ]
                .filter(([, value], i) => i === 0 || value !== 0)
                .map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-3"
                >
                  <dt className="text-white/50">{label}</dt>
                  <dd className="font-semibold tabular-nums text-white/85">
                    {signed(Number(value))}
                  </dd>
                </div>
              ))}
            </dl>

          </div>
        ) : null}
      </div>
    </aside>
  );
}
