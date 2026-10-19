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
import { Counter, small, machineSmall } from "./ui";
import { RANKS, SKINS, rankOf, type SkinId } from "../lib/skins";
import { useSlots } from "../lib/useSlots";
import { VAULT_TRIGGER } from "../lib/vault";
import {
  BET_LEVELS,
  BONUS_PRICE_MULT,
  FS_AWARD,
  FS_CAP,
  FS_MULT,
  FS_RETRIGGER,
  PAYLINES,
  PAYS,
  SCATTER_PAYS,
  THEORETICAL_RTP,
  type Paying,
} from "../lib/slots";
import { sfx } from "../lib/sound";
import { AUTO_COUNTS, loadAutoCount, saveAutoCount, type AutoCount } from "../lib/autoSpin";

const money = (n: number) => n.toLocaleString("en-US");
const PAY_ROWS: Paying[] = ["seven", "wild", "gem", "bell", "grape", "lemon", "cherry"];

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

export default function Slots({ active = true }: { active?: boolean }) {
  const [skinId, setSkinId] = useState<SkinId>("miami");
  const [fullscreen, setFullscreen] = useState(false);
  const [gambleScreen, setGambleScreen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const skin = SKINS[skinId];
  const {
    s, balance, bet, lineBet, canSpin, play, stopAuto, setBetIdx, maxBet, toggleTurbo, refill,
    bonusPrice, buyBonus, vaultPick, vaultCollect, gambleChoose, gambleCollect,
  } = useSlots(active, skin.labels);

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
  const net = s.stats.won - s.stats.wagered;
  const outOfChips = !s.busy && balance < BET_LEVELS[0];

  useEffect(() => {
    if (!s.gamble) setGambleScreen(false);
  }, [s.gamble]);

  return (
    <div className={`grid gap-6 lg:grid-cols-[1fr_320px] ${fullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-black" : ""}`}>
      <section className={`overflow-clip border border-white/10 bg-[#101713] shadow-2xl ${fullscreen ? "rounded-none border-0" : "rounded-3xl"}`}>
        <div
          className={`relative isolate ${skin.stage} px-2 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-6 ${fullscreen ? "min-h-[100dvh] pb-4" : ""}`}
          style={fullscreen ? { paddingTop: "max(env(safe-area-inset-top), 1rem)" } : undefined}
        >
          {skinId === "miami" && <MiamiBackdrop party={s.fs !== null} />}
          {s.celebrate > 0 && <Confetti key={s.celebrate} colors={skin.confetti} />}

          <div className="relative z-10 mb-3 w-full sm:mb-5">
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

  {/* Titre centré, sous le bouton */}
  <header className="flex w-full justify-center text-center">
    <div
      className="relative w-full max-w-full rounded-2xl border border-white/15 px-4 py-2 sm:px-6 sm:py-2.5"
      style={{
        background: "linear-gradient(180deg, #2a2f36, #14181d)",
        boxShadow:
          "0 8px 24px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)",
      }}
    >
      <div
        className={`inline-block max-w-full rounded-xl border-2 px-3 py-1 sm:px-5 ${skin.signBox}`}
      >
        <h3
          className={`text-lg font-black uppercase leading-tight tracking-[0.08em] sm:text-3xl sm:tracking-[0.12em] ${skin.titleClass}`}
        >
          {skin.title}
        </h3>
      </div>

      <p className="mt-1 text-[8px] uppercase leading-relaxed tracking-[0.14em] text-white/60 sm:text-[10px] sm:tracking-[0.22em]">
        {skin.tagline}
      </p>
    </div>
  </header>
</div>

          <JackpotBar pools={s.pools} bet={bet} />

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

          {s.fs && !fullscreen && (
            <div className="pointer-events-none mx-auto mt-1.5 flex w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-[#ffd166]/60 bg-black/60 px-3 py-1.5 text-center text-[11px] text-[#ffd166] backdrop-blur sm:gap-x-5 sm:px-4 sm:py-2 sm:text-xs" role="status">
              <span className="font-black tracking-widest">{skin.labels.freeSpins} ×{FS_MULT}</span>
              <span>Spin {s.fs.played} / {s.fs.total}</span>
              <span>Won ◈ {money(s.fs.win)}</span>
            </div>
          )}

          {s.banner && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/60" role="status">
              <p className="animate-pop px-4 text-center text-2xl font-black tracking-widest text-[#ffd166] drop-shadow-[0_0_24px_#ff2e88] sm:text-6xl">
                {s.banner}
              </p>
            </div>
          )}

          {s.winBanner && (
            <div key={s.celebrate} className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55" role="status">
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
  <div className="shrink-0">
    <p className="text-[8px] uppercase tracking-[0.2em] text-white/45">
      Balance
    </p>
    <p className="font-mono text-sm font-black tabular-nums text-[#e5b2cf]">
      ◈ {money(balance)}
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
        TOUR {s.fs.played}/{s.fs.total}
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
          aria-label="Fermer le choix des tours"
          className="fixed inset-0 z-[59] cursor-default"
          onClick={() => setAutoOpen(false)}
        />
        <div
          role="menu"
          aria-label="Tours automatiques"
          className="absolute bottom-full left-1/2 z-[60] mb-3 -translate-x-1/2 rounded-xl border border-white/15 bg-[#11131c] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          <p className="mb-1.5 text-center text-[8px] uppercase tracking-[0.2em] text-white/50">Tours auto</p>
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
    {s.busy ? "…" : "SPIN"}
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

              {balance < bet && !s.busy && !outOfChips && (
                <p className="mt-2 text-center text-[11px] text-red-300">Not enough chips for this bet. Pick a lower one.</p>
              )}

              {outOfChips && (
                <div className="mt-2 flex justify-center">
                  <button onClick={refill} className={`rounded-full px-5 py-2.5 text-xs font-bold sm:px-8 sm:py-3 sm:text-sm ${skin.betOn}`}>
                    Out of chips · take a ◈ 1,000 refill
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div
  className="mt-3 flex min-h-14 flex-col items-center sm:mt-5 sm:min-h-[4.5rem]"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <div
    className="relative w-full max-w-2xl rounded-lg border border-white/15 px-3 py-1 sm:px-5 sm:py-1.5"
    style={{
      background:
        "linear-gradient(180deg, #131620 0%, #090c13 60%, #10131c 100%)",
      boxShadow:
        "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.08)",
    }}
  >
    {/* Reflet discret sur le bord supérieur */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 top-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
      }}
    />

    <p className="text-center text-xs leading-5 text-white/85 sm:text-sm">
      {s.message}
    </p>

    {activeLine && (
      <p className="mt-1 border-t border-white/[0.07] pt-1 text-center text-[10px] leading-4 text-[#d8bb83] sm:text-[11px]">
        Line {activeLine.line}: {activeLine.count}×{" "}
        <Glyph sym={activeLine.sym} skin={skin} />
        {" "}· +◈ {money(activeLine.pay * lineBet)}
        {s.lineWins.length > 1 &&
          ` · ${s.lineWins.length} winning lines`}
      </p>
    )}
  </div>
</div>

              <div className="mx-auto mt-2 grid max-w-2xl grid-cols-3 gap-1.5 sm:mt-3 sm:gap-3">
  <Led label="CREDIT" className="">
    <Counter value={balance} />
  </Led>

  <Led label="TOTAL BET" className="">
    {money(bet)}
  </Led>

  <Led
    label="WIN"
    className=""
    on={s.lastWin > 0 && !spinningNow}
  >
    <RollingNumber value={s.lastWin} />
  </Led>
</div>

              <div className="mx-auto mt-2 max-w-2xl sm:mt-3">
                <BetBar levels={BET_LEVELS} index={s.betIdx} onSelect={setBetIdx} balance={balance} disabled={s.busy} skin={skin} lines={PAYLINES.length} />
              </div>

              <div
  className="sticky bottom-0 z-20 -mx-2 mt-2 border-t border-white/15 px-2 py-2 sm:-mx-8 sm:mt-3 sm:px-8 sm:py-3 lg:static"
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
                  <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 sm:gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] tracking-[0.2em] text-white/50 sm:text-[10px] sm:tracking-[0.25em]">AUTO</span>
                      <div className="flex gap-1">
                        {AUTO_COUNTS.map((n) => (
                          <button
                            key={n}
                            onClick={() => startAuto(n)}
                            disabled={!canSpin}
                            className={`${machineSmall} px-2 text-[11px] sm:px-3 sm:text-xs ${n === autoCount ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={toggleTurbo}
                        aria-pressed={s.turbo}
                        className={`${machineSmall} px-2 text-[11px] sm:px-3 sm:text-xs ${s.turbo ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                      >
                        ⚡ Turbo
                      </button>
                    </div>

                    {auto ? (
                      <button
                        onClick={stopAuto}
                        aria-label="Stop auto spin"
                        className="h-18 w-18 shrink-0 rounded-full border-4 border-red-200/60 bg-red-600/80 text-xs font-black leading-4 text-white shadow-[0_0_24px_#ef4444aa] outline-none focus-visible:ring-4 focus-visible:ring-white sm:h-24 sm:w-24 sm:text-sm"
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
                        className={`relative h-18 w-18 shrink-0 rounded-full text-sm font-black tracking-widest outline-none transition active:scale-95 focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-24 sm:w-24 sm:text-base ${skin.spinBtn}`}
style={{
  boxShadow:
    "0 0 0 3px #111219, 0 0 0 4px rgba(255,255,255,0.18), 0 7px 0 #090a10, 0 11px 16px rgba(0,0,0,0.50), inset 0 2px 3px rgba(255,255,255,0.30), inset 0 -4px 7px rgba(0,0,0,0.28)",
}}
                      >
                        {s.busy ? "…" : "SPIN"}
                      </button>
                    )}

                    <div className="flex flex-col items-end gap-1">
                      {s.gamble && (
                        <button
                          onClick={() => setGambleScreen(true)}
                          className="h-9 min-w-14 rounded-full border border-[#ffd166]/70 bg-[linear-gradient(180deg,#ffd166,#d7b45b)] px-3 text-xs font-black tracking-widest text-[#10130e] shadow-[0_0_18px_rgba(255,209,102,.35)] transition hover:brightness-110 active:scale-95"
                        >
                          X2
                        </button>
                      )}
                      <button onClick={maxBet} disabled={s.busy} className={`${machineSmall} px-2 text-[11px] sm:px-4 sm:text-xs`}>Max bet</button>
                      <button
                        onClick={buyBonus}
                        disabled={s.busy || !!s.fs || balance < bonusPrice}
                        title="Start the free spins right away"
                        className={`${machineSmall} max-w-28 px-2 text-[10px] leading-3 sm:max-w-none sm:px-3 sm:text-xs sm:leading-4 ${s.confirmBuy ? "!border-[#ffd166] !text-[#ffd166] animate-pulse" : ""}`}
                      >
                        {s.confirmBuy ? "Confirm?" : "Buy bonus"} ◈ {money(bonusPrice)}
                      </button>
                      <p className="hidden text-right text-[10px] leading-4 text-white/40 sm:block">Space: spin<br />← →: bet</p>
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

      <aside className={`flex flex-col gap-5 ${fullscreen ? "hidden" : ""}`}>
        {rankToast && (
          <div role="status" className="animate-pop fixed right-4 top-4 z-50 rounded-2xl border border-[#ff4fa3]/70 bg-[#1a0d2e] px-5 py-3 text-sm font-semibold text-[#ff9fd0] shadow-2xl">
            ★ {rankToast}
          </div>
        )}

        <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
          <h3 className="text-lg font-bold">Theme</h3>
          <div className="mt-3 flex gap-2" role="group" aria-label="Machine theme">
            {Object.values(SKINS).map((k) => (
              <button
                key={k.id}
                onClick={() => !s.busy && setSkinId(k.id)}
                disabled={s.busy}
                aria-pressed={skinId === k.id}
                className={`flex-1 rounded-full border py-2 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40 ${
                  skinId === k.id ? "border-[#d7b45b] bg-[#d7b45b]/10 text-[#e5c779]" : "border-white/10 text-white/60"
                }`}
              >
                {k.id === "miami" ? "Miami" : "Classic"}
              </button>
            ))}
          </div>
        </div>

        {skinId === "miami" && (
          <div className="rounded-3xl border border-[#ff4fa3]/30 bg-[#1a0d2e] p-6">
            <p className="text-[11px] text-white/40">Your rank</p>
            <h3 className="mt-1 text-2xl font-black text-[#ff7ac0] [text-shadow:0_0_14px_#ff2e8888]">{rank.current.name}</h3>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(rank.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next rank">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff4fa3,#22d3ee)] transition-all duration-700" style={{ width: `${rank.progress * 100}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-white/45">
              Empire value ◈ {money(s.stats.won)}
              {rank.next ? ` · next: ${rank.next.name} at ◈ ${money(rank.next.min)}` : " · you own the skyline"}
            </p>
            <ol className="mt-3 space-y-1 text-[11px]">
              {RANKS.map((r, i) => (
                <li key={r.name} className={i <= rank.index ? "text-[#ff9fd0]" : "text-white/25"}>
                  {i <= rank.index ? "★" : "☆"} {r.name}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
          <h3 className="text-lg font-bold">Paytable</h3>
          <p className="mt-1 text-[11px] text-white/40">
            {PAYLINES.length} lines · wins in multiples of the line bet (◈ {money(lineBet)}), left to right.
          </p>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-white/40">
                <th className="py-1 text-left font-normal"> </th>
                <th className="py-1 text-right font-normal">3×</th>
                <th className="py-1 text-right font-normal">4×</th>
                <th className="py-1 text-right font-normal">5×</th>
              </tr>
            </thead>
            <tbody>
              {PAY_ROWS.map((sym) => (
                <tr key={sym} className="border-t border-white/5">
                  <td className="py-1.5 text-base" title={skin.names[sym]}>
                    <Glyph sym={sym} skin={skin} className="h-8 w-8" />
                    {sym === "wild" && <span className="ml-2 rounded bg-white/10 px-1 text-[9px] font-bold text-white/70">WILD</span>}
                  </td>
                  {PAYS[sym].map((p, i) => (
                    <td key={i} className="py-1.5 text-right font-bold text-[#e5c779]">{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-3 space-y-2 text-[11px] leading-4 text-white/45">
            <li>
              <Glyph sym="wild" skin={skin} /> <b className="text-white/70">WILD</b> ({skin.names.wild}) replaces every symbol except <Glyph sym="scatter" skin={skin} />. It lands on reels 2, 3 and 4, then expands to fill the whole reel and triggers a free re-spin (up to 3 in a row, expanded wilds stay in place).
            </li>
            <li>
              <Glyph sym="scatter" skin={skin} /> <b className="text-white/70">SCATTER</b> ({skin.names.scatter}): 3, 4 or 5 anywhere pay {SCATTER_PAYS[3]}×, {SCATTER_PAYS[4]}× and {SCATTER_PAYS[5]}× the total bet and award {FS_AWARD[3]}, {FS_AWARD[4]} or {FS_AWARD[5]} free spins with all wins ×{FS_MULT}.
            </li>
            <li>
              <b className="text-white/70">Retrigger:</b> 3, 4 or 5 <Glyph sym="scatter" skin={skin} /> during free spins add +{FS_RETRIGGER[3]}, +{FS_RETRIGGER[4]} or +{FS_RETRIGGER[5]} spins (up to {FS_CAP} in one bonus).
            </li>
            <li>
              <b className="text-white/70">The vault and the jackpots:</b> each paid spin has a 1 in {Math.round(1 / VAULT_TRIGGER)} chance to open the vault. Pick 3 of 12 cases: chips, or one of 4 growing jackpots (Mini, Minor, Major, Kingpin). Jackpots are multiples of your bet, so a higher bet means bigger jackpots.
            </li>
            <li>
              <b className="text-white/70">Buy bonus:</b> start the free spins right away for ◈ {money(bonusPrice)} ({BONUS_PRICE_MULT}× your bet).
            </li>
            <li>
              <b className="text-white/70">Gamble:</b> after a win you can double it by guessing a card's colour (50 / 50, up to 3 times in a row).
            </li>
            <li>
              Theoretical return {(THEORETICAL_RTP * 100).toFixed(0)}% including the vault and the jackpots. Wins can be streaky: that is how real machines behave.
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
          <h3 className="text-lg font-bold">Session</h3>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-white/50">
            <dt>Spins</dt><dd className="text-right text-white">{money(s.stats.spins)}</dd>
            <dt>Wagered</dt><dd className="text-right text-white">◈ {money(s.stats.wagered)}</dd>
            <dt>Won</dt><dd className="text-right text-white">◈ {money(s.stats.won)}</dd>
            <dt>Net</dt>
            <dd className={`text-right font-bold ${net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {net >= 0 ? "+" : "−"}{money(Math.abs(net))}
            </dd>
            <dt>Biggest win</dt><dd className="text-right text-white">◈ {money(s.stats.biggest)}</dd>
            <dt>Bonus rounds</dt><dd className="text-right text-white">{s.stats.freeSpinRounds}</dd>
            <dt>Vaults opened</dt><dd className="text-right text-white">{s.stats.vaults}</dd>
            <dt>Jackpots won</dt><dd className="text-right text-white">{s.stats.jackpotWins}</dd>
          </dl>
          {s.history.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Recent rounds">
              {s.history.map((r, i) => (
                <span
                  key={i}
                  title={`${r.toFixed(1)}× the bet`}
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    r >= 20 ? "bg-[#e5c779] text-black" : r >= 1 ? "bg-emerald-500/30 text-emerald-200" : r > 0 ? "bg-white/15 text-white/70" : "bg-red-500/25 text-red-200"
                  }`}
                >
                  {r === 0 ? "0" : r >= 10 ? Math.round(r) : r.toFixed(1)}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="px-3 text-center text-[11px] leading-5 text-white/25">
          Virtual chips only. No real money, deposits or cash-outs.
        </p>
      </aside>

      {buyOpen && (
  <div
    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    onClick={() => setBuyOpen(false)}
  >
    <div
      className="animate-pop w-[min(88vw,340px)] rounded-3xl border border-[#c8a65b]/50 bg-[#101713] p-6 text-center shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Bonus purchase</p>
      <h3 className="mt-2 text-xl font-black text-[#ffd166]">
        Start {skin.labels.freeSpins}?
      </h3>
      <div className="mx-auto mt-4 w-fit rounded-2xl border border-white/10 bg-black/40 px-6 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Price</p>
        <p className="font-mono text-3xl font-black text-white">◈ {money(bonusPrice)}</p>
      </div>
      <div className="mt-5 flex gap-3">
        <button
          onClick={() => setBuyOpen(false)}
          className={`${small} flex-1 py-3`}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            buyBonus();
            buyBonus();
            setBuyOpen(false);
          }}
          disabled={balance < bonusPrice}
          className={`${small} flex-1 py-3 !border-[#ffd166] !text-[#ffd166]`}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

      {s.gamble && gambleScreen && (
        <GamblePanel
          g={s.gamble}
          onChoose={gambleChoose}
          onCollect={gambleCollect}
          onClose={() => setGambleScreen(false)}
        />
      )}
    </div>
  );
}