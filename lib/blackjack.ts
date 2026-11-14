export type Card = { rank: string; suit: string; value: number };
export type Result = "blackjack" | "win" | "push" | "lose" | "bust" | "surrender";
export type Hand = {
  cards: Card[];
  bet: number;
  done: boolean;
  doubled: boolean;
  split: boolean;
  result?: Result;
};

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [
  { rank: "A", value: 11 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 10 },
  { rank: "Q", value: 10 },
  { rank: "K", value: 10 },
];

export const DECKS = 6;
export const SHOE_MIN = 60; // remélange sous ce nombre de cartes

/** Sabot de 6 jeux, mélangé avec Fisher-Yates (mélange non biaisé). */
export function makeShoe(
  decks = DECKS,
  rng: () => number = Math.random
): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < decks; d++)
    for (const suit of SUITS)
      for (const r of RANKS) shoe.push({ ...r, suit });

  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

export function handValue(cards: Card[]) {
  let total = cards.reduce((sum, c) => sum + c.value, 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export const isBlackjack = (cards: Card[]) =>
  cards.length === 2 && handValue(cards).total === 21;

/** Split autorisé sur deux cartes de même valeur (K + Q ok). */
export const canSplitCards = (cards: Card[]) =>
  cards.length === 2 && cards[0].value === cards[1].value;

export type Advice = "Hit" | "Stand" | "Double" | "Split" | "Surrender";

/**
 * Stratégie de base (sabot multi-jeux). `opts.h17` adapte les quelques
 * décisions qui changent quand le croupier tire sur 17 souple, et
 * `opts.canSurrender` active les abandons tardifs recommandés.
 */
export function advise(
  cards: Card[],
  up: Card,
  canDouble: boolean,
  canSplit: boolean,
  opts: { canSurrender?: boolean; h17?: boolean } = {}
): Advice {
  const u = up.value;
  const { total, soft } = handValue(cards);
  const h17 = !!opts.h17;

  if (canSplit) {
    const v = cards[0].value;
    if (v === 11 || v === 8) return "Split";
    if (v === 9 && ![7, 10, 11].includes(u)) return "Split";
    if (v === 7 && u <= 7) return "Split";
    if (v === 6 && u <= 6) return "Split";
    if ((v === 2 || v === 3) && u <= 7) return "Split";
    if (v === 4 && (u === 5 || u === 6)) return "Split";
  }

  // Abandon tardif : 16 dur contre 9/10/As, 15 dur contre 10 ;
  // en H17 aussi 15 et 17 contre un As. (8-8 est déjà splitté au-dessus.)
  if (opts.canSurrender && !soft && cards.length === 2) {
    if (total === 16 && u >= 9) return "Surrender";
    if (total === 15 && (u === 10 || (h17 && u === 11))) return "Surrender";
    if (total === 17 && h17 && u === 11) return "Surrender";
  }

  if (soft) {
    if (total >= 20) return "Stand";
    if (total === 19) return h17 && u === 6 && canDouble ? "Double" : "Stand";
    if (total === 18) {
      if (u >= (h17 ? 2 : 3) && u <= 6) return canDouble ? "Double" : "Stand";
      return u <= 8 ? "Stand" : "Hit";
    }
    if (total === 17) return u >= 3 && u <= 6 && canDouble ? "Double" : "Hit";
    if (total >= 15) return u >= 4 && u <= 6 && canDouble ? "Double" : "Hit";
    return u >= 5 && u <= 6 && canDouble ? "Double" : "Hit";
  }

  if (total >= 17) return "Stand";
  if (total >= 13) return u <= 6 ? "Stand" : "Hit";
  if (total === 12) return u >= 4 && u <= 6 ? "Stand" : "Hit";
  if (total === 11) return canDouble && (u <= 10 || h17) ? "Double" : "Hit";
  if (total === 10) return u <= 9 && canDouble ? "Double" : "Hit";
  if (total === 9) return u >= 3 && u <= 6 && canDouble ? "Double" : "Hit";
  return "Hit";
}

/** Valeur Hi-Lo d'une carte pour le comptage : 2-6 = +1, 7-9 = 0, 10-A = -1. */
export function hiLo(card: Card): number {
  if (["2", "3", "4", "5", "6"].includes(card.rank)) return 1;
  if (["7", "8", "9"].includes(card.rank)) return 0;
  return -1;
}

/**
 * The dealer's call for a settled round, as announced at a table: who
 * won and on what totals. `results` holds one entry per player hand,
 * `playerTotal` is the first hand's total (used for single-hand calls).
 */
export function dealerCall(
  results: Result[],
  playerTotal: number,
  dealerTotal: number,
  dealerBJ: boolean,
  bj65 = false
): string {
  const n = results.length;
  const count = (r: Result) => results.filter((x) => x === r).length;
  const won = count("win") + count("blackjack");
  const pushed = count("push");

  if (count("surrender") === n) return "Surrender · half the bet returned";
  if (count("blackjack") > 0) return `Blackjack · pays ${bj65 ? "6 to 5" : "3 to 2"}`;
  if (dealerBJ) return pushed > 0 ? "Dealer blackjack · push" : "Dealer blackjack";
  if (count("bust") === n)
    return n === 1 ? `Bust on ${playerTotal} · dealer wins` : "All hands bust · dealer wins";
  if (dealerTotal > 21) return `Dealer busts on ${dealerTotal} · player wins`;
  if (n === 1) {
    if (won > 0) return `Player wins · ${playerTotal} over ${dealerTotal}`;
    if (pushed > 0) return `Push on ${dealerTotal} · bet returned`;
    return `Dealer wins · ${dealerTotal} over ${playerTotal}`;
  }
  if (won > 0) return `Player wins ${won} of ${n} hands`;
  if (pushed > 0) return `Push on ${pushed} of ${n} hands`;
  return `Dealer wins all ${n} hands`;
}

/**
 * Cards a round can reasonably need: the shoe is reshuffled before the
 * deal when fewer remain, so it doesn't run dry in the middle of a hand
 * (which would bring in a fresh shoe unannounced and skew the count).
 */
export function cardsNeeded(spots: number): number {
  return spots * 8 + 10;
}
