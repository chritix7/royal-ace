"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "../lib/useBlackjack";

/**
 * Follow how PP / 21+3 side bets have been running in the current
 * session and produce a per-bet "heat" state so the UI can show a hot
 * (recent hits) or cold (long dry spell) marker next to each side bet.
 *
 * We watch for the phase→"settled" transition and record whether each
 * side bet was paid out (net > 0) in that round using `roundBreakdown`,
 * which carries the per-side net for the settled round. We also keep
 * a one-step-behind snapshot of the player's placed stakes
 * (ppBet / t3Bet) so skipped bets don't count toward the window — a
 * player who skips 21+3 for ten rounds shouldn't come back to a
 * "cold" sticker on it.
 *
 * Window: last 12 bet-placed rounds per bet type.
 * Hot:    2+ hits in the window.
 * Cold:   8+ bet-placed rounds with no hits.
 */

const WINDOW = 12;
const HOT_HITS = 2;
const COLD_MISSES = 8;

type Heat = { state: "hot" | "cold" | "neutral"; last: number };

export function useSideBetHeat(g: Game) {
  const prevPhaseRef = useRef<string>(g.s.phase);
  const prevHistoryLenRef = useRef<number>(g.s.history.length);
  // Snapshot the amounts the player staked on the LAST deal, because
  // once the round is settled those fields are back to 0.
  const lastPlacedRef = useRef<{ pp: number; t3: number }>({ pp: 0, t3: 0 });
  const ppHistoryRef = useRef<boolean[]>([]); // true = win
  const t3HistoryRef = useRef<boolean[]>([]);

  const [heat, setHeat] = useState<{ pp: Heat; t3: Heat }>({
    pp: { state: "neutral", last: 0 },
    t3: { state: "neutral", last: 0 },
  });

  function summarize(hist: boolean[]): Heat {
    if (!hist.length) return { state: "neutral", last: 0 };
    const hits = hist.filter((b) => b).length;
    let last = 0;
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i]) break;
      last++;
    }
    if (hits >= HOT_HITS) return { state: "hot", last };
    if (hist.length >= COLD_MISSES && hits === 0) return { state: "cold", last };
    return { state: "neutral", last };
  }

  // Catch the stake amounts the moment the dealing begins — that's the
  // last time ppBet/t3Bet reflect what the player committed.
  useEffect(() => {
    if (g.s.phase === "dealing") {
      lastPlacedRef.current = { pp: g.s.ppBet, t3: g.s.t3Bet };
    }
  }, [g.s.phase, g.s.ppBet, g.s.t3Bet]);

  useEffect(() => {
    const phase = g.s.phase;
    const prev = prevPhaseRef.current;
    if (phase === "settled" && prev !== "settled") {
      const breakdown = g.roundBreakdown;
      const placed = lastPlacedRef.current;

      if (placed.pp > 0) {
        ppHistoryRef.current = [
          ...ppHistoryRef.current,
          (breakdown?.perfectPairs ?? 0) > 0,
        ].slice(-WINDOW);
      }
      if (placed.t3 > 0) {
        t3HistoryRef.current = [
          ...t3HistoryRef.current,
          (breakdown?.twentyOnePlusThree ?? 0) > 0,
        ].slice(-WINDOW);
      }
      setHeat({
        pp: summarize(ppHistoryRef.current),
        t3: summarize(t3HistoryRef.current),
      });
    }
    prevPhaseRef.current = phase;
  }, [g.s.phase, g.roundBreakdown]);

  // Reset when the game history is cleared.
  useEffect(() => {
    if (g.s.history.length < prevHistoryLenRef.current) {
      ppHistoryRef.current = [];
      t3HistoryRef.current = [];
      lastPlacedRef.current = { pp: 0, t3: 0 };
      setHeat({
        pp: { state: "neutral", last: 0 },
        t3: { state: "neutral", last: 0 },
      });
    }
    prevHistoryLenRef.current = g.s.history.length;
  }, [g.s.history.length]);

  return heat;
}
