"use client";

import { useEffect, useRef, useState } from "react";
import { GAMBLE_MAX_ROUNDS, type CardColor } from "../lib/gamble";
import { money } from "../lib/game";
import type { GambleState } from "../lib/useSlots";
import { useModalFocus } from "./useModalFocus";

function Card3D({
  card,
  flipped,
}: {
  card: GambleState["card"];
  flipped: boolean;
}) {
  return (
    <div className="[perspective:1200px]">
      <div
        className={`relative h-40 w-28 transition-transform duration-700 ease-out [transform-style:preserve-3d] sm:h-48 sm:w-36 ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Dos de carte */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl border border-[#d7b45b]/70 text-5xl font-black text-[#d7b45b] [backface-visibility:hidden] sm:h-48 sm:w-36 sm:text-6xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(240,211,139,0.18), transparent 60%), repeating-linear-gradient(45deg, #1a1410 0 8px, #2a2018 8px 16px)",
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
          role="img"
          aria-label="Face-down card"
        >
          ♠
        </div>

        {/* Face visible */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-xl border border-black/25 bg-[#f8f5ec] text-5xl font-black [backface-visibility:hidden] [transform:rotateY(180deg)] sm:h-48 sm:w-36 sm:text-6xl ${
            card?.color === "red" ? "text-red-600" : "text-slate-900"
          }`}
          style={{
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.70)",
          }}
          role="img"
          aria-label={card ? `${card.color} card` : "Card"}
        >
          {card?.suit ?? ""}
        </div>
      </div>
    </div>
  );
}

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
    const canContinue = g.won === true && g.rounds < GAMBLE_MAX_ROUNDS;
  // Cards drawn while this panel is open (newest last, max 5).
  const [seen, setSeen] = useState<NonNullable<GambleState["card"]>[]>([]);
  const lastCard = useRef<GambleState["card"]>(null);
  useEffect(() => {
    if (g.phase === "result" && g.card && g.card !== lastCard.current) {
      lastCard.current = g.card;
      const c = g.card;
      setSeen((v) => [...v, c].slice(-5));
    }
  }, [g.phase, g.card]);
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;
  useEffect(() => {
    if (g.phase !== "choose") return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "r") chooseRef.current("red");
      else if (k === "b") chooseRef.current("black");
      else if (k === "c") {
        collectRef.current();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [g.phase]);
  const collectRef = useRef(onCollect);
  const closeRef = useRef(onClose);
  const panelRef = useRef<HTMLDivElement>(null);

  collectRef.current = onCollect;
  closeRef.current = onClose;

  useModalFocus(panelRef, {
    onClose: () => {
      onCollect();
      onClose();
    },
  });

  useEffect(() => {
    if (g.phase !== "result" || canContinue) return;

    const id = window.setTimeout(() => {
      collectRef.current();
      closeRef.current();
    }, 2200);

    return () => window.clearTimeout(id);
  }, [g.phase, canContinue]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gamble-title"
    >
      <button
        type="button"
        onClick={() => {
          onCollect();
          onClose();
        }}
        aria-label="Close gamble"
        className="absolute right-4 top-[max(env(safe-area-inset-top),1rem)] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/70 backdrop-blur transition hover:border-[#d7b45b] hover:text-[#d7b45b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779]"
      >
        ✕
      </button>

            <div
        ref={panelRef}
        className="blur-in relative w-full max-w-sm rounded-2xl border border-[#d7b45b]/45 p-4 text-center sm:p-6"
        style={{
          background: "linear-gradient(180deg, rgba(255,236,170,0.06), transparent 30%), linear-gradient(135deg, #221b14 0%, #120e0b 50%, #0b0908 100%)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.7), 0 0 60px rgba(240,211,139,0.12), inset 0 1px 0 rgba(255,236,170,0.2)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent)",
          }}
        />

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">
          Double or nothing
        </p>

        <h3
          id="gamble-title"
          className="font-display mt-2 text-2xl font-bold tracking-[0.16em] text-[#f0d38b] sm:text-3xl"
        >
          GAMBLE ×2
        </h3>

        <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-white/45">
          ROUND {g.rounds} / {GAMBLE_MAX_ROUNDS}
        </p>

        {/* Afficheur du montant */}
        <div
          className="mt-4 rounded-xl border border-[#d7b45b]/20 px-3 py-3"
          style={{
            background: "linear-gradient(180deg, #0d0b09 0%, #060504 100%)",
            boxShadow:
              "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">
            Current win
          </p>

          <p className="mt-1 break-words font-mono text-2xl font-black tabular-nums text-[#f0dfb7] sm:text-3xl">
            <span className="text-[#bfa76e]">◈</span> {money(g.amount)}
          </p>

          <p className="mt-1 text-[10px] text-white/50">
            Double to ◈ {money(g.amount * 2)}
          </p>
        </div>

        {/* Last cards drawn, newest on the right */}
        <div className="mt-3 flex h-7 items-center justify-center gap-1.5" aria-label="Previous cards">
          <span className="mr-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">Last</span>
          {seen.length === 0 && <span className="text-[10px] text-white/25">—</span>}
          {seen.map((c, i) => (
            <span
              key={i}
              className={`flex h-7 w-5 items-center justify-center rounded-[3px] border border-black/30 text-xs font-black ${c.color === "red" ? "text-[#c81e3a]" : "text-[#111]"}`}
              style={{ background: "linear-gradient(180deg,#fffaf0,#e9e2d0)" }}
            >
              {c.suit}
            </span>
          ))}
        </div>

        <div className="mt-3 flex justify-center">
          <Card3D
            card={g.card}
            flipped={
              g.phase === "result" ||
              (g.phase === "choose" && g.won === true)
            }
          />
        </div>

        {g.phase === "choose" && (
          <>
            <p className="mt-4 text-xs text-white/60">
              {g.won === true
                ? "Choose again to double."
                : "Pick a colour · 50 / 50"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChoose("red")}
                className="lux-btn lux-btn--red h-14 min-w-0 text-sm tracking-widest"
              >
                <span className="text-red-200/90">♥♦</span> RED
              </button>

              <button
                type="button"
                onClick={() => onChoose("black")}
                className="lux-btn lux-btn--black h-14 min-w-0 text-sm tracking-widest"
              >
                <span className="text-white/70">♠♣</span> BLACK
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                onCollect();
                onClose();
              }}
              className="lux-btn lux-btn--gold mt-3 h-12 w-full text-sm tracking-widest"
            >
              COLLECT ◈ {money(g.amount)}
            </button>
            <p className="mt-2 hidden text-[10px] text-white/40 sm:block">Keys: R red · B black · C collect</p>
          </>
        )}

        {g.phase === "flip" && (
          <p
            className="mt-5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70"
            style={{
              background: "linear-gradient(180deg, #10131c 0%, #080b12 100%)",
            }}
            aria-live="polite"
          >
            You picked {g.guess}. Drawing…
          </p>
        )}

        {g.phase === "result" && (
          <div
            className="mt-5 rounded-lg border px-3 py-2"
            style={{
              background:
                g.won
                  ? "linear-gradient(180deg, #1b2c29 0%, #101a19 100%)"
                  : "linear-gradient(180deg, #2c1b1b 0%, #170f0f 100%)",
              borderColor: g.won
                ? "rgba(110,231,183,0.35)"
                : "rgba(248,113,113,0.35)",
            }}
            aria-live="polite"
          >
            <p
              className={`text-xs font-black tracking-wide ${
                g.won ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {g.won
                ? `DOUBLED TO ◈ ${money(g.amount)}`
                : "WRONG COLOUR · WIN LOST"}
            </p>

            {!canContinue && (
              <p className="mt-1 text-[10px] text-white/45">
                Collecting…
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}