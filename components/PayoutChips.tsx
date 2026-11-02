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

/**
 * A single denomination definition. `body` is the main chip color,
 * `edge` is the smaller contrasting pip color on the rim (how real
 * casino chips are identified), and `label` is the number painted on
 * the cream center medallion.
 */
type ChipDef = { body: string; edge: string; label: string };

// Mixed denominations for a plain win — a real pile of chips is almost
// never all one color. Bottom-to-top (low → high denomination).
const WIN_PILE: ChipDef[] = [
  { body: "#1e293b", edge: "#f1f5f9", label: "100" }, // slate
  { body: "#166534", edge: "#f1f5f9", label: "25" },  // green
  { body: "#1d4ed8", edge: "#f1f5f9", label: "10" },  // blue
  { body: "#991b1b", edge: "#f1f5f9", label: "5" },   // red
  { body: "#1e293b", edge: "#f1f5f9", label: "100" }, // slate
  { body: "#166534", edge: "#f1f5f9", label: "25" },  // green
];
// Blackjack: all-gold pile, slightly taller.
const BJ_PILE: ChipDef[] = Array.from({ length: 8 }, (_, i) => ({
  body: ["#b8902f", "#c89f3d", "#d7b45b", "#e5c779"][i % 4],
  edge: "#f6e4a9",
  label: "BJ",
}));

/**
 * One chip face — SVG with: outer colored body, 6 edge pips (the
 * contrasting little rectangles that identify a real casino chip),
 * an inner ring, a cream medallion in the middle, and the
 * denomination label on top. Looks like a real chip, not a bingo
 * token.
 */
function ChipFace({
  body,
  edge,
  label,
  size,
}: ChipDef & { size: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`sheen-${body}`} cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* body */}
      <circle cx="50" cy="50" r="48" fill={body} />
      {/* 6 edge pips around the rim */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <rect
          key={angle}
          x="43"
          y="1"
          width="14"
          height="16"
          rx="2"
          fill={edge}
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      {/* dark hairline ring between the body and the medallion */}
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1"
      />
      {/* cream center medallion */}
      <circle cx="50" cy="50" r="30" fill="#f5efdf" />
      {/* gold hairline inside the medallion */}
      <circle
        cx="50"
        cy="50"
        r="27"
        fill="none"
        stroke="rgba(200,166,91,0.55)"
        strokeWidth="1"
      />
      {/* denomination */}
      <text
        x="50"
        y="59"
        textAnchor="middle"
        fontFamily="ui-serif, Georgia, serif"
        fontWeight="700"
        fontSize={label.length >= 3 ? 20 : 24}
        fill={body}
      >
        {label}
      </text>
      {/* soft top-side sheen */}
      <circle cx="50" cy="50" r="48" fill={`url(#sheen-${body})`} />
    </svg>
  );
}

/**
 * One chip in the stack: the SVG face sits on top of a visible edge
 * strip. Stacked, those edges form the characteristic striped
 * sidewall of a real chip pile.
 */
function Chip({
  def,
  showFace,
  faceSize,
  edgeHeight,
}: {
  def: ChipDef;
  showFace: boolean;
  faceSize: number;
  edgeHeight: number;
}) {
  return (
    <div
      className="relative"
      style={{ width: faceSize, height: faceSize + edgeHeight }}
    >
      {/* The chip's visible side wall (color of the body, slightly
          darker). Repeating-linear-gradient for the little chip-edge
          ticks you see on real casino chips. */}
      <span
        className="absolute left-0 right-0 rounded-b-[6px]"
        style={{
          bottom: 0,
          height: edgeHeight,
          background: `linear-gradient(180deg, ${def.body} 0%, ${def.body} 50%, rgba(0,0,0,0.55) 100%)`,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.5)",
        }}
      />
      {/* The alternating tick pattern on the edge — subtle but iconic. */}
      <span
        aria-hidden
        className="absolute left-0 right-0 rounded-b-[6px]"
        style={{
          bottom: 0,
          height: edgeHeight,
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0 4px, ${def.edge}33 4px 6px)`,
          mixBlendMode: "overlay",
        }}
      />
      {/* The chip's top face, only drawn on the top of the stack
          since it is what the player sees. Edges below are enough
          to tell the chips apart. */}
      {showFace && (
        <div className="absolute left-0 top-0">
          <ChipFace {...def} size={faceSize} />
        </div>
      )}
    </div>
  );
}

function ChipStack({ bj, phase }: { bj: boolean; phase: Phase1 }) {
  const pile = bj ? BJ_PILE : WIN_PILE;
  const faceSize = 40;
  const edgeHeight = 5;
  // Chips overlap by `faceSize - edgeHeight` so only each chip's
  // edge is visible under the one above.
  const overlap = faceSize - edgeHeight;
  const stackHeight = faceSize + overlap * (pile.length - 1) + edgeHeight;

  // Floor shadow grows as the stack lands.
  const shadowOpacity =
    phase === "pre" ? 0 : phase === "mid" ? 0.08 : phase === "end" ? 0.32 : 0.4;
  const shadowScale =
    phase === "pre" ? 0.4 : phase === "mid" ? 0.5 : phase === "end" ? 1 : 1.05;

  return (
    <div
      className="relative"
      style={{
        width: faceSize + 2,
        height: stackHeight,
        filter: bj
          ? "drop-shadow(0 0 14px rgba(229,199,121,0.55)) drop-shadow(0 6px 10px rgba(0,0,0,0.55))"
          : "drop-shadow(0 6px 10px rgba(0,0,0,0.55))",
      }}
    >
      {/* Floor shadow */}
      <span
        aria-hidden
        className="absolute left-1/2 rounded-[50%] bg-black"
        style={{
          bottom: -4,
          width: faceSize - 2,
          height: 7,
          transform: `translateX(-50%) scaleX(${shadowScale})`,
          opacity: shadowOpacity,
          filter: "blur(4px)",
          transition: "opacity 220ms ease-out, transform 220ms ease-out",
        }}
      />

      {pile.map((def, i) => {
        const isTop = i === pile.length - 1;
        // settle squash: each chip's SVG face compresses slightly,
        // top-most compresses a hair more
        const settleSquash =
          phase === "settle" ? 1 - (i / pile.length) * 0.05 : 1;
        return (
          <div
            key={i}
            className="absolute left-1/2"
            style={{
              bottom: i * overlap,
              transform: `translateX(-50%) scaleY(${settleSquash})`,
              transition: "transform 160ms ease-out",
            }}
          >
            <Chip
              def={def}
              showFace={isTop}
              faceSize={faceSize}
              edgeHeight={edgeHeight}
            />
          </div>
        );
      })}

      {/* Blackjack landing sparkle — brief gold flash on settle. */}
      {bj && phase === "settle" && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 h-12 w-12 -translate-x-1/2 rounded-full"
          style={{
            bottom: -6,
            background:
              "radial-gradient(circle, rgba(246,228,169,0.75) 0%, rgba(246,228,169,0) 65%)",
            animation: "chip-sparkle 500ms ease-out both",
          }}
        />
      )}
    </div>
  );
}
