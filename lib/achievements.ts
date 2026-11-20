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
 * Daily challenges — balanced across the seven games.
 *
 * Every day each game gets two challenges: one "play" goal (easy, keeps
 * you moving) and one "feat" (a win or a big moment). That makes ten a
 * day, drawn by a hash of the date (the same all day, new at midnight).
 * On top of them:
 * - Grand tour: play at least one round of each game today.
 * - Royal chest: complete all fourteen challenges.
 * Progress follows counters fed by the game events: `count` adds up what
 * happened today, `best` keeps the best run reached today (streaks).
 */
export type GameId = "bj" | "slots" | "roulette" | "poker" | "craps" | "penalty" | "sports";
export const GAMES: { id: GameId; label: string }[] = [
  { id: "bj", label: "Blackjack" },
  { id: "slots", label: "Slots" },
  { id: "roulette", label: "Roulette" },
  { id: "poker", label: "Hold'em" },
  { id: "craps", label: "Craps" },
  { id: "penalty", label: "Penalty" },
  { id: "sports", label: "Sports" },
];

export type Challenge = {
  id: string;
  title: string;
  game: GameId;
  tier: "play" | "feat";
  /** Counter this challenge reads: a game event, or a derived run. */
  key: string;
  mode: "count" | "best";
  goal: number;
  reward: number;
};

export const CHALLENGES_PER_DAY = 14;
/** Play one round of every game today. */
export const TOUR_REWARD = 15000;
/** Complete all fourteen challenges of the day. */
export const CHEST_REWARD = 60000;
/** Which event marks a round played in each game (for the Grand tour). */
export const PLAY_EVENT: Record<GameId, string> = { bj: "bjHand", slots: "spin", roulette: "rouletteSpin", poker: "pokerHand", craps: "crapsRoll", penalty: "penaltyRound", sports: "betPlaced" };

