/**
 * Daily missions — a lightweight gamification layer. Three missions
 * are drawn from the pool each local day; progress ticks as the player
 * plays, and completion fires an achievement-style toast through the
 * existing `toast` channel. Resets at local midnight.
 */

export type MissionType =
  | "win"       // win N rounds (counts "win" + "blackjack")
  | "blackjack" // hit N blackjacks
  | "double"    // win N doubled hands
  | "split"    // win N hands after splitting
  | "pp"        // win N Perfect Pairs side bets
  | "t3"        // win N 21+3 side bets
  | "correct"   // make N correct basic-strategy decisions
  | "streak"    // reach a win streak of N in a row
  | "profit"    // net profit of N over the day
  | "rounds";   // play N rounds

export type MissionDef = {
  id: string;
  type: MissionType;
  target: number;
  label: string;
};

export type Mission = MissionDef & {
  progress: number;
  completed: boolean;
};

/**
 * Pool of possible missions. Three are drawn each day with a seeded
 * shuffle so a given day always rolls the same set (no mission
 * replacement by reloading). Targets are tuned to be reachable in
 * a short session.
 */
export const MISSION_POOL: MissionDef[] = [
  { id: "win-5",       type: "win",       target: 5,   label: "Win 5 rounds" },
  { id: "win-10",      type: "win",       target: 10,  label: "Win 10 rounds" },
  { id: "bj-1",        type: "blackjack", target: 1,   label: "Hit a blackjack" },
  { id: "bj-2",        type: "blackjack", target: 2,   label: "Hit 2 blackjacks" },
  { id: "double-1",    type: "double",    target: 1,   label: "Win a doubled hand" },
  { id: "double-2",    type: "double",    target: 2,   label: "Win 2 doubled hands" },
  { id: "split-1",     type: "split",     target: 1,   label: "Win after a split" },
  { id: "pp-1",        type: "pp",        target: 1,   label: "Win a Perfect Pairs bet" },
  { id: "t3-1",        type: "t3",        target: 1,   label: "Win a 21+3 bet" },
  { id: "correct-10",  type: "correct",   target: 10,  label: "Play 10 correct decisions" },
  { id: "correct-20",  type: "correct",   target: 20,  label: "Play 20 correct decisions" },
  { id: "streak-3",    type: "streak",    target: 3,   label: "Reach a 3-win streak" },
  { id: "streak-5",    type: "streak",    target: 5,   label: "Reach a 5-win streak" },
  { id: "profit-200",  type: "profit",    target: 200, label: "Finish ◈ 200 up" },
  { id: "profit-500",  type: "profit",    target: 500, label: "Finish ◈ 500 up" },
  { id: "rounds-15",   type: "rounds",    target: 15,  label: "Play 15 rounds" },
  { id: "rounds-30",   type: "rounds",    target: 30,  label: "Play 30 rounds" },
];

/** Current local-day stamp, e.g. "2026-11-03". */
export function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Simple seeded PRNG so the daily draw is stable across reloads. */
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function seedFromStamp(stamp: string): number {
  // Combine the YYYYMMDD digits into an integer seed.
  let h = 2166136261;
  for (let i = 0; i < stamp.length; i++) {
    h ^= stamp.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Draw 3 missions for a given day, mixed types if possible. */
export function pickDaily(stamp: string): Mission[] {
  const rng = seededRng(seedFromStamp(stamp));
  // Fisher–Yates on a copy
  const pool = [...MISSION_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick 3, preferring type diversity.
  const chosen: MissionDef[] = [];
  const types = new Set<MissionType>();
  for (const m of pool) {
    if (chosen.length === 3) break;
    if (types.has(m.type)) continue;
    chosen.push(m);
    types.add(m.type);
  }
  // Fallback if we didn't fill (shouldn't happen with current pool).
  while (chosen.length < 3) {
    const next = pool.find((m) => !chosen.includes(m));
    if (!next) break;
    chosen.push(next);
  }

  return chosen.map((m) => ({ ...m, progress: 0, completed: false }));
}
