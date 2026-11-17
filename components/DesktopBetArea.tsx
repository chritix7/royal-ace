"use client";

import { MIN_BET, REFILL, money } from "../lib/game";
import type { Game } from "../lib/useBlackjack";
import { ChipStack } from "./ui";
import SideWinBadge from "./SideWinBadge";

// Same button base as the classic table's action buttons.
const mobileAction =
  "inline-flex h-10 w-full items-center justify-center rounded-xl border px-1 text-center text-[11px] font-bold uppercase tracking-wide leading-none outline-none shadow-[0_2px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-[filter,transform,background,color,border-color] focus-visible:ring-2 focus-visible:ring-[#e5c779] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101713] enabled:active:translate-y-px enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 lg:h-11 sm:text-sm";

type SidePillProps = {
  label: string;
  amount: number;
  disabled: boolean;
  onOpen: () => void;
};

/**
 * Felt-engraved side-bet pill — looks recessed into the felt with a
 * gold inner ring. The whole pill is a button that opens the shared
 * SideBetModal (chip picker) so the player can stake without the
 * clumsy +/− dance.
 */
function SidePill({
  label,
  amount,
  disabled,
  onOpen,
}: SidePillProps) {
  const active = amount > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      aria-label={`${label} — stake ${amount}`}
      className="group relative flex w-full min-w-0 items-center justify-between gap-2 rounded-full px-3 py-1.5 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:translate-y-px disabled:cursor-not-allowed lg:w-36 lg:py-1"
      style={{
        background: active
          ? "radial-gradient(ellipse at 50% 20%, rgba(229, 199, 121, 0.18) 0%, rgba(5, 10, 7, 0.6) 60%, rgba(5, 10, 7, 0.75) 100%)"
          : "radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.03) 0%, rgba(5, 10, 7, 0.6) 70%, rgba(5, 10, 7, 0.75) 100%)",
        // Recessed look: 1px gold outer ring + inner dark shadow (engraved into the felt)
        boxShadow: active
          ? "inset 0 0 0 1px rgba(229, 199, 121, 0.55), inset 0 2px 5px rgba(0, 0, 0, 0.75), 0 0 14px rgba(229, 199, 121, 0.15), 0 1px 0 rgba(229, 199, 121, 0.1)"
          : "inset 0 0 0 1px rgba(229, 199, 121, 0.25), inset 0 2px 5px rgba(0, 0, 0, 0.75), 0 1px 0 rgba(229, 199, 121, 0.06)",
        opacity: disabled && !active ? 0.7 : 1,
      }}
    >
      <div className="min-w-0 text-left">
        <p
          className="text-[9px] font-black uppercase tracking-[0.18em] sm:text-[10px]"
          style={{
            color: "#e5c779",
            textShadow: active
              ? "0 0 4px rgba(229, 199, 121, 0.6), 0 1px 0 rgba(0, 0, 0, 0.85)"
              : "0 1px 0 rgba(0, 0, 0, 0.85)",
          }}
        >
          {label}
        </p>
        <p
          className="text-[10px] font-bold tabular-nums sm:text-xs"
          style={{
            color: active ? "#f0e5c7" : "rgba(255, 255, 255, 0.6)",
            textShadow: "0 1px 0 rgba(0, 0, 0, 0.85)",
          }}
        >
          {amount > 0 ? `◈ ${money(amount)}` : disabled ? "No bet" : "Tap to stake"}
        </p>
      </div>

      <span
        aria-hidden
        className={`shrink-0 text-xs ${
          active ? "text-[#e5c779]" : "text-white/40 group-hover:text-[#d7b45b]"
        }`}
      >
        ▸
      </span>
    </button>
  );
}


/**
 * Desktop betting area printed on the felt: PP pill · BET circle · 21+3
 * pill, then the Deal key (or Hit / Stand / Double / Split / Surrender
 * during a hand). Shared by the classic table and the Focus view so both
 * look and behave exactly the same. Desktop only (lg:+).
 */
