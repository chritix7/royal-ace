import type { Card } from "./blackjack";

/**
 * Casino Hold'em — Texas Hold'em against the dealer, as played in casinos.
 *
 * - The player places an Ante (and may add the AA Bonus side bet).
 * - Player and dealer get two cards each, then the flop is dealt.
 * - The player either folds (Ante lost) or calls with 2× the Ante.
 * - Turn and river are dealt, the dealer shows: best five of seven cards.
 * - The dealer qualifies with a pair of 4s or better.
 *     · Dealer does not qualify: Ante pays the paytable, Call pushes.
 *     · Dealer qualifies, player wins: Ante pays the paytable, Call 1:1.
 *     · Tie: everything pushes. Dealer wins: Ante and Call lost.
 * - AA Bonus: paid on the player's two cards and the flop (five cards),
 *   pair of aces or better, whatever happens to the main bets.
 */

export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
const RANK_VALUE: Record<string, number> = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14 };
export const rankOf = (c: Card) => RANK_VALUE[c.rank];

/** Hand categories, low to high. */
export const CATEGORY = ["High card", "Pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush", "Royal flush"] as const;
export type Category = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Evaluated = {
  cat: Category;
  /** Comparable: higher wins, equal ties. */
  score: number;
  /** The five cards that make the hand, strongest first. */
  best: Card[];
  /** "Pair of Kings", "Flush, Ace high"… */
  name: string;
};

const RANK_NAME: Record<number, [string, string]> = {
  2: ["Two", "Twos"],
  3: ["Three", "Threes"],
  4: ["Four", "Fours"],
  5: ["Five", "Fives"],
  6: ["Six", "Sixes"],
  7: ["Seven", "Sevens"],
  8: ["Eight", "Eights"],
  9: ["Nine", "Nines"],
  10: ["Ten", "Tens"],
  11: ["Jack", "Jacks"],
  12: ["Queen", "Queens"],
  13: ["King", "Kings"],
  14: ["Ace", "Aces"],
};

/** Exactly five cards. */
function eval5(cards: Card[]): Evaluated {
  const vals = cards.map(rankOf);
  const counts = new Map<number, number>();
  vals.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  // Groups: bigger count first, then higher rank.
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const uniq = [...counts.keys()].sort((a, b) => b - a);
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    else if (uniq[0] === 14 && uniq[1] === 5) straightHigh = 5; // A-2-3-4-5
  }
  let cat: Category;
  let order: number[];
  if (straightHigh && flush) {
    cat = straightHigh === 14 ? 9 : 8;
    order = [straightHigh];
  } else if (groups[0][1] === 4) {
    cat = 7;
    order = [groups[0][0], groups[1][0]];
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    cat = 6;
    order = [groups[0][0], groups[1][0]];
  } else if (flush) {
    cat = 5;
    order = uniq;
  } else if (straightHigh) {
    cat = 4;
    order = [straightHigh];
  } else if (groups[0][1] === 3) {
    cat = 3;
    order = groups.map((g) => g[0]);
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    cat = 2;
    order = groups.map((g) => g[0]);
  } else if (groups[0][1] === 2) {
    cat = 1;
    order = groups.map((g) => g[0]);
  } else {
    cat = 0;
    order = uniq;
  }
  let score = cat;
  for (let i = 0; i < 5; i++) score = score * 16 + (order[i] ?? 0);
  // Best cards in display order: by group, then rank (wheel: 5 high).
  const weight = (c: Card) => {
    const v = rankOf(c);
    const w = straightHigh === 5 && v === 14 ? 1 : v;
    return (counts.get(v) ?? 1) * 100 + w;
  };
  const best = [...cards].sort((a, b) => weight(b) - weight(a));
  const n = (v: number, plural = false) => RANK_NAME[v][plural ? 1 : 0];
  const name =
    cat === 9
      ? "Royal flush"
      : cat === 8
        ? `Straight flush, ${n(order[0])} high`
        : cat === 7
          ? `Four ${n(order[0], true)}`
          : cat === 6
            ? `Full house, ${n(order[0], true)} over ${n(order[1], true)}`
            : cat === 5
              ? `Flush, ${n(order[0])} high`
              : cat === 4
                ? `Straight, ${n(order[0])} high`
                : cat === 3
                  ? `Three ${n(order[0], true)}`
                  : cat === 2
                    ? `Two pair, ${n(order[0], true)} and ${n(order[1], true)}`
                    : cat === 1
                      ? `Pair of ${n(order[0], true)}`
                      : `${n(order[0])} high`;
  return { cat, score, best, name };
}

