export const AUTO_COUNTS = [10, 25, 50] as const;
export type AutoCount = (typeof AUTO_COUNTS)[number];
const KEY = "royalace:autoCount";
const DEFAULT_COUNT: AutoCount = 10;

export function parseAutoCount(raw: string | null): AutoCount {
  const n = Number(raw);
  return (AUTO_COUNTS as readonly number[]).includes(n) ? (n as AutoCount) : DEFAULT_COUNT;
}

/** Last auto-spin count chosen by the player (falls back to 10). */
export function loadAutoCount(): AutoCount {
  try {
    return parseAutoCount(localStorage.getItem(KEY));
  } catch {
    return DEFAULT_COUNT;
  }
}

export function saveAutoCount(count: AutoCount): void {
  try {
    localStorage.setItem(KEY, String(count));
  } catch {}
}

export type AutoSpinResult = { stop: boolean };

/**
 * Ordonne `count` tours automatiques. `shouldStop()` est vérifié avant CHAQUE tour :
 * un appui sur STOP pendant la pause entre deux tours empêche la mise suivante,
 * tandis que le tour en cours se termine normalement. Renvoie le nombre de tours joués.
 */
export async function runAutoSpins(
  count: number,
  round: () => Promise<AutoSpinResult>,
  opts: {
    shouldStop: () => boolean;
    canAfford: () => boolean;
    onInsufficientFunds: () => void;
    onProgress: (remaining: number) => void;
    pause: () => Promise<void>;
  },
): Promise<number> {
  let remaining = count;
  while (remaining > 0 && !opts.shouldStop()) {
    if (!opts.canAfford()) {
      opts.onInsufficientFunds();
      break;
    }
    const r = await round();
    remaining--;
    opts.onProgress(remaining);
    if (opts.shouldStop() || r.stop) break;
    if (remaining > 0) await opts.pause();
  }
  return count - remaining;
}
