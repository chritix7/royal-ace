/**
 * Hand spot badge — a small engraved gold medallion with a Roman
 * numeral (I, II, III, IV) that marks each spot in multi-hand play.
 * Styled to feel engraved into the felt: double gold hairline, deep
 * inset shadow, and a soft gold glow when the spot is the active hand.
 *
 * Shared between the classic Table view and the immersive view so the
 * table typography stays consistent.
 */

const ROMAN = ["I", "II", "III", "IV"];

export default function HandSpotBadge({
  index,
  active = false,
}: {
  index: number;
  active?: boolean;
}) {
  const numeral = ROMAN[index] ?? String(index + 1);

  return (
    <div
      aria-hidden="true"
      className="relative flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7"
      style={{
        background: active
          ? "radial-gradient(circle at 50% 30%, rgba(229,199,121,0.3) 0%, rgba(5,10,7,0.85) 60%, rgba(0,0,0,0.95) 100%)"
          : "radial-gradient(circle at 50% 30%, rgba(229,199,121,0.14) 0%, rgba(5,10,7,0.75) 55%, rgba(0,0,0,0.9) 100%)",
        boxShadow: active
          ? [
              "inset 0 0 0 1px rgba(229,199,121,0.9)",
              "inset 0 0 0 2px rgba(0,0,0,0.5)",
              "inset 0 0 0 3px rgba(229,199,121,0.4)",
              "inset 0 2px 5px rgba(0,0,0,0.75)",
              "0 0 10px rgba(229,199,121,0.35)",
              "0 1px 0 rgba(229,199,121,0.2)",
            ].join(", ")
          : [
              "inset 0 0 0 1px rgba(229,199,121,0.55)",
              "inset 0 0 0 2px rgba(0,0,0,0.5)",
              "inset 0 0 0 3px rgba(229,199,121,0.18)",
              "inset 0 2px 4px rgba(0,0,0,0.6)",
              "0 1px 0 rgba(229,199,121,0.1)",
            ].join(", "),
      }}
    >
      <span
        className="font-serif text-[10px] font-black leading-none sm:text-[11px]"
        style={{
          color: active ? "#f5d778" : "#e5c779",
          textShadow:
            "0 0 3px rgba(229,199,121,0.4), 0 1px 0 rgba(0,0,0,0.9)",
          letterSpacing: "0.05em",
        }}
      >
        {numeral}
      </span>
    </div>
  );
}
