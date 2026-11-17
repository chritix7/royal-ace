"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import RollingNumber from "./RollingNumber";
import {
  JACKPOTS,
  JACKPOT_TIERS,
  type JackpotTier,
  type Pools,
} from "../lib/jackpot";

/** Card-suit plaques, like the jackpot cards of a casino cabinet. */
const SUIT: Record<JackpotTier, { glyph: string; red: boolean }> = {
  mini: { glyph: "♣", red: false },
  minor: { glyph: "♦", red: true },
  major: { glyph: "♥", red: true },
  kingpin: { glyph: "♠", red: false },
};

const STYLE: Record<JackpotTier, string> = {
  mini: "border-cyan-300/30 text-cyan-200",
  minor: "border-emerald-300/30 text-emerald-200",
  major: "border-amber-300/40 text-amber-200",
  kingpin: "border-pink-400/45 text-pink-200",
};

/** Rolling value that glows briefly each time the pot grows. */
function GrowingValue({ value }: { value: number }) {
  const prev = useRef(value);
  const [glow, setGlow] = useState(false);
  useEffect(() => {
    if (value > prev.current) {
      setGlow(true);
      const id = window.setTimeout(() => setGlow(false), 650);
      prev.current = value;
      return () => window.clearTimeout(id);
    }
    prev.current = value;
  }, [value]);
  return (
    <span className={`inline-block transition-[filter,transform] duration-300 ${glow ? "scale-105 brightness-150 drop-shadow-[0_0_8px_currentColor]" : ""}`}>
      <RollingNumber value={value} ms={700} />
    </span>
  );
}

/**
 * The 4 progressive pools, shown as multiples of the bet.
 * `center` (the machine's sign) sits on top on small screens and between
 * Minor and Major on desktop, so the marquee and the pots share one row.
 */
export default function JackpotBar({
  pools,
  bet,
  center,
}: {
  pools: Pools;
  bet: number;
  center?: ReactNode;
}) {
  const tile = (t: JackpotTier) => (
    <div
      key={t}
      className={`relative min-w-0 rounded-lg border px-1 py-1.5 text-center ${STYLE[t]}`}
      style={{
        background: "linear-gradient(180deg, #151822 0%, #090c14 55%, #10121b 100%)",
        boxShadow:
          "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.035), 0 2px 4px rgba(0,0,0,0.25)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)" }}
      />
      <span
        aria-hidden="true"
        className={`absolute left-2 top-1/2 hidden h-9 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] border border-black/30 text-lg leading-none shadow-[0_2px_4px_rgba(0,0,0,0.5)] lg:flex ${
          SUIT[t].red ? "text-[#c81e3a]" : "text-[#111]"
        }`}
        style={{ background: "linear-gradient(180deg,#fffaf0,#e9e2d0)" }}
      >
        {SUIT[t].glyph}
      </span>
      <p className="text-[8px] font-black tracking-[0.18em] opacity-65 sm:text-[9px] lg:pl-8">{JACKPOTS[t].label}</p>
      <p className="font-mono text-[11px] font-black tabular-nums sm:text-base lg:pl-8">
        <span className="opacity-60">◈</span> <GrowingValue value={Math.round(pools[t] * bet)} />
      </p>
    </div>
  );

  const [a, b, c, d] = JACKPOT_TIERS;
  return (
    <div
      className="mx-auto mb-3 grid w-full max-w-3xl lg:max-w-5xl grid-cols-4 items-center gap-1.5 sm:mb-4 sm:gap-2 lg:mb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] lg:gap-3"
      role="group"
      aria-label="Progressive jackpots"
    >
      {tile(a)}
      {tile(b)}
      {center && <div className="order-first col-span-4 lg:order-none lg:col-span-1">{center}</div>}
      {tile(c)}
      {tile(d)}
    </div>
  );
}
