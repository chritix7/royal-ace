import { useSyncExternalStore } from "react";
import { dayNumber, today } from "./clock";
import { hashRand } from "./hashRand";

/**
 * The player's career money figures, fed by every settled round (through
 * the session store): this week's net (for the weekly ranking) and the
 * all-time totals and biggest win (for the VIP card). Kept in the browser.
 */
export type Career = {
  weekStart: number;
  weekNet: number;
  weekWagered: number;
  weekRounds: number;
  allNet: number;
  allWagered: number;
  allRounds: number;
  since: string;
  biggest: { amount: number; game: string; day: string } | null;
};
const KEY = "royalace:career-money";
const mondayOf = (n: number) => n - ((n + 3) % 7); // day 0 (1970-01-01) was a Thursday
const EMPTY: Career = { weekStart: 0, weekNet: 0, weekWagered: 0, weekRounds: 0, allNet: 0, allWagered: 0, allRounds: 0, since: "", biggest: null };

let state: Career = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function rollWeek() {
  const monday = mondayOf(dayNumber(today()));
  if (state.weekStart !== monday) state = { ...state, weekStart: monday, weekNet: 0, weekWagered: 0, weekRounds: 0 };
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export const careerStore = {
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
      if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<Career>) };
    } catch {}
    if (!state.since) state = { ...state, since: today() };
    rollWeek();
    persist();
    emit();
  },
  /** One settled round: stake and net result (net < 0 when lost). */
  record(game: string, wagered: number, net: number) {
    careerStore.hydrate();
    rollWeek();
    const big = state.biggest;
    state = {
      ...state,
      weekNet: state.weekNet + net,
      weekWagered: state.weekWagered + wagered,
      weekRounds: state.weekRounds + (wagered > 0 ? 1 : 0),
      allNet: state.allNet + net,
      allWagered: state.allWagered + wagered,
      allRounds: state.allRounds + (wagered > 0 ? 1 : 0),
      biggest: net > 0 && (!big || net > big.amount) ? { amount: net, game, day: today() } : big,
    };
    persist();
    emit();
  },
};

export const useCareer = () => useSyncExternalStore(careerStore.subscribe, careerStore.get, () => EMPTY);

/* ───────────── Weekly ranking ───────────── */

const RIVALS = ["Valentina", "Kaiser_9", "LuckyLuc", "MonteCarlo", "Nadia.R", "BlackSwan", "Ozzy777", "Élodie", "TheBaron", "Mika_V", "Zoltan", "Royal_Q", "Sasha", "Diamond_Joe", "Ines.M", "Kenzo"];

export type RankRow = { name: string; net: number; you?: boolean };

/**
 * A ranking of the week's best winners: the player against a table of
 * house regulars (fictional players whose results build up over the week,
 * the same for everyone on the same day). Resets every Monday.
 */
export function weeklyRanking(c: Career, you: string, now: number): { rows: RankRow[]; rank: number } {
  const monday = c.weekStart || mondayOf(dayNumber(today()));
  const start = Date.UTC(1970, 0, 1) + monday * 86400000;
  const f = Math.max(0.02, Math.min(1, (now - start) / (7 * 86400000)));
  const rows: RankRow[] = RIVALS.map((name, i) => {
    const r = hashRand(monday * 97 + i * 13);
    // Mostly modest weeks, a few big winners, a couple in the red.
    const target = Math.round((2_000_000 * r ** 5 - 15000) / 100) * 100;
    const wobble = 0.85 + hashRand(monday * 31 + i * 7 + Math.floor(f * 28)) * 0.3;
    return { name, net: Math.round((target * f ** 0.85 * wobble) / 10) * 10 };
  });
  rows.push({ name: you || "You", net: c.weekNet, you: true });
  rows.sort((a, b) => b.net - a.net);
  return { rows, rank: rows.findIndex((r) => r.you) + 1 };
}
