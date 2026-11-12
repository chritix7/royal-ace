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
  const [time, setTime] = useState(() => formatHHMM(new Date()));

  useEffect(() => {
    // Tick every second but bail the setState when HH:MM hasn't rolled
    // over — React will still skip a re-render but we save it the
    // reconciliation pass each second.
    const id = window.setInterval(() => {
      const next = formatHHMM(new Date());
      setTime((prev) => (prev === next ? prev : next));
    }, 1_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      aria-label={`Current time ${time}`}
      className={`pointer-events-none flex items-center gap-2 rounded-full border border-[#d7b45b]/30 bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-[#e5c779] shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:text-[11px] ${className}`}
    >
      <span className="uppercase tracking-[0.18em] text-[#d7b45b]/80">
        Clock
      </span>
      <span className="tabular-nums text-white/90">{time}</span>
    </div>
  );
}
