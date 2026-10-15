"use client";

import { ACHIEVEMENTS } from "../lib/achievements";
import { useAchievements } from "../lib/achievementsStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AchievementsPanel({ open, onClose }: Props) {
  const unlocked = useAchievements();

  if (!open) return null;

  const unlockedCount = ACHIEVEMENTS.filter((achievement) => unlocked[achievement.id]).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Achievements"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#c8a65b]/30 bg-[#0d1210] p-5 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-[0.08em] text-[#e5c779] sm:text-2xl">
              🏆 ACHIEVEMENTS
            </h2>
            <p className="mt-1 text-xs text-white/50">
              {unlockedCount} of {ACHIEVEMENTS.length} unlocked
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60 transition hover:text-white"
            aria-label="Close achievements"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c8a65b] to-[#e5c779] transition-all"
            style={{ width: `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%` }}
          />
        </div>

        <div className="space-y-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = Boolean(unlocked[achievement.id]);
            return (
              <div
                key={achievement.id}
                className={`rounded-2xl border p-4 ${
                  isUnlocked
                    ? "border-[#c8a65b]/40 bg-[#c8a65b]/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isUnlocked ? "text-[#e5c779]" : "text-white/70"
                      }`}
                    >
                      {achievement.title}
                    </p>
                    <p className="mt-1 text-xs text-white/45">{achievement.desc}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      isUnlocked
                        ? "bg-[#e5c779]/20 text-[#e5c779]"
                        : "bg-white/[0.06] text-white/40"
                    }`}
                  >
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
