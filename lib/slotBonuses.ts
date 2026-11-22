import { useSyncExternalStore } from "react";

/** Free-spin bonuses played at the slot machine (last 30), kept in the browser. */
export type BonusRecord = { at: number; win: number; spins: number; bet: number; retriggers: number; best: number; bought: boolean };
const KEY = "royalace:slot-bonuses";
let list: BonusRecord[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: BonusRecord[] = [];

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(s)) list = s.slice(0, 30);
  } catch {}
}
export const slotBonuses = {
  get: () => {
    load();
    return list;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  add(r: BonusRecord) {
    load();
    list = [r, ...list].slice(0, 30);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {}
    listeners.forEach((l) => l());
  },
};
export const useSlotBonuses = () => useSyncExternalStore(slotBonuses.subscribe, slotBonuses.get, () => EMPTY);
