"use client";

import RollingNumber from "./RollingNumber";
import { JACKPOTS, JACKPOT_TIERS, type JackpotTier, type Pools } from "../lib/jackpot";

const STYLE: Record<JackpotTier, string> = {
  mini: "border-cyan-300/60 text-cyan-200",
  minor: "border-emerald-300/60 text-emerald-200",
  major: "border-amber-300/70 text-amber-200",
  kingpin: "border-pink-400/80 text-pink-200 shadow-[0_0_20px_#ff2e88aa]",
};

/** Les 4 cagnottes progressives. Elles sont exprimées en multiples de la mise : mise plus haute, jackpot plus gros. */
export default function JackpotBar({ pools, bet }: { pools: Pools; bet: number }) {
  return (
    <div className="mx-auto mb-4 grid max-w-2xl grid-cols-4 gap-1.5 sm:gap-2" role="group" aria-label="Progressive jackpots">
      {JACKPOT_TIERS.map((t) => (
        <div key={t} className={`rounded-lg border bg-black/50 px-1 py-1.5 text-center ${STYLE[t]}`}>
          <p className="text-[8px] font-black tracking-[0.18em] opacity-80 sm:text-[9px]">{JACKPOTS[t].label}</p>
          <p className="font-mono text-[11px] font-black sm:text-base">
            ◈ <RollingNumber value={Math.round(pools[t] * bet)} ms={700} />
          </p>
        </div>
      ))}
    </div>
  );
}