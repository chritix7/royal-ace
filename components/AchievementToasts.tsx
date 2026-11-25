"use client";

import { useEffect, useSyncExternalStore } from "react";
import { achievementsStore, useAchievementToasts } from "../lib/achievementsStore";
import { dismissLevelToast, getLevelToasts, subscribeToLevelToasts, type LevelToast } from "../lib/progression";
import { toast } from "./GameToasts";

const EMPTY_LEVEL_TOASTS: LevelToast[] = [];
const getServerLevelToasts = () => EMPTY_LEVEL_TOASTS;

/** Level-up and challenge notices, shown by the shared toast stack. */
export default function AchievementToasts() {
  const toasts = useAchievementToasts();
  const levelToasts = useSyncExternalStore(subscribeToLevelToasts, getLevelToasts, getServerLevelToasts);

  useEffect(() => {
    for (const t of levelToasts) {
      toast({ kind: "level", eyebrow: "Level up", title: `Level ${t.level} reached`, amount: t.reward });
      dismissLevelToast(t.key);
    }
  }, [levelToasts]);

  useEffect(() => {
    for (const t of toasts) {
      toast({ kind: "challenge", eyebrow: "Challenge complete", title: t.title, text: t.reward ? `◈ ${t.reward.toLocaleString("en-US")} to claim · tap to open` : undefined, action: "challenges" });
      achievementsStore.dismissToast(t.key);
    }
  }, [toasts]);

  return null;
}
