/**
 * Side-bet status pill. Shown next to the main round message in both
 * the classic and immersive views. Compact, same footprint as the
 * other status chips around it — no floating toasts — so the player
 * sees side-bet results in the exact same spot in both modes.
 *
 * - Win ("Side bets: Perfect Pair +50…") → gold-framed pill with a
 *   quick gold shine sweep, star glyph, and a soft gold halo.
 * - Loss ("Side bets lost.") → muted neutral pill (no animation).
 */
export default function SideNotePill({ note }: { note: string | null }) {
  if (!note) return null;
  const won = note.includes("+");
  const body = note.replace(/^Side bets:\s*/, "");

  if (!won) {
    return (
      <div
        className="animate-pop max-w-full rounded-full border border-white/15 px-3 py-1 text-center text-[11px] text-white/55 sm:text-xs"
        role="status"
        aria-live="polite"
      >
        {note}
      </div>
    );
  }

  return (
    <div
      key={note}
      role="status"
      aria-live="polite"
      className="animate-pop relative max-w-full overflow-hidden rounded-full border border-[#e5c779]/70 px-3 py-1 text-center text-[11px] font-bold text-[#f5d778] sm:text-xs"
      style={{
        background:
          "radial-gradient(120% 70% at 50% 0%, rgba(215,180,91,0.3) 0%, rgba(215,180,91,0.1) 100%)",
        boxShadow:
          "0 0 14px rgba(229,199,121,0.35), inset 0 1px 0 rgba(229,199,121,0.25)",
      }}
    >
      {/* one-shot gold shine sweeping across on appearance */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-16 animate-side-shine"
        style={{
          background:
            "linear-gradient(100deg, transparent 0%, rgba(246,228,169,0.55) 50%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />
      <span className="relative inline-flex items-center gap-1.5">
        <span aria-hidden className="text-[10px] leading-none">★</span>
        <span className="truncate">{body}</span>
      </span>
    </div>
  );
}
