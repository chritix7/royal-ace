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
      className="animate-chip-bump flex items-end justify-center gap-2"
      aria-label={`${amount} chips bet`}
    >
      {stacks.map(({ v, n }) => {
        const tilt = ((v % 7) - 3) * 0.8;

        return (
          <div
            key={v}
            className="relative w-9"
            style={{
              height: 18 + (n - 1) * 5,
              transform: `rotate(${tilt}deg)`,
            }}
          >
            <div
              aria-hidden="true"
              className="absolute -bottom-1 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-black/45 blur-[2px]"
            />

            {Array.from({ length: n }).map((_, k) => (
              <div
                key={k}
                className={`absolute left-0 h-4 w-9 overflow-hidden rounded-full border border-black/25 shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${CHIP_BG[v]} ${
                  k === n - 1 ? "animate-chip-drop" : ""
                }`}
                style={{
                  bottom: k * 5,
                  animationDelay: `${k * 35}ms`,
                }}
              >
                <div className="absolute inset-x-[3px] top-[2px] h-[7px] rounded-full border border-dashed border-white/45" />

                <div className="absolute inset-x-1 top-0 h-1 rounded-full bg-white/20" />

                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25" />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function Spark({ data }: { data: number[] }) {
  if (data.length < 2) {
    return (
      <p className="text-xs text-white/30">
        Play a few hands to see your trend.
      </p>
    );
  }

  const W = 240;
  const H = 84;
  const PAD_T = 10;
  const PAD_B = 16;
  const PAD_L = 4;
  const PAD_R = 4;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const start = data[0];
  const current = data[data.length - 1];
  const diff = current - start;
  const min = Math.min(...data, start);
  const max = Math.max(...data, start);
  const range = max - min || 1;

  // Map a value to the y pixel.
  const y = (v: number) =>
    PAD_T + chartH - ((v - min) / range) * chartH;
  const x = (i: number) =>
    PAD_L + (i / (data.length - 1)) * chartW;

  // Peak + trough indices (ignore the very first baseline point).
  let peakI = 0;
  let troughI = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > data[peakI]) peakI = i;
    if (data[i] < data[troughI]) troughI = i;
  }

  const linePts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  // Area polygon: line + close to the bottom.
  const areaPts =
    linePts +
    ` ${x(data.length - 1)},${PAD_T + chartH}` +
    ` ${x(0)},${PAD_T + chartH}`;

  const baselineY = y(start);
  const diffColor =
    diff > 0 ? "#f5d778" : diff < 0 ? "#f87171" : "rgba(255,255,255,0.5)";

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Chip balance over this session: ${current} (${diff >= 0 ? "+" : "−"}${Math.abs(diff)} from start)`}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7b45b" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#d7b45b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#d7b45b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Reference baseline at starting balance */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={baselineY}
          y2={baselineY}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* Area under the curve */}
        <polygon points={areaPts} fill="url(#spark-fill)" />

        {/* Main line */}
        <polyline
          points={linePts}
          fill="none"
          stroke="#e5c779"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Trough marker (only if below start and distinct from peak) */}
        {data[troughI] < start && troughI !== peakI && (
          <circle
            cx={x(troughI)}
            cy={y(data[troughI])}
            r="2.2"
            fill="#f87171"
            stroke="#1a1612"
            strokeWidth="0.5"
          />
        )}

        {/* Peak marker (only if above start) */}
        {data[peakI] > start && (
          <circle
            cx={x(peakI)}
            cy={y(data[peakI])}
            r="2.5"
            fill="#f5d778"
            stroke="#1a1612"
            strokeWidth="0.6"
          />
        )}

        {/* Current-value pulse at the right */}
        <circle
          cx={x(data.length - 1)}
          cy={y(current)}
          r="3"
          fill="#e5c779"
          stroke="#1a1612"
          strokeWidth="0.6"
        />
      </svg>

      {/* Below-chart labels: start | current + delta */}
      <div className="mt-1 flex items-center justify-between text-[10px]">
        <span className="text-white/35">
          Start · ◈ {start.toLocaleString("en-US")}
        </span>
        <span className="font-bold tabular-nums" style={{ color: diffColor }}>
          {diff >= 0 ? "+" : "−"}◈ {Math.abs(diff).toLocaleString("en-US")}
        </span>
        <span className="font-bold tabular-nums text-[#e5c779]">
          ◈ {current.toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label
      className={`flex items-center justify-between text-xs ${
        checked ? "text-white/85" : "text-white/55"
      } ${disabled ? "opacity-40" : "cursor-pointer hover:text-white/95"}`}
    >
      <span className="truncate">{label}</span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        {/* Switch track */}
        <span
          aria-hidden
          className={`h-5 w-9 rounded-full border transition-colors ${
            checked
              ? "border-[#d7b45b]/60 bg-gradient-to-r from-[#d7b45b]/40 to-[#d7b45b]/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),0_0_8px_rgba(229,199,121,0.35)]"
              : "border-white/15 bg-black/40"
          }`}
        />
        {/* Switch knob */}
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border transition-[left,background,border-color,box-shadow] duration-200 ${
            checked
              ? "left-[18px] border-[#8a6c2b] bg-gradient-to-b from-[#f6e4a9] to-[#d7b45b] shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              : "left-[2px] border-white/20 bg-white/80"
          }`}
        />
      </span>
    </label>
  );
}

/**
 * Adaptive step for the side-bet +/− buttons. Small bets step by 10
 * for fine control; the step grows aggressively as the amount climbs
 * so a player can reach the 5000 cap in ~15 taps instead of 500.
 * Symmetric both ways.
 */
export function sideBetStep(amount: number) {
  if (amount < 50) return 10;
  if (amount < 500) return 50;
  if (amount < 1000) return 100;
  if (amount < 2500) return 250;
  return 500;
}

/**
 * Side-bet pill — a single-tap trigger that opens the shared chip-
 * picker modal on top of the page. The old inline +/− controls are
 * gone; opening the modal gives one unified premium staking flow for
 * Perfect Pairs and 21+3 (identical UX to the main bet).
 */
export function SideBet({
  label,
  hint,
  amount,
  onOpen,
  disabled,
  roomy = false,
  heat,
}: {
  label: string;
  hint: string;
  amount: number;
  onOpen: () => void;
  disabled?: boolean;
  roomy?: boolean;
  /** Optional hot/cold state for this bet in the current session. */
  heat?: "hot" | "cold" | "neutral";
}) {
  const active = !disabled && amount > 0;

  return (
    <button
      type="button"
      aria-label={`${label} — stake ${amount}`}
      title={hint}
      disabled={disabled}
      onClick={onOpen}
      className={`group flex w-full items-center justify-between gap-2 rounded-2xl border outline-none transition-[background,border-color,transform] enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-40 ${
        roomy ? "px-3 py-2.5" : "px-3 py-1.5"
      } ${
        active
          ? "border-[#d7b45b]/55 bg-gradient-to-b from-[#d7b45b]/[0.1] to-black/20 shadow-[inset_0_1px_0_rgba(229,199,121,0.15),0_0_12px_rgba(229,199,121,0.12)]"
          : "border-white/10 bg-gradient-to-b from-black/30 to-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[#d7b45b]/40"
      }`}
    >
      <div className="min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] font-bold tracking-wide text-white">
            {label}
          </p>
          {heat && heat !== "neutral" && (
            <span
              aria-label={heat === "hot" ? "Hot streak" : "Cold stretch"}
              className={`inline-flex items-center rounded-full border px-1 py-[1px] text-[7px] font-black uppercase leading-none tracking-widest ${
                heat === "hot"
                  ? "border-[#d7b45b]/70 bg-[#d7b45b]/20 text-[#f5d778]"
                  : "border-sky-300/40 bg-sky-500/15 text-sky-200"
              }`}
            >
              {heat === "hot" ? "🔥" : "❄"}
            </span>
          )}
        </div>
        <p
          className={`text-[10px] font-black tabular-nums ${
            active ? "text-[#f5d778]" : "text-white/55"
          }`}
        >
          {amount > 0 ? `◈ ${amount}` : "Tap to stake"}
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

export const btn =
    "rounded-full px-6 py-3 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30";
export const small =
    "rounded-full border border-white/10 py-2 text-xs text-white/60 outline-none transition hover:border-[#d7b45b] hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-30";
export const machineSmall =
  "rounded-full border border-white/15 bg-[linear-gradient(180deg,#30313b_0%,#1c1d26_48%,#14151d_100%)] py-2 text-xs text-white/70 shadow-[0_2px_0_#08090e,0_4px_7px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.10)] outline-none transition-[transform,box-shadow,border-color,color] duration-150 enabled:hover:border-[#d7b45b]/60 enabled:hover:text-[#e5c779] enabled:active:translate-y-px enabled:active:shadow-[0_1px_0_#08090e,inset_0_2px_4px_rgba(0,0,0,0.45)] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none";