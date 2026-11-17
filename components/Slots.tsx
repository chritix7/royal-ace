"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import BetBar from "./BetBar";
import Confetti from "./Confetti";
import CoinRain from "./CoinRain";
import GamblePanel from "./GamblePanel";
import JackpotBar from "./JackpotBar";
import VaultGame from "./VaultGame";
import RollingNumber from "./RollingNumber";
import Glyph from "./Glyph";
import MiamiBackdrop from "./MiamiBackdrop";
import SlotReels from "./SlotReels";
import { Counter, machineSmall } from "./ui";
import { money } from "../lib/game";
import { SKINS, rankOf, type SkinId } from "../lib/skins";
import { useSlots } from "../lib/useSlots";
import {
  BET_LEVELS,
  FS_MULT,
  PAYLINES,
} from "../lib/slots";
import { sfx } from "../lib/sound";
import { AUTO_COUNTS, loadAutoCount, saveAutoCount, type AutoCount } from "../lib/autoSpin";
import {
  useCollection,
  COLLECTION_CHIP_MULT,
} from "../lib/collection";
import { useBalanceFlash } from "../hooks/useBalanceFlash";
import { useSession } from "../lib/sessionStore";
import SlotsSidePanel from "./slots/SlotsSidePanel";
import KingpinRoom from "./slots/KingpinRoom";
import BonusResultModal from "./slots/BonusResultModal";
import BuyBonusModal from "./slots/BuyBonusModal";

