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

/** Even-money bets that can't be played together (they cancel out). */
export const OPPOSITE: Partial<Record<OutsideKey, OutsideKey>> = {
  red: "black",
  black: "red",
  odd: "even",
  even: "odd",
  low: "high",
  high: "low",
};
const EVEN_MONEY = new Set<string>(Object.keys(OPPOSITE));

/**
 * What the table pays for a result: stake back + winnings, per winning
 * bet. La Partage: on zero, even-money bets get half their stake back.
 */
export function settle(bets: Bets, n: number, lucky?: LuckyNumber[] | null) {
  let returned = 0;
  const winners: string[] = [];
  const halved: string[] = [];
  let multiplied = 0;
  for (const [key, amount] of Object.entries(bets)) {
    if (amount <= 0) continue;
    if (coverage(key).includes(n)) {
      let profit = payoutOf(key);
      // Lightning: straight bets pay 29:1, or the strike's multiplier.
      if (lucky && coverage(key).length === 1) {
        const hit = lucky.find((l) => l.n === n);
        profit = hit ? hit.mult : LIGHTNING_STRAIGHT;
        if (hit) multiplied += amount;
      }
      returned += amount * (profit + 1);
      winners.push(key);
    } else if (n === 0 && EVEN_MONEY.has(key)) {
      returned += Math.floor(amount / 2);
      halved.push(key);
    }
  }
  return { returned, winners, halved, multiplied };
}

/* ---------- Lightning ---------- */
export type LuckyNumber = { n: number; mult: number };
/** Straight-up payout on a Lightning round (the strikes make up for it). */
export const LIGHTNING_STRAIGHT = 29;
const MULTS: [number, number][] = [
  [50, 40],
  [100, 26],
  [150, 14],
  [200, 9],
  [250, 5],
  [300, 3],
  [400, 2],
  [500, 1],
];
function rand() {
  try {
    const b = new Uint32Array(1);
    crypto.getRandomValues(b);
    return b[0] / 0x100000000;
  } catch {
    return Math.random();
  }
}
/** 1 to 5 lucky numbers, each with a 50× to 500× multiplier. */
export function drawLightning(): LuckyNumber[] {
  const count = [1, 1, 2, 2, 2, 3, 3, 4, 5][Math.floor(rand() * 9)];
  const pool = Array.from({ length: 37 }, (_, i) => i);
  const out: LuckyNumber[] = [];
  const total = MULTS.reduce((a, [, w]) => a + w, 0);
  while (out.length < count) {
    const n = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    let r = rand() * total;
    let mult = 50;
    for (const [m, w] of MULTS) {
      if ((r -= w) < 0) {
        mult = m;
        break;
      }
    }
    out.push({ n, mult });
  }
  return out;
}

/* ---------- Racetrack: announced bets ---------- */
export type AnnounceKey = "voisins" | "tiers" | "orphelins" | "zero";
export const ANNOUNCES: Record<AnnounceKey, { label: string; short: string; units: [number[], number][] }> = {
  voisins: {
    label: "Voisins du zéro",
    short: "Voisins",
    units: [
      [[0, 2, 3], 2],
      [[4, 7], 1],
      [[12, 15], 1],
      [[18, 21], 1],
      [[19, 22], 1],
      [[32, 35], 1],
      [[25, 26, 28, 29], 2],
    ],
  },
  tiers: {
    label: "Tiers du cylindre",
    short: "Tiers",
    units: [
      [[5, 8], 1],
      [[10, 11], 1],
      [[13, 16], 1],
      [[23, 24], 1],
      [[27, 30], 1],
      [[33, 36], 1],
    ],
  },
  orphelins: {
    label: "Orphelins",
    short: "Orphelins",
    units: [
      [[1], 1],
      [[6, 9], 1],
      [[14, 17], 1],
      [[17, 20], 1],
      [[31, 34], 1],
    ],
  },
  zero: {
    label: "Jeu zéro",
    short: "Zéro",
    units: [
      [[0, 3], 1],
      [[12, 15], 1],
      [[32, 35], 1],
      [[26], 1],
    ],
  },
};
/** The bets of an announce, for a chip value per unit. */
export const announceBets = (a: AnnounceKey, chip: number): [string, number][] =>
  ANNOUNCES[a].units.map(([nums, u]) => [insideKey(nums), u * chip]);
/** Numbers an announce covers (for highlighting). */
export const announceNumbers = (a: AnnounceKey) => [...new Set(ANNOUNCES[a].units.flatMap(([n]) => n))];

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

/** Table limits: per bet, by how many numbers it covers, and in total. */
export const TABLE_MIN = 10;
export const TABLE_MAX = 5000000;
export const LIMIT_BY_SIZE: Record<number, number> = { 1: 100000, 2: 200000, 3: 300000, 4: 400000, 6: 600000, 12: 1000000, 18: 2000000 };
export const limitOf = (key: string) => LIMIT_BY_SIZE[coverage(key).length] ?? 100000;
/** Kept for labels. */
export const MAX_STRAIGHT = LIMIT_BY_SIZE[1];
export const MAX_OUTSIDE = LIMIT_BY_SIZE[18];

const DOZENS = ["dz1", "dz2", "dz3"];
const COLUMNS = ["col1", "col2", "col3"];

/**
 * Why a chip can't go on `key` with the current bets (null = allowed).
 * Real-table rules: no opposite even-money bets, at most two dozens and
 * two columns per spin.
 */
export function ruleBreak(bets: Bets, key: string): string | null {
  const opp = OPPOSITE[key as OutsideKey];
  if (opp && (bets[opp] ?? 0) > 0) return `Can't bet ${betName(key)} and ${betName(opp)} together`;
  for (const group of [DOZENS, COLUMNS]) {
    if (!group.includes(key) || (bets[key] ?? 0) > 0) continue;
    const used = group.filter((k) => (bets[k] ?? 0) > 0).length;
    if (used >= 2) return `Two ${group === DOZENS ? "dozens" : "columns"} at most per spin`;
  }
  return null;
}

/** Neighbours of a number on the wheel (for the racetrack hover / stats). */
export function neighbours(n: number, k = 2) {
  const i = WHEEL.indexOf(n as (typeof WHEEL)[number]);
  return Array.from({ length: k * 2 + 1 }, (_, d) => WHEEL[(i + d - k + 37) % 37]);
}
