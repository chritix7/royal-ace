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
import { Counter, small } from "./ui";
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

const money = (n: number) => n.toLocaleString("en-US");
const PAY_ROWS: Paying[] = ["seven", "wild", "gem", "bell", "grape", "lemon", "cherry"];

function Led({ label, children, className, on }: { label: string; children: ReactNode; className: string; on?: boolean }) {
  return (
    <div className={`rounded-lg border px-2 py-1 text-center sm:px-3 sm:py-1.5 ${className}`}>
      <p className="text-[8px] tracking-[0.2em] text-white/50 sm:text-[9px] sm:tracking-[0.25em]">{label}</p>
      <p className={`font-mono text-base font-black tracking-wider sm:text-2xl ${on ? "animate-pulse" : ""}`}>{children}</p>
    </div>
  );
}

export default function Slots({ active = true }: { active?: boolean }) {
  const [skinId, setSkinId] = useState<SkinId>("miami");
  const [fullscreen, setFullscreen] = useState(false);
  const [gambleScreen, setGambleScreen] = useState(false);
  const skin = SKINS[skinId];
  const {
    s, balance, bet, lineBet, canSpin, play, stopAuto, setBetIdx, maxBet, toggleTurbo, refill,
    bonusPrice, buyBonus, vaultPick, vaultCollect, gambleChoose, gambleCollect,
  } = useSlots(active, skin.labels);

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
        <div className={`relative isolate ${skin.stage} px-2 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-6 ${fullscreen ? "min-h-[100dvh] pb-4" : ""}`}>
          {skinId === "miami" && <MiamiBackdrop party={s.fs !== null} />}
          {s.celebrate > 0 && <Confetti key={s.celebrate} colors={skin.confetti} />}

          <button
            onClick={() => setFullscreen((v) => !v)}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="absolute right-2 top-2 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-sm text-white/80 backdrop-blur transition hover:border-[#ffd166] hover:text-[#ffd166] sm:hidden"
          >
            {fullscreen ? "✕" : "⛶"}
          </button>

          <header className={`text-center ${fullscreen ? "mb-2" : "mb-3 sm:mb-5"}`}>
            <div className={`inline-block rounded-2xl border-2 px-4 py-1.5 sm:px-8 sm:py-2 ${skin.signBox}`}>
              <h3 className={`text-2xl font-black uppercase tracking-[0.12em] sm:text-5xl sm:tracking-[0.14em] ${skin.titleClass}`}>{skin.title}</h3>
            </div>
            <p className="mt-1.5 text-[9px] uppercase tracking-[0.22em] text-white/70 sm:mt-2 sm:text-[11px] sm:tracking-[0.3em]">{skin.tagline}</p>
          </header>

          <JackpotBar pools={s.pools} bet={bet} />

          {s.fs && (
            <div className="mx-auto mb-3 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-[#ffd166]/60 bg-black/40 px-3 py-1.5 text-[11px] text-[#ffd166] sm:mb-4 sm:gap-x-5 sm:px-4 sm:py-2 sm:text-xs" role="status">
              <span className="font-black tracking-widest">{skin.labels.freeSpins} ×{FS_MULT}</span>
              <span>Spin {s.fs.played} / {s.fs.total}</span>
              <span>Won ◈ {money(s.fs.win)}</span>
            </div>
          )}

          <SlotReels
            s={s}
            skin={skin}
            activeLine={activeLine}
            fast={s.lastWin > 0 || s.celebrate > 0 || !!s.fs}
            shake={s.winBanner ? (s.winBanner.tier === "epic" ? 3 : s.winBanner.tier === "mega" ? 2 : 1) : 0}
            onPull={() => play(1)}
            canPull={canSpin}
          />

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

          <div className="mt-3 flex min-h-14 flex-col items-center gap-1.5 sm:mt-5 sm:min-h-[4.5rem] sm:gap-2" role="status" aria-live="polite">
            <div key={s.message} className="animate-pop max-w-full rounded-full border border-white/20 bg-black/40 px-3 py-1 text-center text-xs text-white sm:px-5 sm:py-1.5 sm:text-sm">
              {s.message}
            </div>
            {activeLine && (
              <p className="max-w-full rounded-full bg-black/40 px-2.5 py-1 text-center text-[10px] text-white/70 sm:text-[11px]">
                Line {activeLine.line}: {activeLine.count}× <Glyph sym={activeLine.sym} skin={skin} /> · +◈ {money(activeLine.pay * lineBet)}
                {s.lineWins.length > 1 && ` · ${s.lineWins.length} winning lines`}
              </p>
            )}
          </div>

          <div className="mx-auto mt-2 grid max-w-2xl grid-cols-3 gap-1.5 sm:mt-3 sm:gap-3">
            <Led label="CREDIT" className={`${skin.ledBox} ${skin.led}`}>
              <Counter value={balance} />
            </Led>
            <Led label="TOTAL BET" className={`${skin.ledBox} ${skin.led}`}>{money(bet)}</Led>
            <Led label="WIN" className={`${skin.ledBox} ${skin.led}`} on={s.lastWin > 0 && !spinningNow}>
              <RollingNumber value={s.lastWin} />
            </Led>
          </div>

          {fullscreen ? (
            <div className="sticky bottom-0 z-30 -mx-2 mt-3 border-t border-white/10 bg-black/85 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur sm:-mx-8 sm:px-8 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <BetBar levels={BET_LEVELS} index={s.betIdx} onSelect={setBetIdx} balance={balance} disabled={s.busy} skin={skin} lines={PAYLINES.length} />

              {outOfChips ? (
                <div className="mt-2 flex justify-center">
                  <button onClick={refill} className={`rounded-full px-5 py-2.5 text-xs font-bold sm:px-8 sm:py-3 sm:text-sm ${skin.betOn}`}>
                    Out of chips · take a ◈ 500 refill
                  </button>
                </div>
              ) : (
                <div className="mx-auto mt-2 flex max-w-md items-end justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] tracking-[0.2em] text-white/50">AUTO</span>
                    <div className="flex gap-1">
                      {[10, 25, 50].map((n) => (
                        <button key={n} onClick={() => play(n)} disabled={!canSpin} className={`${small} px-2 text-[11px]`}>{n}</button>
                      ))}
                    </div>
                    <button
                      onClick={toggleTurbo}
                      aria-pressed={s.turbo}
                      className={`${small} px-2 text-[11px] ${s.turbo ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                    >
                      ⚡ Turbo
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {s.gamble && (
                      <button
                        onClick={() => setGambleScreen(true)}
                        className="h-8 min-w-14 rounded-full border border-[#ffd166]/70 bg-[linear-gradient(180deg,#ffd166,#d7b45b)] px-3 text-[11px] font-black tracking-widest text-[#10130e]"
                      >
                        X2
                      </button>
                    )}
                    <button onClick={maxBet} disabled={s.busy} className={`${small} px-2 text-[11px]`}>Max bet</button>
                    <button
                      onClick={buyBonus}
                      disabled={s.busy || !!s.fs || balance < bonusPrice}
                      className={`${small} max-w-28 px-2 text-[10px] leading-3 ${s.confirmBuy ? "!border-[#ffd166] !text-[#ffd166] animate-pulse" : ""}`}
                    >
                      {s.confirmBuy ? "Confirm?" : "Buy bonus"} ◈ {money(bonusPrice)}
                    </button>
                  </div>

                  {auto ? (
                    <button
                      onClick={stopAuto}
                      aria-label="Stop auto spin"
                      className="h-16 w-16 shrink-0 rounded-full border-4 border-red-200/60 bg-red-600/80 text-xs font-black leading-4 text-white shadow-[0_0_24px_#ef4444aa]"
                    >
                      STOP
                      <span className="block text-[9px] font-normal">{s.autoLeft} left</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => play(1)}
                      disabled={!canSpin}
                      aria-label="Spin"
                      className={`h-16 w-16 shrink-0 rounded-full text-sm font-black tracking-widest transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${skin.spinBtn}`}
                    >
                      {s.busy ? "…" : "SPIN"}
                    </button>
                  )}
                </div>
              )}

              {balance < bet && !s.busy && !outOfChips && (
                <p className="mt-1.5 text-center text-[11px] text-red-300">Not enough chips for this bet. Pick a lower one.</p>
              )}
            </div>
          ) : (
            <>
              <div className="mx-auto mt-2 max-w-2xl sm:mt-3">
                <BetBar levels={BET_LEVELS} index={s.betIdx} onSelect={setBetIdx} balance={balance} disabled={s.busy} skin={skin} lines={PAYLINES.length} />
              </div>

              <div className="sticky bottom-0 z-20 -mx-2 mt-2 border-t border-white/10 bg-black/70 px-2 py-2 backdrop-blur sm:-mx-8 sm:mt-3 sm:px-8 sm:py-3 lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
                {outOfChips ? (
                  <div className="flex justify-center">
                    <button onClick={refill} className={`rounded-full px-5 py-2.5 text-xs font-bold sm:px-8 sm:py-3 sm:text-sm ${skin.betOn}`}>
                      Out of chips · take a ◈ 500 refill
                    </button>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 sm:gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] tracking-[0.2em] text-white/50 sm:text-[10px] sm:tracking-[0.25em]">AUTO</span>
                      <div className="flex gap-1">
                        {[10, 25, 50].map((n) => (
                          <button key={n} onClick={() => play(n)} disabled={!canSpin} className={`${small} px-2 text-[11px] sm:px-3 sm:text-xs`}>{n}</button>
                        ))}
                      </div>
                      <button
                        onClick={toggleTurbo}
                        aria-pressed={s.turbo}
                        className={`${small} px-2 text-[11px] sm:px-3 sm:text-xs ${s.turbo ? "!border-[#ffd166] !text-[#ffd166]" : ""}`}
                      >
                        ⚡ Turbo
                      </button>
                    </div>

                    {auto ? (
                      <button
                        onClick={stopAuto}
                        aria-label="Stop auto spin"
                        className="h-18 w-18 shrink-0 rounded-full border-4 border-red-200/60 bg-red-600/80 text-xs font-black leading-4 text-white shadow-[0_0_24px_#ef4444aa] outline-none focus-visible:ring-4 focus-visible:ring-white sm:h-24 sm:w-24 sm:text-sm"
                      >
                        STOP
                        <span className="block text-[9px] font-normal sm:text-[10px]">{s.autoLeft} left</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => play(1)}
                        disabled={!canSpin}
                        aria-label="Spin"
                        className={`h-18 w-18 shrink-0 rounded-full text-sm font-black tracking-widest outline-none transition active:scale-95 focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-24 sm:w-24 sm:text-base ${skin.spinBtn}`}
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
                      <button onClick={maxBet} disabled={s.busy} className={`${small} px-2 text-[11px] sm:px-4 sm:text-xs`}>Max bet</button>
                      <button
                        onClick={buyBonus}
                        disabled={s.busy || !!s.fs || balance < bonusPrice}
                        title="Start the free spins right away"
                        className={`${small} max-w-28 px-2 text-[10px] leading-3 sm:max-w-none sm:px-3 sm:text-xs sm:leading-4 ${s.confirmBuy ? "!border-[#ffd166] !text-[#ffd166] animate-pulse" : ""}`}
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