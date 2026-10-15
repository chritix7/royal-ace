/**
 * Horloge du jeu : donne le jour courant (heure locale). On peut la remplacer dans les tests.
 */
let clock: () => Date = () => new Date();
export const setClock = (fn: () => Date) => {
  clock = fn;
};
export const resetClock = () => {
  clock = () => new Date();
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Date locale au format AAAA-MM-JJ. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dayKey(clock());

/** Numéro du jour depuis 1970 (sert à comparer deux dates sans souci d'heure d'été). */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return Number.NaN;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}
export const isNextDay = (previous: string, current: string) => dayNumber(current) - dayNumber(previous) === 1;