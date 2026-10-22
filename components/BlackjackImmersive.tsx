"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { handValue, isBlackjack } from "../lib/blackjack";
import {
  CHIPS,
  CHIP_BG,
  MIN_BET,
  REFILL,
  THEMES,
  money,
} from "../lib/game";
import type { Game } from "../lib/useBlackjack";
import { useSession } from "../lib/sessionStore";
import { Counter, SideBet } from "./ui";
import PlayingCard from "./PlayingCard";
import Sidebar from "./Sidebar";
import Confetti from "./Confetti";
import { useModalFocus } from "./useModalFocus";
import DealerShoe from "./DealerShoe";

const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}◈ ${money(Math.abs(value))}`;

const control =
  "inline-flex min-h-10 items-center justify-center rounded-xl border px-2 py-2 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm";

const gold =
  "border-[#d7b45b] bg-[#d7b45b] text-[#10130e] enabled:hover:bg-[#efd58c]";

const neutral =
  "border-white/20 bg-white/[0.04] text-white/85 enabled:hover:border-[#d7b45b] enabled:hover:text-[#e5c779]";

function InfoPanel({
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

function ImmersiveSidePill({
  label,
  amount,
  disabled,
  onIncrease,
  onDecrease,
  plusDisabled,
}: {
  label: string;
  amount: number;
  disabled: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  plusDisabled: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-1.5 rounded-full border px-2 py-1 transition ${
        amount > 0
          ? "border-[#e5c779]/60 bg-[#e5c779]/12"
          : "border-white/15 bg-black/25"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-wide text-[#e5c779]">
          {label}
        </p>
        <p className="text-[10px] font-bold tabular-nums text-white">
          {amount > 0 ? `◈ ${money(amount)}` : "Off"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || amount <= 0}
          aria-label={`Decrease ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xs font-bold text-white/80 transition enabled:hover:border-[#e5c779]/60 enabled:hover:text-[#e5c779] disabled:opacity-30"
        >
          −
        </button>

        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled || plusDisabled}
          aria-label={`Increase ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xs font-bold text-white/80 transition enabled:hover:border-[#e5c779]/60 enabled:hover:text-[#e5c779] disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ResultRail({
  g,
  onNewRound,
}: {
  g: Game;
  onNewRound: () => void;
}) {
  const { s, roundBreakdown, canBet, stake, outOfChips } = g;
  const showResult = s.phase === "settled" && roundBreakdown;

  const canStartRound =
    canBet && !outOfChips && s.bet >= MIN_BET && stake <= s.balance;

  return (
    <aside
      className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 md:block"
      aria-live="polite"
    >
      <div
        className={`origin-left transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showResult
            ? "scale-100 opacity-100"
            : "scale-[0.94] opacity-95"
        }`}
      >
        {showResult ? (
          <div
            key={`result-${s.net}-${roundBreakdown.total}`}
            className="animate-pop w-64 overflow-hidden rounded-3xl border border-[#d7b45b]/45 bg-gradient-to-b from-[#101713]/95 to-[#0a100c]/95 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <div className="border-b border-[#d7b45b]/20 bg-[#d7b45b]/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e5c779]">
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
            </div>

            <dl className="space-y-2 px-4 py-3 text-[11px]">
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
                <dt className="text-xs font-bold text-white">Total</dt>
                <dd
                  className={`text-sm font-black tabular-nums ${
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

            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={onNewRound}
                disabled={!canStartRound}
                className={`${control} ${gold} h-9 w-full text-[11px] uppercase tracking-wider`}
              >
                New round · ◈ {money(stake)}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-full border border-[#d7b45b]/30 bg-black/60 px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c779]/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e5c779]" />
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
              Hand in progress
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}


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
    outOfChips,
    addChip,
    setBetTo,
    adjustSide,
    deal,
    hit,
    stand,
    double,
    split,
    surrender,
    takeInsurance,
    refill,
  } = g;

  const session = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editBet, setEditBet] = useState(s.phase === "betting");
  const [resultOpen, setResultOpen] = useState(false);

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
    ? "clamp(54px, 11dvh, 96px)"
    : "clamp(60px, 14dvh, 124px)",
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
        className={`relative isolate grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden ${THEMES[s.settings.theme]}`}
      >
        {s.celebrate > 0 && (
  <Confetti key={s.celebrate} />
)}

