"use client";

import { useEffect, useRef } from "react";
import type { Skin } from "../lib/skins";

/** Barre de mise défilante : on glisse (ou on utilise ‹ ›) et on touche une case pour choisir. */
export default function BetBar({
  levels, index, onSelect, balance, disabled, skin, lines,
}: {
  levels: number[]; index: number; onSelect: (i: number) => void; balance: number;
  disabled: boolean; skin: Skin; lines: number;
}) {
  const box = useRef<HTMLDivElement>(null);

  // La case choisie se recentre toute seule dans la barre
  useEffect(() => {
    const c = box.current;
    const el = c?.children[index] as HTMLElement | undefined;
    if (!c || !el || typeof c.scrollTo !== "function") return;
    c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [index]);

  const arrow =
    "h-12 w-9 shrink-0 rounded-lg border border-white/15 bg-black/40 text-lg text-white/70 outline-none transition hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30";

  return (
    <div className="flex items-center gap-2">
      <button aria-label="Lower bet" onClick={() => onSelect(index - 1)} disabled={disabled || index === 0} className={arrow}>‹</button>
      <div
        ref={box}
        role="group"
        aria-label="Bet amount"
        className="relative flex w-0 flex-1 snap-x gap-1.5 overflow-x-auto scroll-smooth px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {levels.map((v, i) => (
          <button
            key={v}
            onClick={() => onSelect(i)}
            disabled={disabled || v > balance}
            aria-pressed={i === index}
            title={`${v / lines} per line`}
            className={`w-[4.4rem] shrink-0 snap-center rounded-lg border px-1 py-1 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-35 ${
              i === index ? `${skin.betOn} scale-105 shadow-lg` : "border-white/15 bg-black/40 text-white/70 hover:border-white/40"
            }`}
          >
            <span className="block text-sm font-black leading-4">{v.toLocaleString("en-US")}</span>
            <span className="block text-[9px] opacity-70">{v / lines}/line</span>
          </button>
        ))}
      </div>
      <button aria-label="Raise bet" onClick={() => onSelect(index + 1)} disabled={disabled || index === levels.length - 1} className={arrow}>›</button>
    </div>
  );
}