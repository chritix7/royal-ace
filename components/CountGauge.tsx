/**
 * A centered horizontal gauge for the Hi-Lo running / true count:
 * fills outward from the 0 tick, red toward the left (dealer favor)
 * and emerald/gold toward the right (player favor). Clamps to the
 * provided `max` on either side.
 *
 * Decks-left is a different animal — it's a 0..total meter, drawn
 * by the companion `DeckMeter` below.
 */

type GaugeProps = {
  label: string;
  value: number;
  max: number;
  /** How many decimals to print on the value. 0 for running count. */
  digits?: 0 | 1;
};

export function CountGauge({ label, value, max, digits = 1 }: GaugeProps) {
  const clamped = Math.max(-max, Math.min(max, value));
  // Fill emanates from the centre (50%). Positive goes right, negative left.
  const half = (clamped / max) * 50; // −50..+50
  const left = half >= 0 ? 50 : 50 + half;
  const width = Math.abs(half);

  // Tone follows sign — tiny deadband around 0 reads as neutral.
  const positive = clamped > 0.4;
  const negative = clamped < -0.4;
  const toneClass = positive
    ? "text-emerald-300"
    : negative
      ? "text-red-300"
      : "text-[#e5c779]";
  const fillColor = positive ? "#5ad48c" : negative ? "#f87171" : "#e5c779";

  const shown = value > 0 ? `+${value.toFixed(digits)}` : value.toFixed(digits);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-white/45">
          {label}
        </span>
        <span className={`text-sm font-bold tabular-nums ${toneClass}`}>
          {shown}
        </span>
      </div>
      <div
        className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/45"
        role="meter"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={-max}
        aria-valuemax={max}
      >
        {/* Centre tick */}
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-full w-px bg-white/25"
        />
        {/* Fill: a bar from centre toward the signed side, with a soft
            fade near the centre so the 0 tick keeps reading. */}
        <div
          aria-hidden
          className="absolute top-0 h-full rounded-full transition-[left,width,background] duration-300"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            background:
              half >= 0
                ? `linear-gradient(90deg, ${fillColor}00 0%, ${fillColor} 100%)`
                : `linear-gradient(90deg, ${fillColor} 0%, ${fillColor}00 100%)`,
            boxShadow: `0 0 10px ${fillColor}55`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * A plain 0..total meter for "Decks left". Fills from the left.
 * Low-decks pens are tinted amber so the player sees the shoe
 * getting thin.
 */
export function DeckMeter({
  decksLeft,
  totalDecks,
}: {
  decksLeft: number;
  totalDecks: number;
}) {
  const pct = Math.max(0, Math.min(100, (decksLeft / totalDecks) * 100));
  const low = decksLeft < totalDecks * 0.33;
  const fill = low ? "#f0b35a" : "#e5c779";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-white/45">
          Decks left
        </span>
        <span className="text-sm font-bold tabular-nums text-white/85">
          {decksLeft.toFixed(1)}
          <span className="text-white/35"> / {totalDecks}</span>
        </span>
      </div>
      <div
        className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/45"
        role="meter"
        aria-label="Decks left"
        aria-valuenow={decksLeft}
        aria-valuemin={0}
        aria-valuemax={totalDecks}
      >
        <div
          aria-hidden
          className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${fill}66 0%, ${fill} 100%)`,
            boxShadow: `0 0 8px ${fill}55`,
          }}
        />
      </div>
    </div>
  );
}
