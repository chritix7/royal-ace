"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Hand } from "../lib/blackjack";
import type { Phase } from "../lib/game";

/**
 * Dealer-pays animation.
 *
 * When a round settles, a small chip stack is spawned at the dealer's
 * card area for each winning hand and flies out to that hand's spot.
 * Purely visual — the wallet update already happened in the hook when
 * the phase moved to "settled". The animation just makes the moment
 * feel earned instead of a number silently jumping on the balance tile.
 *
 * Blackjack and plain wins get a different chip look so the premium
 * payout reads at a glance.
 *
 * This component relies on the existing hooks already placed in the
 * table markup:
 *   • [data-deal-target="dealer"]      — source
 *   • [data-deal-target="hand-${i}"]   — destination for hand i
 */

type Flight = {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  started: boolean;
  bj: boolean;
};

const FLIGHT_DURATION_MS = 720;
const SPAWN_DELAY_MS = 180; // let the dealer reveal land first

export default function PayoutChips({
  hands,
  phase,
}: {
  hands: Hand[];
  phase: Phase;
}) {
  const [mounted, setMounted] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextId = useRef(0);
  const prevPhase = useRef<Phase | null>(null);
  const firstMount = useRef(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // On very first mount, record the current phase and bail — we only
    // want to react to real transitions INTO "settled", not to a
    // restored saved state that was already "settled" when the app opened.
    if (firstMount.current) {
      firstMount.current = false;
      prevPhase.current = phase;
      return;
    }

    const prev = prevPhase.current;
    prevPhase.current = phase;
    if (phase !== "settled" || prev === "settled") return;

    const dealer = document.querySelector<HTMLElement>(
      '[data-deal-target="dealer"]'
    );
    if (!dealer) return;
    const dRect = dealer.getBoundingClientRect();
    const fromX = dRect.left + dRect.width / 2;
    const fromY = dRect.top + dRect.height / 2;

    const spawned: Flight[] = [];
    hands.forEach((h, i) => {
      if (h.result !== "win" && h.result !== "blackjack") return;
      const target = document.querySelector<HTMLElement>(
        `[data-deal-target="hand-${i}"]`
      );
      if (!target) return;
      const r = target.getBoundingClientRect();
      spawned.push({
        id: ++nextId.current,
        fromX,
        fromY,
        toX: r.left + r.width / 2,
        toY: r.top + r.height / 2,
        started: false,
        bj: h.result === "blackjack",
      });
    });

    if (!spawned.length) return;
    const ids = spawned.map((f) => f.id);
    setFlights((f) => [...f, ...spawned]);

    // Let the DOM paint one frame with the chips at the dealer, then
    // flip `started` so the CSS transition takes them to the hand.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlights((f) =>
          f.map((fl) => (ids.includes(fl.id) ? { ...fl, started: true } : fl))
        );
      });
    });

    // Clean up after the flight finishes (plus a small overshoot buffer).
    const cleanup = window.setTimeout(() => {
      setFlights((f) => f.filter((fl) => !ids.includes(fl.id)));
    }, SPAWN_DELAY_MS + FLIGHT_DURATION_MS + 160);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(cleanup);
    };
  }, [phase, hands]);

  if (!mounted || flights.length === 0) return null;

  return createPortal(
    <>
      {flights.map((f) => {
        const dx = f.toX - f.fromX;
        const dy = f.toY - f.fromY;
        return (
          <div
            key={f.id}
            aria-hidden="true"
            className="pointer-events-none fixed z-[115]"
            style={{
              left: f.fromX,
              top: f.fromY,
              transform: f.started
                ? `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) scale(1)`
                : "translate(-50%, -50%) scale(0.6)",
              opacity: f.started ? 1 : 0.5,
              transitionProperty: "transform, opacity",
              transitionDuration: `${FLIGHT_DURATION_MS}ms, 240ms`,
              transitionTimingFunction:
                "cubic-bezier(0.22, 0.75, 0.18, 1), ease-out",
              transitionDelay: `${SPAWN_DELAY_MS}ms, ${SPAWN_DELAY_MS}ms`,
              willChange: "transform, opacity",
            }}
          >
            <ChipStack bj={f.bj} />
          </div>
        );
      })}
    </>,
    document.body
  );
}

/* ─── chip stack visual ──────────────────────────────────────────── */

function ChipStack({ bj }: { bj: boolean }) {
  // Three overlapping chips. Blackjack = gold stack with warm glow;
  // regular win = a classic multi-color casino stack.
  const stack = bj
    ? [
        { bg: "#d7b45b", edge: "#1a1612" },
        { bg: "#e5c779", edge: "#1a1612" },
        { bg: "#f0d38b", edge: "#1a1612" },
      ]
    : [
        { bg: "#0f172a", edge: "#ffffff" }, // slate
        { bg: "#991b1b", edge: "#ffffff" }, // red
        { bg: "#1d4ed8", edge: "#ffffff" }, // blue
      ];

  return (
    <div
      className="relative"
      style={{
        width: 36,
        height: 44,
        filter: bj
          ? "drop-shadow(0 0 10px rgba(229,199,121,0.55))"
          : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
      }}
    >
      {stack.map((c, i) => (
        <span
          key={i}
          className="absolute left-1/2 h-9 w-9 -translate-x-1/2 rounded-full border-[3px] border-dashed shadow-md"
          style={{
            bottom: i * 4,
            background: `radial-gradient(ellipse at 50% 30%, ${c.bg} 0%, ${c.bg} 65%, rgba(0,0,0,0.4) 100%)`,
            borderColor: c.edge,
            boxShadow: bj
              ? "inset 0 1px 2px rgba(255,255,255,0.35), 0 2px 4px rgba(0,0,0,0.5)"
              : "inset 0 1px 2px rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {/* chip inner ring */}
          <span
            aria-hidden
            className="absolute inset-[5px] rounded-full border"
            style={{
              borderColor: bj
                ? "rgba(26,22,18,0.5)"
                : "rgba(255,255,255,0.35)",
            }}
          />
        </span>
      ))}
    </div>
  );
}
