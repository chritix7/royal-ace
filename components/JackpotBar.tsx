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

/** Phone tiles: amounts shrink with their length instead of being cut. */
function tileSize(v: number) {
  const n = v.toLocaleString("en-US").length;
  return n <= 6 ? "text-[11px]" : n <= 8 ? "text-[10px]" : "text-[9px]";
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
      className={`relative flex min-w-0 items-center justify-center rounded-lg border px-1 py-1 text-center lg:hidden ${STYLE[t]}`}
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
      <span className="min-w-0 text-center">
      <p className="whitespace-nowrap text-[8px] font-black leading-3 tracking-[0.1em] sm:text-[9px]">
        <span className={`mr-0.5 text-[9px] ${SUIT[t].red ? "text-[#ff5a6e]" : "text-white"}`}>{SUIT[t].glyph}</span>
        <span className="opacity-70">{JACKPOTS[t].label}</span>
      </p>
      <p className={`truncate font-mono font-black leading-4 tabular-nums sm:text-sm ${tileSize(Math.round(pools[t] * bet))}`}>
        <span className="opacity-60">◈</span> <GrowingValue value={Math.round(pools[t] * bet)} />
      </p>
      </span>
    </div>
  );

  const [a, b, c, d] = JACKPOT_TIERS;
  return (
    <div
      className="mx-auto mb-0 grid w-full max-w-3xl lg:max-w-5xl grid-cols-4 items-center gap-1.5 sm:gap-2 lg:mb-0 lg:flex lg:justify-center"
      role="group"
      aria-label="Progressive jackpots"
    >
      {tile(a)}
      {tile(b)}
      {center && <div className="order-last col-span-4 mt-[13px] lg:order-none lg:col-span-1 lg:mt-0">{center}</div>}
      {tile(c)}
      {tile(d)}
    </div>
  );
}

/**
 * Desktop jackpot ladder beside the reels, Kingpin on top like the
 * jackpot tower of a casino cabinet.
 */
/** Shrinks long amounts (high bets: Kingpin = 500× the bet) instead of cutting them. */
function fitSize(v: number, top: boolean) {
  const n = v.toLocaleString("en-US").length;
  if (top) return n <= 6 ? "text-xl" : n <= 7 ? "text-lg" : n <= 9 ? "text-base" : "text-sm";
  return n <= 7 ? "text-base" : n <= 9 ? "text-sm" : "text-[13px]";
}

export function JackpotLadder({ pools, bet }: { pools: Pools; bet: number }) {
  const order: JackpotTier[] = ["kingpin", "major", "minor", "mini"];
  return (
    <div className="flex w-full flex-col gap-2" role="group" aria-label="Progressive jackpots">
      <p className="flex items-center justify-center gap-2"><span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-transparent to-[#d7b45b]/70" /><span className="font-display gold-text text-[12px] font-bold uppercase tracking-[0.3em]">Jackpots</span><span aria-hidden="true" className="h-px w-6 bg-gradient-to-l from-transparent to-[#d7b45b]/70" /></p>
      {order.map((t, i) => (
        <div
          key={t}
          className={`relative flex items-center gap-3 rounded-xl border px-3 transition-transform duration-200 hover:-translate-y-0.5 ${i === 0 ? "shine-loop py-3" : "py-2"} ${STYLE[t]}`}
          style={{
            background: "linear-gradient(180deg, #17131a 0%, #0a080c 55%, #120e13 100%)",
            boxShadow:
              i === 0
                ? "0 0 0 1px rgba(240,211,139,0.35), 0 0 26px rgba(255,79,163,0.25), inset 0 1px 0 rgba(255,236,170,0.15), 0 8px 18px rgba(0,0,0,0.5)"
                : "inset 0 2px 5px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.45)",
          }}
        >
          <span
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center rounded-[5px] border border-black/30 leading-none shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
              i === 0 ? "h-12 w-9 text-2xl" : "h-10 w-7 text-lg"
            } ${SUIT[t].red ? "text-[#c81e3a]" : "text-[#111]"}`}
            style={{ background: "linear-gradient(180deg,#fffaf0,#e9e2d0)" }}
          >
            {SUIT[t].glyph}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[9px] font-black tracking-[0.25em] opacity-70">{JACKPOTS[t].label}</span>
            <span className={`block whitespace-nowrap font-mono font-black leading-6 tabular-nums ${fitSize(Math.round(pools[t] * bet), i === 0)}`}>
              <span className="opacity-60">◈</span> <GrowingValue value={Math.round(pools[t] * bet)} />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
