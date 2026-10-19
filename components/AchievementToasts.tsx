"use client";

import { useEffect } from "react";
import { achievementsStore, useAchievementToasts } from "../lib/achievementsStore";
import {
  dismissLevelToast,
  getLevelToasts,
  subscribeToLevelToasts,
} from "../lib/progression";
import { useSyncExternalStore } from "react";

export default function AchievementToasts() {
  const toasts = useAchievementToasts();
  const levelToasts = useSyncExternalStore(
    subscribeToLevelToasts,
    getLevelToasts,
    () => [],
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

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex w-[min(92vw,22rem)] flex-col gap-3">
      {levelToasts.map((toast) => (
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

      {toasts.map((toast) => (
        <div
          key={toast.key}
          className="rounded-2xl border border-[#e5c779]/40 bg-[#10150f]/95 p-4 shadow-2xl backdrop-blur"
          role="status"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5c779]">
            Achievement unlocked
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            🏆 {toast.title}
          </p>
        </div>
      ))}
    </div>
  );
}