import type { Card } from "../lib/blackjack";

export default function PlayingCard({
  card,
  faceDown = false,
  overlap = false,
  compact = false,
  fit = false,
  back = ["#142d27", "#1b3d33"],
}: {
  card: Card;
  faceDown?: boolean;
  overlap?: boolean;
  compact?: boolean;
  fit?: boolean;
  back?: [string, string];
}) {
  const color =
    card.suit === "♥" || card.suit === "♦" ? "text-red-600" : "text-slate-900";
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

  return (
    <div
      className={`animate-deal shrink-0 ${size} ${overlap ? shift : ""}`}
      style={{ perspective: "1000px" }}
      role="img"
      aria-label={faceDown ? "Face-down card" : `${card.rank} of ${card.suit}`}
    >
      <div
        className="relative h-full w-full transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: faceDown ? "rotateY(0deg)" : "rotateY(180deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-xl border border-[#d7b45b]/60 shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background:
              `repeating-linear-gradient(45deg,${back[0]} 0 6px,${back[1]} 6px 12px)`,
          }}
        >
          <div className="absolute inset-1.5 flex items-center justify-center rounded-lg border border-[#d7b45b]/40 text-3xl text-[#d7b45b]">
            ♠
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-xl bg-[#f8f5ec] shadow-lg"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div
            className={`absolute left-1.5 top-1 text-center font-bold leading-none ${
              fit
  ? "text-[clamp(9px,calc(var(--bj-card-h)*0.13),18px)]"
  : compact
? "text-xs"
: "text-sm sm:text-base"
            } ${color}`}
          >
            {card.rank}
            <div
  className={
    fit
      ? "mt-0.5 text-[clamp(8px,calc(var(--bj-card-h)*0.1),14px)]"
      : "mt-0.5 text-xs sm:text-sm"
  }
>
  {card.suit}
</div>
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              fit
  ? "text-[clamp(18px,calc(var(--bj-card-h)*0.32),48px)]"
  : compact
? "text-2xl"
: "text-3xl sm:text-4xl"
            } ${color}`}
          >
            {card.suit}
          </div>
          <div
            className={`absolute bottom-1 right-1.5 rotate-180 text-center font-bold leading-none ${
              fit
  ? "text-[clamp(9px,calc(var(--bj-card-h)*0.13),18px)]"
  : compact
  ? "text-sm"
  : "text-base sm:text-lg"
            } ${color}`}
          >
            {card.rank}
            <div
  className={
    fit
      ? "mt-0.5 text-[clamp(8px,calc(var(--bj-card-h)*0.1),14px)]"
      : "mt-0.5 text-xs sm:text-sm"
  }
>
  {card.suit}
</div>
          </div>
        </div>
      </div>
    </div>
  );
}