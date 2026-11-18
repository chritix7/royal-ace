"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import BetBar from "./BetBar";
import Confetti from "./Confetti";
import CoinRain from "./CoinRain";
import GamblePanel from "./GamblePanel";
import JackpotBar, { JackpotLadder } from "./JackpotBar";
import VaultGame from "./VaultGame";
import RollingNumber from "./RollingNumber";
import Glyph from "./Glyph";
import SlotReels from "./SlotReels";
import { Counter, machineSmall } from "./ui";
import { money } from "../lib/game";
import { wallet } from "../lib/wallet";
import { exitFullscreenSettled, isNarrowScreen, requestFullscreenSettled, whenViewportStable } from "../lib/fullscreen";
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

const towerCard = "tower-card w-full rounded-xl border border-[#d7b45b]/20 px-3 py-2.5 text-left outline-none transition hover:border-[#f0d38b]/60 focus-visible:ring-2 focus-visible:ring-[#e5c779]";
const towerStyle = {
  background: "linear-gradient(180deg, #17131a 0%, #0a080c 55%, #120e13 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,236,170,0.08), 0 6px 14px rgba(0,0,0,0.45)",
} as const;

const consoleKey = "cab-key";


/** Phone deck: smaller digits, same rule. */
function meterSizeSm(v: number) {
  const n = Math.round(v).toLocaleString("en-US").length;
  return n <= 6 ? "text-[16px]" : n <= 9 ? "text-[14px]" : "text-[12px]";
}

/** Display digits shrink with the amount so nothing is ever cut. */
function meterSize(v: number) {
  const n = Math.round(v).toLocaleString("en-US").length;
  return n <= 8 ? "text-[22px]" : n <= 10 ? "text-[20px]" : n <= 12 ? "text-[17px]" : "text-[15px]";
}

/**
 * The cabinet's SPIN: a coloured glass dome set in a knurled gold bezel.
 * Ready: breathing halo and a light sweep on the glass. Spinning: a spark
 * runs round the bezel and the spin icon turns.
 */
function SpinDome({
  onClick,
  disabled,
  busy,
  ready,
  variant,
  fs,
  size,
}: {
  size?: string;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  ready: boolean;
  variant: SkinId;
  fs: { played: number; total: number } | null;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Spin"
      title="Space"
      className={`spin-dome spin-dome--${variant} ${ready ? "is-ready" : ""} ${busy ? "is-busy" : ""} ${fs ? "is-fs" : ""}`}
      style={size ? ({ ["--size" as string]: size } as CSSProperties) : undefined}
    >
      <span aria-hidden="true" className="spin-dome__halo" />
      <span aria-hidden="true" className="spin-dome__bezel" />
      <span aria-hidden="true" className="spin-dome__spark" />
      <span aria-hidden="true" className="spin-dome__gap" />
      <span className="spin-dome__glass">
        <span aria-hidden="true" className="spin-dome__sweep" />
        <span aria-hidden="true" className="spin-dome__gloss" />
        {fs ? (
          <span className="spin-dome__label flex flex-col items-center leading-none">
            <span className="text-[8px] tracking-[0.3em] opacity-90">FREE</span>
            <span className="mt-0.5 text-[15px] tabular-nums tracking-normal">
              {fs.played}/{fs.total}
            </span>
          </span>
        ) : (
          <span className="spin-dome__label flex flex-col items-center leading-none">
            <span className="pl-[0.22em] text-[15px] tracking-[0.22em]">SPIN</span>
            {/* Desktop: the keyboard shortcut */}
            <span className="mt-1 hidden pl-[0.25em] text-[7px] tracking-[0.25em] opacity-55 lg:block">SPACE</span>
          </span>
        )}
      </span>
    </button>
  );
}

