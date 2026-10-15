"use client";

import { handValue, isBlackjack } from "../lib/blackjack";
import type { Result } from "../lib/blackjack";
import { MIN_BET, REFILL, THEMES, money } from "../lib/game";
import { ChipStack, btn } from "./ui";
import PlayingCard from "./PlayingCard";
import Confetti from "./Confetti";
import type { Game } from "../lib/useBlackjack";

const RESULT_UI: Record<Result, { label: string; cls: string }> = {
  blackjack: { label: "Blackjack", cls: "border-[#e5c779] bg-[#e5c779]/20 text-[#f5d778]" },
  win: { label: "Win", cls: "border-emerald-400/50 bg-emerald-500/20 text-emerald-300" },
  push: { label: "Push", cls: "border-white/30 bg-white/10 text-white/70" },
  lose: { label: "Lose", cls: "border-red-400/50 bg-red-500/20 text-red-300" },
  bust: { label: "Bust", cls: "border-red-400/50 bg-red-500/20 text-red-300" },
  surrender: { label: "Surrender", cls: "border-white/30 bg-white/10 text-white/70" },
};

export default function Table({ g }: { g: Game }) {
  const { s, canBet, playing, canDouble, canSplit, canSurrender, advice, dealerVal, outOfChips, totalCards, shoePct, compact, stake, back, pileAmount, deal, takeInsurance, hit, stand, double, split, surrender, refill } = g;

  return (
      <section className="overflow-clip rounded-3xl border border-[#c8a65b]/20 bg-[#101713] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <h3 className="text-xl font-bold">Blackjack</h3>
            <p className="mt-0.5 text-xs text-white/40">
              {s.settings.decks} decks · dealer {s.settings.h17 ? "hits" : "stands on"} soft 17 · blackjack pays{" "}
              {s.settings.bj65 ? "6 to 5" : "3 to 2"}
            </p>
          </div>
          <div className="w-28 text-right text-[11px] text-white/40">
            Shoe · {s.shoe.length || totalCards} cards
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#d7b45b]/70 transition-all duration-500" style={{ width: `${shoePct}%` }} />
            </div>
          </div>
        </div>

        <div className={`relative ${THEMES[s.settings.theme]} px-3 py-8 sm:px-9`}>
          {s.celebrate > 0 && <Confetti key={s.celebrate} />}
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
          {/* Croupier */}
          <div className="flex items-center justify-center gap-3 text-sm text-white/60">
            Dealer
            {s.dealer.length > 0 && (
              <span className="rounded-full bg-black/30 px-3 py-0.5 text-xs font-bold text-white">
                {s.hole && isBlackjack(s.dealer)
                  ? "Blackjack"
                  : dealerVal.soft && dealerVal.total < 21 && s.hole
                  ? `${dealerVal.total - 10}/${dealerVal.total}`
                  : dealerVal.total}
                {!s.hole && " + ?"}
              </span>
            )}
          </div>
          <div className="mt-4 flex min-h-28 justify-center sm:min-h-36">
            {s.dealer.map((card, i) => (
              <PlayingCard key={`d${i}-${card.rank}${card.suit}`} card={card} faceDown={i === 1 && !s.hole} overlap={i > 0} back={back} />
            ))}
          </div>

          {/* Message (annoncé aux lecteurs d'écran) */}
          <div className="my-7 flex flex-col items-center gap-2" role="status" aria-live="polite">
            <div key={s.message} className="animate-pop rounded-full border border-[#d7b45b]/30 bg-black/30 px-5 py-2 text-center text-sm text-[#e5c779]">
              {s.message}
            </div>
            {s.net !== null && s.net !== 0 && (
              <div className={`animate-pop text-2xl font-black ${s.net > 0 ? "text-[#f5d778]" : "text-red-300"}`}>
                {s.net > 0 ? "+" : "−"}◈ {money(Math.abs(s.net))}
              </div>
            )}
            {s.sideNote && (
              <div className={`animate-pop rounded-full border px-4 py-1 text-xs ${s.sideNote.includes("+") ? "border-[#e5c779]/60 bg-[#e5c779]/15 text-[#f5d778]" : "border-white/15 text-white/50"}`}>
                {s.sideNote}
              </div>
            )}
            {advice && (
              <div className="rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-1 text-xs text-sky-200">
                Basic strategy: {advice}
              </div>
            )}
          </div>

          {/* Joueur */}
          <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5">
            {s.hands.length === 0 && (
              <div className="flex min-h-28 items-center text-sm text-white/40 sm:min-h-36">Your cards will appear here</div>
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
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="rounded-full bg-black/30 px-3 py-0.5 font-bold text-white">
                      {v.soft && v.total < 21 ? `${v.total - 10}/${v.total}` : v.total}
                    </span>
                    <span className="text-white/50">
                      ◈ {money(h.bet)}
                      {h.doubled && " (doubled)"}
                    </span>
                    {h.result && (
                      <span className={`animate-pop rounded-full border px-2.5 py-0.5 font-bold ${RESULT_UI[h.result].cls}`}>
                        {RESULT_UI[h.result].label}
                      </span>
                    )}
                  </div>
                  <div className={`flex justify-center ${compact ? "min-h-[88px] sm:min-h-28" : "min-h-28 sm:min-h-36"}`}>
                    {h.cards.map((card, k) => (
                      <PlayingCard key={`p${i}-${k}-${card.rank}${card.suit}`} card={card} overlap={k > 0} compact={compact} back={back} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pile de jetons */}
          <div className="mt-6 flex min-h-12 flex-col items-center justify-end gap-1">
            <ChipStack amount={pileAmount} />
            {pileAmount > 0 && <span className="text-[11px] text-white/50">◈ {money(pileAmount)}</span>}
          </div>
        </div>

        {/* Contrôles */}
        <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[#101713]/95 p-4 backdrop-blur sm:p-7 lg:static lg:border-0 lg:bg-transparent">
          {s.phase === "insurance" ? (
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => takeInsurance(true)} disabled={s.busy} className={`${btn} bg-[#d7b45b] text-[#10130e] hover:bg-[#efd58c]`}>
                Insurance (◈ {money(s.hands.reduce((a, h) => a + h.bet, 0) / 2)})
              </button>
              <button onClick={() => takeInsurance(false)} disabled={s.busy} className={`${btn} border border-white/20 hover:border-[#d7b45b] hover:text-[#e5c779]`}>
                No thanks
              </button>
            </div>
          ) : canBet ? (
            <div className="flex flex-col items-center gap-3">
              {outOfChips ? (
                <button onClick={refill} className={`${btn} bg-[#d7b45b] text-[#10130e] hover:bg-[#efd58c]`}>
                  Out of chips · take a ◈ {REFILL} refill
                </button>
              ) : (
                <button
                  onClick={deal}
                  disabled={s.bet < MIN_BET || stake > s.balance}
                  className={`${btn} bg-[#d7b45b] px-10 text-[#10130e] hover:bg-[#efd58c]`}
                >
                  {s.phase === "settled" ? "Deal again" : "Deal"} · ◈ {money(stake)}
                </button>
              )}
              <p className="text-[11px] text-white/30">Press Space to deal</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={hit} disabled={!playing} className={`${btn} bg-[#d7b45b] text-[#10130e] hover:bg-[#efd58c]`}>
                Hit <kbd className="ml-1 text-[10px] opacity-60">H</kbd>
              </button>
              <button onClick={stand} disabled={!playing} className={`${btn} border border-white/20 hover:border-[#d7b45b] hover:text-[#e5c779]`}>
                Stand <kbd className="ml-1 text-[10px] opacity-60">S</kbd>
              </button>
              <button onClick={double} disabled={!canDouble} className={`${btn} border border-[#d7b45b]/50 text-[#e5c779] hover:bg-[#d7b45b]/10`}>
                Double <kbd className="ml-1 text-[10px] opacity-60">D</kbd>
              </button>
              <button onClick={split} disabled={!canSplit} className={`${btn} border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20`}>
                Split <kbd className="ml-1 text-[10px] opacity-60">P</kbd>
              </button>
              <button onClick={surrender} disabled={!canSurrender} className={`${btn} border border-white/15 text-white/60 hover:border-red-300/50 hover:text-red-200`}>
                Surrender <kbd className="ml-1 text-[10px] opacity-60">R</kbd>
              </button>
            </div>
          )}
        </div>
      </section>
  );
}