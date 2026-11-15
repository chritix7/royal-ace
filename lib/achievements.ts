import { dayNumber } from "./clock";
import { hashRand } from "./hashRand";

export type Achievement = { id: string; title: string; desc: string };

/** Career badges: earned once, shown in the blackjack Records panel. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: "bj", title: "Natural", desc: "Get a blackjack" },
  { id: "streak5", title: "Hot streak", desc: "Win 5 rounds in a row" },
  { id: "double", title: "Double trouble", desc: "Win a doubled hand" },
  { id: "split", title: "Split decision", desc: "Win a hand after a split" },
  { id: "pair", title: "Seeing double", desc: "Win a Perfect Pairs bet" },
  { id: "suited", title: "Lucky 21+3", desc: "Win a 21+3 bet" },
  { id: "sharp", title: "Sharp mind", desc: "10 correct decisions in a row" },
  { id: "rich", title: "High roller", desc: "Reach ◈ 10,000" },
];

/**
 * Daily challenges. Every day eight are drawn from the pool below (the
 * same draw all day, a new one at midnight local time); each pays its
 * reward once when claimed. Progress follows a counter fed by the game
 * events: `count` challenges add up what happened today, `best`
 * challenges keep the best run reached today (streaks).
 */
export type Challenge = {
  id: string;
  title: string;
  /** Counter this challenge reads: a game event, or a derived run. */
  key: string;
  mode: "count" | "best";
  goal: number;
  reward: number;
};

export const CHALLENGES_PER_DAY = 8;

export const CHALLENGE_POOL: Challenge[] = [
  // Blackjack — volume
  { id: "hands15", title: "Play 15 blackjack hands", key: "bjHand", mode: "count", goal: 15, reward: 500 },
  { id: "hands30", title: "Play 30 blackjack hands", key: "bjHand", mode: "count", goal: 30, reward: 1000 },
  { id: "hands50", title: "Play 50 blackjack hands", key: "bjHand", mode: "count", goal: 50, reward: 1600 },
  { id: "wins8", title: "Win 8 blackjack hands", key: "bjWin", mode: "count", goal: 8, reward: 800 },
  { id: "wins15", title: "Win 15 blackjack hands", key: "bjWin", mode: "count", goal: 15, reward: 1500 },
  { id: "wins25", title: "Win 25 blackjack hands", key: "bjWin", mode: "count", goal: 25, reward: 2500 },
  // Blackjack — skill and big moments
  { id: "natural1", title: "Get a blackjack", key: "bjBlackjack", mode: "count", goal: 1, reward: 1200 },
  { id: "natural3", title: "Get 3 blackjacks", key: "bjBlackjack", mode: "count", goal: 3, reward: 3500 },
  { id: "double1", title: "Win a doubled hand", key: "bjDouble", mode: "count", goal: 1, reward: 900 },
  { id: "double3", title: "Win 3 doubled hands", key: "bjDouble", mode: "count", goal: 3, reward: 2500 },
  { id: "split1", title: "Win a hand after a split", key: "bjSplit", mode: "count", goal: 1, reward: 1000 },
  { id: "split3", title: "Win 3 split hands", key: "bjSplit", mode: "count", goal: 3, reward: 2800 },
  { id: "correct20", title: "Make 20 basic-strategy plays", key: "bjCorrect", mode: "count", goal: 20, reward: 800 },
  { id: "correct40", title: "Make 40 basic-strategy plays", key: "bjCorrect", mode: "count", goal: 40, reward: 1600 },
  { id: "sharp10", title: "10 correct decisions in a row", key: "bjCorrectRun", mode: "best", goal: 10, reward: 1500 },
  { id: "sharp20", title: "20 correct decisions in a row", key: "bjCorrectRun", mode: "best", goal: 20, reward: 3000 },
  { id: "streak3", title: "Win 3 rounds in a row", key: "bjStreak", mode: "best", goal: 3, reward: 1200 },
  { id: "streak5", title: "Win 5 rounds in a row", key: "bjStreak", mode: "best", goal: 5, reward: 3000 },
  // Blackjack — side bets
  { id: "pair1", title: "Win a Perfect Pairs bet", key: "pairWin", mode: "count", goal: 1, reward: 1200 },
  { id: "pair2", title: "Win 2 Perfect Pairs bets", key: "pairWin", mode: "count", goal: 2, reward: 2800 },
  { id: "suited1", title: "Win a 21+3 bet", key: "suitedWin", mode: "count", goal: 1, reward: 1200 },
  { id: "suited2", title: "Win 2 bets on 21+3", key: "suitedWin", mode: "count", goal: 2, reward: 2800 },
  // Slots
  { id: "spins40", title: "Spin the slot machine 40 times", key: "spin", mode: "count", goal: 40, reward: 600 },
  { id: "spins100", title: "Spin the slot machine 100 times", key: "spin", mode: "count", goal: 100, reward: 1500 },
  { id: "slotwins12", title: "Win on 12 slot spins", key: "slotWin", mode: "count", goal: 12, reward: 800 },
  { id: "bigwin1", title: "Land a slot win of 20× your bet", key: "bigWin", mode: "count", goal: 1, reward: 2000 },
  { id: "bonus1", title: "Trigger or buy a free spins bonus", key: "bonus", mode: "count", goal: 1, reward: 2000 },
  { id: "boss2", title: "Make the Boss expand 2 times", key: "wildExpand", mode: "count", goal: 2, reward: 1200 },
  { id: "respin3", title: "Trigger 3 re-spins", key: "respin", mode: "count", goal: 3, reward: 1400 },
  { id: "gamble2", title: "Win 2 gambles", key: "gambleWin", mode: "count", goal: 2, reward: 1000 },
  { id: "vault1", title: "Open the vault", key: "vault", mode: "count", goal: 1, reward: 3500 },
];

/**
 * The day's eight challenges: the pool is shuffled by a hash of the day
 * number and read in that order, skipping any challenge whose counter
 * is already used today, so the same goal never appears twice at two
 * sizes ("Play 15 hands" next to "Play 30 hands").
 */
export function challengesFor(day: string): Challenge[] {
  const n = dayNumber(day);
  if (Number.isNaN(n)) return [];
  const order = CHALLENGE_POOL.map((c, i) => ({ c, r: hashRand(n * 131 + i * 17 + 5) })).sort(
    (a, b) => a.r - b.r
  );
  const picked: Challenge[] = [];
  const used = new Set<string>();
  for (const { c } of order) {
    if (used.has(c.key)) continue;
    used.add(c.key);
    picked.push(c);
    if (picked.length === CHALLENGES_PER_DAY) break;
  }
  return picked;
}
