"use client";

import { useState } from "react";

const COLORS = ["#e5c779", "#d7b45b", "#34d399", "#f87171", "#60a5fa", "#ffffff"];

/** Pluie de confettis. Remonter le composant avec une nouvelle `key` relance l'animation. */
export default function Confetti({ colors = COLORS }: { colors?: string[] }) {
  const [pieces] = useState(() =>
    Array.from({ length: 44 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.6 + Math.random() * 1.2,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length],
      rot: Math.random() * 360,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}