"use client";

import { money } from "../../lib/game";
import { BONUS_PRICE_MULT } from "../../lib/slots";
import CountUp from "../CountUp";
import CoinRain from "../CoinRain";

type BonusResult = {
  label: string;
  spins: number;
  win: number;
  bet: number;
  retriggers: number;
  best: number;
  bought: boolean;
};

/** End-of-bonus summary: total, multiple of the bet and a short recap. */
export default function BonusResultModal({
  result,
  onContinue,
}: {
  result: BonusResult;
  onContinue: () => void;
}) {
  const x = result.bet > 0 ? result.win / result.bet : 0;
  // A bought bonus is judged against its price, a natural one against the bet.
  const k = result.bought ? x / BONUS_PRICE_MULT : x / 8;
  const tier = k >= 6 ? "Legendary" : k >= 2.5 ? "Huge" : k >= 1 ? "Great" : x > 0 ? "Nice" : "Tough";
  const hot = k >= 1;
  return (
    <div className="safe-y backdrop-in fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {hot && <CoinRain count={x >= 20 ? 60 : 34} />}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bonus-result-title"
        aria-describedby="bonus-result-total"
        className="blur-in relative w-[min(90vw,400px)] rounded-2xl border border-[#d7b45b]/45 p-6 text-center"
        style={{
          background: "linear-gradient(180deg, rgba(255,236,170,0.06), transparent 30%), linear-gradient(135deg, #221b14 0%, #120e0b 50%, #0b0908 100%)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.7), 0 0 60px rgba(240,211,139,0.12), inset 0 1px 0 rgba(255,236,170,0.2)",
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">
          {result.bought ? "Bought bonus complete" : "Bonus complete"}
        </p>
        <h3 id="bonus-result-title" className="font-display mt-2 text-2xl font-bold uppercase leading-tight text-[#f0d38b]">
          {result.label}
        </h3>

        <div
          id="bonus-result-total"
          className="mt-5 rounded-xl border border-[#d7b45b]/25 px-4 py-4"
          style={{ background: "linear-gradient(180deg, #0d0b09 0%, #060504 100%)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)" }}
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Total bonus win</p>
          <p className="mt-2 break-words font-mono text-4xl font-black tabular-nums text-[#fff1bf] [text-shadow:0_0_18px_rgba(240,211,139,0.45)]">
            <span className="text-2xl text-[#bfa76e]">◈</span> <CountUp value={result.win} format={money} duration={1400} />
          </p>
          <p className={`mt-2 text-sm font-black uppercase tracking-[0.2em] ${hot ? "text-[#ffd166]" : "text-white/55"}`}>
            {`${tier} · ${x >= 10 ? Math.round(x) : x.toFixed(1)}× the bet${result.bought ? ` · price ${BONUS_PRICE_MULT}×` : ""}`}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["Spins", String(result.spins)],
            ["Retriggers", String(result.retriggers)],
            ["Best spin", `◈ ${money(result.best)}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/[0.06] bg-black/30 px-2 py-2">
              <dt className="text-[9px] uppercase tracking-[0.15em] text-white/40">{k}</dt>
              <dd className="mt-0.5 font-mono text-sm font-bold text-white">{v}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          autoFocus
          onClick={onContinue}
          className="lux-btn lux-btn--gold mt-5 w-full py-3.5 text-sm tracking-[0.2em]"
        >
          COLLECT
        </button>
      </div>
    </div>
  );
}