function Led({
  label,
  children,
  className,
  on,
}: {
  label: string;
  children: ReactNode;
  className: string;
  on?: boolean;
}) {
  return (
    <div
      className="relative min-w-0 rounded-lg border border-white/15 px-2 py-1 text-center sm:px-3 sm:py-1.5"
      style={{
        background:
          "linear-gradient(180deg, #10131c 0%, #080b12 55%, #11121b 100%)",
        boxShadow:
          "inset 0 2px 5px rgba(0,0,0,0.75), inset 0 -1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.10)",
      }}
    >
      {/* Reflet discret sur le bord supérieur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)",
        }}
      />

      <p className="text-[8px] tracking-[0.2em] text-white/45 sm:text-[9px] sm:tracking-[0.25em]">
        {label}
      </p>

      <p
        className={`font-mono text-base font-black tabular-nums tracking-wider sm:text-2xl ${className}`}
        style={{
          color: on ? "#ffe4f1" : "#e5b2cf",
          textShadow: on
            ? "0 0 8px rgba(244,114,182,0.35)"
            : "0 0 5px rgba(244,114,182,0.12)",
        }}
      >
        {children}
      </p>
    </div>
  );
}

const consoleKey =
  "flex h-12 items-center justify-center rounded-lg border border-white/12 bg-[linear-gradient(180deg,#26262c_0%,#141418_55%,#0b0b0e_100%)] text-white/75 shadow-[0_3px_0_#000,inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition-[transform,border-color,color,filter] enabled:hover:border-[#d7b45b]/60 enabled:hover:text-[#f0d99a] enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-35";

function ConsoleValue({ label, children, align, on }: { label: string; children: ReactNode; align: "left" | "right"; on?: boolean }) {
  return (
    <div className={`flex min-w-0 items-baseline gap-2.5 ${align === "right" ? "justify-end" : ""}`}>
      <span className="text-[10px] font-black tracking-[0.25em] text-[#d7b45b]/80">{label}</span>
      <span
        className="truncate font-mono text-2xl font-black tabular-nums"
        style={{
          color: on ? "#fff4c9" : "#f0d99a",
          textShadow: on ? "0 0 14px rgba(255,209,102,0.55)" : "0 0 6px rgba(240,211,139,0.15)",
        }}
      >
        <span className="mr-1 text-lg opacity-55">◈</span>
        {children}
      </span>
    </div>
  );
}

export default function Slots({ active = true }: { active?: boolean }) {
  const [skinId, setSkinId] = useState<SkinId>("miami");
  const [fullscreen, setFullscreen] = useState(false);
  const [gambleScreen, setGambleScreen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  useEffect(() => {
    if (!infoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [infoOpen]);
  const skin = SKINS[skinId];
  const {
  s, balance, bet, lineBet, canSpin, play, stopAuto, setBetIdx, maxBet, toggleTurbo, refill,
  bonusPrice, buyBonus, vaultPick, vaultCollect, gambleChoose, gambleCollect, bonusContinue,
  collectionRewardOpen, claimCollectionReward,
} = useSlots(active, skin.labels, gambleScreen);
const flash = useBalanceFlash();
const session = useSession();

const collection = useCollection(bet);

  const playWithSound = (n: number) => {
  sfx.spin();
  play(n);
};

  const [autoCount, setAutoCount] = useState<AutoCount>(10);
  const [autoOpen, setAutoOpen] = useState(false);
  useEffect(() => setAutoCount(loadAutoCount()), []);
  const startAuto = (n: AutoCount) => {
    setAutoCount(n);
    saveAutoCount(n);
    setAutoOpen(false);
    playWithSound(n);
  };

const prevCelebrate = useRef(0);
useEffect(() => {
  if (s.celebrate > prevCelebrate.current) {
    if (s.winBanner?.tier === "epic") sfx.jackpot();
    else sfx.win();
  }
  prevCelebrate.current = s.celebrate;
}, [s.celebrate, s.winBanner]);

const prevFs = useRef(false);
useEffect(() => {
  if (s.fs && !prevFs.current) sfx.bonus();
  prevFs.current = !!s.fs;
}, [s.fs]);

  const skinLoaded = useRef(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("royalace:skin");
      if (saved === "classic" || saved === "miami") setSkinId(saved);
    } catch {}
    skinLoaded.current = true;
  }, []);
  useEffect(() => {
    if (!skinLoaded.current) return;
    try {
      localStorage.setItem("royalace:skin", skinId);
    } catch {}
  }, [skinId]);

  const rank = rankOf(s.stats.won);
  const prevRank = useRef(rank.index);
  const [rankToast, setRankToast] = useState<string | null>(null);
  useEffect(() => {
    if (s.busy && rank.index > prevRank.current) {
      setRankToast(`Promoted: ${rank.current.name}`);
      const id = window.setTimeout(() => setRankToast(null), 4000);
      prevRank.current = rank.index;
      return () => window.clearTimeout(id);
    }
    prevRank.current = rank.index;
  }, [rank.index, rank.current.name, s.busy]);

  const spinningNow = s.spinning.some(Boolean);
  const [cursor, setCursor] = useState(0);
  useEffect(() => {
    setCursor(0);
    if (s.lineWins.length < 2 || spinningNow) return;
    const id = window.setInterval(() => setCursor((c) => (c + 1) % s.lineWins.length), 1100);
    return () => window.clearInterval(id);
  }, [s.lineWins, spinningNow]);
  const activeLine = !spinningNow && s.lineWins.length ? s.lineWins[Math.min(cursor, s.lineWins.length - 1)] : null;

  const auto = s.autoLeft > 0;
  // Five stakes around the current one; clicking one bets it and spins.
  const winStart = Math.max(0, Math.min(BET_LEVELS.length - 5, s.betIdx - 2));
  const betWindow = Array.from({ length: Math.min(5, BET_LEVELS.length) }, (_, k) => winStart + k);
  const spinAt = (i: number) => {
    if (s.busy || BET_LEVELS[i] > balance) return;
    setBetIdx(i);
    playWithSound(1);
  };
  const crownMeter = (
        <div
          className="mt-0.5 flex w-full max-w-[260px] lg:mt-0 lg:w-[190px] lg:shrink-0 items-center gap-2 rounded-full border border-white/12 bg-black/55 px-2.5 py-1 backdrop-blur-sm"
          title={`Crown collection: fill it to ${collection.target} to pick a reward`}
        >
          <span aria-hidden="true" className="text-[10px] leading-none">👑</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/60">Crowns</span>
          <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-[#c8a65b] to-[#e5c779] transition-all"
              style={{ width: `${(collection.crowns / collection.target) * 100}%` }}
            />
          </span>
          <span className="text-[10px] font-black tabular-nums text-[#e5c779]">
            {collection.crowns}/{collection.target}
          </span>
        </div>
  );
  // During free spins the button shows the count instead of a bare "…".
  const spinLabel = s.fs ? (
    <span className="relative flex flex-col items-center leading-none">
      <span className="text-[9px] tracking-[0.2em] opacity-80">FREE</span>
      <span className="mt-1 tabular-nums">{Math.min(s.fs.played, s.fs.total)}/{s.fs.total}</span>
    </span>
  ) : (
    "SPIN"
  );
  const net = s.stats.won - s.stats.wagered;
  const outOfChips = !s.busy && balance < BET_LEVELS[0];

  useEffect(() => {
    if (!s.gamble) setGambleScreen(false);
  }, [s.gamble]);

  return (
    <div
      className={`grid gap-6 ${
        fullscreen
          ? "fixed inset-0 z-50 overflow-y-auto bg-black"
          : "lg:h-[calc(100dvh-10rem)] lg:min-h-[600px] lg:items-stretch lg:gap-4 lg:overflow-hidden"
      }`}
    >
      <section className={`overflow-clip border border-white/10 bg-[#101713] shadow-2xl ${fullscreen ? "rounded-none border-0" : "rounded-3xl lg:flex lg:min-h-0 lg:flex-col"}`}>
        <div
          className={`relative isolate ${skin.stage} px-2 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-6 ${
            fullscreen ? "min-h-[100dvh] pb-4" : "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-6 lg:pb-0 lg:pt-5"
          }`}
          style={fullscreen ? { paddingTop: "max(env(safe-area-inset-top), 1rem)" } : undefined}
        >
          {skinId === "miami" && (
            <>
              <div className="lg:hidden">
                <MiamiBackdrop party={s.fs !== null} />
              </div>
              <div className="hidden lg:block">
                <KingpinRoom party={s.fs !== null} />
              </div>
            </>
          )}
          {/* The skyline melts into the control deck instead of being cut */}
          {!fullscreen && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] hidden h-44 bg-gradient-to-t from-[#0c0d14] via-[#0c0d14]/70 to-transparent lg:block"
            />
          )}
          {s.celebrate > 0 && <Confetti key={`confetti-${s.celebrate}`} colors={skin.confetti} />}

          <div className="relative z-10 w-full lg:shrink-0">
  {/* Ligne réservée au bouton plein écran */}
  <div className="mb-2 flex h-9 w-full items-center justify-end sm:hidden">
    <button
      type="button"
      onClick={() => setFullscreen((v) => !v)}
      aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/60 text-sm text-white/80 backdrop-blur transition hover:border-[#ffd166] hover:text-[#ffd166]"
    >
      {fullscreen ? "✕" : "⛶"}
    </button>
  </div>

  {/* Marquee between the pots: sign, tagline and the crown meter */}
  <JackpotBar
    pools={s.pools}
    bet={bet}
    center={
      <header className="flex flex-col items-center gap-1 pb-1 text-center lg:relative lg:z-30 lg:-mb-6 lg:px-3 lg:pb-0">
        {/* Desktop: black-lacquer and gold pediment resting on the cabinet */}
        <div className="relative hidden lg:block">
          <span
            aria-hidden="true"
            className="absolute -top-[9px] left-1/2 h-[10px] w-28 -translate-x-1/2 rounded-t-md border-x border-t border-[#d7b45b]/80"
            style={{ background: "linear-gradient(180deg,#1d161f,#0b080d)" }}
          />
          <span
            aria-hidden="true"
            className="absolute -top-[15px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-[#f0d38b]"
            style={{ background: "linear-gradient(135deg,#fff3c4,#b8873a)", boxShadow: "0 0 10px rgba(240,211,139,0.6)" }}
          />
          <div
            className="relative rounded-xl px-9 pb-2 pt-2.5"
            style={{
              background: "linear-gradient(180deg, #1b141d 0%, #0b080d 55%, #120d13 100%)",
              boxShadow:
                "0 0 0 1px #f0d38b, 0 0 0 4px #0a0709, 0 0 0 5px rgba(215,180,91,0.55), 0 16px 30px rgba(0,0,0,0.65), 0 0 46px rgba(255,79,163,0.22), inset 0 1px 0 rgba(255,243,196,0.25)",
            }}
          >
            {/* Art-deco wings */}
            {["left-2.5", "right-2.5"].map((side) => (
              <span key={side} aria-hidden="true" className={`absolute top-1/2 ${side} flex -translate-y-1/2 flex-col gap-[3px]`}>
                <span className="block h-px w-4 bg-[#d7b45b]/80" />
                <span className="block h-px w-3 bg-[#d7b45b]/55 [margin-inline:auto]" />
                <span className="block h-px w-2 bg-[#d7b45b]/35 [margin-inline:auto]" />
              </span>
            ))}
            <h3
              className="font-display whitespace-nowrap text-[clamp(1.5rem,2.3vw,2.3rem)] font-bold uppercase leading-none tracking-[0.14em]"
              style={{
                backgroundImage: "linear-gradient(180deg, #fff6d2 0%, #f0d38b 40%, #b8873a 62%, #f6dc8f 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.7)) drop-shadow(0 0 12px rgba(240,211,139,0.25))",
              }}
            >
              {skin.title}
            </h3>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-transparent to-[#d7b45b]/70" />
              <p className="whitespace-nowrap text-[9px] uppercase leading-none tracking-[0.3em] text-[#e5c779]/75">{skin.tagline}</p>
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-l from-transparent to-[#d7b45b]/70" />
            </div>
          </div>
        </div>
        <div className={`inline-block max-w-full rounded-xl border-2 px-3 py-0.5 sm:px-5 lg:hidden ${skin.signBox}`}>
          <h3
            className={`whitespace-nowrap text-lg font-black uppercase leading-tight tracking-[0.08em] sm:text-3xl sm:tracking-[0.12em] lg:text-[clamp(1.25rem,2vw,1.75rem)] ${skin.titleClass}`}
          >
            {skin.title}
          </h3>
        </div>
        <p className="text-[8px] uppercase leading-none tracking-[0.14em] text-white/55 sm:text-[9px] sm:tracking-[0.22em] lg:hidden">
          {skin.tagline}
        </p>
        <div className="flex w-full justify-center lg:hidden">{crownMeter}</div>
      </header>
    }
  />
</div>

          <div className="relative mt-1 lg:mt-0 lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center lg:pb-2">
  <SlotReels
    s={s}
    skin={skin}
    activeLine={activeLine}
    fast={s.lastWin > 0 || s.celebrate > 0 || !!s.fs}
    shake={s.winBanner ? (s.winBanner.tier === "epic" ? 3 : s.winBanner.tier === "mega" ? 2 : 1) : 0}
    onPull={() => playWithSound(1)}
    canPull={canSpin}
    large={fullscreen}
    mood={
      s.fs || (s.winBanner && (s.winBanner.tier === "mega" || s.winBanner.tier === "epic"))
        ? "jackpot"
        : s.lastWin > 0 || s.celebrate > 0
          ? "win"
          : "idle"
    }
  />
</div>

          {s.banner && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/60" role="status">
              <p className="animate-pop px-4 text-center text-2xl font-black tracking-widest text-[#ffd166] drop-shadow-[0_0_24px_#ff2e88] sm:text-6xl">
                {s.banner}
              </p>
            </div>
          )}

          {s.winBanner && (
            <div key={`win-${s.celebrate}`} className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55" role="status">
              <div className="win-flash absolute inset-0" />
              <CoinRain count={s.winBanner.tier === "epic" ? 64 : 38} />
              <p className="animate-pop relative px-4 text-center text-2xl font-black tracking-widest text-[#ffd166] drop-shadow-[0_0_24px_#ff2e88] sm:text-6xl">
                {s.winBanner.label}
              </p>
              <p className="relative mt-2 font-mono text-3xl font-black text-white drop-shadow-[0_0_18px_#ffd166] sm:mt-3 sm:text-7xl">
                ◈ <RollingNumber value={s.winBanner.amount} fromZero ms={s.winBanner.tier === "epic" ? 2800 : 1900} />
              </p>
            </div>
          )}

          {s.vault && <VaultGame vault={s.vault} onPick={vaultPick} onCollect={vaultCollect} />}

          {collectionRewardOpen && (
  <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-sm rounded-2xl border border-[#e5c779]/40 bg-[#10150f] p-5 text-center shadow-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e5c779]">
        Crown collection complete
      </p>

      <h4 className="mt-2 text-xl font-black text-white">
        Choose your reward
      </h4>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => claimCollectionReward("spins")}
          className="rounded-xl border border-[#e5c779]/50 bg-[#1a1f16] px-3 py-4 text-sm font-bold text-white transition hover:border-[#e5c779] hover:bg-[#22281d]"
        >
          <span className="block text-2xl">🎰</span>
          5 Free Spins
        </button>

        <button
          onClick={() => claimCollectionReward("chips")}
          className="rounded-xl border border-[#e5c779]/50 bg-[#1a1f16] px-3 py-4 text-sm font-bold text-white transition hover:border-[#e5c779] hover:bg-[#22281d]"
        >
          <span className="block text-2xl">◈</span>
          {money(bet * COLLECTION_CHIP_MULT)} Chips
        </button>
      </div>
    </div>
  </div>
)}

          {fullscreen ? (
  <div
  className="sticky bottom-0 z-50 -mx-2 mt-8 border-t border-white/15 px-3 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:-mx-8 sm:px-8"
  style={{
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 18%), linear-gradient(135deg, #24252e 0%, #15161e 45%, #101119 100%)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 3px 6px rgba(0,0,0,0.35), 0 -8px 24px rgba(0,0,0,0.28)",
  }}
>
              <div
  className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-white/15 px-2 py-2"
  style={{
    background:
      "linear-gradient(180deg, #131620 0%, #090c13 60%, #10131c 100%)",
    boxShadow:
      "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04)",
  }}
>
  <div data-chips-counter="fullscreen" className="shrink-0">
  <p className="text-[8px] uppercase tracking-[0.2em] text-white/45">
    Balance
  </p>
  <p className="font-mono text-sm font-black tabular-nums text-[#e5b2cf]">
  ◈{" "}
  <span className={flash ? "balance-flash-pink" : ""}>
    <Counter value={balance} />
  </span>
</p>
</div>

  <div
  className="min-w-0 flex-1 text-center"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {s.fs ? (
    <>
      <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-[#e5b2cf]">
        PENTHOUSE · ×{FS_MULT}
      </p>

      <p className="truncate text-[11px] font-semibold tabular-nums text-white/90">
        SPIN {s.fs.played}/{s.fs.total}
      </p>
    </>
  ) : (
    <>
      <p className="truncate text-[11px] font-semibold text-white/85">
        {s.message}
      </p>

      {activeLine && (
        <p className="truncate text-[9px] text-[#d8bb83]">
          Line {activeLine.line}: {activeLine.count}×{" "}
          <Glyph sym={activeLine.sym} skin={skin} />
          {" "}· +◈ {money(activeLine.pay * lineBet)}
        </p>
      )}
    </>
  )}
</div>

  <div className="flex shrink-0 items-center gap-2">
    <div className="text-right">
      <p className="text-[8px] uppercase tracking-[0.2em] text-white/45">
        Win
      </p>
      <p
        className={`font-mono text-sm font-black tabular-nums ${
          s.lastWin > 0 && !spinningNow
            ? "text-[#ffe4f1]"
            : "text-[#e5b2cf]"
        }`}
      >
        ◈ {money(s.lastWin)}
      </p>
    </div>

    <button
      onClick={toggleTurbo}
      aria-label="Turbo"
      aria-pressed={s.turbo}
      className={`${machineSmall} px-2 text-[10px] ${
        s.turbo ? "!border-[#ffd166] !text-[#ffd166]" : ""
      }`}
    >
      ⚡
    </button>
  </div>
</div>

              <div className="mx-auto mt-2 max-w-md">
                <BetBar levels={BET_LEVELS} index={s.betIdx} onSelect={setBetIdx} balance={balance} disabled={s.busy} skin={skin} lines={PAYLINES.length} />
              </div>

              <div className="pointer-events-auto relative z-[60] mx-auto mt-6 flex items-center justify-center gap-4">
  <div className="relative shrink-0">
    {autoOpen && !auto && !s.gamble && (
      <>
        <button
          aria-label="Close auto spin menu"
          className="fixed inset-0 z-[59] cursor-default"
          onClick={() => setAutoOpen(false)}
        />
        <div
          role="menu"
          aria-label="Auto spins"
          className="absolute bottom-full left-1/2 z-[60] mb-3 -translate-x-1/2 rounded-xl border border-white/15 bg-[#11131c] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          <p className="mb-1.5 text-center text-[8px] uppercase tracking-[0.2em] text-white/50">Auto spins</p>
          <div className="flex gap-2">
            {AUTO_COUNTS.map((n) => (
              <button
                key={n}
                role="menuitem"
                onClick={() => startAuto(n)}
                disabled={!canSpin}
                className={`${machineSmall} h-10 w-12 px-0 text-xs ${n === autoCount ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </>
    )}
    <button
  onClick={() => {
    if (s.gamble) setGambleScreen(true);
    else if (auto) stopAuto();
    else setAutoOpen((v) => !v);
  }}
  disabled={!!s.fs || (!auto && !canSpin)}
  aria-haspopup="menu"
  aria-expanded={autoOpen}
  className={`relative flex h-16 w-16 shrink-0 touch-manipulation items-center justify-center rounded-full text-[10px] font-black leading-3 text-white transition active:translate-y-0.5 disabled:opacity-40 ${
        s.gamble
          ? "text-[#3a2c05]"
          : auto
            ? "text-white"
            : "text-white"
      }`}
      style={
        s.gamble
          ? {
              background: "radial-gradient(circle at 32% 26%, #fff3c4, #eab308 45%, #a16207 85%)",
              boxShadow: "0 8px 18px rgba(0,0,0,.7), inset 0 2px 6px rgba(255,255,255,.5), inset 0 -5px 10px rgba(0,0,0,.35)",
            }
          : auto
            ? {
                background: "radial-gradient(circle at 32% 26%, #7f1d1d, #450a0a 70%)",
                boxShadow: "0 8px 18px rgba(0,0,0,.7), inset 0 2px 6px rgba(255,255,255,.15), inset 0 -5px 10px rgba(0,0,0,.45)",
              }
            : {
                background: "radial-gradient(circle at 32% 26%, #3f3f46, #18181b 70%)",
                boxShadow: "0 8px 18px rgba(0,0,0,.7), inset 0 2px 6px rgba(255,255,255,.15), inset 0 -5px 10px rgba(0,0,0,.45)",
              }
      }
    >
      <span
        className={`absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
          s.gamble
            ? "bg-yellow-200 shadow-[0_0_8px_#fde047]"
            : auto
              ? "bg-red-400 shadow-[0_0_8px_#f87171]"
              : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
        }`}
      />
      {s.gamble ? "X2" : auto ? "STOP" : "AUTO"}
      {auto && <span className="block text-[8px] font-normal text-white/80">{s.autoLeft}</span>}
    </button>
  </div>

  <button
    onClick={() => playWithSound(1)}
    disabled={!canSpin}
    aria-label="Spin"
    className="relative h-24 w-24 shrink-0 touch-manipulation rounded-full text-base font-black tracking-widest text-white transition active:translate-y-0.5 disabled:opacity-50"
    style={{
      background: "radial-gradient(circle at 32% 26%, #ff9a9a, #ef4444 45%, #7f1d1d 85%)",
      boxShadow: "0 12px 28px rgba(0,0,0,.75), inset 0 3px 10px rgba(255,255,255,.4), inset 0 -8px 14px rgba(0,0,0,.5)",
    }}
  >
    <span className="absolute inset-1.5 rounded-full ring-2 ring-red-950/50" />
    {spinLabel}
  </button>

  <button
    onClick={() => setBuyOpen(true)}
    disabled={s.busy || !!s.fs || balance < bonusPrice}
    className="relative flex h-16 w-16 shrink-0 touch-manipulation flex-col items-center justify-center rounded-full text-[10px] font-black leading-3 text-[#3a2c05] transition active:translate-y-0.5 disabled:opacity-40"
    style={{
      background: "radial-gradient(circle at 32% 26%, #fff3c4, #eab308 45%, #a16207 85%)",
      boxShadow: "0 8px 18px rgba(0,0,0,.7), inset 0 2px 6px rgba(255,255,255,.5), inset 0 -5px 10px rgba(0,0,0,.35)",
    }}
  >
    <span className="absolute inset-1 rounded-full ring-2 ring-yellow-100/40" />
    BUY
    <span className="block text-[8px] font-normal">◈ {money(bonusPrice)}</span>
  </button>
</div>

              {balance < bet &&
  !s.busy &&
  !s.fs &&
  !collectionRewardOpen &&
  !outOfChips && (
    <p className="mt-2 text-center text-[11px] text-red-300">
      Not enough chips for this bet. Pick a lower one.
    </p>
  )}

{outOfChips &&
  !s.fs &&
  !collectionRewardOpen && (
    <div className="mt-2 flex justify-center">
      <button
        onClick={refill}
        className={`rounded-full px-5 py-2.5 text-xs font-bold sm:px-8 sm:py-3 sm:text-sm ${skin.betOn}`}
      >
        Out of chips · take a ◈ 1,000 refill
      </button>
    </div>
  )}
            </div>
          ) : (
            <>
              {/* ── Desktop: full-width cabinet console, Amusnet / EGT layout ──
                  Row 1: credit · message · win.  Row 2: menu, auto, turbo,
                  five bet buttons (each one spins at its stake), gamble, spin. */}
              <div
                className="relative z-20 -mx-6 hidden border-t border-[#d7b45b]/35 lg:block lg:shrink-0"
                style={{
                  background: "linear-gradient(180deg, #121014 0%, #070608 38%, #000 100%)",
                  boxShadow: "0 -1px 0 rgba(0,0,0,0.8), 0 -14px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,236,170,0.12)",
                }}
              >
                {/* Row 1 */}
                <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-4 px-6 pt-2">
                  <ConsoleValue label="CREDIT" align="left">
                    <span className={flash ? "balance-flash-pink" : ""}>
                      <Counter value={balance} />
                    </span>
                  </ConsoleValue>
                  <div className="flex min-w-0 items-center gap-2">
                  {crownMeter}
                  <div
                    className="flex h-9 min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden rounded-md border border-white/[0.07] bg-black/70 px-4 text-sm shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {s.fs ? (
                      <>
                        <span className="font-black tracking-widest text-[#ffd166]">{skin.labels.freeSpins} ×{FS_MULT}</span>
                        <span className="tabular-nums text-[#ffd166]/85">Spin {Math.min(s.fs.played, s.fs.total)} / {s.fs.total}</span>
                        <span className="tabular-nums text-[#ffd166]/85">Won ◈ {money(s.fs.win)}</span>
                      </>
                    ) : activeLine ? (
                      <span className="truncate text-[#ead19a]">
                        Line {activeLine.line} · {activeLine.count}× <Glyph sym={activeLine.sym} skin={skin} /> · +◈ {money(activeLine.pay * lineBet)}
                        {s.lineWins.length > 1 && <span className="text-white/50"> · {s.lineWins.length} winning lines</span>}
                      </span>
                    ) : balance < bet && !s.busy && !outOfChips ? (
                      <span className="truncate text-red-300">Not enough chips for this bet. Pick a lower one.</span>
                    ) : (
                      <span className="truncate text-white/80">{s.message}</span>
                    )}
                  </div>
                  </div>
                  <ConsoleValue label="WIN" align="right" on={s.lastWin > 0 && !spinningNow}>
                    <RollingNumber value={s.lastWin} />
                  </ConsoleValue>
                </div>

                {/* Row 2 */}
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 pb-3 pt-2">
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => setInfoOpen(true)}
                      aria-label="Paytable and game info"
                      title="Paytable, theme, rank and session"
                      className={`${consoleKey} w-11 text-base`}
                    >
                      ☰
                    </button>
                    <div className="relative">
                      {autoOpen && !auto && (
                        <>
                          <button aria-label="Close auto spin menu" className="fixed inset-0 z-[59] cursor-default" onClick={() => setAutoOpen(false)} />
                          <div
                            role="menu"
                            aria-label="Auto spins"
                            className="absolute bottom-full left-0 z-[60] mb-2 rounded-xl border border-white/15 bg-[#11131c] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
                          >
                            <p className="mb-1.5 text-center text-[8px] uppercase tracking-[0.2em] text-white/50">Auto spins</p>
                            <div className="flex gap-1.5">
                              {AUTO_COUNTS.map((n) => (
                                <button
                                  key={n}
                                  role="menuitem"
                                  onClick={() => startAuto(n)}
                                  disabled={!canSpin}
                                  className={`${machineSmall} h-9 w-11 !py-0 text-xs ${n === autoCount ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      <button
                        onClick={() => (auto ? stopAuto() : setAutoOpen((v) => !v))}
                        disabled={!!s.fs || (!auto && !canSpin)}
                        aria-haspopup="menu"
                        aria-expanded={autoOpen}
                        className={`${consoleKey} min-w-[4.75rem] flex-col px-3 leading-none ${auto ? "!border-red-400/70 !text-red-200" : ""}`}
                      >
                        <span className="text-[11px] font-black tracking-wider">{auto ? "STOP" : "AUTO"}</span>
                        <span className="mt-1 text-[9px] font-semibold tabular-nums opacity-60">{auto ? `${s.autoLeft} left` : `× ${autoCount}`}</span>
                      </button>
                    </div>
                    <button
                      onClick={toggleTurbo}
                      aria-pressed={s.turbo}
                      title="Turbo"
                      className={`${consoleKey} w-11 text-sm ${s.turbo ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                    >
                      ⚡
                    </button>
                  </div>

                  {/* Bet buttons: a window of five stakes around the current one */}
                  <div className="flex min-w-0 flex-1 items-center justify-center gap-2" role="group" aria-label="Bet and spin">
                    {betWindow.map((i) => {
                      const v = BET_LEVELS[i];
                      const selected = i === s.betIdx;
                      return (
                        <button
                          key={v}
                          onClick={() => spinAt(i)}
                          disabled={s.busy || v > balance}
                          aria-pressed={selected}
                          title={`Spin at ◈ ${money(v)} (${money(v / PAYLINES.length)} per line)`}
                          className={`relative flex h-12 min-w-0 max-w-[7.5rem] flex-1 flex-col items-center justify-center rounded-lg border leading-none outline-none transition-[transform,filter,border-color] enabled:hover:brightness-125 enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-35 ${
                            selected ? "border-[#f0d38b] text-[#1b1305]" : "border-[#d7b45b]/30 text-[#f0d99a]"
                          }`}
                          style={{
                            background: selected
                              ? "linear-gradient(180deg, #fff1bf 0%, #e9c56e 45%, #b8873a 100%)"
                              : "linear-gradient(180deg, #2a2420 0%, #17130f 55%, #0d0b09 100%)",
                            boxShadow: selected
                              ? "0 3px 0 #6b4f1d, 0 0 18px rgba(240,211,139,0.35), inset 0 1px 0 rgba(255,255,255,0.6)"
                              : "0 3px 0 #000, inset 0 1px 0 rgba(255,236,170,0.12)",
                          }}
                        >
                          <span className="text-[8px] font-bold tracking-[0.2em] opacity-70">BET</span>
                          <span className="mt-1 font-mono text-base font-black tabular-nums">{money(v)}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {outOfChips ? (
                      <button onClick={refill} className={`rounded-full px-5 py-2.5 text-xs font-bold ${skin.betOn}`}>
                        Take a ◈ 1,000 refill
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={buyBonus}
                          disabled={s.busy || !!s.fs || balance < bonusPrice}
                          title="Start the free spins right away"
                          className={`${consoleKey} flex-col px-3 leading-none ${s.confirmBuy ? "!border-[#ffd166] !text-[#ffd166] animate-pulse" : ""}`}
                        >
                          <span className="text-[10px] font-black tracking-wider">{s.confirmBuy ? "CONFIRM?" : "BUY BONUS"}</span>
                          <span className="mt-1 text-[9px] font-semibold tabular-nums opacity-70">◈ {money(bonusPrice)}</span>
                        </button>
                        <button
                          onClick={() => setGambleScreen(true)}
                          disabled={!s.gamble}
                          aria-label="Open double or nothing"
                          title="Double or nothing on your last win"
                          className={`${consoleKey} flex-col px-3 leading-none ${
                            s.gamble ? "!border-[#ffd166] !text-[#1b1305] shadow-[0_0_18px_rgba(255,209,102,0.4)]" : ""
                          }`}
                          style={s.gamble ? { background: "linear-gradient(180deg,#ffe08a,#d7a83f)" } : undefined}
                        >
                          <span className="text-[10px] font-black tracking-wider">GAMBLE</span>
                          <span className="mt-1 text-[9px] font-semibold opacity-70">×2</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => playWithSound(1)}
                      disabled={!canSpin}
                      aria-label="Spin"
                      title="Space"
                      className={`relative ml-1 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full text-sm font-black tracking-widest outline-none transition active:scale-95 focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 ${skin.spinBtn} ${s.fs ? "!opacity-100" : ""}`}
                      style={{
                        boxShadow:
                          "0 0 0 3px #000, 0 0 0 5px rgba(215,180,91,0.55), 0 6px 0 #000, 0 10px 18px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.3), inset 0 -4px 7px rgba(0,0,0,0.28)",
                      }}
                    >
                      {spinLabel}
                    </button>
                  </div>
                </div>
              </div>

              {/* Credit · message · Win: one row, aligned with the machine */}
              <div className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-2 gap-1.5 sm:mt-4 sm:gap-3 lg:hidden">
                <Led label="CREDIT" className="">
                  <span className="opacity-60">◈</span> <Counter value={balance} />
                </Led>

                <div
                  className="relative order-first col-span-2 flex h-[3.25rem] flex-col justify-center overflow-hidden rounded-lg border border-white/15 px-3 sm:px-5 lg:order-none lg:col-span-1 lg:h-auto"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  style={{
                    background: s.fs
                      ? "linear-gradient(180deg, #2a1d0c 0%, #140d05 60%, #22180a 100%)"
                      : "linear-gradient(180deg, #131620 0%, #090c13 60%, #10131c 100%)",
                    borderColor: s.fs ? "rgba(255,209,102,0.55)" : undefined,
                    boxShadow:
                      "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-4 top-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
                  />
                  {s.fs ? (
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-center text-xs text-[#ffd166] sm:text-sm">
                      <span className="font-black tracking-widest">{skin.labels.freeSpins} ×{FS_MULT}</span>
                      <span className="tabular-nums">Spin {Math.min(s.fs.played, s.fs.total)} / {s.fs.total}</span>
                      <span className="tabular-nums">Won ◈ {money(s.fs.win)}</span>
                    </div>
                  ) : (
                    <p className="truncate text-center text-xs leading-5 text-white/85 sm:text-sm">{s.message}</p>
                  )}
                  {activeLine && (
                    <p className="truncate text-center text-[11px] leading-4 text-[#d8bb83]">
                      Line {activeLine.line}: {activeLine.count}× <Glyph sym={activeLine.sym} skin={skin} /> · +◈{" "}
                      {money(activeLine.pay * lineBet)}
                      {s.lineWins.length > 1 && ` · ${s.lineWins.length} winning lines`}
                    </p>
                  )}
                </div>

                <Led label="WIN" className="" on={s.lastWin > 0 && !spinningNow}>
                  <span className="opacity-60">◈</span> <RollingNumber value={s.lastWin} />
                </Led>
              </div>

              <div
  className="sticky bottom-0 z-20 -mx-2 mt-2 border-t border-white/15 px-2 py-2 sm:-mx-8 sm:mt-3 sm:px-8 sm:py-3 lg:hidden"
  style={{
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 18%), linear-gradient(135deg, #24252e 0%, #15161e 45%, #101119 100%)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 3px 6px rgba(0,0,0,0.35), 0 -8px 24px rgba(0,0,0,0.28)",
  }}
>
                {outOfChips ? (
                  <div className="flex justify-center">
                    <button onClick={refill} className={`rounded-full px-5 py-2.5 text-xs font-bold sm:px-8 sm:py-3 sm:text-sm ${skin.betOn}`}>
                      Out of chips · take a ◈ 1,000 refill
                    </button>
                  </div>
                ) : (
                  <div className="mx-auto grid max-w-2xl grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 lg:max-w-none lg:grid-cols-[auto_minmax(0,1fr)_auto_auto] lg:gap-4">
                    {/* Auto spins + turbo */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-bold tracking-[0.2em] text-white/50 sm:text-[9px] sm:tracking-[0.25em]">AUTO</span>
                      <div className="flex gap-1">
                        {AUTO_COUNTS.map((n) => (
                          <button
                            key={n}
                            onClick={() => startAuto(n)}
                            disabled={!canSpin}
                            className={`${machineSmall} h-8 min-w-9 !py-0 px-2 text-[11px] sm:px-2.5 sm:text-xs ${n === autoCount ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={toggleTurbo}
                        aria-pressed={s.turbo}
                        className={`${machineSmall} h-8 !py-0 px-2 text-[11px] sm:px-3 sm:text-xs ${s.turbo ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                      >
                        ⚡ Turbo
                      </button>
                    </div>

                    {/* Bet carousel: own row on phones, in the deck on desktop */}
                    <div className="order-first col-span-3 min-w-0 lg:order-none lg:col-span-1">
                      <p className="mb-1 hidden items-baseline justify-between text-[9px] font-bold tracking-[0.25em] text-white/50 lg:flex">
                        <span>TOTAL BET</span>
                        <span className="font-mono text-[11px] tracking-normal text-[#f0d99a]">◈ {money(bet)}</span>
                      </p>
                      <BetBar levels={BET_LEVELS} index={s.betIdx} onSelect={setBetIdx} balance={balance} disabled={s.busy} skin={skin} lines={PAYLINES.length} />
                    </div>

                    <div className="justify-self-center">
                      {auto ? (
                        <button
                          onClick={stopAuto}
                          aria-label="Stop auto spin"
                          className="h-18 w-18 shrink-0 rounded-full border-4 border-red-200/60 bg-red-600/80 text-xs font-black leading-4 text-white outline-none focus-visible:ring-4 focus-visible:ring-white sm:h-24 sm:w-24 sm:text-sm lg:h-[5.5rem] lg:w-[5.5rem]"
                          style={{
                            boxShadow:
                              "0 0 0 3px #111219, 0 0 0 4px rgba(255,255,255,0.18), 0 7px 0 #090a10, 0 11px 16px rgba(0,0,0,0.50), inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -4px 7px rgba(0,0,0,0.30)",
                          }}
                        >
                          STOP
                          <span className="block text-[9px] font-normal sm:text-[10px]">{s.autoLeft} left</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => playWithSound(1)}
                          disabled={!canSpin}
                          aria-label="Spin"
                          className={`relative flex h-18 w-18 shrink-0 items-center justify-center rounded-full text-sm font-black tracking-widest outline-none transition active:scale-95 focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-24 sm:w-24 sm:text-base lg:h-[5.5rem] lg:w-[5.5rem] ${skin.spinBtn} ${s.fs ? "!opacity-100" : ""}`}
                          style={{
                            boxShadow:
                              "0 0 0 3px #111219, 0 0 0 4px rgba(255,255,255,0.18), 0 7px 0 #090a10, 0 11px 16px rgba(0,0,0,0.50), inset 0 2px 3px rgba(255,255,255,0.30), inset 0 -4px 7px rgba(0,0,0,0.28)",
                          }}
                        >
                          {spinLabel}
                        </button>
                      )}
                    </div>

                    <div className="relative flex flex-col items-end gap-1.5">
                      <div className="relative">
                        {s.gamble && (
                          <button
                            onClick={() => setGambleScreen(true)}
                            className="absolute right-full top-1/2 mr-2 flex h-8 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#ffd166]/70 bg-[linear-gradient(180deg,#ffd166,#d7b45b)] text-xs font-black text-[#10130e] shadow-[0_0_18px_rgba(255,209,102,.35)] transition hover:brightness-110 active:scale-95"
                            aria-label="Open double or nothing"
                          >
                            X2
                          </button>
                        )}
                        <button
                          onClick={maxBet}
                          disabled={s.busy}
                          className={`${machineSmall} h-8 !py-0 px-3 text-[11px] sm:px-4 sm:text-xs`}
                        >
                          Max bet
                        </button>
                      </div>
                      <button
                        onClick={buyBonus}
                        disabled={s.busy || !!s.fs || balance < bonusPrice}
                        title="Start the free spins right away"
                        className={`${machineSmall} h-8 max-w-28 !py-0 px-2 text-[10px] leading-3 sm:max-w-none sm:px-3 sm:text-xs ${s.confirmBuy ? "!border-[#ffd166] !text-[#ffd166] animate-pulse" : ""}`}
                      >
                        {s.confirmBuy ? "Confirm?" : "Buy bonus"} ◈ {money(bonusPrice)}
                      </button>
                      <p className="hidden items-center gap-1 text-[10px] text-white/50 sm:flex">
                        <kbd className="rounded border border-white/20 bg-white/5 px-1 font-sans text-[9px] text-white/70">Space</kbd>
                        spin
                        <kbd className="ml-1 rounded border border-white/20 bg-white/5 px-1 font-sans text-[9px] text-white/70">← →</kbd>
                        bet
                      </p>
                    </div>
                  </div>
                )}
                {balance < bet && !s.busy && !outOfChips && (
                  <p className="mt-1.5 text-center text-[11px] text-red-300 sm:mt-2 sm:text-xs">Not enough chips for this bet. Pick a lower one.</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="lg:hidden">
      <SlotsSidePanel
        fullscreen={fullscreen}
        rankToast={rankToast}
        skinId={skinId}
        setSkinId={setSkinId}
        skin={skin}
        busy={s.busy}
        stats={s.stats}
        history={s.history}
        rank={rank}
        lineBet={lineBet}
        bonusPrice={bonusPrice}
        net={net}
      />
      </div>
      {/* Desktop: paytable, theme, rank and session in a slide-over panel */}
      {rankToast && (
        <div role="status" className="animate-pop fixed right-4 top-4 z-50 hidden rounded-2xl border border-[#ff4fa3]/70 bg-[#1a0d2e] px-5 py-3 text-sm font-semibold text-[#ff9fd0] shadow-2xl lg:block">
          ★ {rankToast}
        </div>
      )}
      {infoOpen && (
        <div className="fixed inset-0 z-[90] hidden lg:block">
          <button aria-label="Close game info" className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]" onClick={() => setInfoOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Game info"
            className="animate-[drawerIn_.22s_ease-out] absolute right-0 top-0 flex h-full w-[380px] flex-col border-l border-white/10 bg-[#0b0f0d] shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#e5c779]">Game info</p>
              <button
                onClick={() => setInfoOpen(false)}
                aria-label="Close"
                className={`${machineSmall} flex h-8 w-8 items-center justify-center !py-0 text-sm`}
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
      <SlotsSidePanel
        fullscreen={false}
        rankToast={null}
        skinId={skinId}
        setSkinId={setSkinId}
        skin={skin}
        busy={s.busy}
        stats={s.stats}
        history={s.history}
        rank={rank}
        lineBet={lineBet}
        bonusPrice={bonusPrice}
        net={net}
      />
            </div>
          </div>
        </div>
      )}

      {s.bonusResult && (
        <BonusResultModal result={s.bonusResult} onContinue={bonusContinue} />
      )}

      <BuyBonusModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        freeSpinsLabel={skin.labels.freeSpins}
        bonusPrice={bonusPrice}
        balance={balance}
        onBuy={buyBonus}
      />

      {s.gamble && gambleScreen && (
  <GamblePanel
    g={s.gamble}
    onChoose={gambleChoose}
    onCollect={gambleCollect}
    onClose={gambleCollect}
  />
)}
    </div>
  );
}