type Def = Omit<Challenge, "game" | "tier">;
const POOL: Record<GameId, { play: Def[]; feat: Def[] }> = {
  bj: {
    play: [
      { id: "bj-hands20", title: "Play 20 blackjack hands", key: "bjHand", mode: "count", goal: 20, reward: 6000 },
      { id: "bj-hands35", title: "Play 35 blackjack hands", key: "bjHand", mode: "count", goal: 35, reward: 9000 },
      { id: "bj-correct25", title: "Make 25 basic-strategy plays", key: "bjCorrect", mode: "count", goal: 25, reward: 8000 },
    ],
    feat: [
      { id: "bj-wins10", title: "Win 10 blackjack hands", key: "bjWin", mode: "count", goal: 10, reward: 12000 },
      { id: "bj-natural2", title: "Get 2 blackjacks", key: "bjBlackjack", mode: "count", goal: 2, reward: 18000 },
      { id: "bj-double2", title: "Win 2 doubled hands", key: "bjDouble", mode: "count", goal: 2, reward: 15000 },
      { id: "bj-split1", title: "Win a hand after a split", key: "bjSplit", mode: "count", goal: 1, reward: 14000 },
      { id: "bj-streak4", title: "Win 4 rounds in a row", key: "bjStreak", mode: "best", goal: 4, reward: 20000 },
      { id: "bj-sharp15", title: "15 correct decisions in a row", key: "bjCorrectRun", mode: "best", goal: 15, reward: 16000 },
      { id: "bj-pair1", title: "Win a Perfect Pairs bet", key: "pairWin", mode: "count", goal: 1, reward: 20000 },
      { id: "bj-suited1", title: "Win a 21+3 bet", key: "suitedWin", mode: "count", goal: 1, reward: 18000 },
    ],
  },
  slots: {
    play: [
      { id: "sl-spins50", title: "Spin the slot machine 50 times", key: "spin", mode: "count", goal: 50, reward: 6000 },
      { id: "sl-spins90", title: "Spin the slot machine 90 times", key: "spin", mode: "count", goal: 90, reward: 9000 },
      { id: "sl-wins15", title: "Win on 15 slot spins", key: "slotWin", mode: "count", goal: 15, reward: 8000 },
    ],
    feat: [
      { id: "sl-big1", title: "Land a slot win of 20× your bet", key: "bigWin", mode: "count", goal: 1, reward: 20000 },
      { id: "sl-bonus1", title: "Trigger or buy free spins", key: "bonus", mode: "count", goal: 1, reward: 16000 },
      { id: "sl-boss3", title: "Make the Boss expand 3 times", key: "wildExpand", mode: "count", goal: 3, reward: 14000 },
      { id: "sl-respin3", title: "Trigger 3 re-spins", key: "respin", mode: "count", goal: 3, reward: 14000 },
      { id: "sl-gamble2", title: "Win 2 gambles", key: "gambleWin", mode: "count", goal: 2, reward: 12000 },
      { id: "sl-vault1", title: "Open the vault", key: "vault", mode: "count", goal: 1, reward: 25000 },
    ],
  },
  roulette: {
    play: [
      { id: "rl-spins25", title: "Spin the roulette 25 times", key: "rouletteSpin", mode: "count", goal: 25, reward: 6000 },
      { id: "rl-spins45", title: "Spin the roulette 45 times", key: "rouletteSpin", mode: "count", goal: 45, reward: 9000 },
      { id: "rl-wins12", title: "Win 12 roulette spins", key: "rouletteWin", mode: "count", goal: 12, reward: 8000 },
    ],
    feat: [
      { id: "rl-straight1", title: "Hit a straight up", key: "rouletteStraight", mode: "count", goal: 1, reward: 15000 },
      { id: "rl-straight2", title: "Hit 2 straight ups", key: "rouletteStraight", mode: "count", goal: 2, reward: 24000 },
      { id: "rl-zero1", title: "Win with zero", key: "rouletteZero", mode: "count", goal: 1, reward: 20000 },
      { id: "rl-light1", title: "Win a Lightning multiplier", key: "rouletteLightning", mode: "count", goal: 1, reward: 30000 },
      { id: "rl-big1", title: "Win 10× your stake at roulette", key: "rouletteBigWin", mode: "count", goal: 1, reward: 18000 },
    ],
  },
  poker: {
    play: [
      { id: "pk-hands20", title: "Play 20 hands of Hold'em", key: "pokerHand", mode: "count", goal: 20, reward: 6000 },
      { id: "pk-hands35", title: "Play 35 hands of Hold'em", key: "pokerHand", mode: "count", goal: 35, reward: 9000 },
    ],
    feat: [
      { id: "pk-wins8", title: "Beat the dealer 8 times", key: "pokerWin", mode: "count", goal: 8, reward: 14000 },
      { id: "pk-bonus1", title: "Win the AA Bonus", key: "pokerBonus", mode: "count", goal: 1, reward: 18000 },
      { id: "pk-flush1", title: "Make a flush or better", key: "pokerFlush", mode: "count", goal: 1, reward: 20000 },
      { id: "pk-big1", title: "Win 10× your Ante", key: "pokerBigWin", mode: "count", goal: 1, reward: 25000 },
    ],
  },
  craps: {
    play: [
      { id: "cr-rolls40", title: "Roll the dice 40 times", key: "crapsRoll", mode: "count", goal: 40, reward: 6000 },
      { id: "cr-rolls70", title: "Roll the dice 70 times", key: "crapsRoll", mode: "count", goal: 70, reward: 9000 },
      { id: "cr-wins15", title: "Win on 15 craps rolls", key: "crapsWin", mode: "count", goal: 15, reward: 8000 },
    ],
    feat: [
      { id: "cr-point2", title: "Make the point twice with a Pass bet", key: "crapsPoint", mode: "count", goal: 2, reward: 15000 },
      { id: "cr-hard1", title: "Win a hardway", key: "crapsHard", mode: "count", goal: 1, reward: 20000 },
      { id: "cr-big1", title: "Win a craps bet paying 10 to 1 or more", key: "crapsBigWin", mode: "count", goal: 1, reward: 25000 },
    ],
  },
  penalty: {
    play: [
      { id: "pe-rounds20", title: "Play 20 penalty rounds", key: "penaltyRound", mode: "count", goal: 20, reward: 6000 },
      { id: "pe-goals25", title: "Score 25 penalties", key: "penaltyGoal", mode: "count", goal: 25, reward: 8000 },
      { id: "pe-cash8", title: "Cash out 8 times", key: "penaltyCashout", mode: "count", goal: 8, reward: 9000 },
    ],
    feat: [
      { id: "pe-cash15", title: "Cash out 15 times", key: "penaltyCashout", mode: "count", goal: 15, reward: 15000 },
      { id: "pe-goals60", title: "Score 60 penalties", key: "penaltyGoal", mode: "count", goal: 60, reward: 16000 },
      { id: "pe-big1", title: "Cash out after 4 goals or more", key: "penaltyBigWin", mode: "count", goal: 1, reward: 25000 },
    ],
  },
  sports: {
    play: [
      { id: "sp-bets3", title: "Place 3 sports bets", key: "betPlaced", mode: "count", goal: 3, reward: 6000 },
      { id: "sp-combo1", title: "Place a combo of 3 picks or more", key: "betCombo", mode: "count", goal: 1, reward: 7000 },
      { id: "sp-live2", title: "Place 2 bets on live matches", key: "betLive", mode: "count", goal: 2, reward: 8000 },
    ],
    feat: [
      { id: "sp-won2", title: "Win 2 sports bets", key: "betWon", mode: "count", goal: 2, reward: 15000 },
      { id: "sp-combowon", title: "Win a combo of 3 picks or more", key: "betComboWon", mode: "count", goal: 1, reward: 25000 },
      { id: "sp-big1", title: "Win a ticket at odds of 10 or more", key: "betBigWin", mode: "count", goal: 1, reward: 25000 },
    ],
  },
};

