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
 * - Face cards (A/J/Q/K) get a thin double gold ring + soft halo around
 *   the center suit — they read as "royal" without a louder typeface,
 *   and the uniform rank/suit corner layout stays identical.
 */

const FACE_RANKS = new Set(["A", "J", "Q", "K"]);

export default function PlayingCard({
  card,
  faceDown = false,
  overlap = false,
  compact = false,
  fit = false,
  back = ["#142d27", "#1b3d33"],
  animated = true,
}: {
  card: Card;
  faceDown?: boolean;
  overlap?: boolean;
  compact?: boolean;
  fit?: boolean;
  back?: [string, string];
  animated?: boolean;
}) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  const isFace = FACE_RANKS.has(card.rank);

  // Warmer palette: a muted wine for red suits and a warm charcoal for
  // black suits — both play better with the gold-on-dark environment
  // than default web red/slate.
  const inkColor = isRed ? "#a01c2c" : "#1a1612";
  // A hair lighter for the big center suit so it feels painted, not stamped.
  const inkCenter = isRed ? "#b32538" : "#1f1a16";

  const size = fit
    ? "h-[var(--bj-card-h)] w-[calc(var(--bj-card-h)*0.72)]"
    : compact
      ? "h-[72px] w-[51px] sm:h-24 sm:w-[68px]"
      : "h-24 w-[68px] sm:h-28 sm:w-20";

  const shift = fit
    ? "-ml-[calc(var(--bj-card-h)*0.28)]"
    : compact
      ? "-ml-6 sm:-ml-8"
      : "-ml-8 sm:-ml-10";

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
      className={`shrink-0 ${animated ? "animate-deal" : ""} ${size} ${overlap ? shift : ""}`}
      style={{ perspective: "1000px" }}
      role="img"
      aria-label={faceDown ? "Face-down card" : `${card.rank} of ${card.suit}`}
    >
      <div
        className="relative h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.3,0.75,0.2,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: faceDown ? "rotateY(0deg)" : "rotateY(180deg)",
        }}
      >
        {/* ── Back ── */}
        <div
          className="absolute inset-0 rounded-xl border border-[#d7b45b]/60 shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: `repeating-linear-gradient(45deg,${back[0]} 0 6px,${back[1]} 6px 12px)`,
          }}
        >
          <div className="absolute inset-1.5 flex items-center justify-center rounded-lg border border-[#d7b45b]/40 text-3xl text-[#d7b45b]">
            ♠
          </div>
        </div>

        {/* ── Face ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl shadow-lg"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
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
                <span
                  className={`relative ${centerSuitSize} font-sans`}
                  style={{ color: inkCenter }}
                >
                  {card.suit}
                </span>
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
