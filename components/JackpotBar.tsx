"use client";

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

/** Les 4 cagnottes progressives, exprimées en multiples de la mise. */
export default function JackpotBar({
  pools,
  bet,
}: {
  pools: Pools;
  bet: number;
}) {
  return (
    <div
      className="mx-auto mb-4 grid max-w-2xl grid-cols-4 gap-1.5 sm:gap-2"
      role="group"
      aria-label="Progressive jackpots"
    >
      {JACKPOT_TIERS.map((t) => (
        <div
          key={t}
          className={`relative min-w-0 rounded-lg border px-1 py-1.5 text-center ${STYLE[t]}`}
          style={{
            background:
              "linear-gradient(180deg, #151822 0%, #090c14 55%, #10121b 100%)",
            boxShadow:
              "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.035), 0 2px 4px rgba(0,0,0,0.25)",
          }}
        >
          {/* Reflet fin sur le bord supérieur */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-2 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)",
            }}
          />

          <p className="text-[8px] font-black tracking-[0.18em] opacity-65 sm:text-[9px]">
            {JACKPOTS[t].label}
          </p>

          <p className="font-mono text-[11px] font-black tabular-nums sm:text-base">
            <span className="opacity-60">◈</span>{" "}
            <RollingNumber
              value={Math.round(pools[t] * bet)}
              ms={700}
            />
          </p>
        </div>
      ))}
    </div>
  );
}