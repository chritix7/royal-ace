"use client";

import { useState } from "react";
import { handValue, isBlackjack } from "../lib/blackjack";
import { MIN_BET, REFILL, money, tableBg } from "../lib/game";
import { ChipStack } from "./ui";
import PlayingCard from "./PlayingCard";
import Confetti from "./Confetti";
import type { DealFlightEvent, Game } from "../lib/useBlackjack";
import DealerShoe from "./DealerShoe";
import CardFlight from "./CardFlight";
import HandResultBadge from "./HandResultBadge";
import HandSpotBadge from "./HandSpotBadge";
import ShuffleAnimation from "./ShuffleAnimation";
import SideNotePill from "./SideNotePill";
import SideWinBadge from "./SideWinBadge";
import VegasFeltOverlay from "./VegasFeltOverlay";
import ResultRail from "./blackjack-immersive/ResultRail";
import MobileResultModal from "./MobileResultModal";
import SideBetModal from "./SideBetModal";
import TableClock from "./TableClock";
import StreakBadge from "./StreakBadge";
import HistoryRibbon from "./HistoryRibbon";

// Premium action button base — used across Hit / Stand / Double / Split /
// Surrender / Deal. Common shape (border, radius, size, focus ring), with
// tone + gradient layered on per button.
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
  const active = !disabled && amount > 0;
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
        opacity: disabled ? 0.7 : 1,
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
          {amount > 0 ? `◈ ${money(amount)}` : "Tap to stake"}
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

