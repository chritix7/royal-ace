"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { money } from "../lib/game";

/**
 * Insurance decision modal.
 *
 * Pops up when the game enters the "insurance" phase (dealer's up-card
 * is an Ace). Replaces the previously inline Insurance / No thanks
 * buttons so the choice feels like a real moment and the player can't
 * miss it. Shares the premium visual family of the Vegas picker and
 * session recap modals: gold-framed card, dark gradient backdrop with
 * blur, soft gold wash from the top.
 *
 * `cost` is half the player's total main-hand stake, computed by the
 * caller. The hook's `takeInsurance(bool)` is passed through onDecide.
 */

const DISPLAY_MS_AFTER_MOUNT = 0;

export default function InsuranceModal({
  open,
  cost,
  busy,
  onDecide,
}: {
  open: boolean;
  cost: number;
  busy: boolean;
  onDecide: (take: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Esc declines insurance (fast "no thanks" shortcut).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDecide(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDecide]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-6 animate-vegas-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insurance-title"
    >
      {/* backdrop — click = decline */}
      <button
        type="button"
        aria-label="Decline insurance"
        onClick={() => onDecide(false)}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      {/* dialog card */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-vegas-pop"
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

        {/* Dealer ace token */}
        <div className="flex flex-col items-center">
          <div
            aria-hidden
            className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-xl"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #f6e4a9 0%, #d7b45b 55%, #8a6c2b 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.65), 0 0 18px rgba(229,199,121,0.5)",
            }}
          >
            <span
              className="font-serif text-xl font-black leading-none"
              style={{ color: "#1a1612" }}
            >
              A
            </span>
            <span
              className="absolute bottom-1.5 right-1.5 text-[11px] leading-none"
              style={{ color: "#1a1612" }}
            >
              ♠
            </span>
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#e5c779]">
            Dealer shows an Ace
          </p>
          <h3
            id="insurance-title"
            className="mt-1.5 text-center text-xl font-black text-white"
          >
            Take insurance?
          </h3>
          <p className="mt-2 max-w-[22rem] text-center text-[12px] leading-5 text-white/55">
            Pays <span className="font-bold text-[#e5c779]">2 : 1</span> if the
            dealer has blackjack. Costs half your main bet.
          </p>
        </div>

        {/* gold divider */}
        <div
          aria-hidden
          className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#d7b45b]/40 to-transparent"
        />

        {/* actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onDecide(false)}
            disabled={busy}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-3 text-sm font-bold text-white/80 outline-none transition hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => onDecide(true)}
            disabled={busy}
            className="rounded-full border border-[#d7b45b]/60 bg-gradient-to-b from-[#e5c779]/30 to-[#d7b45b]/10 px-3 py-3 text-sm font-black uppercase tracking-wider text-[#f0d38b] shadow-[0_0_14px_rgba(215,180,91,0.25)] outline-none transition hover:border-[#e5c779] hover:from-[#e5c779]/40 hover:to-[#d7b45b]/20 hover:text-[#f7dd9b] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40"
          >
            Take · ◈ {money(cost)}
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-white/35">
          Esc declines
        </p>
      </div>
    </div>,
    document.body
  );
}
