import { useSyncExternalStore } from "react";
import { dayNumber, today } from "./clock";
import { onEvent, type GameEvent } from "./events";
import { hashRand } from "./hashRand";
import { wallet } from "./wallet";

export type Mission = { id: string; title: string; event: GameEvent; goal: number; reward: number; tier: "easy" | "medium" | "hard" };

/** Chaque jour : 1 mission facile, 1 moyenne, 1 difficile, tirées au sort (le même tirage toute la journée). */
export const MISSION_POOL: Mission[] = [
  { id: "spin30", title: "Spin the slot machine 30 times", event: "spin", goal: 30, reward: 120, tier: "easy" },
  { id: "slotwin8", title: "Win on 8 slot spins", event: "slotWin", goal: 8, reward: 120, tier: "easy" },
  { id: "bjhand10", title: "Play 10 blackjack hands", event: "bjHand", goal: 10, reward: 100, tier: "easy" },
  { id: "bjwin4", title: "Win 4 blackjack hands", event: "bjWin", goal: 4, reward: 120, tier: "easy" },

  { id: "spin80", title: "Spin the slot machine 80 times", event: "spin", goal: 80, reward: 300, tier: "medium" },
  { id: "wild2", title: "Make the Boss expand 2 times", event: "wildExpand", goal: 2, reward: 300, tier: "medium" },
  { id: "bjcorrect25", title: "Make 25 correct blackjack decisions", event: "bjCorrect", goal: 25, reward: 300, tier: "medium" },
  { id: "bjwin12", title: "Win 12 blackjack hands", event: "bjWin", goal: 12, reward: 320, tier: "medium" },
  { id: "gamble2", title: "Win 2 gambles", event: "gambleWin", goal: 2, reward: 280, tier: "medium" },
  { id: "bjdouble1", title: "Win a doubled hand at blackjack", event: "bjDouble", goal: 1, reward: 280, tier: "medium" },

  { id: "bonus1", title: "Trigger or buy a free spins bonus", event: "bonus", goal: 1, reward: 600, tier: "hard" },
  { id: "vault1", title: "Open the vault", event: "vault", goal: 1, reward: 700, tier: "hard" },
  { id: "big1", title: "Land a win worth 20× your bet or more", event: "bigWin", goal: 1, reward: 600, tier: "hard" },
  { id: "bjbj1", title: "Get a blackjack", event: "bjBlackjack", goal: 1, reward: 500, tier: "hard" },
  { id: "respin4", title: "Trigger 4 re-spins", event: "respin", goal: 4, reward: 500, tier: "hard" },
  { id: "bjwin30", title: "Win 30 blackjack hands", event: "bjWin", goal: 30, reward: 650, tier: "hard" },
  { id: "bjsplit1", title: "Win a split hand at blackjack", event: "bjSplit", goal: 1, reward: 450, tier: "hard" },
];

export function missionsFor(day: string): Mission[] {
  const n = dayNumber(day);
  if (Number.isNaN(n)) return [];
  return (["easy", "medium", "hard"] as const).map((tier, k) => {
    const pool = MISSION_POOL.filter((m) => m.tier === tier);
    return pool[Math.floor(hashRand(n * 7 + k + 1) * pool.length)];
  });
}

export type MissionState = { day: string; counters: Partial<Record<GameEvent, number>>; claimed: string[] };
const EMPTY: MissionState = { day: "", counters: {}, claimed: [] };

export type MissionView = { def: Mission; progress: number; done: boolean; claimed: boolean };
/** Progression de chaque mission du jour : elle suit simplement le compteur de son événement. */
export function missionView(state: MissionState): MissionView[] {
  return missionsFor(state.day).map((def) => {
    const progress = Math.min(def.goal, state.counters[def.event] ?? 0);
    return { def, progress, done: progress >= def.goal, claimed: state.claimed.includes(def.id) };
  });
}

const KEY = "royalace:missions";
let state: MissionState = EMPTY;
let hydrated = false;
let listening = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

/** Nouveau jour : on repart de zéro (compteurs et récompenses réclamées). */
function rollover() {
  const day = today();
  if (state.day !== day) state = { day, counters: {}, claimed: [] };
}

export const missionsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  hydrate() {
    if (hydrated) return;
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.day === "string" && d.counters && typeof d.counters === "object") {
          state = { day: d.day, counters: d.counters, claimed: Array.isArray(d.claimed) ? d.claimed : [] };
        }
      }
    } catch {}
    rollover();
    persist();
    if (!listening) {
      listening = true;
      onEvent((event, amount) => missionsStore.add(event, amount));
    }
    emit();
  },
  add(event: GameEvent, amount = 1) {
    rollover();
    state = { ...state, counters: { ...state.counters, [event]: (state.counters[event] ?? 0) + amount } };
    persist();
    emit();
  },
  /** Vérifie le changement de jour (par exemple quand on ouvre le panneau). */
  refresh() {
    const before = state.day;
    rollover();
    if (state.day !== before) {
      persist();
      emit();
    }
  },
  /** Réclame la récompense d'une mission terminée. Renvoie les chips gagnées (0 si impossible). */
  claim(id: string): number {
    rollover();
    const item = missionView(state).find((m) => m.def.id === id);
    if (!item || !item.done || item.claimed) return 0;
    state = { ...state, claimed: [...state.claimed, id] };
    persist();
    wallet.add(item.def.reward);
    emit();
    return item.def.reward;
  },
  /** Pour les tests. */
  _reset() {
    state = EMPTY;
    hydrated = false;
    emit();
  },
};

export const useMissions = () => useSyncExternalStore(missionsStore.subscribe, missionsStore.get, () => EMPTY);