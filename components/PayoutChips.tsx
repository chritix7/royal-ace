"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Hand } from "../lib/blackjack";
import type { Phase } from "../lib/game";

/**
 * Dealer-pays animation.
 *
 * When a round settles, a tall chip stack is spawned at the dealer's
 * card area for each winning hand and tossed over to that hand with
 * a casino-feeling arc: rises, rotates, scales up mid-air (feels like
 * it's "coming at you"), then falls, settles into the player's spot
 * with a tiny bounce. A soft floor shadow stays grounded on the
 * destination to sell the vertical throw. Blackjack stacks are gold
 * with a brief landing sparkle.
 *
 * Purely visual — the wallet update already happened in the hook
 * when the phase moved to "settled". The animation just makes the
 * moment feel earned instead of a number silently jumping on the
 * balance tile.
 *
 * Hooks it reads in the surrounding DOM:
 *   • [data-deal-target="dealer"]      — source
 *   • [data-deal-target="hand-${i}"]   — destination for hand i
 */

type Phase1 = "pre" | "mid" | "end" | "settle";

type Flight = {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  phase: Phase1;
  bj: boolean;
  spinDeg: number;
};

const SPAWN_DELAY_MS = 180; // let the dealer reveal land first
const RISE_MS = 240; // dealer → midair peak
const FALL_MS = 300; // midair peak → player spot
const SETTLE_MS = 180; // tiny bounce after landing
const ARC_HEIGHT = 110; // peak height in px above the straight line
const CLEANUP_BUFFER_MS = 180;

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
        phase: "pre",
        bj: h.result === "blackjack",
        // A random spin direction keeps consecutive stacks from
        // looking identical when the player splits.
        spinDeg: Math.random() > 0.5 ? 24 : -24,
      });
    });

    if (!spawned.length) return;
    const ids = spawned.map((f) => f.id);
    setFlights((f) => [...f, ...spawned]);

    // Phase progression:
    //   pre     (spawn, invisible/scale-0 at the dealer)
    //   mid     (rise to peak, scale up, start rotating)        RISE_MS
    //   end     (fall to the target, finish rotation, scale 1)  FALL_MS
    //   settle  (bounce, shadow grows, blackjack sparkle)       SETTLE_MS
    const totalDelay = SPAWN_DELAY_MS;

    const t0 = window.setTimeout(() => {
      setFlights((f) =>
        f.map((fl) => (ids.includes(fl.id) ? { ...fl, phase: "mid" } : fl))
      );
    }, totalDelay);

    const t1 = window.setTimeout(() => {
      setFlights((f) =>
        f.map((fl) => (ids.includes(fl.id) ? { ...fl, phase: "end" } : fl))
      );
    }, totalDelay + RISE_MS);

    const t2 = window.setTimeout(() => {
      setFlights((f) =>
        f.map((fl) => (ids.includes(fl.id) ? { ...fl, phase: "settle" } : fl))
      );
    }, totalDelay + RISE_MS + FALL_MS);

    const tCleanup = window.setTimeout(() => {
      setFlights((f) => f.filter((fl) => !ids.includes(fl.id)));
    }, totalDelay + RISE_MS + FALL_MS + SETTLE_MS + CLEANUP_BUFFER_MS);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(tCleanup);
    };
  }, [phase, hands]);

  if (!mounted || flights.length === 0) return null;

  return createPortal(
    <>
      {flights.map((f) => {
        const dx = f.toX - f.fromX;
        const dy = f.toY - f.fromY;

        // Each phase has its own target transform and timing.
        let transform: string;
        let transitionDuration: string;
        let transitionTiming: string;
        let opacity = 1;

        if (f.phase === "pre") {
          // Hidden at the dealer, slightly tucked, no spin yet.
          transform = "translate(-50%, -50%) scale(0.55) rotate(0deg)";
          transitionDuration = "0ms";
          transitionTiming = "ease";
          opacity = 0;
        } else if (f.phase === "mid") {
          // Peak of the arc: halfway in x, dy/2 - ARC_HEIGHT in y.
          // Slightly larger (feels closer), half the spin applied.
          transform = `translate3d(${dx / 2}px, ${dy / 2 - ARC_HEIGHT}px, 0) translate(-50%, -50%) scale(1.1) rotate(${f.spinDeg / 2}deg)`;
          transitionDuration = `${RISE_MS}ms`;
          transitionTiming = "cubic-bezier(0.22, 0.9, 0.5, 1)";
        } else if (f.phase === "end") {
          // Lands at the destination at scale 1 with full spin.
          transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) scale(1) rotate(${f.spinDeg}deg)`;
          transitionDuration = `${FALL_MS}ms`;
          transitionTiming = "cubic-bezier(0.45, 0.05, 0.4, 1)";
        } else {
          // Settle bounce: tiny vertical squash then relax.
          transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) scale(1) rotate(${f.spinDeg}deg)`;
          transitionDuration = `${SETTLE_MS}ms`;
          transitionTiming = "ease-out";
        }

        return (
          <div
            key={f.id}
            aria-hidden="true"
            className="pointer-events-none fixed z-[115]"
            style={{
              left: f.fromX,
              top: f.fromY,
              transform,
              opacity,
              transitionProperty: "transform, opacity",
              transitionDuration: `${transitionDuration}, 180ms`,
              transitionTimingFunction: `${transitionTiming}, ease-out`,
              willChange: "transform, opacity",
            }}
          >
            <ChipStack bj={f.bj} phase={f.phase} />
          </div>
        );
      })}
    </>,
    document.body
  );
}

