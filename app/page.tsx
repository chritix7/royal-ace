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
import ErrorBoundary from "../components/ErrorBoundary";
import { progressionStore } from "../lib/progression";
import { weeklyStore } from "../lib/weekly";
import ChipFly from "../components/ChipFly";
import { useBalanceFlash } from "../hooks/useBalanceFlash";
import { sessionStore } from "../lib/sessionStore";

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
  // Immersive (Focus) mode — the fullscreen blackjack view. Lifted up
  // from <Blackjack> so the toggle button can live in the top toolbar
  // on the same line as the game tabs and the audio controls.
  const [focusMode, setFocusMode] = useState(false);
  // Clear focus whenever the user leaves the blackjack tab.
  useEffect(() => {
    if (tab !== "blackjack") setFocusMode(false);
  }, [tab]);
  const balance = useBalance();
  const flash = useBalanceFlash();
  const locked = useLocked();

  useEffect(() => {
    wallet.hydrate();
    sessionStore.hydrate();
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
  <div className="mx-auto max-w-screen-2xl px-4 py-3 sm:px-8 sm:py-4">
    <div className="flex items-center gap-3">
      <h1 className="header-shine truncate text-lg font-black tracking-[0.12em] sm:text-3xl">
        ROYAL{" "}
        <span className="animate-header-breathe text-[#d7b45b]">ACE</span>
      </h1>

      {/* Desktop quick-nav — sits on the same row between ROYAL ACE and the
          chips counter, in order: Stats · Achievements · Rewards · Chips. */}
      <div className="ml-auto hidden items-center gap-2 sm:flex">
        <button
          onClick={() => setStatsOpen(true)}
          className="rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.15),0_2px_0_rgba(0,0,0,0.5)] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10 active:translate-y-px"
        >
          📊 Stats
        </button>

        <button
          onClick={() => setAchievementsOpen(true)}
          className="rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.15),0_2px_0_rgba(0,0,0,0.5)] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10 active:translate-y-px"
        >
          🏆 Achievements
        </button>

        <button
          onClick={() => setRewardsOpen(true)}
          className="rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.15),0_2px_0_rgba(0,0,0,0.5)] transition hover:border-[#e5c779] hover:bg-[#e5c779]/10 active:translate-y-px"
        >
          🎁 Rewards
        </button>
      </div>

      <div
        data-chips-counter="header"
        className={`sm:ml-2 ml-auto rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] px-3.5 py-1.5 text-right shadow-[inset_0_1px_0_rgba(229,199,121,0.15),0_2px_0_rgba(0,0,0,0.5)] ${
          flash ? "balance-halo-gold" : ""
        }`}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none text-[#d7b45b]/70">Chips</p>
        <p className="mt-0.5 text-base font-black leading-tight text-[#e5c779] tabular-nums">
          ◈{" "}
          <span className={flash ? "balance-flash" : ""}>
            <Counter value={balance} />
          </span>
        </p>
      </div>
    </div>

    {/* Mobile quick-nav row — compact emoji chips, kept on its own line below. */}
    <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
      <button
        onClick={() => setStatsOpen(true)}
        aria-label="Open statistics"
        className="flex h-11 flex-1 touch-manipulation select-none items-center justify-center rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] text-lg text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.12),0_2px_0_rgba(0,0,0,0.5)] transition active:translate-y-px active:scale-[0.97]"
      >
        📊
      </button>

      <button
        onClick={() => setAchievementsOpen(true)}
        aria-label="Open achievements"
        className="flex h-11 flex-1 touch-manipulation select-none items-center justify-center rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] text-lg text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.12),0_2px_0_rgba(0,0,0,0.5)] transition active:translate-y-px active:scale-[0.97]"
      >
        🏆
      </button>

      <button
        onClick={() => setRewardsOpen(true)}
        aria-label="Open rewards"
        className="flex h-11 flex-1 touch-manipulation select-none items-center justify-center rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] text-lg text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.12),0_2px_0_rgba(0,0,0,0.5)] transition active:translate-y-px active:scale-[0.97]"
      >
        🎁
      </button>
    </div>
  </div>
</header>
      <section className="mx-auto max-w-screen-2xl px-4 pb-16 pt-4 sm:px-8 sm:pt-6">
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
  onClick={() => setTab(t.id)}
  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl outline-none transition-[filter,transform,background,color,border-color] focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:translate-y-px enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:h-auto sm:w-auto sm:px-6 sm:py-3 sm:text-[12px] sm:font-black sm:uppercase sm:tracking-wider ${
    selected
      ? "border-[#e5c779]/70 bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] text-[#10130e] shadow-[0_3px_0_#765b25,inset_0_1px_0_rgba(255,255,255,0.3)]"
      : "border-white/15 bg-gradient-to-b from-[#1c2420] to-[#141a16] text-white/65 shadow-[0_3px_0_#080c0b,inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-[#e5c779]/40 hover:text-white"
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

  <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2">
    <AudioControls />

    {/* Focus (immersive) toggle — only meaningful on the blackjack tab.
        Lives in the top toolbar so it shares a row with the game tabs
        and the audio controls. */}
    {tab === "blackjack" && (
      <button
        type="button"
        onClick={() => setFocusMode((v) => !v)}
        aria-pressed={focusMode}
        aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
        className="hidden items-center justify-center gap-1.5 rounded-full border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.15),0_2px_0_rgba(0,0,0,0.5)] outline-none transition hover:border-[#e5c779] hover:bg-[#e5c779]/10 focus-visible:ring-2 focus-visible:ring-[#e5c779] active:translate-y-px sm:inline-flex"
      >
        <span aria-hidden="true">⛶</span>
        Focus
      </button>
    )}
  </div>
</div>

        {/* Les deux jeux restent montés : on ne perd pas une manche en changeant d'onglet. */}
        <div className={tab === "blackjack" ? "" : "hidden"}>
          <ErrorBoundary label="Blackjack">
            <Blackjack
              active={tab === "blackjack"}
              focusMode={focusMode}
              onFocusChange={setFocusMode}
            />
          </ErrorBoundary>
        </div>
        <div className={tab === "slots" ? "" : "hidden"}>
          <ErrorBoundary label="Slots">
            <Slots active={tab === "slots"} />
          </ErrorBoundary>
        </div>
      </section>

      <ChipFly />

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
