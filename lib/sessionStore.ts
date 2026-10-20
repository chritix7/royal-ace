import { useSyncExternalStore } from "react";
import { today } from "./clock";

type GameDaily = { spins: number; wagered: number; net: number; biggest: number };
export type SessionState = { day: string; slots: GameDaily; bj: GameDaily };

const emptyGame = (): GameDaily => ({ spins: 0, wagered: 0, net: 0, biggest: 0 });
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

function record(game: "slots" | "bj", wagered: number, net: number) {
  rollDayIfNeeded();
  const g = state[game];
  state = {
    ...state,
    [game]: {
      spins: g.spins + 1,
      wagered: g.wagered + wagered,
      net: g.net + net,
      biggest: Math.max(g.biggest, net),
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
  recordSlots: (wagered: number, net: number) => record("slots", wagered, net),
  recordBj: (wagered: number, net: number) => record("bj", wagered, net),

  recordSlotAdjustment: (net: number) => {
  rollDayIfNeeded();
  const g = state.slots;
  state = {
    ...state,
    slots: { ...g, net: g.net + net },
  };
  persist();
  emit();
  },
};

export const useSession = () =>
  useSyncExternalStore(sessionStore.subscribe, sessionStore.get, () => EMPTY);