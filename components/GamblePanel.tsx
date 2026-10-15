"use client";

import { useEffect } from "react";
import { GAMBLE_MAX_ROUNDS, type CardColor } from "../lib/gamble";
import type { GambleState } from "../lib/useSlots";

const money = (n: number) => n.toLocaleString("en-US");

function PlayingCardFace({ card, back }: { card: GambleState["card"]; back?: boolean }) {
  return (
    <div
      className={`flex h-14 w-10 shrink-0 items-center justify-center rounded-md border text-2xl font-bold shadow sm:h-16 sm:w-12 ${
        back ? "animate-pulse border-[#d7b45b]/60 text-[#d7b45b] bg-[repeating-linear-gradient(45deg,#142d27_0_6px,#1b3d33_6px_12px)]" : "border-black/20 bg-[#f8f5ec]"
      } ${!back && card?.color === "red" ? "text-red-600" : !back ? "text-slate-900" : ""}`}
      role="img"
      aria-label={back ? "Face-down card" : `${card?.color} card`}
    >
      {back ? "♠" : card?.suit}
    </div>
  );
}

/** Gamble : doubler un gain en devinant la couleur d'une carte (50 % de chances). */
export default function GamblePanel({ g, onChoose, onCollect }: { g: GambleState; onChoose: (c: CardColor) => void; onCollect: () => void }) {
  useEffect(() => {
    if (g.phase !== "result") return;
    const id = window.setTimeout(onCollect, 1800);
    return () => window.clearTimeout(id);
  }, [g.phase, onCollect]);

  return (
    <div
      className="mx-auto mb-2 flex w-full max-w-md items-center gap-2 rounded-xl border border-[#ffd166]/50 bg-[linear-gradient(180deg,rgba(0,0,0,.82),rgba(20,12,4,.9))] p-2 shadow-[0_10px_30px_rgba(0,0,0,.45)] sm:gap-3 sm:p-2.5"
      role="group"
      aria-label="Gamble"
    >
      <PlayingCardFace card={g.phase === "result" ? g.card : g.phase === "flip" ? null : g.card} back={g.phase === "flip"} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black tracking-[0.22em] text-[#ffd166] sm:text-[10px]">
            GAMBLE · {g.rounds} / {GAMBLE_MAX_ROUNDS}
          </p>
          <p className="font-mono text-xs font-black text-white sm:text-sm">◈ {money(g.amount)}</p>
        </div>

        {g.phase === "choose" && (
          <>
            <p className="mt-0.5 truncate text-[10px] text-white/60 sm:text-xs">Double to ◈ {money(g.amount * 2)} · pick a colour</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onChoose("red")}
                className="flex h-9 items-center justify-center gap-1 rounded-lg border border-red-400/40 bg-[linear-gradient(180deg,#dc2626,#991b1b)] text-[11px] font-black tracking-wide text-white shadow-inner transition hover:brightness-110 active:scale-[.98] sm:h-10 sm:text-xs"
              >
                ♥♦ RED
              </button>
              <button
                onClick={() => onChoose("black")}
                className="flex h-9 items-center justify-center gap-1 rounded-lg border border-white/15 bg-[linear-gradient(180deg,#334155,#0f172a)] text-[11px] font-black tracking-wide text-white shadow-inner transition hover:brightness-110 active:scale-[.98] sm:h-10 sm:text-xs"
              >
                ♠♣ BLACK
              </button>
            </div>
          </>
        )}

        {g.phase === "flip" && (
          <p className="mt-1 text-[11px] text-white/70" aria-live="polite">
            You picked {g.guess}. Drawing…
          </p>
        )}

        {g.phase === "result" && (
          <p className={`mt-1 text-[11px] font-bold sm:text-xs ${g.won ? "text-emerald-300" : "text-red-300"}`} aria-live="polite">
            {g.won ? `Doubled to ◈ ${money(g.amount)}.` : "Wrong colour. The win is lost."}
            <span className="ml-1 font-normal text-white/45">Collecting…</span>
          </p>
        )}
      </div>
    </div>
  );
}