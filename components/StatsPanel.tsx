"use client";

import { useEffect, useState } from "react";
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
  const biggest = history[0];

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

  const slotWinRate = stats.spins ? Math.round((stats.slotWins / stats.spins) * 100) : 0;
  const bjWinRate = stats.bjHands ? Math.round((stats.bjWins / stats.bjHands) * 100) : 0;
  const decisionRate = stats.bjHands ? Math.round((stats.correctDecisions / stats.bjHands) * 100) : 0;

  const groups: {
    title: string;
    items: { label: string; value: string | number }[];
  }[] = [
    {
      title: "Slots",
      items: [
        { label: "Spins", value: stats.spins },
        { label: "Wins", value: stats.slotWins },
        { label: "Win rate", value: `${slotWinRate}%` },
        { label: "Bonuses", value: stats.bonuses },
        { label: "Vaults", value: stats.vaults },
        { label: "Jackpots", value: stats.jackpots },
        { label: "Wild expands", value: stats.wildExpands },
        { label: "Re-spins", value: stats.respins },
        { label: "Gambles won", value: stats.gambleWins },
      ],
    },
    {
      title: "Blackjack",
      items: [
        { label: "Hands", value: stats.bjHands },
        { label: "Wins", value: stats.bjWins },
        { label: "Win rate", value: `${bjWinRate}%` },
        { label: "Blackjacks", value: stats.blackjacks },
        { label: "Doubled wins", value: stats.doubledWins },
        { label: "Split wins", value: stats.splitWins },
        { label: "Correct decisions", value: stats.correctDecisions },
        { label: "Decision rate", value: `${decisionRate}%` },
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
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade sm:p-6"
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
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-insurance-slide-in"
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
            <h2 className="mt-0.5 text-lg font-black tracking-wide text-white sm:text-xl">
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

        {/* Scrollable body */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-color:#d7b45b40_transparent] [scrollbar-width:thin] sm:px-6">
          {groups.map((group) => (
            <section key={group.title} className="mb-6 last:mb-0">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#c8a65b]/15 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-black tabular-nums text-[#f0d38b]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section>
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
                Recent big wins
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
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/45">
                No big win recorded yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#c8a65b]/15 bg-black/35 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold tracking-wide text-white">
                        {formatKind(entry.kind)} · {formatGame(entry.game)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/45">
                        {new Date(entry.at).toLocaleString()}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-black tabular-nums text-[#f0d38b]">
                      ◈ {entry.amount.toLocaleString("en-US")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
