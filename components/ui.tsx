"use client";

import { useEffect, useRef, useState } from "react";
import { CHIPS, CHIP_BG, money } from "../lib/game";

export function Counter({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 600);
      const v = Math.round(a + (value - a) * (1 - Math.pow(1 - p, 3)));
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{money(shown)}</>;
}

export function ChipStack({ amount }: { amount: number }) {
  if (amount <= 0) return null;

  const stacks: { v: number; n: number }[] = [];
  let rest = amount;

  for (const v of [...CHIPS].reverse()) {
    const n = Math.floor(rest / v);

    if (n > 0) {
      stacks.push({ v, n: Math.min(n, 8) });
      rest -= n * v;
    }
  }

  return (
    <div
      key={amount}
      className="animate-pop flex items-end justify-center gap-2"
      aria-label={`${amount} chips bet`}
    >
      {stacks.map(({ v, n }) => (
        <div
          key={v}
          className="relative w-9"
          style={{ height: 18 + (n - 1) * 5 }}
        >
          <div
            aria-hidden="true"
            className="absolute -bottom-1 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-black/45 blur-[2px]"
          />

          {Array.from({ length: n }).map((_, k) => (
            <div
              key={k}
              className={`absolute left-0 h-4 w-9 overflow-hidden rounded-full border border-black/25 shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${CHIP_BG[v]}`}
              style={{ bottom: k * 5 }}
            >
              <div className="absolute inset-x-[3px] top-[2px] h-[7px] rounded-full border border-dashed border-white/45" />

              <div className="absolute inset-x-1 top-0 h-1 rounded-full bg-white/20" />

              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return <p className="text-xs text-white/30">Play a few hands to see your trend.</p>;
  const w = 240, h = 48;
  const min = Math.min(...data), max = Math.max(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 4 - ((v - min) / r) * (h - 8)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Chip balance over this session">
      <polyline points={pts} fill="none" stroke="#d7b45b" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between text-xs text-white/60 ${disabled ? "opacity-40" : "cursor-pointer"}`}>
      {label}
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#d7b45b]"
      />
    </label>
  );
}

export function SideBet({
  label,
  hint,
  amount,
  onChange,
  minusDisabled,
  plusDisabled,
  roomy = false,
}: {
  label: string;
  hint: string;
  amount: number;
  onChange: (d: number) => void;
  minusDisabled: boolean;
  plusDisabled: boolean;
  roomy?: boolean;
}) {
    const b = `${
    roomy ? "h-9 w-9 text-base" : "h-7 w-7 text-sm"
  } flex shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 outline-none transition hover:border-[#d7b45b] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-30`;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 ${
        roomy ? "gap-2 px-2 py-2" : "px-3 py-2"
      }`}
    >
      <div className={roomy ? "min-w-0 flex-1" : ""}>
        <p className="text-xs font-semibold text-white">
          {label}
        </p>
        <p
          className={`text-[10px] text-white/40 ${
            roomy ? "truncate" : ""
          }`}
          title={hint}
        >
          {hint}
        </p>
      </div>

      <div
        className={`flex shrink-0 items-center ${
          roomy ? "gap-1.5" : "gap-2"
        }`}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(-10)}
          disabled={minusDisabled}
          className={b}
        >
          −
        </button>

        <span className="w-8 shrink-0 text-center text-xs font-bold tabular-nums text-[#e5c779]">
          {amount}
        </span>

        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(10)}
          disabled={plusDisabled}
          className={b}
        >
          +
        </button>
      </div>
    </div>
  );
}

export const btn =
    "rounded-full px-6 py-3 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30";
export const small =
    "rounded-full border border-white/10 py-2 text-xs text-white/60 outline-none transition hover:border-[#d7b45b] hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-30";
export const machineSmall =
  "rounded-full border border-white/15 bg-[linear-gradient(180deg,#30313b_0%,#1c1d26_48%,#14151d_100%)] py-2 text-xs text-white/70 shadow-[0_2px_0_#08090e,0_4px_7px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.10)] outline-none transition-[transform,box-shadow,border-color,color] duration-150 enabled:hover:border-[#d7b45b]/60 enabled:hover:text-[#e5c779] enabled:active:translate-y-px enabled:active:shadow-[0_1px_0_#08090e,inset_0_2px_4px_rgba(0,0,0,0.45)] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none";