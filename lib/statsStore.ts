import { useSyncExternalStore } from "react";
import { onEvent, type GameEvent } from "./events";

/**
 * Statistiques globales : les jeux annoncent leurs événements,
 * et ce magasin compte l'activité sans connaître leur interface.
 */

export type GlobalStats = {
  spins: number;
  slotWins: number;
  bonuses: number;
  vaults: number;
  jackpots: number;
  wildExpands: number;
  respins: number;
  gambleWins: number;
  bjHands: number;
  bjWins: number;
  blackjacks: number;
  doubledWins: number;
  splitWins: number;
  correctDecisions: number;
};

const EMPTY: GlobalStats = {
  spins: 0,
  slotWins: 0,
  bonuses: 0,
  vaults: 0,
  jackpots: 0,
  wildExpands: 0,
  respins: 0,
  gambleWins: 0,
  bjHands: 0,
  bjWins: 0,
  blackjacks: 0,
  doubledWins: 0,
  splitWins: 0,
  correctDecisions: 0,
};

const KEY = "royalace:global-stats";

let state: GlobalStats = EMPTY;
let hydrated = false;
let listening = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function add(key: keyof GlobalStats, amount = 1) {
  if (amount <= 0) return;
  state = { ...state, [key]: state[key] + amount };
  persist();
  emit();
}

function handleEvent(event: GameEvent, amount = 1) {
  switch (event) {
    case "spin":
      return add("spins", amount);
    case "slotWin":
      return add("slotWins", amount);
    case "bonus":
      return add("bonuses", amount);
    case "vault":
      return add("vaults", amount);
    case "jackpot":
      return add("jackpots", amount);
    case "wildExpand":
      return add("wildExpands", amount);
    case "respin":
      return add("respins", amount);
    case "gambleWin":
      return add("gambleWins", amount);
    case "bjHand":
      return add("bjHands", amount);
    case "bjWin":
      return add("bjWins", amount);
    case "bjBlackjack":
      return add("blackjacks", amount);
    case "bjDouble":
      return add("doubledWins", amount);
    case "bjSplit":
      return add("splitWins", amount);
    case "bjCorrect":
      return add("correctDecisions", amount);
    default:
      return;
  }
}

export const statsStore = {
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
        const saved: unknown = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          const cleaned: GlobalStats = { ...EMPTY };
          for (const [key, value] of Object.entries(saved)) {
            if (key in EMPTY && typeof value === "number" && value >= 0) {
              cleaned[key as keyof GlobalStats] = value;
            }
          }
          state = cleaned;
        }
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

export const useStats = () =>
  useSyncExternalStore(statsStore.subscribe, statsStore.get, () => EMPTY);
