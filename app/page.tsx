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
    dailyStore.hydrate();
    missionsStore.hydrate();
    achievementsStore.hydrate();
    statsStore.hydrate();
  }, []);

  return (
    <main className="min-h-screen bg-[#080c0b] text-white">
      <header className="border-b border-[#c8a65b]/20 bg-[#0b100e]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <h1 className="text-2xl font-black tracking-[0.12em] sm:text-3xl">
              ROYAL <span className="text-[#d7b45b]">ACE</span>
            </h1>
            <p className="text-[11px] text-white/40">The private game room</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStatsOpen(true)}
              className="rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] px-4 py-2 text-sm font-bold text-[#e5c779] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10"
              aria-label="Open statistics"
            >
              📊 Stats
            </button>

            <button
              onClick={() => setAchievementsOpen(true)}
              className="rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] px-4 py-2 text-sm font-bold text-[#e5c779] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10"
              aria-label="Open achievements"
            >
              🏆 Achievements
            </button>

            <button
  onClick={() => setRewardsOpen(true)}
  className="rounded-2xl border border-[#c8a65b]/40 bg-[#151b15] px-4 py-2 text-sm font-bold text-[#e5c779] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10"
  aria-label="Open rewards"
>
  🎁 Rewards
</button>

            <div className="rounded-2xl border border-[#c8a65b]/30 bg-[#151b15] px-4 py-2 text-right">
              <p className="text-[10px] text-white/50">Your chips</p>
              <p className="text-xl font-bold text-[#e5c779]">
                ◈ <Counter value={balance} />
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3" role="tablist" aria-label="Games">
          {TABS.map((t) => {
            const blocked = locked && tab !== t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                disabled={blocked}
                title={blocked ? "Finish the current round first" : undefined}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-6 py-3 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-40 ${
                  tab === t.id
                    ? "bg-[#d7b45b] text-[#10130e]"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
          {locked && <span className="text-xs text-white/40">Round in progress…</span>}
          <div className="ml-auto">
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
