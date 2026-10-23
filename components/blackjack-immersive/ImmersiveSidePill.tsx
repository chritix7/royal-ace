"use client";

import { money } from "../../lib/game";

export default function ImmersiveSidePill({
  label,
  amount,
  disabled,
  onIncrease,
  onDecrease,
  plusDisabled,
}: {
  label: string;
  amount: number;
  disabled: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  plusDisabled: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-1.5 rounded-full border px-2 py-1 transition ${
        amount > 0
          ? "border-[#e5c779]/60 bg-[#e5c779]/12"
          : "border-white/15 bg-black/25"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-wide text-[#e5c779]">
          {label}
        </p>
        <p className="text-[10px] font-bold tabular-nums text-white">
          {amount > 0 ? `◈ ${money(amount)}` : "Off"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || amount <= 0}
          aria-label={`Decrease ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xs font-bold text-white/80 transition enabled:hover:border-[#e5c779]/60 enabled:hover:text-[#e5c779] disabled:opacity-30"
        >
          −
        </button>

        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled || plusDisabled}
          aria-label={`Increase ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xs font-bold text-white/80 transition enabled:hover:border-[#e5c779]/60 enabled:hover:text-[#e5c779] disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
