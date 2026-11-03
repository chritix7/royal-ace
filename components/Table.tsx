"use client";

import { handValue, isBlackjack } from "../lib/blackjack";
import type { Result } from "../lib/blackjack";
import { MIN_BET, REFILL, money, tableBg } from "../lib/game";
import { ChipStack } from "./ui";
import PlayingCard from "./PlayingCard";
import Confetti from "./Confetti";
import type { DealFlightEvent, Game } from "../lib/useBlackjack";
import DealerShoe from "./DealerShoe";
import CardFlight from "./CardFlight";
import HandSpotBadge from "./HandSpotBadge";
import ShuffleAnimation from "./ShuffleAnimation";
import VegasFeltOverlay from "./VegasFeltOverlay";

const RESULT_UI: Record<Result, { label: string; cls: string }> = {
  blackjack: { label: "Blackjack", cls: "border-[#e5c779] bg-[#e5c779]/20 text-[#f5d778]" },
  win: { label: "Win", cls: "border-emerald-400/50 bg-emerald-500/20 text-emerald-300" },
  push: { label: "Push", cls: "border-white/30 bg-white/10 text-white/70" },
  lose: { label: "Lose", cls: "border-red-400/50 bg-red-500/20 text-red-300" },
  bust: { label: "Bust", cls: "border-red-400/50 bg-red-500/20 text-red-300" },
  surrender: { label: "Surrender", cls: "border-white/30 bg-white/10 text-white/70" },
};

const mobileAction =
  "inline-flex h-10 w-full items-center justify-center rounded-xl border px-1 text-center text-[11px] font-semibold leading-none outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101713] disabled:cursor-not-allowed disabled:opacity-40 lg:h-12";

