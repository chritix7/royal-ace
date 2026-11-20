import { useSyncExternalStore } from "react";
import { CHEST_REWARD, GAMES, MILESTONES, PLAY_EVENT, TOUR_REWARD, challengesFor, type Challenge, type Milestone } from "./achievements";
import { statsStore } from "./statsStore";
import { progressionStore } from "./progression";
import { today } from "./clock";
import { onEvent, type GameEvent } from "./events";
import { wallet } from "./wallet";

/**
 * Daily challenges engine: listens to the game events, keeps today's
 * counters in the browser, announces a challenge when it is completed
 * and pays its reward when the player claims it. Everything resets at
 * midnight (local time), when a new set of challenges is drawn.
 */

export type AchievementState = {
  day: string;
  /** Today's counters, by challenge key (event name or derived run). */
  counters: Record<string, number>;
  /** Challenges whose reward has been paid today. */
  claimed: string[];
  /** Challenges already announced by a toast today. */
  announced: string[];
};
export type AchievementToast = { key: number; id: string; title: string; reward?: number };
export type ChallengeView = { def: Challenge; progress: number; done: boolean; claimed: boolean };

const EMPTY: AchievementState = { day: "", counters: {}, claimed: [], announced: [] };
const EMPTY_TOASTS: AchievementToast[] = [];
const KEY = "royalace:daily-challenges";

let state: AchievementState = EMPTY;
let toasts: AchievementToast[] = [];
let toastKey = 0;
let hydrated = false;
let listening = false;
/** Current run of correct blackjack decisions (not persisted). */
let correctRun = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

/** New day: counters, claims and announcements start over. */
function rollover() {
  const day = today();
  if (state.day !== day) {
    state = { day, counters: {}, claimed: [], announced: [] };
    correctRun = 0;
  }
}

/** Progress of each of today's challenges. */
export function challengeView(s: AchievementState): ChallengeView[] {
  return challengesFor(s.day).map((def) => {
    const progress = Math.min(def.goal, s.counters[def.key] ?? 0);
    return { def, progress, done: progress >= def.goal, claimed: s.claimed.includes(def.id) };
  });
}

/** Grand tour (a round of every game today) and the Royal chest (all twelve done). */
export type ExtraView = { id: "tour" | "chest"; title: string; progress: number; goal: number; reward: number; done: boolean; claimed: boolean };
export function extrasView(s: AchievementState): ExtraView[] {
  const played = GAMES.filter((g) => (s.counters[PLAY_EVENT[g.id]] ?? 0) > 0).length;
  const views = challengeView(s);
  const done = views.filter((v) => v.done).length;
  return [
    { id: "tour", title: "Grand tour · play every game today", progress: played, goal: GAMES.length, reward: TOUR_REWARD, done: played >= GAMES.length, claimed: s.claimed.includes("tour") },
    { id: "chest", title: "Royal chest · complete all twelve challenges", progress: done, goal: views.length, reward: CHEST_REWARD, done: views.length > 0 && done >= views.length, claimed: s.claimed.includes("chest") },
  ];
}

/* ── Career milestones: earned once, read from the lifetime statistics ── */
const CAREER_KEY = "royalace:career";
let careerClaimed: string[] = [];
export type MilestoneView = { def: Milestone; progress: number; done: boolean; claimed: boolean };
export function milestoneView(): MilestoneView[] {
  const st = statsStore.get() as unknown as Record<string, number>;
  const level = progressionStore.get().level;
  return MILESTONES.map((def) => {
    const v = def.stat === "level" ? level : (st[def.stat] ?? 0);
    const progress = Math.min(def.goal, v);
    return { def, progress, done: progress >= def.goal, claimed: careerClaimed.includes(def.id) };
  });
}
export const getCareerClaimed = () => careerClaimed;

function bump(key: string, amount: number) {
  state = { ...state, counters: { ...state.counters, [key]: (state.counters[key] ?? 0) + amount } };
}

function best(key: string, value: number) {
  if (value <= (state.counters[key] ?? 0)) return;
  state = { ...state, counters: { ...state.counters, [key]: value } };
}

