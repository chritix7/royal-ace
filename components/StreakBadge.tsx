"use client";

import type { S } from "../lib/game";

/**
 * Current win/loss streak read from the live round history. Renders
 * nothing until the player has chained at least 2 same-sign rounds —
 * below that the table stays uncluttered. Pushes don't form a streak.
 *
 *  - 🔥 N  → N consecutive wins (gold pill, soft gold halo)
 *  - ❄ N  → N consecutive losses (muted red pill)
 */
function computeStreak(history: S["history"]): {
  kind: "win" | "loss";
  count: number;
} | null {
  if (!history.length) return null;
  // The history is stored latest-first — item 0 is the most recent.
  const first = history[0];
  if (first.net === 0) return null; // Push breaks any streak.

  const sign = first.net > 0 ? 1 : -1;
  let count = 0;
  for (const round of history) {
    const rs = round.net > 0 ? 1 : round.net < 0 ? -1 : 0;
    if (rs !== sign) break;
    count++;
  }
  if (count < 2) return null;
  return { kind: sign > 0 ? "win" : "loss", count };
}

export default function StreakBadge({
  history,
  className = "",
}: {
  history: S["history"];
  className?: string;
}) {
  const streak = computeStreak(history);
  if (!streak) return null;

  const isWin = streak.kind === "win";
  // Over 5 in a row = extra heat. Small visual kick.
  const blazing = isWin && streak.count >= 5;

  return (
    <div
      role="status"
      aria-label={`${isWin ? "Win" : "Loss"} streak: ${streak.count}`}
      className={`pointer-events-none inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm sm:text-[11px] ${
        isWin
          ? "border-[#d7b45b]/70 bg-gradient-to-b from-[#d7b45b]/30 to-[#d7b45b]/[0.08] text-[#f5d778]"
          : "border-red-400/40 bg-red-500/15 text-red-200"
      } ${blazing ? "animate-insurance-ace" : ""} ${className}`}
      style={
        isWin
          ? {
              boxShadow:
                "0 0 14px rgba(229,199,121,0.35), inset 0 1px 0 rgba(229,199,121,0.15)",
            }
          : undefined
      }
    >
      <span aria-hidden className="text-[11px] leading-none">
        {isWin ? "🔥" : "❄"}
      </span>
      <span className="tabular-nums">{streak.count}</span>
      <span className="hidden text-[9px] font-black tracking-widest text-current/70 sm:inline">
        {isWin ? "STREAK" : "COLD"}
      </span>
    </div>
  );
}
