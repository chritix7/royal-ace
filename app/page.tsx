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
import Penalty from "../components/Penalty";
import Sportsbook from "../components/Sportsbook";
import StatsPanel from "../components/StatsPanel";
import { Counter } from "../components/ui";
import { achievementsStore, challengeView, extrasView, milestoneView, useAchievements } from "../lib/achievementsStore";
import { today } from "../lib/clock";
import { dailyStatus, dailyStore, useDaily } from "../lib/daily";
import { statsStore, useStats } from "../lib/statsStore";
import { useBalance, useLocked, wallet } from "../lib/wallet";
import AchievementToasts from "../components/AchievementToasts";
import GameToasts from "../components/GameToasts";
import { ambience } from "../lib/ambience";
import ErrorBoundary from "../components/ErrorBoundary";
import { progressionStore, useProgression } from "../lib/progression";
import { weeklyStore } from "../lib/weekly";
import ChipFly from "../components/ChipFly";
import { IconBall, IconTicket, IconDice, IconFocus, IconHome, IconPoker, IconRoulette, IconSlot, IconSpade } from "../components/UiIcons";
import Lobby from "../components/Lobby";
import { profileStore, useProfile } from "../lib/profile";
import { SettingsPage, ShopPage, type SettingsTab } from "../components/SettingsSheet";
import WelcomeTour, { WELCOME_KEY } from "../components/WelcomeTour";
import AgeGate from "../components/AgeGate";
import DomainMove from "../components/DomainMove";
import SiteStats from "../components/SiteStats";
import BragPrompt from "../components/BragPrompt";
import { i18n } from "../lib/i18n";
import { motion, startRest } from "../lib/motion";
import { cloud } from "../lib/cloud";
import { board } from "../lib/leaderboard";
import HotkeysOverlay from "../components/HotkeysOverlay";
import { useBalanceFlash } from "../hooks/useBalanceFlash";
import { sessionStore } from "../lib/sessionStore";

