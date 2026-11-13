"use client";

import { useSyncExternalStore } from "react";

/**
 * Progressive side-bet jackpot: a shared pot that grows a small amount
 * every time anyone places a PP or 21+3 side bet, and pays out on the
 * rare event of a suited blackjack (PP) or a "suited three of a kind"
 * (21+3). Persisted to localStorage so the pot carries over between
 * sessions — the fun of a progressive jackpot is the longer wait.
 *
 * This is a lightweight external store (mirrors `wallet.ts`): subscribe
 * with the React hook, mutate with the plain functions. The main
 * blackjack hook pokes it from the settle path without having to add
 * the counter to its own state tree.
 *
 * Payout rules are local-only — we are not a real casino. The seed
 * values and growth rate are tuned so the pot visibly moves during
 * normal play but the big wins still feel like a discovery.
 */

const KEY = "royalace:jackpot";
const SEED = 2500;
const GROWTH_PER_SIDEBET = 1; // fraction of the wager, rounded up (min 1)

let pot = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ pot }));
  } catch {}
}

export const jackpot = {
  get: () => pot,

  hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.pot === "number" && Number.isFinite(parsed.pot)) {
          pot = Math.max(SEED, parsed.pot);
          emit();
        }
      }
    } catch {}
  },

  /** Contribute to the pot from a side-bet wager. */
  contribute(wagered: number) {
    if (wagered <= 0) return;
    const bump = Math.max(1, Math.ceil(wagered / 20));
    pot = Math.min(pot + bump, 10_000_000); // sane cap
    persist();
    emit();
  },

  /** Pay a slice of the pot and reset to the seed. Returns amount paid. */
  payout(fraction: number): number {
    const slice = Math.floor(pot * Math.max(0, Math.min(1, fraction)));
    pot = Math.max(SEED, pot - slice);
    persist();
    emit();
    return slice;
  },

  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useJackpot(): number {
  return useSyncExternalStore(
    jackpot.subscribe,
    jackpot.get,
    () => SEED,
  );
}
