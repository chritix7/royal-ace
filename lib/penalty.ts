/**
 * Penalty shoot-out, cash-out style.
 *
 * - The player stakes a bet and takes up to five penalties.
 * - Each shot beats the keeper with a fixed chance (Rookie 62%, Pro 50%,
 *   Legend 40%), drawn with crypto randomness.
 * - After k goals the round is worth bet × 0.96 / p^k (Pro: 1.92×, 3.84×,
 *   7.68×, 15.36×, 30.72×; Legend up to 93.75×). A save loses the bet. The player may cash out
 *   after any goal; the fifth goal cashes out on its own.
 * - Return to player: 96% whatever the moment you cash out.
 */

export type Zone = "tl" | "tr" | "c" | "bl" | "br";
export const ZONES: Zone[] = ["tl", "tr", "c", "bl", "br"];
export const ZONE_LABEL: Record<Zone, string> = { tl: "Top left", tr: "Top right", c: "Centre", bl: "Bottom left", br: "Bottom right" };

export const MAX_SHOTS = 5;
export const RTP = 0.96;

/** Three keepers: the better he is, the higher the ladder climbs. Same 96% return. */
export type Level = "easy" | "normal" | "legend";
export const LEVELS: { id: Level; label: string; short: string; goal: number }[] = [
  { id: "easy", label: "Rookie", short: "Rookie", goal: 0.62 },
  { id: "normal", label: "Pro", short: "Pro", goal: 0.5 },
  { id: "legend", label: "Legend", short: "Legend", goal: 0.4 },
];
/** Three penalty takers: steadier shooters score more often, flair pays more. Same 96% return. */
export type Shooter = "captain" | "striker" | "wonderkid";
export const SHOOTERS: { id: Shooter; name: string; number: number; delta: number; acc: number; pwr: number; blurb: string }[] = [
  { id: "captain", name: "The Captain", number: 8, delta: 0.05, acc: 92, pwr: 70, blurb: "Cool head, places it" },
  { id: "striker", name: "The Striker", number: 9, delta: 0, acc: 84, pwr: 84, blurb: "Balanced, clinical" },
  { id: "wonderkid", name: "The Wonderkid", number: 10, delta: -0.05, acc: 74, pwr: 95, blurb: "All power, higher ladder" },
];
const shooterDelta = (s: Shooter = "striker") => SHOOTERS.find((x) => x.id === s)?.delta ?? 0;
export const goalChance = (level: Level = "normal", shooter: Shooter = "striker") => (LEVELS.find((l) => l.id === level)?.goal ?? 0.5) + shooterDelta(shooter);
export const GOAL_CHANCE = 0.5;
/** Multiplier after k goals (k ≥ 1) for a keeper level and a penalty taker. */
export const multiplierAt = (k: number, level: Level = "normal", shooter: Shooter = "striker") => (k <= 0 ? 0 : Math.round((RTP / goalChance(level, shooter) ** k) * 100) / 100);
export const ladderOf = (level: Level = "normal", shooter: Shooter = "striker") => Array.from({ length: MAX_SHOTS }, (_, i) => multiplierAt(i + 1, level, shooter));
export const LADDER = ladderOf("normal");

export const MIN_BET = 10;
export const MAX_BET = 100000;
export const PENALTY_CHIPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

/** One fair coin from crypto. */
function fair(): number {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const b = new Uint32Array(1);
    c.getRandomValues(b);
    return b[0] / 0x100000000;
  }
  return Math.random();
}

/** Takes a shot at `aim`: a goal or a save, and where the keeper dives. */
export function shoot(aim: Zone, level: Level = "normal", shooter: Shooter = "striker"): { goal: boolean; dive: Zone } {
  const goal = fair() >= 1 - goalChance(level, shooter);
  if (!goal) return { goal, dive: aim };
  const others = ZONES.filter((z) => z !== aim);
  return { goal, dive: others[Math.floor(fair() * others.length) % others.length] };
}

/** Chips paid when cashing out after `goals` goals. */
export const payout = (bet: number, goals: number, level: Level = "normal", shooter: Shooter = "striker") => Math.floor(bet * multiplierAt(goals, level, shooter));
