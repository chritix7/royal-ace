"use client";

import type { ReactNode } from "react";
import RollingNumber from "./RollingNumber";
import {
  JACKPOTS,
  JACKPOT_TIERS,
  type JackpotTier,
  type Pools,
} from "../lib/jackpot";

const STYLE: Record<JackpotTier, string> = {
  mini: "border-cyan-300/30 text-cyan-200",
  minor: "border-emerald-300/30 text-emerald-200",
  major: "border-amber-300/40 text-amber-200",
  kingpin: "border-pink-400/45 text-pink-200",
};

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
      <p className="text-[8px] font-black tracking-[0.18em] opacity-65 sm:text-[9px]">{JACKPOTS[t].label}</p>
      <p className="font-mono text-[11px] font-black tabular-nums sm:text-base">
        <span className="opacity-60">◈</span> <RollingNumber value={Math.round(pools[t] * bet)} ms={700} />
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