/** Best five of five to seven cards. */
export function evaluate(cards: Card[]): Evaluated {
  if (cards.length <= 5) return eval5(cards);
  let best: Evaluated | null = null;
  const pick: Card[] = [];
  const walk = (from: number) => {
    if (pick.length === 5) {
      const e = eval5(pick);
      if (!best || e.score > best.score) best = e;
      return;
    }
    for (let i = from; i <= cards.length - (5 - pick.length); i++) {
      pick.push(cards[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return best!;
}

/** Dealer qualifies with a pair of 4s or better. */
export function qualifies(e: Evaluated) {
  if (e.cat >= 2) return true;
  if (e.cat === 1) return rankOf(e.best[0]) >= 4;
  return false;
}

/** Ante paytable (to 1), by the player's final hand. */
export const ANTE_PAYS: { cat: Category; label: string; pays: number }[] = [
  { cat: 9, label: "Royal flush", pays: 100 },
  { cat: 8, label: "Str. flush", pays: 20 },
  { cat: 7, label: "4 of a kind", pays: 10 },
  { cat: 6, label: "Full house", pays: 3 },
  { cat: 5, label: "Flush", pays: 2 },
  { cat: 4, label: "Straight or less", pays: 1 },
];
export const antePays = (cat: Category) => (cat >= 9 ? 100 : cat === 8 ? 20 : cat === 7 ? 10 : cat === 6 ? 3 : cat === 5 ? 2 : 1);

/** AA Bonus paytable (to 1), on the player's two cards and the flop. */
export const BONUS_PAYS: { key: string; label: string; pays: number }[] = [
  { key: "9", label: "Royal flush", pays: 100 },
  { key: "8", label: "Str. flush", pays: 50 },
  { key: "7", label: "4 of a kind", pays: 40 },
  { key: "6", label: "Full house", pays: 30 },
  { key: "5", label: "Flush", pays: 20 },
  { key: "4", label: "Straight", pays: 7 },
  { key: "3", label: "3 of a kind", pays: 7 },
  { key: "2", label: "Two pair", pays: 7 },
  { key: "AA", label: "Pair of aces", pays: 7 },
];
/** AA Bonus multiplier for five cards (0 = loses), and the paytable row. */
export function bonusOf(five: Card[]): { pays: number; key: string | null; hand: Evaluated } {
  const hand = evaluate(five);
  if (hand.cat >= 2) {
    const row = BONUS_PAYS.find((r) => r.key === String(hand.cat))!;
    return { pays: row.pays, key: row.key, hand };
  }
  if (hand.cat === 1 && rankOf(hand.best[0]) === 14) return { pays: 7, key: "AA", hand };
  return { pays: 0, key: null, hand };
}

export type Outcome = "fold" | "win" | "lose" | "push" | "noQualify";
export type Settlement = {
  outcome: Outcome;
  player: Evaluated;
  dealer: Evaluated;
  dealerQualifies: boolean;
  /** Amounts paid back (stake included). */
  anteBack: number;
  callBack: number;
  bonusBack: number;
  bonusKey: string | null;
  returned: number;
  staked: number;
};

/** Settle a hand: 2 player cards, 2 dealer cards, 5 board cards. */
export function settle(bets: { ante: number; bonus: number }, called: boolean, player: Card[], dealer: Card[], board: Card[]): Settlement {
  const p = evaluate([...player, ...board]);
  const d = evaluate([...dealer, ...board]);
  const dq = qualifies(d);
  const call = called ? bets.ante * 2 : 0;
  const b = bets.bonus > 0 ? bonusOf([...player, ...board.slice(0, 3)]) : { pays: 0, key: null };
  const bonusBack = b.pays ? bets.bonus * (b.pays + 1) : 0;
  let outcome: Outcome;
  let anteBack = 0;
  let callBack = 0;
  if (!called) outcome = "fold";
  else if (!dq) {
    outcome = "noQualify";
    anteBack = bets.ante * (antePays(p.cat) + 1);
    callBack = call;
  } else if (p.score > d.score) {
    outcome = "win";
    anteBack = bets.ante * (antePays(p.cat) + 1);
    callBack = call * 2;
  } else if (p.score === d.score) {
    outcome = "push";
    anteBack = bets.ante;
    callBack = call;
  } else outcome = "lose";
  return {
    outcome,
    player: p,
    dealer: d,
    dealerQualifies: dq,
    anteBack,
    callBack,
    bonusBack,
    bonusKey: b.key,
    returned: anteBack + callBack + bonusBack,
    staked: bets.ante + call + bets.bonus,
  };
}

/**
 * Hands to fold at the flop when they hold no pair with a hole card, no
 * four-flush and no open-ended straight draw. Key: h (high card) or b (the
 * pair is on the board), how many hole cards beat the flop, then the two
 * hole ranks. Worked out by simulating 2.6 million hands: these are the
 * spots where calling loses more, on average, than the folded Ante.
 */
const FOLD = new Set([
  "b0:3-2", "b0:4-2", "b0:4-3", "b0:5-2", "b0:5-3", "b0:5-4", "b0:6-2", "b0:6-3", "b0:6-4", "b0:6-5",
  "b0:7-2", "b0:7-3", "b0:7-4", "b0:7-5", "b0:7-6", "b0:8-2", "b0:8-3", "b0:8-4", "b0:8-5", "b0:8-6",
  "b0:9-2", "b0:9-3", "b1:10-2", "b1:10-3", "b1:7-2", "b1:8-2", "b1:8-3", "b1:8-5", "b1:9-2", "b1:9-3",
  "b1:9-4", "b2:8-7", "b2:9-6", "b2:9-7", "h0:10-2", "h0:3-2", "h0:4-2", "h0:4-3", "h0:5-2", "h0:5-3",
  "h0:5-4", "h0:6-2", "h0:6-3", "h0:6-4", "h0:6-5", "h0:7-2", "h0:7-3", "h0:7-4", "h0:7-5", "h0:7-6",
  "h0:8-2", "h0:8-3", "h0:8-4", "h0:8-5", "h0:9-2", "h0:9-3", "h0:9-4", "h1:10-2", "h1:10-3", "h1:11-2",
  "h1:11-3", "h1:12-2", "h1:9-2", "h1:9-3",
]);

/** The suggested play at the flop: call or fold. */
export function hint(player: Card[], flop: Card[]): "call" | "fold" {
  const all = [...player, ...flop];
  const e = evaluate(all);
  const hole = player.map(rankOf).sort((a, b) => b - a);
  if (e.cat >= 2) return "call";
  if (e.cat === 1 && hole.includes(rankOf(e.best[0]))) return "call";
  // Four to a flush with at least one hole card.
  for (const s of SUITS) if (all.filter((c) => c.suit === s).length >= 4 && player.some((c) => c.suit === s)) return "call";
  // Open-ended straight draw with at least one hole card.
  const vals = new Set(all.map(rankOf));
  if (vals.has(14)) vals.add(1);
  for (let lo = 2; lo <= 10; lo++) {
    const run = [lo, lo + 1, lo + 2, lo + 3];
    if (run.every((v) => vals.has(v)) && run.some((v) => hole.includes(v))) return "call";
  }
  const top = Math.max(...flop.map(rankOf));
  const over = hole.filter((v) => v > top).length;
  return FOLD.has(`${e.cat === 1 ? "b" : "h"}${over}:${hole[0]}-${hole[1]}`) ? "fold" : "call";
}

/** A shuffled 52-card deck (crypto when available). */
export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit, value: RANK_VALUE[rank] });
  const rnd = (n: number) => {
    const c = globalThis.crypto;
    if (c?.getRandomValues) {
      const buf = new Uint32Array(1);
      const lim = Math.floor(0x100000000 / n) * n;
      let x = 0;
      do {
        c.getRandomValues(buf);
        x = buf[0];
      } while (x >= lim);
      return x % n;
    }
    return Math.floor(Math.random() * n);
  };
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Table limits. */
export const ANTE_MIN = 10;
export const ANTE_MAX = 500000;
export const BONUS_MAX = 100000;
