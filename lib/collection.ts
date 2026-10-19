import { useSyncExternalStore } from "react";
import { wallet } from "./wallet";

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

const KEY = "royalace:collection:by-bet:v1";

export const COLLECTION_CHIP_MULT = 7;

let states: Record<string, CollectionState> = {};
let hydrated = false;

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const validBet = (bet: number) =>
  Number.isFinite(bet) && bet > 0;

const get = (bet: number): CollectionState =>
  states[String(bet)] ?? EMPTY;

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(states));
  } catch {}
};

function update(bet: number, next: CollectionState) {
  states = {
    ...states,
    [String(bet)]: next,
  };

  persist();
  emit();
}

export const collectionStore = {
  get,

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
        const restored: Record<string, CollectionState> = {};

        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          for (const [key, value] of Object.entries(saved)) {
            if (
              !validBet(Number(key)) ||
              !value ||
              typeof value !== "object"
            ) {
              continue;
            }

            const entry = value as Partial<CollectionState>;

            restored[String(Number(key))] = {
              crowns:
                typeof entry.crowns === "number" &&
                Number.isFinite(entry.crowns)
                  ? Math.max(0, Math.min(Math.floor(entry.crowns), EMPTY.target))
                  : 0,
              target: EMPTY.target,
              claimed:
                typeof entry.claimed === "number" &&
                Number.isFinite(entry.claimed)
                  ? Math.max(0, Math.floor(entry.claimed))
                  : 0,
            };
          }

          states = restored;
        }
      }
    } catch {}

    emit();
  },

  addCrowns(bet: number, amount: number) {
    if (
      !validBet(bet) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    collectionStore.hydrate();

    const current = get(bet);
    const crowns = Math.min(
      current.crowns + Math.floor(amount),
      current.target,
    );

    if (crowns === current.crowns) return;

    update(bet, {
      ...current,
      crowns,
    });
  },

  isReady(bet: number) {
    const current = get(bet);
    return current.crowns >= current.target;
  },

  claimFreeSpins(bet: number): number {
    if (!validBet(bet) || !collectionStore.isReady(bet)) return 0;

    const current = get(bet);

    update(bet, {
      ...current,
      crowns: 0,
      claimed: current.claimed + 1,
    });

    return 5;
  },

  claimChips(bet: number): number {
    if (!validBet(bet) || !collectionStore.isReady(bet)) return 0;

    const current = get(bet);
    const reward = bet * COLLECTION_CHIP_MULT;

    update(bet, {
      ...current,
      crowns: 0,
      claimed: current.claimed + 1,
    });

    wallet.add(reward);

    return reward;
  },

  reset() {
    states = {};
    persist();
    emit();
  },
};

export const useCollection = (bet: number) =>
  useSyncExternalStore(
    collectionStore.subscribe,
    () => collectionStore.get(bet),
    () => EMPTY,
  );