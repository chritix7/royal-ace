"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Theme, VegasVariant } from "../lib/game";
import { THEME_LABELS, THEME_SWATCHES, VEGAS_VARIANTS, money } from "../lib/game";
import { Counter, Spark, Toggle, SideBet } from "./ui";
import ChipRail from "./ChipRail";
import { CountGauge, DeckMeter } from "./CountGauge";
import { FairnessBar, StackedBar } from "./FairnessBar";
import MiniSpark from "./MiniSpark";
import {
  Panel,
  PanelHeader,
  eyebrow,
  hairline,
  btnGhost,
  btnPill,
} from "./SidebarKit";
import SectionModal from "./SectionModal";
import SideBetModal from "./SideBetModal";
import TableThemePicker from "./TableThemePicker";
import { useSideBetHeat } from "../hooks/useSideBetHeat";
import { ACHIEVEMENTS } from "../lib/achievements";
import { audio, useAudioSettings } from "../lib/audio";
import type { Game } from "../lib/useBlackjack";
import { useSession } from "../lib/sessionStore";

/** Keyboard-cap pill used by the shortcuts cheat sheet. */
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.4rem] items-center justify-center rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#e5c779] shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]">
      {children}
    </kbd>
  );
}

/** Pourcentage lisible. */
const rate = (hits: number, n: number) => (n > 0 ? `${((100 * hits) / n).toFixed(1)}%` : "–");
/** Numeric rate (0..100) for feeding the gauges. */
const rateNum = (hits: number, n: number) => (n > 0 ? (100 * hits) / n : 0);
/** Classify observed-vs-reference as neutral (too little data), normal
 *  (within 3σ of a point reference, or inside a range), or unusual. */
const classifyPoint = (hits: number, n: number, p: number) => {
  if (n < 100) return "neutral" as const;
  const normal = Math.abs(hits / n - p) <= 3 * Math.sqrt((p * (1 - p)) / n);
  return normal ? ("normal" as const) : ("unusual" as const);
};
const classifyRange = (hits: number, n: number, lo: number, hi: number) => {
  if (n < 100) return "neutral" as const;
  const r = hits / n;
  return r >= lo && r <= hi ? ("normal" as const) : ("unusual" as const);
};
/** Vrai si le résultat reste dans ce que le hasard donne normalement (3 écarts-types). */
const verdict = (hits: number, n: number, p: number) => {
  if (n < 100) return <span className="text-white/30">· play more</span>;
  const normal = Math.abs(hits / n - p) <= 3 * Math.sqrt((p * (1 - p)) / n);
  return normal ? <span className="text-emerald-300">· normal</span> : <span className="text-amber-300">· unusual</span>;
};

type SidebarTab = "session" | "stats" | "coach" | "count" | "records";

