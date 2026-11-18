"use client";

import { useEffect } from "react";
import { achievementsStore, useAchievementToasts } from "../lib/achievementsStore";
import {
  dismissLevelToast,
  getLevelToasts,
  subscribeToLevelToasts,
  type LevelToast,
} from "../lib/progression";
import { useSyncExternalStore } from "react";

// Référence stable renvoyée côté serveur et à la première hydratation :
// un `() => []` inline créerait un nouveau tableau à chaque appel et React
// détecterait une boucle infinie dans useSyncExternalStore.
const EMPTY_LEVEL_TOASTS: LevelToast[] = [];
const getServerLevelToasts = () => EMPTY_LEVEL_TOASTS;

export default function AchievementToasts() {
  const toasts = useAchievementToasts();
  const levelToasts = useSyncExternalStore(
    subscribeToLevelToasts,
    getLevelToasts,
    getServerLevelToasts,
  );

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => achievementsStore.dismissToast(toast.key), 4000),
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  useEffect(() => {
    if (levelToasts.length === 0) return;

    const timers = levelToasts.map((toast) =>
      window.setTimeout(() => dismissLevelToast(toast.key), 5000),
    );

    return () => timers.forEach(clearTimeout);
  }, [levelToasts]);

  if (toasts.length === 0 && levelToasts.length === 0) return null;

  // At most two at once (the newest), so a burst of rewards never
  // covers the table; the rest stay counted on the header cards.
  const shownChallenges = toasts.slice(-2);
  const levelRoom = Math.max(0, 2 - shownChallenges.length);
  const shownLevels = levelRoom ? levelToasts.slice(-levelRoom) : [];

  return (
    // Phones: top centre, just under the header (never over the Focus
    // Exit / Menu keys) and away from the Deal keys. Desktop: bottom right.
    <div className="rl-over-wheel fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[200] flex w-[min(92vw,22rem)] -translate-x-1/2 flex-col gap-3 sm:bottom-5 sm:left-auto sm:right-5 sm:top-auto sm:translate-x-0">
      {shownLevels.map((toast) => (
        <div
          key={`level-${toast.key}`}
          className="rounded-2xl border border-[#e5c779]/50 bg-[#10150f]/95 p-4 shadow-2xl backdrop-blur"
          role="status"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5c779]">
            Level up
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            ⭐ Level {toast.level} reached
          </p>

          <p className="mt-1 text-xs text-white/60">
            +{toast.reward.toLocaleString("en-US")} chips
          </p>
        </div>
      ))}

      {shownChallenges.map((toast) => (
        <div
          key={toast.key}
          className="rounded-2xl border border-[#e5c779]/40 bg-[#10150f]/95 p-4 shadow-2xl backdrop-blur"
          role="status"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5c779]">
            Challenge complete
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            🏆 {toast.title}
          </p>

          {toast.reward ? (
            <p className="mt-1 text-xs text-white/60">
              ◈ {toast.reward.toLocaleString("en-US")} to claim in Challenges
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}