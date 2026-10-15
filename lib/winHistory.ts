import { useSyncExternalStore } from "react";

/**
 * Historique des grosses victoires.
 * Les jeux appelleront winHistory.record() lors d'un jackpot, coffre,
 * gros gain ou blackjack. L'interface sera ajoutée ensuite.
 */

export type WinGame = "slots" | "blackjack";
export type WinKind = "bigWin" | "vault" | "jackpot" | "blackjack";
export type WinEntry = {
  id: number;
  game: WinGame;
  kind: WinKind;
  amount: number;
  at: number;
};

const EMPTY: WinEntry[] = [];
const KEY = "royalace:win-history";
const MAX_ENTRIES = 50;

let entries: WinEntry[] = EMPTY;
let nextId = 1;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {}
}

export const winHistory = {
  get: () => entries,

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
        if (Array.isArray(saved)) {
          entries = saved
            .filter(
              (item): item is WinEntry =>
                item &&
                typeof item === "object" &&
                typeof item.id === "number" &&
                (item.game === "slots" || item.game === "blackjack") &&
                (item.kind === "bigWin" || item.kind === "vault" || item.kind === "jackpot" || item.kind === "blackjack") &&
                typeof item.amount === "number" &&
                typeof item.at === "number",
            )
            .slice(0, MAX_ENTRIES);
          nextId = entries.reduce((max, item) => Math.max(max, item.id + 1), 1);
        }
      }
    } catch {}

    emit();
  },

  record(input: { game: WinGame; kind: WinKind; amount: number }) {
    if (input.amount <= 0) return;

    const entry: WinEntry = {
      id: nextId++,
      game: input.game,
      kind: input.kind,
      amount: input.amount,
      at: Date.now(),
    };

    entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    persist();
    emit();
  },

  clear() {
    entries = EMPTY;
    nextId = 1;
    persist();
    emit();
  },
};

export const useWinHistory = () =>
  useSyncExternalStore(winHistory.subscribe, winHistory.get, () => EMPTY);
