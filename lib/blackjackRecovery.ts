import type { S } from "./game";

const KEY = "royalace:blackjack-recovery-v1";

export type RoundBreakdown = {
  main: number;
  insurance: number;
  perfectPairs: number;
  twentyOnePlusThree: number;
  total: number;
};

export type RoundSides = {
  wagered: number;
  perfectPairs: number;
  twentyOnePlusThree: number;
};

export type ActionName =
  | "deal"
  | "insurance"
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "surrender";

export type Snapshot = {
  state: S;
  sides: RoundSides;
  breakdown: RoundBreakdown | null;
};

export type PendingAction = {
  id: string;
  name: ActionName;
  take?: boolean;
  seed: number;
  effects: string[];
};

export type RecoverySave = {
  version: 1;
  snapshot: Snapshot;
  pending: PendingAction | null;
};

const phases = new Set([
  "betting",
  "dealing",
  "insurance",
  "player",
  "dealer",
  "settled",
]);

const actions = new Set([
  "deal",
  "insurance",
  "hit",
  "stand",
  "double",
  "split",
  "surrender",
]);

export function readRecovery(): RecoverySave | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  const d = JSON.parse(raw) as RecoverySave;
  const s = d?.snapshot?.state;
  const sides = d?.snapshot?.sides;

  if (
    d.version !== 1 ||
    !s ||
    !phases.has(s.phase) ||
    !Array.isArray(s.hands) ||
    !Array.isArray(s.dealer) ||
    !Array.isArray(s.shoe) ||
    !Array.isArray(s.history) ||
    !Array.isArray(s.trend) ||
    !s.stats ||
    !s.settings ||
    !s.records ||
    !Array.isArray(s.unlocked) ||
    !Number.isFinite(s.balance) ||
    s.balance < 0 ||
    !sides ||
    !Number.isFinite(sides.wagered) ||
    !Number.isFinite(sides.perfectPairs) ||
    !Number.isFinite(sides.twentyOnePlusThree)
  ) {
    throw new Error("Invalid Blackjack recovery data.");
  }

  if (
    d.pending &&
    (
      !actions.has(d.pending.name) ||
      typeof d.pending.id !== "string" ||
      !Number.isFinite(d.pending.seed) ||
      !Array.isArray(d.pending.effects)
    )
  ) {
    throw new Error("Invalid pending Blackjack action.");
  }

  return d;
}

export function writeRecovery(save: RecoverySave) {
  localStorage.setItem(KEY, JSON.stringify(save));
}

export function createPending(
  name: ActionName,
  take?: boolean
): PendingAction {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);

  return {
    id: `bj-${Date.now()}-${values[0]}-${values[1]}`,
    name,
    take,
    seed: values[0],
    effects: [],
  };
}

export function seededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}