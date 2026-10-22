"use client";

import { handValue, isBlackjack } from "../lib/blackjack";
import type { Result } from "../lib/blackjack";
import { MIN_BET, REFILL, THEMES, money } from "../lib/game";
import { ChipStack } from "./ui";
import PlayingCard from "./PlayingCard";
import Confetti from "./Confetti";
import type { Game } from "../lib/useBlackjack";
import DealerShoe from "./DealerShoe";

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
  return (
    <div
  className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-full border px-2.5 py-1.5 lg:w-36 ${
    disabled
      ? "border-white/15 bg-black/25 opacity-70"
      : amount > 0
      ? "border-[#e5c779]/60 bg-[#e5c779]/12"
      : "border-white/15 bg-black/25"
  }`}
>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-wide text-[#e5c779] sm:text-[10px]">
          {label}
        </p>
        <p className="text-[10px] font-bold text-white sm:text-xs">
          {amount > 0 ? `◈ ${money(amount)}` : "Off"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || amount === 0}
          aria-label={`Decrease ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xs font-bold text-white/80 transition hover:border-[#e5c779]/60 hover:text-[#e5c779] disabled:opacity-30"
        >
          −
        </button>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled}
          aria-label={`Increase ${label} side bet`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xs font-bold text-white/80 transition hover:border-[#e5c779]/60 hover:text-[#e5c779] disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
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
  deal,
  takeInsurance,
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

        <div className={`relative overflow-hidden ${THEMES[s.settings.theme]} px-2 py-4 sm:px-9 sm:py-5`}>
          {s.celebrate > 0 && <Confetti key={s.celebrate} />}
          <DealerShoe className="absolute -right-24 -top-16 z-0 hidden sm:block" />
          {s.shuffling && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60" role="status">
              <div className="flex gap-3 text-3xl text-[#e5c779]">
                {["♠", "♥", "♦", "♣"].map((g, i) => (
                  <span key={g} className="animate-bounce" style={{ animationDelay: `${i * 120}ms` }}>{g}</span>
                ))}
              </div>
              <p className="text-sm text-white/80">Shuffling the shoe…</p>
            </div>
          )}
          {/* Croupier — zone gravée dans le tapis */}
<div className="relative mt-1.5 flex min-h-[92px] items-center justify-center sm:min-h-28">

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
<div className="relative z-10 mt-4 flex justify-center">
  <p
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pl-[0.45em] text-[10px] font-bold uppercase tracking-[0.45em] text-white/[0.12] sm:text-xs"
  >
    Dealer
  </p>

  {s.dealer.map((card, i) => (
  <PlayingCard
    key={`d${i}-${card.rank}${card.suit}`}
    card={card}
    faceDown={i === 1 && !s.hole}
    overlap={i > 0}
    back={back}
  />
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
      className="min-h-24 w-full sm:min-h-28"
    />
  )}

  {s.hands.map((h, i) => {
              const v = handValue(h.cards);
              const isActive = s.phase === "player" && i === s.active && s.hands.length > 1;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-2 transition sm:p-3 ${
                    isActive ? "border-[#e5c779]/70 bg-[#e5c779]/10" : "border-transparent"
                  } ${compact && !isActive && s.phase === "player" ? "opacity-75" : ""}`}
                >
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
                  <div className={`flex justify-center ${compact ? "min-h-[72px] sm:min-h-24" : "min-h-24 sm:min-h-28"}`}>
                    {h.cards.map((card, k) => (
                      <PlayingCard key={`p${i}-${k}-${card.rank}${card.suit}`} card={card} overlap={k > 0} compact={compact} back={back} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Marquages du tapis */}
<div
  aria-hidden="true"
  className="pointer-events-none mt-1.5 flex translate-y-[3px] items-center justify-center gap-2 text-center sm:gap-3"
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

          {/* Zone de mise */}
<div className="relative mt-3 flex flex-col items-center gap-2.5 sm:mt-4 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -bottom-10 left-1/2 h-40 w-[min(94%,680px)] -translate-x-1/2 rounded-[50%] border border-white/[0.07]"
  />

  <div
    aria-hidden="true"
    className="pointer-events-none absolute -bottom-7 left-1/2 h-28 w-[min(78%,520px)] -translate-x-1/2 rounded-[50%] border border-white/[0.05]"
  />
  <div className="order-1 lg:order-2">
    <div
      className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 text-center sm:h-20 sm:w-20 ${
        canBet
          ? "border-[#e5c779]/80 bg-[#e5c779]/12 shadow-[0_0_28px_rgba(229,199,121,0.20)]"
          : "border-white/20 bg-black/25"
      }`}
    >
      <div className="px-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#e5c779] sm:text-[10px]">
          Bet
        </p>
        <p className="mt-1 text-sm font-black text-white sm:text-base">
          ◈ {money(s.bet)}
        </p>
        {s.settings.spots > 1 && (
          <p className="mt-0.5 text-[9px] text-white/50">
            × {s.settings.spots} spots
          </p>
        )}
      </div>

      {pileAmount > 0 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <ChipStack amount={pileAmount} />
        </div>
      )}
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
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
              <button onClick={() => takeInsurance(true)} disabled={s.busy} className={`${mobileAction} border-transparent bg-[#d7b45b] text-[#10130e] hover:bg-[#efd58c]  sm:w-auto sm:px-4 sm:text-base`}>
                Insurance (◈ {money(s.hands.reduce((a, h) => a + h.bet, 0) / 2)})
              </button>
              <button onClick={() => takeInsurance(false)} disabled={s.busy} className={`${mobileAction} border-white/20 text-white hover:border-[#d7b45b] hover:text-[#e5c779]  sm:w-auto sm:px-4 sm:text-base`}>
                No thanks
              </button>
            </div>
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