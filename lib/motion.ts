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