export default function Sidebar({ g }: { g: Game }) {
  const sound = useAudioSettings();
  const { s, showHint, setShowHint, showCount, setShowCount, canBet, winRate, spots, sides, stake, running, trueCount, decksLeft, addChip, setBetTo, adjustSide, updateSettings, resetAll } = g;
  const session = useSession();

  // Vegas color-variant picker: opens when the user clicks the Vegas
  // theme button. Rendered via a portal so it floats above everything.
  const [vegasPickerOpen, setVegasPickerOpen] = useState(false);
  // Session recap modal: intercepts the reset button so the player sees
  // what they did before the slate is wiped.
  const [recapOpen, setRecapOpen] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [mounted, setMounted] = useState(false);
  // Which info-section modal is open, or null when nothing is open.
  // The sidebar block just shows four buttons now — each opens a
  // centered SectionModal with that section's content so the sidebar
  // itself never has to scroll past them.
  const [openSection, setOpenSection] = useState<SidebarTab | null>(null);
  // Which side-bet staking modal is open (Perfect Pairs / 21+3 / none).
  const [openSideBet, setOpenSideBet] = useState<"pp" | "t3" | null>(null);
  // Hot / cold state per side bet, computed from session history.
  const heat = useSideBetHeat(g);
  useEffect(() => setMounted(true), []);
  // If the count trainer gets turned off while its modal is open,
  // close the modal so we don't dangle on a non-visible section.
  useEffect(() => {
    if (openSection === "count" && !showCount) setOpenSection(null);
  }, [openSection, showCount]);
  const activeVariant: VegasVariant = s.settings.vegasVariant ?? "anthracite";

  // Close whichever modal is open on Escape.
  useEffect(() => {
    if (!vegasPickerOpen && !recapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setVegasPickerOpen(false);
      setRecapOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vegasPickerOpen, recapOpen]);

  const vegasKeys = Object.keys(VEGAS_VARIANTS) as VegasVariant[];

  // Derived recap figures.
  const resolved = s.stats.won + s.stats.lost + s.stats.pushed;
  const winRateNum = resolved > 0 ? Math.round((100 * s.stats.won) / resolved) : 0;
  const coachPct = s.stats.decisions > 0
    ? Math.round((100 * s.stats.correct) / s.stats.decisions)
    : 0;

  const buildShareText = () => {
    const sign = s.stats.profit >= 0 ? "+" : "−";
    const abs = Math.abs(s.stats.profit);
    const lines = [
      "♠ Royal Ace · Session summary",
      `Net: ${sign}◈ ${money(abs)} · ${s.stats.played} rounds`,
      `W / L / P: ${s.stats.won} / ${s.stats.lost} / ${s.stats.pushed} (${winRateNum}% win)`,
      `Biggest win: ◈ ${money(s.records.biggestWin)} · ${s.stats.blackjacks} blackjack${s.stats.blackjacks === 1 ? "" : "s"}`,
      `Best streak: ${s.records.bestStreak} · Coach ${coachPct}%`,
    ];
    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Royal Ace · Session", text });
      } else if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(text);
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 1800);
      }
    } catch {
      /* share cancelled or clipboard denied — silent */
    }
  };

  const handleConfirmReset = () => {
    setRecapOpen(false);
    resetAll();
  };

  return (
      <aside className="flex flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin] lg:[scrollbar-color:#d7b45b40_transparent]">
        {/* MASTER PANEL — balance, bet, side bets. One container so the
            player sees chips → bet → sides as a single instrument. */}
        <Panel>
          {/* Two compact rows: each has an uppercase gold label and an
              inline amount, so Chips and Bet each occupy a single text
              line and the whole header is two lines tall, not four. */}
          <div className="flex items-baseline justify-between gap-3">
            <p className={eyebrow}>Your chips</p>
            <p className="text-base font-black text-[#e5c779] tabular-nums leading-none">
              ◈ <Counter value={s.balance} />
            </p>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className={eyebrow}>Bet</p>
            <p className="text-base font-black text-[#f5d778] tabular-nums leading-none">
              ◈ {money(s.bet)}
            </p>
          </div>

          <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-[#d7b45b]/15 to-transparent" />

          {/* Scrollable chip ladder — 3 denominations visible at a
              time, ◂ / ▸ arrows slide the window through the whole
              10 → 50,000 range without overflowing the sidebar. */}
          <ChipRail
            visibleCount={3}
            size="md"
            onPick={(v) => addChip(v)}
            disabledFor={(v) =>
              !canBet || (s.bet + v) * spots + sides > s.balance
            }
          />

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setBetTo(s.lastBet)}
              disabled={!canBet}
              className={btnPill}
            >
              Rebet
            </button>
            <button
              onClick={() => setBetTo(s.bet * 2)}
              disabled={!canBet || s.bet === 0}
              className={btnPill}
            >
              ×2
            </button>
            <button
              onClick={() => setBetTo(0)}
              disabled={!canBet || s.bet === 0}
              className={btnPill}
            >
              Clear
            </button>
          </div>

          <div className="mt-3 space-y-1.5">
            <SideBet
              label="Perfect Pairs"
              hint="Your first 2 cards pair · up to 25:1"
              amount={s.ppBet}
              disabled={!canBet}
              onOpen={() => setOpenSideBet("pp")}
              heat={heat.pp.state}
            />
            <SideBet
              label="21+3"
              hint="Your 2 cards + dealer's card · up to 100:1"
              amount={s.t3Bet}
              disabled={!canBet}
              onOpen={() => setOpenSideBet("t3")}
              heat={heat.t3.state}
            />
          </div>
          <div className="mt-4">
            <TableThemePicker />
          </div>
        </Panel>

        {/* TABLE RULES — collapsed by default: set once, changed rarely. */}
        <Panel padded={false}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-3xl px-4 py-3 outline-none transition hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-[#e5c779]">
              <div>
                <p className={eyebrow}>Configure</p>
                <h3 className="text-sm font-black tracking-wide text-white">
                  Table rules
                </h3>
              </div>
              <span className="flex items-center gap-2 text-[11px]">
                <span className="rounded-full border border-[#d7b45b]/30 bg-gradient-to-b from-[#d7b45b]/[0.08] to-transparent px-2 py-0.5 font-black uppercase tracking-wider text-[#e5c779] shadow-[inset_0_1px_0_rgba(229,199,121,0.12)]">
                  {s.settings.decks}D · {spots}H
                </span>
                <span
                  aria-hidden
                  className="text-[#d7b45b]/60 transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </span>
            </summary>
            <div className="border-t border-[#d7b45b]/10 px-5 py-4">
          <div>
            <p className={`${eyebrow} mb-1.5`}>Decks</p>
            <div className="flex gap-1.5" role="group" aria-label="Number of decks">
              {[2, 6, 8].map((d) => (
                <button
                  key={d}
                  onClick={() => updateSettings({ decks: d })}
                  disabled={!canBet}
                  aria-pressed={s.settings.decks === d}
                  className={`flex-1 rounded-full border py-1.5 text-[11px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40 ${
                    s.settings.decks === d
                      ? "border-[#d7b45b]/70 bg-[#d7b45b]/15 text-[#f5d778] shadow-[inset_0_1px_0_rgba(229,199,121,0.2)]"
                      : "border-white/10 bg-white/[0.02] text-white/55 hover:border-[#d7b45b]/40 hover:text-white/85"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <p className={`${eyebrow} mb-1.5`}>Hands per round</p>
            <div className="flex gap-1.5" role="group" aria-label="Hands per round">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => updateSettings({ spots: n })}
                  disabled={!canBet}
                  aria-pressed={spots === n}
                  className={`flex-1 rounded-full border py-1.5 text-[11px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40 ${
                    spots === n
                      ? "border-[#d7b45b]/70 bg-[#d7b45b]/15 text-[#f5d778] shadow-[inset_0_1px_0_rgba(229,199,121,0.2)]"
                      : "border-white/10 bg-white/[0.02] text-white/55 hover:border-[#d7b45b]/40 hover:text-white/85"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <p className={`${eyebrow} mb-1.5`}>Felt</p>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Table theme">
            {(["green", "blue", "burgundy", "vegas"] as Theme[]).map((th) => {
              const active = s.settings.theme === th;
              // Vegas swatch mirrors the active variant so the preview is
              // always in sync with the current felt.
              const swatchColor =
                th === "vegas"
                  ? VEGAS_VARIANTS[activeVariant].swatch
                  : THEME_SWATCHES[th];
              return (
                <button
                  key={th}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-haspopup={th === "vegas" ? "dialog" : undefined}
                  onClick={() => {
                    if (th === "vegas") {
                      updateSettings({ theme: "vegas" });
                      setVegasPickerOpen(true);
                    } else {
                      updateSettings({ theme: th });
                    }
                  }}
                  className={`group relative flex items-center gap-2.5 overflow-hidden rounded-2xl border p-2 pr-3 text-left outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#e5c779] ${
                    active
                      ? "border-[#e5c779] shadow-[0_0_0_1px_rgba(215,180,91,0.3),0_12px_28px_rgba(0,0,0,0.5)]"
                      : "border-white/10 hover:border-[#d7b45b]/40"
                  }`}
                >
                  {/* swatch disk */}
                  <span
                    aria-hidden
                    className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/70"
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(ellipse at center, ${swatchColor} 0%, ${swatchColor}CC 55%, #000 100%)`,
                      }}
                    />
                    {/* gold sheen */}
                    <span
                      className="absolute inset-0 opacity-40 mix-blend-overlay"
                      style={{
                        background:
                          "linear-gradient(130deg, rgba(229,199,121,0) 20%, rgba(229,199,121,0.35) 50%, rgba(229,199,121,0) 80%)",
                      }}
                    />
                  </span>
                  {/* label + chevron on vegas */}
                  <span className="flex min-w-0 flex-1 items-center justify-between">
                    <span
                      className={`truncate text-[11px] font-semibold tracking-wide ${
                        active ? "text-[#e5c779]" : "text-white/75 group-hover:text-white"
                      }`}
                    >
                      {th === "vegas" ? "✦ " + THEME_LABELS[th] : THEME_LABELS[th]}
                    </span>
                    {th === "vegas" && (
                      <span
                        aria-hidden
                        className={`ml-1 text-[10px] ${active ? "text-[#e5c779]" : "text-white/40 group-hover:text-white/70"}`}
                      >
                        ▸
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
          <div className="mt-4">
            <p className={`${eyebrow} mb-2`}>Options</p>
            <div className="space-y-2.5 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
              <Toggle label="Dealer hits soft 17" checked={s.settings.h17} disabled={!canBet} onChange={(v) => updateSettings({ h17: v })} />
              <Toggle label="Blackjack pays 6 to 5" checked={s.settings.bj65} disabled={!canBet} onChange={(v) => updateSettings({ bj65: v })} />
              <Toggle label="Sound effects" checked={sound.sfx} onChange={(v) => audio.set({ sfx: v })} />
              <Toggle label="Strategy hints" checked={showHint} onChange={setShowHint} />
              <Toggle label="Card counting trainer" checked={showCount} onChange={setShowCount} />
            </div>
          </div>

          {/* Keyboard shortcuts cheat sheet — collapsed by default so it
              stays out of the way, visible to anyone who wants it. */}
          <details className="group mt-4 rounded-2xl border border-white/[0.07] bg-black/20">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 outline-none transition hover:text-white/80 focus-visible:ring-2 focus-visible:ring-[#e5c779]">
              <span className="flex items-center gap-2">
                <span aria-hidden className="text-[#d7b45b]">⌨</span>
                Keyboard shortcuts
              </span>
              <span
                aria-hidden
                className="text-white/40 transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="border-t border-white/[0.06] px-3 py-3">
              <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-[11px] text-white/70">
                <dt><Kbd>H</Kbd></dt><dd>Hit</dd>
                <dt><Kbd>S</Kbd></dt><dd>Stand</dd>
                <dt><Kbd>D</Kbd></dt><dd>Double</dd>
                <dt><Kbd>P</Kbd></dt><dd>Split</dd>
                <dt><Kbd>R</Kbd></dt><dd>Surrender</dd>
                <dt><Kbd>Space</Kbd></dt><dd>Deal / Deal again</dd>
                <dt className="flex gap-1">
                  <Kbd>1</Kbd><Kbd>…</Kbd><Kbd>5</Kbd>
                </dt>
                <dd>Add a chip (10 / 20 / 50 / 100 / 500)</dd>
                <dt><Kbd>Esc</Kbd></dt><dd>Close an open popup</dd>
              </dl>
            </div>
          </details>
            </div>
          </details>
        </Panel>

        {/* EXPLORE — compact button grid; clicking a button opens a
            centered SectionModal instead of showing the content
            inline, so the sidebar never scrolls past these panels. */}
        <Panel>
          <p className={eyebrow}>Explore</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { id: "session", label: "Session", glyph: "◈" },
                { id: "stats", label: "Stats", glyph: "⌾" },
                { id: "coach", label: "Coach", glyph: "✦" },
                ...(showCount
                  ? ([{ id: "count", label: "Count", glyph: "+/−" }] as const)
                  : []),
                { id: "records", label: "Records", glyph: "★" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setOpenSection(t.id)}
                aria-haspopup="dialog"
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl border border-[#d7b45b]/20 bg-gradient-to-b from-[#1a2219] to-[#0c110e] px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(229,199,121,0.08),0_2px_0_rgba(0,0,0,0.5)] outline-none transition-[transform,border-color,background] hover:-translate-y-0.5 hover:border-[#d7b45b]/70 hover:from-[#1f2820] hover:to-[#101713] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
              >
                {/* sheen that runs on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#e5c779]/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <span
                  aria-hidden
                  className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-[#1a1612]"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 35%, #f6e4a9 0%, #d7b45b 55%, #8a6c2b 100%)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 6px rgba(229,199,121,0.35)",
                  }}
                >
                  {t.glyph}
                </span>
                <span className="relative text-[12px] font-black uppercase tracking-wider text-white/85 group-hover:text-[#f5d778]">
                  {t.label}
                </span>
                <span
                  aria-hidden
                  className="relative ml-auto text-[10px] text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-[#e5c779]"
                >
                  ▸
                </span>
              </button>
            ))}
          </div>
        </Panel>

        {/* ─── Section modals — one per button above ─── */}

        <SectionModal
          open={openSection === "session"}
          onClose={() => setOpenSection(null)}
          eyebrow="Blackjack"
          title="Session"
          maxWidth="md"
        >
          <h3 className="sr-only">Session</h3>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                Today
              </p>
              <p
                className={`text-xs font-bold tabular-nums ${
                  session.bj.net >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {session.bj.net >= 0 ? "+" : "−"}◈{" "}
                {money(Math.abs(session.bj.net))}
              </p>
            </div>
            {/* Today's trend: the tail of s.trend covering today's rounds. */}
            <MiniSpark
              data={s.trend.slice(
                -Math.min(
                  Math.max(session.bj.spins + 1, 2),
                  s.trend.length,
                ),
              )}
            />
            <dl className="mt-2 grid grid-cols-2 gap-y-1 text-[11px] text-white/50">
              <dt>Rounds</dt>
              <dd className="text-right tabular-nums text-white">
                {money(session.bj.spins)}
              </dd>
              <dt>Biggest win</dt>
              <dd className="text-right tabular-nums text-white">
                ◈ {money(session.bj.biggest)}
              </dd>
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
  onClick={() => {
    setShareState("idle");
    setRecapOpen(true);
  }}
  disabled={!canBet}
  aria-haspopup="dialog"
  className={`${btnGhost} mt-5 w-full`}
>
  Reset wallet & Blackjack stats
</button>

<p className="mt-2 text-center text-[10px] leading-4 text-white/35">
  Shared wallet reset. Today, achievements and records are kept.
  Confirmation required.
</p>
        </SectionModal>

        <SectionModal
          open={openSection === "stats"}
          onClose={() => setOpenSection(null)}
          eyebrow="Fairness"
          title="Stats"
          maxWidth="md"
        >
          <h3 className="sr-only">Fairness check</h3>

          <p className="text-xs leading-5 text-white/45">
            Observed results in your saved Blackjack statistics. Small samples
            can vary considerably.
          </p>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs leading-5 text-white/55">Rounds played</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-white">
                {money(s.stats.played)}
              </dd>
            </div>

            <div>
              <dt className="text-xs leading-5 text-white/55">
                Dealer blackjacks
              </dt>
              <dd className="mt-2">
                <FairnessBar
                  observed={rateNum(s.stats.dealerBJs, s.stats.played)}
                  reference={4.75}
                  referenceLabel="4.8%"
                  max={10}
                  tone={classifyPoint(
                    s.stats.dealerBJs,
                    s.stats.played,
                    0.0475,
                  )}
                />
                <div className="mt-1 text-[11px] leading-4">
                  {verdict(s.stats.dealerBJs, s.stats.played, 0.0475)}
                </div>
              </dd>
            </div>

            <div>
              <dt className="text-xs leading-5 text-white/55">
                Rounds with your blackjack
              </dt>
              <dd className="mt-2">
                <FairnessBar
                  observed={rateNum(s.stats.blackjacks, s.stats.played)}
                  reference={4.75}
                  referenceLabel="≈ 4.8%"
                  max={10}
                  tone="neutral"
                />
              </dd>
              <dd className="mt-1 text-[11px] leading-4 text-white/40">
                Counts rounds with at least one blackjack. No single-hand
                reference is applied to mixed one-, two- and three-hand
                sessions.
              </dd>
            </div>

            <div>
              <dt className="text-xs leading-5 text-white/55">
                Dealer busts when playing
              </dt>
              <dd className="mt-2">
                <FairnessBar
                  observed={rateNum(s.stats.dealerBusts, s.stats.dealerPlayed)}
                  reference={[28, 32]}
                  referenceLabel="28–32%"
                  max={60}
                  tone={classifyRange(
                    s.stats.dealerBusts,
                    s.stats.dealerPlayed,
                    0.28,
                    0.32,
                  )}
                />
              </dd>
            </div>

            <div>
              <dt className="text-xs leading-5 text-white/55">
                Your resolved hands
              </dt>
              <dd className="mt-2">
                <StackedBar
                  parts={[
                    {
                      label: "Won",
                      value: s.stats.won,
                      color: "#5ad48c",
                    },
                    {
                      label: "Push",
                      value: s.stats.pushed,
                      color: "#c6c7cf",
                    },
                    {
                      label: "Lost",
                      value: s.stats.lost,
                      color: "#f87171",
                    },
                  ]}
                />
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div>
                    <p className="text-emerald-300 font-semibold tabular-nums">
                      {rate(
                        s.stats.won,
                        s.stats.won + s.stats.lost + s.stats.pushed,
                      )}
                    </p>
                    <p className="text-white/45">Won</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums text-white/85">
                      {rate(
                        s.stats.pushed,
                        s.stats.won + s.stats.lost + s.stats.pushed,
                      )}
                    </p>
                    <p className="text-white/45">Push</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums text-red-300">
                      {rate(
                        s.stats.lost,
                        s.stats.won + s.stats.lost + s.stats.pushed,
                      )}
                    </p>
                    <p className="text-white/45">Lost</p>
                  </div>
                </div>
              </dd>
            </div>
          </dl>

          <p className="mt-4 border-t border-white/[0.07] pt-3 text-[11px] leading-5 text-white/40">
            Reference figures are indicative, not a guarantee or proof of
            fairness. Results depend on the rules, decisions and sample size.
          </p>
        </SectionModal>

        <SectionModal
          open={openSection === "coach"}
          onClose={() => setOpenSection(null)}
          eyebrow="Basic strategy"
          title="Coach"
          maxWidth="md"
        >
          <h3 className="sr-only">Coach</h3>
          <p className="text-xs text-white/40">Each decision is graded against basic strategy.</p>
          <p className="mt-3 text-2xl font-black text-[#e5c779]">
            {s.stats.decisions ? Math.round((s.stats.correct / s.stats.decisions) * 100) : 0}%
          </p>
          <p className="text-[11px] text-white/40">{s.stats.correct} / {s.stats.decisions} correct decisions</p>
          <p className="mt-3 min-h-8 text-xs text-white/70" aria-live="polite">{s.coach ?? "Make a move to get feedback."}</p>
        </SectionModal>

        {showCount && (
          <SectionModal
            open={openSection === "count"}
            onClose={() => setOpenSection(null)}
            eyebrow="Trainer"
            title="Hi-Lo count"
            maxWidth="md"
          >
            <h3 className="sr-only">Hi-Lo count</h3>
            <div className="space-y-3">
              {/* Running count: scale with total decks, since the max
                  swing scales with cards still in the shoe. */}
              <CountGauge
                label="Running count"
                value={running}
                max={Math.max(10, s.settings.decks * 5)}
                digits={0}
              />
              {/* True count typically ranges between −5 and +5 in play. */}
              <CountGauge label="True count" value={trueCount} max={5} />
              <DeckMeter decksLeft={decksLeft} totalDecks={s.settings.decks} />
            </div>
            <p className="mt-4 text-[11px] leading-4 text-white/35">
              2–6 count +1 · 7–9 count 0 · 10–A count −1. A high positive count means the shoe is rich in tens and aces.
            </p>
          </SectionModal>
        )}

        <SectionModal
          open={openSection === "records"}
          onClose={() => setOpenSection(null)}
          eyebrow="Archives"
          title="Records"
          maxWidth="md"
        >
          <h3 className="sr-only">Records</h3>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-white/50">
            <dt>Biggest win</dt><dd className="text-right text-white">◈ {money(s.records.biggestWin)}</dd>
            <dt>Best win streak</dt><dd className="text-right text-white">{s.records.bestStreak}</dd>
            <dt>Peak balance</dt><dd className="text-right text-white">◈ {money(s.records.peakBalance)}</dd>
          </dl>
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              Achievements · {s.unlocked.length}/{ACHIEVEMENTS.length}
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const done = s.unlocked.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={`relative overflow-hidden rounded-xl border p-2 transition ${
                      done
                        ? "border-[#e5c779]/60 bg-[#e5c779]/[0.06]"
                        : "border-white/[0.06] bg-black/20"
                    }`}
                    style={
                      done
                        ? {
                            boxShadow:
                              "0 0 14px rgba(229,199,121,0.18), inset 0 1px 0 rgba(229,199,121,0.15)",
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className={`relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black leading-none ${
                          done ? "text-[#1a1612]" : "text-white/30"
                        }`}
                        style={
                          done
                            ? {
                                background:
                                  "radial-gradient(circle at 50% 35%, #f6e4a9 0%, #d7b45b 55%, #8a6c2b 100%)",
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 8px rgba(229,199,121,0.4)",
                              }
                            : {
                                background: "rgba(255,255,255,0.05)",
                                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                              }
                        }
                      >
                        ★
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[11px] font-bold ${
                            done ? "text-[#f5d778]" : "text-white/55"
                          }`}
                        >
                          {a.title}
                        </p>
                        <p
                          className={`mt-0.5 text-[10px] leading-3 ${
                            done ? "text-white/60" : "text-white/30"
                          }`}
                        >
                          {a.desc}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </SectionModal>

        {mounted && recapOpen && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-vegas-fade"
            role="dialog"
            aria-modal="true"
            aria-label="Session summary before reset"
          >
            {/* backdrop */}
            <button
              type="button"
              aria-label="Close session summary"
              onClick={() => setRecapOpen(false)}
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

              {/* header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#d7b45b]">♠</span>
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-[#e5c779]">
                    Session · Summary
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRecapOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/60 outline-none transition hover:border-[#d7b45b]/50 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
                >
                  ×
                </button>
              </div>

              {/* big net */}
              <div className="mt-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  Net profit
                </p>
                <p
                  className={`mt-1 font-black tabular-nums text-4xl ${
                    s.stats.profit > 0
                      ? "text-[#f5d778]"
                      : s.stats.profit < 0
                        ? "text-red-300"
                        : "text-white/70"
                  }`}
                >
                  {s.stats.profit >= 0 ? "+" : "−"}◈ {money(Math.abs(s.stats.profit))}
                </p>
                <p className="mt-1 text-[11px] text-white/40">
                  across {s.stats.played} round{s.stats.played === 1 ? "" : "s"}
                </p>
              </div>

              {/* gold divider */}
              <div
                aria-hidden
                className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#d7b45b]/40 to-transparent"
              />

              {/* stat grid */}
              <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-xs">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/40">
                    Win rate
                  </dt>
                  <dd className="mt-0.5 font-bold tabular-nums text-white">
                    {winRateNum}%
                    <span className="ml-1.5 text-[10px] font-normal text-white/40">
                      {s.stats.won} / {s.stats.lost} / {s.stats.pushed}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/40">
                    Biggest win
                  </dt>
                  <dd className="mt-0.5 font-bold tabular-nums text-white">
                    ◈ {money(s.records.biggestWin)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/40">
                    Blackjacks
                  </dt>
                  <dd className="mt-0.5 font-bold tabular-nums text-white">
                    {s.stats.blackjacks}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/40">
                    Best streak
                  </dt>
                  <dd className="mt-0.5 font-bold tabular-nums text-white">
                    {s.records.bestStreak}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/40">
                    Peak balance
                  </dt>
                  <dd className="mt-0.5 font-bold tabular-nums text-white">
                    ◈ {money(s.records.peakBalance)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-white/40">
                    Coach
                  </dt>
                  <dd className="mt-0.5 font-bold tabular-nums text-white">
                    {coachPct}%
                    <span className="ml-1.5 text-[10px] font-normal text-white/40">
                      {s.stats.correct} / {s.stats.decisions}
                    </span>
                  </dd>
                </div>
              </dl>

              {/* gold divider */}
              <div
                aria-hidden
                className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#d7b45b]/25 to-transparent"
              />

              {/* actions */}
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 outline-none transition hover:border-[#d7b45b]/40 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e5c779]"
                >
                  {shareState === "copied" ? "✓ Copied" : "Share"}
                </button>
                <button
                  type="button"
                  onClick={() => setRecapOpen(false)}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 outline-none transition hover:border-white/30 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-[#e5c779]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200 outline-none transition hover:border-red-400/60 hover:bg-red-500/25 hover:text-red-100 focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Reset
                </button>
              </div>

              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-white/35">
                Shared wallet · Today & records kept
              </p>
            </div>
          </div>,
          document.body
        )}

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

        {/* Side-bet chip-picker modals — one at a time. Portaled through
            createPortal inside SideBetModal, so position-wise the mount
            point here just controls lifecycle. */}
        <SideBetModal
          open={openSideBet === "pp"}
          onClose={() => setOpenSideBet(null)}
          label="Perfect Pairs"
          hint="Your first 2 cards pair · up to 25:1"
          amount={s.ppBet}
          canBet={canBet}
          remainingBalance={s.balance - (s.bet * spots + s.t3Bet)}
          onAdd={(chip) => adjustSide("ppBet", chip)}
          onClear={() => adjustSide("ppBet", -s.ppBet)}
        />
        <SideBetModal
          open={openSideBet === "t3"}
          onClose={() => setOpenSideBet(null)}
          label="21+3"
          hint="Your 2 cards + dealer's card · up to 100:1"
          amount={s.t3Bet}
          canBet={canBet}
          remainingBalance={s.balance - (s.bet * spots + s.ppBet)}
          onAdd={(chip) => adjustSide("t3Bet", chip)}
          onClear={() => adjustSide("t3Bet", -s.t3Bet)}
        />
      </aside>
  );
}