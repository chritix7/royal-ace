"use client";

import { useEffect, useState, type ReactElement } from "react";
import { installExitAnimations } from "../lib/exitAnimations";
import AchievementsPanel from "../components/AchievementsPanel";
import AudioControls from "../components/AudioControls";
import Blackjack from "../components/Blackjack";
import RewardsPanel from "../components/RewardsPanel";
import Slots from "../components/Slots";
import Roulette from "../components/Roulette";
import Poker from "../components/Poker";
import Craps from "../components/Craps";
import StatsPanel from "../components/StatsPanel";
import { Counter } from "../components/ui";
import { achievementsStore, challengeView, extrasView, useAchievements } from "../lib/achievementsStore";
import { today } from "../lib/clock";
import { dailyStatus, dailyStore, useDaily } from "../lib/daily";
import { statsStore, useStats } from "../lib/statsStore";
import { useBalance, useLocked, wallet } from "../lib/wallet";
import AchievementToasts from "../components/AchievementToasts";
import ErrorBoundary from "../components/ErrorBoundary";
import { progressionStore, useProgression } from "../lib/progression";
import { weeklyStore } from "../lib/weekly";
import ChipFly from "../components/ChipFly";
import { IconDice, IconFocus, IconPoker, IconRoulette, IconSlot, IconSpade } from "../components/UiIcons";
import HotkeysOverlay from "../components/HotkeysOverlay";
import { useBalanceFlash } from "../hooks/useBalanceFlash";
import { sessionStore } from "../lib/sessionStore";

type Tab = "blackjack" | "slots" | "roulette" | "poker" | "craps";
const TABS: { id: Tab; label: string; Icon: (p: { className?: string }) => ReactElement; aria: string }[] = [
  { id: "blackjack", label: "Blackjack", Icon: IconSpade, aria: "Blackjack" },
  { id: "slots", label: "Slot machine", Icon: IconSlot, aria: "Slot machine" },
  { id: "roulette", label: "Roulette", Icon: IconRoulette, aria: "Roulette" },
  { id: "poker", label: "Hold'em", Icon: IconPoker, aria: "Casino Hold'em poker" },
  { id: "craps", label: "Craps", Icon: IconDice, aria: "Craps" },
];

/**
 * Header card for Statistics / Achievements / Rewards: a small gold
 * eyebrow over a live figure, in the same frame as the Chips counter
 * so the top bar reads as one row of instruments.
 */
