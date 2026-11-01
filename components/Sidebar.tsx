"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Theme, VegasVariant } from "../lib/game";
import { CHIPS, CHIP_BG, VEGAS_VARIANTS, money } from "../lib/game";
import { Counter, Spark, Toggle, SideBet, small } from "./ui";
import { ACHIEVEMENTS } from "../lib/achievements";
import { audio, useAudioSettings } from "../lib/audio";
import type { Game } from "../lib/useBlackjack";
import { useSession } from "../lib/sessionStore";

/** Pourcentage lisible. */
const rate = (hits: number, n: number) => (n > 0 ? `${((100 * hits) / n).toFixed(1)}%` : "–");
/** Vrai si le résultat reste dans ce que le hasard donne normalement (3 écarts-types). */
const verdict = (hits: number, n: number, p: number) => {
  if (n < 100) return <span className="text-white/30">· play more</span>;
  const normal = Math.abs(hits / n - p) <= 3 * Math.sqrt((p * (1 - p)) / n);
  return normal ? <span className="text-emerald-300">· normal</span> : <span className="text-amber-300">· unusual</span>;
};

export default function Sidebar({ g }: { g: Game }) {
  const sound = useAudioSettings();
  const { s, showHint, setShowHint, showCount, setShowCount, canBet, winRate, spots, sides, stake, running, trueCount, decksLeft, addChip, setBetTo, adjustSide, updateSettings, resetAll } = g;
  const session = useSession();

  // Vegas color-variant picker: opens when the user clicks the Vegas
  // theme button. Rendered via a portal so it floats above everything.
  const [vegasPickerOpen, setVegasPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const activeVariant: VegasVariant = s.settings.vegasVariant ?? "anthracite";

  // Close picker on Escape.
  useEffect(() => {
    if (!vegasPickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVegasPickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vegasPickerOpen]);

  const vegasKeys = Object.keys(VEGAS_VARIANTS) as VegasVariant[];

  return (
      <aside className="flex flex-col gap-5">
        {s.toast && (
          <div role="status" className="animate-pop fixed right-4 top-4 z-50 rounded-2xl border border-[#e5c779]/60 bg-[#151b15] px-5 py-3 text-sm font-semibold text-[#f5d778] shadow-2xl">
            ★ {s.toast}
          </div>
        )}
        <div className="rounded-3xl border border-[#c8a65b]/30 bg-[#151b15] p-6">
          <p className="text-xs text-white/50">Your chips</p>
          <p className="mt-1 text-3xl font-black text-[#e5c779]">
            ◈ <Counter value={s.balance} />
          </p>
        </div>

        <div className="rounded-3xl border border-[#c8a65b]/20 bg-[#101713] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Your bet</h3>
            <span className="text-lg font-bold text-[#e5c779]">◈ {money(s.bet)}</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CHIPS.map((v) => (
              <button
                key={v}
                onClick={() => addChip(v)}
                disabled={!canBet || (s.bet + v) * spots + sides > s.balance}
                aria-label={`Add ${v} chips`}
                className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-dashed border-white/70 text-sm font-black text-white shadow-lg outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 ${CHIP_BG[v]}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button onClick={() => setBetTo(s.lastBet)} disabled={!canBet} className={small}>Rebet</button>
            <button onClick={() => setBetTo(s.bet * 2)} disabled={!canBet || s.bet === 0} className={small}>×2</button>
            <button onClick={() => setBetTo(0)} disabled={!canBet || s.bet === 0} className={small}>Clear</button>
          </div>
          <div className="mt-4 space-y-2">
            <SideBet
              label="Perfect Pairs" hint="Your first 2 cards pair · up to 25:1" amount={s.ppBet}
              onChange={(d) => adjustSide("ppBet", d)}
              minusDisabled={!canBet || s.ppBet <= 0}
              plusDisabled={!canBet || s.ppBet >= 100 || stake + 10 > s.balance}
            />
            <SideBet
              label="21+3" hint="Your 2 cards + dealer's card · up to 100:1" amount={s.t3Bet}
              onChange={(d) => adjustSide("t3Bet", d)}
              minusDisabled={!canBet || s.t3Bet <= 0}
              plusDisabled={!canBet || s.t3Bet >= 100 || stake + 10 > s.balance}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
          <h3 className="text-lg font-bold">Table rules</h3>
          <div className="mt-3 flex gap-2" role="group" aria-label="Number of decks">
            {[2, 6, 8].map((d) => (
              <button
                key={d}
                onClick={() => updateSettings({ decks: d })}
                disabled={!canBet}
                aria-pressed={s.settings.decks === d}
                className={`flex-1 rounded-full border py-2 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40 ${
                  s.settings.decks === d ? "border-[#d7b45b] bg-[#d7b45b]/10 text-[#e5c779]" : "border-white/10 text-white/60"
                }`}
              >
                {d} decks
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2" role="group" aria-label="Hands per round">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => updateSettings({ spots: n })}
                disabled={!canBet}
                aria-pressed={spots === n}
                className={`flex-1 rounded-full border py-2 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40 ${
                  spots === n ? "border-[#d7b45b] bg-[#d7b45b]/10 text-[#e5c779]" : "border-white/10 text-white/60"
                }`}
              >
                {n} hand{n > 1 ? "s" : ""}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Table theme">
            {(["green", "blue", "burgundy", "vegas"] as Theme[]).map((th) => (
              <button
                key={th}
                onClick={() => {
                  if (th === "vegas") {
                    // Always open the color picker when Vegas is tapped,
                    // and switch the theme in the same gesture so the user
                    // can see the current color behind the overlay.
                    updateSettings({ theme: "vegas" });
                    setVegasPickerOpen(true);
                  } else {
                    updateSettings({ theme: th });
                  }
                }}
                aria-pressed={s.settings.theme === th}
                aria-haspopup={th === "vegas" ? "dialog" : undefined}
                className={`rounded-full border py-2 text-xs capitalize outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] ${
                  s.settings.theme === th ? "border-[#d7b45b] bg-[#d7b45b]/10 text-[#e5c779]" : "border-white/10 text-white/60"
                }`}
              >
                {th === "vegas" ? "✦ Vegas" : th}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <Toggle label="Dealer hits soft 17" checked={s.settings.h17} disabled={!canBet} onChange={(v) => updateSettings({ h17: v })} />
            <Toggle label="Blackjack pays 6 to 5" checked={s.settings.bj65} disabled={!canBet} onChange={(v) => updateSettings({ bj65: v })} />
            <Toggle label="Sound effects" checked={sound.sfx} onChange={(v) => audio.set({ sfx: v })} />
            <Toggle label="Strategy hints" checked={showHint} onChange={setShowHint} />
            <Toggle label="Card counting trainer" checked={showCount} onChange={setShowCount} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
          <h3 className="text-lg font-bold">Session</h3>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Today</p>
  <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs text-white/50">
    <dt>Net</dt>
<dd className={`text-right font-bold ${session.bj.net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
  {session.bj.net >= 0 ? "+" : "−"}◈ {money(Math.abs(session.bj.net))}
</dd>
    <dt>Rounds</dt>
    <dd className="text-right text-white">{money(session.bj.spins)}</dd>
    <dt>Biggest win</dt>
    <dd className="text-right text-white">◈ {money(session.bj.biggest)}</dd>
  </dl>
</div>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-white/50">
            <dt>Rounds played</dt>
<dd className="text-right text-white">{s.stats.played}</dd>
            <dt>Won / lost / push</dt>
            <dd className="text-right text-white">{s.stats.won} / {s.stats.lost} / {s.stats.pushed}</dd>
            <dt>Hand win rate</dt>
<dd className="text-right text-white">{winRate}%</dd>
            <dt>Rounds with blackjack</dt>
<dd className="text-right text-white">{s.stats.blackjacks}</dd>
            <dt>Profit</dt>
            <dd className={`text-right font-bold ${s.stats.profit >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {s.stats.profit >= 0 ? "+" : "−"}{money(Math.abs(s.stats.profit))}
            </dd>
          </dl>

          <div className="mt-4">
            <Spark data={s.trend} />
          </div>
          {s.history.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Recent rounds">
              {s.history.map((r, i) => (
                <span
                  key={i}
                  title={`${r.net > 0 ? "+" : ""}${r.net}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    r.bj ? "bg-[#e5c779] text-black" : r.net > 0 ? "bg-emerald-500/30 text-emerald-200" : r.net < 0 ? "bg-red-500/30 text-red-200" : "bg-white/15 text-white/70"
                  }`}
                >
                  {r.bj ? "BJ" : r.net > 0 ? "W" : r.net < 0 ? "L" : "P"}
                </span>
              ))}
            </div>
          )}

          <button
  type="button"
  onClick={resetAll}
  disabled={!canBet}
  className={`${small} mt-5 w-full`}
>
  Reset wallet & Blackjack stats
</button>

<p className="mt-2 text-center text-[10px] leading-4 text-white/35">
  Shared wallet reset. Today, achievements and records are kept.
  Confirmation required.
</p>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/[0.07] bg-[#101713] p-5">
  <h3 className="text-lg font-bold">
    Fairness check
  </h3>

  <p className="mt-2 text-xs leading-5 text-white/45">
    Observed results in your saved Blackjack statistics.
    Small samples can vary considerably.
  </p>

  <dl className="mt-4 divide-y divide-white/[0.07]">
    <div className="pb-3">
      <dt className="text-xs leading-5 text-white/55">
        Rounds played
      </dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-white">
        {money(s.stats.played)}
      </dd>
    </div>

    <div className="py-3">
      <dt className="text-xs leading-5 text-white/55">
        Dealer blackjacks
      </dt>

      <dd className="mt-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold tabular-nums text-white">
            {rate(s.stats.dealerBJs, s.stats.played)}
          </span>

          <span className="text-[11px] leading-4 text-white/40">
            Reference ≈ 4.8%
          </span>
        </div>

        <div className="mt-1 text-[11px] leading-4">
          {verdict(
            s.stats.dealerBJs,
            s.stats.played,
            0.0475
          )}
        </div>
      </dd>
    </div>

    <div className="py-3">
      <dt className="text-xs leading-5 text-white/55">
        Rounds with your blackjack
      </dt>

      <dd className="mt-1 text-sm font-semibold tabular-nums text-white">
        {rate(s.stats.blackjacks, s.stats.played)}
      </dd>

      <dd className="mt-1 text-[11px] leading-4 text-white/40">
        Counts rounds with at least one blackjack.
        No single-hand reference is applied to mixed
        one-, two- and three-hand sessions.
      </dd>
    </div>

    <div className="py-3">
      <dt className="text-xs leading-5 text-white/55">
        Dealer busts when playing
      </dt>

      <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-semibold tabular-nums text-white">
          {rate(s.stats.dealerBusts, s.stats.dealerPlayed)}
        </span>

        <span className="text-[11px] leading-4 text-white/40">
          Reference 28–32%
        </span>
      </dd>
    </div>

    <div className="pt-3">
      <dt className="text-xs leading-5 text-white/55">
        Your resolved hands
      </dt>

      <dd className="mt-2 grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-lg bg-white/[0.04] px-1 py-2 text-center">
          <p className="text-[10px] text-white/45">
            Won
          </p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-emerald-300">
            {rate(
              s.stats.won,
              s.stats.won + s.stats.lost + s.stats.pushed
            )}
          </p>
        </div>

        <div className="min-w-0 rounded-lg bg-white/[0.04] px-1 py-2 text-center">
          <p className="text-[10px] text-white/45">
            Lost
          </p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-red-300">
            {rate(
              s.stats.lost,
              s.stats.won + s.stats.lost + s.stats.pushed
            )}
          </p>
        </div>

        <div className="min-w-0 rounded-lg bg-white/[0.04] px-1 py-2 text-center">
          <p className="text-[10px] text-white/45">
            Push
          </p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-white/80">
            {rate(
              s.stats.pushed,
              s.stats.won + s.stats.lost + s.stats.pushed
            )}
          </p>
        </div>
      </dd>
    </div>
  </dl>

  <p className="mt-4 border-t border-white/[0.07] pt-3 text-[11px] leading-5 text-white/40">
    Reference figures are indicative, not a guarantee
    or proof of fairness. Results depend on the rules,
    decisions and sample size.
  </p>
</div>

        <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
          <h3 className="text-lg font-bold">Coach</h3>
          <p className="mt-1 text-xs text-white/40">Each decision is graded against basic strategy.</p>
          <p className="mt-3 text-2xl font-black text-[#e5c779]">
            {s.stats.decisions ? Math.round((s.stats.correct / s.stats.decisions) * 100) : 0}%
          </p>
          <p className="text-[11px] text-white/40">{s.stats.correct} / {s.stats.decisions} correct decisions</p>
          <p className="mt-3 min-h-8 text-xs text-white/70" aria-live="polite">{s.coach ?? "Make a move to get feedback."}</p>
        </div>

        {showCount && (
          <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
            <h3 className="text-lg font-bold">Hi-Lo count</h3>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-white/50">
              <dt>Running count</dt>
              <dd className="text-right font-bold text-[#e5c779]">{running > 0 ? "+" : ""}{running}</dd>
              <dt>True count</dt>
              <dd className="text-right font-bold text-[#e5c779]">{trueCount > 0 ? "+" : ""}{trueCount.toFixed(1)}</dd>
              <dt>Decks left</dt>
              <dd className="text-right text-white">{decksLeft.toFixed(1)}</dd>
            </dl>
            <p className="mt-3 text-[11px] leading-4 text-white/35">
              2–6 count +1 · 7–9 count 0 · 10–A count −1. A high positive count means the shoe is rich in tens and aces.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
          <h3 className="text-lg font-bold">Records</h3>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-white/50">
            <dt>Biggest win</dt><dd className="text-right text-white">◈ {money(s.records.biggestWin)}</dd>
            <dt>Best win streak</dt><dd className="text-right text-white">{s.records.bestStreak}</dd>
            <dt>Peak balance</dt><dd className="text-right text-white">◈ {money(s.records.peakBalance)}</dd>
          </dl>
          <ul className="mt-4 space-y-1.5 text-xs">
            {ACHIEVEMENTS.map((a) => {
              const done = s.unlocked.includes(a.id);
              return (
                <li key={a.id} className={done ? "text-[#e5c779]" : "text-white/30"}>
                  {done ? "★" : "☆"} {a.title} <span className="text-white/30">· {a.desc}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="px-3 text-center text-[11px] leading-5 text-white/25">
          Virtual chips only. No real money, deposits or cash-outs.
        </p>

        {mounted && vegasPickerOpen && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-vegas-fade"
            role="dialog"
            aria-modal="true"
            aria-label="Choose a Vegas color"
          >
            {/* backdrop */}
            <button
              type="button"
              aria-label="Close color picker"
              onClick={() => setVegasPickerOpen(false)}
              className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            />

            {/* dialog card */}
            <div
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-vegas-pop"
              style={{
                backgroundImage:
                  "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.14) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 60%, #070504 100%)",
              }}
            >
              {/* gold hairline frame */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
              />

              {/* top ornament */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#d7b45b]">✦</span>
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-[#e5c779]">
                    Vegas · Color
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVegasPickerOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/60 outline-none transition hover:border-[#d7b45b]/50 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
                >
                  ×
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-white/45">
                Pick one of six smoked, low-light felts. Changes apply to the table instantly.
              </p>

              {/* gold divider */}
              <div
                aria-hidden
                className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[#d7b45b]/40 to-transparent"
              />

              {/* swatches */}
              <div
                className="mt-5 grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label="Vegas color variants"
              >
                {vegasKeys.map((k) => {
                  const v = VEGAS_VARIANTS[k];
                  const active = activeVariant === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        updateSettings({ theme: "vegas", vegasVariant: k });
                        setVegasPickerOpen(false);
                      }}
                      className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-3 text-left outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#e5c779] ${
                        active
                          ? "border-[#e5c779] shadow-[0_0_0_1px_rgba(215,180,91,0.35),0_18px_40px_rgba(0,0,0,0.6)]"
                          : "border-white/10 hover:border-[#d7b45b]/40"
                      }`}
                    >
                      {/* swatch disk */}
                      <div className="relative h-14 w-full overflow-hidden rounded-xl ring-1 ring-black/60">
                        <div
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(ellipse at center, ${v.swatch} 0%, ${v.swatch}CC 55%, #000 100%)`,
                          }}
                        />
                        {/* subtle gold sheen */}
                        <div
                          aria-hidden
                          className="absolute inset-0 opacity-40 mix-blend-overlay"
                          style={{
                            background:
                              "linear-gradient(130deg, rgba(229,199,121,0.0) 20%, rgba(229,199,121,0.35) 50%, rgba(229,199,121,0.0) 80%)",
                          }}
                        />
                        {/* active check */}
                        {active && (
                          <span
                            aria-hidden
                            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-[#e5c779] bg-black/70 text-[10px] font-black text-[#e5c779]"
                          >
                            ✓
                          </span>
                        )}
                      </div>

                      {/* label row */}
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={`text-xs font-semibold tracking-wide ${
                            active ? "text-[#e5c779]" : "text-white/80 group-hover:text-white"
                          }`}
                        >
                          {v.label}
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-white/35">
                          {v.swatch.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* footer */}
              <div
                aria-hidden
                className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#d7b45b]/25 to-transparent"
              />
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-white/35">
                Royal Ace · Vegas Edition
              </p>
            </div>
          </div>,
          document.body
        )}
      </aside>
  );
}