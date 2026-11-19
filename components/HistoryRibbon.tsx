"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { handValue, isBlackjack } from "../lib/blackjack";
import { money, type Round, type S } from "../lib/game";
import HandResultBadge from "./HandResultBadge";
import PlayingCard from "./PlayingCard";

/**
 * Horizontal ribbon of the last ~10 rounds, rendered as tiny
 * colour-coded dots. Lets the player feel the rhythm of the shoe at
 * a glance without opening Stats. Hidden entirely until at least one
 * round has been settled, so the empty state never clutters the felt.
 *
 *  - gold (filled + halo) → blackjack win
 *  - green                → regular win
 *  - red                  → loss
 *  - neutral              → push
 *
 * Each dot is a button: it opens a replay of that hand (the cards on
 * both sides, the dealer's call and the result).
 */
function colorFor(round: { net: number; bj: boolean }): {
  bg: string;
  ring: string;
  label: string;
} {
  if (round.bj) {
    return {
      bg: "bg-gradient-to-br from-[#f5d778] to-[#c89a3f]",
      ring: "ring-[#d7b45b]/60",
      label: "Blackjack",
    };
  }
  if (round.net > 0) {
    return {
      bg: "bg-emerald-500/80",
      ring: "ring-emerald-400/40",
      label: "Win",
    };
  }
  if (round.net < 0) {
    return {
      bg: "bg-red-500/70",
      ring: "ring-red-400/40",
      label: "Loss",
    };
  }
  return { bg: "bg-white/40", ring: "ring-white/20", label: "Push" };
}

const signedNet = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}◈ ${money(Math.abs(n))}`;

function HandReplay({
  round,
  back,
  onClose,
}: {
  round: Round;
  back?: [string, string];
  onClose: () => void;
}) {
  // While the replay is open it owns the keyboard: Esc closes it, and
  // no key reaches the table underneath (so Space can't deal a hand
  // and Esc doesn't also leave Focus mode).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") return;
      e.stopPropagation();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const dealer = round.dealer ?? [];
  const hands = round.hands ?? [];
  const dealerTotal = handValue(dealer).total;

  return createPortal(
    <div className="safe-y fixed inset-0 z-[190] flex items-center justify-center p-4 animate-vegas-fade">
      <button
        type="button"
        aria-label="Close hand replay"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hand replay"
        className="relative w-full max-w-md animate-insurance-slide-in overflow-hidden rounded-3xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1512] via-[#120e0b] to-[#070504] shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-[#d7b45b]/15"
        />

        <div className="relative flex items-start justify-between gap-3 border-b border-[#d7b45b]/15 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7b45b]/80">
              Hand replay
            </p>
            <h2 className="font-display mt-0.5 text-base font-black tracking-wide text-white">
              {round.call ?? colorFor(round).label}
            </h2>
            <p
              className={`mt-1 text-xl font-black tabular-nums ${
                round.net > 0
                  ? "text-[#f5d778]"
                  : round.net < 0
                    ? "text-red-300"
                    : "text-white/70"
              }`}
            >
              {signedNet(round.net)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 outline-none transition hover:border-[#d7b45b]/60 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
          >
            ×
          </button>
        </div>

        <div className="relative max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
          <section>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
              Dealer
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold tracking-normal text-white">
                {isBlackjack(dealer) ? "Blackjack" : dealerTotal}
              </span>
            </p>
            <div className="flex pl-1">
              {dealer.map((card, i) => (
                <PlayingCard
                  key={`d-${i}`}
                  card={card}
                  overlap={i > 0}
                  compact
                  back={back}
                  animated={false}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
              {hands.length > 1 ? "Your hands" : "Your hand"}
            </p>
            <ul className="space-y-3">
              {hands.map((hand, i) => (
                <li key={`h-${i}`} className="flex items-center gap-4">
                  <div className="flex shrink-0 pl-1">
                    {hand.cards.map((card, k) => (
                      <PlayingCard
                        key={`h-${i}-${k}`}
                        card={card}
                        overlap={k > 0}
                        compact
                        back={back}
                        animated={false}
                      />
                    ))}
                  </div>
                  <div className="min-w-0 space-y-1 text-[11px]">
                    <p className="flex items-center gap-2">
                      <span className="rounded-full bg-black/40 px-2 py-0.5 font-bold text-white">
                        {handValue(hand.cards).total}
                      </span>
                      {hand.result && <HandResultBadge result={hand.result} />}
                    </p>
                    <p className="tabular-nums text-white/50">Bet ◈ {money(hand.bet)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function HistoryRibbon({
  history,
  max = 10,
  back,
  className = "",
}: {
  history: S["history"];
  max?: number;
  /** Card back colours of the current table, for the replay. */
  back?: [string, string];
  className?: string;
}) {
  const [replay, setReplay] = useState<Round | null>(null);

  if (!history.length) return null;
  // The game appends each settled round to the END of history, so
  // `slice(-max)` already gives us the last N rounds in chronological
  // order (oldest → latest, left → right on the ribbon — the way
  // scoreboards read).
  const recent = history.slice(-max);

  return (
    <>
      <div
        aria-label="Last rounds"
        className={`items-center rounded-full border border-[#d7b45b]/25 bg-gradient-to-b from-[#1a1612]/85 to-[#0a0806]/85 px-1.5 py-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(229,199,121,0.1)] backdrop-blur-sm ${className}`}
      >
        <span className="pl-0.5 pr-1 text-[8px] font-black uppercase tracking-widest text-[#d7b45b]/70">
          Last
        </span>
        {recent.map((round, i) => {
          const { bg, ring, label } = colorFor(round);
          // Latest sits on the right — mark it with a soft ring so the
          // eye lands there first.
          const isLatest = i === recent.length - 1;
          // Rounds saved before the replay existed carry no cards.
          const canReplay = Boolean(round.hands?.length);
          // Phones show the last 5 only, so the ribbon stays clear of
          // the dealer's cards.
          const phoneHidden = i < recent.length - 5;
          return (
            <button
              key={`${i}-${round.net}-${round.bj ? "b" : "r"}`}
              type="button"
              disabled={!canReplay}
              onClick={() => setReplay(round)}
              aria-label={`${label} ${round.net > 0 ? "+" : ""}${round.net}${canReplay ? " — view the hand" : ""}`}
              title={canReplay ? "View this hand" : undefined}
              className={`group h-4 w-3 items-center justify-center rounded-full outline-none ${
                phoneHidden ? "hidden sm:flex" : "flex"
              } focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:cursor-pointer`}
            >
              <span
                className={`block h-2 w-2 rounded-full transition-transform group-enabled:group-hover:scale-150 ${bg} ${
                  isLatest ? `ring-2 ${ring}` : ""
                } ${round.bj ? "shadow-[0_0_6px_rgba(229,199,121,0.6)]" : ""}`}
              />
            </button>
          );
        })}
      </div>

      {replay && typeof document !== "undefined" && (
        <HandReplay round={replay} back={back} onClose={() => setReplay(null)} />
      )}
    </>
  );
}
