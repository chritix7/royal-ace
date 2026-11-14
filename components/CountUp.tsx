"use client";

import { useEffect, useState } from "react";

/**
 * Rolls a number from 0 up (or down) to `value` once when it mounts or
 * when `value` changes, like chips being counted out. `format` turns
 * each intermediate integer into the displayed string. Respects
 * prefers-reduced-motion by landing on the final value at once.
 */
export default function CountUp({
  value,
  format,
  duration = 750,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      setShown(value);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out: fast at first, settling on the final amount.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(t >= 1 ? value : Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(shown)}</>;
}
