"use client";

import type { S } from "../lib/game";

/**
 * Horizontal ribbon of the last ~10 rounds, rendered as tiny
 * colour-coded dots. Lets the player feel the rhythm of the shoe at
 * a glance without opening Stats. Hidden entirely until at least one
 * round has been settled, so the empty state never clutters the felt.
 *
 *  - gold (filled + halo) → blackjack win
 *  - green                → regular win
 *  - red                  → loss
 *  - neutral              → push
 */
function colorFor(round: { net: number; bj: boolean }): {
  bg: string;
  ring: string;
  label: string;
} {
  if (round.bj) {
    return {
      bg: "bg-gradient-to-br from-[#f5d778] to-[#c89a3f]",
      ring: "ring-[#d7b45b]/60",
      label: "Blackjack",
    };
  }
  if (round.net > 0) {
    return {
      bg: "bg-emerald-500/80",
      ring: "ring-emerald-400/40",
      label: "Win",
    };
  }
  if (round.net < 0) {
    return {
      bg: "bg-red-500/70",
      ring: "ring-red-400/40",
      label: "Loss",
    };
  }
  return { bg: "bg-white/40", ring: "ring-white/20", label: "Push" };
}

export default function HistoryRibbon({
  history,
  max = 10,
  className = "",
}: {
  history: S["history"];
  max?: number;
  className?: string;
}) {
  if (!history.length) return null;
  // The game appends each settled round to the END of history, so
  // `slice(-max)` already gives us the last N rounds in chronological
  // order (oldest → latest, left → right on the ribbon — the way
  // scoreboards read).
  const recent = history.slice(-max);

  return (
    <div
      aria-label="Last rounds"
      className={`pointer-events-none inline-flex items-center gap-1 rounded-full border border-[#d7b45b]/25 bg-gradient-to-b from-[#1a1612]/85 to-[#0a0806]/85 px-2 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(229,199,121,0.1)] backdrop-blur-sm ${className}`}
    >
      <span className="hidden text-[8px] font-black uppercase tracking-widest text-[#d7b45b]/70 sm:inline">
        Last
      </span>
      {recent.map((round, i) => {
        const { bg, ring, label } = colorFor(round);
        // Latest sits on the right — mark it with a soft ring pulse
        // so the eye lands there first.
        const isLatest = i === recent.length - 1;
        return (
          <span
            key={`${i}-${round.net}-${round.bj ? "b" : "r"}`}
            role="img"
            aria-label={`${label} ${round.net > 0 ? "+" : ""}${round.net}`}
            className={`block h-2 w-2 rounded-full ${bg} ${
              isLatest ? `ring-2 ${ring}` : ""
            } ${round.bj ? "shadow-[0_0_6px_rgba(229,199,121,0.6)]" : ""}`}
          />
        );
      })}
    </div>
  );
}
