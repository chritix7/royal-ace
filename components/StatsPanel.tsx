"use client";

import { useEffect, useState, type ReactElement } from "react";
import { IconBall, IconDice, IconPoker, IconRoulette, IconSlot, IconSpade, IconTicket } from "./UiIcons";
import { createPortal } from "react-dom";
import { useStats } from "../lib/statsStore";
import { statsStore } from "../lib/statsStore";
import { useWinHistory, winHistory } from "../lib/winHistory";
import { downloadSessionShare } from "../lib/shareSession";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function StatsPanel({ open, onClose }: Props) {
  const stats = useStats();
  const history = useWinHistory();
  const [sharing, setSharing] = useState<"idle" | "rendering" | "done">("idle");
  // The history is newest-first; the card wants the largest win.
  const biggest = history.reduce<(typeof history)[number] | null>(
    (best, entry) => (!best || entry.amount > best.amount ? entry : best),
    null,
  );

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
  let perfects = 0;
  let bestStreak = 0;
  try {
    const pe = JSON.parse(localStorage.getItem("royalace:penalty") ?? "null");
    perfects = Number(pe?.records?.perfects) || 0;
    bestStreak = Number(pe?.records?.bestStreak) || 0;
  } catch {}

  // A few numbers per game: what you played, how often you win, one highlight.
  const groups: {
    title: string;
    Icon: (p: { className?: string }) => ReactElement;
    items: { label: string; value: string | number }[];
  }[] = [
    {
      title: "Blackjack",
      Icon: IconSpade,
      items: [
        { label: "Hands", value: stats.bjHands },
        { label: "Win rate", value: pct(stats.bjWins, stats.bjHands) },
        { label: "Blackjacks", value: stats.blackjacks },
        { label: "Right plays", value: pct(stats.correctDecisions, stats.bjHands) },
      ],
    },
    {
      title: "Slots",
      Icon: IconSlot,
      items: [
        { label: "Spins", value: stats.spins },
        { label: "Win rate", value: pct(stats.slotWins, stats.spins) },
        { label: "Bonuses", value: stats.bonuses },
        { label: "Jackpots", value: stats.jackpots },
      ],
    },
    {
      title: "Roulette",
      Icon: IconRoulette,
      items: [
        { label: "Spins", value: stats.rouletteSpins },
        { label: "Wins", value: stats.rouletteWins },
        { label: "Win rate", value: pct(stats.rouletteWins, stats.rouletteSpins) },
        { label: "Straight hits", value: stats.rouletteStraights },
      ],
    },
    {
      title: "Casino Hold'em",
      Icon: IconPoker,
      items: [
        { label: "Hands", value: stats.pokerHands },
        { label: "Wins", value: stats.pokerWins },
        { label: "Win rate", value: pct(stats.pokerWins, stats.pokerHands) },
      ],
    },
    {
      title: "Craps",
      Icon: IconDice,
      items: [
        { label: "Rolls", value: stats.crapsRolls },
        { label: "Winning rolls", value: stats.crapsWins },
        { label: "Win rate", value: pct(stats.crapsWins, stats.crapsRolls) },
      ],
    },
    {
      title: "Penalty",
      Icon: IconBall,
      items: [
        { label: "Rounds", value: stats.penaltyRounds },
        { label: "Goals", value: stats.penaltyGoals },
        { label: "Best streak", value: bestStreak },
        { label: "Perfect fives", value: perfects },
      ],
    },
    {
      title: "Sportsbook",
      Icon: IconTicket,
      items: [
        { label: "Tickets", value: stats.betsPlaced },
        { label: "Won", value: stats.betsWon },
        { label: "Hit rate", value: pct(stats.betsWon, stats.betsPlaced) },
      ],
    },
  ];

  const formatKind = (kind: string) =>
    kind === "bigWin"
      ? "Big win"
      : kind === "vault"
        ? "Vault"
        : kind === "jackpot"
          ? "Jackpot"
          : "Blackjack";

  const formatGame = (game: string) =>
    game === "slots" ? "Slots" : "Blackjack";

  return createPortal(
    <div
      className="safe-y fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Statistics"
    >
      <button
        type="button"
        aria-label="Close statistics"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        className="relative flex max-h-[min(90vh,calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom)_-_2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-3xl lg:max-w-5xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-insurance-slide-in"
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.15) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 60%, #070504 100%)",
        }}
      >
        {/* Inner gold hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-3 border-b border-[#d7b45b]/15 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7b45b]/80">
              Lifetime
            </p>
            <h2 className="font-display mt-0.5 text-lg font-black tracking-wide text-white sm:text-xl">
              Stats
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 outline-none transition hover:border-[#d7b45b]/60 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
          >
            ×
          </button>
        </div>

        {/* Scrollable body: one card per game (4 columns on computers, so
            it all fits without scrolling), then the latest big wins. */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-color:#d7b45b40_transparent] [scrollbar-width:thin] sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2.5">
          {groups.map((group) => (
            <section key={group.title} className="rounded-2xl border border-[#c8a65b]/15 bg-black/30 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-[0.2em] text-[#e5c779]">
                <group.Icon className="h-3.5 w-3.5 shrink-0" />
                {group.title}
              </p>
              <div className="grid grid-cols-4 gap-1 lg:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex min-w-0 flex-col justify-between rounded-lg bg-white/[0.03] px-1.5 py-1 lg:px-2">
                    <p className="text-[8px] font-bold uppercase leading-tight tracking-wide text-white/45 [overflow-wrap:anywhere] sm:text-[9px]">{item.label}</p>
                    <p className="text-[13px] font-black tabular-nums text-[#f0d38b] sm:text-sm">{typeof item.value === "number" ? item.value.toLocaleString("en-US") : item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <section className="rounded-2xl border border-[#c8a65b]/15 bg-black/30 p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <p className="text-[10.5px] font-black uppercase tracking-[0.2em] text-[#e5c779]">
                Latest big wins
              </p>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear the win history?")) winHistory.clear();
                  }}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition hover:border-[#d7b45b]/40 hover:text-[#e5c779]"
                >
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="px-1 py-2 text-xs text-white/45">
                No big win recorded yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {history.slice(0, 3).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-2 py-1"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold tracking-wide text-white">
                        {formatKind(entry.kind)} · {formatGame(entry.game)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/45">
                        {new Date(entry.at).toLocaleString()}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black tabular-nums text-[#f0d38b]">
                      ◈ {entry.amount.toLocaleString("en-US")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </div>
        </div>

        {/* Footer — share a snapshot, or reset stats */}
        <div className="relative flex gap-2 border-t border-[#d7b45b]/15 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={async () => {
              if (sharing === "rendering") return;
              setSharing("rendering");
              try {
                await downloadSessionShare({
                  stats,
                  bigWin: biggest
                    ? {
                        amount: biggest.amount,
                        kind: `${biggest.kind} · ${biggest.game}`,
                      }
                    : null,
                  bigWinCount: history.length,
                });
                setSharing("done");
                window.setTimeout(() => setSharing("idle"), 1800);
              } catch {
                setSharing("idle");
              }
            }}
            className="flex-1 rounded-full border border-[#d7b45b]/40 bg-gradient-to-b from-[#d7b45b]/[0.14] to-black/20 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-[#f5d778] shadow-[inset_0_1px_0_rgba(229,199,121,0.2)] outline-none transition hover:border-[#d7b45b]/60 focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-60"
            disabled={sharing === "rendering"}
          >
            {sharing === "rendering"
              ? "Rendering…"
              : sharing === "done"
                ? "Saved ✓"
                : "Download session card"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset all global statistics? This cannot be undone.")) {
                statsStore.reset();
              }
            }}
            className="rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-red-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition hover:bg-red-500/20 hover:text-red-200 focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Reset
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