/** Every challenge that can come up (for lookups). */
export const CHALLENGE_POOL: Challenge[] = GAMES.flatMap(({ id }) => [
  ...POOL[id].play.map((d) => ({ ...d, game: id, tier: "play" as const })),
  ...POOL[id].feat.map((d) => ({ ...d, game: id, tier: "feat" as const })),
]);

/** The day's fourteen challenges: one "play" and one "feat" for each game. */
export function challengesFor(day: string): Challenge[] {
  const n = dayNumber(day);
  if (Number.isNaN(n)) return [];
  const pick = <T,>(list: T[], salt: number) => list[Math.floor(hashRand(n * 131 + salt) * list.length) % list.length];
  return GAMES.flatMap(({ id }, gi) => {
    const play = { ...pick(POOL[id].play, gi * 37 + 3), game: id, tier: "play" as const };
    // A feat reading the same counter as the play goal is skipped.
    const feats = POOL[id].feat.filter((f) => f.key !== play.key);
    const feat = { ...pick(feats, gi * 53 + 11), game: id, tier: "feat" as const };
    return [play, feat];
  });
}

/**
 * Career milestones: earned once for good, across all seven games, read
 * from the lifetime statistics.
 */
export type Milestone = { id: string; game: GameId | "all"; title: string; stat: string; goal: number; reward: number };
export const MILESTONES: Milestone[] = [
  { id: "m-bj100", game: "bj", title: "Play 100 blackjack hands", stat: "bjHands", goal: 100, reward: 25000 },
  { id: "m-bj1000", game: "bj", title: "Play 1,000 blackjack hands", stat: "bjHands", goal: 1000, reward: 120000 },
  { id: "m-bjnat25", game: "bj", title: "Get 25 blackjacks", stat: "blackjacks", goal: 25, reward: 60000 },
  { id: "m-sl200", game: "slots", title: "Spin the slots 200 times", stat: "spins", goal: 200, reward: 25000 },
  { id: "m-sl2000", game: "slots", title: "Spin the slots 2,000 times", stat: "spins", goal: 2000, reward: 120000 },
  { id: "m-slbonus10", game: "slots", title: "Trigger 10 free-spins bonuses", stat: "bonuses", goal: 10, reward: 60000 },
  { id: "m-sljack", game: "slots", title: "Win a slots jackpot", stat: "jackpots", goal: 1, reward: 75000 },
  { id: "m-rl100", game: "roulette", title: "Spin the roulette 100 times", stat: "rouletteSpins", goal: 100, reward: 25000 },
  { id: "m-rl1000", game: "roulette", title: "Spin the roulette 1,000 times", stat: "rouletteSpins", goal: 1000, reward: 120000 },
  { id: "m-rlstr25", game: "roulette", title: "Hit 25 straight ups", stat: "rouletteStraights", goal: 25, reward: 60000 },
  { id: "m-pk100", game: "poker", title: "Play 100 hands of Hold'em", stat: "pokerHands", goal: 100, reward: 25000 },
  { id: "m-pk1000", game: "poker", title: "Play 1,000 hands of Hold'em", stat: "pokerHands", goal: 1000, reward: 120000 },
  { id: "m-pkwin200", game: "poker", title: "Beat the dealer 200 times", stat: "pokerWins", goal: 200, reward: 60000 },
  { id: "m-cr150", game: "craps", title: "Roll the dice 150 times", stat: "crapsRolls", goal: 150, reward: 25000 },
  { id: "m-cr1500", game: "craps", title: "Roll the dice 1,500 times", stat: "crapsRolls", goal: 1500, reward: 120000 },
  { id: "m-crwin300", game: "craps", title: "Win on 300 craps rolls", stat: "crapsWins", goal: 300, reward: 60000 },
  { id: "m-pe100", game: "penalty", title: "Play 100 penalty rounds", stat: "penaltyRounds", goal: 100, reward: 25000 },
  { id: "m-pe1000", game: "penalty", title: "Play 1,000 penalty rounds", stat: "penaltyRounds", goal: 1000, reward: 120000 },
  { id: "m-pegoal500", game: "penalty", title: "Score 500 penalties", stat: "penaltyGoals", goal: 500, reward: 60000 },
  { id: "m-sp50", game: "sports", title: "Place 50 sports bets", stat: "betsPlaced", goal: 50, reward: 25000 },
  { id: "m-sp500", game: "sports", title: "Place 500 sports bets", stat: "betsPlaced", goal: 500, reward: 120000 },
  { id: "m-spwin100", game: "sports", title: "Win 100 sports bets", stat: "betsWon", goal: 100, reward: 60000 },
  { id: "m-lvl10", game: "all", title: "Reach level 10", stat: "level", goal: 10, reward: 75000 },
  { id: "m-lvl25", game: "all", title: "Reach level 25", stat: "level", goal: 25, reward: 200000 },
];
