"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import PlayingCard from "./PlayingCard";
import type { DealFlightEvent } from "../lib/useBlackjack";

/**
 * Card-flight layer.
 *
 * Watches the shared `dealEvents` queue and animates each card from
 * the shoe outlet to its destination slot. The destination card itself
 * is rendered elsewhere with `animated={false}` and hidden while an
 * event targeting it is in flight — this layer owns the whole motion,
 * so there is never a CSS deal-in running on top of this portal.
 *
 * Hooks it relies on in the surrounding DOM:
 *   • [data-shoe-pile-top]                 — preferred source: the
 *       top card inside the lucite window. Makes the deal read as
 *       the top of the deck leaving the shoe. Falls back to the
 *       outlet slit if the pile is empty / not visible.
 *   • [data-shoe-outlet]                   — fallback source
 *   • [data-deal-target="dealer"]          — destination for dealer cards
 *   • [data-deal-target="hand-${i}"]       — destination for hand `i`
 *   • [data-deal-card-index="${k}"] inside the destination for the k-th
 *     card slot. If missing, the center of the destination is used.
 *
 * Two layout modes:
 *   • `fit` — the inner card scales to the destination's --bj-card-h
 *     (the immersive table uses this).
 *   • default — the inner card uses its intrinsic size (`compact` or
 *     the default), matching the sidebar / Table.tsx layout.
 */

type ActiveFlight = {
  event: DealFlightEvent;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  cardHeight: string | null;
  started: boolean;
};

const FLIGHT_MS = 520;

export default function CardFlight({
  dealEvents,
  consumeDealEvent,
  back,
  compact = false,
  fit = false,
}: {
  dealEvents: DealFlightEvent[];
  consumeDealEvent: (id: number) => void;
  back: [string, string];
  compact?: boolean;
  fit?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeFlight, setActiveFlight] = useState<ActiveFlight | null>(null);
  const flightLock = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  // Pick up the next pending event when nothing else is in flight.
  useEffect(() => {
    if (
      activeFlight !== null ||
      flightLock.current !== null ||
      dealEvents.length === 0
    ) {
      return;
    }

    const event = dealEvents[0];
    // Prefer the top of the pile (the card physically sitting at the
    // top of the lucite stack) so the flight reads as "the top of the
    // deck leaving". Fall back to the outlet slit if the pile is
    // empty or offscreen.
    const pileTop = document.querySelector<HTMLElement>("[data-shoe-pile-top]");
    const outlet = document.querySelector<HTMLElement>("[data-shoe-outlet]");
    const source =
      pileTop && pileTop.getClientRects().length > 0 ? pileTop : outlet;
    const target = document.querySelector<HTMLElement>(
      `[data-deal-target="${event.target}"]`
    );

    // Shoe hidden (mobile): no flight — the card just appears.
    if (!source || !target || source.getClientRects().length === 0) {
      consumeDealEvent(event.id);
      return;
    }

    const from = source.getBoundingClientRect();
    const slot = target.querySelector<HTMLElement>(
      `[data-deal-card-index="${event.cardIndex}"]`
    );
    const to =
      (slot?.firstElementChild as HTMLElement | null)?.getBoundingClientRect() ??
      slot?.getBoundingClientRect() ??
      target.getBoundingClientRect();

    flightLock.current = event.id;
    setActiveFlight({
      event,
      fromX: from.left + from.width / 2,
      fromY: from.top + from.height / 2,
      toX: to.left + to.width / 2,
      toY: to.top + to.height / 2,
      cardHeight: fit
        ? getComputedStyle(target).getPropertyValue("--bj-card-h").trim() ||
          "76px"
        : null,
      started: false,
    });
  }, [dealEvents, activeFlight, consumeDealEvent, fit]);

  // Kick the "started" flag one frame after mounting so the CSS
  // transition has a chance to interpolate.
  useEffect(() => {
    if (activeFlight === null || activeFlight.started) return;

    const id = activeFlight.event.id;
    const frame = requestAnimationFrame(() => {
      setActiveFlight((current) => {
        if (current === null || current.event.id !== id) return current;
        return { ...current, started: true };
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeFlight]);

  // Clean up once the transition has finished.
  useEffect(() => {
    if (activeFlight === null || !activeFlight.started) return;

    const id = activeFlight.event.id;
    const timer = window.setTimeout(() => {
      if (flightLock.current !== id) return;
      flightLock.current = null;
      setActiveFlight(null);
      consumeDealEvent(id);
    }, FLIGHT_MS + 60);

    return () => window.clearTimeout(timer);
  }, [activeFlight, consumeDealEvent]);

  if (!mounted || !activeFlight) return null;

  const dx = activeFlight.toX - activeFlight.fromX;
  const dy = activeFlight.toY - activeFlight.fromY;

  const wrapperStyle: CSSProperties = {
    left: activeFlight.fromX,
    top: activeFlight.fromY,
    transformOrigin: "center",
    transition: `transform ${FLIGHT_MS}ms cubic-bezier(.18,.78,.2,1)`,
    transform: activeFlight.started
      ? `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) rotate(0deg)`
      : "translate(-50%, -50%) rotate(-28deg) scale(.72)",
  };

  if (fit && activeFlight.cardHeight) {
    wrapperStyle.height = "var(--bj-card-h)";
    wrapperStyle.aspectRatio = "5 / 7";
    (wrapperStyle as Record<string, string>)["--bj-card-h"] =
      activeFlight.cardHeight;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[120]"
      style={wrapperStyle}
    >
      <PlayingCard
        card={activeFlight.event.card}
        faceDown={activeFlight.event.faceDown}
        back={back}
        compact={activeFlight.event.target !== "dealer" && compact}
        fit={fit}
        /* The wrapper owns all the motion — the inner card must stay
           static, otherwise two animations fight. */
        animated={false}
      />
    </div>,
    document.body
  );
}
