import { useSyncExternalStore } from "react";
import { isNextDay, today } from "./clock";
import { wallet } from "./wallet";

/** Bonus quotidien : 200 chips le premier jour, +100 par jour consécutif, jusqu'à 800 le 7e jour. */
export const DAILY_BASE = 200;
export const DAILY_STEP = 100;
export const DAILY_MAX_DAYS = 7;

export type DailyState = { lastClaim: string | null; streak: number };
const EMPTY: DailyState = { lastClaim: null, streak: 0 };

/** Récompense du Nième jour de la série (plafonnée au 7e). */
export const dailyReward = (streakDay: number) => DAILY_BASE + DAILY_STEP * (Math.min(Math.max(streakDay, 1), DAILY_MAX_DAYS) - 1);

/** Peut-on réclamer aujourd'hui, et quel jour de la série serait-ce ? */
export function dailyStatus(state: DailyState, day: string) {
  if (state.lastClaim === day) return { canClaim: false, streakDay: state.streak, reward: 0 };
  const streakDay = state.lastClaim && isNextDay(state.lastClaim, day) ? state.streak + 1 : 1;
  return { canClaim: true, streakDay, reward: dailyReward(streakDay) };
}

const KEY = "royalace:daily";
let state: DailyState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

export const dailyStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  hydrate() {
    if (hydrated) return;
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        state = {
          lastClaim: typeof d.lastClaim === "string" ? d.lastClaim : null,
          streak: Number.isInteger(d.streak) && d.streak > 0 ? d.streak : 0,
        };
      }
    } catch {}
    emit();
  },
  /** Réclame le bonus du jour. Renvoie le nombre de chips gagnées (0 si déjà réclamé). */
  claim(): number {
    const day = today();
    const st = dailyStatus(state, day);
    if (!st.canClaim) return 0;
    state = { lastClaim: day, streak: st.streakDay };
    persist();
    wallet.add(st.reward);
    emit();
    return st.reward;
  },
  /** Pour les tests. */
  _reset() {
    state = EMPTY;
    hydrated = false;
    emit();
  },
};

export const useDaily = () => useSyncExternalStore(dailyStore.subscribe, dailyStore.get, () => EMPTY);