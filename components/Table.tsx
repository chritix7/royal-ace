"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { handValue, isBlackjack } from "../lib/blackjack";
import { MIN_BET, REFILL, money, tableBg } from "../lib/game";
import PlayingCard from "./PlayingCard";
import Confetti from "./Confetti";
import type { DealFlightEvent, Game } from "../lib/useBlackjack";
import DealerShoe from "./DealerShoe";
import CardFlight from "./CardFlight";
import HandResultBadge from "./HandResultBadge";
import HandSpotBadge from "./HandSpotBadge";
import ShuffleAnimation from "./ShuffleAnimation";
import SideNotePill from "./SideNotePill";
import VegasFeltOverlay from "./VegasFeltOverlay";
import ResultRail from "./blackjack-immersive/ResultRail";
import MobileResultModal from "./MobileResultModal";
import SideBetModal from "./SideBetModal";
import TableClock from "./TableClock";
import StreakBadge from "./StreakBadge";
import HistoryRibbon from "./HistoryRibbon";
import JackpotPill from "./JackpotPill";
import LuckyRound from "./LuckyRound";
import CountUp from "./CountUp";
import ShoeMeter from "./ShoeMeter";
import BetConsole from "./blackjack-immersive/BetConsole";

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

  export default function Table({ g, onMenu }: { g: Game; onMenu?: () => void }) {
  // Mobile-only round-details modal — on md+ the ResultRail on the
  // felt already shows the breakdown.
  const [resultOpen, setResultOpen] = useState(false);
  const goldenShown = g.golden && g.s.phase !== "betting";
  // Phones and tablets: during a hand (and while the result is on the
  // felt) the betting area steps aside and the cards take the space.
  // "Change bet" in the bar reopens it at the result.
  const [editBet, setEditBet] = useState(false);
  useEffect(() => {
    if (g.s.phase !== "settled") setEditBet(false);
  }, [g.s.phase]);
  // Which side-bet staking modal is open (Perfect Pairs / 21+3 / none).
  // Tapping either felt pill opens the shared SideBetModal.
  const [sideBetOpen, setSideBetOpen] = useState<"pp" | "t3" | null>(null);
  // Phones: multi-hand cards are sized to the screen (two hands a row) so
  // they stay readable instead of shrinking to the small compact size.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
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
  spots,
  sides,
  addChip,
  setBetTo,
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
      {/* Phones / tablets: the table runs down to just above the home bar */}
      <section className="overflow-clip rounded-3xl border border-[#c8a65b]/20 bg-[#101713] shadow-2xl max-lg:flex max-lg:h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] max-lg:min-h-[440px] max-lg:flex-col lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <div className={`felt-texture relative overflow-hidden ${tableBg(s.settings)} px-2 py-3 max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:pb-3 sm:px-9 sm:py-4 lg:flex lg:flex-1 lg:min-h-0 lg:flex-col lg:justify-between lg:pb-7 lg:pt-14`}>
          {/* ☰ Table menu (music, rules, explore…) — phones and tablets */}
          {onMenu && (
            <span className="absolute right-3 top-[86px] z-20 lg:hidden">
              <button type="button" onClick={onMenu} aria-label="Table menu" className="rl-icon-key !h-8 !w-8 border-[#d7b45b]/40 bg-black/55">
                ☰
              </button>
            </span>
          )}
          {/* Floating result rail — same component as the Focus view,
              positioned on the left edge of the felt. Shows the round
              breakdown and a New-round button at settle, a Hand-in-
              progress pill otherwise. md:+ only, like in Focus. */}
          <ResultRail g={g} onNewRound={deal} />

          {/* Floating Shoe meter — a compact gold-tinted pill at the top-
              left of the felt. Replaces the old table header strip; the
              dealer rules are already engraved on the felt below. */}
          <ShoeMeter g={g} className="absolute left-3 top-3 z-10 sm:left-5 sm:top-5" />

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
            wins={s.streak}
            history={s.history}
            className="absolute left-5 top-[90px] z-10 hidden sm:inline-flex"
          />
          <HistoryRibbon
            history={s.history}
            back={back}
            className="absolute left-5 top-[120px] z-10 hidden sm:inline-flex"
          />
          {/* Progressive jackpot pill — top center on desktop so both
              players and the dealer lane can see the pot grow. */}
          {/* The Golden Round banner takes this slot while it shows. */}
          {!goldenShown && (
            <JackpotPill className="absolute left-3 top-[86px] z-10 sm:left-1/2 sm:top-2 sm:-translate-x-1/2" />
          )}
          {/* Golden Round banner — floats over the dealer slot. */}
          <LuckyRound g={g} />
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
<div className="relative mt-[76px] flex min-h-[88px] items-center justify-center sm:mt-1.5 sm:min-h-28 lg:mt-0 lg:min-h-[96px]">

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
            className="my-2 flex min-h-[48px] flex-col items-center justify-center gap-1 max-lg:my-auto max-lg:pb-1 max-lg:pt-5 sm:my-3 lg:my-0 lg:mt-6 lg:min-h-[88px]"
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
                      <CountUp value={Math.abs(net)} format={money} />
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
          {/* On desktop the player zone has a fixed height and never
              wraps, so splitting (extra hands, spot badges, longer
              labels) can't push the bet zone and its buttons down past
              the bottom edge of the felt. */}
          <div
            className={`flex flex-wrap items-start justify-center gap-2 max-lg:mt-auto sm:gap-5 lg:mt-4 lg:h-[156px] lg:flex-nowrap lg:gap-3 ${phone && s.hands.length > 1 ? "!gap-x-1 !gap-y-1.5" : ""}`}
            style={
              phone && s.hands.length > 1
                ? ({
                    "--bj-card-h": `min(${s.hands.length > 2 ? "9.5dvh" : "12dvh"}, 104px, calc((100vw - ${48 + Math.min(2, s.hands.length) * 30}px) / ${Math.min(2, s.hands.length) * (0.44 * Math.max(2, ...s.hands.map((h) => h.cards.length)) + 0.28)}))`,
                  } as CSSProperties)
                : undefined
            }
          >
  {s.hands.length === 0 && (
    <div
      aria-hidden="true"
      className="hidden w-full lg:block lg:min-h-28"
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
                  className={`relative rounded-2xl border p-2 transition sm:p-3 ${
                    isActive ? "border-[#e5c779]/70 bg-[#e5c779]/10" : "border-transparent"
                  } ${compact && !isActive && s.phase === "player" ? "opacity-85" : ""} ${phone && s.hands.length > 1 ? "!p-1.5" : ""}`}
                >
                  {/* Engraved per-hand spot badge — only in multi-hand play. */}
                  {multi && (
                    <div className="mb-1 flex justify-center lg:absolute lg:-left-2.5 lg:-top-2.5 lg:z-10 lg:mb-0">
                      <HandSpotBadge index={i} active={isActive} />
                    </div>
                  )}

                  <div
                    className={`mb-2 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:mb-3 sm:text-xs ${
                      s.hands.length <= 3 ? "lg:flex-nowrap lg:whitespace-nowrap" : ""
                    }`}
                  >
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
                      {h.doubled && (multi ? " ×2" : " (doubled)")}
                    </span>
                    {h.result && <HandResultBadge result={h.result} />}
                  </div>
                  <div className={`flex justify-center ${phone && s.hands.length > 1 ? "min-h-[var(--bj-card-h)]" : compact ? "min-h-[72px] sm:min-h-24" : "min-h-24 sm:min-h-28 lg:min-h-[96px]"}`}>
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
                          fit={phone && s.hands.length > 1}
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
{/* Desktop rules are printed above the betting console (BetConsole). */}

          {/* Bet-zone slot — swaps content based on phase, but the slot
              height is RESERVED at every phase so the felt stays still
              across betting → dealing → player → dealer → settled.
              Mobile keeps the sticky action bar below the felt, but on
              desktop (lg:+) the Deal button and the play-time actions
              (Hit / Stand / Double / Split / Surrender) are rendered
              INSIDE this slot, on top of the engraved arcs — no height
              is wasted below the table. */}
<div className={`relative mt-3 lg:mt-0 lg:flex lg:min-h-[120px] lg:flex-col lg:items-center lg:justify-end lg:gap-2`}>
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
{/* The official betting console, the same one as in Focus (all sizes) */}
<BetConsole
  g={g}
  bettingOpen={canBet && (editBet || s.phase === "betting")}
  setEditBet={setEditBet}
  onOpenSide={setSideBetOpen}
  className="relative z-10 mx-auto w-[min(640px,100%)] max-lg:-mb-1.5 lg:w-[min(800px,100%)]"
/>
</div>
        </div>

      </section>
      <MobileResultModal
        open={resultOpen && s.phase === "settled"}
        onClose={() => setResultOpen(false)}
        breakdown={roundBreakdown}
        call={s.message}
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
        hint="Your 2 cards + dealer's card · up to 100:1 · Suited Trips wins the jackpot"
        amount={s.t3Bet}
        canBet={canBet && !s.busy}
        remainingBalance={s.balance - (s.bet * s.settings.spots + s.ppBet)}
        onAdd={(chip) => adjustSide("t3Bet", chip)}
        onClear={() => adjustSide("t3Bet", -s.t3Bet)}
      />
    </>
  );
}