/* ─── chip stack visual ──────────────────────────────────────────── */

const WIN_COLORS = [
  { bg: "#0f172a", edge: "#ffffff" }, // slate
  { bg: "#166534", edge: "#ffffff" }, // emerald
  { bg: "#991b1b", edge: "#ffffff" }, // red
  { bg: "#1d4ed8", edge: "#ffffff" }, // blue
  { bg: "#7c3aed", edge: "#ffffff" }, // purple
];
const BJ_COLORS = [
  { bg: "#b8902f", edge: "#1a1612" },
  { bg: "#c89f3d", edge: "#1a1612" },
  { bg: "#d7b45b", edge: "#1a1612" },
  { bg: "#e5c779", edge: "#1a1612" },
  { bg: "#f0d38b", edge: "#1a1612" },
  { bg: "#f6e4a9", edge: "#1a1612" },
  { bg: "#faecb8", edge: "#1a1612" },
];

function ChipStack({ bj, phase }: { bj: boolean; phase: Phase1 }) {
  const chips = bj ? BJ_COLORS : WIN_COLORS;
  const stackHeight = chips.length * 5 + 36;
  // The floor shadow grows as the stack falls, so the stack feels
  // like it's dropping onto a real surface.
  const shadowOpacity =
    phase === "pre" ? 0 : phase === "mid" ? 0.08 : phase === "end" ? 0.3 : 0.35;
  const shadowScale =
    phase === "pre" ? 0.4 : phase === "mid" ? 0.5 : phase === "end" ? 1 : 1.05;

  return (
    <div
      className="relative"
      style={{
        width: 44,
        height: stackHeight,
        filter: bj
          ? "drop-shadow(0 0 12px rgba(229,199,121,0.55))"
          : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
      }}
    >
      {/* Floor shadow — stays below the stack and grows as it lands. */}
      <span
        aria-hidden
        className="absolute left-1/2 h-[6px] rounded-[50%] bg-black"
        style={{
          bottom: -3,
          width: 36,
          transform: `translateX(-50%) scaleX(${shadowScale})`,
          opacity: shadowOpacity,
          filter: "blur(3px)",
          transition: "opacity 220ms ease-out, transform 220ms ease-out",
        }}
      />

      {chips.map((c, i) => {
        // Stack from the bottom up — chip 0 at the floor, chip N on top.
        const bottom = i * 5;
        // On the final "settle" phase, apply a tiny vertical squash to
        // each chip progressively (top chip squashes a hair more).
        const settleSquash =
          phase === "settle" ? 1 - (i / chips.length) * 0.06 : 1;
        return (
          <span
            key={i}
            className="absolute left-1/2 h-9 w-9 rounded-full border-[3px] border-dashed shadow-md"
            style={{
              bottom,
              transform: `translateX(-50%) scaleY(${settleSquash})`,
              background: `radial-gradient(ellipse at 50% 30%, ${c.bg} 0%, ${c.bg} 65%, rgba(0,0,0,0.45) 100%)`,
              borderColor: c.edge,
              boxShadow: bj
                ? "inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.35), 0 2px 3px rgba(0,0,0,0.5)"
                : "inset 0 1px 2px rgba(255,255,255,0.28), inset 0 -1px 1px rgba(0,0,0,0.35), 0 2px 3px rgba(0,0,0,0.5)",
              transition: "transform 160ms ease-out",
            }}
          >
            {/* chip inner ring */}
            <span
              aria-hidden
              className="absolute inset-[5px] rounded-full border"
              style={{
                borderColor: bj
                  ? "rgba(26,22,18,0.55)"
                  : "rgba(255,255,255,0.4)",
              }}
            />
          </span>
        );
      })}

      {/* Blackjack landing sparkle — brief golden flash on settle. */}
      {bj && phase === "settle" && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 h-10 w-10 -translate-x-1/2 rounded-full"
          style={{
            bottom: -4,
            background:
              "radial-gradient(circle, rgba(246,228,169,0.75) 0%, rgba(246,228,169,0) 65%)",
            animation: "chip-sparkle 500ms ease-out both",
          }}
        />
      )}
    </div>
  );
}
