import { useSyncExternalStore } from "react";
import { onEvent, type GameEvent } from "./events";
import { wallet } from "./wallet";

/**
 * Collection Meter : chaque couronne (scatter) remplit la jauge.
 * À 10 couronnes, le joueur reçoit une récompense puis la jauge se vide.
 */

export type CollectionState = {
  crowns: number;
  target: number;
  claimed: number;
};

const EMPTY: CollectionState = {
  crowns: 0,
  target: 10,
  claimed: 0,
};

const KEY = "royalace:collection";
const CROWN_XP = 1;

let state: CollectionState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

function handleEvent(event: GameEvent, amount = 1) {
  if (event !== "spin") return;

  // Les scatters sont comptés via l'événement bonus existant :
  // chaque déclenchement de free spins correspond à une série de couronnes.
  if (amount <= 0) return;
}

export const collectionStore = {
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
        const saved = JSON.parse(raw) as Partial<CollectionState>;

        state = {
          crowns: Math.max(0, Math.min(saved.crowns ?? 0, EMPTY.target)),
          target: EMPTY.target,
          claimed: Math.max(0, saved.claimed ?? 0),
        };
      }
    } catch {}

    emit();
  },

  addCrowns(amount: number) {
    if (amount <= 0) return;

    const crowns = Math.min(state.crowns + amount, state.target);

    state = { ...state, crowns };
    persist();
    emit();
  },

  isReady() {
    return state.crowns >= state.target;
  },

  claimFreeSpins(): number {
    if (!collectionStore.isReady()) return 0;

    state = {
      ...state,
      crowns: 0,
      claimed: state.claimed + 1,
    };

    persist();
    emit();

    return 5;
  },

  claimChips(): number {
    if (!collectionStore.isReady()) return 0;

    const reward = 1500;

    state = {
      ...state,
      crowns: 0,
      claimed: state.claimed + 1,
    };

    persist();
    wallet.add(reward);
    emit();

    return reward;
  },

  reset() {
    state = { ...EMPTY };
    persist();
    emit();
  },
};

export const useCollection = () =>
  useSyncExternalStore(
    collectionStore.subscribe,
    collectionStore.get,
    () => EMPTY,
  );