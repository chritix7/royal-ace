"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { itemOf, useShop } from "../lib/shop";

/**
 * The shower on big wins: gold coins, or whatever the player equipped in
 * the shop (confetti, stars, cards, banknotes, diamonds).
 * Remounting with a new `key` restarts it.
 */
const CONFETTI = ["#ff4fa3", "#3dd6ff", "#ffd76a", "#7dffb0", "#b18cff", "#ff7a45"];

export function Particle({ kind, size, style, tint }: { kind: string; size: number; style?: CSSProperties; tint?: string }) {
  switch (kind) {
    case "confetti":
      return <span className="fxp fxp--confetti" style={{ width: size * 0.45, height: size * 0.85, background: tint, ...style }} />;
    case "star":
      return <span className="fxp fxp--star" style={{ fontSize: size * 1.1, ...style }}>★</span>;
    case "card":
      return (
        <span className="fxp fxp--card" style={{ width: size * 0.95, height: size * 1.35, fontSize: size * 0.45, ...style }}>
          A<span style={{ color: "#111" }}>♠</span>
        </span>
      );
    case "bill":
      return <span className="fxp fxp--bill" style={{ width: size * 1.7, height: size * 0.85, fontSize: size * 0.5, ...style }}>◈</span>;
    case "diamond":
      return <span className="fxp fxp--diamond" style={{ width: size * 0.9, height: size * 0.9, ...style }} />;
    default:
      return <span className="coin" style={{ width: size, height: size, ...style }} />;
  }
}

export default function CoinRain({ count = 34, kind: forced }: { count?: number; kind?: string }) {
  const kind = forced ?? itemOf(useShop().effect)?.glyph ?? "coin";
  const [coins] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      dur: 1.4 + Math.random() * 1.2,
      size: 16 + Math.random() * 14,
      tint: CONFETTI[i % CONFETTI.length],
    })),
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      {coins.map((c, i) => (
        <Particle key={i} kind={kind} size={c.size} tint={c.tint} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />
      ))}
    </div>
  );
}

/** A small looping sample for the shop. */
const SAMPLE = [
  [10, 0, 1.9], [28, 0.6, 2.3], [46, 0.2, 1.7], [64, 1.0, 2.1], [82, 0.4, 2.0], [36, 1.3, 1.8],
] as const;
export function FxPreview({ kind }: { kind: string }) {
  // Only previews on screen move (the shop has a column of them).
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "40px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className={`pointer-events-none absolute inset-0 overflow-hidden ${seen ? "" : "fx-paused"}`} aria-hidden="true">
      {SAMPLE.map(([left, delay, dur], i) => (
        <Particle key={i} kind={kind} size={15} tint={CONFETTI[i % CONFETTI.length]} style={{ left: `${left}%`, animationName: "fx-loop", animationDelay: `${delay}s`, animationDuration: `${dur}s`, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
      ))}
    </div>
  );
}
