import { useSyncExternalStore } from "react";
import { onEvent, type GameEvent } from "./events";

/**
 * Progression permanente : XP et niveaux.
 * Le magasin écoute les événements déjà émis par les jeux.
 */

export type ProgressionState = {
  xp: number;
  level: number;
  totalSpins: number;
  totalHands: number;
  totalWins: number;
  totalBonuses: number;
  totalVaults: number;
  totalJackpots: number;
};

const EMPTY: ProgressionState = {
  xp: 0,
  level: 1,
  totalSpins: 0,
  totalHands: 0,
  totalWins: 0,
  totalBonuses: 0,
  totalVaults: 0,
  totalJackpots: 0,
};

const KEY = "royalace:progression";
const XP_PER_LEVEL = 500;

const XP_BY_EVENT: Partial<Record<GameEvent, number>> = {
  spin: 10,
  slotWin: 25,
  respin: 10,
  wildExpand: 15,
  bonus: 250,
  vault: 400,
  jackpot: 1000,
  gambleWin: 50,
  bjHand: 10,
  bjWin: 30,
  bjBlackjack: 100,
  bjDouble: 50,
  bjSplit: 40,
  bjCorrect: 5,
};

let state: ProgressionState = EMPTY;
let hydrated = false;
let listening = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

const levelFromXp = (xp: number) => Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);

function handleEvent(event: GameEvent, amount = 1) {
  const gained = XP_BY_EVENT[event];

  if (!gained) return;

  const xpGain = gained * amount;

  state = {
    ...state,
    xp: state.xp + xpGain,
    level: levelFromXp(state.xp + xpGain),
    totalSpins: state.totalSpins + (event === "spin" ? amount : 0),
    totalHands: state.totalHands + (event === "bjHand" ? amount : 0),
    totalWins:
      state.totalWins +
      ((event === "slotWin" || event === "bjWin" || event === "gambleWin")
        ? amount
        : 0),
    totalBonuses: state.totalBonuses + (event === "bonus" ? amount : 0),
    totalVaults: state.totalVaults + (event === "vault" ? amount : 0),
    totalJackpots: state.totalJackpots + (event === "jackpot" ? amount : 0),
  };

  persist();
  emit();
}

export const progressionStore = {
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
        const saved = JSON.parse(raw) as Partial<ProgressionState>;

        state = {
          xp: saved.xp ?? 0,
          level: levelFromXp(saved.xp ?? 0),
          totalSpins: saved.totalSpins ?? 0,
          totalHands: saved.totalHands ?? 0,
          totalWins: saved.totalWins ?? 0,
          totalBonuses: saved.totalBonuses ?? 0,
          totalVaults: saved.totalVaults ?? 0,
          totalJackpots: saved.totalJackpots ?? 0,
        };
      }
    } catch {}

    if (!listening) {
      listening = true;
      onEvent(handleEvent);
    }

    emit();
  },

  reset() {
    state = { ...EMPTY };
    persist();
    emit();
  },
};

export const useProgression = () =>
  useSyncExternalStore(
    progressionStore.subscribe,
    progressionStore.get,
    () => EMPTY,
  );

export const xpInLevel = (xp: number) => xp % XP_PER_LEVEL;

export const xpForNextLevel = () => XP_PER_LEVEL;