import { useSyncExternalStore } from "react";
import { today } from "./clock";
import { shop } from "./shop";
import { wallet } from "./wallet";

/**
 * Advent calendar: one door a day from 1 to 24 December. A missed door can
 * still be opened later, until 31 December. Rewards are chips, plus two
 * exclusive items: the "Winter Star" title (day 12) and the "Frost gold"
 * VIP card (day 24). Kept with the rest of the progress (cloud-synced).
 */
export type AdventReward = { chips: number; item?: string; label?: string };

export function adventReward(day: number): AdventReward {
  if (day === 24) return { chips: 250_000, item: "card:frost", label: "Frost gold VIP card" };
  if (day === 12) return { chips: 30_000, item: "title:winter", label: "Winter Star title" };
  if (day === 6) return { chips: 25_000 }; // Saint Nicholas
  if (day === 18) return { chips: 50_000 };
  const base = 2_000 + day * 500;
  return { chips: day % 5 === 0 ? base * 3 : base };
}

const KEY = "royalace:advent";
type State = { year: number; opened: number[] };
let state: State = { year: 0, opened: [] };
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null") as State | null;
    if (d && typeof d.year === "number" && Array.isArray(d.opened)) state = { year: d.year, opened: d.opened.filter((n) => Number.isInteger(n)) };
  } catch {}
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

/** Where the calendar stands today (local date). */
export function adventStatus(key = today()) {
  const [y, m, d] = key.split("-").map(Number);
  const opened = state.year === y ? state.opened : [];
  // Shown from 24 November (teaser) to 31 December.
  const teaser = m === 11 && d >= 24;
  const live = m === 12;
  const day = live ? Math.min(d, 24) : 0; // last door that can be opened
  const ready = live ? Array.from({ length: day }, (_, i) => i + 1).filter((n) => !opened.includes(n)) : [];
  const opensIn = teaser ? 31 - d : 0; // days until 1 December
  return { year: y, visible: teaser || live, live, day, today: live ? d : 0, opened, ready, opensIn };
}

/** Winter look on the lobby: 1 December to 6 January. */
export function isWinter(key = today()) {
  const [, m, d] = key.split("-").map(Number);
  return m === 12 || (m === 1 && d <= 6);
}

export const advent = {
  get: () => state,
  subscribe(l: () => void) {
    hydrate();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Opens a door; returns its reward, or null if it can't be opened. */
  open(n: number): AdventReward | null {
    hydrate();
    const st = adventStatus();
    if (!st.live || n < 1 || n > st.day || st.opened.includes(n) || wallet.getLocked()) return null;
    const r = adventReward(n);
    state = { year: st.year, opened: [...st.opened, n] };
    persist();
    wallet.add(r.chips);
    if (r.item) shop.grant(r.item);
    emit();
    return r;
  },
};

export const useAdvent = () => useSyncExternalStore(advent.subscribe, advent.get, () => state);
