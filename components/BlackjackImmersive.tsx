"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { handValue, isBlackjack } from "../lib/blackjack";
import {
  CHIPS,
  CHIP_BG,
  MIN_BET,
  REFILL,
  tableBg,
  money,
} from "../lib/game";
import type { DealFlightEvent, Game } from "../lib/useBlackjack";
import { useSession } from "../lib/sessionStore";
import { ChipStack, Counter, SideBet, sideBetStep } from "./ui";
import PlayingCard from "./PlayingCard";
import CardFlight from "./CardFlight";
import HandSpotBadge from "./HandSpotBadge";
import SideNotePill from "./SideNotePill";
import SideWinBadge from "./SideWinBadge";
import Confetti from "./Confetti";
import DealerShoe from "./DealerShoe";
import ShuffleAnimation from "./ShuffleAnimation";
import VegasFeltOverlay from "./VegasFeltOverlay";
import InfoPanel from "./blackjack-immersive/InfoPanel";
import ImmersiveSidePill from "./blackjack-immersive/ImmersiveSidePill";
import ResultRail from "./blackjack-immersive/ResultRail";
import { getShoeStatus } from "./blackjack-immersive/getShoeStatus";
import { control, gold, neutral, signed } from "./blackjack-immersive/styles";


export default function BlackjackImmersive({
  g,
  onClose,
}: {
  g: Game;
  onClose: () => void;
}) {
  const {
    s,
    roundBreakdown,
    canBet,
    playing,
    canDouble,
    canSplit,
    canSurrender,
    advice,
    dealerVal,
    compact,
    stake,
    spots,
    sides,
    back,
    pileAmount,
    outOfChips,
    dealEvents,
    consumeDealEvent,
    addChip,
    setBetTo,
    adjustSide,
    deal,
    hit,
    stand,
    double,
    split,
    surrender,
    refill,
  } = g;

  const session = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editBet, setEditBet] = useState(s.phase === "betting");
  const [resultOpen, setResultOpen] = useState(false);

  // Card-flight motion is handled by the dedicated CardFlight layer
  // (see <CardFlight /> below). Keeping the state out of this component
  // makes sure the classic Table view can share the exact same system.

  const bettingOpen =
    canBet && (editBet || s.phase === "betting");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();

      if (resultOpen) setResultOpen(false);
      else if (menuOpen) setMenuOpen(false);
      else onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, resultOpen, onClose]);

  const tableStyle = {
  "--bj-card-h": compact
    ? "clamp(46px, 9.5dvh, 96px)"
    : "clamp(52px, 12dvh, 124px)",
} as CSSProperties;

  const handCount = Math.max(1, s.hands.length);

const maxHandCards = Math.max(
  2,
  ...s.hands.map((hand) => hand.cards.length)
);

