import { money } from "../lib/game";

/**
 * Small gold badge that pops over a side-bet pill when the side bet
 * paid out on the last round. Reads the net PnL from roundBreakdown
 * (positive = win) and only renders while there's something to show.
 * Disappears automatically on the next deal because the breakdown is
 * reset / replaced.
 */
export default function SideWinBadge({ net }: { net: number }) {
  if (net <= 0) return null;
  return (
    <div
      aria-live="polite"
      aria-label={`Side bet won ${net} chips`}
      className="animate-pop pointer-events-none absolute -top-2 right-1 z-20 flex items-center gap-1 whitespace-nowrap rounded-full border border-[#e5c779]/70 bg-[#1a1512] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#f5d778]"
      style={{
        boxShadow:
          "0 0 12px rgba(229,199,121,0.45), 0 2px 4px rgba(0,0,0,0.5)",
      }}
    >
      <span aria-hidden className="text-[8px] leading-none">★</span>
      +◈ {money(net)}
    </div>
  );
}