function getShoeStatus(g: Game): {
  label: string;
  tone: "gold" | "green" | "red" | "orange" | "white";
} {
  const { s } = g;

  if (s.shuffling) {
    return { label: "Shuffling", tone: "orange" };
  }

  if (s.phase === "betting") {
    return { label: "Ready", tone: "gold" };
  }

  if (s.phase === "dealing") {
    return { label: "Dealing", tone: "gold" };
  }

  if (s.phase === "insurance") {
    return { label: "Insurance", tone: "orange" };
  }

  if (s.phase === "player") {
    return { label: "Your turn", tone: "green" };
  }

  if (s.phase === "dealer") {
    return { label: "Dealer", tone: "white" };
  }

  if (s.phase === "settled") {
    const net = s.net ?? 0;

    if (net > 0) return { label: "Win", tone: "green" };
    if (net < 0) return { label: "Loss", tone: "red" };
    return { label: "Push", tone: "white" };
  }

  return { label: "Ready", tone: "gold" };
}

  export default function Table({ g }: { g: Game }) {
  // Mobile-only round-details modal — on md+ the ResultRail on the
  // felt already shows the breakdown.
  const [resultOpen, setResultOpen] = useState(false);
  // Which side-bet staking modal is open (Perfect Pairs / 21+3 / none).
  // Tapping either felt pill opens the shared SideBetModal.
  const [sideBetOpen, setSideBetOpen] = useState<"pp" | "t3" | null>(null);
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
  outOfChips,
  totalCards,
  shoePct,
  compact,
  stake,
  back,
  pileAmount,
  dealEvents,
  consumeDealEvent,
  deal,
  hit,
  stand,
  double,
  split,
  surrender,
  refill,
  adjustSide,
} = g;

  return (
    <>
      <section className="overflow-clip rounded-3xl border border-[#c8a65b]/20 bg-[#101713] shadow-2xl lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <div className={`felt-texture relative overflow-hidden ${tableBg(s.settings)} px-2 py-3 sm:px-9 sm:py-4 lg:flex lg:flex-1 lg:min-h-0 lg:flex-col lg:justify-between lg:pb-7 lg:pt-14`}>
          {/* Floating result rail — same component as the Focus view,
              positioned on the left edge of the felt. Shows the round
              breakdown and a New-round button at settle, a Hand-in-
              progress pill otherwise. md:+ only, like in Focus. */}
          <ResultRail g={g} onNewRound={deal} />

          {/* Floating Shoe meter — a compact gold-tinted pill at the top-
              left of the felt. Replaces the old table header strip; the
              dealer rules are already engraved on the felt below. */}
          <div
            aria-hidden={false}
            className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-[#d7b45b]/30 bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-[#e5c779] shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:left-5 sm:top-5 sm:text-[11px]"
          >
            <span className="uppercase tracking-[0.18em] text-[#d7b45b]/80">
              Shoe
            </span>
            <span className="tabular-nums text-white/90">
              {s.shoe.length || totalCards}
            </span>
            <span
              aria-hidden
              className="h-1.5 w-10 overflow-hidden rounded-full bg-white/10 sm:w-14"
            >
              <span
                className="block h-full rounded-full bg-gradient-to-r from-[#d7b45b]/40 to-[#d7b45b] transition-[width] duration-500"
                style={{ width: `${shoePct}%` }}
              />
            </span>
          </div>

          {/* Clock — lives right under the Shoe pill but with its own
              squared-off chrome so it doesn't look like a twin pill
              glued to the shoe. Shows the player's local HH:MM. */}
          <TableClock className="absolute left-3 top-[52px] z-10 sm:left-5 sm:top-[58px]" />

          {/* Streak + History ribbon — live table telemetry. Both
              live in the upper-left stack under the Shoe/Clock on
              desktop (phones get enough load from the dealer corner
              already — Focus mode is where phone players get the
              full HUD). */}
          <StreakBadge
            history={s.history}
            className="absolute left-5 top-[90px] z-10 hidden sm:inline-flex"
          />
          <HistoryRibbon
            history={s.history}
            className="absolute left-5 top-[120px] z-10 hidden sm:inline-flex"
          />
          {s.settings.theme === "vegas" && <VegasFeltOverlay />}
          {s.celebrate > 0 && <Confetti key={s.celebrate} />}
          <DealerShoe
            className="absolute -right-[38px] -top-[14px] z-0 hidden sm:block"
            status={getShoeStatus(g)}
            dealTick={s.dealTick}
            fillPct={shoePct}
          />

          {/* Mobile shoe — scaled-down version so the deal flight has a
              visible source on phones and the ramp animation still plays. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-3px] top-1 z-0 origin-top-right scale-[0.45] sm:hidden"
          >
            <DealerShoe
              status={getShoeStatus(g)}
              dealTick={s.dealTick}
              fillPct={shoePct}
            />
          </div>
          <CardFlight
            dealEvents={dealEvents}
            consumeDealEvent={consumeDealEvent}
            back={back}
            compact={compact}
          />
          {s.shuffling && <ShuffleAnimation />}
          {/* Croupier — zone gravée dans le tapis */}
<div className="relative mt-1.5 flex min-h-[88px] items-center justify-center sm:min-h-28 lg:mt-0 lg:min-h-[96px]">

  {/* Score du croupier — ne prend aucune hauteur */}
{s.dealer.length > 0 && (
  <div className="pointer-events-none absolute -top-5 left-1/2 z-20 -translate-x-1/2">
    <span
      key={`dv-${dealerVal.total}-${s.hole ? 1 : 0}`}
      className={`animate-score-tick rounded-full px-2.5 py-0.5 text-[11px] font-bold sm:text-xs ${
        s.hole && dealerVal.total > 21
          ? "bg-[#c04040]/45 text-[#ffd8d8] shadow-[0_0_10px_rgba(192,64,64,0.45)]"
          : "bg-black/30 text-white"
      }`}
    >
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
  className="relative z-10 mt-4 flex justify-center"
>
  <p
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pl-[0.45em] text-[10px] font-bold uppercase tracking-[0.45em] text-white/[0.12] sm:text-xs"
  >
    Dealer
  </p>

  {s.dealer.map((card, i) => (
    <span
      key={`d${i}-${card.rank}${card.suit}`}
      className="contents"
      data-deal-card-index={i}
      style={{
        visibility: dealEvents.some(
          (event: DealFlightEvent) =>
            event.target === "dealer" && event.cardIndex === i
        )
          ? "hidden"
          : "visible",
      }}
    >
      <PlayingCard
        card={card}
        faceDown={i === 1 && !s.hole}
        overlap={i > 0}
        back={back}
        highlight={i === 1 && s.revealing}
        animated={false}
      />
    </span>
  ))}
</div>
</div>

          {/* Message slot — the height is FIXED at every phase so the
              table never shifts when content changes. Mobile reserves
              48px, desktop reserves 88px (bumped so dealer + message
              + player stack reads more like a dealt table). At settle
              + breakdown on desktop the middle slot stays empty (the
              ResultRail on the left owns the result); on mobile the
              fused pill fills it. */}
          <div
            className="my-2 flex min-h-[48px] flex-col items-center justify-center gap-1 sm:my-3 lg:my-0 lg:mt-6 lg:min-h-[88px]"
            role="status"
            aria-live="polite"
          >
            {/* MOBILE FUSED RESULT PILL — at settle, mobile shows a single
                full-width button that fuses verdict + net + Details. The
                regular message, net amount and side-note pill are hidden
                on this breakpoint only, so the stack between dealer and
                player cards is one row instead of four. */}
            {s.phase === "settled" && roundBreakdown && (
              (() => {
                const net = roundBreakdown.total;
                const verdict = net > 0 ? "Win" : net < 0 ? "Loss" : "Push";
                const tone =
                  net > 0
                    ? {
                        border: "border-[#d7b45b]/70",
                        bg: "bg-gradient-to-r from-[#d7b45b]/22 via-[#d7b45b]/12 to-[#d7b45b]/22",
                        text: "text-[#f5d778]",
                        shadow:
                          "shadow-[0_0_16px_rgba(215,180,91,0.25),inset_0_1px_0_rgba(229,199,121,0.2)]",
                        amount: "text-[#f5d778]",
                      }
                    : net < 0
                      ? {
                          border: "border-red-400/40",
                          bg: "bg-gradient-to-r from-red-500/15 via-red-500/8 to-red-500/15",
                          text: "text-red-200",
                          shadow:
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                          amount: "text-red-300",
                        }
                      : {
                          border: "border-white/20",
                          bg: "bg-black/40",
                          text: "text-white/75",
                          shadow:
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                          amount: "text-white/80",
                        };
                return (
                  <button
                    type="button"
                    key={`fused-${net}-${s.celebrate}`}
                    onClick={() => setResultOpen(true)}
                    aria-label="Open round details"
                    className={`group flex max-w-[280px] animate-result-pop items-center justify-center gap-2.5 rounded-full border px-3 py-1 ${tone.border} ${tone.bg} ${tone.shadow} outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#e5c779] md:hidden`}
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-[0.22em] ${tone.text}`}
                    >
                      {verdict}
                    </span>
                    <span
                      className={`text-base font-black tabular-nums ${tone.amount}`}
                    >
                      {net > 0 ? "+" : net < 0 ? "−" : ""}◈{" "}
                      {money(Math.abs(net))}
                    </span>
                    <span
                      className={`flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${tone.text}`}
                    >
                      <span
                        aria-hidden
                        className="text-[11px] leading-none transition-transform duration-300 group-hover:scale-110"
                      >
                        ✦
                      </span>
                      Details
                    </span>
                  </button>
                );
              })()
            )}

            {/* At settle (with a round breakdown) the middle message, net
                amount and side-note pill are HIDDEN at every breakpoint:
                mobile sees the fused pill above, desktop sees the floating
                ResultRail on the left edge of the felt. No duplication.
                During the betting phase the message loses its pill chrome
                and sits bare on the felt (same minimal treatment as Focus
                mode) so "Place your bet to start." reads as an engraved
                invitation rather than a toast. */}
            <div
              key={`msg-${s.message}-${s.phase}-${s.celebrate}`}
              className={`max-w-full text-center text-xs text-[#e5c779] sm:text-sm ${
                s.phase === "settled" ? "animate-result-pop" : "animate-msg-slide"
              } ${
                s.phase === "betting"
                  ? "font-semibold text-[#ead5a3]"
                  : "rounded-full border border-[#d7b45b]/30 bg-black/30 px-3 py-1.5 sm:px-5 sm:py-2"
              } ${s.phase === "settled" && roundBreakdown ? "hidden" : ""}`}
            >
              <span
                className={s.phase === "betting" ? "animate-idle-shimmer" : ""}
              >
                {s.message}
              </span>
            </div>
            {s.net !== null && s.net !== 0 && !(s.phase === "settled" && roundBreakdown) && (
              <div className="flex items-center gap-2">
                <div
                  key={`net-${s.net}-${s.celebrate}`}
                  className={`inline-block text-xl font-black sm:text-2xl ${
                    s.net > 0
                      ? "text-[#f5d778] animate-result-win"
                      : "text-red-300 animate-result-pop"
                  }`}
                >
                  {s.net > 0 ? "+" : "−"}◈ {money(Math.abs(s.net))}
                </div>
              </div>
            )}
            {!(s.phase === "settled" && roundBreakdown) && (
              <SideNotePill note={s.sideNote} />
            )}
            {advice && (
              <div className="max-w-full rounded-full border border-sky-300/40 bg-sky-400/10 px-3 py-1 text-center text-[11px] text-sky-200 sm:text-xs">
                Basic strategy: {advice}
              </div>
            )}
          </div>

          {/* Joueur */}
          <div className="flex flex-wrap items-start justify-center gap-2 sm:gap-5 lg:mt-4">
  {s.hands.length === 0 && (
    <div
      aria-hidden="true"
      className="min-h-20 w-full sm:min-h-28"
    />
  )}

  {s.hands.map((h, i) => {
              const v = handValue(h.cards);
              const isActive = s.phase === "player" && i === s.active && s.hands.length > 1;
              const multi = s.hands.length > 1;
              return (
                <div
                  key={i}
                  data-deal-target={`hand-${i}`}
                  className={`rounded-2xl border p-2 transition sm:p-3 ${
                    isActive ? "border-[#e5c779]/70 bg-[#e5c779]/10" : "border-transparent"
                  } ${compact && !isActive && s.phase === "player" ? "opacity-75" : ""}`}
                >
                  {/* Engraved per-hand spot badge — only in multi-hand play. */}
                  {multi && (
                    <div className="mb-1 flex justify-center">
                      <HandSpotBadge index={i} active={isActive} />
                    </div>
                  )}

                  <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:mb-3 sm:text-xs">
                    <span
                      key={`v-${i}-${v.total}`}
                      className={`animate-score-tick rounded-full px-2.5 py-0.5 font-bold ${
                        v.total > 21
                          ? "bg-[#c04040]/45 text-[#ffd8d8] shadow-[0_0_10px_rgba(192,64,64,0.45)]"
                          : "bg-black/30 text-white"
                      }`}
                    >
                      {v.soft && v.total < 21 ? `${v.total - 10}/${v.total}` : v.total}
                    </span>
                    <span className="text-white/50">
                      ◈ {money(h.bet)}
                      {h.doubled && " (doubled)"}
                    </span>
                    {h.result && <HandResultBadge result={h.result} />}
                  </div>
                  <div className={`flex justify-center ${compact ? "min-h-[72px] sm:min-h-24" : "min-h-24 sm:min-h-28 lg:min-h-[96px]"}`}>
                    {h.cards.map((card, k) => (
                      <span
                        key={`p${i}-${k}-${card.rank}${card.suit}`}
                        className="contents"
                        data-deal-card-index={k}
                        style={{
                          visibility: dealEvents.some(
                            (event: DealFlightEvent) =>
                              event.target === `hand-${i}` && event.cardIndex === k
                          )
                            ? "hidden"
                            : "visible",
                        }}
                      >
                        <PlayingCard
                          card={card}
                          overlap={k > 0}
                          compact={compact}
                          back={back}
                          animated={false}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Engraved table rules — pinned to the felt's bottom edge
              via absolute positioning so player cards, bet-zone and
              the action strip never push this caption around. Only
              shown from sm:+ since mobile already surfaces the rules
              inside the sidebar Table-rules collapsible. */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute bottom-1 left-1/2 hidden -translate-x-1/2 items-center justify-center whitespace-nowrap text-center sm:flex sm:gap-x-3"
>
  <p
    className="whitespace-nowrap font-serif text-[10px] font-bold uppercase tracking-[0.22em]"
    style={{
      color: "rgba(229,199,121,0.42)",
      textShadow: "0 1px 0 rgba(0,0,0,0.9)",
    }}
  >
    Blackjack pays {s.settings.bj65 ? "6 to 5" : "3 to 2"}
  </p>

  <span
    aria-hidden
    className="text-[9px] leading-none"
    style={{ color: "rgba(229,199,121,0.5)" }}
  >
    ❖
  </span>

  <p
    className="whitespace-nowrap font-serif text-[10px] font-bold uppercase tracking-[0.22em]"
    style={{
      color: "rgba(229,199,121,0.36)",
      textShadow: "0 1px 0 rgba(0,0,0,0.9)",
    }}
  >
    Insurance pays 2 to 1
  </p>

  <span
    aria-hidden
    className="text-[9px] leading-none"
    style={{ color: "rgba(229,199,121,0.5)" }}
  >
    ❖
  </span>

  <p
    className="whitespace-nowrap font-serif text-[10px] font-bold uppercase tracking-[0.22em]"
    style={{
      color: "rgba(229,199,121,0.36)",
      textShadow: "0 1px 0 rgba(0,0,0,0.9)",
    }}
  >
    Dealer {s.settings.h17 ? "hits" : "stands on"} soft 17
  </p>
</div>

          {/* Bet-zone slot — swaps content based on phase, but the slot
              height is RESERVED at every phase so the felt stays still
              across betting → dealing → player → dealer → settled.
              Mobile keeps the sticky action bar below the felt, but on
              desktop (lg:+) the Deal button and the play-time actions
              (Hit / Stand / Double / Split / Surrender) are rendered
              INSIDE this slot, on top of the engraved arcs — no height
              is wasted below the table. */}
<div className="relative mt-3 min-h-[170px] sm:mt-4 lg:mt-0 lg:flex lg:min-h-[120px] lg:flex-col lg:items-center lg:justify-end lg:gap-2">
  {/* Outer betting-area arc engraved in the felt */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -bottom-10 left-1/2 h-40 w-[min(94%,680px)] -translate-x-1/2 rounded-[50%]"
    style={{
      boxShadow:
        "inset 0 0 0 1px rgba(229, 199, 121, 0.14), inset 0 1px 0 rgba(0, 0, 0, 0.5)",
    }}
  />
  {/* Inner concentric arc */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -bottom-7 left-1/2 h-28 w-[min(78%,520px)] -translate-x-1/2 rounded-[50%]"
    style={{
      boxShadow:
        "inset 0 0 0 1px rgba(229, 199, 121, 0.1), inset 0 1px 0 rgba(0, 0, 0, 0.4)",
    }}
  />
{canBet && (
<div className="relative flex flex-col items-center gap-2.5 lg:flex-row lg:items-center lg:justify-center lg:gap-4">

  <div className="order-1 lg:order-2">
    {/* BET circle — recessed into the felt with a double gold ring.
        When there are chips on the table, the pile IS the content of
        the circle, growing taller as the bet grows. The amount sits
        below as a small gold label. */}
    <div className="flex flex-col items-center">
      <div
        className="relative flex h-20 w-20 items-end justify-center overflow-visible rounded-full text-center sm:h-24 sm:w-24 lg:h-16 lg:w-16"
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
      </div>

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

  <div className="order-2 flex w-full max-w-[300px] items-stretch justify-center gap-2 lg:order-none lg:contents">
    <div className="relative min-w-0 flex-1 lg:order-1 lg:w-36 lg:flex-none">
      <SidePill
        label="PP"
        amount={s.ppBet}
        disabled={!canBet || s.busy}
        onOpen={() => setSideBetOpen("pp")}
      />
      {roundBreakdown && (
        <SideWinBadge net={roundBreakdown.perfectPairs} />
      )}
    </div>

    <div className="relative min-w-0 flex-1 lg:order-3 lg:w-36 lg:flex-none">
      <SidePill
        label="21+3"
        amount={s.t3Bet}
        disabled={!canBet || s.busy}
        onOpen={() => setSideBetOpen("t3")}
      />
      {roundBreakdown && (
        <SideWinBadge net={roundBreakdown.twentyOnePlusThree} />
      )}
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
</div>
        </div>

        {/* Sticky bottom action bar — MOBILE / TABLET only (lg:hidden).
            On lg:+ the same controls live inside the felt's bet-zone
            slot so the table has a single flat bottom edge, aligned
            with the sidebar. */}
        <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[#101713]/95 px-2 py-2 backdrop-blur sm:px-7 sm:py-3 lg:hidden">
          {s.phase === "insurance" ? (
            // The InsuranceModal (mounted at the Blackjack parent) owns
            // this decision now — keep the slot visually empty here.
            <div aria-hidden="true" className="h-10 sm:h-11" />
          ) : canBet ? (
            <div className="flex flex-col items-center gap-2">
              {outOfChips ? (
                <button onClick={refill} className={`${mobileAction} border-[#d7b45b]/60 bg-gradient-to-b from-[#e5c779] to-[#c89a3f] text-[#10130e] sm:w-auto sm:px-4`}>
                  Out of chips · take a ◈ {REFILL} refill
                </button>
              ) : (
                <button
                  onClick={deal}
                  disabled={s.bet < MIN_BET || stake > s.balance}
                  className={`${mobileAction} max-w-sm border-[#d7b45b]/70 bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] text-[#10130e] sm:w-auto sm:px-10 ${
                    s.bet >= MIN_BET && stake <= s.balance ? "animate-deal-ready" : ""
                  }`}
                >
                  {s.phase === "settled" ? "Deal again" : "Deal"} · ◈ {money(stake)}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              <button onClick={hit} disabled={!playing} className={`${mobileAction} border-[#d7b45b]/60 bg-gradient-to-b from-[#e5c779] to-[#c89a3f] text-[#10130e] sm:w-auto sm:px-4`}>
                Hit
              </button>
              <button onClick={stand} disabled={!playing} className={`${mobileAction} border-white/15 bg-white/[0.04] text-white hover:border-[#d7b45b]/50 hover:text-[#e5c779] sm:w-auto sm:px-4`}>
                Stand
              </button>
              <button onClick={double} disabled={!canDouble} className={`${mobileAction} border-[#d7b45b]/50 bg-[#d7b45b]/10 text-[#e5c779] hover:bg-[#d7b45b]/20 sm:w-auto sm:px-4`}>
                Double
              </button>
              <button onClick={split} disabled={!canSplit} className={`${mobileAction} border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 sm:w-auto sm:px-4`}>
                Split
              </button>
              <button onClick={surrender} disabled={!canSurrender} className={`${mobileAction} border-white/10 bg-white/[0.02] text-white/60 hover:border-red-300/40 hover:text-red-200 sm:w-auto sm:px-4`}>
                <span className="lg:hidden">Surr.</span>
                <span className="hidden lg:inline">Surrender</span>
              </button>
            </div>
          )}
        </div>
      </section>
      <MobileResultModal
        open={resultOpen && s.phase === "settled"}
        onClose={() => setResultOpen(false)}
        breakdown={roundBreakdown}
      />
      <SideBetModal
        open={sideBetOpen === "pp"}
        onClose={() => setSideBetOpen(null)}
        label="Perfect Pairs"
        hint="Your first 2 cards pair · up to 25:1"
        amount={s.ppBet}
        canBet={canBet && !s.busy}
        remainingBalance={s.balance - (s.bet * s.settings.spots + s.t3Bet)}
        onAdd={(chip) => adjustSide("ppBet", chip)}
        onClear={() => adjustSide("ppBet", -s.ppBet)}
      />
      <SideBetModal
        open={sideBetOpen === "t3"}
        onClose={() => setSideBetOpen(null)}
        label="21+3"
        hint="Your 2 cards + dealer's card · up to 100:1"
        amount={s.t3Bet}
        canBet={canBet && !s.busy}
        remainingBalance={s.balance - (s.bet * s.settings.spots + s.ppBet)}
        onAdd={(chip) => adjustSide("t3Bet", chip)}
        onClear={() => adjustSide("t3Bet", -s.t3Bet)}
      />
    </>
  );
}