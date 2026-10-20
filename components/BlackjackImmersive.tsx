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

export default function BlackjackImmersive({
  g,
  onClose,
}: {
  g: Game;
  onClose: () => void;
}) {
  const {
    s,
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

      if (menuOpen) setMenuOpen(false);
      else onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, onClose]);

  const tableStyle = {
    "--bj-card-h": compact
      ? "clamp(60px, 14dvh, 118px)"
      : "clamp(68px, 18dvh, 160px)",
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

        <div className="flex min-h-0 flex-col items-center justify-center gap-2 overflow-auto px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-white/60">
            Dealer

            {s.dealer.length > 0 && (
              <span className="rounded-full bg-black/30 px-2.5 py-1 font-bold text-white">
                {s.hole && isBlackjack(s.dealer)
                  ? "Blackjack"
                  : dealerVal.soft && dealerVal.total < 21 && s.hole
                  ? `${dealerVal.total - 10}/${dealerVal.total}`
                  : dealerVal.total}
                {!s.hole && " + ?"}
              </span>
            )}
          </div>

          <div className="flex shrink-0 justify-center">
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
          className="flex h-[76px] shrink-0 flex-col items-center justify-center gap-1 px-3 text-center sm:h-[88px]"
        >
          <p className="max-w-full text-xs font-semibold text-[#ead5a3] sm:text-sm">
            {s.message}
          </p>

          {s.phase === "settled" && s.net !== null ? (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={`Round net ${signed(s.net)}. Open breakdown`}
              className={`rounded-lg px-3 py-1 text-xl font-black tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779] ${
                s.net > 0
                  ? "text-[#f5d778]"
                  : s.net < 0
                  ? "text-red-300"
                  : "text-white/70"
              }`}
            >
              {signed(s.net)}
              <span className="ml-2 text-xs font-normal text-white/40">
                ⓘ
              </span>
            </button>
          ) : advice ? (
            <p className="text-[11px] text-sky-200">
              Basic strategy · {advice}
            </p>
          ) : (
            <span aria-hidden="true" className="h-5" />
          )}
        </div>

        <div
          className="min-h-0 overflow-auto overscroll-contain px-2 py-2 sm:px-5"
          style={playerCardStyle}
        >
          <div
            className="grid min-h-full items-center gap-1 sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${handCount}, minmax(0, 1fr))`,
            }}
          >
            {s.hands.length === 0 && (
              <p className="text-sm text-white/35">
                Your cards will appear here
              </p>
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
      </main>

      <footer
        className="relative z-20 shrink-0 border-t border-[#d7b45b]/25 bg-[#101713] px-2 pt-2 sm:px-5"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
        }}
      >
        {bettingOpen ? (
          <div className="mx-auto mb-2 max-h-[34dvh] max-w-3xl overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-black/20 p-2 sm:max-h-[28dvh]">
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

  <div className="mx-auto grid w-full max-w-sm grid-cols-5 gap-2">
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
        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-white/60 text-[11px] font-black outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-30 ${CHIP_BG[value]}`}
      >
        {value}
      </button>
    ))}
  </div>

  <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
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

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <SideBet
                roomy
                label="Perfect Pairs"
                hint="First two cards · up to 25:1"
                amount={s.ppBet}
                onChange={(delta) => adjustSide("ppBet", delta)}
                minusDisabled={!canBet || s.ppBet <= 0}
                plusDisabled={
                  !canBet || s.ppBet >= 100 || stake + 10 > s.balance
                }
              />

              <SideBet
                roomy
                label="21+3"
                hint="Your cards + dealer upcard · up to 100:1"
                amount={s.t3Bet}
                onChange={(delta) => adjustSide("t3Bet", delta)}
                minusDisabled={!canBet || s.t3Bet <= 0}
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
                className="rounded px-2 py-1 text-[#e5c779] outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779]"
              >
                Edit bet
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
                className={`${control} ${gold} min-w-0 flex-1 sm:min-h-12`}
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
              className={`${control} ${gold} sm:min-h-12`}
            >
              Hit
            </button>

            <button
              type="button"
              onClick={stand}
              disabled={!playing}
              className={`${control} ${neutral} sm:min-h-12`}
            >
              Stand
            </button>

            <button
              type="button"
              onClick={double}
              disabled={!canDouble}
              className={`${control} ${neutral} sm:min-h-12`}
            >
              Double
            </button>

            <button
              type="button"
              onClick={split}
              disabled={!canSplit}
              className={`${control} ${neutral} sm:min-h-12`}
            >
              Split
            </button>

            <button
              type="button"
              onClick={surrender}
              disabled={!canSurrender}
              className={`${control} ${neutral} sm:min-h-12`}
            >
              <span className="sm:hidden">Surr.</span>
              <span className="hidden sm:inline">Surrender</span>
            </button>
          </div>
        )}
      </footer>

      {menuOpen && (
        <InfoPanel g={g} onClose={() => setMenuOpen(false)} />
      )}
    </div>,
    document.body
  );
}