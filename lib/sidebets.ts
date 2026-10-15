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