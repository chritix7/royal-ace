import { useSyncExternalStore } from "react";

/** Pinned competitions and teams (sport-prefixed ids), shown first. Kept in the browser. */
export type Favs = { comps: string[]; teams: string[] };
const KEY = "royalace:sports-favs";
const EMPTY: Favs = { comps: [], teams: [] };
let state: Favs = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Favs> | null;
    if (s) state = { comps: Array.isArray(s.comps) ? s.comps : [], teams: Array.isArray(s.teams) ? s.teams : [] };
  } catch {}
}
function set(next: Favs) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

export const favs = {
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
  toggleComp(id: string) {
    load();
    set({ ...state, comps: state.comps.includes(id) ? state.comps.filter((x) => x !== id) : [...state.comps, id] });
  },
  toggleTeam(id: string) {
    load();
    set({ ...state, teams: state.teams.includes(id) ? state.teams.filter((x) => x !== id) : [...state.teams, id] });
  },
};
export const useFavs = () => useSyncExternalStore(favs.subscribe, favs.get, () => EMPTY);
/** Ids are prefixed by sport so a team id never collides across feeds. */
export const compKey = (sport: string, id: string) => `${sport}:${id}`;
export const teamKey = (sport: string, id: string) => `${sport}:${id}`;