/* Crisp line icons for the cabinet keys */
const icon = "h-[18px] w-[18px]";
const IconInfo = () => (
  <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" strokeLinecap="round" />
  </svg>
);
const IconAuto = () => (
  <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden="true">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
const IconCards = () => (
  <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="11" height="15" rx="2" transform="rotate(-10 8.5 12.5)" />
    <rect x="10" y="4" width="11" height="15" rx="2" transform="rotate(8 15.5 11.5)" />
  </svg>
);
const IconTicket = () => (
  <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
    <path d="M14 7v10" strokeDasharray="2 2" />
  </svg>
);

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
  const [gambleScreen, setGambleScreen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  // The win-line plaque rests on the frame; when there is room below the
  // reels (Focus, tall screens) it sits centred between reels and console.
  const reelsBoxRef = useRef<HTMLDivElement>(null);
  const plaqueRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const mobileDeckRef = useRef<HTMLDivElement>(null);
  const mobileStripRef = useRef<HTMLDivElement>(null);
  const [plaqueTop, setPlaqueTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const box = reelsBoxRef.current;
      const pl = plaqueRef.current;
      const con = [consoleRef.current, mobileStripRef.current].find((el) => el && el.offsetParent !== null) ?? null;
      if (!box || !pl || !con) return;
      const b = box.getBoundingClientRect();
      const free = con.getBoundingClientRect().top - b.bottom;
      const h = pl.offsetHeight;
      // Centred in the free band; if it is too tight, as low as possible
      // (6 px above the console) while overlapping the frame by 20 px at most.
      const minOffset = con === consoleRef.current ? -20 : -8;
      const offset = Math.max(minOffset, Math.min((free - h) / 2, free - h - 6));
      setPlaqueTop(Math.round(b.height + offset));
    };
    place();
    const ro = new ResizeObserver(place);
    if (reelsBoxRef.current) ro.observe(reelsBoxRef.current);
    if (consoleRef.current) ro.observe(consoleRef.current);
    if (mobileDeckRef.current) ro.observe(mobileDeckRef.current);
    if (mobileStripRef.current) ro.observe(mobileStripRef.current);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [focus, skinId]);
  const [infoTab, setInfoTab] = useState<"pay" | "features" | "session">("pay");
  const openInfo = (t: "pay" | "features" | "session" = "pay") => {
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
  // Entering Focus zooms the machine out of a blur; leaving brings the
  // normal view back into focus.
  const [focusAnim, setFocusAnim] = useState("");
  const [phoneScreen, setPhoneScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setPhoneScreen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const firstFocus = useRef(true);
  useEffect(() => {
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    // Entering: stay dark until the browser has finished its fullscreen
    // switch (set below), then play the entrance.
    // Phones: no Focus animation at all (too heavy there).
    if (isNarrowScreen()) setFocusAnim("");
    else setFocusAnim(focus ? "focus-pending" : "slots-view-in");
  }, [focus]);
  // Exit key: dissolve first, leave fullscreen while dark, then close.
  const focusLeaving = useRef(false);
  const requestFocusExit = () => {
    if (focusLeaving.current) return;
    focusLeaving.current = true;
    // Phones: close at once (fullscreen is left by the effect cleanup).
    if (isNarrowScreen()) {
      onFocusChange?.(false);
      return;
    }
    setFocusAnim("slots-focus-out");
    let closed = false;
    const done = () => {
      if (closed) return;
      closed = true;
      onFocusChange?.(false);
    };
    window.setTimeout(() => exitFullscreenSettled(done), 260);
    window.setTimeout(done, 1000); // safety net
  };
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
    // Phones relayout the whole machine when Focus opens (reels resize, the
    // orbit is rebuilt): start the entrance once that work is done, or its
    // first frames are dropped and it looks instant.
    let entranceTimer = 0;
    const narrow = isNarrowScreen();
    const cancelFs = requestFullscreenSettled(() => {
      if (!narrow) setFocusAnim("slots-focus-in");
    });
    // Esc in fullscreen only exits fullscreen (no keydown): close Focus with it.
    let entered = false;
    focusLeaving.current = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered && !wasFullscreen && !focusLeaving.current) {
        // Left by the browser (Esc, back gesture): fade out while the
        // page resizes, then close.
        focusLeaving.current = true;
        if (narrow) {
          close();
          return;
        }
        setFocusAnim("slots-focus-out");
        whenViewportStable(close);
      }
    };
    // Without fullscreen (denied or already fullscreen), Esc closes Focus.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector("[role=dialog][aria-modal=true]")) close();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelFs();
      window.clearTimeout(entranceTimer);
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
  // Esc closes the bet picker / auto menu first (and only them: it must
  // not also close Focus or spin).
  useEffect(() => {
    if (!autoOpen && !betOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setAutoOpen(false);
      setBetOpen(false);
    };
    // A press anywhere else (header included) closes them too; their own
    // toggle keys keep toggling.
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.("[data-slots-popover], [aria-expanded]")) return;
      setAutoOpen(false);
      setBetOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [autoOpen, betOpen]);
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
  // Shared popovers (desktop console and phone deck).
  const autoMenu = autoOpen && !auto ? (
                        <>
                          <button aria-label="Close auto spin menu" className="fixed inset-0 z-[59] cursor-default" onClick={() => setAutoOpen(false)} />
                          <div
                            role="menu"
                            data-slots-popover=""
                            aria-label="Auto spins"
                            className="blur-in-fast absolute bottom-full left-0 z-[60] mb-2 rounded-xl border border-white/15 bg-[#11131c] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
                          >
                            <p className="mb-1.5 text-center text-[8px] uppercase tracking-[0.2em] text-white/50">Auto spins</p>
                            <div className="flex gap-1.5">
                              {AUTO_COUNTS.map((n) => (
                                <button
                                  key={n}
                                  role="menuitem"
                                  onClick={() => startAuto(n)}
                                  disabled={!canSpin}
                                  aria-pressed={n === autoCount}
                                  className="lux-btn h-9 w-11 text-xs"
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                                <button
                                  role="menuitemcheckbox"
                                  aria-checked={s.turbo}
                                  onClick={toggleTurbo}
                                  className="flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] text-white/75 hover:bg-white/5 lg:hidden"
                                >
                                  ⚡ Turbo
                                  <span className={`relative h-4 w-7 rounded-full transition ${s.turbo ? "bg-[#d7b45b]" : "bg-white/15"}`}>
                                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${s.turbo ? "left-3.5" : "left-0.5"}`} />
                                  </span>
                                </button>
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
                      ) : null;
  const betPicker = betOpen ? (
                        <>
                          <button aria-label="Close bet picker" className="fixed inset-0 z-[59] cursor-default" onClick={() => setBetOpen(false)} />
                          <div
                            role="dialog"
                            data-slots-popover=""
                            aria-label="Choose a bet"
                            className="blur-in-fast absolute bottom-full left-1/2 z-[60] mb-3 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-xl border border-[#d7b45b]/40 p-3"
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
                                  className="lux-btn h-10 font-mono text-sm tabular-nums"
                                >
                                  {money(v)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : null;
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
  const msgKey = s.fs ? `fs-${s.fs.played}` : activeLine ? `l-${activeLine.line}` : s.message;
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
      className={`grid grid-cols-[minmax(0,1fr)] gap-6 ${focusAnim} ${
        focus
          ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black [--slots-top:0rem] [--slots-top-m:calc(env(safe-area-inset-top)+3.25rem)] lg:[--slots-top-m:0rem]"
          : "[--slots-top-m:10.15rem] lg:h-[calc(100dvh-10rem)] lg:min-h-[540px] lg:items-stretch lg:gap-4 lg:overflow-hidden"
      }`}
    >
      {focus && (
        <button
          type="button"
          onClick={requestFocusExit}
          aria-label="Exit focus mode"
          title="Exit focus (Esc)"
          style={{ top: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
          className="fixed right-4 z-[61] flex h-9 items-center gap-1.5 rounded-full border border-[#d7b45b]/50 bg-black/85 px-3 text-[11px] font-bold uppercase tracking-wider text-[#e5c779] touch-manipulation lg:bg-black/70 lg:backdrop-blur hover:border-[#e5c779]"
        >
          ✕ <span>Exit</span>
        </button>
      )}
      <section className={`overflow-clip border border-white/10 bg-[#101713] shadow-2xl ${focus ? "rounded-none border-0" : "rounded-3xl"} max-lg:flex max-lg:flex-col lg:flex lg:min-h-0 lg:flex-col`}>
        <div
          className={`relative isolate ${skin.stage} flex min-h-[calc(100dvh-var(--slots-top-m))] flex-col px-2 pt-3 sm:px-8 sm:pt-5 lg:min-h-0 lg:flex-1 lg:px-6 lg:pb-0 lg:pt-5 ${focus ? "max-lg:flex-1" : ""}`}
          style={focus ? { paddingTop: "max(3.5rem, calc(env(safe-area-inset-top) + 3.25rem))" } : undefined}
          data-focus={focus ? "" : undefined}
        >
          {skinId === "classic" && <ClassicRoom party={s.fs !== null} />}
          {skinId === "miami" && <KingpinRoom party={s.fs !== null} />}
          {/* The room melts into the control deck instead of being cut */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-44 bg-gradient-to-t from-[#0c0d14] via-[#0c0d14]/70 to-transparent"
          />
          {s.celebrate > 0 && <Confetti key={`confetti-${s.celebrate}`} colors={skin.confetti} />}

          <div className="relative z-10 w-full lg:shrink-0">
  {/* Marquee between the pots: sign, tagline and the crown meter */}
  <JackpotBar
    pools={s.pools}
    bet={bet}
    center={
      <header className="relative z-30 -mb-4 flex flex-col items-center text-center lg:-mb-5 lg:px-3">
        {/* Desktop: black-lacquer and gold pediment resting on the cabinet */}
        <div className="relative">
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
            className="shine-loop relative rounded-xl px-5 pb-1 pt-1.5 lg:px-8 lg:pb-1.5 lg:pt-2"
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
              className="font-display whitespace-nowrap text-[clamp(0.95rem,4.7vw,1.45rem)] font-bold uppercase leading-none tracking-[0.1em] lg:text-[clamp(1.3rem,1.9vw,1.95rem)] lg:tracking-[0.14em]"
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
            <div className="mt-1 flex items-center justify-center gap-2">
              <span aria-hidden="true" className="h-px w-4 bg-gradient-to-r from-transparent to-[#d7b45b]/70 lg:w-8" />
              <p className="whitespace-nowrap text-[6px] uppercase leading-none tracking-[0.16em] text-[#e5c779]/75 lg:text-[8px] lg:tracking-[0.3em]">{skin.tagline}</p>
              <span aria-hidden="true" className="h-px w-4 bg-gradient-to-l from-transparent to-[#d7b45b]/70 lg:w-8" />
            </div>
          </div>
        </div>
      </header>
    }
  />
</div>

          <div className="relative flex flex-1 flex-col items-center justify-center pb-10 lg:mt-0 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start lg:gap-5 lg:pb-[1.6rem]">
  {/* Left tower: the jackpot ladder */}
  <div className="hidden justify-self-end lg:flex lg:w-[180px] lg:self-center">
    <JackpotLadder pools={s.pools} bet={bet} />
  </div>
  <div ref={reelsBoxRef} className="relative flex justify-center">
  <SlotReels
    // Phones in Focus: no orbiting jewels (lighter while playing).
    orbit={!(focus && phoneScreen)}
    s={s}
    skin={skin}
    activeLine={activeLine}
    fast={s.lastWin > 0 || s.celebrate > 0 || !!s.fs}
    shake={s.winBanner ? (s.winBanner.tier === "epic" ? 3 : s.winBanner.tier === "mega" ? 2 : 1) : 0}
    onPull={() => playWithSound(1)}
    canPull={canSpin}
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
    ref={plaqueRef}
    className={`absolute left-1/2 z-30 flex w-[min(88%,620px)] -translate-x-1/2 items-center justify-center gap-2 overflow-hidden rounded-lg px-3 lg:w-[min(78%,620px)] lg:gap-3 lg:px-5 ${
      plaqueTop === null ? "-bottom-4" : ""
    } ${focus ? "h-9 text-[13px] lg:h-10 lg:text-[15px]" : "h-8 text-[12px] lg:h-9 lg:text-sm"}`}
    style={{
      ...(plaqueTop === null ? {} : { top: plaqueTop }),
      background: s.fs ? "linear-gradient(180deg,#2a1d0c,#120b04)" : "linear-gradient(180deg, #1b141d 0%, #0b080d 60%, #120d13 100%)",
      boxShadow: "0 0 0 1px #f0d38b, 0 0 0 3px #0a0709, 0 0 0 4px rgba(215,180,91,0.5), 0 10px 22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,243,196,0.2)",
    }}
  >
    <span key={msgKey} className="animate-msg-slide flex min-w-0 items-center justify-center gap-3">
      {messageContent}
    </span>
  </div>
  </div>
  {/* Right tower: crowns, vault, last spins */}
  <div className="hidden justify-self-start lg:flex lg:w-[180px] lg:flex-col lg:gap-2 lg:self-center">
    <p className="flex items-center justify-center gap-2"><span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-transparent to-[#d7b45b]/70" /><span className="font-display gold-text text-[12px] font-bold uppercase tracking-[0.3em]">Bonuses</span><span aria-hidden="true" className="h-px w-6 bg-gradient-to-l from-transparent to-[#d7b45b]/70" /></p>
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
    {/* Today's session at a glance: opens the Session tab */}
    <button
      type="button"
      onClick={() => openInfo("session")}
      title="Today's session — open the details"
      className={towerCard}
      style={towerStyle}
    >
      <span className="flex items-center justify-between">
        <span className="text-[9px] font-black tracking-[0.25em] text-[#e5c779]/80">TODAY</span>
        <span className={`font-mono text-sm font-black tabular-nums ${session.slots.net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
          {session.slots.net >= 0 ? "+" : "−"}◈ {money(Math.abs(session.slots.net))}
        </span>
      </span>
      <span className="mt-1 flex items-center justify-between text-[10px] text-white/45">
        <span>{money(session.slots.spins)} spins</span>
        <span>Best ◈ {money(session.slots.biggest)}</span>
      </span>
    </button>
  </div>
</div>

          {s.banner && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/65 backdrop-blur-[2px]" role="status">
              <div aria-hidden="true" className="win-rays" />
              <p className="win-title-in font-display gold-text relative px-4 text-center text-3xl font-bold tracking-[0.12em] drop-shadow-[0_4px_0_rgba(0,0,0,0.6)] sm:text-6xl lg:text-7xl">
                {s.banner}
              </p>
            </div>
          )}

          {s.winBanner && (
            <div key={`win-${s.celebrate}`} className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-black/60" role="status">
              <div className="win-flash absolute inset-0" />
              <div aria-hidden="true" className="win-rays" />
              <CoinRain count={s.winBanner.tier === "epic" ? 64 : 38} />
              <p className="win-title-in font-display gold-text relative px-4 text-center text-3xl font-bold tracking-[0.14em] [filter:drop-shadow(0_4px_0_rgba(0,0,0,0.6))_drop-shadow(0_0_24px_rgba(255,209,102,0.45))] sm:text-6xl lg:text-8xl">
                {s.winBanner.label}
              </p>
              <div
                className="win-amount-in relative mt-3 rounded-2xl px-8 py-2 sm:mt-5"
                style={{
                  background: "linear-gradient(180deg, rgba(27,20,29,0.9), rgba(11,8,13,0.9))",
                  boxShadow: "0 0 0 1px #f0d38b, 0 0 0 4px rgba(10,7,9,0.9), 0 0 0 5px rgba(215,180,91,0.5), 0 0 50px rgba(255,209,102,0.35)",
                }}
              >
                <p className="font-mono text-3xl font-black tabular-nums text-[#fff8dc] [text-shadow:0_0_22px_rgba(255,209,102,0.8)] sm:text-6xl lg:text-7xl">
                  <span className="mr-2 text-[0.6em] text-[#e5c779]">◈</span>
                  <RollingNumber value={s.winBanner.amount} fromZero ms={s.winBanner.tier === "epic" ? 2800 : 1900} />
                </p>
              </div>
            </div>
          )}

          {s.vault && <VaultGame vault={s.vault} onPick={vaultPick} onCollect={vaultCollect} />}

          {collectionRewardOpen && (
  <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crown collection reward"
      className="blur-in w-full max-w-sm rounded-2xl border border-[#d7b45b]/45 p-6 text-center"
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
          className="lux-btn flex-col px-3 py-4 text-sm"
        >
          <span className="block text-2xl">🎰</span>
          5 Free Spins
        </button>

        <button
          onClick={() => claimCollectionReward("chips")}
          className="lux-btn flex-col px-3 py-4 text-sm"
        >
          <span className="block text-2xl">◈</span>
          {money(bet * COLLECTION_CHIP_MULT)} Chips
        </button>
      </div>
    </div>
  </div>
)}

          <>
              {/* ── Desktop: lacquer & brass cabinet deck ──
                  keys · credit · bet | (−) SPIN (+) | win · gamble · buy */}
              <div ref={consoleRef} className="deck relative z-40 -mx-6 hidden lg:block lg:shrink-0">
                <span aria-hidden="true" className="deck-chevron" />
                <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1.35fr)_auto_minmax(0,1fr)] items-center gap-4 px-6 pb-2.5 pt-3.5">
                  {/* Left wing */}
                  <div className="flex min-w-0 items-center justify-end gap-3">
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => openInfo("pay")}
                        aria-label="Paytable and game info"
                        title="Paytable, features, rank and session"
                        className="cab-key w-12 flex-col gap-0.5 leading-none"
                      >
                        <IconInfo />
                        <span className="text-[8px] font-black tracking-[0.15em] opacity-75">INFO</span>
                      </button>
                      <div className="relative">
                      {autoMenu}
                        <button
                          onClick={() => (auto ? stopAuto() : setAutoOpen((v) => !v))}
                          disabled={!!s.fs || (!auto && !canSpin)}
                          aria-haspopup="menu"
                          aria-expanded={autoOpen}
                          title="Auto spins"
                          className={`cab-key w-12 flex-col gap-0.5 leading-none ${auto ? "cab-key--stop" : ""}`}
                        >
                          {auto ? <span className="text-[11px] font-black">{s.autoLeft}</span> : <IconAuto />}
                          <span className="text-[8px] font-black tracking-[0.15em] opacity-75">{auto ? "STOP" : `AUTO ${autoCount}`}</span>
                        </button>
                      </div>
                      <button
                        onClick={toggleTurbo}
                        aria-pressed={s.turbo}
                        title="Turbo (T)"
                        className="cab-key w-12 flex-col gap-0.5 leading-none"
                      >
                        <IconBolt />
                        <span className="text-[8px] font-black tracking-[0.15em] opacity-75">TURBO</span>
                      </button>
                    </div>
                    <div className="jewel flex h-14 min-w-[8.5rem] flex-1 flex-col justify-center px-3.5">
                      <span className="text-[9px] font-black tracking-[0.3em] text-[#d7b45b]/80">CREDIT</span>
                      <span className={`gold-text whitespace-nowrap font-mono font-black leading-7 tabular-nums ${meterSize(balance)}`}>
                        <span className="mr-1 text-base">◈</span>
                        <span className={flash ? "balance-flash-pink" : ""}>
                          <Counter value={balance} />
                        </span>
                      </span>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setBetOpen((v) => !v)}
                        disabled={s.busy}
                        aria-haspopup="dialog"
                        aria-expanded={betOpen}
                        title="Choose a bet"
                        className="jewel flex h-14 w-[7.5rem] flex-col items-center justify-center outline-none transition enabled:hover:brightness-125 focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-70"
                      >
                        <span className="text-[9px] font-black tracking-[0.3em] text-[#d7b45b]/80">BET ▾</span>
                        <span className={`gold-text whitespace-nowrap font-mono font-black leading-7 tabular-nums ${meterSize(bet)}`}>
                          <span className="mr-1 text-base">◈</span>{money(bet)}
                        </span>
                      </button>
                      {betPicker}
                    </div>
                  </div>

                  {/* Centre: bet keys hugging the spin */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setBetIdx(s.betIdx - 1)}
                      disabled={s.busy || s.betIdx === 0}
                      aria-label="Lower bet"
                      title="Lower bet (←)"
                      className="bet-key"
                    >
                      −
                    </button>
                    <SpinDome
                      onClick={() => playWithSound(1)}
                      disabled={!canSpin}
                      busy={s.busy}
                      ready={canSpin && !s.busy}
                      variant={skinId}
                      fs={s.fs ? { played: Math.min(s.fs.played, s.fs.total), total: s.fs.total } : null}
                    />
                    <button
                      onClick={() => setBetIdx(s.betIdx + 1)}
                      disabled={s.busy || s.betIdx === BET_LEVELS.length - 1 || BET_LEVELS[s.betIdx + 1] > balance}
                      aria-label="Raise bet"
                      title="Raise bet (→)"
                      className="bet-key"
                    >
                      +
                    </button>
                  </div>

                  {/* Right wing */}
                  <div className="flex min-w-0 items-center justify-start gap-3">
                    <div className={`jewel flex h-14 w-[10.5rem] shrink-0 flex-col items-end justify-center px-3.5 xl:w-[13rem] ${s.lastWin > 0 && !spinningNow ? "jewel--hot" : ""}`}>
                      <span className="text-[9px] font-black tracking-[0.3em] text-[#d7b45b]/80">WIN</span>
                      <span
                        className={`whitespace-nowrap font-mono font-black leading-7 tabular-nums ${meterSize(s.lastWin)} ${s.lastWin > 0 && !spinningNow ? "meter-hit text-[#fff8dc]" : "gold-text"}`}
                        style={s.lastWin > 0 && !spinningNow ? { textShadow: "0 0 16px rgba(255,209,102,0.7)" } : undefined}
                      >
                        <span className="mr-1 text-base opacity-70">◈</span>
                        <RollingNumber value={s.lastWin} />
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {outOfChips ? (
                        <button onClick={refill} className="lux-btn lux-btn--gold h-12 px-4 text-xs">
                          ◈ 1,000 refill
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setGambleScreen(true)}
                            disabled={!s.gamble}
                            aria-label="Open double or nothing"
                            title="Double or nothing on your last win"
                            className={`cab-key w-14 flex-col gap-0.5 leading-none ${s.gamble ? "cab-key--gold cab-key--live" : ""}`}
                          >
                            <IconCards />
                            <span className="text-[8px] font-black tracking-[0.12em]">GAMBLE</span>
                          </button>
                          <button
                            onClick={() => setBuyOpen(true)}
                            disabled={s.busy || !!s.fs || balance < bonusPrice}
                            title={`Buy ${FS_AWARD[3]} free spins for ◈ ${money(bonusPrice)}`}
                            className="cab-key w-14 flex-col gap-0.5 leading-none"
                          >
                            <IconTicket />
                            <span className="text-[8px] font-black tracking-[0.12em]">BUY</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Phones / tablets: bonuses strip + compact cabinet deck ── */}
              <div ref={mobileStripRef} className="mx-auto mb-2 flex w-full max-w-md items-center gap-1.5 lg:hidden">
                <button
                  type="button"
                  onClick={() => openInfo("features")}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-[#d7b45b]/25 bg-black/55 px-2.5 py-1.5 backdrop-blur-sm"
                  aria-label={`Crown collection ${collection.crowns} of ${collection.target}`}
                >
                  <span aria-hidden="true" className="text-[11px] leading-none">👑</span>
                  <span className="flex min-w-0 flex-1 gap-[2px]">
                    {Array.from({ length: collection.target }, (_, k) => (
                      <span key={k} className={`h-1.5 flex-1 rounded-sm ${k < collection.crowns ? "bg-gradient-to-b from-[#fff1bf] to-[#c89a3f]" : "bg-white/12"}`} />
                    ))}
                  </span>
                  <span className="text-[10px] font-black tabular-nums text-[#f0d99a]">{collection.crowns}/{collection.target}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openInfo("features")}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-[#d7b45b]/25 bg-black/55 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-[#e5c779]/85 backdrop-blur-sm"
                >
                  <span aria-hidden="true" className="vault-glint text-[11px] leading-none">🔐</span>
                  Vault
                </button>
                <div className="flex shrink-0 items-center gap-[3px]" aria-label="Last spins">
                  {s.history.slice(-4).map((rv, k) => (
                    <span
                      key={`${s.history.length}-${k}`}
                      className={`flex h-6 min-w-[1.6rem] items-center justify-center rounded px-0.5 font-mono text-[9px] font-bold max-[379px]:first:hidden ${
                        rv >= 20 ? "bg-[#e5c779] text-black" : rv >= 1 ? "bg-emerald-500/25 text-emerald-200" : rv > 0 ? "bg-white/10 text-white/60" : "bg-white/[0.05] text-white/25"
                      }`}
                    >
                      {rv === 0 ? "–" : rv >= 10 ? `${Math.round(rv)}×` : `${rv.toFixed(1)}×`}
                    </span>
                  ))}
                </div>
              </div>

              <div
                ref={mobileDeckRef}
                className="deck sticky bottom-0 z-40 -mx-2 mt-auto px-2.5 pt-3.5 sm:-mx-8 sm:px-8 lg:hidden"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.6rem)" }}
              >
                <span aria-hidden="true" className="deck-chevron !w-[150px]" />
                {/* Displays: credit · bet · win */}
                <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2">
                  <div className="jewel flex h-11 min-w-0 flex-col justify-center px-2.5">
                    <span className="text-[8px] font-black tracking-[0.25em] text-[#d7b45b]/80">CREDIT</span>
                    <span className={`gold-text whitespace-nowrap font-mono font-black leading-5 tabular-nums ${meterSizeSm(balance)}`}>
                      <span className="mr-0.5 text-[11px]">◈</span>
                      <span className={flash ? "balance-flash-pink" : ""}>
                        <Counter value={balance} />
                      </span>
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setBetOpen((v) => !v)}
                      disabled={s.busy}
                      aria-haspopup="dialog"
                      aria-expanded={betOpen}
                      title="Choose a bet"
                      className="jewel flex h-11 w-[5.4rem] flex-col items-center justify-center outline-none disabled:opacity-70"
                    >
                      <span className="text-[8px] font-black tracking-[0.25em] text-[#d7b45b]/80">BET ▾</span>
                      <span className={`gold-text whitespace-nowrap font-mono font-black leading-5 tabular-nums ${meterSizeSm(bet)}`}>
                        <span className="mr-0.5 text-[11px]">◈</span>{money(bet)}
                      </span>
                    </button>
                    {betPicker}
                  </div>
                  <div className={`jewel flex h-11 min-w-0 flex-col items-end justify-center px-2.5 ${s.lastWin > 0 && !spinningNow ? "jewel--hot" : ""}`}>
                    <span className="text-[8px] font-black tracking-[0.25em] text-[#d7b45b]/80">WIN</span>
                    <span
                      className={`whitespace-nowrap font-mono font-black leading-5 tabular-nums ${meterSizeSm(s.lastWin)} ${s.lastWin > 0 && !spinningNow ? "meter-hit text-[#fff8dc]" : "gold-text"}`}
                    >
                      <span className="mr-0.5 text-[11px] opacity-70">◈</span>
                      <RollingNumber value={s.lastWin} />
                    </span>
                  </div>
                </div>

                {/* Keys: info · auto | (−) SPIN (+) | gamble · buy */}
                <div className="mx-auto mt-3 flex max-w-md items-center justify-between gap-0.5">
                  <div className="flex items-center gap-1 min-[380px]:gap-1.5">
                    <button
                      onClick={() => openInfo("pay")}
                      aria-label="Paytable and game info"
                      className="cab-key !h-10 w-10 flex-col gap-0.5 leading-none"
                    >
                      <IconInfo />
                      <span className="text-[7px] font-black tracking-[0.12em] opacity-75">INFO</span>
                    </button>
                    <div className="relative">
                      {autoMenu}
                      <button
                        onClick={() => (auto ? stopAuto() : setAutoOpen((v) => !v))}
                        disabled={!!s.fs || (!auto && !canSpin)}
                        aria-haspopup="menu"
                        aria-expanded={autoOpen}
                        aria-label={auto ? "Stop auto spin" : "Auto spins"}
                        className={`cab-key !h-10 w-10 flex-col gap-0.5 leading-none ${auto ? "cab-key--stop" : ""} ${s.turbo ? "!border-[#ffd166]/70" : ""}`}
                      >
                        {auto ? <span className="text-[11px] font-black">{s.autoLeft}</span> : <IconAuto />}
                        <span className="text-[7px] font-black tracking-[0.12em] opacity-75">{auto ? "STOP" : s.turbo ? "AUTO ⚡" : "AUTO"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 min-[380px]:gap-2">
                    <button
                      onClick={() => setBetIdx(s.betIdx - 1)}
                      disabled={s.busy || s.betIdx === 0}
                      aria-label="Lower bet"
                      className="bet-key !h-8 !w-8 !text-base"
                    >
                      −
                    </button>
                    <SpinDome
                      onClick={() => playWithSound(1)}
                      disabled={!canSpin}
                      busy={s.busy}
                      ready={canSpin && !s.busy}
                      variant={skinId}
                      size="clamp(3.9rem, 18vw, 4.4rem)"
                      fs={s.fs ? { played: Math.min(s.fs.played, s.fs.total), total: s.fs.total } : null}
                    />
                    <button
                      onClick={() => setBetIdx(s.betIdx + 1)}
                      disabled={s.busy || s.betIdx === BET_LEVELS.length - 1 || BET_LEVELS[s.betIdx + 1] > balance}
                      aria-label="Raise bet"
                      className="bet-key !h-8 !w-8 !text-base"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1 min-[380px]:gap-1.5">
                    {outOfChips ? (
                      <button onClick={refill} className="lux-btn lux-btn--gold h-11 px-3 text-[10px]">
                        ◈ 1,000
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setGambleScreen(true)}
                          disabled={!s.gamble}
                          aria-label="Open double or nothing"
                          className={`cab-key !h-10 w-10 flex-col gap-0.5 leading-none ${s.gamble ? "cab-key--gold cab-key--live" : ""}`}
                        >
                          <IconCards />
                          <span className="text-[7px] font-black tracking-[0.08em]">×2</span>
                        </button>
                        <button
                          onClick={() => setBuyOpen(true)}
                          disabled={s.busy || !!s.fs || balance < bonusPrice}
                          aria-label={`Buy ${FS_AWARD[3]} free spins for ${money(bonusPrice)}`}
                          className="cab-key !h-10 w-10 flex-col gap-0.5 leading-none"
                        >
                          <IconTicket />
                          <span className="text-[7px] font-black tracking-[0.08em]">BUY</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
          </>
        </div>
      </section>

      {/* Desktop: paytable, theme, rank and session in a slide-over panel */}
      {rankToast && (
        <div role="status" className="blur-in pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[95] -translate-x-1/2 lg:top-4 rounded-2xl border border-[#ff4fa3]/70 bg-[#1a0d2e] px-5 py-3 text-sm font-semibold text-[#ff9fd0] shadow-2xl lg:left-auto lg:right-4 lg:translate-x-0">
          ★ {rankToast}
        </div>
      )}
      {infoOpen && (
        <div className="backdrop-in fixed inset-0 z-[90]">
          <button aria-label="Close game info" className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]" onClick={() => setInfoOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Game info"
            className="[animation:drawerIn_.4s_cubic-bezier(0.22,1,0.36,1)_both] absolute right-0 top-0 flex h-full w-full flex-col border-l sm:w-[min(680px,94vw)] border-white/10 bg-[#0b0f0d] shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#e5c779]">Game info</p>
              <button
                onClick={() => setInfoOpen(false)}
                aria-label="Close"
                className="lux-btn h-9 w-9 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin] sm:px-5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}>
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