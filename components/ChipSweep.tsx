"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Game } from "../lib/useBlackjack";
import { sfx } from "../lib/sound";

/**
 * Chips crossing the felt when a round settles: on a winning round the
 * dealer pays out toward the player, on a losing one the bet is swept
 * up to the dealer. A push moves nothing. Purely decorative overlay —
 * absolutely positioned over the felt, so it never shifts the layout.
 *
 * Judged on the main hands (plus a Golden bonus); side bets settle at
 * the deal and already have their own win badge.
 */

const COLORS = ["bg-red-700", "bg-slate-800", "bg-emerald-700", "bg-amber-500", "bg-purple-800"];

type Burst = {
  id: number;
  dir: "win" | "loss";
  chips: { sx: number; ex: number; delay: number; color: string }[];
};

export default function ChipSweep({ g }: { g: Game }) {
  const [burst, setBurst] = useState<Burst | null>(null);
  const prevPhase = useRef(g.s.phase);
  const nextId = useRef(0);

  const phase = g.s.phase;
  const breakdown = g.roundBreakdown;
  const fallbackNet = g.s.net;
  const lastBet = g.s.lastBet;

  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = phase;
    if (phase !== "settled" || was === "settled") return;

    const main = breakdown
      ? breakdown.main + (breakdown.golden ?? 0)
      : (fallbackNet ?? 0);
    if (main === 0) return;

    const dir = main > 0 ? "win" : "loss";
    // More chips for a bigger win relative to the bet (blackjack,
    // doubles, several hands); a loss is always one tidy sweep.
    const count =
      dir === "win"
        ? Math.max(4, Math.min(10, 3 + Math.round((main / Math.max(10, lastBet)) * 2)))
        : 5;

    setBurst({
      id: nextId.current++,
      dir,
      chips: Array.from({ length: count }, (_, i) => ({
        sx: (Math.random() - 0.5) * 70,
        ex: (i - (count - 1) / 2) * 16 + (Math.random() - 0.5) * 8,
        delay: i * 55,
        color: COLORS[i % COLORS.length],
      })),
    });

    if (dir === "win") sfx.chipsIn(count);
    else sfx.chipsOut();
  }, [phase, breakdown, fallbackNet, lastBet]);

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(null), 1700);
    return () => window.clearTimeout(t);
  }, [burst]);

  if (!burst) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {burst.chips.map((chip, i) => (
        <span
          key={`${burst.id}-${i}`}
          className={`animate-chip-sweep absolute left-1/2 block h-5 w-5 rounded-full border-2 border-dashed border-white/75 shadow-[0_2px_4px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(0,0,0,0.25)] ${chip.color}`}
          style={
            {
              "--chip-from": burst.dir === "win" ? "20%" : "70%",
              "--chip-to": burst.dir === "win" ? "70%" : "14%",
              "--chip-sx": `${burst.dir === "win" ? chip.sx : chip.ex}px`,
              "--chip-ex": `${burst.dir === "win" ? chip.ex : chip.sx * 0.4}px`,
              animationDelay: `${chip.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
