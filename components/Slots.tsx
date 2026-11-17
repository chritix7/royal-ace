"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import BetBar from "./BetBar";
import Confetti from "./Confetti";
import CoinRain from "./CoinRain";
import GamblePanel from "./GamblePanel";
import JackpotBar, { JackpotLadder } from "./JackpotBar";
import VaultGame from "./VaultGame";
import RollingNumber from "./RollingNumber";
import Glyph from "./Glyph";
import MiamiBackdrop from "./MiamiBackdrop";
import SlotReels from "./SlotReels";
import { Counter, machineSmall } from "./ui";
import { money } from "../lib/game";
import { wallet } from "../lib/wallet";
import { SKINS, rankOf, type SkinId } from "../lib/skins";
import { useSlots } from "../lib/useSlots";
import {
  BET_LEVELS,
  FS_AWARD,
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
import ClassicRoom from "./slots/ClassicRoom";
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

const towerCard = "w-full rounded-xl border border-[#d7b45b]/20 px-3 py-2.5 text-left outline-none transition hover:border-[#f0d38b]/60 focus-visible:ring-2 focus-visible:ring-[#e5c779]";
const towerStyle = {
  background: "linear-gradient(180deg, #17131a 0%, #0a080c 55%, #120e13 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,236,170,0.08), 0 6px 14px rgba(0,0,0,0.45)",
} as const;

const consoleKey =
  "flex h-12 items-center justify-center rounded-lg border border-white/12 bg-[linear-gradient(180deg,#26262c_0%,#141418_55%,#0b0b0e_100%)] text-white/75 shadow-[0_3px_0_#000,inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition-[transform,border-color,color,filter] enabled:hover:border-[#d7b45b]/60 enabled:hover:text-[#f0d99a] enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-35";

function ConsoleValue({ label, children, align, on }: { label: string; children: ReactNode; align: "left" | "right"; on?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col justify-center px-4 ${align === "right" ? "items-end" : "items-start"}`}>
      <span className="text-[9px] font-black tracking-[0.25em] text-[#d7b45b]/80">{label}</span>
      <span
        className="max-w-full truncate font-mono text-xl font-black leading-6 tabular-nums"
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

export default function Slots({
  active = true,
  focus = false,
  onFocusChange,
}: {
  active?: boolean;
  focus?: boolean;
  onFocusChange?: (v: boolean) => void;
}) {
  const [skinId, setSkinId] = useState<SkinId>("miami");
  const [fullscreen, setFullscreen] = useState(false);
  const [gambleScreen, setGambleScreen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<"pay" | "features">("pay");
  const openInfo = (t: "pay" | "features" = "pay") => {
    setInfoTab(t);
    setInfoOpen(true);
  };
  useEffect(() => {
    if (!infoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [infoOpen]);
  // Focus = true browser fullscreen, like the blackjack Focus view.
  const focusCloseRef = useRef(onFocusChange);
  focusCloseRef.current = onFocusChange;
  useEffect(() => {
    if (!focus) return;
    const close = () => focusCloseRef.current?.(false);
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    document.body.style.overflow = "hidden";
    // The page keeps a scrollbar gutter; release it or a strip shows on the right.
    root.style.scrollbarGutter = "auto";
    // The Focus button keeps keyboard focus otherwise; Space must spin.
    (document.activeElement as HTMLElement | null)?.blur?.();

    const wasFullscreen = Boolean(document.fullscreenElement);
    if (!wasFullscreen && root.requestFullscreen) {
      root.requestFullscreen({ navigationUI: "hide" }).catch(() => {
        /* denied: Focus still fills the window */
      });
    }
    // Esc in fullscreen only exits fullscreen (no keydown): close Focus with it.
    let entered = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered && !wasFullscreen) close();
    };
    // Without fullscreen (denied or already fullscreen), Esc closes Focus.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector("[role=dialog][aria-modal=true]")) close();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
      if (!wasFullscreen && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [focus]);
  const skin = SKINS[skinId];
  const {
  s, balance, bet, lineBet, canSpin, play, stopAuto, setBetIdx, maxBet, toggleTurbo, setAutoStops, refill,
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
      const bonus = "bonus" in rank.current ? (rank.current as { bonus: number }).bonus : 0;
      if (bonus > 0) wallet.add(bonus);
      setRankToast(`Promoted: ${rank.current.name}${bonus > 0 ? ` · +◈ ${money(bonus)}` : ""}`);
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
        <button
          type="button"
          onClick={() => openInfo("features")}
          className="mt-0.5 flex w-full max-w-[260px] items-center gap-2 rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-left outline-none backdrop-blur-sm transition hover:border-[#d7b45b]/50 focus-visible:ring-2 focus-visible:ring-[#e5c779] lg:mt-0 lg:w-[190px] lg:shrink-0"
          title={`Crown collection: every scatter adds a crown (per bet). At ${collection.target}, pick 5 free spins or ${COLLECTION_CHIP_MULT}× your bet. Click for details.`}
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
        </button>
  );
  // Text of the gold message plaque under the reels (desktop).
  const messageContent = s.fs ? (
    <>
      <span className="font-black tracking-widest text-[#ffd166]">{skin.labels.freeSpins} ×{FS_MULT}</span>
      <span className="tabular-nums text-[#ffd166]/85">Spin {Math.min(s.fs.played, s.fs.total)} / {s.fs.total}</span>
      <span className="tabular-nums text-[#ffd166]/85">Won ◈ {money(s.fs.win)}</span>
    </>
  ) : activeLine ? (
    <span className="truncate text-[#ffe9b0]">
      Line {activeLine.line} · {activeLine.count}× <Glyph sym={activeLine.sym} skin={skin} /> · +◈ {money(activeLine.pay * lineBet)}
      {s.lineWins.length > 1 && <span className="text-white/50"> · {s.lineWins.length} lines</span>}
    </span>
  ) : balance < bet && !s.busy && balance >= BET_LEVELS[0] ? (
    <span className="truncate text-red-300">Not enough chips for this bet. Pick a lower one.</span>
  ) : (
    <span className="truncate text-white/85">{s.message}</span>
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
          : focus
            ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black [--slots-top:0rem]"
            : "lg:h-[calc(100dvh-10rem)] lg:min-h-[540px] lg:items-stretch lg:gap-4 lg:overflow-hidden"
      }`}
    >
      {focus && (
        <button
          type="button"
          onClick={() => onFocusChange?.(false)}
          aria-label="Exit focus mode"
          title="Exit focus (Esc)"
          className="fixed right-4 top-4 z-[61] flex h-9 items-center gap-1.5 rounded-full border border-[#d7b45b]/50 bg-black/70 px-3 text-[11px] font-bold uppercase tracking-wider text-[#e5c779] backdrop-blur hover:border-[#e5c779]"
        >
          ✕ <span>Exit</span>
        </button>
      )}
      <section className={`overflow-clip border border-white/10 bg-[#101713] shadow-2xl ${fullscreen || focus ? "rounded-none border-0" : "rounded-3xl"} ${fullscreen ? "" : "lg:flex lg:min-h-0 lg:flex-col"}`}>
        <div
          className={`relative isolate ${skin.stage} px-2 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-6 ${
            fullscreen ? "min-h-[100dvh] pb-4" : "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-6 lg:pb-0 lg:pt-5"
          }`}
          style={fullscreen ? { paddingTop: "max(env(safe-area-inset-top), 1rem)" } : undefined}
        >
          {skinId === "classic" && (
            <div className="hidden lg:block">
              <ClassicRoom party={s.fs !== null} />
            </div>
          )}
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

          <div className="relative mt-1 lg:mt-0 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-5 lg:pb-[1.6rem]">
  {/* Left tower: the jackpot ladder */}
  <div className="hidden justify-self-end lg:flex lg:w-[180px]">
    <JackpotLadder pools={s.pools} bet={bet} />
  </div>
  <div className="relative lg:flex lg:justify-center">
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
  {/* Gold message plaque resting on the bottom edge of the cabinet */}
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className={`absolute -bottom-4 left-1/2 z-30 hidden h-9 w-[min(78%,620px)] -translate-x-1/2 items-center justify-center gap-3 overflow-hidden rounded-lg px-5 text-sm lg:flex`}
    style={{
      background: s.fs ? "linear-gradient(180deg,#2a1d0c,#120b04)" : "linear-gradient(180deg, #1b141d 0%, #0b080d 60%, #120d13 100%)",
      boxShadow: "0 0 0 1px #f0d38b, 0 0 0 3px #0a0709, 0 0 0 4px rgba(215,180,91,0.5), 0 10px 22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,243,196,0.2)",
    }}
  >
    {messageContent}
  </div>
  </div>
  {/* Right tower: crowns, vault, last spins */}
  <div className="hidden justify-self-start lg:flex lg:w-[180px] lg:flex-col lg:gap-2">
    <p className="text-center text-[9px] font-black uppercase tracking-[0.35em] text-[#d7b45b]/80">Bonuses</p>
    <button
      type="button"
      onClick={() => openInfo("features")}
      title={`Every scatter adds a crown (per bet). At ${collection.target}: 5 free spins or ${COLLECTION_CHIP_MULT}× your bet.`}
      className={towerCard}
      style={towerStyle}
    >
      <span className="flex items-center justify-between">
        <span className="text-[9px] font-black tracking-[0.25em] text-[#e5c779]/80">👑 CROWNS</span>
        <span className="font-mono text-sm font-black tabular-nums text-[#f0d99a]">{collection.crowns}/{collection.target}</span>
      </span>
      <span className="mt-2 flex gap-[3px]">
        {Array.from({ length: collection.target }, (_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-sm ${i < collection.crowns ? "bg-gradient-to-b from-[#fff1bf] to-[#c89a3f] shadow-[0_0_6px_rgba(240,211,139,0.5)]" : "bg-white/10"}`} />
        ))}
      </span>
    </button>
    <button
      type="button"
      onClick={() => openInfo("features")}
      title="Every paid spin has a 1 in 250 chance to open the vault and reveal a jackpot"
      className={towerCard}
      style={towerStyle}
    >
      <span className="flex items-center justify-between">
        <span className="text-[9px] font-black tracking-[0.25em] text-[#e5c779]/80"><span className="vault-glint">🔐</span> VAULT</span>
        <span className="text-[10px] text-white/45">1 in 250</span>
      </span>
      <span className="mt-1 block text-[11px] leading-4 text-white/60">Any spin can open it: pick 3 cases, win a jackpot.</span>
    </button>
    <div className={towerCard} style={towerStyle}>
      <span className="text-[9px] font-black tracking-[0.25em] text-[#e5c779]/80">LAST SPINS</span>
      <span className="mt-2 grid grid-cols-4 gap-1">
        {s.history.length === 0 && <span className="col-span-4 text-[11px] text-white/35">No spins yet</span>}
        {s.history.slice(-8).map((r, i) => (
          <span
            key={`${s.history.length}-${i}`}
            title={`${r.toFixed(1)}× the bet`}
            className={`flex h-6 items-center justify-center rounded font-mono text-[10px] font-bold ${
              r >= 20 ? "bg-[#e5c779] text-black" : r >= 1 ? "bg-emerald-500/25 text-emerald-200" : r > 0 ? "bg-white/10 text-white/60" : "bg-white/[0.04] text-white/25"
            }`}
          >
            {r === 0 ? "–" : r >= 10 ? `${Math.round(r)}×` : `${r.toFixed(1)}×`}
          </span>
        ))}
      </span>
    </div>
  </div>
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crown collection reward"
      className="animate-pop w-full max-w-sm rounded-2xl border border-[#d7b45b]/45 p-6 text-center"
      style={{
        background: "linear-gradient(180deg, rgba(255,236,170,0.06), transparent 30%), linear-gradient(135deg, #221b14 0%, #120e0b 50%, #0b0908 100%)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.7), 0 0 60px rgba(240,211,139,0.15), inset 0 1px 0 rgba(255,236,170,0.2)",
      }}
    >
      <p className="text-3xl" aria-hidden="true">👑</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">
        Crown collection complete
      </p>

      <h4 className="font-display mt-2 text-2xl font-bold text-[#f0d38b]">
        Choose your reward
      </h4>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => claimCollectionReward("spins")}
          className="rounded-xl border border-[#d7b45b]/40 bg-[linear-gradient(180deg,#2a2420,#120e0b)] px-3 py-4 text-sm font-bold text-[#f0d99a] transition hover:-translate-y-0.5 hover:border-[#f0d38b] hover:shadow-[0_0_18px_rgba(240,211,139,0.3)]"
        >
          <span className="block text-2xl">🎰</span>
          5 Free Spins
        </button>

        <button
          onClick={() => claimCollectionReward("chips")}
          className="rounded-xl border border-[#d7b45b]/40 bg-[linear-gradient(180deg,#2a2420,#120e0b)] px-3 py-4 text-sm font-bold text-[#f0d99a] transition hover:-translate-y-0.5 hover:border-[#f0d38b] hover:shadow-[0_0_18px_rgba(240,211,139,0.3)]"
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
              {/* ── Desktop: single-row cabinet console ──
                  keys · [credit | bet −/+ | win] display · buy, gamble, spin */}
              <div
                className="relative z-40 -mx-6 hidden border-t border-[#d7b45b]/35 lg:block lg:shrink-0"
                style={{
                  background: "linear-gradient(180deg, #16131a 0%, #08070a 45%, #000 100%)",
                  boxShadow: "0 -14px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,236,170,0.12)",
                }}
              >
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-2.5">
                  {/* Keys */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => openInfo("pay")}
                      aria-label="Paytable and game info"
                      title="Paytable, features, rank and session"
                      className={`${consoleKey} w-12 flex-col leading-none`}
                    >
                      <span className="text-base">☰</span>
                      <span className="mt-0.5 text-[8px] font-black tracking-[0.15em] opacity-70">INFO</span>
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
                            <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                              {([
                                ["autoStopBonus", "Stop on a bonus", s.autoStopBonus],
                                ["autoStopBig", "Stop on a big win (20×+)", s.autoStopBig],
                              ] as const).map(([k, label, on]) => (
                                <button
                                  key={k}
                                  role="menuitemcheckbox"
                                  aria-checked={on}
                                  onClick={() => setAutoStops({ [k]: !on })}
                                  className="flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] text-white/75 hover:bg-white/5"
                                >
                                  {label}
                                  <span className={`relative h-4 w-7 rounded-full transition ${on ? "bg-[#d7b45b]" : "bg-white/15"}`}>
                                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? "left-3.5" : "left-0.5"}`} />
                                  </span>
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
                        className={`${consoleKey} w-14 flex-col leading-none ${auto ? "!border-red-400/70 !text-red-200" : ""}`}
                      >
                        <span className="text-[11px] font-black tracking-wider">{auto ? "STOP" : "AUTO"}</span>
                        <span className="mt-1 text-[9px] font-semibold tabular-nums opacity-60">{auto ? s.autoLeft : `×${autoCount}`}</span>
                      </button>
                    </div>
                    <button
                      onClick={toggleTurbo}
                      aria-pressed={s.turbo}
                      title="Turbo (T)"
                      className={`${consoleKey} w-12 flex-col leading-none ${s.turbo ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                    >
                      <span className="text-sm">⚡</span>
                      <span className="mt-0.5 text-[8px] font-black tracking-[0.15em] opacity-70">TURBO</span>
                    </button>
                  </div>

                  {/* Display: credit | bet | win */}
                  <div
                    className="grid h-14 min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-stretch overflow-visible rounded-xl border border-[#d7b45b]/25"
                    style={{ background: "linear-gradient(180deg, #050405 0%, #0c0a0d 100%)", boxShadow: "inset 0 3px 8px rgba(0,0,0,0.9), 0 1px 0 rgba(255,236,170,0.08)" }}
                  >
                    <ConsoleValue label="CREDIT" align="left">
                      <span className={flash ? "balance-flash-pink" : ""}>
                        <Counter value={balance} />
                      </span>
                    </ConsoleValue>

                    <div className="relative flex items-center gap-2 border-x border-[#d7b45b]/15 px-3">
                      <button
                        onClick={() => setBetIdx(s.betIdx - 1)}
                        disabled={s.busy || s.betIdx === 0}
                        aria-label="Lower bet"
                        className={`${consoleKey} !h-9 w-9 text-lg`}
                      >
                        −
                      </button>
                      <button
                        onClick={() => setBetOpen((v) => !v)}
                        disabled={s.busy}
                        aria-haspopup="dialog"
                        aria-expanded={betOpen}
                        title="Choose a bet"
                        className="flex min-w-[7.5rem] flex-col items-center rounded-lg px-2 py-1 outline-none transition enabled:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-60"
                      >
                        <span className="text-[9px] font-black tracking-[0.25em] text-[#d7b45b]/80">BET ▾</span>
                        <span className="font-mono text-xl font-black leading-6 tabular-nums text-[#fff1bf]">
                          <span className="mr-1 text-base opacity-55">◈</span>{money(bet)}
                        </span>
                        <span className="text-[9px] text-white/40">{money(lineBet)} per line</span>
                      </button>
                      <button
                        onClick={() => setBetIdx(s.betIdx + 1)}
                        disabled={s.busy || s.betIdx === BET_LEVELS.length - 1 || BET_LEVELS[s.betIdx + 1] > balance}
                        aria-label="Raise bet"
                        className={`${consoleKey} !h-9 w-9 text-lg`}
                      >
                        +
                      </button>
                      {betOpen && (
                        <>
                          <button aria-label="Close bet picker" className="fixed inset-0 z-[59] cursor-default" onClick={() => setBetOpen(false)} />
                          <div
                            role="dialog"
                            aria-label="Choose a bet"
                            className="absolute bottom-full left-1/2 z-[60] mb-3 w-[22rem] -translate-x-1/2 rounded-xl border border-[#d7b45b]/40 p-3"
                            style={{ background: "linear-gradient(180deg,#1b1620,#0b090c)", boxShadow: "0 16px 40px rgba(0,0,0,0.7)" }}
                          >
                            <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">Total bet</p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {BET_LEVELS.map((v, i) => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    setBetIdx(i);
                                    setBetOpen(false);
                                  }}
                                  disabled={v > balance}
                                  aria-pressed={i === s.betIdx}
                                  className={`h-10 rounded-lg border font-mono text-sm font-black tabular-nums outline-none transition disabled:opacity-30 ${
                                    i === s.betIdx
                                      ? "border-[#f0d38b] text-[#1b1305]"
                                      : "border-[#d7b45b]/25 text-[#f0d99a] enabled:hover:border-[#f0d38b]"
                                  }`}
                                  style={{
                                    background: i === s.betIdx ? "linear-gradient(180deg,#fff1bf,#e9c56e 45%,#b8873a)" : "linear-gradient(180deg,#2a2420,#0d0b09)",
                                  }}
                                >
                                  {money(v)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <ConsoleValue label="WIN" align="right" on={s.lastWin > 0 && !spinningNow}>
                      <RollingNumber value={s.lastWin} />
                    </ConsoleValue>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {outOfChips ? (
                      <button onClick={refill} className={`rounded-full px-5 py-2.5 text-xs font-bold ${skin.betOn}`}>
                        Take a ◈ 1,000 refill
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setBuyOpen(true)}
                          disabled={s.busy || !!s.fs || balance < bonusPrice}
                          title="Start the free spins right away"
                          className={`${consoleKey} w-[4.5rem] flex-col leading-none`}
                        >
                          <span className="text-[10px] font-black tracking-wider">BUY</span>
                          <span className="mt-1 text-[9px] font-semibold tabular-nums opacity-70">◈ {money(bonusPrice)}</span>
                        </button>
                        <button
                          onClick={() => setGambleScreen(true)}
                          disabled={!s.gamble}
                          aria-label="Open double or nothing"
                          title="Double or nothing on your last win"
                          className={`${consoleKey} w-[4.5rem] flex-col leading-none ${
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
                      className={`relative -my-3 ml-2 flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-full text-sm font-black tracking-widest outline-none transition active:scale-95 focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 ${skin.spinBtn} ${s.fs ? "!opacity-100" : ""}`}
                      style={{
                        boxShadow:
                          "0 0 0 3px #000, 0 0 0 5px rgba(215,180,91,0.6), 0 6px 0 #000, 0 10px 18px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.3), inset 0 -4px 7px rgba(0,0,0,0.28)",
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
                        onClick={() => setBuyOpen(true)}
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
        initialTab={infoTab}
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
        onBuy={() => buyBonus(true)}
        spins={FS_AWARD[3]}
        mult={FS_MULT}
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