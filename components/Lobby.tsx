"use client";

import ProfileSheet from "./ProfileSheet";
import { careerStore, useCareer, weeklyRanking } from "../lib/career";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import GameArt, { type ArtId } from "./GameArt";
import { challengeView, extrasView, useAchievements } from "../lib/achievementsStore";
import type { GameId } from "../lib/achievements";
import { useStats } from "../lib/statsStore";
import { useSession } from "../lib/sessionStore";
import { useProgression, xpForNextLevel, xpInLevel } from "../lib/progression";
import { dailyStatus, dailyStore, useDaily, vipTierForLevel } from "../lib/daily";
import { today } from "../lib/clock";
import { useWeekly, WEEKLY_TIERS } from "../lib/weekly";
import { cleanName, profileStore, useProfile } from "../lib/profile";
import { useLocked } from "../lib/wallet";

export type LobbyGame = "blackjack" | "slots" | "roulette" | "poker" | "craps" | "penalty" | "sports";

type Info = {
  id: LobbyGame;
  name: string;
  tag: string;
  facts: string[];
  limits: string;
  rtp: string;
  about: string[];
  challenge?: GameId;
  stat?: [string, string, string];
  session?: "bj" | "slots" | "roulette" | "poker" | "craps" | "penalty" | "sports";
  soon?: boolean;
};

export const LOBBY_GAMES: Info[] = [
  {
    id: "blackjack",
    name: "Blackjack",
    tag: "Beat the dealer to 21",
    facts: ["Blackjack pays 3:2", "Up to 3 hands", "Perfect Pairs · 21+3"],
    limits: "From ◈ 10",
    rtp: "≈ 99.5%",
    about: ["Get closer to 21 than the dealer without going over.", "Double, split, surrender, insurance — and a coach that grades your play.", "Side bets: Perfect Pairs and 21+3. A Focus view for the full table."],
    challenge: "bj",
    stat: ["bjHands", "bjWins", "hands"],
    session: "bj",
  },
  {
    id: "slots",
    name: "Miami Kingpin",
    tag: "5-reel video slot",
    facts: ["4 progressive jackpots", "Free spins · Boss wilds", "Crowns & the vault"],
    limits: "◈ 20 – 5,000",
    rtp: "≈ 96%",
    about: ["Twenty paylines on five reels, with expanding Boss wilds and re-spins.", "Three scatters start the free spins; crowns fill the vault.", "Four jackpots grow with every spin: Mini, Minor, Major, Kingpin."],
    challenge: "slots",
    stat: ["spins", "slotWins", "spins"],
    session: "slots",
  },
  {
    id: "roulette",
    name: "Roulette",
    tag: "European · single zero",
    facts: ["Lightning up to 500×", "La Partage on even bets", "Racetrack & announces"],
    limits: "◈ 10 – 5M",
    rtp: "97.3%",
    about: ["One zero, 37 numbers — straight up pays 35 to 1.", "Lightning mode strikes 1 to 5 numbers with 50× to 500×.", "French announces (voisins, tiers, orphelins) on the racetrack."],
    challenge: "roulette",
    stat: ["rouletteSpins", "rouletteWins", "spins"],
    session: "roulette",
  },
  {
    id: "poker",
    name: "Casino Hold'em",
    tag: "Texas Hold'em vs the dealer",
    facts: ["Royal flush pays 100:1", "AA Bonus up to 100:1", "Hint at the flop"],
    limits: "Ante ◈ 10 – 500K",
    rtp: "≈ 97.8%",
    about: ["Two cards each, the flop — then call with twice your Ante, or fold.", "The dealer needs a pair of 4s to qualify.", "The AA Bonus pays on your cards and the flop, even if you fold."],
    challenge: "poker",
    stat: ["pokerHands", "pokerWins", "hands"],
    session: "poker",
  },
  {
    id: "craps",
    name: "Craps",
    tag: "Las Vegas dice",
    facts: ["3-4-5× odds, no edge", "Place, hardways, props", "Hints for newcomers"],
    limits: "◈ 10 – 500K",
    rtp: "98.6% (pass)",
    about: ["Come-out: 7 or 11 wins on the Pass line, 2, 3 or 12 loses.", "Any other number is the point — hit it again before a 7.", "Odds behind your bets pay true odds: no house edge."],
    challenge: "craps",
    stat: ["crapsRolls", "crapsWins", "rolls"],
    session: "craps",
  },
  {
    id: "penalty",
    name: "Penalty",
    tag: "Score, raise, cash out",
    facts: ["Up to 93.75× vs the Legend", "Cash out after any goal", "3 keepers: Rookie, Pro, Legend"],
    limits: "◈ 10 – 100K",
    rtp: "96%",
    about: ["Pick your keeper: Rookie (62% goals), Pro (50%) or Legend (40%).", "The better the keeper, the steeper the ladder: up to 10.48×, 30.72× or 93.75×.", "Cash out after any goal, or shoot again. A save loses the stake."],
    challenge: "penalty",
    stat: ["penaltyRounds", "penaltyGoals", "rounds"],
    session: "penalty",
  },
  {
    id: "sports",
    name: "Sportsbook",
    tag: "Real matches · live odds",
    facts: ["Football, basketball, hockey", "All in · win up to ◈ 1B", "Live odds & cash-out"],
    limits: "◈ 10 – all in",
    rtp: "≈ 94%",
    about: ["Bet virtual chips on real matches: result, goals, handicap, correct score and more.", "Add several picks to one ticket for a combo — the odds multiply.", "In play the odds follow the score; cash out before the final whistle."],
    challenge: "sports",
    stat: ["betsPlaced", "betsWon", "bets"],
    session: "sports",
  },
];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
const fmt = (n: number) => n.toLocaleString("en-US");

