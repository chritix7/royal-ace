"use client";

/**
 * Small sticker that rides a side-bet row to mark it HOT or COLD in
 * the current session. Returns null for neutral so untracked / tepid
 * bets stay uncluttered.
 */
export default function HeatBadge({
  state,
  className = "",
}: {
  state: "hot" | "cold" | "neutral";
  className?: string;
}) {
  if (state === "neutral") return null;
  const hot = state === "hot";
  return (
    <span
      aria-label={hot ? "Hot: recent hits" : "Cold: dry stretch"}
      title={hot ? "Hot — hit recently" : "Cold — dry stretch"}
      className={`pointer-events-none inline-flex items-center gap-0.5 rounded-full border px-1.5 py-[1px] text-[8px] font-black uppercase leading-none tracking-widest backdrop-blur-sm ${
        hot
          ? "border-[#d7b45b]/60 bg-[#d7b45b]/20 text-[#f5d778] shadow-[0_0_8px_rgba(229,199,121,0.35)]"
          : "border-sky-300/40 bg-sky-500/15 text-sky-200"
      } ${className}`}
    >
      <span aria-hidden>{hot ? "🔥" : "❄"}</span>
      <span>{hot ? "Hot" : "Cold"}</span>
    </span>
  );
}
