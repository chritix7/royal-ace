import { useSyncExternalStore } from "react";
import { today } from "./clock";

type GameDaily = { spins: number; wagered: number; won: number; biggest: number };
export type SessionState = { day: string; slots: GameDaily; bj: GameDaily };

const emptyGame = (): GameDaily => ({ spins: 0, wagered: 0, won: 0, biggest: 0 });
const EMPTY: SessionState = { day: "", slots: emptyGame(), bj: emptyGame() };

const KEY = "royalace:session-today";
let state: SessionState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function rollDayIfNeeded() {
  const day = today();
  if (state.day !== day) {
    state = { day, slots: emptyGame(), bj: emptyGame() };
    persist();
  }
}

function record(game: "slots" | "bj", wagered: number, won: number) {
  rollDayIfNeeded();
  const g = state[game];
  state = {
    ...state,
    [game]: {
      spins: g.spins + 1,
      wagered: g.wagered + wagered,
      won: g.won + won,
      biggest: Math.max(g.biggest, won),
    },
  };
  persist();
  emit();
}

export const sessionStore = {
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
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d.day === "string") {
          state = {
            day: d.day,
            slots: { ...emptyGame(), ...d.slots },
            bj: { ...emptyGame(), ...d.bj },
          };
        }
      }
    } catch {}
    rollDayIfNeeded();
    emit();
  },
  recordSlots: (wagered: number, won: number) => record("slots", wagered, won),
  recordBj: (wagered: number, won: number) => record("bj", wagered, won),
};

export const useSession = () =>
  useSyncExternalStore(sessionStore.subscribe, sessionStore.get, () => EMPTY);