"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { MIN_BET, REFILL, money } from "../../lib/game";
import type { Game } from "../../lib/useBlackjack";
import { ChipStack } from "../ui";
import ChipRail from "../ChipRail";
import SideWinBadge from "../SideWinBadge";
import FeltMarkings from "../FeltMarkings";
import ImmersiveSidePill from "./ImmersiveSidePill";
import { control, gold, neutral } from "./styles";

/**
 * Animates its height to fit the content, so the console glides between
 * the betting, playing and result layouts instead of jumping.
 */
function SmoothHeight({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);
  const ready = useRef(false);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const read = () => {
      // Clip only while the height glides, so badges and focus rings
      // that overflow the console stay visible the rest of the time.
      if (ready.current) outer.current?.classList.add("is-gliding");
      setH(el.offsetHeight);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    const id = window.setTimeout(() => (ready.current = true), 50);
    return () => {
      ro.disconnect();
      window.clearTimeout(id);
    };
  }, []);
  return (
    <div
      ref={outer}
      className="console-height"
      style={{ height: h ?? undefined, transitionDuration: ready.current ? undefined : "0ms" }}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove("is-gliding");
      }}
    >
      <div ref={inner}>{children}</div>
    </div>
  );
}

/** Keyboard shortcut hint, desktop only (phones have no keyboard). */
function Kbd({ k }: { k: string }) {
  return (
    <span
      aria-hidden="true"
      className="ml-1.5 hidden min-w-[1.1rem] items-center justify-center rounded-[4px] border border-current px-1 py-px text-[9px] font-black leading-none tracking-normal opacity-45 lg:inline-flex"
    >
      {k}
    </span>
  );
}

/** Where the console sits in each view (Focus floats it over the felt). */
export const CONSOLE_FOCUS =
  "absolute bottom-3 left-1/2 z-20 w-[min(640px,calc(100%-1rem))] -translate-x-1/2 lg:w-[min(800px,calc(100%-2rem))]";

/**
 * The blackjack betting console: bet puck, chip rail and quick bets,
 * side bets and the tall Deal key while betting; Hit / Stand / Double /
 * Split / Surrender during a hand. The official betting area, shared by
 * the Focus view and the classic table on desktop.
 */
