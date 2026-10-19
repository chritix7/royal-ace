"use client";

import { useEffect, useState } from "react";
import AchievementsPanel from "../components/AchievementsPanel";
import AudioControls from "../components/AudioControls";
import Blackjack from "../components/Blackjack";
import RewardsPanel from "../components/RewardsPanel";
import Slots from "../components/Slots";
import StatsPanel from "../components/StatsPanel";
import { Counter } from "../components/ui";
import { achievementsStore } from "../lib/achievementsStore";
import { dailyStore } from "../lib/daily";
import { missionsStore } from "../lib/missions";
import { statsStore } from "../lib/statsStore";
import { useBalance, useLocked, wallet } from "../lib/wallet";
import AchievementToasts from "../components/AchievementToasts";
import { progressionStore } from "../lib/progression";
import { weeklyStore } from "../lib/weekly";

type Tab = "blackjack" | "slots";
const TABS: { id: Tab; label: string }[] = [
  { id: "blackjack", label: "♠  Blackjack" },
  { id: "slots", label: "🎰  Slot machine" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("blackjack");
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const balance = useBalance();
  const locked = useLocked();

  useEffect(() => {
    wallet.hydrate();
    progressionStore.hydrate();
    dailyStore.hydrate();
    missionsStore.hydrate();
    achievementsStore.hydrate();
    statsStore.hydrate();
    weeklyStore.hydrate();
  }, []);

  return (
    <main className="min-h-screen bg-[#080c0b] text-white">
      <header className="sticky top-0 z-40 border-b border-[#c8a65b]/20 bg-[#0b100e] pt-[env(safe-area-inset-top)]">
  <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8 sm:py-4">
    <div className="flex items-center justify-between gap-3">
      <h1 className="truncate text-lg font-black tracking-[0.12em] sm:text-3xl">
        ROYAL <span className="text-[#d7b45b]">ACE</span>
      </h1>

      <div className="rounded-2xl border border-[#c8a65b]/30 bg-[#151b15] px-3 py-1.5 text-right">
        <p className="text-[9px] leading-none text-white/50">Chips</p>
        <p className="text-base font-bold leading-tight text-[#e5c779]">
          ◈ <Counter value={balance} />
        </p>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
      <button
        onClick={() => setStatsOpen(true)}
        aria-label="Open statistics"
        className="flex h-11 flex-1 touch-manipulation select-none items-center justify-center rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] text-lg text-[#e5c779] transition active:scale-95"
      >
        📊
      </button>

      <button
        onClick={() => setAchievementsOpen(true)}
        aria-label="Open achievements"
        className="flex h-11 flex-1 touch-manipulation select-none items-center justify-center rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] text-lg text-[#e5c779] transition active:scale-95"
      >
        🏆
      </button>

      <button
        onClick={() => setRewardsOpen(true)}
        aria-label="Open rewards"
        className="flex h-11 flex-1 touch-manipulation select-none items-center justify-center rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] text-lg text-[#e5c779] transition active:scale-95"
      >
        🎁
      </button>
    </div>

    <div className="hidden items-center justify-end gap-3 sm:flex">
      <button
        onClick={() => setStatsOpen(true)}
        className="rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] px-4 py-2 text-sm font-bold text-[#e5c779] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10"
      >
        📊 Stats
      </button>

      <button
        onClick={() => setAchievementsOpen(true)}
        className="rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] px-4 py-2 text-sm font-bold text-[#e5c779] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10"
      >
        🏆 Achievements
      </button>

      <button
        onClick={() => setRewardsOpen(true)}
        className="rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] px-4 py-2 text-sm font-bold text-[#e5c779] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10"
      >
        🎁 Rewards
      </button>
    </div>
  </div>
</header>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-8 sm:pt-6">
        <div className="mb-6 flex min-w-0 items-center gap-2 sm:gap-3">
  <div
    className="flex shrink-0 items-center gap-2 sm:gap-3"
    role="tablist"
    aria-label="Games"
  >
    {TABS.map((t) => {
      const blocked = locked && tab !== t.id;
      const selected = tab === t.id;

      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-label={t.id === "blackjack" ? "Blackjack" : "Slot machine"}
          aria-selected={selected}
          disabled={blocked}
          title={blocked ? "Finish the current round first" : t.label}
          onClick={() => setTab(t.id)}
          className={`relative touch-manipulation select-none [-webkit-tap-highlight-color:transparent] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-40 sm:h-auto sm:w-auto sm:px-6 sm:py-3 sm:text-sm sm:font-bold ${
            selected
              ? "border-[#e5c779]/70 bg-gradient-to-b from-[#efcf83] to-[#b9913f] text-[#10130e] shadow-[0_3px_0_#765b25,0_0_14px_rgba(229,199,121,0.15)]"
              : "border-white/15 bg-gradient-to-b from-[#29312c] to-[#131a16] text-white/65 shadow-[0_3px_0_#080c0b] hover:border-[#e5c779]/40 hover:text-white"
          }`}
        >
          <span aria-hidden="true" className="sm:hidden">
            {t.id === "blackjack" ? "♠" : "🎰"}
          </span>

          <span className="hidden sm:inline">
            {t.label}
          </span>
        </button>
      );
    })}
  </div>

  <span
    role="status"
    className={`min-w-0 flex-1 truncate text-[10px] text-white/40 sm:text-xs ${
      locked ? "visible" : "invisible"
    }`}
  >
    Round in progress…
  </span>

  <div className="ml-auto shrink-0">
    <AudioControls />
  </div>
</div>

        {/* Les deux jeux restent montés : on ne perd pas une manche en changeant d'onglet. */}
        <div className={tab === "blackjack" ? "" : "hidden"}>
          <Blackjack active={tab === "blackjack"} />
        </div>
        <div className={tab === "slots" ? "" : "hidden"}>
          <Slots active={tab === "slots"} />
        </div>
      </section>

      <RewardsPanel open={rewardsOpen} onClose={() => setRewardsOpen(false)} />
      <AchievementsPanel
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      />
      <AchievementToasts />
      <StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} />
    </main>
  );
}
