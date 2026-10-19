"use client";

import { useEffect, useRef } from "react";
import { GAMBLE_MAX_ROUNDS, type CardColor } from "../lib/gamble";
import type { GambleState } from "../lib/useSlots";

const money = (n: number) => n.toLocaleString("en-US");

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
              "repeating-linear-gradient(45deg, #12261f 0 8px, #1b3d33 8px 16px)",
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
  const collectRef = useRef(onCollect);
  const closeRef = useRef(onClose);

  collectRef.current = onCollect;
  closeRef.current = onClose;

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
        className="relative w-full max-w-sm rounded-2xl border border-white/20 p-4 text-center sm:p-6"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 25%), linear-gradient(135deg, #292b35 0%, #171923 45%, #10121a 100%)",
          boxShadow:
            "0 18px 45px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.50)",
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

        <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">
          Private collection
        </p>

        <h3
          id="gamble-title"
          className="mt-2 text-xl font-black tracking-[0.16em] text-[#ead5a3] sm:text-2xl"
        >
          X2 GAMBLE
        </h3>

        <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-white/45">
          ROUND {g.rounds} / {GAMBLE_MAX_ROUNDS}
        </p>

        {/* Afficheur du montant */}
        <div
          className="mt-4 rounded-xl border border-white/10 px-3 py-3"
          style={{
            background: "linear-gradient(180deg, #10131c 0%, #080b12 100%)",
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

        <div className="mt-5 flex justify-center">
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
                className="flex h-14 min-w-0 items-center justify-center gap-1 rounded-xl border border-red-300/25 text-sm font-black tracking-widest text-white outline-none transition-[transform,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-white enabled:active:translate-y-px motion-reduce:transition-none"
                style={{
                  background:
                    "linear-gradient(180deg, #6d1f22 0%, #4c1518 55%, #33100f 100%)",
                  boxShadow:
                    "0 2px 0 #06080d, inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.35)",
                }}
              >
                <span className="text-red-200/90">♥♦</span> RED
              </button>

              <button
                type="button"
                onClick={() => onChoose("black")}
                className="flex h-14 min-w-0 items-center justify-center gap-1 rounded-xl border border-white/15 text-sm font-black tracking-widest text-white outline-none transition-[transform,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-white enabled:active:translate-y-px motion-reduce:transition-none"
                style={{
                  background:
                    "linear-gradient(180deg, #30323c 0%, #20222c 50%, #151720 100%)",
                  boxShadow:
                    "0 2px 0 #06080d, inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 4px rgba(0,0,0,0.35)",
                }}
              >
                <span className="text-white/70">♠♣</span> BLACK
              </button>
            </div>
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