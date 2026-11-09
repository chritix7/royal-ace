"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { RoundBreakdown } from "../lib/blackjackRecovery";
import { money } from "../lib/game";

/**
 * Mobile-only round-details modal. On desktop the ResultRail already
 * shows the breakdown next to the felt, but on phones the rail is
 * hidden so the player taps a "Details" button to summon this.
 *
 * Shared between the classic Table and the immersive Focus view so
 * both surfaces present the same card.
 */
function signed(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}◈ ${money(Math.abs(value))}`;
}

export default function MobileResultModal({
  open,
  onClose,
  breakdown,
}: {
  open: boolean;
  onClose: () => void;
  breakdown: RoundBreakdown | null;
}) {
  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !breakdown) return null;

  const tone =
    breakdown.total > 0
      ? "text-[#f5d778]"
      : breakdown.total < 0
        ? "text-red-300"
        : "text-white/70";

  return createPortal(
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Round details"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close round details"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-insurance-slide-in"
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.18) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 60%, #070504 100%)",
        }}
      >
        {/* Inner gold hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close round details"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 outline-none transition hover:border-[#d7b45b] hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
        >
          ×
        </button>

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">
          Round result
        </p>
        <p className={`mt-1 text-3xl font-black tabular-nums ${tone}`}>
          {signed(breakdown.total)}
        </p>

        <dl className="mt-4 space-y-2 text-sm">
          {[
            ["Main hands", breakdown.main],
            ["Insurance", breakdown.insurance],
            ["Perfect Pairs", breakdown.perfectPairs],
            ["21+3", breakdown.twentyOnePlusThree],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="flex items-center justify-between gap-3"
            >
              <dt className="text-white/55">{label}</dt>
              <dd className="font-semibold tabular-nums text-white/90">
                {signed(Number(value))}
              </dd>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
            <dt className="font-bold text-white">Total</dt>
            <dd className={`font-black tabular-nums ${tone}`}>
              {signed(breakdown.total)}
            </dd>
          </div>
        </dl>
      </div>
    </div>,
    document.body,
  );
}
