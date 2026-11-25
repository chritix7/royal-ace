import { dayNumber, today } from "./clock";
import type { GameEvent } from "./events";

/** One game a day gives double XP. Same for everyone, changes at midnight. */
export const DAY_GAMES = ["blackjack", "slots", "roulette", "poker", "craps", "penalty", "sports"] as const;
export type DayGame = (typeof DAY_GAMES)[number];

export function gameOfDay(key = today()): DayGame {
  const n = dayNumber(key);
  // A small stride so the same game never comes back two days in a row.
  return DAY_GAMES[(((n * 3) % DAY_GAMES.length) + DAY_GAMES.length) % DAY_GAMES.length];
}

const SLOT_EVENTS = new Set<GameEvent>(["spin", "slotWin", "bigWin", "bonus", "vault", "jackpot", "wildExpand", "respin", "gambleWin"]);

/** Which game an event comes from. */
export function gameOfEvent(e: GameEvent): DayGame | null {
  if (SLOT_EVENTS.has(e)) return "slots";
  if (e.startsWith("bj") || e === "pairWin" || e === "suitedWin") return "blackjack";
  if (e.startsWith("roulette")) return "roulette";
  if (e.startsWith("poker")) return "poker";
  if (e.startsWith("craps")) return "craps";
  if (e.startsWith("penalty")) return "penalty";
  if (e.startsWith("bet")) return "sports";
  return null;
}

export const DAY_XP_MULT = 2;
