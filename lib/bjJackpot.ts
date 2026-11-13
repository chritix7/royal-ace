"use client";

import { useSyncExternalStore } from "react";

/**
 * Progressive side-bet jackpot for the Blackjack table: a shared pot
 * that grows a small amount every time anyone places a PP or 21+3 side
 * bet, and pays out on the rare event of a suited blackjack (PP) or a
 * "suited three of a kind" (21+3). Persisted to localStorage so the pot
 * carries over between sessions — the fun of a progressive jackpot is
 * the longer wait.
 *
 * This is separate from `./jackpot.ts`, which runs the four-tier
 * progressive for the Slots game. Different mechanic, different payouts,
 * different storage key — kept in its own file so each game's pool
 * logic can evolve independently without crossing wires.
 *
 * Lightweight external store (mirrors `wallet.ts`): subscribe with the
 * React hook, mutate with the plain functions. The main blackjack hook
 * pokes it from the side-bet settle path without having to carry the
 * counter in its own state tree.
 */

const KEY = "royalace:bjJackpot";
const SEED = 2500;

let pot = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ pot }));
  } catch {}
}

export const bjJackpot = {
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

export function useBjJackpot(): number {
  return useSyncExternalStore(
    bjJackpot.subscribe,
    bjJackpot.get,
    () => SEED,
  );
}
