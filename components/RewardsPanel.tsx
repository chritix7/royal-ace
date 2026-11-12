"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DAILY_MAX_DAYS,
  dailyStatus,
  dailyStore,
  dailyReward,
  nextVipTier,
  useDaily,
  vipTierForLevel,
} from "../lib/daily";
import { missionView, missionsStore, useMissions } from "../lib/missions";
import { today } from "../lib/clock";
import { progressionStore, useProgression, xpInLevel, xpForNextLevel } from "../lib/progression";
import { useWeekly, weeklyStore } from "../lib/weekly";

type Props = { open: boolean; onClose: () => void };

const WEEKLY_GOAL = 5000;

export default function RewardsPanel({ open, onClose }: Props) {
  const daily = useDaily();
  const missions = useMissions();
  const progression = useProgression();
  const weekly = useWeekly();
  const vipTier = vipTierForLevel(progression.level);
  const nextTier = nextVipTier(progression.level);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    missionsStore.refresh();
    progressionStore.hydrate();
    weeklyStore.refresh();
    setFlash(null);

    const timer = window.setInterval(() => {
      weeklyStore.refresh();
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [open]);

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

  const status = dailyStatus(daily, today(), progression.level);
  const views = missionView(missions);
  const claimableMissions = views.filter((m) => m.done && !m.claimed).length;

  const weeklyPercent = Math.min(
    100,
    Math.floor((weekly.points / WEEKLY_GOAL) * 100),
  );

  const weeklyGoalReached = weekly.points >= WEEKLY_GOAL;

  const weeklyResetDate =
    weekly.weekStart === null
      ? null
      : new Date((weekly.weekStart + 7) * 86_400_000).toLocaleDateString(
          "en-GB",
          {
            weekday: "long",
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          },
        );

  const claimDaily = () => {
    const gained = dailyStore.claim();
    setFlash(
      gained > 0
        ? `Daily bonus claimed: +${gained} chips`
        : "Daily bonus already claimed today.",
    );
  };

  const claimMission = (id: string) => {
    const gained = missionsStore.claim(id);
    setFlash(
      gained > 0
        ? `Mission reward claimed: +${gained} chips`
        : "This reward is not available.",
    );
  };

  // Shared premium primary / secondary button classes so every "Claim"
  // cta on the panel reads as one family.
  const primary =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[#d7b45b]/70 bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] px-4 text-[11px] font-black uppercase tracking-wider text-[#10130e] shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";
  const ghost =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/12 bg-gradient-to-b from-[#1a2219] to-[#0e1310] px-4 text-[11px] font-black uppercase tracking-wider text-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(0,0,0,0.45)] outline-none transition hover:border-[#d7b45b]/40 focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-40";

  return createPortal(
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Rewards"
    >
      <button
        type="button"
        aria-label="Close rewards"
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
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7b45b]/80">
              Daily & missions
            </p>
            <h2 className="mt-0.5 text-lg font-black tracking-wide text-white sm:text-xl">
              Rewards
            </h2>
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

        {/* Body */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-color:#d7b45b40_transparent] [scrollbar-width:thin] sm:px-6">
          {flash && (
            <div
              key={flash}
              className="animate-chip-bump mb-4 rounded-2xl border border-[#d7b45b]/40 bg-[#d7b45b]/10 px-4 py-3 text-xs font-semibold text-[#f5d778]"
            >
              {flash}
            </div>
          )}

          {/* Level */}
          <section className="mb-4 rounded-2xl border border-[#c8a65b]/15 bg-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                Level {progression.level}
              </p>
              <p className="font-mono text-[11px] font-black tabular-nums text-white/75">
                {xpInLevel(progression.xp)} / {xpForNextLevel()} XP
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/45">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8a6c2b] via-[#d7b45b] to-[#f0d38b] shadow-[0_0_10px_rgba(229,199,121,0.35)] transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    (xpInLevel(progression.xp) / xpForNextLevel()) * 100,
                  )}%`,
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] text-white/50">
              <p>
                <span className="block text-sm font-black tabular-nums text-white/80">
                  {progression.totalSpins}
                </span>
                Spins
              </p>
              <p>
                <span className="block text-sm font-black tabular-nums text-white/80">
                  {progression.totalHands}
                </span>
                Hands
              </p>
              <p>
                <span className="block text-sm font-black tabular-nums text-white/80">
                  {progression.totalBonuses}
                </span>
                Bonuses
              </p>
              <p>
                <span className="block text-sm font-black tabular-nums text-white/80">
                  {progression.totalJackpots}
                </span>
                Jackpots
              </p>
            </div>
          </section>

          {/* VIP */}
          <section className="mb-4 rounded-2xl border border-[#c8a65b]/15 bg-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                  VIP · {vipTier.label}
                </p>
                <p className="mt-1 text-[11px] text-white/55">
                  +{vipTier.dailyBonus} daily bonus chips
                </p>
              </div>
              <span
                aria-hidden
                className="rounded-full border border-[#d7b45b]/60 bg-gradient-to-b from-[#d7b45b]/[0.1] to-transparent px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#f5d778] shadow-[inset_0_1px_0_rgba(229,199,121,0.15)]"
              >
                {vipTier.label}
              </span>
            </div>
            {nextTier && (
              <>
                <p className="mt-3 text-[10px] text-white/45">
                  Next: {nextTier.label} at level {nextTier.minLevel}
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/45">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8a6c2b] to-[#f0d38b] transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        ((progression.level - vipTier.minLevel) /
                          (nextTier.minLevel - vipTier.minLevel)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </>
            )}
          </section>

          {/* Weekly */}
          <section className="mb-4 rounded-2xl border border-[#c8a65b]/15 bg-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                  Weekly challenge
                </p>
                <p className="mt-1 text-[11px] text-white/55">
                  Personal score · Mon → Sun
                </p>
              </div>
              <span
                className={`shrink-0 text-[11px] font-black ${
                  weeklyGoalReached ? "text-emerald-300" : "text-[#e5c779]"
                }`}
              >
                {weeklyGoalReached ? "✓ Goal reached" : `${weeklyPercent}%`}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#d7b45b]/25 bg-[#d7b45b]/[0.08] p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/45">
                  This week
                </p>
                <p className="mt-1 font-mono text-xl font-black tabular-nums text-[#f5d778]">
                  {weekly.points.toLocaleString("en-US")}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/45">
                  Last week
                </p>
                <p className="mt-1 font-mono text-xl font-black tabular-nums text-white/70">
                  {weekly.previousPoints.toLocaleString("en-US")}
                </p>
              </div>
            </div>

            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/45"
              role="progressbar"
              aria-label="Weekly points goal"
              aria-valuemin={0}
              aria-valuemax={WEEKLY_GOAL}
              aria-valuenow={Math.min(weekly.points, WEEKLY_GOAL)}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  weeklyGoalReached
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                    : "bg-gradient-to-r from-[#8a6c2b] via-[#d7b45b] to-[#f0d38b] shadow-[0_0_10px_rgba(229,199,121,0.3)]"
                }`}
                style={{ width: `${weeklyPercent}%` }}
              />
            </div>

            <p className="mt-2 text-[10px] text-white/45">
              {weekly.points.toLocaleString("en-US")} /{" "}
              {WEEKLY_GOAL.toLocaleString("en-US")} points
            </p>

            {weeklyResetDate && (
              <p className="mt-2 text-[10px] leading-relaxed text-white/40">
                Resets {weeklyResetDate} · 00:00 local
              </p>
            )}
          </section>

          {/* Daily */}
          <section className="mb-4 rounded-2xl border border-[#c8a65b]/15 bg-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                  Daily bonus
                </p>
                <p className="mt-1 text-[11px] text-white/55">
                  Day {Math.min(status.streakDay, DAILY_MAX_DAYS)} of{" "}
                  {DAILY_MAX_DAYS} · Reward: ◈ {status.reward}
                </p>
              </div>
              <button
                type="button"
                onClick={claimDaily}
                disabled={!status.canClaim}
                className={status.canClaim ? primary : ghost}
              >
                {status.canClaim ? `Claim · ◈ ${status.reward}` : "Claimed"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {Array.from({ length: DAILY_MAX_DAYS }, (_, index) => {
                const day = index + 1;
                const reached =
                  status.streakDay > day ||
                  (!status.canClaim && status.streakDay >= day);
                const current =
                  status.canClaim && status.streakDay === day;
                return (
                  <div
                    key={day}
                    className={`rounded-lg border px-1 py-1.5 text-center ${
                      current
                        ? "border-[#e5c779] bg-[#e5c779]/15 text-[#f5d778] shadow-[0_0_8px_rgba(229,199,121,0.3)]"
                        : reached
                          ? "border-[#c8a65b]/40 bg-[#c8a65b]/10 text-[#e5c779]"
                          : "border-white/10 bg-white/[0.02] text-white/35"
                    }`}
                  >
                    <p className="text-[8px] font-black uppercase tracking-wide">
                      D{day}
                    </p>
                    <p className="mt-0.5 text-[10px] font-black tabular-nums">
                      {dailyReward(day) + vipTier.dailyBonus}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Missions */}
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                Today's missions
              </p>
              {claimableMissions > 0 && (
                <span className="rounded-full border border-[#d7b45b]/60 bg-[#d7b45b]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#f5d778]">
                  {claimableMissions} ready
                </span>
              )}
            </div>

            <ul className="space-y-2">
              {views.map(({ def, progress, done, claimed }) => {
                const percent = Math.round((progress / def.goal) * 100);
                return (
                  <li
                    key={def.id}
                    className="rounded-2xl border border-[#c8a65b]/15 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold tracking-wide text-white">
                          {def.title}
                        </p>
                        <p className="mt-0.5 text-[10px] capitalize text-white/45">
                          {def.tier} · ◈ {def.reward}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => claimMission(def.id)}
                        disabled={!done || claimed}
                        className={`${
                          done && !claimed ? primary : ghost
                        } !min-h-8 !px-3 !text-[10px]`}
                      >
                        {claimed
                          ? "Claimed"
                          : done
                            ? `Claim · ◈ ${def.reward}`
                            : "In progress"}
                      </button>
                    </div>

                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-[10px] text-white/45">
                        <span className="tabular-nums">
                          {progress} / {def.goal}
                        </span>
                        <span className="tabular-nums">{percent}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-black/45">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8a6c2b] to-[#f0d38b] transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
