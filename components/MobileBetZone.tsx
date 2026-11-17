"use client";

import type { ReactNode } from "react";
import { money } from "../lib/game";
import ChipRail from "./ChipRail";
import { ChipStack } from "./ui";

/**
 * Betting area of the classic table on phones and tablets, laid out the
 * way a real blackjack layout is printed: the main bet circle in the
 * middle with the two smaller side-bet circles on either side, and the
 * chip tray underneath. Shown only while bets are open; during a hand
 * the felt belongs to the cards.
 *
 * - Main circle: the chip pile of the bet; tapping it clears the bet.
 * - Side circles: tap to stake Perfect Pairs / 21+3 (opens the picker).
 * - Chip tray: five denominations, arrows slide through the range.
 */

type Heat = "hot" | "cold" | "neutral";

const RING_IDLE = [
  "inset 0 0 0 1px rgba(229,199,121,0.55)",
  "inset 0 0 0 3px rgba(0,0,0,0.55)",
  "inset 0 0 0 4px rgba(229,199,121,0.18)",
  "inset 0 3px 8px rgba(0,0,0,0.75)",
].join(", ");

const RING_ACTIVE = [
  "inset 0 0 0 1px rgba(240,211,139,0.95)",
  "inset 0 0 0 3px rgba(0,0,0,0.55)",
  "inset 0 0 0 4px rgba(229,199,121,0.4)",
  "inset 0 3px 8px rgba(0,0,0,0.7)",
  "0 0 18px rgba(229,199,121,0.28)",
].join(", ");

function Spot({
  size,
  label,
  active,
  onClick,
  disabled,
  ariaLabel,
  corner,
  children,
}: {
  size: "main" | "side";
  label: string;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  corner?: ReactNode;
  children: ReactNode;
}) {
  const main = size === "main";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`relative flex shrink-0 touch-manipulation flex-col items-center justify-end overflow-visible rounded-full p-0 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:scale-[0.96] disabled:cursor-default ${
        main ? "h-[62px] w-[62px] pb-1.5" : "h-12 w-12 pb-1.5"
      }`}
      style={{
        background: active
          ? "radial-gradient(circle at 50% 30%, rgba(229,199,121,0.24) 0%, rgba(5,10,7,0.72) 58%, rgba(5,10,7,0.9) 100%)"
          : "radial-gradient(circle at 50% 30%, rgba(229,199,121,0.1) 0%, rgba(5,10,7,0.7) 60%, rgba(5,10,7,0.88) 100%)",
        boxShadow: active ? RING_ACTIVE : RING_IDLE,
      }}
    >
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 font-black uppercase ${
          main ? "top-[7px] text-[8px] tracking-[0.24em]" : "top-[6px] text-[7px] tracking-[0.12em]"
        }`}
        style={{
          color: "#e5c779",
          textShadow: "0 0 4px rgba(229,199,121,0.5), 0 1px 0 rgba(0,0,0,0.9)",
        }}
      >
        {label}
      </span>
      {children}
      {corner}
    </button>
  );
}

function HeatMark({ heat }: { heat: Heat }) {
  if (heat === "neutral") return null;
  return (
    <span
      aria-hidden
      className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white/15 bg-[#0b100e] text-[8px] leading-none"
    >
      {heat === "hot" ? "🔥" : "❄"}
    </span>
  );
}

function SideAmount({ amount }: { amount: number }) {
  return amount > 0 ? (
    <span className="pointer-events-none text-[11px] font-black tabular-nums leading-none text-[#f5d778]">
      {money(amount)}
    </span>
  ) : (
    <span className="pointer-events-none text-sm font-black leading-none text-[#e5c779]/45">+</span>
  );
}

export default function MobileBetZone({
  bet,
  pileAmount,
  ppBet,
  t3Bet,
  heat,
  busy,
  canAddChip,
  onAddChip,
  onClearBet,
  onOpenSide,
  spots,
}: {
  bet: number;
  pileAmount: number;
  ppBet: number;
  t3Bet: number;
  heat: { pp: Heat; t3: Heat };
  busy: boolean;
  canAddChip: (value: number) => boolean;
  onAddChip: (value: number) => void;
  onClearBet: () => void;
  onOpenSide: (which: "pp" | "t3") => void;
  spots: number;
}) {
  return (
    <div className="relative z-10 flex w-full flex-col items-center gap-2.5 lg:hidden">
      {/* Printed layout: side bet · main bet · side bet */}
      <div className="flex items-center justify-center gap-6">
        <Spot
          size="side"
          label="PP"
          active={ppBet > 0}
          onClick={() => onOpenSide("pp")}
          disabled={busy}
          ariaLabel={`Perfect Pairs — stake ${ppBet}`}
          corner={<HeatMark heat={heat.pp} />}
        >
          <SideAmount amount={ppBet} />
        </Spot>

        <Spot
          size="main"
          label="Bet"
          active={bet > 0}
          onClick={onClearBet}
          disabled={busy || bet === 0}
          ariaLabel={bet > 0 ? `Clear bet of ${money(bet)}` : "Bet"}
          corner={
            bet > 0 && !busy ? (
              <span
                aria-hidden
                className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#d7b45b]/60 bg-[#0b100e] text-[10px] font-black leading-none text-[#e5c779] shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
              >
                ×
              </span>
            ) : null
          }
        >
          {pileAmount > 0 ? (
            <span className="pointer-events-none flex origin-bottom scale-[0.72] items-end justify-center">
              <ChipStack amount={pileAmount} />
            </span>
          ) : (
            <span className="pointer-events-none mb-1 text-[11px] font-black text-white/40">◈ 0</span>
          )}
        </Spot>

        <Spot
          size="side"
          label="21+3"
          active={t3Bet > 0}
          onClick={() => onOpenSide("t3")}
          disabled={busy}
          ariaLabel={`21+3 — stake ${t3Bet}`}
          corner={<HeatMark heat={heat.t3} />}
        >
          <SideAmount amount={t3Bet} />
        </Spot>
      </div>

      {spots > 1 && (
        <p className="-mt-1.5 text-[9px] text-white/50">× {spots} spots</p>
      )}

      {/* Chip tray: an inset rail, like the chip well on a real table */}
      <div className="w-full max-w-[340px] rounded-full border border-[#d7b45b]/20 bg-gradient-to-b from-black/50 to-black/25 px-1 py-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.65),0_1px_0_rgba(229,199,121,0.08)]">
        <ChipRail
          visibleCount={5}
          size="sm"
          onPick={onAddChip}
          disabledFor={(value) => busy || !canAddChip(value)}
        />
      </div>
    </div>
  );
}
