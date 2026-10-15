"use client";

import { GAMBLE_MAX_ROUNDS, type CardColor } from "../lib/gamble";
import type { GambleState } from "../lib/useSlots";

const money = (n: number) => n.toLocaleString("en-US");

function PlayingCardFace({ card, back }: { card: GambleState["card"]; back?: boolean }) {
  return (
    <div
      className={`flex h-20 w-14 items-center justify-center rounded-lg border text-3xl font-bold shadow ${
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
  const btn = "rounded-full px-4 py-2 text-xs font-black tracking-wider outline-none transition focus-visible:ring-2 focus-visible:ring-white";
  return (
    <div className="mx-auto mt-3 max-w-md rounded-2xl border border-[#ffd166]/60 bg-black/60 p-3 text-center" role="group" aria-label="Gamble">
      <p className="text-[10px] font-black tracking-[0.3em] text-[#ffd166]">GAMBLE · {g.rounds} / {GAMBLE_MAX_ROUNDS}</p>

      {g.phase === "choose" && (
        <>
          <p className="mt-1 text-xs text-white/70">
            Double ◈ {money(g.amount)} → ◈ {money(g.amount * 2)} · pick a colour (50 / 50)
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            {g.card && <PlayingCardFace card={g.card} />}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={onCollect} className={`${btn} bg-[#ffd166] text-[#10130e] hover:bg-[#ffe08f]`}>COLLECT ◈ {money(g.amount)}</button>
              <button onClick={() => onChoose("red")} className={`${btn} bg-red-600 text-white hover:bg-red-500`}>♥ ♦ RED</button>
              <button onClick={() => onChoose("black")} className={`${btn} bg-slate-800 text-white hover:bg-slate-700`}>♠ ♣ BLACK</button>
            </div>
          </div>
        </>
      )}

      {g.phase === "flip" && (
        <div className="mt-2 flex flex-col items-center gap-2" aria-live="polite">
          <PlayingCardFace card={null} back />
          <p className="text-xs text-white/70">You picked {g.guess}. Drawing…</p>
        </div>
      )}

      {g.phase === "result" && (
        <div className="mt-2 flex flex-col items-center gap-2" aria-live="polite">
          <PlayingCardFace card={g.card} />
          <p className={`text-sm font-bold ${g.won ? "text-emerald-300" : "text-red-300"}`}>
            {g.won ? `Doubled to ◈ ${money(g.amount)}. That is the maximum.` : "Wrong colour. The win is lost."}
          </p>
          <button onClick={onCollect} className={`${btn} bg-[#ffd166] text-[#10130e] hover:bg-[#ffe08f]`}>
            {g.won ? `COLLECT ◈ ${money(g.amount)}` : "OK"}
          </button>
        </div>
      )}
    </div>
  );
}