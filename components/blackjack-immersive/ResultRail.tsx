"use client";

import { MIN_BET, money } from "../../lib/game";
import type { Game } from "../../lib/useBlackjack";
import { control, gold, signed } from "./styles";

export default function ResultRail({
  g,
  onNewRound,
}: {
  g: Game;
  onNewRound: () => void;
}) {
  const { s, roundBreakdown, canBet, stake, outOfChips } = g;
  const showResult = s.phase === "settled" && roundBreakdown;

  const canStartRound =
    canBet && !outOfChips && s.bet >= MIN_BET && stake <= s.balance;

  return (
    <aside
      className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 md:block"
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
            className="animate-pop w-64 overflow-hidden rounded-3xl border border-[#d7b45b]/45 bg-gradient-to-b from-[#101713]/95 to-[#0a100c]/95 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <div className="border-b border-[#d7b45b]/20 bg-[#d7b45b]/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e5c779]">
                Round result
              </p>

              <p
                className={`mt-1 text-3xl font-black tabular-nums ${
                  roundBreakdown.total > 0
                    ? "text-[#f5d778]"
                    : roundBreakdown.total < 0
                    ? "text-red-300"
                    : "text-white/70"
                }`}
              >
                {signed(roundBreakdown.total)}
              </p>
            </div>

            <dl className="space-y-2 px-4 py-3 text-[11px]">
              {[
                ["Main hands", roundBreakdown.main],
                ["Insurance", roundBreakdown.insurance],
                ["Perfect Pairs", roundBreakdown.perfectPairs],
                ["21+3", roundBreakdown.twentyOnePlusThree],
              ].map(([label, value]) => (
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

              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                <dt className="text-xs font-bold text-white">Total</dt>
                <dd
                  className={`text-sm font-black tabular-nums ${
                    roundBreakdown.total > 0
                      ? "text-[#f5d778]"
                      : roundBreakdown.total < 0
                      ? "text-red-300"
                      : "text-white/70"
                  }`}
                >
                  {signed(roundBreakdown.total)}
                </dd>
              </div>
            </dl>

            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={onNewRound}
                disabled={!canStartRound}
                className={`${control} ${gold} h-9 w-full text-[11px] uppercase tracking-wider`}
              >
                New round · ◈ {money(stake)}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-full border border-[#d7b45b]/30 bg-black/60 px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c779]/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e5c779]" />
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
              Hand in progress
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
