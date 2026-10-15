"use client";

import { useEffect, useRef, useState } from "react";

/** Un nombre qui défile jusqu'à sa nouvelle valeur (vers le haut). Il revient à zéro instantanément. */
export default function RollingNumber({ value, ms = 1100, fromZero = false }: { value: number; ms?: number; fromZero?: boolean }) {
  const [shown, setShown] = useState(fromZero ? 0 : value);
  const from = useRef(fromZero ? 0 : value);

  useEffect(() => {
    if (value <= from.current) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const v = Math.round(a + (value - a) * (1 - Math.pow(1 - p, 3)));
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);

  return <>{shown.toLocaleString("en-US")}</>;
}