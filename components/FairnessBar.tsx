/**
 * Visual bars for the Fairness Check panel.
 *
 * `FairnessBar` plots an observed percentage on a 0..max% track with
 * a thin reference tick (or a shaded reference band) so the player
 * can see at a glance whether their session is riding the expected
 * value or drifting from it. Tone follows the `tone` prop:
 *  - "neutral"  — not enough data yet (gray)
 *  - "normal"   — observed near reference (emerald)
 *  - "unusual"  — observed far from reference (amber)
 *
 * `StackedBar` paints three categories across one track — used for
 * the resolved-hands won / lost / push split.
 */

type Tone = "neutral" | "normal" | "unusual";

const TONE_COLOR: Record<Tone, string> = {
  neutral: "#8a94a5",
  normal: "#5ad48c",
  unusual: "#f0b35a",
};

type FairnessBarProps = {
  observed: number;
  /** Either a single reference percentage, or a range [lo, hi]. */
  reference: number | [number, number];
  referenceLabel: string;
  max: number;
  tone: Tone;
};

export function FairnessBar({
  observed,
  reference,
  referenceLabel,
  max,
  tone,
}: FairnessBarProps) {
  const color = TONE_COLOR[tone];
  const obsPct = Math.max(0, Math.min(100, (observed / max) * 100));
  const isBand = Array.isArray(reference);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[11px]">
        <span className="font-bold tabular-nums text-white">
          {observed.toFixed(1)}%
        </span>
        <span className="text-white/40">ref ≈ {referenceLabel}</span>
      </div>
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/45"
        role="meter"
        aria-valuenow={observed}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Reference band or tick */}
        {isBand ? (
          <div
            aria-hidden
            className="absolute top-0 h-full bg-white/10"
            style={{
              left: `${(reference[0] / max) * 100}%`,
              width: `${((reference[1] - reference[0]) / max) * 100}%`,
            }}
          />
        ) : (
          <div
            aria-hidden
            className="absolute top-0 h-full w-px bg-white/40"
            style={{ left: `${(reference / max) * 100}%` }}
          />
        )}

        {/* Observed fill */}
        <div
          aria-hidden
          className="absolute left-0 top-0 h-full rounded-full transition-[width,background] duration-300"
          style={{
            width: `${obsPct}%`,
            background: `linear-gradient(90deg, ${color}66 0%, ${color} 100%)`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * A single 0..100% track with three stacked segments — used for the
 * won / lost / push split.
 */
export function StackedBar({
  parts,
}: {
  parts: Array<{ label: string; value: number; color: string }>;
}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;

  return (
    <div
      className="relative flex h-1.5 w-full overflow-hidden rounded-full bg-black/45"
      role="img"
      aria-label={parts
        .map((p) => `${p.label} ${((p.value / total) * 100).toFixed(0)}%`)
        .join(", ")}
    >
      {parts.map((p) => {
        const pct = (p.value / total) * 100;
        if (pct <= 0) return null;
        return (
          <div
            key={p.label}
            className="h-full transition-[flex-basis,background] duration-300"
            style={{
              flexBasis: `${pct}%`,
              background: `linear-gradient(90deg, ${p.color}66 0%, ${p.color} 100%)`,
              boxShadow: `inset 0 0 0 0.5px rgba(0,0,0,0.3)`,
            }}
          />
        );
      })}
    </div>
  );
}