export default function DesktopBetArea({
  g,
  onOpenSide,
}: {
  g: Game;
  onOpenSide: (which: "pp" | "t3") => void;
}) {
  const {
    s,
    roundBreakdown,
    canBet,
    playing,
    canDouble,
    canSplit,
    canSurrender,
    outOfChips,
    stake,
    pileAmount,
    setBetTo,
    deal,
    hit,
    stand,
    double,
    split,
    surrender,
    refill,
  } = g;

  return (
    <>
{/* Desktop: bet circle between the two side-bet pills. */}
{canBet && (
<div className="relative hidden lg:block">
{/* Bet circle between the two side bets, on every screen size. */}
<div className="relative flex w-full items-center justify-center gap-2 lg:gap-4">

  <div className="order-2 shrink-0">
    {/* BET circle — recessed into the felt with a double gold ring.
        When there are chips on the table, the pile IS the content of
        the circle, growing taller as the bet grows. The amount sits
        below as a small gold label. */}
    <div className="flex flex-col items-center">
      {/* Tapping the circle clears the bet (a small × shows it can). */}
      <button
        type="button"
        onClick={() => setBetTo(0)}
        disabled={!canBet || s.busy || s.bet === 0}
        aria-label={canBet && s.bet > 0 ? `Clear bet of ${money(s.bet)}` : "Bet"}
        className="relative flex h-16 w-16 touch-manipulation items-end justify-center overflow-visible rounded-full p-0 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:scale-[0.97] disabled:cursor-default sm:h-24 sm:w-24 lg:h-16 lg:w-16"
        style={{
          background: canBet
            ? "radial-gradient(circle at 50% 30%, rgba(229, 199, 121, 0.22) 0%, rgba(5, 10, 7, 0.75) 55%, rgba(5, 10, 7, 0.9) 100%)"
            : "radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.04) 0%, rgba(5, 10, 7, 0.75) 60%, rgba(5, 10, 7, 0.9) 100%)",
          boxShadow: canBet
            ? [
                "inset 0 0 0 1px rgba(229, 199, 121, 0.85)",
                "inset 0 0 0 3px rgba(0, 0, 0, 0.6)",
                "inset 0 0 0 4px rgba(229, 199, 121, 0.35)",
                "inset 0 3px 8px rgba(0, 0, 0, 0.75)",
                "0 0 24px rgba(229, 199, 121, 0.25)",
                "0 1px 0 rgba(229, 199, 121, 0.15)",
              ].join(", ")
            : [
                "inset 0 0 0 1px rgba(229, 199, 121, 0.4)",
                "inset 0 0 0 3px rgba(0, 0, 0, 0.6)",
                "inset 0 0 0 4px rgba(229, 199, 121, 0.15)",
                "inset 0 3px 8px rgba(0, 0, 0, 0.75)",
                "0 1px 0 rgba(229, 199, 121, 0.08)",
              ].join(", "),
        }}
      >
        {/* BET label at the top of the circle */}
        <p
          className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.22em] sm:top-2.5 sm:text-[10px]"
          style={{
            color: "#e5c779",
            textShadow: "0 0 4px rgba(229, 199, 121, 0.6), 0 1px 0 rgba(0, 0, 0, 0.9)",
          }}
        >
          Bet
        </p>

        {/* The chip pile fills the circle; when empty, show the amount
            as a placeholder so the circle isn't visually dead. */}
        {pileAmount > 0 ? (
          <div className="pointer-events-none mb-2 flex items-end justify-center sm:mb-2.5">
            <ChipStack amount={pileAmount} />
          </div>
        ) : (
          <p
            className="pointer-events-none mb-3 text-sm font-black tabular-nums text-white/50 sm:mb-4 sm:text-base"
            style={{ textShadow: "0 1px 0 rgba(0, 0, 0, 0.9)" }}
          >
            ◈ 0
          </p>
        )}
        {canBet && s.bet > 0 && !s.busy && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#d7b45b]/60 bg-[#0b100e] text-[11px] font-black leading-none text-[#e5c779] shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
          >
            ×
          </span>
        )}
      </button>

      {/* Spot count only — the "◈ amount" that lived here was a
          duplicate of the Deal button's "DEAL · ◈ N" readout. The
          chip pile inside the BET circle already shows the amount
          visually, and the Deal button spells it out, so dropping
          this extra ◈ line declutters the felt. */}
      {s.settings.spots > 1 && (
        <p className="mt-1.5 text-center text-[9px] text-white/50">
          × {s.settings.spots} spots
        </p>
      )}
    </div>
  </div>

  <div className="contents">
    <div className="relative order-1 min-w-0 max-w-[150px] flex-1 lg:w-36 lg:flex-none">
      <SidePill
        label="PP"
        amount={s.ppBet}
        disabled={!canBet || s.busy}
        onOpen={() => onOpenSide("pp")}
      />
      {roundBreakdown && (
        <SideWinBadge net={roundBreakdown.perfectPairs} />
      )}
    </div>

    <div className="relative order-3 min-w-0 max-w-[150px] flex-1 lg:w-36 lg:flex-none">
      <SidePill
        label="21+3"
        amount={s.t3Bet}
        disabled={!canBet || s.busy}
        onOpen={() => onOpenSide("t3")}
      />
      {roundBreakdown && (
        <SideWinBadge net={roundBreakdown.twentyOnePlusThree} />
      )}
    </div>
  </div>
</div>

</div>
)}

