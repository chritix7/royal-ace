"use client";

/**
 * Decorative overlay layered on top of the "vegas" table theme.
 * Pure CSS/SVG, pointer-events none, sits above the base felt gradient
 * but below the actual game content (shoe, cards, chips, bet pads).
 *
 * Composition from bottom to top:
 *  1. Woven velvet grain texture (very fine, warm red)
 *  2. Damask diamond pattern engraved in gold (the classic high-end
 *     Vegas carpet / felt motif)
 *  3. Concentric gold arcs radiating from the betting-zone area
 *  4. A hot gold spotlight at the dealer-shoe area (pulses subtly)
 *  5. Vignette so the edges fall off naturally
 *  6. Scattered champagne sparkles that twinkle at the periphery
 *
 * The overlay respects prefers-reduced-motion.
 */

const SPARKLE_POINTS: ReadonlyArray<{
  x: number; // percent
  y: number; // percent
  size: number; // px
  delay: number; // s
  dur: number; // s
}> = [
  { x: 8,  y: 12, size: 2.5, delay: 0,   dur: 3.4 },
  { x: 22, y: 6,  size: 1.8, delay: 1.1, dur: 4.0 },
  { x: 45, y: 10, size: 2.2, delay: 2.3, dur: 3.6 },
  { x: 68, y: 7,  size: 1.6, delay: 0.6, dur: 3.8 },
  { x: 88, y: 14, size: 2.4, delay: 1.8, dur: 4.2 },
  { x: 94, y: 42, size: 1.8, delay: 0.3, dur: 3.5 },
  { x: 92, y: 72, size: 2.0, delay: 2.0, dur: 3.9 },
  { x: 75, y: 92, size: 2.6, delay: 1.4, dur: 4.1 },
  { x: 50, y: 95, size: 1.6, delay: 0.9, dur: 3.3 },
  { x: 25, y: 92, size: 2.0, delay: 2.6, dur: 3.7 },
  { x: 6,  y: 72, size: 1.9, delay: 1.6, dur: 3.8 },
  { x: 4,  y: 44, size: 2.3, delay: 0.4, dur: 4.0 },
];

export default function VegasFeltOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <style>{`
        @keyframes vegas-spot-pulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.06); }
        }
        @keyframes vegas-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          40%      { opacity: 0.9; transform: scale(1.2); }
          60%      { opacity: 0.75; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.85 !important; transform: none !important; }
        }
      `}</style>

      {/* 1. Woven velvet grain — very subtle diagonal weave */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, rgba(255, 220, 180, 0.02) 0 1px, transparent 1px 3px)",
            "repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.08) 0 1px, transparent 1px 3px)",
          ].join(", "),
          mixBlendMode: "overlay",
        }}
      />

      {/* 2. Damask diamond pattern — gold engraving, large tile */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.14 }}
      >
        <defs>
          <pattern
            id="vegas-damask"
            x="0"
            y="0"
            width="90"
            height="90"
            patternUnits="userSpaceOnUse"
          >
            {/* Central diamond */}
            <path
              d="M 45 10 L 70 45 L 45 80 L 20 45 Z"
              fill="none"
              stroke="rgba(229, 199, 121, 0.9)"
              strokeWidth="0.8"
            />
            {/* Inner diamond */}
            <path
              d="M 45 25 L 60 45 L 45 65 L 30 45 Z"
              fill="none"
              stroke="rgba(229, 199, 121, 0.5)"
              strokeWidth="0.5"
            />
            {/* Dot at center */}
            <circle cx="45" cy="45" r="2.2" fill="rgba(246, 228, 169, 0.75)" />
            {/* Corner florets */}
            <circle cx="0" cy="0" r="1.6" fill="rgba(229, 199, 121, 0.6)" />
            <circle cx="90" cy="0" r="1.6" fill="rgba(229, 199, 121, 0.6)" />
            <circle cx="0" cy="90" r="1.6" fill="rgba(229, 199, 121, 0.6)" />
            <circle cx="90" cy="90" r="1.6" fill="rgba(229, 199, 121, 0.6)" />
            {/* Short cross arms through the center */}
            <line x1="45" y1="0" x2="45" y2="12" stroke="rgba(229, 199, 121, 0.35)" strokeWidth="0.4" />
            <line x1="45" y1="78" x2="45" y2="90" stroke="rgba(229, 199, 121, 0.35)" strokeWidth="0.4" />
            <line x1="0" y1="45" x2="18" y2="45" stroke="rgba(229, 199, 121, 0.35)" strokeWidth="0.4" />
            <line x1="72" y1="45" x2="90" y2="45" stroke="rgba(229, 199, 121, 0.35)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vegas-damask)" />
      </svg>

      {/* 3. Concentric gold arcs radiating from the betting area */}
      <div
        className="absolute left-1/2 top-full h-[900px] w-[900px] -translate-x-1/2 -translate-y-[60%] rounded-full"
        style={{
          border: "1px solid rgba(229, 199, 121, 0.12)",
          boxShadow: "0 0 0 1px rgba(229, 199, 121, 0.06)",
        }}
      />
      <div
        className="absolute left-1/2 top-full h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-[55%] rounded-full"
        style={{
          border: "1px solid rgba(229, 199, 121, 0.08)",
        }}
      />
      <div
        className="absolute left-1/2 top-full h-[1550px] w-[1550px] -translate-x-1/2 -translate-y-[52%] rounded-full"
        style={{
          border: "1px solid rgba(229, 199, 121, 0.05)",
        }}
      />

      {/* 4. Hot gold spotlight at the dealer area (top of felt) */}
      <div
        className="vegas-anim absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(246, 228, 169, 0.35) 0%, rgba(229, 199, 121, 0.14) 35%, transparent 65%)",
          filter: "blur(28px)",
          animation: "vegas-spot-pulse 5.5s ease-in-out infinite",
        }}
      />

      {/* 5. Edge vignette so the pattern softens toward the frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(10, 0, 5, 0.5) 95%)",
        }}
      />

      {/* 6. Champagne sparkles */}
      {SPARKLE_POINTS.map((p, i) => (
        <span
          key={i}
          className="vegas-anim absolute block rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "#fff2b8",
            boxShadow: `0 0 ${p.size * 2}px rgba(246, 228, 169, 0.95), 0 0 ${p.size}px rgba(255, 255, 255, 0.8)`,
            animation: `vegas-sparkle ${p.dur}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
