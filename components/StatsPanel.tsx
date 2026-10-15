"use client";

import { useStats } from "../lib/statsStore";
import { statsStore } from "../lib/statsStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function StatsPanel({ open, onClose }: Props) {
  const stats = useStats();

  if (!open) return null;

  const slotWinRate = stats.spins ? Math.round((stats.slotWins / stats.spins) * 100) : 0;
  const bjWinRate = stats.bjHands ? Math.round((stats.bjWins / stats.bjHands) * 100) : 0;
  const decisionRate = stats.bjHands ? Math.round((stats.correctDecisions / stats.bjHands) * 100) : 0;

  const items = [
    { label: "Slot spins", value: stats.spins },
    { label: "Slot wins", value: stats.slotWins },
    { label: "Slot win rate", value: `${slotWinRate}%` },
    { label: "Bonuses", value: stats.bonuses },
    { label: "Vaults", value: stats.vaults },
    { label: "Jackpots", value: stats.jackpots },
    { label: "Wild expands", value: stats.wildExpands },
    { label: "Re-spins", value: stats.respins },
    { label: "Gambles won", value: stats.gambleWins },
    { label: "Blackjack hands", value: stats.bjHands },
    { label: "Blackjack wins", value: stats.bjWins },
    { label: "Blackjack win rate", value: `${bjWinRate}%` },
    { label: "Blackjacks", value: stats.blackjacks },
    { label: "Doubled wins", value: stats.doubledWins },
    { label: "Split wins", value: stats.splitWins },
    { label: "Correct decisions", value: stats.correctDecisions },
    { label: "Decision rate", value: `${decisionRate}%` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Statistics"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#c8a65b]/30 bg-[#0d1210] p-5 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-[0.08em] text-[#e5c779] sm:text-2xl">
              📊 STATS
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Your lifetime activity across both games.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60 transition hover:text-white"
            aria-label="Close statistics"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-black text-[#e5c779]">{item.value}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            if (window.confirm("Reset all global statistics? This cannot be undone.")) {
              statsStore.reset();
            }
          }}
          className="mt-6 w-full rounded-full border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
        >
          Reset stats
        </button>
      </div>
    </div>
  );
}