export default function BetConsole({
  g,
  bettingOpen,
  setEditBet,
  onOpenSide,
  className = CONSOLE_FOCUS,
}: {
  g: Game;
  bettingOpen: boolean;
  setEditBet: (v: boolean) => void;
  onOpenSide: (which: "pp" | "t3") => void;
  className?: string;
}) {
  const {
    s,
    roundBreakdown,
    canBet,
    playing,
    canDouble,
    canSplit,
    canSurrender,
    stake,
    spots,
    sides,
    pileAmount,
    outOfChips,
    addChip,
    setBetTo,
    deal,
    hit,
    stand,
    double,
    split,
    surrender,
    refill,
  } = g;
  const heat = g.heat;
  // Which face the console shows; changing it plays the swap animation.
  const mode = s.phase === "insurance" ? "insurance" : bettingOpen ? "betting" : canBet ? "deal" : "play";

  // Slim ghost key for the quick bets (Rebet / ×2 / Clear / Done).
  const quickBet =
    "inline-flex h-7 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-2 text-[10px] font-black uppercase tracking-[0.18em] max-sm:h-full max-sm:min-h-7 max-sm:px-1 max-sm:tracking-[0.1em] text-white/70 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[color,border-color,background] focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:hover:border-[#d7b45b]/50 enabled:hover:bg-[#d7b45b]/[0.08] enabled:hover:text-[#f5d778] disabled:cursor-not-allowed disabled:opacity-35";

  // Deal (or Refill when out of chips). `stacked` puts the amount on
  // its own line for the tall desktop key.
  const dealReady = s.bet >= MIN_BET && stake <= s.balance;
  const primaryAction = (className: string, stacked = false) =>
    outOfChips ? (
      <button
        type="button"
        onClick={refill}
        className={`${control} ${gold} ${className}`}
      >
        {stacked ? (
          <>
            <span className="text-sm tracking-[0.14em]">Refill</span>
            <span className="text-[11px] font-black tabular-nums">
              ◈ {money(REFILL)}
            </span>
          </>
        ) : (
          `Refill · ◈ ${money(REFILL)}`
        )}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          setEditBet(false);
          deal();
        }}
        disabled={!dealReady}
        className={`${control} ${gold} ${className} ${
          dealReady ? "animate-deal-ready" : ""
        }`}
      >
        {stacked ? (
          <>
            <span className="text-sm tracking-[0.14em]">
              {s.phase === "settled" ? "Deal again" : "Deal"}
            </span>
            <span className="text-[11px] font-black tabular-nums">
              ◈ {money(stake)}
            </span>
            <span aria-hidden="true" className="mt-0.5 hidden text-[8px] font-black tracking-[0.25em] opacity-50 lg:block">
              SPACE
            </span>
          </>
        ) : (
          `${s.phase === "settled" ? "Deal again" : "Deal"} · ◈ ${money(stake)}`
        )}
      </button>
    );

  return (
    <>
      {/* Floating action card — pulled out of the flex column so the
          felt extends all the way to the bottom of the viewport. The
          card sits inset from the bottom edge with a thick shadow and
          a gold-rimmed backdrop blur so it reads like a dealer tray
          hovering over the felt, not a bolted-on bar.
          Width-capped to 640px; on narrower screens it stays full-
          width with inset margins. */}
      <footer
        className={`${className} rounded-[22px] border border-[#d7b45b]/45 bg-gradient-to-b from-[#17130e]/95 via-[#0f0d0a]/95 to-[#080706]/95 px-2.5 pt-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.65),0_0_0_1px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(245,215,120,0.18)] lg:backdrop-blur-md sm:px-4 lg:px-5 lg:pt-3`}
        style={
          className === CONSOLE_FOCUS
            ? // Focus: the tray floats just above the home indicator, with no
              // dead space inside it.
              { paddingBottom: "0.625rem", bottom: "max(0.75rem, calc(env(safe-area-inset-bottom) - 0.4rem))" }
            : { paddingBottom: "0.625rem" }
        }
      >
        {/* House rules printed on the felt, riding just above the
            console so it never covers them, whatever its height. */}
        <FeltMarkings
          bj65={s.settings.bj65}
          h17={s.settings.h17}
          className="absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 sm:block"
        />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-full mb-1.5 flex items-center justify-center gap-1.5 px-3 sm:hidden"
              >
                <p
                  className="whitespace-nowrap font-serif text-[8.5px] font-bold uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.22em]"
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
                  className="text-[8px] leading-none sm:text-[9px]"
                  style={{ color: "rgba(229,199,121,0.5)" }}
                >
                  ❖
                </span>
                <p
                  className="whitespace-nowrap font-serif text-[8.5px] font-bold uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.22em]"
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
                  className="text-[8px] leading-none sm:text-[9px]"
                  style={{ color: "rgba(229,199,121,0.5)" }}
                >
                  ❖
                </span>
                <p
                  className="whitespace-nowrap font-serif text-[8.5px] font-bold uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.22em]"
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

        {/* Console trim: a gold light line along the top edge and a
            hairline inner frame, like the rim of a dealer's tray. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f5d778]/70 to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[5px] rounded-[17px] border border-[#d7b45b]/[0.12]"
        />

        <SmoothHeight>
          <div key={mode} className="console-swap">
        {bettingOpen ? (
          <>
          {/* Phones and tablets: the desktop console, compacted — bet puck,
              chips over the quick bets, a tall Deal key, side bets below. */}
          <div className="mx-auto mb-0.5 max-w-xl lg:hidden">
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_4.5rem] items-stretch gap-1.5 sm:grid-cols-[3.25rem_minmax(0,1fr)_6rem] sm:gap-3">
              {/* Bet puck */}
              <div className="flex flex-col items-center justify-center gap-1">
                <div
                  className="relative flex h-11 w-11 items-end justify-center overflow-visible rounded-full sm:h-12 sm:w-12"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 30%, rgba(229, 199, 121, 0.22) 0%, rgba(5, 10, 7, 0.75) 55%, rgba(5, 10, 7, 0.9) 100%)",
                    boxShadow: [
                      "inset 0 0 0 1px rgba(229, 199, 121, 0.85)",
                      "inset 0 0 0 3px rgba(0, 0, 0, 0.6)",
                      "inset 0 0 0 4px rgba(229, 199, 121, 0.35)",
                      "inset 0 3px 8px rgba(0, 0, 0, 0.75)",
                      "0 0 16px rgba(229, 199, 121, 0.2)",
                    ].join(", "),
                  }}
                >
                  {pileAmount > 0 ? (
                    <div className="mb-1 flex origin-bottom scale-[0.72] items-end justify-center">
                      <ChipStack amount={pileAmount} />
                    </div>
                  ) : (
                    <p className="mb-[15px] text-[8px] font-black uppercase tracking-[0.2em] text-[#e5c779]/75">
                      Bet
                    </p>
                  )}
                </div>
                <p className="max-w-full truncate text-[10px] font-black tabular-nums leading-none text-[#f5d778]">
                  ◈ {money(s.bet * spots)}
                </p>
              </div>

              {/* Chips over the quick bets */}
              <div className="flex min-w-0 flex-col justify-center gap-1.5">
                <div className="sm:hidden">
                  <ChipRail
                    visibleCount={4}
                    size="xs"
                    tight
                    onPick={(value) => addChip(value)}
                    disabledFor={(value) => !canBet || (s.bet + value) * spots + sides > s.balance}
                  />
                </div>
                <div className="hidden sm:block">
                  <ChipRail
                    visibleCount={5}
                    size="sm"
                    onPick={(value) => addChip(value)}
                    disabledFor={(value) => !canBet || (s.bet + value) * spots + sides > s.balance}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button type="button" onClick={() => setBetTo(s.lastBet)} className={`${quickBet} !h-6 !min-h-0 !px-1 !text-[9px] !tracking-[0.1em]`}>
                    Rebet
                  </button>
                  <button type="button" onClick={() => setBetTo(s.bet * 2)} disabled={s.bet === 0} className={`${quickBet} !h-6 !min-h-0 !px-1 !text-[9px] !tracking-[0.1em]`}>
                    ×2
                  </button>
                  <button type="button" onClick={() => setBetTo(0)} disabled={s.bet === 0} className={`${quickBet} !h-6 !min-h-0 !px-1 !text-[9px] !tracking-[0.1em]`}>
                    Clear
                  </button>
                </div>
              </div>

              {/* Tall Deal key */}
              <div className="flex flex-col gap-1">
                {primaryAction("!min-h-0 flex-1 flex-col gap-0 !rounded-2xl !px-1 !py-1 leading-tight", true)}
                {s.phase === "settled" && (
                  <button type="button" onClick={() => setEditBet(false)} className={`${quickBet} !h-5 !min-h-0 !text-[8px]`}>
                    Done
                  </button>
                )}
              </div>
            </div>

            {/* Side bets */}
            <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-[#d7b45b]/15 pt-2">
              <div className="relative">
                <ImmersiveSidePill label="PP" amount={s.ppBet} disabled={!canBet} onOpen={() => onOpenSide("pp")} heat={heat.pp} />
                {roundBreakdown && <SideWinBadge net={roundBreakdown.perfectPairs} />}
              </div>
              <div className="relative">
                <ImmersiveSidePill label="21+3" amount={s.t3Bet} disabled={!canBet} onOpen={() => onOpenSide("t3")} heat={heat.t3} />
                {roundBreakdown && <SideWinBadge net={roundBreakdown.twentyOnePlusThree} />}
              </div>
            </div>
          </div>

          <div className="relative mx-auto hidden lg:grid lg:max-w-none lg:grid-cols-[auto_minmax(0,1fr)_auto_auto] lg:items-stretch lg:gap-5">
            {/* Bet puck — desktop only: the chip pile grows in a gold
                ring at the left of the console, total underneath. */}
            <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-1.5">
              <div
                className="relative flex h-16 w-16 items-end justify-center overflow-visible rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 50% 30%, rgba(229, 199, 121, 0.22) 0%, rgba(5, 10, 7, 0.75) 55%, rgba(5, 10, 7, 0.9) 100%)",
                  boxShadow: [
                    "inset 0 0 0 1px rgba(229, 199, 121, 0.85)",
                    "inset 0 0 0 3px rgba(0, 0, 0, 0.6)",
                    "inset 0 0 0 4px rgba(229, 199, 121, 0.35)",
                    "inset 0 3px 8px rgba(0, 0, 0, 0.75)",
                    "0 0 22px rgba(229, 199, 121, 0.22)",
                  ].join(", "),
                }}
              >
                {pileAmount > 0 ? (
                  <div className="mb-1.5 flex items-end justify-center">
                    <ChipStack amount={pileAmount} />
                  </div>
                ) : (
                  <p className="mb-6 text-[9px] font-black uppercase tracking-[0.24em] text-[#e5c779]/75">
                    Bet
                  </p>
                )}
              </div>
              <p className="text-[11px] font-black tabular-nums leading-none text-[#f5d778]">
                ◈ {money(s.bet * spots)}
              </p>
            </div>

            {/* Chips and quick bets. On phones this wrapper dissolves
                into the console grid: chips on a full row, then the three
                quick bets and the two side bets share the second row. */}
            <div className="flex min-w-0 flex-col justify-center gap-2 max-sm:contents">
              <div className="mx-auto w-full max-w-[320px] max-sm:col-span-5">
                {/* Scrollable chip ladder — 5 denominations visible at
                    a time, arrows slide through the 10 → 50,000 range. */}
                <ChipRail
                  visibleCount={5}
                  size="sm"
                  onPick={(value) => addChip(value)}
                  disabledFor={(value) =>
                    !canBet ||
                    (s.bet + value) * spots + sides > s.balance
                  }
                />
              </div>

              <div className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-1.5 max-sm:col-span-3 max-sm:max-w-none max-sm:gap-1">
                <button
                  type="button"
                  onClick={() => setBetTo(s.lastBet)}
                  className={quickBet}
                >
                  Rebet
                </button>
                <button
                  type="button"
                  onClick={() => setBetTo(s.bet * 2)}
                  disabled={s.bet === 0}
                  className={quickBet}
                >
                  ×2
                  <Kbd k="X" />
                </button>
                <button
                  type="button"
                  onClick={() => setBetTo(0)}
                  disabled={s.bet === 0}
                  className={quickBet}
                >
                  Clear
                  <Kbd k="C" />
                </button>
              </div>
            </div>

            {/* Side bets — side by side on phones, stacked on desktop */}
            <div className="mt-2 grid grid-cols-2 gap-1.5 max-sm:col-span-2 max-sm:mt-0 max-sm:gap-1 lg:mt-0 lg:w-[158px] lg:grid-cols-1 lg:content-center lg:gap-2 lg:border-l lg:border-[#d7b45b]/15 lg:pl-5">
              <div className="relative">
                <ImmersiveSidePill
                  label="PP"
                  amount={s.ppBet}
                  disabled={!canBet}
                  onOpen={() => onOpenSide("pp")}
                  heat={heat.pp}
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
                  onOpen={() => onOpenSide("t3")}
                  heat={heat.t3}
                />
                {roundBreakdown && (
                  <SideWinBadge net={roundBreakdown.twentyOnePlusThree} />
                )}
              </div>
            </div>

            {/* Deal — desktop: a tall gold key closing the console.
                Phones use the full-width row underneath instead. */}
            <div className="hidden lg:flex lg:w-[132px] lg:flex-col lg:gap-1.5">
              {primaryAction("flex-1 flex-col gap-0.5 !rounded-2xl", true)}
              {s.phase === "settled" && (
                <button
                  type="button"
                  onClick={() => setEditBet(false)}
                  className={quickBet}
                >
                  Done
                </button>
              )}
            </div>
          </div>
          </>
        ) : null}

        {s.phase === "insurance" ? (
          // The InsuranceModal (mounted at the Blackjack parent) owns
          // this decision now. Keep an empty slot so the footer stays
          // the same height while the player decides.
          <div
            aria-hidden="true"
            className="mx-auto h-10 max-w-xl sm:h-11"
          />
        ) : canBet ? (
          bettingOpen ? null : (
          <div className="mx-auto flex max-w-xl justify-center gap-2">
            {primaryAction("min-w-0 flex-1 sm:min-h-10")}

            {!bettingOpen && (
              <button
                type="button"
                onClick={() => setEditBet(true)}
                className={`${control} ${neutral} shrink-0 px-3 sm:min-h-10`}
              >
                Edit bet
              </button>
            )}

          </div>
          )
        ) : (
          // Phones: Hit and Stand big on top, the three other calls below.
          <div className="mx-auto grid max-w-4xl grid-cols-6 gap-1.5 sm:grid-cols-5 sm:gap-3">
            <button
              type="button"
              onClick={hit}
              disabled={!playing}
              className={`${control} ${gold} col-span-3 max-sm:!min-h-11 max-sm:!text-[14px] sm:col-span-1 sm:min-h-10`}
            >
              Hit
              <Kbd k="H" />
            </button>

            <button
              type="button"
              onClick={stand}
              disabled={!playing}
              className={`${control} ${neutral} col-span-3 max-sm:!min-h-11 max-sm:!text-[14px] sm:col-span-1 sm:min-h-10`}
            >
              Stand
              <Kbd k="S" />
            </button>

            <button
              type="button"
              onClick={double}
              disabled={!canDouble}
              className={`${control} ${neutral} col-span-2 sm:col-span-1 sm:min-h-10`}
            >
              Double
              <Kbd k="D" />
            </button>

            <button
              type="button"
              onClick={split}
              disabled={!canSplit}
              className={`${control} ${neutral} col-span-2 sm:col-span-1 sm:min-h-10`}
            >
              Split
              <Kbd k="P" />
            </button>

            <button
              type="button"
              onClick={surrender}
              disabled={!canSurrender}
              className={`${control} ${neutral} col-span-2 sm:col-span-1 sm:min-h-10`}
            >
              Surrender
              <Kbd k="R" />
            </button>
          </div>
        )}
          </div>
        </SmoothHeight>
      </footer>
    </>
  );
}
