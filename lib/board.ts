/**
 * Weekly ranking rules, shared by the browser and the server.
 *
 * Score = net chips won this week from real rounds (signed-in players only).
 * Stakes above STAKE_CAP count as STAKE_CAP, so a giant balance (gifted or
 * edited) can't buy the top spot. The server rejects impossible rounds and
 * holds back players whose results are statistically implausible.
 */
export const BOARD_GAMES = ["slots", "bj", "roulette", "poker", "craps", "penalty", "sports", "gamble"] as const;
export type BoardGame = (typeof BOARD_GAMES)[number];

/** Highest payout a single round can return, as a multiple of its stake (generous). */
export const MAX_RETURN: Record<BoardGame, number> = {
  slots: 20000,
  bj: 100000, // the progressive blackjack pot can dwarf a small hand
  roulette: 600,
  poker: 300,
  craps: 40,
  penalty: 100,
  sports: 10000,
  gamble: 2,
};

/** Stakes above this count as this much in the ranking. */
export const STAKE_CAP = 500_000;
/** A "big hit" returns at least this many times its stake. */
export const BIG_HIT = 100;
/** Most rounds a player can report per minute (turbo auto-spin included). */
export const MAX_PER_MIN = 150;
/** Most rounds in one report. */
export const MAX_BATCH = 80;

export type Round = [game: BoardGame, wagered: number, net: number];

export type WeekStats = { rounds: number; staked: number; won: number; score: number; big: number; max: number; bad: number; ok?: number; hidden?: number };

/** Public name: 2 to 16 letters, digits, space, . _ - ' (same rule as the lobby nickname). */
export function boardName(raw: unknown) {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 16);
  return /^[\p{L}\p{N} ._'-]{2,16}$/u.test(s) ? s : "Player";
}

/** Monday 00:00 UTC of the current week, as "2026-11-23". */
export function weekKey(now = Date.now()) {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7;
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  return m.toISOString().slice(0, 10);
}
/** Next Monday 00:00 UTC (ms). */
export function weekEnds(now = Date.now()) {
  return Date.parse(`${weekKey(now)}T00:00:00Z`) + 7 * 86400000;
}

/** A round as it counts in the ranking, or null if it's impossible. */
export function countRound(r: unknown): { stake: number; ret: number; net: number; big: boolean } | null {
  if (!Array.isArray(r) || r.length !== 3) return null;
  const [g, w, n] = r as [unknown, unknown, unknown];
  if (typeof g !== "string" || !(BOARD_GAMES as readonly string[]).includes(g)) return null;
  if (typeof w !== "number" || typeof n !== "number" || !Number.isFinite(w) || !Number.isFinite(n)) return null;
  if (w <= 0 || w > 1e13) return null;
  const ret = w + n;
  if (ret < -1e-6 || ret > w * MAX_RETURN[g as BoardGame] + 1) return null;
  const f = Math.min(1, STAKE_CAP / w);
  const stake = w * f;
  const cret = ret * f;
  return { stake, ret: cret, net: cret - stake, big: ret >= w * BIG_HIT };
}

/** Why a player's week is held back for review, or null if it looks genuine. */
export function suspicious(s: WeekStats): string | null {
  if (s.ok) return null;
  if (s.bad >= 3) return "impossible-rounds";
  if (s.big > 3 + s.rounds / 150) return "too-many-big-hits";
  // Return excluding the single best win: honest play sits near 0.9–1.
  if (s.rounds >= 300 && s.staked > 0 && (s.won - s.max) / s.staked > 1.5) return "return-too-high";
  return null;
}

/** The player's game key → ranking game (slot gamble adjustments have no stake). */
export function toRound(game: string, wagered: number, net: number): Round | null {
  if (wagered > 0 && (BOARD_GAMES as readonly string[]).includes(game)) return [game as BoardGame, Math.round(wagered), Math.round(net)];
  if (wagered === 0 && game === "slots" && net !== 0) return ["gamble", Math.abs(Math.round(net)), Math.round(net)];
  return null;
}

/** Weekly podium prizes (chips) — paid once, the trophy stays forever. */
export const PODIUM_PRIZES = [250_000, 100_000, 50_000];
/** The week before `wk` ("2026-11-23" → "2026-11-16"). */
export const prevWeek = (wk: string) => new Date(Date.parse(`${wk}T00:00:00Z`) - 7 * 86400000).toISOString().slice(0, 10);
export type Trophy = { week: string; place: 1 | 2 | 3; score: number };