const signedMoney = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}◈ ${money(Math.abs(value))}`;

type SidePillProps = {
  label: string;
  amount: number;
  disabled: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
};

function SidePill({
  label,
  amount,
  disabled,
  onIncrease,
  onDecrease,
}: SidePillProps) {
  const active = !disabled && amount > 0;
  return (
    <div
      className="relative flex w-full min-w-0 items-center justify-between gap-2 rounded-full px-3 py-1.5 lg:w-36"
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
      <div className="min-w-0">
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
          {amount > 0 ? `◈ ${money(amount)}` : "Off"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || amount === 0}
          aria-label={`Decrease ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white/80 transition enabled:hover:text-[#e5c779] disabled:opacity-30"
          style={{
            background: "radial-gradient(circle at 35% 25%, #2a2a2d 0%, #0a0a0b 70%, #000 100%)",
            boxShadow: "inset 0 0 0 1px rgba(229, 199, 121, 0.35), inset 0 1px 2px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(229, 199, 121, 0.08)",
          }}
        >
          −
        </button>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled}
          aria-label={`Increase ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white/80 transition enabled:hover:text-[#e5c779] disabled:opacity-30"
          style={{
            background: "radial-gradient(circle at 35% 25%, #2a2a2d 0%, #0a0a0b 70%, #000 100%)",
            boxShadow: "inset 0 0 0 1px rgba(229, 199, 121, 0.35), inset 0 1px 2px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(229, 199, 121, 0.08)",
          }}
        >
          +
        </button>
      </div>
    </div>
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
      <section className="overflow-clip rounded-3xl border border-[#c8a65b]/20 bg-[#101713] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold sm:text-xl">Blackjack</h3>
            <p className="mt-0.5 truncate text-[10px] text-white/40 sm:text-xs">
              {s.settings.decks} decks · dealer {s.settings.h17 ? "hits" : "stands on"} soft 17 · blackjack pays{" "}
              {s.settings.bj65 ? "6 to 5" : "3 to 2"}
            </p>
          </div>
          <div className="w-20 shrink-0 text-right text-[10px] text-white/40 sm:w-28 sm:text-[11px]">
            Shoe · {s.shoe.length || totalCards}
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#d7b45b]/70 transition-all duration-500" style={{ width: `${shoePct}%` }} />
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden ${tableBg(s.settings)} px-2 py-4 sm:px-9 sm:py-5`}>
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
<div className="relative mt-1.5 flex min-h-[76px] items-center justify-center sm:min-h-28">

  {/* Score du croupier — ne prend aucune hauteur */}
{s.dealer.length > 0 && (
  <div className="pointer-events-none absolute -top-5 left-1/2 z-20 -translate-x-1/2">
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

          {/* Message (annoncé aux lecteurs d'écran) */}
          <div
            className="my-2 flex flex-col items-center gap-1 sm:my-3 lg:min-h-[72px] lg:justify-center"
            role="status"
            aria-live="polite"
          >
            <div key={s.message} className="animate-pop max-w-full rounded-full border border-[#d7b45b]/30 bg-black/30 px-3 py-1.5 text-center text-xs text-[#e5c779] sm:px-5 sm:py-2 sm:text-sm">
              {s.message}
            </div>
            {s.net !== null && s.net !== 0 && (
              <div className={`animate-pop text-xl font-black sm:text-2xl ${s.net > 0 ? "text-[#f5d778]" : "text-red-300"}`}>
                {s.net > 0 ? "+" : "−"}◈ {money(Math.abs(s.net))}
              </div>
            )}
            {s.sideNote && (
              <div className={`animate-pop max-w-full rounded-full border px-3 py-1 text-center text-[11px] sm:text-xs ${s.sideNote.includes("+") ? "border-[#e5c779]/60 bg-[#e5c779]/15 text-[#f5d778]" : "border-white/15 text-white/50"}`}>
                {s.sideNote}
              </div>
            )}
            {advice && (
              <div className="max-w-full rounded-full border border-sky-300/40 bg-sky-400/10 px-3 py-1 text-center text-[11px] text-sky-200 sm:text-xs">
                Basic strategy: {advice}
              </div>
            )}
          </div>

          {/* Joueur */}
          <div className="flex flex-wrap items-start justify-center gap-2 sm:gap-5">
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
                    <span className="rounded-full bg-black/30 px-2.5 py-0.5 font-bold text-white">
                      {v.soft && v.total < 21 ? `${v.total - 10}/${v.total}` : v.total}
                    </span>
                    <span className="text-white/50">
                      ◈ {money(h.bet)}
                      {h.doubled && " (doubled)"}
                    </span>
                    {h.result && (
                      <span className={`animate-pop rounded-full border px-2 py-0.5 font-bold ${RESULT_UI[h.result].cls}`}>
                        {RESULT_UI[h.result].label}
                      </span>
                    )}
                  </div>
                  <div className={`flex justify-center ${compact ? "min-h-[60px] sm:min-h-24" : "min-h-20 sm:min-h-28"}`}>
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

          {/* Table markings — engraved ornament text, matches immersive.
              Shrink down on mobile so the three labels fit on one line. */}
<div
  aria-hidden="true"
  className="pointer-events-none mt-1.5 flex translate-y-[3px] items-center justify-center gap-1.5 text-center sm:gap-x-3"
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

          {/* Zone de mise */}
<div className="relative mt-3 flex flex-col items-center gap-2.5 sm:mt-4 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
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

  <div className="order-1 lg:order-2">
    {/* BET circle — recessed into the felt with a double gold ring.
        When there are chips on the table, the pile IS the content of
        the circle, growing taller as the bet grows. The amount sits
        below as a small gold label. */}
    <div className="flex flex-col items-center">
      <div
        className="relative flex h-20 w-20 items-end justify-center overflow-visible rounded-full text-center sm:h-24 sm:w-24"
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

      {/* Amount label under the circle (also shows spot count). */}
      <div className="mt-1.5 text-center">
        <p
          className="text-xs font-black tabular-nums sm:text-sm"
          style={{
            color: "#f0e5c7",
            textShadow: "0 1px 0 rgba(0, 0, 0, 0.9)",
          }}
        >
          ◈ {money(s.bet)}
        </p>
        {s.settings.spots > 1 && (
          <p className="text-[9px] text-white/50">× {s.settings.spots} spots</p>
        )}
      </div>
    </div>
  </div>

  <div className="order-2 flex w-full max-w-[300px] items-stretch justify-center gap-2 lg:order-none lg:contents">
    <div className="min-w-0 flex-1 lg:order-1 lg:w-36 lg:flex-none">
      <SidePill
        label="PP"
        amount={s.ppBet}
        disabled={!canBet || s.busy}
        onIncrease={() => adjustSide("ppBet", 10)}
        onDecrease={() => adjustSide("ppBet", -10)}
      />
    </div>

    <div className="min-w-0 flex-1 lg:order-3 lg:w-36 lg:flex-none">
      <SidePill
        label="21+3"
        amount={s.t3Bet}
        disabled={!canBet || s.busy}
        onIncrease={() => adjustSide("t3Bet", 10)}
        onDecrease={() => adjustSide("t3Bet", -10)}
      />
    </div>
  </div>
</div>
        </div>

        {/* Contrôles */}
        {s.phase === "settled" && roundBreakdown && (
  <details className="mx-3 mb-3 rounded-2xl border border-[#d7b45b]/20 bg-black/20 sm:mx-7">
    <summary className="cursor-pointer rounded-2xl px-4 py-3 text-xs font-semibold text-[#e5c779] outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779]">
      Round breakdown · {signedMoney(roundBreakdown.total)}
    </summary>

    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 px-4 pb-4 text-xs">
      {[
        { label: "Main hands", value: roundBreakdown.main },
        { label: "Insurance", value: roundBreakdown.insurance },
        { label: "Perfect Pairs", value: roundBreakdown.perfectPairs },
        { label: "21+3", value: roundBreakdown.twentyOnePlusThree },
      ].map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-white/50">{label}</dt>
          <dd
            className={`text-right font-semibold tabular-nums ${
              value > 0
                ? "text-emerald-300"
                : value < 0
                ? "text-red-300"
                : "text-white/50"
            }`}
          >
            {signedMoney(value)}
          </dd>
        </div>
      ))}

      <dt className="border-t border-white/10 pt-2 font-semibold text-white">
        Round net
      </dt>
      <dd
        className={`border-t border-white/10 pt-2 text-right font-bold tabular-nums ${
          roundBreakdown.total > 0
            ? "text-emerald-300"
            : roundBreakdown.total < 0
            ? "text-red-300"
            : "text-white/70"
        }`}
      >
        {signedMoney(roundBreakdown.total)}
      </dd>
    </dl>
  </details>
)}
        <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[#101713]/95 px-2 py-2 backdrop-blur sm:px-7 sm:py-4 lg:static lg:border-0 lg:bg-transparent">
          {s.phase === "insurance" ? (
            // The InsuranceModal (mounted at the Blackjack parent) owns
            // this decision now — keep the slot visually empty here.
            <div aria-hidden="true" className="h-10 sm:h-11" />
          ) : canBet ? (
            <div className="flex flex-col items-center gap-2">
              {outOfChips ? (
                <button onClick={refill} className={`${mobileAction} border-transparent bg-[#d7b45b] text-[#10130e] hover:bg-[#efd58c]  sm:w-auto sm:px-4 sm:text-base`}>
                  Out of chips · take a ◈ {REFILL} refill
                </button>
              ) : (
                <button
                  onClick={deal}
                  disabled={s.bet < MIN_BET || stake > s.balance}
                  className={`${mobileAction} max-w-sm border-transparent bg-[#d7b45b] text-xs text-[#10130e] hover:bg-[#efd58c] sm:w-auto sm:px-10 sm:text-base lg:min-w-[280px]`}
                >
                  {s.phase === "settled" ? "Deal again" : "Deal"} · ◈ {money(stake)}
                </button>
              )}
              <p className="hidden text-[11px] text-white/30 sm:block">Press Space to deal</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5 lg:mx-auto lg:max-w-3xl lg:gap-3">
              <button onClick={hit} disabled={!playing} className={`${mobileAction} border-transparent bg-[#d7b45b] text-[#10130e] hover:bg-[#efd58c]  sm:w-auto sm:px-4 sm:text-base`}>
                Hit
              </button>
              <button onClick={stand} disabled={!playing} className={`${mobileAction} border-white/20 text-white hover:border-[#d7b45b] hover:text-[#e5c779]  sm:w-auto sm:px-4 sm:text-base`}>
                Stand
              </button>
              <button onClick={double} disabled={!canDouble} className={`${mobileAction} border-[#d7b45b]/50 text-[#e5c779] hover:bg-[#d7b45b]/10  sm:w-auto sm:px-4 sm:text-base`}>
                Double
              </button>
              <button onClick={split} disabled={!canSplit} className={`${mobileAction} border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20  sm:w-auto sm:px-4 sm:text-base`}>
                Split
              </button>
              <button onClick={surrender} disabled={!canSurrender} className={`${mobileAction} border-white/15 text-white/60 hover:border-red-300/50 hover:text-red-200  sm:w-auto sm:px-4 sm:text-base`}>
                <span className="lg:hidden">Surr.</span>
                <span className="hidden lg:inline">Surrender</span>
              </button>
            </div>
          )}
        </div>
      </section>
  );
}