/* ───────── Nickname ───────── */
export function NameModal({ initial, onDone }: { initial: string; onDone: () => void }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => input.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, []);
  const submit = () => {
    const n = cleanName(value);
    if (!n) return setError("2 to 16 letters or numbers");
    profileStore.setName(n);
    onDone();
  };
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="safe-y fixed inset-0 z-[190] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Your name">
      <div className="absolute inset-0 bg-black/80" />
      <form
        className="lb-name relative w-full max-w-sm p-6 text-center"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d7b45b]/80">Welcome to</p>
        <p className="font-display gold-text mt-1 text-3xl font-bold tracking-[0.18em]">ROYAL ACE</p>
        <p className="mt-3 text-sm text-white/65">What should the croupier call you?</p>
        <input
          ref={input}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          maxLength={16}
          placeholder="Your name or nickname"
          aria-label="Your name or nickname"
          className="lb-input mt-4 w-full"
          autoComplete="nickname"
        />
        <p className={`mt-1.5 h-4 text-[11px] ${error ? "text-red-300" : "text-white/35"}`}>{error ?? "Shown in the lobby only, kept on this device"}</p>
        <button type="submit" className="lb-play mt-3 w-full">
          Enter the casino
        </button>
        {!initial && (
          <button
            type="button"
            onClick={() => {
              profileStore.skip();
              onDone();
            }}
            className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-[#e5c779]"
          >
            Skip for now
          </button>
        )}
      </form>
    </div>,
    document.body,
  );
}

