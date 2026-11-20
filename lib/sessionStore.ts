import { useSyncExternalStore } from "react";
import { today } from "./clock";
import { careerStore } from "./career";

type GameDaily = { spins: number; wagered: number; net: number; biggest: number };
export type SessionState = { day: string; slots: GameDaily; bj: GameDaily; roulette: GameDaily; poker: GameDaily; craps: GameDaily; penalty: GameDaily; sports: GameDaily };

const emptyGame = (): GameDaily => ({ spins: 0, wagered: 0, net: 0, biggest: 0 });
const EMPTY: SessionState = { day: "", slots: emptyGame(), bj: emptyGame(), roulette: emptyGame(), poker: emptyGame(), craps: emptyGame(), penalty: emptyGame(), sports: emptyGame() };

const KEY = "royalace:session-today";
let state: SessionState = EMPTY;
let hydrated = false;
let recordedBjIds: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(
  KEY,
  JSON.stringify({ ...state, recordedBjIds })
);
  } catch {}
}

function rollDayIfNeeded() {
  const day = today();
  if (state.day !== day) {
    state = { day, slots: emptyGame(), bj: emptyGame(), roulette: emptyGame(), poker: emptyGame(), craps: emptyGame(), penalty: emptyGame(), sports: emptyGame() };
    persist();
  }
}

function record(game: "slots" | "bj" | "roulette" | "poker" | "craps" | "penalty" | "sports", wagered: number, net: number) {
  rollDayIfNeeded();
  careerStore.record(game, wagered, net);
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
        recordedBjIds = Array.isArray(d.recordedBjIds)
  ? d.recordedBjIds.filter(
      (id: unknown): id is string => typeof id === "string"
    )
  : [];
        if (d && typeof d.day === "string") {
          state = {
            day: d.day,
            slots: { ...emptyGame(), ...d.slots },
            bj: { ...emptyGame(), ...d.bj },
            roulette: { ...emptyGame(), ...d.roulette },
            poker: { ...emptyGame(), ...d.poker },
            craps: { ...emptyGame(), ...d.craps },
            penalty: { ...emptyGame(), ...d.penalty },
            sports: { ...emptyGame(), ...d.sports },
          };
        }
      }
    } catch {}
    rollDayIfNeeded();
    emit();
  },
  recordSlots: (wagered: number, net: number) => record("slots", wagered, net),
  recordBj: (wagered: number, net: number) => record("bj", wagered, net),
  recordRoulette: (wagered: number, net: number) => record("roulette", wagered, net),
  recordPoker: (wagered: number, net: number) => record("poker", wagered, net),
  recordCraps: (wagered: number, net: number) => record("craps", wagered, net),
  recordPenalty: (wagered: number, net: number) => record("penalty", wagered, net),
  recordSports: (wagered: number, net: number) => record("sports", wagered, net),
  recordBjOnce: (id: string, wagered: number, net: number) => {
  sessionStore.hydrate();

  if (recordedBjIds.includes(id)) return;
  careerStore.record("bj", wagered, net);

  const day = today();

  const current: SessionState =
    state.day === day
      ? state
      : {
          day,
          slots: emptyGame(),
          bj: emptyGame(),
          roulette: emptyGame(),
          poker: emptyGame(),
          craps: emptyGame(),
          penalty: emptyGame(),
          sports: emptyGame(),
        };

  const g = current.bj;

  const next: SessionState = {
    ...current,
    bj: {
      spins: g.spins + 1,
      wagered: g.wagered + wagered,
      net: g.net + net,
      biggest: Math.max(g.biggest, net),
    },
  };

  const nextIds = [...recordedBjIds, id].slice(-512);

  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...next,
      recordedBjIds: nextIds,
    })
  );

  state = next;
  recordedBjIds = nextIds;
  emit();
},

  recordSlotAdjustment: (net: number) => {
  rollDayIfNeeded();
  careerStore.record("slots", 0, net);
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