import { useEffect, useRef } from "react";
import type { Card } from "../lib/blackjack";

/**
 * A playing card for Royal Ace Blackjack.
 *
 * Design notes:
 * - All ranks use a classical serif stack — crisp and readable at every
 *   size (number cards and face cards alike).
 * - Suit colors are warmed up: wine red for ♥/♦, warm charcoal for ♠/♣,
 *   so they sit comfortably on the gold-on-dark game palette instead of
 *   reading as default web colors.
 * - The card paper has a subtle warm gradient and a thin inset gold
 *   hairline, matching the premium ornamental frame used on the Vegas
 *   color picker.
 * - The ace keeps a large suit inside a double gold ring. Court cards
 *   (J/Q/K) carry, inside that ring, a small gold crest, their letter
 *   in the display face and the suit — the corners stay identical.
 * - The back is engraved: a gold diamond lattice over the table's back
 *   colours, a double frame and the house "RA" medallion.
 */

const FACE_RANKS = new Set(["A", "J", "Q", "K"]);
const COURT_RANKS = new Set(["J", "Q", "K"]);

/**
 * Small gold crest drawn over a court card's letter: a three-point
 * crown for the King, a five-point coronet for the Queen, a plumed
 * cap for the Jack. Inline SVG so it looks the same on every device
 * (chess and fleur-de-lis glyphs render as emoji on some phones).
 */
function Crest({ rank, className = "" }: { rank: string; className?: string }) {
  const shape =
    rank === "K"
      ? "M2 11 L2 4 L7 8 L12 1 L17 8 L22 4 L22 11 Z"
      : rank === "Q"
        ? "M2 11 L1 4 L6 8 L8.5 2 L12 7.5 L15.5 2 L18 8 L23 4 L22 11 Z"
        : "M4 11 L4 7 Q12 -2 20 7 L20 11 Z";
  return (
    <svg viewBox="0 0 24 13" aria-hidden className={className}>
      <path d={shape} fill="#c8a65b" stroke="#8a6c2b" strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="2" y="11" width="20" height="1.6" rx="0.6" fill="#8a6c2b" />
    </svg>
  );
}

/** Contact shadow plus a soft cast shadow, so a card reads as lying on the felt. */
const CARD_SHADOW =
  "0 1px 1px rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.3), 0 10px 18px rgba(0,0,0,0.28)";

