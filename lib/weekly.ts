import { useSyncExternalStore } from "react";
import { dayNumber, today } from "./clock";
import { onEvent, type GameEvent } from "./events";
import { wallet } from "./wallet";

export type WeeklyState = {
  weekStart: number | null;
  points: number;
  previousPoints: number;
  /** Weekly chests already opened this week (indexes in WEEKLY_TIERS). */
  claimed: number[];
};

const EMPTY: WeeklyState = {
  weekStart: null,
  points: 0,
  previousPoints: 0,
  claimed: [],
};

/** Weekly chests: points earned in every game, opened once each per week. */
export const WEEKLY_TIERS = [
  { label: "Bronze chest", points: 3000, reward: 40000 },
  { label: "Silver chest", points: 10000, reward: 120000 },
  { label: "Gold chest", points: 25000, reward: 300000 },
];

const KEY = "royalace:weekly:v1";

export const WEEKLY_POINTS: Partial<Record<GameEvent, number>> = {
  spin: 10,
  bjHand: 10,
  slotWin: 20,
  bjWin: 20,
  bonus: 100,
  vault: 150,
  jackpot: 500,
  rouletteSpin: 10,
  rouletteWin: 20,
  rouletteStraight: 100,
  pokerHand: 10,
  pokerWin: 20,
  pokerBonus: 80,
  crapsRoll: 8,
  crapsWin: 15,
  crapsPoint: 40,
  bjBlackjack: 60,
  rouletteLightning: 150,
  pokerFlush: 100,
  crapsHard: 80,
  penaltyRound: 10,
  penaltyGoal: 6,
  penaltyCashout: 15,
  penaltyBigWin: 120,
  penaltyPerfect: 200,
  betPlaced: 12,
  betCombo: 20,
  betWon: 30,
  betComboWon: 100,
  betBigWin: 150,
};

let state: WeeklyState = EMPTY;
let hydrated = false;
let listening = false;

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

function currentWeekStart(): number {
  const day = dayNumber(today());
  const daysSinceMonday = ((day + 3) % 7 + 7) % 7;

  return day - daysSinceMonday;
}

function safePoints(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function rollWeek(): boolean {
  const weekStart = currentWeekStart();

  if (!Number.isFinite(weekStart)) return false;
  if (state.weekStart === weekStart) return false;

  const isFollowingWeek =
    state.weekStart !== null &&
    weekStart - state.weekStart === 7;

  state = {
    weekStart,
    points: 0,
    previousPoints: isFollowingWeek ? state.points : 0,
    claimed: [],
  };

  return true;
}

function handleEvent(event: GameEvent, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const changedWeek = rollWeek();
  const pointsPerEvent = WEEKLY_POINTS[event] ?? 0;

  if (pointsPerEvent > 0) {
    state = {
      ...state,
      points:
        state.points +
        pointsPerEvent * Math.floor(amount),
    };
  }

  if (changedWeek || pointsPerEvent > 0) {
    persist();
    emit();
  }
}

export const weeklyStore = {
  get: () => state,

  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  hydrate() {
    if (hydrated || typeof window === "undefined") return;

    hydrated = true;

    try {
      const raw = localStorage.getItem(KEY);

      if (raw) {
        const saved = JSON.parse(raw) as Partial<WeeklyState>;

        if (
          saved &&
          typeof saved.weekStart === "number" &&
          Number.isInteger(saved.weekStart) &&
          ((saved.weekStart + 3) % 7 + 7) % 7 === 0
        ) {
          state = {
            weekStart: saved.weekStart,
            points: safePoints(saved.points),
            previousPoints: safePoints(saved.previousPoints),
            claimed: Array.isArray(saved.claimed) ? saved.claimed.filter((x): x is number => typeof x === "number") : [],
          };
        }
      }
    } catch {}

    rollWeek();

    if (!listening) {
      listening = true;
      onEvent(handleEvent);
    }

    persist();
    emit();
  },

  refresh() {
    if (!hydrated) {
      weeklyStore.hydrate();
      return;
    }

    if (rollWeek()) {
      persist();
      emit();
    }
  },

  /** Opens a weekly chest once its points are reached. Returns the chips paid. */
  claim(tier: number): number {
    rollWeek();
    const t = WEEKLY_TIERS[tier];
    if (!t || state.points < t.points || state.claimed.includes(tier) || wallet.getLocked()) return 0;
    state = { ...state, claimed: [...state.claimed, tier] };
    persist();
    wallet.add(t.reward);
    emit();
    return t.reward;
  },
};

export const useWeekly = () =>
  useSyncExternalStore(
    weeklyStore.subscribe,
    weeklyStore.get,
    () => EMPTY,
  );