const playerCardStyle = (
  compact
    ? {
        "--bj-card-h": `min(
          14dvh,
          118px,
          calc(
            (100vw - ${32 + handCount * 24}px) /
            ${handCount * (0.44 * maxHandCards + 0.28)}
          )
        )`,
      }
    : {}
) as CSSProperties;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex h-[100dvh] flex-col overflow-hidden bg-[#080e0a] text-white">
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-[#d7b45b]/20 px-3 pb-2 sm:px-5"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0.5rem)",
        }}
      >
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black tracking-wider text-[#e5c779] sm:text-base">
            ROYAL ACE
            <span className="hidden text-white/50 sm:inline">
              {" "}· BLACKJACK
            </span>
          </h2>

          <p className="hidden text-[10px] text-white/40 sm:block">
            {s.settings.decks} decks ·{" "}
            {s.settings.h17 ? "H17" : "S17"} · Blackjack{" "}
            {s.settings.bj65 ? "6:5" : "3:2"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-white/40">
              Chips
            </p>
            <p className="text-sm font-bold tabular-nums text-[#e5c779] sm:text-lg">
              ◈ <Counter value={s.balance} />
            </p>
          </div>

          <div className="hidden text-right md:block">
            <p className="text-[9px] uppercase tracking-wider text-white/40">
              Today
            </p>
            <p
              className={`text-sm font-semibold tabular-nums ${
                session.bj.net >= 0
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            >
              {signed(session.bj.net)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`${control} ${neutral}`}
            aria-label="Open rules, stats and round breakdown"
          >
            Menu
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`${control} ${neutral} w-10`}
            aria-label="Exit immersive mode"
          >
            ✕
          </button>
        </div>
      </header>

      <main
        style={tableStyle}
        className={`felt-texture relative isolate grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden ${tableBg(s.settings)}`}
      >
        {s.settings.theme === "vegas" && <VegasFeltOverlay />}
        {s.celebrate > 0 && (
  <Confetti key={s.celebrate} />
)}

<DealerShoe
  className="absolute -right-[38px] -top-[14px] z-0 hidden md:block"
  status={getShoeStatus(g)}
  dealTick={s.dealTick}
  fillPct={g.shoePct}
/>

{/* Mobile shoe — scaled-down version so the deal flight has a
    visible source on phones and the ramp animation still plays. */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute right-[-3px] top-2 z-0 origin-top-right scale-[0.45] md:hidden"
>
  <DealerShoe
    status={getShoeStatus(g)}
    dealTick={s.dealTick}
    fillPct={g.shoePct}
  />
</div>



<CardFlight
  dealEvents={dealEvents}
  consumeDealEvent={consumeDealEvent}
  back={back}
  compact={compact}
  fit
/>

                <div className="relative flex min-h-0 flex-col items-center justify-center gap-2 overflow-y-auto overflow-x-hidden px-3 py-2">

          {/* Score du croupier */}
          {s.dealer.length > 0 && (
            <div className="relative z-20">
              <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] font-bold text-white sm:text-xs">
                {s.hole && isBlackjack(s.dealer)
                  ? "Blackjack"
                  : dealerVal.soft && dealerVal.total < 21 && s.hole
                    ? `${dealerVal.total - 10}/${dealerVal.total}`
                    : dealerVal.total}
                {!s.hole && " + ?"}
              </span>
            </div>
          )}

          {/* Cartes du croupier */}
<div
  data-deal-target="dealer"
  className="relative z-10 flex shrink-0 justify-center"
>
  <p
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pl-[0.45em] text-[10px] font-bold uppercase tracking-[0.45em] text-white/[0.10] sm:text-xs"
  >
    Dealer
  </p>

  {s.dealer.map((card, index) => (
  <span
    key={`dealer-flight-${index}-${card.rank}${card.suit}`}
    className="contents"
    data-deal-card-index={index}
    style={{
      visibility: dealEvents.some(
        (event: DealFlightEvent) =>
          event.target === "dealer" && event.cardIndex === index
      )
        ? "hidden"
        : "visible",
    }}
  >
      <PlayingCard
      card={card}
      faceDown={index === 1 && !s.hole}
      overlap={index > 0}
      back={back}
      highlight={index === 1 && s.revealing}
      fit
      animated={false}
    />
  </span>
))}
</div>
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex min-h-[52px] shrink-0 flex-col items-center justify-center gap-0.5 px-3 text-center sm:min-h-[60px]"
        >
          <p
            key={s.message}
            className="max-w-full animate-pop text-xs font-semibold text-[#ead5a3] sm:text-sm"
          >
            {s.message}
          </p>

          <SideNotePill note={s.sideNote} />

          {s.phase === "settled" && s.net !== null ? (
  <div className="flex items-center justify-center gap-2">
    <span
      key={`net-${s.net}-${s.celebrate}`}
      className={`inline-block text-xl font-black tabular-nums ${
        s.net > 0
          ? "text-[#f5d778] animate-result-win"
          : s.net < 0
          ? "text-red-300 animate-result-pop"
          : "text-white/70 animate-result-pop"
      }`}
    >
      {signed(s.net)}
    </span>

    {roundBreakdown && (
  <button
    type="button"
    onClick={() => setResultOpen(true)}
    aria-label="Open round details"
    className="group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#d7b45b]/70 bg-gradient-to-b from-[#d7b45b]/25 to-[#d7b45b]/10 px-3 text-[11px] font-bold uppercase tracking-wider text-[#f0d38b] shadow-[0_0_14px_rgba(215,180,91,0.18)] outline-none transition hover:border-[#e5c779] hover:from-[#d7b45b]/35 hover:to-[#d7b45b]/15 hover:text-[#f7dd9b] focus-visible:ring-2 focus-visible:ring-[#e5c779] md:hidden"
  >
    <span
      aria-hidden="true"
      className="text-[10px] leading-none transition-transform duration-300 group-hover:scale-110"
    >
      ✦
    </span>

    Details
  </button>
)}
  </div>
) : advice ? (
            <p className="text-[11px] text-sky-200">
              Basic strategy · {advice}
            </p>
          ) : (
            <span aria-hidden="true" className="h-3" />
          )}
        </div>

        <div
          className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-2 sm:px-5"
          style={playerCardStyle}
        >
          <div
  className="grid min-h-full items-center gap-1 sm:gap-3"
  style={{
    gridTemplateColumns: `repeat(${handCount}, minmax(0, 1fr))`,
  }}
>
  {s.hands.length === 0 && (
    <div
      aria-hidden="true"
      className="min-h-[60px] w-full sm:min-h-[80px]"
    />
  )}

  {s.hands.map((hand, index) => {
              const value = handValue(hand.cards);
              const selected =
                s.phase === "player" &&
                index === s.active &&
                s.hands.length > 1;
              const multi = s.hands.length > 1;

              return (
                <div
                  key={index}
                  className={`min-w-0 rounded-2xl border p-1 transition-colors sm:p-2 ${
                    selected
                      ? "border-[#e5c779]/70 bg-[#e5c779]/10"
                      : "border-transparent"
                  }`}
                >
                  {/* Engraved per-hand spot badge — only on multi-hand
                      play, since the central BET puck covers single hand. */}
                  {multi && (
                    <div className="mb-1 flex justify-center">
                      <HandSpotBadge
                        index={index}
                        active={selected}
                      />
                    </div>
                  )}

                  <div className="mb-2 flex min-h-8 flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[9px] sm:text-xs">
                    {s.hands.length > 1 && (
                      <span className="text-white/40">
                        #{index + 1}
                      </span>
                    )}

                    <span className="rounded-full bg-black/30 px-2 py-0.5 font-bold">
                      {value.soft && value.total < 21
                        ? `${value.total - 10}/${value.total}`
                        : value.total}
                    </span>

                    <span className="text-white/50">
                      ◈ {money(hand.bet)}
                      {hand.doubled && " ×2"}
                    </span>

                    {hand.result && (
                      <span
                        className={`font-semibold ${
                          hand.result === "win" ||
                          hand.result === "blackjack"
                            ? "text-emerald-300"
                            : hand.result === "push" ||
                              hand.result === "surrender"
                            ? "text-white/60"
                            : "text-red-300"
                        }`}
                      >
                        {hand.result}
                      </span>
                    )}
                  </div>

                  <div
  data-deal-target={`hand-${index}`}
  className="flex justify-center"
>
                    {hand.cards.map((card, cardIndex) => (
  <span
    key={`hand-${index}-flight-${cardIndex}-${card.rank}${card.suit}`}
    className="contents"
    data-deal-card-index={cardIndex}
    style={{
      visibility: dealEvents.some(
        (event: DealFlightEvent) =>
          event.target === `hand-${index}` &&
          event.cardIndex === cardIndex
      )
        ? "hidden"
        : "visible",
    }}
  >
      <PlayingCard
      card={card}
      overlap={cardIndex > 0}
      back={back}
      compact={compact}
      fit
      animated={false}
    />
  </span>
))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

              {/* BET puck — the chip pile that fills the gold circle,
                   so the player can see their bet grow as they add chips.
                   Only visible during betting (not during a hand). */}
              {bettingOpen && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-10 z-10 flex justify-center sm:bottom-14"
                >
                  <div
                    className="relative flex h-20 w-20 items-end justify-center overflow-visible rounded-full sm:h-24 sm:w-24"
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
                    <p
                      className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.22em] sm:top-2.5 sm:text-[10px]"
                      style={{
                        color: "#e5c779",
                        textShadow:
                          "0 0 4px rgba(229, 199, 121, 0.6), 0 1px 0 rgba(0, 0, 0, 0.9)",
                      }}
                    >
                      Bet
                    </p>

                    {pileAmount > 0 ? (
                      <div className="mb-2 flex items-end justify-center sm:mb-2.5">
                        <ChipStack amount={pileAmount} />
                      </div>
                    ) : (
                      <p
                        className="mb-3 text-sm font-black tabular-nums text-white/50 sm:mb-4 sm:text-base"
                        style={{ textShadow: "0 1px 0 rgba(0, 0, 0, 0.9)" }}
                      >
                        ◈ 0
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Table markings — engraved ornament along the bottom
                   edge of the felt. Serif typography, gold diamond
                   separators, same wording a real pit sign would use.
                   Shrink down on mobile so the three labels fit without
                   overflow. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1.5 px-3 sm:gap-3"
              >
                <p
                  className="whitespace-nowrap font-serif text-[7px] font-bold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.22em]"
                  style={{
                    color: "rgba(229,199,121,0.42)",
                    textShadow: "0 1px 0 rgba(0,0,0,0.9)",
                  }}
                >
                  <span className="sm:hidden">
                    BJ {s.settings.bj65 ? "6:5" : "3:2"}
                  </span>
                  <span className="hidden sm:inline">
                    Blackjack pays {s.settings.bj65 ? "6 to 5" : "3 to 2"}
                  </span>
                </p>
                <span
                  aria-hidden
                  className="text-[7px] leading-none sm:text-[9px]"
                  style={{ color: "rgba(229,199,121,0.5)" }}
                >
                  ❖
                </span>
                <p
                  className="whitespace-nowrap font-serif text-[7px] font-bold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.22em]"
                  style={{
                    color: "rgba(229,199,121,0.36)",
                    textShadow: "0 1px 0 rgba(0,0,0,0.9)",
                  }}
                >
                  <span className="sm:hidden">Insurance 2:1</span>
                  <span className="hidden sm:inline">Insurance pays 2 to 1</span>
                </p>
                <span
                  aria-hidden
                  className="text-[7px] leading-none sm:text-[9px]"
                  style={{ color: "rgba(229,199,121,0.5)" }}
                >
                  ❖
                </span>
                <p
                  className="whitespace-nowrap font-serif text-[7px] font-bold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.22em]"
                  style={{
                    color: "rgba(229,199,121,0.36)",
                    textShadow: "0 1px 0 rgba(0,0,0,0.9)",
                  }}
                >
                  <span className="sm:hidden">{s.settings.h17 ? "H17" : "S17"}</span>
                  <span className="hidden sm:inline">
                    Dealer {s.settings.h17 ? "hits" : "stands on"} soft 17
                  </span>
                </p>
              </div>

        {/* Arc de mise imprimé au bord du tapis */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/2 z-0 h-48 w-[min(96%,980px)] -translate-x-1/2 rounded-[50%] border border-white/[0.06]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/2 z-0 h-32 w-[min(82%,760px)] -translate-x-1/2 rounded-[50%] border border-white/[0.04]"
        />

        {s.shuffling && <ShuffleAnimation />}
                <ResultRail g={g} onNewRound={deal} />
      </main>

      <footer
        className="relative z-20 shrink-0 border-t border-[#d7b45b]/25 bg-[#101713] px-2 pt-2 sm:px-5"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
        }}
      >
        {bettingOpen ? (
          <div className="mx-auto mb-2 max-w-xl overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-black/20 p-2 pb-4 sm:max-h-[26dvh] sm:pb-2.5">
            <div className="space-y-2">
  <div className="flex min-w-0 items-center justify-between gap-3 px-1">
    <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/45">
      Bet / hand
    </span>

    <span
      className="min-w-0 truncate text-right font-mono text-sm font-bold tabular-nums text-[#e5c779]"
      title={`◈ ${money(s.bet)}`}
    >
      ◈ {money(s.bet)}
    </span>
  </div>

  <div className="mx-auto grid w-full max-w-[300px] grid-cols-5 gap-1.5">
    {CHIPS.map((value) => (
      <button
        key={value}
        type="button"
        onClick={() => addChip(value)}
        disabled={
          !canBet ||
          (s.bet + value) * spots + sides > s.balance
        }
        aria-label={`Add ${value} chips`}
        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-white/60 text-[10px] font-black outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-30 ${CHIP_BG[value]}`}
      >
        {value}
      </button>
    ))}
  </div>

  <div className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-1.5">
    <button
      type="button"
      onClick={() => setBetTo(s.lastBet)}
      className={`${control} ${neutral} h-10 w-full min-w-0`}
    >
      Rebet
    </button>

    <button
      type="button"
      onClick={() => setBetTo(s.bet * 2)}
      disabled={s.bet === 0}
      className={`${control} ${neutral} h-10 w-full min-w-0`}
    >
      ×2
    </button>

    <button
      type="button"
      onClick={() => setBetTo(0)}
      disabled={s.bet === 0}
      className={`${control} ${neutral} h-10 w-full min-w-0`}
    >
      Clear
    </button>
  </div>
