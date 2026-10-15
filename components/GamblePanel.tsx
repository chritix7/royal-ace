"use client";

import { useEffect } from "react";
import { GAMBLE_MAX_ROUNDS, type CardColor } from "../lib/gamble";
import type { GambleState } from "../lib/useSlots";

const money = (n: number) => n.toLocaleString("en-US");

function Card3D({ card, flipped }: { card: GambleState["card"]; flipped: boolean }) {
  return (
    <div className="[perspective:1200px]">
      <div
        className={`relative h-44 w-32 transition-transform duration-700 ease-out [transform-style:preserve-3d] sm:h-56 sm:w-40 ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Dos de la carte */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border-4 border-[#d7b45b]/70 bg-[repeating-linear-gradient(45deg,#12261f_0_10px,#1b3d33_10px_20px)] text-6xl font-black text-[#d7b45b] shadow-2xl [backface-visibility:hidden] sm:h-56 sm:w-40 sm:text-7xl"
          role="img"
          aria-label="Face-down card"
        >
          ♠
        </div>

        {/* Face de la carte */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-2xl border-4 border-black/20 bg-[#f8f5ec] text-6xl font-black shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] sm:h-56 sm:w-40 sm:text-7xl ${
            card?.color === "red" ? "text-red-600" : "text-slate-900"
          }`}
          role="img"
          aria-label={card ? `${card.color} card` : "Card"}
        >
          {card?.suit ?? ""}
        </div>
      </div>
    </div>
  );
}

/** Gamble : doubler un gain en devinant la couleur d'une carte (50 % de chances). */
export default function GamblePanel({
  g,
  onChoose,
  onCollect,
  onClose,
}: {
  g: GambleState;
  onChoose: (c: CardColor) => void;
  onCollect: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (g.phase !== "result") return;
    const id = window.setTimeout(() => {
      onCollect();
      onClose();
    }, 2200);
    return () => window.clearTimeout(id);
  }, [g.phase, onCollect, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1b1005,#050505_70%)] px-4" role="dialog" aria-label="Gamble">
      <button
        onClick={() => {
          onCollect();
          onClose();
        }}
        aria-label="Close gamble"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/70 backdrop-blur transition hover:border-[#ffd166] hover:text-[#ffd166]"
      >
        ✕
      </button>

      <div className="w-full max-w-sm rounded-3xl border border-[#ffd166]/40 bg-black/55 p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,.65)] sm:p-7">
        <p className="text-[10px] font-black tracking-[0.35em] text-[#ffd166]">GAMBLE · {g.rounds} / {GAMBLE_MAX_ROUNDS}</p>
        <p className="mt-2 font-mono text-3xl font-black text-white sm:text-4xl">◈ {money(g.amount)}</p>
        <p className="mt-1 text-xs text-white/55">Double to ◈ {money(g.amount * 2)}</p>

        <div className="mt-6 flex justify-center">
          <Card3D card={g.card} flipped={g.phase === "result"} />
        </div>

        {g.phase === "choose" && (
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              onClick={() => onChoose("red")}
              className="flex h-14 items-center justify-center rounded-xl border border-red-300/30 bg-[linear-gradient(180deg,#ef4444,#991b1b)] text-sm font-black tracking-widest text-white shadow-lg transition hover:brightness-110 active:scale-[.98]"
            >
              ♥♦ RED
            </button>
            <button
              onClick={() => onChoose("black")}
              className="flex h-14 items-center justify-center rounded-xl border border-white/15 bg-[linear-gradient(180deg,#334155,#020617)] text-sm font-black tracking-widest text-white shadow-lg transition hover:brightness-110 active:scale-[.98]"
            >
              ♠♣ BLACK
            </button>
          </div>
        )}

        {g.phase === "flip" && (
          <p className="mt-6 text-sm text-white/70" aria-live="polite">
            You picked {g.guess}. Drawing…
          </p>
        )}

        {g.phase === "result" && (
          <p className={`mt-6 text-sm font-bold ${g.won ? "text-emerald-300" : "text-red-300"}`} aria-live="polite">
            {g.won ? `Doubled to ◈ ${money(g.amount)}.` : "Wrong colour. The win is lost."}
            <span className="ml-1 font-normal text-white/45">Collecting…</span>
          </p>
        )}
      </div>
    </div>
  );
}