{/* Desktop-only: the hand controls live INSIDE the felt at the
    bet-zone slot. On lg+ we hide the sticky bar below the felt
    and put Deal (betting / settled) or the five action buttons
    (playing) here, framed by a subtle dark pill so it reads as a
    pro casino action strip rather than loose buttons on felt. */}
{s.phase !== "insurance" && (
  <div className="relative z-10 hidden w-full max-w-3xl items-center justify-center lg:flex">
    {canBet ? (
      outOfChips ? (
        <button
          onClick={refill}
          className={`${mobileAction} border-[#d7b45b]/60 bg-gradient-to-b from-[#e5c779] to-[#c89a3f] text-[#10130e] sm:w-auto sm:px-4`}
        >
          Out of chips · take a ◈ {REFILL} refill
        </button>
      ) : (
        <button
          onClick={deal}
          disabled={s.bet < MIN_BET || stake > s.balance}
          className={`${mobileAction} max-w-sm border-[#d7b45b]/70 bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] text-[#10130e] sm:w-auto sm:px-10 lg:min-w-[260px] ${
            s.bet >= MIN_BET && stake <= s.balance ? "animate-deal-ready" : ""
          }`}
        >
          {s.phase === "settled" ? "Deal again" : "Deal"} · ◈ {money(stake)}
        </button>
      )
    ) : (
      <div className="flex w-full items-stretch justify-center gap-2 rounded-2xl border border-[#d7b45b]/15 bg-black/40 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_6px_18px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <button
          onClick={hit}
          disabled={!playing}
          className={`${mobileAction} flex-1 border-[#d7b45b]/60 bg-gradient-to-b from-[#e5c779] to-[#c89a3f] text-[#10130e] sm:w-auto sm:px-4`}
        >
          Hit
        </button>
        <button
          onClick={stand}
          disabled={!playing}
          className={`${mobileAction} flex-1 border-white/15 bg-white/[0.04] text-white hover:border-[#d7b45b]/50 hover:text-[#e5c779] sm:w-auto sm:px-4`}
        >
          Stand
        </button>
        <button
          onClick={double}
          disabled={!canDouble}
          className={`${mobileAction} flex-1 border-[#d7b45b]/50 bg-[#d7b45b]/10 text-[#e5c779] hover:bg-[#d7b45b]/20 sm:w-auto sm:px-4`}
        >
          Double
        </button>
        <button
          onClick={split}
          disabled={!canSplit}
          className={`${mobileAction} flex-1 border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 sm:w-auto sm:px-4`}
        >
          Split
        </button>
        <button
          onClick={surrender}
          disabled={!canSurrender}
          className={`${mobileAction} flex-1 border-white/10 bg-white/[0.02] text-white/60 hover:border-red-300/40 hover:text-red-200 sm:w-auto sm:px-4`}
        >
          Surrender
        </button>
      </div>
    )}
  </div>
)}
    </>
  );
}
