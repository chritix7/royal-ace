"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "../lib/useBlackjack";

/**
 * Follow how PP / 21+3 side bets have been running in the current
 * session and produce a per-bet "heat" state so the UI can show a hot
 * (recent hits) or cold (long dry spell) marker next to each side bet.
 *
 * We watch for the phase→"settled" transition and record whether each
 * side bet was paid out (net > 0) in that round. Only rounds where the
 * bet was actually placed count toward the history — a player who skips
 * 21+3 for ten rounds shouldn't come back to a "cold" sticker on it.
 *
 * Returns a `heat` object:
 *   - state: "hot" | "cold" | "neutral"
 *   - last:  how many rounds since the bet last hit (within the window)
 *
 * Window: last 12 bet-placed rounds per bet type.
 */

const WINDOW = 12;
const HOT_HITS = 2; // 2+ hits in the window → hot
const COLD_MISSES = 8; // 8+ bet-placed rounds with no hits → cold

type Heat = { state: "hot" | "cold" | "neutral"; last: number };

export function useSideBetHeat(g: Game) {
  const prevPhaseRef = useRef<string>(g.s.phase);
  const prevHistoryLenRef = useRef<number>(g.s.history.length);
  const ppHistoryRef = useRef<boolean[]>([]); // true = win
  const t3HistoryRef = useRef<boolean[]>([]);

  const [heat, setHeat] = useState<{ pp: Heat; t3: Heat }>({
    pp: { state: "neutral", last: 0 },
    t3: { state: "neutral", last: 0 },
  });

  function summarize(hist: boolean[]): Heat {
    if (!hist.length) return { state: "neutral", last: 0 };
    const hits = hist.filter((b) => b).length;
    // "Last" = rounds since last hit, counting from the most recent
    // bet-placed entry (end of array).
    let last = 0;
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i]) break;
      last++;
    }
    if (hits >= HOT_HITS) return { state: "hot", last };
    if (hist.length >= COLD_MISSES && hits === 0) return { state: "cold", last };
    return { state: "neutral", last };
  }

  useEffect(() => {
    const phase = g.s.phase;
    const prev = prevPhaseRef.current;
    if (phase === "settled" && prev !== "settled") {
      // The round just closed — snapshot each side bet's outcome, but
      // only when the bet was actually placed this round. We look at
      // the game's roundSides (net payout) because the bet amount was
      // already consumed at deal time.
      const placedPP = (g.sides?.perfectPairs !== undefined) && (g.sides.wagered > 0 || g.s.ppBet > 0);
      const placedT3 = (g.sides?.twentyOnePlusThree !== undefined) && (g.sides.wagered > 0 || g.s.t3Bet > 0);
      // We approximate "placed" by checking the game's ppBet/t3Bet at
      // settle — the deal flow moves them onto `wagered` first, so they
      // may be 0 here. Use `g.sides.wagered` to detect.
      const ppPlaced = (g.sides?.wagered ?? 0) > 0 && g.s.ppBet === 0 ? true : g.s.ppBet > 0;
      const t3Placed = (g.sides?.wagered ?? 0) > 0 && g.s.t3Bet === 0 ? true : g.s.t3Bet > 0;

      if (ppPlaced) {
        ppHistoryRef.current = [
          ...ppHistoryRef.current,
          (g.sides?.perfectPairs ?? 0) > 0,
        ].slice(-WINDOW);
      }
      if (t3Placed) {
        t3HistoryRef.current = [
          ...t3HistoryRef.current,
          (g.sides?.twentyOnePlusThree ?? 0) > 0,
        ].slice(-WINDOW);
      }
      setHeat({
        pp: summarize(ppHistoryRef.current),
        t3: summarize(t3HistoryRef.current),
      });
    }
    prevPhaseRef.current = phase;
  }, [g.s.phase, g.sides, g.s.ppBet, g.s.t3Bet]);

  // Reset when the game history is cleared.
  useEffect(() => {
    if (g.s.history.length < prevHistoryLenRef.current) {
      ppHistoryRef.current = [];
      t3HistoryRef.current = [];
      setHeat({
        pp: { state: "neutral", last: 0 },
        t3: { state: "neutral", last: 0 },
      });
    }
    prevHistoryLenRef.current = g.s.history.length;
  }, [g.s.history.length]);

  return heat;
}
