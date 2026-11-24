import { useSyncExternalStore } from "react";

/** "Reduced animations": a class on <html> that turns most animations off. */
const KEY = "royalace:reduced-motion";
let on = false;
let loaded = false;
const listeners = new Set<() => void>();
function apply() {
  if (typeof document !== "undefined") document.documentElement.classList.toggle("reduce-motion", on);
}
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    on = localStorage.getItem(KEY) === "on";
  } catch {}
  apply();
}
export const motion = {
  get: () => {
    load();
    return on;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  boot: () => load(),
  set(v: boolean) {
    load();
    on = v;
    try {
      localStorage.setItem(KEY, v ? "on" : "off");
    } catch {}
    apply();
    listeners.forEach((l) => l());
  },
};
export const useReducedMotion = () => useSyncExternalStore(motion.subscribe, motion.get, () => false);

/** Eco mode (Settings): the phones' light effects on computers too. */
const ECO_KEY = "royalace:eco";
let eco = false;
let ecoLoaded = false;
const ecoListeners = new Set<() => void>();
function loadEco() {
  if (ecoLoaded || typeof window === "undefined") return;
  ecoLoaded = true;
  try {
    eco = localStorage.getItem(ECO_KEY) === "on";
  } catch {}
  document.documentElement.classList.toggle("eco", eco);
}
export const ecoMode = {
  get: () => {
    loadEco();
    return eco;
  },
  subscribe(l: () => void) {
    ecoListeners.add(l);
    return () => {
      ecoListeners.delete(l);
    };
  },
  set(v: boolean) {
    loadEco();
    eco = v;
    try {
      localStorage.setItem(ECO_KEY, v ? "on" : "off");
    } catch {}
    document.documentElement.classList.toggle("eco", v);
    ecoListeners.forEach((l) => l());
  },
};
export const useEco = () => useSyncExternalStore(ecoMode.subscribe, ecoMode.get, () => false);

/**
 * Rest: after 20 s without a touch, click or key — and no round in play —
 * decorative loops pause (html.is-resting). Any input wakes them up.
 */
let restStarted = false;
export function startRest(isBusy: () => boolean) {
  if (restStarted || typeof window === "undefined") return;
  restStarted = true;
  const root = document.documentElement;
  let t = 0;
  const arm = () => {
    window.clearTimeout(t);
    t = window.setTimeout(function check() {
      if (isBusy()) t = window.setTimeout(check, 5000);
      else root.classList.add("is-resting");
    }, 20000);
  };
  const wake = () => {
    if (root.classList.contains("is-resting")) root.classList.remove("is-resting");
    arm();
  };
  (["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const).forEach((e) => window.addEventListener(e, wake, { passive: true }));
  arm();
}
