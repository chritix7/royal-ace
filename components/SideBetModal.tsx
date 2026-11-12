"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ChipRail from "./ChipRail";
import { money } from "../lib/game";

/**
 * Premium side-bet staking modal. Replaces the old tap-+-tap-+-tap-+
 * interaction with a chip-picker flow identical to the main bet,
 * centered on the screen and framed in gold.
 *
 * Reused from the three places that currently show a side-bet pill
 * (classic Sidebar, classic Table felt, immersive footer) so there is
 * one single premium staking UX for Perfect Pairs and 21+3.
 */
export default function SideBetModal({
  open,
  onClose,
  label,
  hint,
  amount,
  max = 5000,
  remainingBalance,
  canBet,
  onAdd,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  hint: string;
  amount: number;
  /** Cap for this side bet, in chips. Defaults to 5000. */
  max?: number;
  /** Chips the player still has after main bet + the other side bet.
   *  Used to disable chips whose addition would overspend the balance. */
  remainingBalance: number;
  canBet: boolean;
  /** Add this chip value to the side bet (goes through adjustSide so
   *  the hook's own cap / balance checks still apply). */
  onAdd: (chip: number) => void;
  onClear: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  // A chip can be added when: betting is allowed, cap isn't reached,
  // and the player can afford it.
  const disabledFor = (chip: number) =>
    !canBet || amount + chip > max || chip > remainingBalance;

  return createPortal(
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-vegas-fade sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Stake ${label}`}
    >
      {/* backdrop — click = close */}
      <button
        type="button"
        aria-label={`Close ${label} stake picker`}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-insurance-slide-in"
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.18) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 60%, #070504 100%)",
        }}
      >
        {/* gold hairline frame */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">
              Side bet
            </p>
            <h3 className="mt-0.5 text-lg font-black tracking-wide text-white">
              {label}
            </h3>
            <p className="mt-1 max-w-[18rem] text-[11px] leading-4 text-white/55">
              {hint}
            </p>
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

        {/* Current stake read-out — the same tabular-nums gold style as
            the main bet, so the player always sees the live amount. */}
        <div className="mt-4 flex items-baseline justify-between rounded-2xl border border-[#d7b45b]/15 bg-black/35 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
            Stake
          </p>
          <p
            key={amount}
            className="animate-chip-bump text-2xl font-black tabular-nums text-[#f5d778]"
          >
            ◈ {money(amount)}
          </p>
        </div>

        {/* Chip picker — 5-wide window with arrows, identical to the
            main bet entry. Each tap adds that chip to the side bet. */}
        <div className="relative mt-4">
          <ChipRail
            visibleCount={5}
            size="sm"
            onPick={(chip) => onAdd(chip)}
            disabledFor={disabledFor}
          />
        </div>

        {/* Max indicator + clear */}
        <div className="relative mt-4 flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Max · ◈ {money(max)}
          </p>
          <button
            type="button"
            onClick={onClear}
            disabled={amount === 0}
            className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(0,0,0,0.45)] outline-none transition hover:border-[#d7b45b]/60 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Clear
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
