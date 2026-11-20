/**
 * Penalty shoot-out, cash-out style.
 *
 * - The player stakes a bet and takes up to five penalties.
 * - Each shot is a goal one time in two (the keeper guesses your corner
 *   half the time), drawn with crypto randomness.
 * - After k goals the round is worth bet × 0.96 × 2^k: 1.92×, 3.84×,
 *   7.68×, 15.36×, 30.72×. A save loses the bet. The player may cash out
 *   after any goal; the fifth goal cashes out on its own.
 * - Return to player: 96% whatever the moment you cash out.
 */

export type Zone = "tl" | "tr" | "c" | "bl" | "br";
export const ZONES: Zone[] = ["tl", "tr", "c", "bl", "br"];
export const ZONE_LABEL: Record<Zone, string> = { tl: "Top left", tr: "Top right", c: "Centre", bl: "Bottom left", br: "Bottom right" };

export const MAX_SHOTS = 5;
export const RTP = 0.96;
export const GOAL_CHANCE = 0.5;
/** Multiplier after k goals (k ≥ 1). */
export const multiplierAt = (k: number) => (k <= 0 ? 0 : Math.round(RTP * 2 ** k * 100) / 100);
export const LADDER = Array.from({ length: MAX_SHOTS }, (_, i) => multiplierAt(i + 1));

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
export function shoot(aim: Zone): { goal: boolean; dive: Zone } {
  const goal = fair() >= 1 - GOAL_CHANCE;
  if (!goal) return { goal, dive: aim };
  const others = ZONES.filter((z) => z !== aim);
  return { goal, dive: others[Math.floor(fair() * others.length) % others.length] };
}

/** Chips paid when cashing out after `goals` goals. */
export const payout = (bet: number, goals: number) => Math.floor(bet * multiplierAt(goals));
