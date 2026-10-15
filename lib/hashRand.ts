/**
 * Pseudo-hasard déterministe fait UNIQUEMENT de calculs sur des entiers.
 * Contrairement à Math.sin / Math.cos, il donne exactement le même résultat sur le serveur
 * et dans le navigateur : indispensable pour un décor dessiné au rendu serveur (SSR).
 */
export function hashRand(seed: number): number {
  let t = (Math.imul(seed | 0, 0x9e3779b1) + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Arrondi à 2 décimales pour des attributs SVG propres et stables. */
export const round2 = (n: number) => Math.round(n * 100) / 100;