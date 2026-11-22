import { useSyncExternalStore } from "react";
import type { Advice } from "./blackjack";

/**
 * Basic-strategy record of the player's blackjack decisions: accuracy by
 * hand type and by the right play, and the last mistakes. Kept in the browser.
 */
export type HandKind = "Hard" | "Soft" | "Pairs";
type Cell = { n: number; ok: number };
export type CoachState = {
  byKind: Record<HandKind, Cell>;
  byBest: Record<Advice, Cell>;
  mistakes: { hand: string; up: string; chose: Advice; best: Advice; at: number }[];
};
const KEY = "royalace:bj-coach";
const cell = (): Cell => ({ n: 0, ok: 0 });
const EMPTY: CoachState = {
  byKind: { Hard: cell(), Soft: cell(), Pairs: cell() },
  byBest: { Hit: cell(), Stand: cell(), Double: cell(), Split: cell(), Surrender: cell() },
  mistakes: [],
};
let state: CoachState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<CoachState> | null;
    if (s) state = { byKind: { ...EMPTY.byKind, ...s.byKind }, byBest: { ...EMPTY.byBest, ...s.byBest }, mistakes: Array.isArray(s.mistakes) ? s.mistakes.slice(0, 12) : [] };
  } catch {}
}

export const bjCoach = {
  get: () => {
    load();
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  record(kind: HandKind, hand: string, up: string, chose: Advice, best: Advice) {
    load();
    const ok = chose === best ? 1 : 0;
    const bump = (c: Cell) => ({ n: c.n + 1, ok: c.ok + ok });
    state = {
      byKind: { ...state.byKind, [kind]: bump(state.byKind[kind]) },
      byBest: { ...state.byBest, [best]: bump(state.byBest[best]) },
      mistakes: ok ? state.mistakes : [{ hand, up, chose, best, at: Date.now() }, ...state.mistakes].slice(0, 12),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
    listeners.forEach((l) => l());
  },
  reset() {
    state = EMPTY;
    try {
      localStorage.removeItem(KEY);
    } catch {}
    listeners.forEach((l) => l());
  },
};
export const useCoach = () => useSyncExternalStore(bjCoach.subscribe, bjCoach.get, () => EMPTY);