<DealerShoe className="absolute -right-16 -top-10 z-0 hidden md:block" />

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
<div className="relative z-10 flex shrink-0 justify-center">
  <p
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pl-[0.45em] text-[10px] font-bold uppercase tracking-[0.45em] text-white/[0.10] sm:text-xs"
  >
    Dealer
  </p>

  {s.dealer.map((card, index) => (
  <PlayingCard
    key={`dealer-${index}-${card.rank}${card.suit}`}
    card={card}
    faceDown={index === 1 && !s.hole}
    overlap={index > 0}
    back={back}
    fit
  />
))}
</div>
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex h-[52px] shrink-0 flex-col items-center justify-center gap-0.5 px-3 text-center sm:h-[60px]"
        >
          <p className="max-w-full text-xs font-semibold text-[#ead5a3] sm:text-sm">
            {s.message}
          </p>

          {s.phase === "settled" && s.net !== null ? (
  <div className="flex items-center justify-center gap-2">
    <span
      className={`text-xl font-black tabular-nums ${
        s.net > 0
          ? "text-[#f5d778]"
          : s.net < 0
          ? "text-red-300"
          : "text-white/70"
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

              return (
                <div
                  key={index}
                  className={`min-w-0 rounded-2xl border p-1 transition sm:p-2 ${
                    selected
                      ? "border-[#e5c779]/70 bg-[#e5c779]/10"
                      : "border-transparent"
                  }`}
                >
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

                  <div className="flex justify-center">
                    {hand.cards.map((card, cardIndex) => (
                      <PlayingCard
                        key={`${index}-${cardIndex}-${card.rank}${card.suit}`}
                        card={card}
                        overlap={cardIndex > 0}
                        back={back}
                        compact={compact}
                        fit
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

              {/* Marquages du tapis — fixes au bas de la table */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-2 sm:gap-3"
        >
          <p className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.18em] text-white/20 sm:text-[9px]">
            BJ {s.settings.bj65 ? "6:5" : "3:2"}
          </p>

          <span className="h-2 w-px bg-white/10" />

          <p className="whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.18em] text-white/15 sm:text-[9px]">
            Insurance 2:1
          </p>

          <span className="h-2 w-px bg-white/10" />

          <p className="whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.18em] text-white/15 sm:text-[9px]">
            {s.settings.h17 ? "H17" : "S17"}
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

        {s.shuffling && (
          <div
            role="status"
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 backdrop-blur-sm"
          >
            <p className="animate-pulse text-lg font-bold text-[#e5c779]">
              Shuffling the shoe…
            </p>
          </div>
        )}
                <ResultRail g={g} onNewRound={deal} />
      </main>

      <footer
        className="relative z-20 shrink-0 border-t border-[#d7b45b]/25 bg-[#101713] px-2 pt-2 sm:px-5"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
        }}
      >
        {bettingOpen ? (
          <div className="mx-auto mb-2 max-h-[26dvh] max-w-xl overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-black/20 p-2 pb-2.5 sm:max-h-[26dvh]">
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
  <ImmersiveSidePill
    label="PP"
    amount={s.ppBet}
    disabled={!canBet}
    onIncrease={() => adjustSide("ppBet", 10)}
    onDecrease={() => adjustSide("ppBet", -10)}
    plusDisabled={
      !canBet || s.ppBet >= 100 || stake + 10 > s.balance
    }
  />

  <ImmersiveSidePill
    label="21+3"
    amount={s.t3Bet}
    disabled={!canBet}
    onIncrease={() => adjustSide("t3Bet", 10)}
    onDecrease={() => adjustSide("t3Bet", -10)}
    plusDisabled={
      !canBet || s.t3Bet >= 100 || stake + 10 > s.balance
    }
  />
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
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => takeInsurance(true)}
              disabled={s.busy}
              className={`${control} ${gold}`}
            >
              Insurance · ◈{" "}
              {money(
                s.hands.reduce((sum, hand) => sum + hand.bet, 0) / 2
              )}
            </button>

            <button
              type="button"
              onClick={() => takeInsurance(false)}
              disabled={s.busy}
              className={`${control} ${neutral}`}
            >
              No thanks
            </button>
          </div>
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