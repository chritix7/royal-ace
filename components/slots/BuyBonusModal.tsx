"use client";

import { money } from "../../lib/game";
import { machineSmall } from "../ui";

export default function BuyBonusModal({
  open,
  freeSpinsLabel,
  bonusPrice,
  balance,
  onClose,
  onBuy,
}: {
  open: boolean;
  freeSpinsLabel: string;
  bonusPrice: number;
  balance: number;
  onClose: () => void;
  onBuy: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-bonus-title"
        className="relative w-[min(88vw,340px)] rounded-2xl border border-white/20 p-6 text-center"
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

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`${machineSmall} flex-1 py-3`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onBuy();
              onBuy();
              onClose();
            }}
            disabled={balance < bonusPrice}
            className={`${machineSmall} flex-1 py-3 !border-[#d7b45b]/70 !text-[#f0dfb7]`}
            style={{
              background:
                "linear-gradient(180deg, #49402d 0%, #302a20 50%, #211e19 100%)",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
