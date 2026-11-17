"use client";

import { useEffect } from "react";
import { money } from "../../lib/game";

export default function BuyBonusModal({
  open,
  freeSpinsLabel,
  bonusPrice,
  balance,
  onClose,
  onBuy,
  spins,
  mult,
}: {
  spins: number;
  mult: number;
  open: boolean;
  freeSpinsLabel: string;
  bonusPrice: number;
  balance: number;
  onClose: () => void;
  onBuy: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const short = balance < bonusPrice;

  return (
    <div
      className="backdrop-in fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-bonus-title"
        className="blur-in relative w-[min(88vw,340px)] rounded-2xl border border-white/20 p-6 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 25%), linear-gradient(135deg, #292b35 0%, #171923 45%, #10121a 100%)",
          boxShadow:
            "0 24px 70px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.50)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reflet discret sur le bord supérieur */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent)",
          }}
        />

        <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
          Bonus purchase
        </p>

        <h3
          id="buy-bonus-title"
          className="mt-2 text-xl font-black leading-tight text-[#ead5a3]"
        >
          Start {freeSpinsLabel}?
        </h3>

        <div
          className="mx-auto mt-4 rounded-xl border border-white/10 px-4 py-3"
          style={{
            background:
              "linear-gradient(180deg, #10131c 0%, #080b12 100%)",
            boxShadow:
              "inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Price
          </p>

          <p className="mt-1 font-mono text-3xl font-black tabular-nums text-[#f0dfb7]">
            <span className="text-[#bfa76e]">◈</span>{" "}
            {money(bonusPrice)}
          </p>
        </div>

        <ul className="mt-4 space-y-1.5 text-left text-[12.5px] leading-5 text-white/70">
          <li className="flex gap-2"><span className="text-[#e5c779]">✦</span> {spins} free spins start right away</li>
          <li className="flex gap-2"><span className="text-[#e5c779]">✦</span> Every win is multiplied ×{mult}, retriggers included</li>
          <li className="flex gap-2"><span className="text-[#e5c779]">✦</span> Average return about 95% of the price: results swing a lot</li>
        </ul>
        {short && <p className="mt-3 text-[12px] text-red-300">Not enough chips for this bonus at the current bet.</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="lux-btn flex-1 py-3 text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onBuy();
            }}
            disabled={balance < bonusPrice}
            className="lux-btn lux-btn--gold flex-1 py-3 text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