</div>

            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
  <div className="relative">
    <ImmersiveSidePill
      label="PP"
      amount={s.ppBet}
      disabled={!canBet}
      onIncrease={() => adjustSide("ppBet", sideBetStep(s.ppBet))}
      onDecrease={() => adjustSide("ppBet", -sideBetStep(Math.max(0, s.ppBet - 1)))}
      plusDisabled={
        !canBet || s.ppBet >= 1000 || stake + sideBetStep(s.ppBet) > s.balance
      }
    />
    {roundBreakdown && (
      <SideWinBadge net={roundBreakdown.perfectPairs} />
    )}
  </div>

  <div className="relative">
    <ImmersiveSidePill
      label="21+3"
      amount={s.t3Bet}
      disabled={!canBet}
      onIncrease={() => adjustSide("t3Bet", sideBetStep(s.t3Bet))}
      onDecrease={() => adjustSide("t3Bet", -sideBetStep(Math.max(0, s.t3Bet - 1)))}
      plusDisabled={
        !canBet || s.t3Bet >= 1000 || stake + sideBetStep(s.t3Bet) > s.balance
      }
    />
    {roundBreakdown && (
      <SideWinBadge net={roundBreakdown.twentyOnePlusThree} />
    )}
  </div>
</div>
          </div>
        ) : (
          <div className="mb-2 flex min-h-6 items-center justify-center gap-3 text-[11px] text-white/50">
            <span>
              {canBet ? "Next bet" : "Hands"} · ◈{" "}
              {money(
                canBet
                  ? s.bet * spots
                  : s.hands.reduce((sum, hand) => sum + hand.bet, 0)
              )}
            </span>

            {canBet && (
              <button
  type="button"
  onClick={() => setEditBet(true)}
  className={`${control} ${neutral} h-8 px-3 text-[11px]`}
>
  Edit bet · ◈ {money(s.bet)}
</button>
            )}
          </div>
        )}

        {s.phase === "insurance" ? (
          // The InsuranceModal (mounted at the Blackjack parent) owns
          // this decision now. Keep an empty slot so the footer stays
          // the same height while the player decides.
          <div
            aria-hidden="true"
            className="mx-auto h-10 max-w-xl sm:h-11"
          />
        ) : canBet ? (
          <div className="mx-auto flex max-w-xl justify-center gap-2">
            {outOfChips ? (
              <button
                type="button"
                onClick={refill}
                className={`${control} ${gold} min-w-0 flex-1`}
              >
                Refill · ◈ {money(REFILL)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditBet(false);
                  deal();
                }}
                disabled={s.bet < MIN_BET || stake > s.balance}
                className={`${control} ${gold} min-w-0 flex-1 sm:min-h-10`}
              >
                {s.phase === "settled" ? "Deal again" : "Deal"} · ◈{" "}
                {money(stake)}
              </button>
            )}

            {bettingOpen && s.phase === "settled" && (
              <button
                type="button"
                onClick={() => setEditBet(false)}
                className={`${control} ${neutral}`}
              >
                Done
              </button>
            )}
          </div>
        ) : (
          <div className="mx-auto grid max-w-4xl grid-cols-5 gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={hit}
              disabled={!playing}
              className={`${control} ${gold} sm:min-h-10`}
            >
              Hit
            </button>

            <button
              type="button"
              onClick={stand}
              disabled={!playing}
              className={`${control} ${neutral} sm:min-h-10`}
            >
              Stand
            </button>

            <button
              type="button"
              onClick={double}
              disabled={!canDouble}
              className={`${control} ${neutral} sm:min-h-10`}
            >
              Double
            </button>

            <button
              type="button"
              onClick={split}
              disabled={!canSplit}
              className={`${control} ${neutral} sm:min-h-10`}
            >
              Split
            </button>

            <button
              type="button"
              onClick={surrender}
              disabled={!canSurrender}
              className={`${control} ${neutral} sm:min-h-10`}
            >
              <span className="sm:hidden">Surr.</span>
              <span className="hidden sm:inline">Surrender</span>
            </button>
          </div>
        )}
      </footer>

      {resultOpen && roundBreakdown && (
  <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm md:hidden">
    <button
      type="button"
      className="absolute inset-0 cursor-default"
      aria-label="Close round details"
      onClick={() => setResultOpen(false)}
      tabIndex={-1}
    />

    <div
      role="dialog"
      aria-modal="true"
      aria-label="Round details"
      className="animate-pop relative w-full max-w-sm rounded-2xl border border-[#d7b45b]/40 bg-[#0d140f] p-4 shadow-2xl"
    >
      <button
        type="button"
        onClick={() => setResultOpen(false)}
        aria-label="Close round details"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 transition hover:border-[#d7b45b] hover:text-[#e5c779]"
      >
        ✕
      </button>

      <p className="text-[10px] font-black uppercase tracking-widest text-[#e5c779]">
        Round result
      </p>

      <p
        className={`mt-1 text-3xl font-black tabular-nums ${
          roundBreakdown.total > 0
            ? "text-[#f5d778]"
            : roundBreakdown.total < 0
            ? "text-red-300"
            : "text-white/70"
        }`}
      >
        {signed(roundBreakdown.total)}
      </p>

      <dl className="mt-4 space-y-2 text-sm">
        {[
          ["Main hands", roundBreakdown.main],
          ["Insurance", roundBreakdown.insurance],
          ["Perfect Pairs", roundBreakdown.perfectPairs],
          ["21+3", roundBreakdown.twentyOnePlusThree],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="flex items-center justify-between gap-3"
          >
            <dt className="text-white/50">{label}</dt>
            <dd className="font-semibold tabular-nums text-white/85">
              {signed(Number(value))}
            </dd>
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
          <dt className="font-bold text-white">Total</dt>
          <dd
            className={`font-black tabular-nums ${
              roundBreakdown.total > 0
                ? "text-[#f5d778]"
                : roundBreakdown.total < 0
                ? "text-red-300"
                : "text-white/70"
            }`}
          >
            {signed(roundBreakdown.total)}
          </dd>
        </div>
      </dl>
    </div>
  </div>
)}

      {menuOpen && (
        <InfoPanel g={g} onClose={() => setMenuOpen(false)} />
      )}
    </div>,
    document.body
  );
}