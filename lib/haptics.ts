import { audio } from "./audio";

/** Petites vibrations sur téléphone (sans effet sur ordinateur). */
export const HAPTIC = {
  win: [25],
  big: [40, 30, 40],
  epic: [60, 40, 60, 40, 140],
  tick: [10],
} as const;

export function haptic(pattern: readonly number[]) {
  if (!audio.get().haptics) return;
  try {
    navigator.vibrate?.([...pattern]);
  } catch {}
}