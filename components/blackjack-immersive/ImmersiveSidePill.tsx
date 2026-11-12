"use client";

import { money } from "../../lib/game";

/**
 * Immersive side-bet pill — a single-tap button that opens the shared
 * SideBetModal. The old inline +/− controls are gone in favor of the
 * same chip-picker flow the main bet uses.
 */
export default function ImmersiveSidePill({
  label,
  amount,
  disabled,
  onOpen,
}: {
  label: string;
  amount: number;
  disabled: boolean;
  onOpen: () => void;
}) {
  const active = !disabled && amount > 0;

  return (
    <button
      type="button"
      aria-label={`${label} — stake ${amount}`}
      disabled={disabled}
      onClick={onOpen}
      className={`group flex w-full min-w-0 items-center justify-between gap-1.5 rounded-full border px-2.5 py-1.5 outline-none transition-[background,border-color,transform] enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-[#e5c779]/60 bg-[#e5c779]/12 shadow-[inset_0_1px_0_rgba(229,199,121,0.18),0_0_12px_rgba(229,199,121,0.18)]"
          : "border-white/15 bg-black/25 hover:border-[#d7b45b]/40"
      }`}
    >
      <div className="min-w-0 text-left">
        <p className="text-[9px] font-black uppercase tracking-wide text-[#e5c779]">
          {label}
        </p>
        <p
          className={`text-[10px] font-bold tabular-nums ${
            active ? "text-[#f5d778]" : "text-white/70"
          }`}
        >
          {amount > 0 ? `◈ ${money(amount)}` : "Tap to stake"}
        </p>
      </div>

      <span
        aria-hidden
        className={`shrink-0 text-[11px] ${
          active ? "text-[#e5c779]" : "text-white/35 group-hover:text-[#d7b45b]"
        }`}
      >
        ▸
      </span>
    </button>
  );
}
