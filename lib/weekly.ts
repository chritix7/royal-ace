import { useSyncExternalStore } from "react";
import { dayNumber, today } from "./clock";
import { onEvent, type GameEvent } from "./events";

export type WeeklyState = {
  weekStart: number | null;
  points: number;
  previousPoints: number;
};

const EMPTY: WeeklyState = {
  weekStart: null,
  points: 0,
  previousPoints: 0,
};

const KEY = "royalace:weekly:v1";

export const WEEKLY_POINTS: Partial<Record<GameEvent, number>> = {
  spin: 10,
  bjHand: 10,
  slotWin: 20,
  bjWin: 20,
  bonus: 100,
  vault: 150,
  jackpot: 500,
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
};

export const useWeekly = () =>
  useSyncExternalStore(
    weeklyStore.subscribe,
    weeklyStore.get,
    () => EMPTY,
  );