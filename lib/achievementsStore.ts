import { useSyncExternalStore } from "react";
import { ACHIEVEMENTS } from "./achievements";
import { onEvent } from "./events";
import { wallet } from "./wallet";

/**
 * Moteur des succès : écoute les événements des jeux et le solde,
 * puis sauvegarde les succès débloqués dans le navigateur.
 */

export type AchievementState = Record<string, number>;

const EMPTY: AchievementState = {};
const KEY = "royalace:achievements";
const HIGH_ROLLER_BALANCE = 10_000;
const SHARP_MIND_STREAK = 10;
const HOT_STREAK = 5;

let state: AchievementState = EMPTY;
let hydrated = false;
let listening = false;
let correctStreak = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function unlock(id: string) {
  if (state[id]) return;
  state = { ...state, [id]: Date.now() };
  persist();
  emit();
}

function handleEvent(event: Parameters<Parameters<typeof onEvent>[0]>[0], amount = 1) {
  if (event === "bjBlackjack") {
    unlock("bj");
    return;
  }

  if (event === "bjDouble") {
    unlock("double");
    return;
  }

  if (event === "bjSplit") {
    unlock("split");
    return;
  }

  if (event === "bjCorrect") {
    correctStreak += 1;
    if (correctStreak >= SHARP_MIND_STREAK) unlock("sharp");
    return;
  }

  if (event === "bjHand") {
    correctStreak = 0;
    return;
  }

  if (event === "pairWin") {
    unlock("pair");
    return;
  }

  if (event === "suitedWin") {
    unlock("suited");
    return;
  }

  if (event === "bjStreak") {
    if (amount >= HOT_STREAK) unlock("streak5");
    return;
  }
}

export const achievementsStore = {
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
          const cleaned: AchievementState = {};

          for (const [id, value] of Object.entries(saved)) {
            const isValidAchievement = ACHIEVEMENTS.some(
              (achievement) => achievement.id === id,
            );

            if (isValidAchievement && typeof value === "number") {
              cleaned[id] = value;
            }
          }

          state = cleaned;
        }
      }
    } catch {}

    if (!listening) {
      listening = true;
      onEvent(handleEvent);
      wallet.subscribe(() => {
        if (wallet.getBalance() >= HIGH_ROLLER_BALANCE) unlock("rich");
      });
    }

    if (wallet.getBalance() >= HIGH_ROLLER_BALANCE) unlock("rich");
    emit();
  },

  isUnlocked(id: string) {
    return Boolean(state[id]);
  },

  unlockedCount() {
    return Object.keys(state).length;
  },

  /** Pour les tests. */
  _reset() {
    state = EMPTY;
    correctStreak = 0;
    hydrated = false;
    emit();
  },
};

export const useAchievements = () =>
  useSyncExternalStore(achievementsStore.subscribe, achievementsStore.get, () => EMPTY);
