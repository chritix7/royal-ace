"use client";

import { money } from "../../lib/game";
import { machineSmall } from "../ui";

type BonusResult = {
  label: string;
  spins: number;
  win: number;
};

export default function BonusResultModal({
  result,
  onContinue,
}: {
  result: BonusResult;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bonus-result-title"
        aria-describedby="bonus-result-total"
        className="relative w-[min(88vw,360px)] rounded-2xl border border-white/20 p-6 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 25%), linear-gradient(135deg, #292b35 0%, #171923 45%, #10121a 100%)",
          boxShadow:
            "0 24px 70px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.50)",
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

        <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
          Bonus complete
        </p>

        <h3
          id="bonus-result-title"
          className="mt-2 text-xl font-black uppercase leading-tight text-[#ead5a3]"
        >
          {result.label}
        </h3>

        <p className="mt-2 text-xs text-white/55">
          {result.spins} free spins played
        </p>

        <div
          id="bonus-result-total"
          className="mt-5 rounded-xl border border-white/10 px-4 py-4"
          style={{
            background:
              "linear-gradient(180deg, #10131c 0%, #080b12 100%)",
            boxShadow:
              "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Total bonus win
          </p>

          <p className="mt-2 break-words font-mono text-3xl font-black tabular-nums text-[#f0dfb7]">
            <span className="text-[#bfa76e]">◈</span>{" "}
            {money(result.win)}
          </p>
        </div>

        <button
          type="button"
          autoFocus
          onClick={onContinue}
          className={`${machineSmall} mt-5 w-full py-3 !border-[#d7b45b]/70 !text-[#f0dfb7]`}
          style={{
            background:
              "linear-gradient(180deg, #49402d 0%, #302a20 50%, #211e19 100%)",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
