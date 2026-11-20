import { useSyncExternalStore } from "react";

/**
 * The player's profile: the nickname asked on the first visit (shown in
 * the lobby), and the last game played (the lobby's "Continue" card).
 * Kept in the browser.
 */
export type Profile = { name: string; asked: boolean; lastGame: string | null };
const EMPTY: Profile = { name: "", asked: false, lastGame: null };
const KEY = "royalace:profile";

let state: Profile = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

/** 2 to 16 characters: letters (any language), digits, space, . _ - ' */
export function cleanName(raw: string) {
  const s = raw.replace(/\s+/g, " ").trim().slice(0, 16);
  return /^[\p{L}\p{N} ._'-]{2,16}$/u.test(s) ? s : null;
}

export const profileStore = {
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
        const s = JSON.parse(raw) as Partial<Profile>;
        state = { name: typeof s.name === "string" ? s.name : "", asked: Boolean(s.asked), lastGame: typeof s.lastGame === "string" ? s.lastGame : null };
      }
    } catch {}
    emit();
  },
  setName(name: string) {
    state = { ...state, name, asked: true };
    persist();
    emit();
  },
  skip() {
    state = { ...state, asked: true };
    persist();
    emit();
  },
  setLastGame(id: string) {
    if (state.lastGame === id) return;
    state = { ...state, lastGame: id };
    persist();
    emit();
  },
  isHydrated: () => hydrated,
};

export const useProfile = () => useSyncExternalStore(profileStore.subscribe, profileStore.get, () => EMPTY);
