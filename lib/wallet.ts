import { useSyncExternalStore } from "react";

/**
 * Solde commun à tous les jeux (blackjack, machine à sous).
 * C'est un petit "store" externe : n'importe quel composant peut le lire
 * avec useBalance(), et tout est sauvegardé dans le navigateur.
 */
const KEY = "royalace:wallet";
const START = 1000;

type Listener = () => void;
let balance = START;
let locked = false; // vrai pendant une manche ou un tour : on ne change pas de jeu
let hydrated = false;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ balance }));
  } catch {}
}

export const wallet = {
  getBalance: () => balance,
  getLocked: () => locked,

  setBalance(value: number) {
    if (value === balance) return;
    balance = value;
    persist();
    emit();
  },
  add(delta: number) {
    wallet.setBalance(balance + delta);
  },
  setLocked(value: boolean) {
    if (value === locked) return;
    locked = value;
    emit();
  },

  setBalanceDurable(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Invalid wallet balance.");
  }

  localStorage.setItem(KEY, JSON.stringify({ balance: value }));

  if (value === balance) return;

  balance = value;
  emit();
},

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** À appeler une fois côté navigateur. Reprend l'ancien solde du blackjack si besoin. */
  hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.balance === "number") balance = d.balance;
      } else {
        const old = localStorage.getItem("royalace:blackjack");
        const d = old ? JSON.parse(old) : null;
        if (d && typeof d.balance === "number") balance = d.balance;
      }
    } catch {}
    persist();
    emit();
  },
};

export const useBalance = () =>
  useSyncExternalStore(wallet.subscribe, wallet.getBalance, () => START);

export const useLocked = () =>
  useSyncExternalStore(wallet.subscribe, wallet.getLocked, () => false);