export default function PlayingCard({
  card,
  faceDown = false,
  overlap = false,
  compact = false,
  fit = false,
  back = ["#142d27", "#1b3d33"],
  animated = true,
  flipDurationMs = 900,
  highlight = false,
}: {
  card: Card;
  faceDown?: boolean;
  overlap?: boolean;
  compact?: boolean;
  fit?: boolean;
  back?: [string, string];
  animated?: boolean;
  /** How long the inner front/back flip takes when `faceDown` toggles.
   *  Default 900ms matches the slow, deliberate reveal of the dealer's
   *  hole card. The card-flight layer passes a shorter value so the
   *  flip during a deal syncs with the trajectory. */
  flipDurationMs?: number;
  /** Draws a soft gold halo pulse around the card. Used on the
   *  dealer's hole card during the reveal moment so the flip reads
   *  on any screen size. */
  highlight?: boolean;
}) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  const isFace = FACE_RANKS.has(card.rank);
  const isCourt = COURT_RANKS.has(card.rank);

  // Warmer palette: a muted wine for red suits and a warm charcoal for
  // black suits — both play better with the gold-on-dark environment
  // than default web red/slate.
  const inkColor = isRed ? "#a01c2c" : "#1a1612";
  // A hair lighter for the big center suit so it feels painted, not stamped.
  const inkCenter = isRed ? "#b32538" : "#1f1a16";

  const size = fit
    ? "h-[var(--bj-card-h)] w-[calc(var(--bj-card-h)*0.72)]"
    : compact
      ? "h-[60px] w-[42px] sm:h-24 sm:w-[68px] lg:h-20 lg:w-[56px]"
      : "h-20 w-[56px] sm:h-28 sm:w-20 lg:h-24 lg:w-[68px]";

  const shift = fit
    ? "-ml-[calc(var(--bj-card-h)*0.28)]"
    : compact
      ? "-ml-5 sm:-ml-8"
      : "-ml-6 sm:-ml-10";

  // Rank typography: classical serif for every rank — readable at all sizes.
  const rankFontClass = "font-serif";

  // Corner-rank size scales with layout mode.
  const cornerRankSize = fit
    ? "text-[clamp(10px,calc(var(--bj-card-h)*0.15),20px)]"
    : compact
      ? "text-sm"
      : "text-base sm:text-lg";

  const cornerSuitSize = fit
    ? "text-[clamp(8px,calc(var(--bj-card-h)*0.1),14px)]"
    : "text-xs sm:text-sm";

  const centerSuitSize = fit
    ? "text-[clamp(18px,calc(var(--bj-card-h)*0.32),48px)]"
    : compact
      ? "text-2xl"
      : "text-3xl sm:text-4xl";

  // Court letter (J / Q / K) inside the ring, under its crest.
  const courtLetterSize = fit
    ? "text-[clamp(11px,calc(var(--bj-card-h)*0.2),30px)]"
    : compact
      ? "text-base sm:text-xl lg:text-lg"
      : "text-xl sm:text-2xl";

  const crestSize = fit
    ? "w-[calc(var(--bj-card-h)*0.16)]"
    : compact
      ? "w-4 sm:w-5"
      : "w-5 sm:w-6";

  // Monogram on the card back.
  const monogramSize = fit
    ? "text-[clamp(8px,calc(var(--bj-card-h)*0.13),18px)]"
    : compact
      ? "text-[9px] sm:text-sm lg:text-xs"
      : "text-xs sm:text-base lg:text-sm";
  const monogramSuitSize = fit
    ? "text-[clamp(7px,calc(var(--bj-card-h)*0.1),14px)]"
    : compact
      ? "text-[8px] sm:text-xs"
      : "text-[10px] sm:text-sm";

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    const shoe = document.getElementById("dealer-shoe");

    if (!el || !shoe) return;

    const cardRect = el.getBoundingClientRect();
    const shoeRect = shoe.getBoundingClientRect();

    el.style.setProperty(
      "--deal-x",
      `${shoeRect.left + shoeRect.width * 0.42 - (cardRect.left + cardRect.width / 2)}px`
    );

    el.style.setProperty(
      "--deal-y",
      `${shoeRect.top + shoeRect.height * 0.1 - (cardRect.top + cardRect.height / 2)}px`
    );
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative shrink-0 ${animated ? "animate-deal" : ""} ${size} ${overlap ? shift : ""}`}
      style={{ perspective: "1000px" }}
      role="img"
      aria-label={faceDown ? "Face-down card" : `${card.rank} of ${card.suit}`}
    >
      {/* Reveal halo — soft gold pulse behind the card. Used on the
          dealer's hole card during the reveal so the flip reads on
          any screen size. */}
      {highlight && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-18%] rounded-xl animate-reveal-glow"
          style={{
            background:
              "radial-gradient(circle, rgba(246,228,169,0.6) 0%, rgba(229,199,121,0) 70%)",
            zIndex: -1,
          }}
        />
      )}
      <div
        className="relative h-full w-full transition-transform ease-[cubic-bezier(0.3,0.75,0.2,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: faceDown ? "rotateY(0deg)" : "rotateY(180deg)",
          transitionDuration: `${flipDurationMs}ms`,
        }}
      >
        {/* ── Back ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border border-[#d7b45b]/60"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            boxShadow: CARD_SHADOW,
            // Engraved back: a fine gold diamond lattice over the
            // table's two back colours.
            background: [
              "repeating-linear-gradient(45deg, rgba(215,180,91,0.22) 0 1px, transparent 1px 7px)",
              "repeating-linear-gradient(-45deg, rgba(215,180,91,0.22) 0 1px, transparent 1px 7px)",
              `linear-gradient(160deg, ${back[1]} 0%, ${back[0]} 100%)`,
            ].join(", "),
          }}
        >
          {/* Double gold frame */}
          <div className="absolute inset-1 rounded-lg border border-[#d7b45b]/55" />
          <div className="absolute inset-[7px] rounded-md border border-[#d7b45b]/25" />
          {/* House medallion: the RA monogram over a spade */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex aspect-square w-[62%] flex-col items-center justify-center rounded-full border border-[#d7b45b]/70 leading-none text-[#e5c779]"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${back[1]} 0%, ${back[0]} 75%)`,
                boxShadow:
                  "inset 0 0 0 2px rgba(0,0,0,0.35), inset 0 0 0 3px rgba(215,180,91,0.3), 0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              <span className={`font-display font-black tracking-[0.08em] ${monogramSize}`}>
                RA
              </span>
              <span className={`mt-px ${monogramSuitSize}`}>♠</span>
            </div>
          </div>
        </div>

        {/* ── Face ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            boxShadow: CARD_SHADOW,
            background:
              "linear-gradient(165deg, #faf6ea 0%, #f3ebd4 60%, #efe5cb 100%)",
          }}
        >
          {/* Gold hairline frame inset — matches the Vegas picker treatment. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[3px] rounded-[10px] border border-[#c8a65b]/35"
          />

          {/* Top-left rank + suit */}
          <div
            className={`absolute left-1.5 top-1 text-center leading-none ${cornerRankSize} ${rankFontClass}`}
            style={{ color: inkColor }}
          >
            <div className="font-bold">{card.rank}</div>
            <div className={`mt-0.5 ${cornerSuitSize} font-sans`} style={{ color: inkColor }}>
              {card.suit}
            </div>
          </div>

          {/* Center suit — face cards get an ornament ring around it. */}
          {isFace ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`relative flex items-center justify-center ${
                  fit
                    ? "h-[calc(var(--bj-card-h)*0.5)] w-[calc(var(--bj-card-h)*0.5)]"
                    : compact
                      ? "h-11 w-11 sm:h-14 sm:w-14"
                      : "h-14 w-14 sm:h-16 sm:w-16"
                }`}
              >
                {/* outer gold ring */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-[#c8a65b]/55"
                />
                {/* inner thinner ring */}
                <span
                  aria-hidden
                  className="absolute inset-[3px] rounded-full border border-[#c8a65b]/25"
                />
                {/* soft radial glow behind the suit */}
                <span
                  aria-hidden
                  className="absolute inset-1 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(200,166,91,0.18) 0%, rgba(200,166,91,0) 70%)",
                  }}
                />
                {isCourt ? (
                  <span className="relative flex flex-col items-center leading-none">
                    <Crest rank={card.rank} className={crestSize} />
                    <span
                      className={`font-display font-black ${courtLetterSize}`}
                      style={{ color: inkCenter }}
                    >
                      {card.rank}
                    </span>
                    <span
                      className={`font-sans ${cornerSuitSize}`}
                      style={{ color: inkCenter }}
                    >
                      {card.suit}
                    </span>
                  </span>
                ) : (
                  <span
                    className={`relative ${centerSuitSize} font-sans`}
                    style={{ color: inkCenter }}
                  >
                    {card.suit}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`absolute inset-0 flex items-center justify-center ${centerSuitSize} font-sans`}
              style={{ color: inkCenter }}
            >
              {card.suit}
            </div>
          )}

          {/* Bottom-right rank + suit (rotated 180°) */}
          <div
            className={`absolute bottom-1 right-1.5 rotate-180 text-center leading-none ${cornerRankSize} ${rankFontClass}`}
            style={{ color: inkColor }}
          >
            <div className="font-bold">{card.rank}</div>
            <div className={`mt-0.5 ${cornerSuitSize} font-sans`} style={{ color: inkColor }}>
              {card.suit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
