"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ACHIEVEMENTS } from "../lib/achievements";
import { useAchievements } from "../lib/achievementsStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AchievementsPanel({ open, onClose }: Props) {
  const unlocked = useAchievements();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const unlockedCount = ACHIEVEMENTS.filter((achievement) => unlocked[achievement.id]).length;
  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  return createPortal(
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Achievements"
    >
      <button
        type="button"
        aria-label="Close achievements"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-insurance-slide-in"
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.15) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 60%, #070504 100%)",
        }}
      >
        {/* Inner gold hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-3 border-b border-[#d7b45b]/15 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7b45b]/80">
              Progress
            </p>
            <h2 className="mt-0.5 text-lg font-black tracking-wide text-white sm:text-xl">
              Achievements
            </h2>
            <p className="mt-1 text-[11px] text-white/50">
              <span className="font-bold text-[#e5c779]">{unlockedCount}</span>{" "}
              of {ACHIEVEMENTS.length} unlocked
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 outline-none transition hover:border-[#d7b45b]/60 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
          >
            ×
          </button>
        </div>

        {/* Progress gauge */}
        <div className="relative px-5 pt-3 sm:px-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8a6c2b] via-[#d7b45b] to-[#f0d38b] shadow-[0_0_10px_rgba(229,199,121,0.4)] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-color:#d7b45b40_transparent] [scrollbar-width:thin] sm:px-6">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = Boolean(unlocked[achievement.id]);
              return (
                <li
                  key={achievement.id}
                  className={`relative overflow-hidden rounded-2xl border p-3 transition ${
                    isUnlocked
                      ? "border-[#d7b45b]/60 bg-[#d7b45b]/[0.08]"
                      : "border-white/[0.07] bg-black/30"
                  }`}
                  style={
                    isUnlocked
                      ? {
                          boxShadow:
                            "0 0 14px rgba(229,199,121,0.18), inset 0 1px 0 rgba(229,199,121,0.15)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black leading-none ${
                        isUnlocked ? "text-[#1a1612]" : "text-white/30"
                      }`}
                      style={
                        isUnlocked
                          ? {
                              background:
                                "radial-gradient(circle at 50% 35%, #f6e4a9 0%, #d7b45b 55%, #8a6c2b 100%)",
                              boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 8px rgba(229,199,121,0.4)",
                            }
                          : {
                              background: "rgba(255,255,255,0.05)",
                              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                            }
                      }
                    >
                      ★
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-bold tracking-wide ${
                          isUnlocked ? "text-[#f5d778]" : "text-white/60"
                        }`}
                      >
                        {achievement.title}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] leading-4 ${
                          isUnlocked ? "text-white/60" : "text-white/35"
                        }`}
                      >
                        {achievement.desc}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        isUnlocked
                          ? "border border-[#d7b45b]/60 bg-[#d7b45b]/15 text-[#f5d778]"
                          : "border border-white/10 bg-white/[0.04] text-white/40"
                      }`}
                    >
                      {isUnlocked ? "Got it" : "Locked"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
