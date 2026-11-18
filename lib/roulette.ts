/**
 * European roulette (single zero) — wheel, bets and payouts.
 *
 * A bet is identified by a string key; `coverage(key)` gives the numbers
 * it covers and every payout follows the classic rule 36 / n − 1
 * (straight 35:1, split 17:1, street 11:1, corner 8:1, six line 5:1,
 * dozens / columns 2:1, even chances 1:1). On zero, outside bets lose.
 */

/** Pocket order on a European wheel, clockwise from zero. */
export const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
] as const;

export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type Color = "red" | "black" | "green";
export const colorOf = (n: number): Color => (n === 0 ? "green" : RED.has(n) ? "red" : "black");

/** Outside bets, by key. */
export const OUTSIDE = {
  low: { label: "1 to 18", nums: range(1, 18) },
  high: { label: "19 to 36", nums: range(19, 36) },
  even: { label: "Even", nums: range(1, 36).filter((n) => n % 2 === 0) },
  odd: { label: "Odd", nums: range(1, 36).filter((n) => n % 2 === 1) },
  red: { label: "Red", nums: range(1, 36).filter((n) => RED.has(n)) },
  black: { label: "Black", nums: range(1, 36).filter((n) => !RED.has(n)) },
  dz1: { label: "1st 12", nums: range(1, 12) },
  dz2: { label: "2nd 12", nums: range(13, 24) },
  dz3: { label: "3rd 12", nums: range(25, 36) },
  // Columns: col1 = 1, 4, 7… (bottom row on the horizontal table)
  col1: { label: "2 to 1", nums: range(1, 36).filter((n) => n % 3 === 1) },
  col2: { label: "2 to 1", nums: range(1, 36).filter((n) => n % 3 === 2) },
  col3: { label: "2 to 1", nums: range(1, 36).filter((n) => n % 3 === 0) },
} as const;
export type OutsideKey = keyof typeof OUTSIDE;

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/**
 * Inside bets are written as "i:" + the sorted numbers they cover
 * ("i:17", "i:17-20", "i:0-1-2-3"), so any combination is one key.
 */
export const insideKey = (nums: number[]) => `i:${[...nums].sort((a, b) => a - b).join("-")}`;

export function coverage(key: string): number[] {
  if (key.startsWith("i:")) return key.slice(2).split("-").map(Number);
  return [...(OUTSIDE[key as OutsideKey]?.nums ?? [])];
}

/** Winnings multiplier (profit, the stake comes back on top). */
export const payoutOf = (key: string) => 36 / coverage(key).length - 1;

/** Plain-language name of a bet, for the history and the result panel. */
export function betName(key: string): string {
  if (!key.startsWith("i:")) {
    const o = OUTSIDE[key as OutsideKey];
    if (!o) return key;
    if (key.startsWith("col")) return `Column ${key.slice(3)}`;
    return o.label;
  }
  const nums = coverage(key);
  const list = nums.join("-");
  switch (nums.length) {
    case 1:
      return `Straight ${list}`;
    case 2:
      return `Split ${list}`;
    case 3:
      return nums[0] === 0 ? `Trio ${list}` : `Street ${list}`;
    case 4:
      return nums[0] === 0 ? "First four" : `Corner ${list}`;
    case 6:
      return `Six line ${nums[0]}-${nums[5]}`;
    default:
      return list;
  }
}

export type Bets = Record<string, number>;

export const totalOf = (bets: Bets) => Object.values(bets).reduce((a, b) => a + b, 0);

/** What the table pays for a result: stake back + winnings, per winning bet. */
export function settle(bets: Bets, n: number) {
  let returned = 0;
  const winners: string[] = [];
  for (const [key, amount] of Object.entries(bets)) {
    if (amount > 0 && coverage(key).includes(n)) {
      returned += amount * (payoutOf(key) + 1);
      winners.push(key);
    }
  }
  return { returned, winners };
}

/** Fair draw: crypto-backed when available. */
export function drawNumber(): number {
  try {
    const buf = new Uint32Array(1);
    // Rejection sampling keeps all 37 pockets equally likely.
    const limit = Math.floor(0x100000000 / 37) * 37;
    do crypto.getRandomValues(buf);
    while (buf[0] >= limit);
    return buf[0] % 37;
  } catch {
    return Math.floor(Math.random() * 37);
  }
}

/** Table limits. */
export const TABLE_MIN = 10;
export const MAX_STRAIGHT = 5000;
export const MAX_OUTSIDE = 50000;
export const limitOf = (key: string) => (key.startsWith("i:") ? MAX_STRAIGHT * Math.min(6, coverage(key).length) : MAX_OUTSIDE);

/** Neighbours of a number on the wheel (for the racetrack hover / stats). */
export function neighbours(n: number, k = 2) {
  const i = WHEEL.indexOf(n as (typeof WHEEL)[number]);
  return Array.from({ length: k * 2 + 1 }, (_, d) => WHEEL[(i + d - k + 37) % 37]);
}
