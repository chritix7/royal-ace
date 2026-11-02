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
 *   • [data-shoe-top-card]                 — preferred source: the
 *       top card physically sticking out of the dispenser slit.
 *       Makes the deal read as "the dealer pulls the top card off
 *       the ramp". Falls back to the outlet slit if the ramp isn't
 *       visible.
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
    // Prefer the top ramp card (the one physically sticking out of
    // the dispenser slit) so the flight reads as "the dealer pulls
    // the top card off the ramp". There may be more than one shoe in
    // the DOM — a full-size one for desktop and a mini one for mobile,
    // each hidden at the opposite breakpoint — so pick the first one
    // that is actually laid out. Fall back to the outlet slit the
    // same way, then to no flight when nothing visible is available.
    const pickVisible = (sel: string): HTMLElement | null => {
      const nodes = document.querySelectorAll<HTMLElement>(sel);
      for (const n of nodes) {
        if (n.getClientRects().length > 0) return n;
      }
      return null;
    };
    const source =
      pickVisible("[data-shoe-top-card]") ??
      pickVisible("[data-shoe-outlet]");
    const target = document.querySelector<HTMLElement>(
      `[data-deal-target="${event.target}"]`
    );

    // No shoe at all on screen: the card just appears.
    if (!source || !target) {
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
    // Initial state is tuned to look like the top ramp card at rest
    // (small, slight -2° tilt): the ramp card gets hidden the same
    // frame, so this reads as the ramp card "detaching" and gliding
    // to its spot. End state is the real card at full size, flat.
    transform: activeFlight.started
      ? `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) rotate(0deg) scale(1)`
      : "translate(-50%, -50%) rotate(-2deg) scale(0.6)",
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
        /* The ramp card is face-down. The flight starts face-down to
           match it visually, then flips face-up during the trajectory
           so the result is only revealed when the card lands.
           The dealer's hole card (event.faceDown === true) stays
           face-down throughout. */
        faceDown={!activeFlight.started || activeFlight.event.faceDown}
        /* Sync the inner flip duration with the flight time so the
           reveal lands exactly when the card arrives. */
        flipDurationMs={FLIGHT_MS}
        back={back}
        compact={activeFlight.event.target !== "dealer" && compact}
        fit={fit}
        /* The wrapper owns all the motion — no CSS deal-in animation. */
        animated={false}
      />
    </div>,
    document.body
  );
}
