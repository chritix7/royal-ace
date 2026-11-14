import type { Card } from "./blackjack";

export type SideWin = { label: string; odds: number } | null;

const ORDER = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const idx = (c: Card) => ORDER.indexOf(c.rank) + 1;
const isRed = (c: Card) => c.suit === "♥" || c.suit === "♦";

/** Perfect Pairs : tes 2 premières cartes forment une paire. */
export function perfectPairs(a: Card, b: Card): SideWin {
  if (a.rank !== b.rank) return null;
  if (a.suit === b.suit) return { label: "Perfect pair", odds: 25 };
  if (isRed(a) === isRed(b)) return { label: "Colored pair", odds: 12 };
  return { label: "Mixed pair", odds: 5 };
}

/** 21+3 : tes 2 cartes + la carte visible du croupier (poker à 3 cartes). */
export function twentyOnePlusThree(a: Card, b: Card, c: Card): SideWin {
  const cards = [a, b, c];
  const flush = cards.every((x) => x.suit === a.suit);
  const trips = cards.every((x) => x.rank === a.rank);
  const v = cards.map(idx).sort((x, y) => x - y);
  const straight =
    (v[1] === v[0] + 1 && v[2] === v[1] + 1) || (v[0] === 1 && v[1] === 12 && v[2] === 13);
  if (trips && flush) return { label: "Suited trips", odds: 100 };
  if (straight && flush) return { label: "Straight flush", odds: 40 };
  if (trips) return { label: "Three of a kind", odds: 30 };
  if (straight) return { label: "Straight", odds: 10 };
  if (flush) return { label: "Flush", odds: 5 };
  return null;
}

export type SideHeat = "hot" | "cold" | "neutral";

/**
 * Heat of a side bet from its recent placed rounds (true = it paid):
 * hot after 2+ hits, cold after 8+ rounds without a single hit.
 */
export function heatOf(hist: boolean[]): SideHeat {
  const hits = hist.filter(Boolean).length;
  if (hits >= 2) return "hot";
  if (hist.length >= 8 && hits === 0) return "cold";
  return "neutral";
}

/**
 * Share of the progressive pot a Suited Trips wins, by 21+3 stake:
 * 10% at the smallest stakes, the whole pot from a 250 stake.
 */
export function jackpotShare(t3Bet: number): number {
  return Math.max(0.1, Math.min(1, t3Bet / 250));
}