function handleEvent(event: GameEvent, amount = 1) {
  rollover();

  if (event === "bjMistake") {
    correctRun = 0;
    return;
  }

  if (event === "bjStreak") {
    // The event carries the current win streak, not an increment.
    best("bjStreak", amount);
  } else {
    bump(event, amount);
    if (event === "bjCorrect") {
      correctRun += amount;
      best("bjCorrectRun", correctRun);
    }
  }

  // Announce what this event just completed.
  for (const item of challengeView(state)) {
    if (!item.done || state.announced.includes(item.def.id)) continue;
    state = { ...state, announced: [...state.announced, item.def.id] };
    toasts = [
      ...toasts,
      { key: ++toastKey, id: item.def.id, title: item.def.title, reward: item.def.reward },
    ];
  }
  for (const x of extrasView(state)) {
    if (!x.done || state.announced.includes(x.id)) continue;
    state = { ...state, announced: [...state.announced, x.id] };
    toasts = [...toasts, { key: ++toastKey, id: x.id, title: x.title, reward: x.reward }];
  }

  persist();
  emit();
}

export const achievementsStore = {
  get: () => state,
  getToasts: () => toasts,

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
        const saved = JSON.parse(raw);
        if (saved && typeof saved.day === "string" && saved.counters && typeof saved.counters === "object") {
          const counters: Record<string, number> = {};
          for (const [k, v] of Object.entries(saved.counters)) {
            if (typeof v === "number" && Number.isFinite(v) && v > 0) counters[k] = v;
          }
          const strings = (x: unknown) =>
            Array.isArray(x) ? x.filter((i): i is string => typeof i === "string") : [];
          state = {
            day: saved.day,
            counters,
            claimed: strings(saved.claimed),
            announced: strings(saved.announced),
          };
        }
      }
    } catch {}

    try {
      const raw = localStorage.getItem(CAREER_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      careerClaimed = Array.isArray(arr) ? arr.filter((x: unknown): x is string => typeof x === "string") : [];
    } catch {}

    rollover();
    persist();

    if (!listening) {
      listening = true;
      onEvent(handleEvent);
    }

    emit();
  },

  /** Records a game event (the store does this itself once hydrated). */
  add(event: GameEvent, amount = 1) {
    handleEvent(event, amount);
  },

  /** Checks for a new day (for instance when the panel opens). */
  refresh() {
    const before = state.day;
    rollover();
    if (state.day !== before) {
      persist();
      emit();
    }
  },

  /**
   * Pays the reward of a completed challenge. Returns the chips paid,
   * or 0 when it can't be claimed (not done, already claimed, or a
   * round is in progress — the wallet is locked during a hand).
   */
  claim(id: string): number {
    rollover();
    if (wallet.getLocked()) return 0;
    const item = challengeView(state).find((c) => c.def.id === id);
    const extra = extrasView(state).find((x) => x.id === id);
    const reward = item ? (item.done && !item.claimed ? item.def.reward : 0) : extra ? (extra.done && !extra.claimed ? extra.reward : 0) : 0;
    if (!reward) return 0;
    state = { ...state, claimed: [...state.claimed, id] };
    persist();
    wallet.add(reward);
    emit();
    return reward;
  },

  /** Pays a career milestone (once for good). */
  claimMilestone(id: string): number {
    if (wallet.getLocked()) return 0;
    const m = milestoneView().find((x) => x.def.id === id);
    if (!m || !m.done || m.claimed) return 0;
    careerClaimed = [...careerClaimed, id];
    try {
      localStorage.setItem(CAREER_KEY, JSON.stringify(careerClaimed));
    } catch {}
    wallet.add(m.def.reward);
    emit();
    return m.def.reward;
  },

  dismissToast(key: number) {
    toasts = toasts.filter((toast) => toast.key !== key);
    emit();
  },

  /** For tests. */
  _reset() {
    state = EMPTY;
    toasts = [];
    correctRun = 0;
    hydrated = false;
    emit();
  },
};

export const useAchievements = () =>
  useSyncExternalStore(achievementsStore.subscribe, achievementsStore.get, () => EMPTY);

export const useAchievementToasts = () =>
  useSyncExternalStore(
    achievementsStore.subscribe,
    achievementsStore.getToasts,
    () => EMPTY_TOASTS,
  );
