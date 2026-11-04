/**
 * Per-hand result badge: Win · Blackjack · Push · Lose · Bust · Surrender.
 *
 * Wins (and Blackjack) get the full premium treatment — gold / emerald
 * pill, soft halo, and a one-shot shine that sweeps across on appearance.
 * Losses, pushes and surrenders get a calmer pop with no sweep, in a
 * matching muted tint. Everything keys on the result value so the badge
 * re-mounts fresh on each round.
 */
import type { Result } from "../lib/blackjack";

type Style = {
  label: string;
  tone: "gold" | "win" | "lose" | "neutral";
  border: string;
  text: string;
  bg: string;
  boxShadow: string;
};

const STYLES: Record<Result, Style> = {
  blackjack: {
    label: "Blackjack",
    tone: "gold",
    border: "border-[#e5c779]/70",
    text: "text-[#f5d778]",
    bg: "radial-gradient(120% 70% at 50% 0%, rgba(215,180,91,0.3) 0%, rgba(215,180,91,0.08) 100%)",
    boxShadow:
      "0 0 14px rgba(229,199,121,0.4), inset 0 1px 0 rgba(229,199,121,0.3)",
  },
  win: {
    label: "Win",
    tone: "win",
    border: "border-emerald-400/60",
    text: "text-emerald-200",
    bg: "radial-gradient(120% 70% at 50% 0%, rgba(52,211,153,0.3) 0%, rgba(52,211,153,0.08) 100%)",
    boxShadow:
      "0 0 12px rgba(52,211,153,0.35), inset 0 1px 0 rgba(52,211,153,0.2)",
  },
  push: {
    label: "Push",
    tone: "neutral",
    border: "border-white/30",
    text: "text-white/75",
    bg: "rgba(255,255,255,0.07)",
    boxShadow: "none",
  },
  lose: {
    label: "Lose",
    tone: "lose",
    border: "border-red-400/55",
    text: "text-red-300",
    bg: "rgba(192,64,64,0.14)",
    boxShadow: "none",
  },
  bust: {
    label: "Bust",
    tone: "lose",
    border: "border-red-400/55",
    text: "text-red-300",
    bg: "rgba(192,64,64,0.14)",
    boxShadow: "none",
  },
  surrender: {
    label: "Surrender",
    tone: "neutral",
    border: "border-white/25",
    text: "text-white/60",
    bg: "rgba(255,255,255,0.07)",
    boxShadow: "none",
  },
};

export default function HandResultBadge({
  result,
  size = "md",
}: {
  result: Result;
  size?: "sm" | "md";
}) {
  const s = STYLES[result];
  const pad =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px]"
      : "px-2 py-0.5 text-[11px] sm:text-xs";
  const isWin = s.tone === "gold" || s.tone === "win";

  return (
    <span
      key={result}
      className={`animate-result-pop relative inline-flex items-center overflow-hidden rounded-full border font-bold ${pad} ${s.border} ${s.text}`}
      style={{ background: s.bg, boxShadow: s.boxShadow }}
    >
      {isWin && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-16 animate-side-shine"
          style={{
            background:
              "linear-gradient(100deg, transparent 0%, rgba(246,228,169,0.55) 50%, transparent 100%)",
            mixBlendMode: "screen",
          }}
        />
      )}
      <span className="relative">{s.label}</span>
    </span>
  );
}
