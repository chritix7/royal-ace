"use client";

import { useRef } from "react";
import type { Game } from "../../lib/useBlackjack";
import Sidebar from "../Sidebar";
import { useModalFocus } from "../useModalFocus";
import { control, neutral, signed } from "./styles";

export default function InfoPanel({
  g,
  onClose,
}: {
  g: Game;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const breakdown = g.roundBreakdown;

  useModalFocus(panelRef);

  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close blackjack information"
        onClick={onClose}
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bj-panel-title"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col border-l border-[#d7b45b]/25 bg-[#0d140f] shadow-2xl"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
          }}
        >
          <h2 id="bj-panel-title" className="font-bold text-[#e5c779]">
            Blackjack · Menu
          </h2>

          <button
            type="button"
            onClick={onClose}
            className={`${control} ${neutral} h-10 w-10`}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          }}
        >
          {g.s.phase === "settled" && breakdown && (
            <section className="mb-5 rounded-2xl border border-[#d7b45b]/30 bg-black/20 p-4">
              <h3 className="font-bold text-[#e5c779]">
                Last round
              </h3>

              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-2 text-sm">
                {[
                  ["Main hands", breakdown.main],
                  ["Insurance", breakdown.insurance],
                  ["Perfect Pairs", breakdown.perfectPairs],
                  ["21+3", breakdown.twentyOnePlusThree],
                  ["Round net", breakdown.total],
                ].map(([label, value]) => (
                  <div key={String(label)} className="contents">
                    <dt className="text-white/60">{label}</dt>
                    <dd
                      className={`text-right font-semibold tabular-nums ${
                        Number(value) > 0
                          ? "text-emerald-300"
                          : Number(value) < 0
                          ? "text-red-300"
                          : "text-white/70"
                      }`}
                    >
                      {signed(Number(value))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <Sidebar g={g} />
        </div>
      </div>
    </div>
  );
}
