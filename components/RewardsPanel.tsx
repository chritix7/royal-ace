"use client";

import { useEffect, useState } from "react";
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

type Props = { open: boolean; onClose: () => void };

export default function RewardsPanel({ open, onClose }: Props) {
  const daily = useDaily();
  const missions = useMissions();
  const progression = useProgression();
  const vipTier = vipTierForLevel(progression.level);
  const nextTier = nextVipTier(progression.level);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
  if (open) {
    missionsStore.refresh();
    progressionStore.hydrate();
    setFlash(null);
  }
}, [open]);

  if (!open) return null;

  const status = dailyStatus(daily, today(), progression.level);
  const views = missionView(missions);
  const claimableMissions = views.filter((m) => m.done && !m.claimed).length;

  const claimDaily = () => {
    const gained = dailyStore.claim();
    setFlash(gained > 0 ? `Daily bonus claimed: +${gained} chips` : "Daily bonus already claimed today.");
  };

  const claimMission = (id: string) => {
    const gained = missionsStore.claim(id);
    setFlash(gained > 0 ? `Mission reward claimed: +${gained} chips` : "This reward is not available.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Rewards" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#c8a65b]/30 bg-[#0d1210] p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-[0.08em] text-[#e5c779] sm:text-2xl">🎁 REWARDS</h2>
            <p className="mt-1 text-xs text-white/50">Claim your daily bonus and complete today’s missions.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60 transition hover:text-white" aria-label="Close rewards">✕</button>
        </div>

        {flash && <div className="mb-5 rounded-2xl border border-[#e5c779]/30 bg-[#e5c779]/10 px-4 py-3 text-sm font-semibold text-[#e5c779]">{flash}</div>}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">
        Player level
      </h3>
      <p className="mt-1 text-xs text-white/45">
        Level {progression.level} · {progression.xp.toLocaleString("en-US")} XP
      </p>
    </div>

    <p className="font-mono text-sm font-black tabular-nums text-[#e5c779]">
      {xpInLevel(progression.xp)} / {xpForNextLevel()}
    </p>
  </div>

  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-[#c8a65b] to-[#e5c779] transition-all"
      style={{
        width: `${Math.min(
          100,
          (xpInLevel(progression.xp) / xpForNextLevel()) * 100,
        )}%`,
      }}
    />
  </div>

  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/45 sm:grid-cols-4">
    <p>Spins: {progression.totalSpins}</p>
    <p>Hands: {progression.totalHands}</p>
    <p>Bonuses: {progression.totalBonuses}</p>
    <p>Jackpots: {progression.totalJackpots}</p>
  </div>
</section>

<section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">
        VIP status
      </h3>
      <p className="mt-1 text-xs text-white/45">
        {vipTier.label} · +{vipTier.dailyBonus} daily bonus chips
      </p>
    </div>

    <p className="text-sm font-black tracking-wide text-[#e5c779]">
      {vipTier.label.toUpperCase()}
    </p>
  </div>

  {nextTier && (
    <>
      <p className="mt-3 text-[11px] text-white/45">
        Next tier: {nextTier.label} at level {nextTier.minLevel}
      </p>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c8a65b] to-[#e5c779] transition-all"
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

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">Daily bonus</h3>
              <p className="mt-1 text-xs text-white/45">Day {Math.min(status.streakDay, DAILY_MAX_DAYS)} of {DAILY_MAX_DAYS} · Reward: {status.reward} chips</p>
            </div>
            <button onClick={claimDaily} disabled={!status.canClaim} className={`rounded-full px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${status.canClaim ? "bg-[#d7b45b] text-[#10130e] hover:bg-[#e5c779]" : "border border-white/10 bg-white/[0.04] text-white/50"}`}>
              {status.canClaim ? `Claim ${status.reward}` : "Claimed"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {Array.from({ length: DAILY_MAX_DAYS }, (_, index) => {
              const day = index + 1;
              const reached = status.streakDay > day || (!status.canClaim && status.streakDay >= day);
              const current = status.canClaim && status.streakDay === day;
              return (
                <div key={day} className={`rounded-xl border px-2 py-3 text-center ${current ? "border-[#e5c779] bg-[#e5c779]/15 text-[#e5c779]" : reached ? "border-[#c8a65b]/40 bg-[#c8a65b]/10 text-[#e5c779]" : "border-white/10 bg-white/[0.02] text-white/35"}`}>
                  <p className="text-[10px] font-bold uppercase">Day {day}</p>
                  <p className="mt-1 text-xs font-semibold">
  {dailyReward(day) + vipTier.dailyBonus}
</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">Today’s missions</h3>
            {claimableMissions > 0 && <span className="rounded-full bg-[#e5c779]/15 px-3 py-1 text-xs font-bold text-[#e5c779]">{claimableMissions} reward{claimableMissions > 1 ? "s" : ""} ready</span>}
          </div>

          <div className="space-y-3">
            {views.map(({ def, progress, done, claimed }) => {
              const percent = Math.round((progress / def.goal) * 100);
              return (
                <div key={def.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{def.title}</p>
                      <p className="mt-1 text-xs capitalize text-white/45">{def.tier} mission · Reward: {def.reward} chips</p>
                    </div>
                    <button onClick={() => claimMission(def.id)} disabled={!done || claimed} className={`rounded-full px-4 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${done && !claimed ? "bg-[#d7b45b] text-[#10130e] hover:bg-[#e5c779]" : "border border-white/10 bg-white/[0.04] text-white/50"}`}>
                      {claimed ? "Claimed" : done ? `Claim ${def.reward}` : "In progress"}
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex justify-between text-[11px] text-white/45">
                      <span>{progress} / {def.goal}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#c8a65b] to-[#e5c779] transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
