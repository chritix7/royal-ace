"use client";

import type { S } from "../lib/game";

/**
 * Current win/loss streak read from the live round history. Renders
 * nothing until the player has chained at least 2 same-sign rounds —
 * below that the table stays uncluttered. A push neither extends nor
 * breaks a streak, matching the game's own streak counter.
 *
 *  - 🔥 N  → N consecutive wins (gold pill, soft gold halo)
 *  - ❄ N  → N consecutive losses (muted red pill)
 */
function computeStreak(
  wins: number,
  history: S["history"],
): {
  kind: "win" | "loss";
  count: number;
} | null {
  // Wins come straight from the game's own counter (`s.streak`), so
  // the badge always agrees with the "streak" achievement and the
  // records: a push neither extends nor breaks the run, and the count
  // isn't capped by the length of the history buffer.
  if (wins >= 2) return { kind: "win", count: wins };
  if (wins > 0) return null;

  // Losses: walk back from the latest round (history is oldest-first),
  // skipping pushes the same way the win counter does.
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const net = history[i].net;
    if (net > 0) break;
    if (net < 0) count++;
  }
  return count >= 2 ? { kind: "loss", count } : null;
}

export default function StreakBadge({
  wins,
  history,
  className = "",
}: {
  /** Current win streak from the game state (`s.streak`). */
  wins: number;
  history: S["history"];
  className?: string;
}) {
  const streak = computeStreak(wins, history);
  if (!streak) return null;

  const isWin = streak.kind === "win";
  // Over 5 in a row = extra heat. Small visual kick.
  const blazing = isWin && streak.count >= 5;

  return (
    <div
      role="status"
      aria-label={`${isWin ? "Win" : "Loss"} streak: ${streak.count}`}
      className={`pointer-events-none items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm sm:text-[11px] ${
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
