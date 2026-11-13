"use client";

import { useEffect, useState } from "react";

/**
 * Compact clock pill that sits on the felt, right under the Shoe
 * meter. Reads the live wall-clock time in the viewer's locale, so
 * the player always sees their own time zone without configuration.
 * Ticks every second but only re-renders when the displayed HH:MM
 * actually changes, to avoid needless paints during long hands.
 *
 * Positioning is applied by the caller via the `className` prop so
 * the component is reusable on the classic Table felt (sits below
 * the Shoe pill) and inside the Focus view (same slot, same look).
 */
function formatHHMM(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TableClock({ className = "" }: { className?: string }) {
  // Start with a neutral placeholder so Next.js' static prerender
  // doesn't bake a "server" minute into the HTML (which would hydrate
  // mismatch across time zones). The real HH:MM lands on the first
  // effect tick (client-only) and then every second after.
  const [time, setTime] = useState("—:—");

  useEffect(() => {
    setTime(formatHHMM(new Date()));
    // Tick every second but bail the setState when HH:MM hasn't rolled
    // over — React skips the re-render and we save a reconciliation
    // pass each second.
    const id = window.setInterval(() => {
      const next = formatHHMM(new Date());
      setTime((prev) => (prev === next ? prev : next));
    }, 1_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      aria-label={`Current time ${time}`}
      className={`pointer-events-none inline-flex items-center gap-1.5 rounded-lg border border-[#d7b45b]/25 bg-gradient-to-b from-[#1a1612]/90 to-[#0a0806]/90 px-2 py-0.5 text-[10px] font-semibold text-[#e5c779] shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(229,199,121,0.12)] backdrop-blur-sm sm:text-[11px] ${className}`}
    >
      <span
        aria-hidden
        className="text-[9px] leading-none text-[#d7b45b]/80 sm:text-[10px]"
      >
        ⏱
      </span>
      <span className="tabular-nums text-[#f5d778]">{time}</span>
    </div>
  );
}
