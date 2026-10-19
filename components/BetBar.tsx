"use client";

import { useEffect, useRef } from "react";
import type { Skin } from "../lib/skins";

/** Barre de mise défilante : glissement, flèches et sélection au toucher. */
export default function BetBar({
  levels,
  index,
  onSelect,
  balance,
  disabled,
  lines,
}: {
  levels: number[];
  index: number;
  onSelect: (i: number) => void;
  balance: number;
  disabled: boolean;
  skin: Skin;
  lines: number;
}) {
  const box = useRef<HTMLDivElement>(null);

  // La case choisie se recentre automatiquement.
  useEffect(() => {
    const c = box.current;
    const el = c?.children[index] as HTMLElement | undefined;

    if (!c || !el || typeof c.scrollTo !== "function") return;

    c.scrollTo({
      left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2,
      behavior: "smooth",
    });
  }, [index]);

  const arrow =
    "flex h-12 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[linear-gradient(180deg,#30313b,#171820)] text-lg text-white/70 shadow-[0_2px_0_#08090e,inset_0_1px_0_rgba(255,255,255,0.10)] outline-none transition-[transform,border-color,color] duration-150 enabled:hover:border-[#d7b45b]/60 enabled:hover:text-[#e5c779] enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none";

  return (
    <div
      className="flex items-center gap-2 rounded-xl"
      style={{
        background:
          "linear-gradient(180deg, #10121a 0%, #090b12 100%)",
        boxShadow:
          "inset 0 2px 5px rgba(0,0,0,0.60), inset 0 -1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <button
        type="button"
        aria-label="Lower bet"
        onClick={() => onSelect(index - 1)}
        disabled={disabled || index === 0}
        className={arrow}
      >
        ‹
      </button>

      <div
        ref={box}
        role="group"
        aria-label="Bet amount"
        className="relative flex w-0 flex-1 snap-x gap-1.5 overflow-x-auto scroll-smooth px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {levels.map((v, i) => {
          const selected = i === index;

          return (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(i)}
              disabled={disabled || v > balance}
              aria-pressed={selected}
              title={`${v / lines} per line`}
              className={`w-[4.4rem] shrink-0 snap-center rounded-lg border px-1 py-1 text-center outline-none transition-[transform,border-color,color] duration-150 enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none ${
                selected
                  ? "border-[#d7b45b]/80 text-[#f0d99a]"
                  : "border-white/15 text-white/65 enabled:hover:border-white/35 enabled:hover:text-white/90"
              }`}
              style={{
                background: selected
                  ? "linear-gradient(180deg, #39332a 0%, #25221e 55%, #1a1918 100%)"
                  : "linear-gradient(180deg, #292b35 0%, #1b1d26 55%, #13151d 100%)",
                boxShadow: selected
                  ? "0 2px 0 #07080d, inset 0 1px 0 rgba(255,226,158,0.16), inset 0 -2px 3px rgba(0,0,0,0.25)"
                  : "0 2px 0 #07080d, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 3px rgba(0,0,0,0.25)",
              }}
            >
              <span className="block text-sm font-black tabular-nums leading-4">
                {v.toLocaleString("en-US")}
              </span>

              <span className="block text-[9px] opacity-60">
                {v / lines}/line
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Raise bet"
        onClick={() => onSelect(index + 1)}
        disabled={disabled || index === levels.length - 1}
        className={arrow}
      >
        ›
      </button>
    </div>
  );
}