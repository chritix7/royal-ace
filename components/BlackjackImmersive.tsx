"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { handValue, isBlackjack } from "../lib/blackjack";
import { tableBg, money } from "../lib/game";
import type { DealFlightEvent, Game } from "../lib/useBlackjack";
import { useSession } from "../lib/sessionStore";
import { FOCUS_OUT_MS, exitFullscreenQuietly, exitFullscreenSettled, isNarrowScreen, requestFullscreenSettled, whenViewportStable } from "../lib/fullscreen";
import { Counter } from "./ui";
import PlayingCard from "./PlayingCard";
import CardFlight from "./CardFlight";
import HandResultBadge from "./HandResultBadge";
import HandSpotBadge from "./HandSpotBadge";
import SideNotePill from "./SideNotePill";
import Confetti from "./Confetti";
import DealerShoe from "./DealerShoe";
import ShuffleAnimation from "./ShuffleAnimation";
import VegasFeltOverlay from "./VegasFeltOverlay";
import InfoPanel from "./blackjack-immersive/InfoPanel";
import SideBetModal from "./SideBetModal";
import TableClock from "./TableClock";
import StreakBadge from "./StreakBadge";
import HistoryRibbon from "./HistoryRibbon";
import JackpotPill from "./JackpotPill";
import LuckyRound from "./LuckyRound";
import CountUp from "./CountUp";
import MobileResultModal from "./MobileResultModal";
import ShoeMeter from "./ShoeMeter";
import ResultRail from "./blackjack-immersive/ResultRail";
import BetConsole from "./blackjack-immersive/BetConsole";
import { getShoeStatus } from "./blackjack-immersive/getShoeStatus";
import { control, neutral, signed } from "./blackjack-immersive/styles";


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
  const [sideBetOpen, setSideBetOpen] = useState<"pp" | "t3" | null>(null);
  // Hot/cold heat for each side bet so the pills can show a sticker.
  const heat = g.heat;
  const goldenShown = g.golden && s.phase !== "betting";

  // Card-flight motion is handled by the dedicated CardFlight layer
  // (see <CardFlight /> below). Keeping the state out of this component
  // makes sure the classic Table view can share the exact same system.

  const bettingOpen =
    canBet && (editBet || s.phase === "betting");

  const rootRef = useRef<HTMLDivElement>(null);
  // pending: dark while fullscreen switches · in: entrance · out: leaving
  // Phones: no Focus animation at all ("still"), it froze some devices.
  const [narrow] = useState(isNarrowScreen);
  const [stage, setStage] = useState<"pending" | "in" | "out" | "still">(() => (isNarrowScreen() ? "still" : "pending"));
  // Leaving by the Exit key: dissolve first, then leave fullscreen while
  // the screen is dark, then hand back to the table.
  const leavingRef = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const requestClose = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    // Phones: close at once (fullscreen is left by the effect cleanup).
    if (narrow) {
      closeRef.current();
      return;
    }
    setStage("out");
    // Fade out, leave fullscreen while dark, and only hand back to the
    // table once the viewport has stopped resizing (phones).
    let closed = false;
    const done = () => {
      if (closed) return;
      closed = true;
      closeRef.current();
    };
    window.setTimeout(() => exitFullscreenSettled(done), FOCUS_OUT_MS);
    // Safety net: whatever the browser does with fullscreen, Focus closes.
    window.setTimeout(() => {
      exitFullscreenQuietly();
      done();
    }, 1000);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    // Take keyboard focus into the Focus view. Otherwise the Focus
    // button that opened it keeps it, and Space (deal) presses that
    // button again and closes the view.
    rootRef.current?.focus({ preventScroll: true });

    document.body.style.overflow = "hidden";

    // The page reserves a scrollbar gutter (`scrollbar-gutter: stable`
    // on <html>) so modals don't shift it. A fixed full-screen view
    // doesn't cover that gutter, which showed as a white strip down
    // the right edge — release it while Focus is open.
    const root = document.documentElement;
    const previousGutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "auto";

    // Request true browser fullscreen so the OS chrome and tab bar go
    // away — Focus mode is meant to be casino-immersive. Wrapped in a
    // try because:
    //   - Safari iOS has no Element.requestFullscreen on the <html>
    //     root (only on media elements), so the call throws.
    //   - Firefox rejects the Promise with a TypeError when the page
    //     wasn't entered from a user gesture; we accept that and move
    //     on, since Focus mode is itself triggered by a click.
    // We don't exit if the user was already fullscreen before entering.
    const wasFullscreen = Boolean(document.fullscreenElement);
    // Stay dark while the browser swaps to fullscreen (its toolbars jump
    // instantly), then play the entrance once the switch has settled.
    const cancelFs = requestFullscreenSettled(() => {
      if (!isNarrowScreen()) setStage("in");
    });

    // Esc in fullscreen is swallowed by the browser (no keydown), so
    // leaving fullscreen is our only signal the player wants out:
    // close Focus with it rather than strand them in a half state.
    let entered = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered && !wasFullscreen && !leavingRef.current) {
        // Left by the browser (Esc, back gesture): fade out while the
        // page resizes, then hand back to the table.
        leavingRef.current = true;
        if (isNarrowScreen()) {
          closeRef.current();
          return;
        }
        setStage("out");
        whenViewportStable(() => closeRef.current());
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      cancelFs();
      document.removeEventListener("fullscreenchange", onFsChange);
      document.body.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;

      if (!wasFullscreen && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      if (previousFocus instanceof HTMLElement) {
        // preventScroll: on phones focusing the toolbar button scrolled the
        // page up with a jump when Focus closed.
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();

      if (resultOpen) setResultOpen(false);
      else if (menuOpen) setMenuOpen(false);
      else requestClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  });

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
    <div
      ref={rootRef}
      tabIndex={-1}
      data-no-exit=""
      className={`${stage === "pending" ? "focus-pending" : stage === "out" ? "slots-focus-out" : stage === "in" ? "slots-focus-in" : ""} fixed inset-0 z-[80] flex h-[100dvh] flex-col overflow-hidden bg-[#080e0a] text-white outline-none`}
    >
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-[#d7b45b]/20 px-3 pb-2 sm:px-5"
        style={{
          paddingTop: "max(0.5rem, calc(env(safe-area-inset-top) + 0.35rem))",
        }}
      >
        <div className="min-w-0">
          <h2 className="font-display header-shine truncate text-sm font-black tracking-[0.18em] sm:text-base">
            <span className="text-white">ROYAL </span>
            <span className="animate-header-breathe text-[#d7b45b]">ACE</span>
            <span className="hidden font-bold tracking-wider text-white/40 sm:inline">
              {" · "}BLACKJACK
            </span>
          </h2>

          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7b45b]/55 sm:block">
            {s.settings.decks}D ·{" "}
            {s.settings.h17 ? "H17" : "S17"} · BJ{" "}
            {s.settings.bj65 ? "6:5" : "3:2"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Chips counter — framed pill matching the main page header */}
          <div className="rounded-2xl border border-[#c8a65b]/40 bg-gradient-to-b from-[#1a2219] to-[#101713] px-3 py-1.5 text-right shadow-[inset_0_1px_0_rgba(229,199,121,0.15),0_2px_0_rgba(0,0,0,0.5)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none text-[#d7b45b]/70">
              Chips
            </p>
            <p className="mt-0.5 text-sm font-black leading-tight tabular-nums text-[#e5c779] sm:text-base">
              ◈ <Counter value={s.balance} />
            </p>
          </div>

          <div className="hidden rounded-2xl border border-[#c8a65b]/25 bg-gradient-to-b from-[#1a2219] to-[#101713] px-3 py-1.5 text-right shadow-[inset_0_1px_0_rgba(229,199,121,0.1),0_2px_0_rgba(0,0,0,0.5)] md:block">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none text-[#d7b45b]/70">
              Today
            </p>
            <p
              className={`mt-0.5 text-sm font-black leading-tight tabular-nums ${
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
            onClick={requestClose}
            className={`${control} ${neutral} relative w-11 touch-manipulation before:absolute before:-inset-2 before:content-['']`}
            aria-label="Exit immersive mode"
          >
            ✕
          </button>
        </div>
      </header>

      <main
        style={tableStyle}
        className={`felt-texture relative isolate grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden ${bettingOpen ? "pb-[180px] lg:pb-[158px]" : "pb-[80px] lg:pb-[138px]"} ${tableBg(s.settings)}`}
      >
        {s.settings.theme === "vegas" && <VegasFeltOverlay />}
        {s.celebrate > 0 && (
  <Confetti key={s.celebrate} />
)}

{/* Floating Shoe meter + Clock — top-left of the felt, same look
    as the classic view. Shoe shows live card count with a thin
    gold progress fill; Clock shows the viewer's local HH:MM. */}
<ShoeMeter g={g} className="absolute left-3 top-3 z-10 sm:left-5 sm:top-5" />
{/* Phones: the left stack is three short rows — shoe; clock and
    jackpot; last hands and streak — so it stays clear of the cards. */}
<TableClock className="absolute left-3 top-[46px] z-10 sm:left-5 sm:top-[58px]" />

{/* Streak + history ribbon — same upper-left stack as the Shoe
    and Clock. Focus mode has more real estate than the classic
    table, so both show on phone too. */}
<StreakBadge
  wins={s.streak}
  history={s.history}
  className="absolute left-[124px] top-[78px] z-10 inline-flex sm:left-5 sm:top-[94px]"
/>
<HistoryRibbon
  history={s.history}
  back={back}
  className="absolute left-3 top-[78px] z-10 inline-flex sm:left-5 sm:top-[122px]"
/>
{/* Progressive jackpot — top center on the felt. */}
{!goldenShown && (
  <JackpotPill className="absolute left-[104px] top-[46px] z-10 sm:left-1/2 sm:top-2 sm:-translate-x-1/2" />
)}
{/* Golden Round banner — same component as the classic table. */}
<LuckyRound
  g={g}
  position="left-[104px] top-[46px] sm:left-1/2 sm:top-2 sm:-translate-x-1/2"
/>

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
  className="relative z-10 flex shrink-0 justify-center"
>
  <p
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 pl-[0.45em] text-[10px] font-bold uppercase tracking-[0.45em] text-white/[0.10] sm:block sm:text-xs"
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
          className="flex h-[96px] shrink-0 flex-col items-center justify-center gap-0.5 px-3 text-center sm:h-[104px]"
        >
          <p
            key={`msg-${s.message}-${s.phase}-${s.celebrate}`}
            className={`max-w-full text-xs font-semibold text-[#ead5a3] sm:text-sm ${
              s.phase === "settled" ? "animate-result-pop" : "animate-msg-slide"
            }`}
          >
            <span
              className={s.phase === "betting" ? "animate-idle-shimmer" : ""}
            >
              {s.message}
            </span>
          </p>

          {/* Side-note pill is shown inline at every breakpoint when
              NOT at settle+breakdown; at settle+breakdown it only shows
              on mobile (desktop has the ResultRail on the left). */}
          {!(s.phase === "settled" && roundBreakdown) ? (
            <SideNotePill note={s.sideNote} />
          ) : (
            <div className="md:hidden">
              <SideNotePill note={s.sideNote} />
            </div>
          )}

          {s.phase === "settled" && s.net !== null ? (
  <div
    className={`items-center justify-center gap-2 ${
      roundBreakdown ? "flex md:hidden" : "flex"
    }`}
  >
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
      <CountUp value={s.net} format={signed} />
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

                    <span
                      key={`v-${index}-${value.total}`}
                      className={`animate-score-tick rounded-full px-2 py-0.5 font-bold ${
                        value.total > 21
                          ? "bg-[#c04040]/45 text-[#ffd8d8] shadow-[0_0_10px_rgba(192,64,64,0.45)]"
                          : "bg-black/30 text-white"
                      }`}
                    >
                      {value.soft && value.total < 21
                        ? `${value.total - 10}/${value.total}`
                        : value.total}
                    </span>

                    <span className="text-white/50">
                      ◈ {money(hand.bet)}
                      {hand.doubled && " ×2"}
                    </span>

                    {hand.result && (
                      <HandResultBadge result={hand.result} size="sm" />
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

      <BetConsole
        g={g}
        bettingOpen={bettingOpen}
        setEditBet={setEditBet}
        onOpenSide={setSideBetOpen}
      />

      <MobileResultModal
        open={resultOpen && s.phase === "settled"}
        onClose={() => setResultOpen(false)}
        breakdown={roundBreakdown}
        call={s.message}
      />

      {menuOpen && (
        <InfoPanel g={g} onClose={() => setMenuOpen(false)} />
      )}

      {/* Side-bet staking modals — same shared SideBetModal as the
          classic view uses, so Perfect Pairs / 21+3 behave identically
          everywhere: tap pill → chip picker → commit. */}
      <SideBetModal
        open={sideBetOpen === "pp"}
        onClose={() => setSideBetOpen(null)}
        label="Perfect Pairs"
        hint="Your first 2 cards pair · up to 25:1"
        amount={s.ppBet}
        canBet={canBet}
        remainingBalance={s.balance - (s.bet * spots + s.t3Bet)}
        onAdd={(chip) => adjustSide("ppBet", chip)}
        onClear={() => adjustSide("ppBet", -s.ppBet)}
      />
      <SideBetModal
        open={sideBetOpen === "t3"}
        onClose={() => setSideBetOpen(null)}
        label="21+3"
        hint="Your 2 cards + dealer's card · up to 100:1 · Suited Trips wins the jackpot"
        amount={s.t3Bet}
        canBet={canBet}
        remainingBalance={s.balance - (s.bet * spots + s.ppBet)}
        onAdd={(chip) => adjustSide("t3Bet", chip)}
        onClear={() => adjustSide("t3Bet", -s.t3Bet)}
      />
    </div>,
    document.body
  );
}