type Tab = "blackjack" | "slots" | "roulette" | "poker" | "craps" | "penalty" | "sports";
const TABS: { id: Tab; label: string; Icon: (p: { className?: string }) => ReactElement; aria: string }[] = [
  { id: "blackjack", label: "Blackjack", Icon: IconSpade, aria: "Blackjack" },
  { id: "slots", label: "Slot machine", Icon: IconSlot, aria: "Slot machine" },
  { id: "roulette", label: "Roulette", Icon: IconRoulette, aria: "Roulette" },
  { id: "poker", label: "Hold'em", Icon: IconPoker, aria: "Casino Hold'em poker" },
  { id: "craps", label: "Craps", Icon: IconDice, aria: "Craps" },
  { id: "penalty", label: "Penalty", Icon: IconBall, aria: "Penalty shoot-out" },
  { id: "sports", label: "Sportsbook", Icon: IconTicket, aria: "Sports betting" },
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
      <span className={`ui-card__label ${compact ? "!text-[9px] !tracking-[0.14em]" : ""}`}>
        {label}
        {highlight && <span aria-hidden className="ui-card__dot" />}
      </span>
      <span className={`ui-card__value ${compact ? "!text-xs !leading-4" : ""}`}>{value}</span>
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("blackjack");
  // The lobby is the home screen: games are chosen there, and the Lobby
  // key brings you back to it. Each game has its own address (#craps…).
  const [inLobby, setInLobby] = useState(true);
  const isTab = (x: string): x is Tab => TABS.some((t) => t.id === x);
  const openGame = (id: Tab, replace = false) => {
    setTab(id);
    setInLobby(false);
    profileStore.setLastGame(id);
    try {
      if (replace) history.replaceState({ game: id }, "", `#${id}`);
      else history.pushState({ game: id }, "", `#${id}`);
    } catch {}
  };
  const goLobby = () => {
    setFocusMode(false);
    setInLobby(true);
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch {}
  };
  useEffect(() => {
    profileStore.hydrate();
    const fromHash = location.hash.slice(1);
    if (isTab(fromHash)) openGame(fromHash, true);
    const onPop = () => {
      const h = location.hash.slice(1);
      if (isTab(h)) {
        setTab(h);
        setInLobby(false);
      } else {
        setFocusMode(false);
        setInLobby(true);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Games are loaded the first time they are opened, then kept (a hand or
  // a spin in progress is never lost). Phones only run what was played.
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set<Tab>());
  useEffect(() => {
    if (!inLobby) setVisited((v) => (v.has(tab) ? v : new Set(v).add(tab)));
  }, [tab, inLobby]);
  // A game with a round saved mid-play (reload) is loaded straight away,
  // so it can settle or resume it.
  useEffect(() => {
    const waiting: [Tab, string][] = [
      ["roulette", "royalace:roulette"],
      ["poker", "royalace:poker"],
      ["craps", "royalace:craps"],
      ["penalty", "royalace:penalty"],
      ["sports", "royalace:sports"],
    ];
    const add: Tab[] = [];
    for (const [t, key] of waiting) {
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null");
        if (saved?.pending || saved?.round) add.push(t);
      } catch {}
    }
    if (add.length) setVisited((v) => new Set([...v, ...add]));
  }, []);
  // Ambience follows the game on screen (casino floor, stadium…).
  useEffect(() => {
    ambience.setScene(inLobby ? "lobby" : tab);
  }, [inLobby, tab]);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  // Immersive (Focus) mode — the fullscreen blackjack view. Lifted up
  // from <Blackjack> so the toggle button can live in the top toolbar
  // on the same line as the game tabs and the audio controls.
  const [focusMode, setFocusMode] = useState(false);
  // Closing animations for every panel, dialog and menu (blur-out).
  useEffect(() => installExitAnimations(), []);
  // Clear focus whenever the user switches game or goes to the lobby.
  useEffect(() => {
    setFocusMode(false);
  }, [tab, inLobby]);

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
      if (TABS.some((t) => t.id === id)) openGame(id as Tab, true);
    };
    window.addEventListener("royal-ace:goto-tab", onGoto);
    return () => window.removeEventListener("royal-ace:goto-tab", onGoto);
  }, []);
  const balance = useBalance();
  const [lgUp, setLgUp] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLgUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // A challenge notice opens the panel.
  useEffect(() => {
    const open = () => setAchievementsOpen(true);
    window.addEventListener("royal-ace:open-challenges", open);
    return () => window.removeEventListener("royal-ace:open-challenges", open);
  }, []);

  // Live figures for the header cards.
  const stats = useStats();
  const rounds = stats.bjHands + stats.spins + (stats.rouletteSpins ?? 0) + (stats.pokerHands ?? 0) + (stats.crapsRolls ?? 0) + (stats.penaltyRounds ?? 0) + (stats.betsPlaced ?? 0);
  const roundsLabel = `${rounds.toLocaleString("en-US")} ${rounds === 1 ? "round" : "rounds"}`;
  const achState = useAchievements();
  const challenges = challengeView(achState);
  const extrasToClaim = extrasView(achState).filter((x) => x.done && !x.claimed).length;
  const challengesDone = challenges.filter((c) => c.done).length;
  const careerToClaim = milestoneView().filter((m) => m.done && !m.claimed).length;
  const challengesToClaim = challenges.filter((c) => c.done && !c.claimed).length + extrasToClaim + careerToClaim;
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
    motion.boot();
    startRest(() => wallet.getLocked());
    i18n.boot();
    void cloud.boot();
    board.start();
    // Play time: counted while the page is visible and used in the last 2 minutes.
    let lastInput = Date.now();
    const onInput = () => (lastInput = Date.now());
    window.addEventListener("pointerdown", onInput, { passive: true });
    window.addEventListener("keydown", onInput);
    const playClock = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput < 120000) profileStore.addPlayTime(15000);
    }, 15000);
    // The home-screen splash is a full-screen layer: take it out of the page
    // once it has played (an invisible layer can keep iOS from opening the keyboard).
    const splash = window.setTimeout(() => document.querySelector<HTMLElement>(".app-splash")?.style.setProperty("display", "none", "important"), 1500);
    return () => {
      window.clearTimeout(splash);
      window.clearInterval(playClock);
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("keydown", onInput);
    };
  }, []);

  // Settings & shop sheet: from the header gear, or from a locked theme.
  const [settings, setSettings] = useState<{ tab: SettingsTab; item?: string } | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ tab?: SettingsTab; item?: string }>).detail ?? {};
      setSettings({ tab: d.tab ?? "settings", item: d.item });
    };
    window.addEventListener("royal-ace:settings", on);
    return () => window.removeEventListener("royal-ace:settings", on);
  }, []);
  // First-launch tour of the lobby, once the name has been asked.
  const profile = useProfile();
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    if (!inLobby || !profile.asked) return;
    let seen = true;
    try {
      seen = localStorage.getItem(WELCOME_KEY) === "done";
    } catch {}
    if (seen) return;
    const t = window.setTimeout(() => setTourOpen(true), 700);
    return () => window.clearTimeout(t);
  }, [inLobby, profile.asked]);

  return (
    <main className="min-h-screen bg-[#080c0b] text-white">
      <header className="sticky top-0 z-40 border-b border-[#c8a65b]/20 bg-[#0b100e] pt-[env(safe-area-inset-top)]">
  <div className="mx-auto max-w-screen-2xl px-4 py-2 sm:px-8 sm:py-3">
    <div className="flex items-center gap-3">
      <h1 className="font-display header-shine truncate text-lg font-black tracking-[0.12em] sm:text-3xl">
        CHRYSO
        <span className="animate-header-breathe text-[#d7b45b]">NYX</span>
      </h1>

      {/* Desktop quick-nav — sits on the same row between CHRYSONYX and the
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
      <section className="mx-auto max-w-screen-2xl px-4 pb-3 pt-2 sm:px-8 sm:pt-3 lg:pb-2.5">
        <div className="mb-2 flex min-w-0 items-center gap-2 sm:mb-3 sm:gap-3 lg:gap-2">
  {inLobby ? (
    <p className="lb-title min-w-0 flex-1 truncate">Choose your game</p>
  ) : (
    <>
      <button
        type="button"
        onClick={goLobby}
        disabled={locked}
        title={locked ? "Finish the round in progress first" : "Back to the lobby"}
        className="ui-pill ui-pill--lobby shrink-0"
      >
        <IconHome className="h-[17px] w-[17px]" />
        <span>Lobby</span>
      </button>
      <span className="ui-game-name hidden min-w-0 truncate sm:inline-flex">
        {(() => {
          const T = TABS.find((t) => t.id === tab)!;
          return (
            <>
              <T.Icon className="h-4 w-4 shrink-0" />
              {T.label}
            </>
          );
        })()}
      </span>
      <span role="status" className={`min-w-0 flex-1 truncate text-[10px] text-white/40 max-[399px]:hidden sm:text-xs ${locked && tab !== "slots" ? "visible" : "invisible"}`}>
        Round in progress…
      </span>
    </>
  )}

  <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
    {/* Sound, ambience and vibration live in Settings: the bar keeps its
        room. Still mounted (hidden) — it starts the music on first touch. */}
    <div className="hidden">
      <AudioControls />
    </div>
    <button
      type="button"
      onClick={() => setSettings({ tab: "shop" })}
      aria-label="Shop"
      title="Shop"
      className="ui-pill"
    >
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8z" />
        <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
      </svg>
      <span className="hidden lg:inline">Shop</span>
    </button>
    <button
      type="button"
      data-tour="settings"
      onClick={() => setSettings({ tab: "settings" })}
      aria-label="Settings"
      title="Settings"
      className="ui-pill"
    >
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
      <span className="hidden lg:inline">Settings</span>
    </button>

    {/* Focus (immersive) toggle — only meaningful on the blackjack tab.
        Lives in the top toolbar so it shares a row with the game tabs
        and the audio controls. */}
    {!inLobby && (
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
        {inLobby && (
          <div className="app-view-in h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[480px] lg:h-[calc(100dvh-10rem)] lg:min-h-[540px]">
            <Lobby
              desktop={lgUp}
              onPlay={(id) => openGame(id)}
              onOpenChallenges={() => setAchievementsOpen(true)}
              onOpenRewards={() => setRewardsOpen(true)}
              inProgress={locked ? tab : null}
            />
          </div>
        )}
        <div className={tab === "blackjack" && !inLobby ? "app-view-in" : "hidden"}>
          {visited.has("blackjack") && (
          <ErrorBoundary label="Blackjack">
            <Blackjack
              active={tab === "blackjack" && !inLobby}
              focusMode={tab === "blackjack" && !inLobby && focusMode}
              onFocusChange={setFocusMode}
            />
          </ErrorBoundary>
          )}
        </div>
        <div className={tab === "slots" && !inLobby ? "app-view-in" : "hidden"}>
          {visited.has("slots") && (
          <ErrorBoundary label="Slots">
            <Slots
              active={tab === "slots" && !inLobby}
              focus={tab === "slots" && !inLobby && focusMode}
              onFocusChange={setFocusMode}
            />
          </ErrorBoundary>
          )}
        </div>
        <div className={tab === "roulette" && !inLobby ? "app-view-in" : "hidden"}>
          {visited.has("roulette") && (
          <ErrorBoundary label="Roulette">
            <Roulette
              active={tab === "roulette" && !inLobby}
              focus={tab === "roulette" && !inLobby && focusMode}
              onFocusChange={setFocusMode}
            />
          </ErrorBoundary>
          )}
        </div>
        <div className={tab === "poker" && !inLobby ? "app-view-in" : "hidden"}>
          {visited.has("poker") && (
          <ErrorBoundary label="Casino Hold'em">
            <Poker active={tab === "poker" && !inLobby} focus={tab === "poker" && !inLobby && focusMode} onFocusChange={setFocusMode} />
          </ErrorBoundary>
          )}
        </div>
        <div className={tab === "craps" && !inLobby ? "app-view-in" : "hidden"}>
          {visited.has("craps") && (
          <ErrorBoundary label="Craps">
            <Craps active={tab === "craps" && !inLobby} focus={tab === "craps" && !inLobby && focusMode} onFocusChange={setFocusMode} />
          </ErrorBoundary>
          )}
        </div>
        <div className={tab === "penalty" && !inLobby ? "app-view-in" : "hidden"}>
          {visited.has("penalty") && (
          <ErrorBoundary label="Penalty">
            <Penalty active={tab === "penalty" && !inLobby} focus={tab === "penalty" && !inLobby && focusMode} onFocusChange={setFocusMode} />
          </ErrorBoundary>
          )}
        </div>
        <div className={tab === "sports" && !inLobby ? "app-view-in" : "hidden"}>
          {visited.has("sports") && (
          <ErrorBoundary label="Sportsbook">
            <Sportsbook active={tab === "sports" && !inLobby} focus={tab === "sports" && !inLobby && focusMode} onFocusChange={setFocusMode} />
          </ErrorBoundary>
          )}
        </div>
      </section>

      <ChipFly />

      <RewardsPanel open={rewardsOpen} onClose={() => setRewardsOpen(false)} />
      <AchievementsPanel
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      />
      <AchievementToasts />
      <GameToasts />
      <StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} />
      <HotkeysOverlay />
      {settings?.tab === "settings" && <SettingsPage onClose={() => setSettings(null)} onTour={() => setTourOpen(true)} />}
      {settings?.tab === "shop" && <ShopPage item={settings.item} onClose={() => setSettings(null)} />}
      {tourOpen && inLobby && <WelcomeTour onClose={() => setTourOpen(false)} />}
      <AgeGate />
      <DomainMove />
      <SiteStats />
      <BragPrompt />
    </main>
  );
}