function HeaderCard({
  label,
  value,
  onClick,
  highlight = false,
  compact = false,
}: {
  label: string;
  value: string;
  onClick: () => void;
  highlight?: boolean;
  /** Phone version: smaller type, fills a third of the row. */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ui-card group text-left ${compact ? "min-w-0 flex-1 touch-manipulation select-none !rounded-xl !px-2.5 !py-1" : ""} ${highlight ? "is-hot" : ""}`}
    >
      <span className={`ui-card__label ${compact ? "!text-[8px] !tracking-[0.16em]" : ""}`}>
        {label}
        {highlight && <span aria-hidden className="ui-card__dot" />}
      </span>
      <span className={`ui-card__value ${compact ? "!text-xs !leading-4" : ""}`}>{value}</span>
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("blackjack");
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  // Immersive (Focus) mode — the fullscreen blackjack view. Lifted up
  // from <Blackjack> so the toggle button can live in the top toolbar
  // on the same line as the game tabs and the audio controls.
  const [focusMode, setFocusMode] = useState(false);
  // Closing animations for every panel, dialog and menu (blur-out).
  useEffect(() => installExitAnimations(), []);
  // Clear focus whenever the user switches game.
  useEffect(() => {
    setFocusMode(false);
  }, [tab]);

  // F-key toggle for Focus mode — the blackjack hook broadcasts a
  // CustomEvent when the user presses F; we listen here because the
  // state lives on this page.
  useEffect(() => {
    const onToggle = () => {
      setFocusMode((v) => !v);
    };
    window.addEventListener("royal-ace:toggle-focus", onToggle as EventListener);
    return () =>
      window.removeEventListener("royal-ace:toggle-focus", onToggle as EventListener);
  }, [tab]);
  // A game with a hand waiting (restored after a reload) brings its tab back.
  useEffect(() => {
    const onGoto = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (TABS.some((t) => t.id === id)) setTab(id as Tab);
    };
    window.addEventListener("royal-ace:goto-tab", onGoto);
    return () => window.removeEventListener("royal-ace:goto-tab", onGoto);
  }, []);
  const balance = useBalance();

  // Live figures for the header cards.
  const stats = useStats();
  const rounds = stats.bjHands + stats.spins + (stats.rouletteSpins ?? 0) + (stats.pokerHands ?? 0) + (stats.crapsRolls ?? 0);
  const roundsLabel = `${rounds.toLocaleString("en-US")} ${rounds === 1 ? "round" : "rounds"}`;
  const achState = useAchievements();
  const challenges = challengeView(achState);
  const extrasToClaim = extrasView(achState).filter((x) => x.done && !x.claimed).length;
  const challengesDone = challenges.filter((c) => c.done).length;
  const challengesToClaim = challenges.filter((c) => c.done && !c.claimed).length + extrasToClaim;
  const daily = useDaily();
  const progression = useProgression();
  // Is today's daily bonus still waiting? Depends on today's date, so
  // it is worked out on the client only.
  const [bonusReady, setBonusReady] = useState(false);
  useEffect(() => {
    setBonusReady(dailyStatus(daily, today(), progression.level).canClaim);
  }, [daily, progression.level]);
  const flash = useBalanceFlash();
  const locked = useLocked();

  useEffect(() => {
    wallet.hydrate();
    sessionStore.hydrate();
    progressionStore.hydrate();
    // Blackjack progressive jackpot pool survives reloads.
    import("../lib/bjJackpot").then(({ bjJackpot }) => bjJackpot.hydrate());
    dailyStore.hydrate();
    achievementsStore.hydrate();
    statsStore.hydrate();
    weeklyStore.hydrate();
  }, []);

  return (
    <main className="min-h-screen bg-[#080c0b] text-white">
      <header className="sticky top-0 z-40 border-b border-[#c8a65b]/20 bg-[#0b100e] pt-[env(safe-area-inset-top)]">
  <div className="mx-auto max-w-screen-2xl px-4 py-2 sm:px-8 sm:py-3">
    <div className="flex items-center gap-3">
      <h1 className="font-display header-shine truncate text-lg font-black tracking-[0.12em] sm:text-3xl">
        ROYAL{" "}
        <span className="animate-header-breathe text-[#d7b45b]">ACE</span>
      </h1>

      {/* Desktop quick-nav — sits on the same row between ROYAL ACE and the
          chips counter, in order: Stats · Achievements · Rewards · Chips. */}
      <div className="ml-auto hidden items-stretch gap-2 sm:flex">
        <HeaderCard
          label="Statistics"
          value={roundsLabel}
          onClick={() => setStatsOpen(true)}
        />
        <HeaderCard
          label="Challenges"
          value={
            challengesToClaim > 0
              ? `${challengesToClaim} to claim`
              : `${challengesDone} of ${challenges.length} today`
          }
          highlight={challengesToClaim > 0}
          onClick={() => setAchievementsOpen(true)}
        />
        <HeaderCard
          label="Rewards"
          value={bonusReady ? "Daily bonus ready" : `Level ${progression.level}`}
          highlight={bonusReady}
          onClick={() => setRewardsOpen(true)}
        />
      </div>

      <div
        data-chips-counter="header"
        className={`ui-card ui-card--chips ml-auto text-right sm:ml-2 ${flash ? "balance-halo-gold" : ""}`}
      >
        <p className="ui-card__label hidden justify-end sm:flex">Chips</p>
        <p className="ui-chips-value tabular-nums">
          ◈{" "}
          <span className={flash ? "balance-flash" : ""}>
            <Counter value={balance} />
          </span>
        </p>
      </div>
    </div>

    {/* Phone quick-nav row — the same three cards as on desktop, in a
        compact size: a label and a live figure each. */}
    <div className="mt-2 flex items-stretch gap-1.5 sm:hidden">
      <HeaderCard
        compact
        label="Stats"
        value={roundsLabel}
        onClick={() => setStatsOpen(true)}
      />
      <HeaderCard
        compact
        label="Challenges"
        value={
          challengesToClaim > 0
            ? `${challengesToClaim} to claim`
            : `${challengesDone} of ${challenges.length}`
        }
        highlight={challengesToClaim > 0}
        onClick={() => setAchievementsOpen(true)}
      />
      <HeaderCard
        compact
        label="Rewards"
        value={bonusReady ? "Bonus ready" : `Level ${progression.level}`}
        highlight={bonusReady}
        onClick={() => setRewardsOpen(true)}
      />
    </div>
  </div>
</header>
      <section className="mx-auto max-w-screen-2xl px-4 pb-3 pt-2 sm:px-8 sm:pt-3">
        <div className="mb-2 flex min-w-0 items-center gap-2 sm:mb-3 sm:gap-3 lg:gap-2">
  <div className="ui-seg shrink-0" role="tablist" aria-label="Games">
    {TABS.map((t) => {
      const blocked = locked && tab !== t.id;
      const selected = tab === t.id;
      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-label={t.aria}
          aria-selected={selected}
          disabled={blocked}
          onClick={() => setTab(t.id)}
          className={`ui-seg__btn ${selected ? "is-on" : ""}`}
        >
          <t.Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="hidden 2xl:inline">{t.label}</span>
        </button>
      );
    })}
  </div>

  <span
    role="status"
    className={`min-w-0 flex-1 truncate text-[10px] text-white/40 max-[399px]:hidden sm:text-xs ${
      locked && tab !== "slots" ? "visible" : "invisible"
    }`}
  >
    Round in progress…
  </span>

  <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
    <AudioControls />

    {/* Focus (immersive) toggle — only meaningful on the blackjack tab.
        Lives in the top toolbar so it shares a row with the game tabs
        and the audio controls. */}
    {(
      <button
        type="button"
        onClick={() => setFocusMode((v) => !v)}
        aria-pressed={focusMode}
        aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
        className={`ui-pill ${focusMode ? "is-on" : ""}`}
      >
        <IconFocus />
        <span className="hidden sm:inline">Focus</span>
      </button>
    )}
  </div>
</div>

        {/* Les deux jeux restent montés : on ne perd pas une manche en changeant d'onglet. */}
        <div className={tab === "blackjack" ? "" : "hidden"}>
          <ErrorBoundary label="Blackjack">
            <Blackjack
              active={tab === "blackjack"}
              focusMode={tab === "blackjack" && focusMode}
              onFocusChange={setFocusMode}
            />
          </ErrorBoundary>
        </div>
        <div className={tab === "slots" ? "" : "hidden"}>
          <ErrorBoundary label="Slots">
            <Slots
              active={tab === "slots"}
              focus={tab === "slots" && focusMode}
              onFocusChange={setFocusMode}
            />
          </ErrorBoundary>
        </div>
        <div className={tab === "roulette" ? "" : "hidden"}>
          <ErrorBoundary label="Roulette">
            <Roulette
              active={tab === "roulette"}
              focus={tab === "roulette" && focusMode}
              onFocusChange={setFocusMode}
            />
          </ErrorBoundary>
        </div>
        <div className={tab === "poker" ? "" : "hidden"}>
          <ErrorBoundary label="Casino Hold'em">
            <Poker active={tab === "poker"} focus={tab === "poker" && focusMode} onFocusChange={setFocusMode} />
          </ErrorBoundary>
        </div>
        <div className={tab === "craps" ? "" : "hidden"}>
          <ErrorBoundary label="Craps">
            <Craps active={tab === "craps"} focus={tab === "craps" && focusMode} onFocusChange={setFocusMode} />
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
      <HotkeysOverlay />
    </main>
  );
}
