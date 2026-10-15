"use client";

import { useState } from "react";

/** Pluie de pièces d'or. Remonter le composant avec une nouvelle `key` relance l'animation. */
export default function CoinRain({ count = 34 }: { count?: number }) {
  const [coins] = useState(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      dur: 1.4 + Math.random() * 1.2,
      size: 16 + Math.random() * 14,
    }))
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      {coins.map((c, i) => (
        <span
          key={i}
          className="coin"
          style={{ left: `${c.left}%`, width: c.size, height: c.size, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }}
        />
      ))}
    </div>
  );
}