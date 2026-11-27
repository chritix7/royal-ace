import { useSyncExternalStore } from "react";
import { dayNumber, today } from "./clock";

/**
 * The player's career money figures, fed by every settled round (through
 * the session store): this week's net (for the weekly ranking) and the
 * all-time totals and biggest win (for the VIP card). Kept in the browser.
 */
export type Career = {
  weekStart: number;
  weekNet: number;
  weekWagered: number;
  weekRounds: number;
  allNet: number;
  allWagered: number;
  allRounds: number;
  since: string;
  biggest: { amount: number; game: string; day: string } | null;
};
const KEY = "royalace:career-money";
const mondayOf = (n: number) => n - ((n + 3) % 7); // day 0 (1970-01-01) was a Thursday
const EMPTY: Career = { weekStart: 0, weekNet: 0, weekWagered: 0, weekRounds: 0, allNet: 0, allWagered: 0, allRounds: 0, since: "", biggest: null };

let state: Career = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
/** Called with every settled round (the online ranking listens here). */
const roundListeners = new Set<(game: string, wagered: number, net: number) => void>();
export function onRound(l: (game: string, wagered: number, net: number) => void) {
  roundListeners.add(l);
  return () => {
    roundListeners.delete(l);
  };
}

function rollWeek() {
  const monday = mondayOf(dayNumber(today()));
  if (state.weekStart !== monday) state = { ...state, weekStart: monday, weekNet: 0, weekWagered: 0, weekRounds: 0 };
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export const careerStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<Career>) };
    } catch {}
    if (!state.since) state = { ...state, since: today() };
    rollWeek();
    persist();
    emit();
  },
  /** One settled round: stake and net result (net < 0 when lost). */
  record(game: string, wagered: number, net: number) {
    careerStore.hydrate();
    roundListeners.forEach((l) => l(game, wagered, net));
    rollWeek();
    const big = state.biggest;
    state = {
      ...state,
      weekNet: state.weekNet + net,
      weekWagered: state.weekWagered + wagered,
      weekRounds: state.weekRounds + (wagered > 0 ? 1 : 0),
      allNet: state.allNet + net,
      allWagered: state.allWagered + wagered,
      allRounds: state.allRounds + (wagered > 0 ? 1 : 0),
      biggest: net > 0 && (!big || net > big.amount) ? { amount: net, game, day: today() } : big,
    };
    persist();
    emit();
  },
};

export const useCareer = () => useSyncExternalStore(careerStore.subscribe, careerStore.get, () => EMPTY);