/* ───────── Game detail ───────── */
function Detail({ g, onClose, onPlay }: { g: Info; onClose: () => void; onPlay: () => void }) {
  const stats = useStats() as unknown as Record<string, number>;
  const session = useSession() as unknown as Record<string, { spins: number; net: number; biggest: number } | undefined>;
  const views = challengeView(useAchievements()).filter((v) => v.def.game === g.challenge);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const day = g.session ? session[g.session] : undefined;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="safe-y fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={g.name}>
      <button type="button" aria-label="Close" onClick={onClose} className="backdrop-in absolute inset-0 cursor-default bg-black/70" />
      <div className="lb-detail relative flex max-h-[min(92dvh,46rem)] w-full max-w-2xl flex-col overflow-hidden lg:max-h-[calc(100dvh-2rem)] lg:max-w-4xl lg:flex-row">
        <div className="lb-detail__art relative lg:flex lg:w-[20rem] lg:shrink-0 lg:items-center lg:justify-center">
          <GameArt id={g.id as ArtId} className="mx-auto block h-40 w-auto sm:h-48 lg:h-auto lg:w-full" />
          <span className="absolute right-3 top-3 lg:hidden">
            <button type="button" onClick={onClose} aria-label="Close" className="rl-icon-key">
              ✕
            </button>
          </span>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <span className="absolute right-3 top-3 z-10 max-lg:hidden">
          <button type="button" onClick={onClose} aria-label="Close" className="rl-icon-key">
            ✕
          </button>
        </span>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3 [scrollbar-width:thin] sm:px-6 lg:pt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">{g.tag}</p>
          <h2 className="font-display gold-text mt-0.5 text-2xl font-bold tracking-[0.12em] sm:text-3xl">{g.name.toUpperCase()}</h2>
          <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-white/70 lg:mt-2 lg:space-y-1">
            {g.about.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[#d7b45b]" />
                {a}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Bets", g.limits],
              ["Return", g.rtp],
              ["Highlight", g.facts[0]],
            ].map(([k, v]) => (
              <div key={k} className="lb-fact">
                <span className="lb-fact__k">{k}</span>
                <span className="lb-fact__v">{v}</span>
              </div>
            ))}
          </div>
          {g.stat && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                [`Your ${g.stat[2]}`, fmt(stats[g.stat[0]] ?? 0)],
                ["Wins", fmt(stats[g.stat[1]] ?? 0)],
                ["Today", day && day.spins ? `${day.net >= 0 ? "+" : "−"}◈ ${fmt(Math.abs(day.net))}` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="lb-fact">
                  <span className="lb-fact__k">{k}</span>
                  <span className="lb-fact__v">{v}</span>
                </div>
              ))}
            </div>
          )}
          {views.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#d7b45b]/75">Today&apos;s challenges</p>
              <ul className="space-y-1.5">
                {views.map((v) => (
                  <li key={v.def.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2 text-[12px]">
                    <span className={v.done ? "text-[#f5d778]" : "text-white/75"}>
                      {v.done ? "✓ " : ""}
                      {v.def.title}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-white/45">
                      {v.progress}/{v.def.goal} · ◈ {fmt(v.def.reward)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 px-5 py-3 sm:px-6" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={onPlay} disabled={g.soon} className="lb-play w-full">
            {g.soon ? "Coming soon" : `Play ${g.name}`}
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ───────── A game card ───────── */
function GameCard({ g, i, onOpen, onPlay, badge, compact }: { g: Info; i: number; onOpen: () => void; onPlay: () => void; badge: string | null; compact: boolean }) {
  return (
    <article className={`lb-card ${g.soon ? "is-soon" : ""} ${g.id === "sports" ? "is-wide" : ""}`} style={{ "--i": i } as CSSProperties}>
      <button type="button" onClick={onOpen} className="lb-card__hit" aria-label={`${g.name} — details`} />
      <div className="lb-card__art">
        <GameArt id={g.id as ArtId} className="h-full w-full" />
        {badge && <span className="lb-badge">{badge}</span>}
        {g.soon && <span className="lb-badge is-soon">Coming soon</span>}
      </div>
      <div className="lb-card__body">
        <p className="lb-card__tag">{g.tag}</p>
        <h3 className="lb-card__name">{g.name}</h3>
        {!compact && (
          <ul className="lb-card__facts">
            {g.facts.slice(0, 2).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        <div className="lb-card__foot">
          <span className="lb-card__meta">
            {g.limits}
            <span className="opacity-50"> · </span>
            {g.rtp}
          </span>
          <button type="button" onClick={onPlay} disabled={g.soon} className="lb-card__play">
            {g.soon ? "Soon" : "Play"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ───────── Lobby ───────── */
export default function Lobby({
  desktop,
  onPlay,
  onOpenChallenges,
  onOpenRewards,
  inProgress,
}: {
  desktop: boolean;
  onPlay: (id: LobbyGame) => void;
  onOpenChallenges: () => void;
  onOpenRewards: () => void;
  /** A game holding a round in progress (it must be finished first). */
  inProgress: LobbyGame | null;
}) {
  const profile = useProfile();
  const progression = useProgression();
  const daily = useDaily();
  const weekly = useWeekly();
  const ach = useAchievements();
  const locked = useLocked();
  const [detail, setDetail] = useState<Info | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<null | "card" | "rank">(null);
  const career = useCareer();
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    careerStore.hydrate();
    setNowMs(Date.now());
  }, []);
  const rank = nowMs ? weeklyRanking(career, profile.name, nowMs).rank : 0;
  const [bonus, setBonus] = useState<{ canClaim: boolean; reward: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // The time of day is read on the client (never during the prerender).
  const [hello, setHello] = useState("Welcome back");
  useEffect(() => setHello(greeting()), []);
  useEffect(() => {
    const st = dailyStatus(daily, today(), progression.level);
    setBonus({ canClaim: st.canClaim, reward: st.reward });
  }, [daily, progression.level]);
  // First visit: ask the player's name.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    profileStore.hydrate();
    setHydrated(true);
  }, []);

  const views = challengeView(ach);
  const extras = extrasView(ach);
  const done = views.filter((v) => v.done).length;
  const toClaim = views.filter((v) => v.done && !v.claimed).length + extras.filter((x) => x.done && !x.claimed).length;
  const nextChest = WEEKLY_TIERS.find((t, i) => !(weekly.claimed ?? []).includes(i) && weekly.points < t.points) ?? WEEKLY_TIERS[WEEKLY_TIERS.length - 1];
  const vip = vipTierForLevel(progression.level);
  const badgeFor = (g: Info) => {
    if (!g.challenge) return null;
    const mine = views.filter((v) => v.def.game === g.challenge);
    const d = mine.filter((v) => v.done).length;
    return mine.length ? (d === mine.length ? "✓ Challenges done" : `${mine.length - d} challenge${mine.length - d > 1 ? "s" : ""} today`) : null;
  };
  const last = LOBBY_GAMES.find((g) => g.id === (inProgress ?? profile.lastGame) && !g.soon);
  const play = (g: Info) => {
    if (g.soon) return;
    if (inProgress && inProgress !== g.id) {
      setFlash(`Finish your round at ${LOBBY_GAMES.find((x) => x.id === inProgress)?.name} first`);
      return;
    }
    setDetail(null);
    onPlay(g.id as LobbyGame);
  };
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(t);
  }, [flash]);

  const claimBonus = () => {
    const got = dailyStore.claim();
    if (got) setFlash(`Daily bonus · +◈ ${fmt(got)}`);
  };

  const nameBlock = (
    <div className="min-w-0">
      <p className="lb-hero__eyebrow">{hello}</p>
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={() => setProfileTab("card")} className="min-w-0 text-left" aria-label="Your VIP card">
          <h2 className="lb-hero__name truncate">{profile.name || "Welcome"}</h2>
        </button>
        <button type="button" onClick={() => setNameOpen(true)} aria-label="Change your name" className="lb-edit">
          ✎
        </button>
      </div>
    </div>
  );
  const levelRow = (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="lb-chip">Level {progression.level}</span>
      <span className="lb-chip is-vip">VIP · {vip.label}</span>
      <div className="lb-xp min-w-0 flex-1" title={`${xpInLevel(progression.xp)} / ${xpForNextLevel()} XP`}>
        <span style={{ width: `${Math.min(100, (xpInLevel(progression.xp) / xpForNextLevel()) * 100)}%` }} />
      </div>
    </div>
  );
  const bonusKey = bonus?.canClaim ? (
    <button type="button" onClick={claimBonus} disabled={locked} className="lb-bonus">
      <span className="lb-bonus__k">Daily bonus</span>
      <span className="lb-bonus__v">Claim ◈ {fmt(bonus.reward)}</span>
    </button>
  ) : (
    <button type="button" onClick={onOpenRewards} className="lb-bonus is-done">
      <span className="lb-bonus__k">Daily bonus</span>
      <span className="lb-bonus__v">{desktop ? "Claimed · see rewards" : "Claimed"}</span>
    </button>
  );
  const continueKey = last ? (
    <button type="button" onClick={() => play(last)} className={`lb-continue ${desktop ? "" : "is-row"}`}>
      <span className="lb-continue__k">{inProgress ? "Round in progress" : "Continue"}</span>
      <span className="lb-continue__v">{last.name} ›</span>
    </button>
  ) : null;
  const hero = desktop ? (
    <section className="lb-hero">
      <div className="min-w-0">
        {nameBlock}
        <div className="mt-2">{levelRow}</div>
      </div>
      <div className="lb-hero__side">
        {bonusKey}
        {continueKey}
      </div>
    </section>
  ) : (
    // Phones: name and bonus on one line, level below, Continue on its own row.
    <section className="lb-hero !block">
      <div className="flex items-start justify-between gap-3">
        {nameBlock}
        <div className="shrink-0">{bonusKey}</div>
      </div>
      <div className="mt-2">{levelRow}</div>
      {continueKey && <div className="mt-2.5">{continueKey}</div>}
    </section>
  );

  const summary = (
    <section className="lb-summary">
      <button type="button" onClick={onOpenChallenges} className="lb-tile">
        <span className="lb-tile__k">{desktop ? "Daily challenges" : "Challenges"}</span>
        <span className="lb-tile__v">
          {done}/{views.length}
          {toClaim > 0 && <em> · {toClaim} to claim</em>}
        </span>
        <span className="lb-bar">
          <span style={{ width: `${views.length ? (done / views.length) * 100 : 0}%` }} />
        </span>
      </button>
      <button type="button" onClick={onOpenRewards} className="lb-tile">
        <span className="lb-tile__k">{desktop ? `Weekly · ${nextChest.label}` : "Weekly chest"}</span>
        <span className="lb-tile__v">
          {desktop ? `${fmt(Math.min(weekly.points, nextChest.points))} / ${fmt(nextChest.points)} pts` : `${fmt(Math.min(weekly.points, nextChest.points))} pts`}
        </span>
        <span className="lb-bar">
          <span style={{ width: `${Math.min(100, (weekly.points / nextChest.points) * 100)}%` }} />
        </span>
      </button>
      <button type="button" onClick={() => setProfileTab("rank")} className="lb-tile">
        <span className="lb-tile__k">{desktop ? "Weekly ranking" : "Ranking"}</span>
        <span className="lb-tile__v">
          {rank ? <em>#{rank}</em> : "—"}
          {desktop && <> · {career.weekNet >= 0 ? "+" : "−"}◈ {fmt(Math.abs(career.weekNet))}</>}
        </span>
        <span className="lb-bar">
          <span style={{ width: `${rank ? Math.max(4, ((17 - rank) / 16) * 100) : 0}%` }} />
        </span>
      </button>
      {desktop && (
        <button type="button" onClick={() => setProfileTab("card")} className="lb-tile">
          <span className="lb-tile__k">VIP card</span>
          <span className="lb-tile__v">{vip.label} · Lv {progression.level}</span>
          <span className="lb-bar">
            <span style={{ width: `${Math.min(100, (xpInLevel(progression.xp) / xpForNextLevel()) * 100)}%` }} />
          </span>
        </button>
      )}
    </section>
  );

  // Phones: the carousel's position dots.
  const rail = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
    setSlide(Math.round(el.scrollLeft / (w + 12)));
  };

  return (
    <div className={`lb-root ${desktop ? "is-pc" : "m-lite"}`}>
      {desktop ? (
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,24rem)] gap-4">
            {hero}
            {summary}
          </div>
          <div className="lb-grid min-h-0 flex-1">
            {LOBBY_GAMES.map((g, i) => (
              <GameCard key={g.id} g={g} i={i} badge={badgeFor(g)} compact={false} onOpen={() => setDetail(g)} onPlay={() => play(g)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2.5">
          {hero}
          <div ref={rail} onScroll={onScroll} className="lb-rail min-h-0 flex-1">
            {LOBBY_GAMES.map((g, i) => (
              <GameCard key={g.id} g={g} i={i} badge={badgeFor(g)} compact onOpen={() => setDetail(g)} onPlay={() => play(g)} />
            ))}
          </div>
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            {LOBBY_GAMES.map((g, i) => (
              <span key={g.id} className={`lb-dot ${i === slide ? "is-on" : ""}`} />
            ))}
          </div>
          {summary}
        </div>
      )}
      {flash && (
        <p className="lb-flash" role="status">
          {flash}
        </p>
      )}
      {detail && <Detail g={detail} onClose={() => setDetail(null)} onPlay={() => play(detail)} />}
      {hydrated && (nameOpen || !profile.asked) && <NameModal initial={profile.name} onDone={() => setNameOpen(false)} />}
      {profileTab && <ProfileSheet tab={profileTab} onClose={() => setProfileTab(null)} />}
    </div>
  );
}
