"use client";

/**
 * Chrome Hearts "House Edition" overlay layered on top of the vegas
 * theme — dark-luxury black charcoal felt with baroque gold motifs.
 *
 * Composition from bottom to top:
 *  1. Fine velvet grain (very subtle, warm).
 *  2. A soft gold halo at the dealer-shoe area so the shoe stays
 *     visually anchored against the dark felt — most important bit.
 *  3. Baroque gold fleur-de-lys pattern tiled across the whole felt
 *     at low opacity (reads as embroidered thread, not stickers).
 *  4. Chrome Hearts cross watermark large and centered on the dealer
 *     half, barely perceptible — the house mark.
 *  5. Concentric gold arcs radiating from the betting area.
 *  6. Edge vignette so the pattern falls off naturally.
 *  7. A handful of champagne sparkles at the perimeter (fewer and
 *     softer than the first Vegas iteration).
 */

const SPARKLE_POINTS: ReadonlyArray<{
  x: number; y: number; size: number; delay: number; dur: number;
}> = [
  { x: 10, y: 14, size: 2.0, delay: 0.0, dur: 4.2 },
  { x: 32, y: 8,  size: 1.6, delay: 1.3, dur: 4.6 },
  { x: 68, y: 10, size: 1.8, delay: 2.4, dur: 4.0 },
  { x: 90, y: 20, size: 2.2, delay: 0.7, dur: 4.4 },
  { x: 94, y: 55, size: 1.5, delay: 1.9, dur: 4.2 },
  { x: 8,  y: 58, size: 1.8, delay: 2.6, dur: 4.4 },
  { x: 20, y: 88, size: 2.0, delay: 0.5, dur: 4.0 },
  { x: 78, y: 90, size: 1.7, delay: 1.5, dur: 4.2 },
];

export default function VegasFeltOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <style>{`
        @keyframes vegas-halo-pulse {
          0%, 100% { opacity: 0.78; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.04); }
        }
        @keyframes vegas-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          45%      { opacity: 0.85; transform: scale(1.15); }
          60%      { opacity: 0.6;  transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.85 !important; transform: none !important; }
        }
      `}</style>

      {/* 1. Fine velvet grain — barely visible, warm diagonal weave */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, rgba(246, 228, 169, 0.015) 0 1px, transparent 1px 3px)",
            "repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 0 1px, transparent 1px 3px)",
          ].join(", "),
          mixBlendMode: "overlay",
        }}
      />

      {/*
        2. SOFT GOLD HALO around the dealer-shoe area (top-right of the
        felt). This is what keeps the near-black shoe visible against
        the dark felt — a warm rim of light that outlines the shoe's
        silhouette. The halo stays on top of the velvet but below the
        pattern so the pattern reads through it.
      */}
      <div
        className="vegas-anim absolute h-[480px] w-[480px] rounded-full"
        style={{
          top: "-120px",
          right: "-60px",
          background:
            "radial-gradient(circle at center, rgba(246, 228, 169, 0.26) 0%, rgba(229, 199, 121, 0.14) 30%, rgba(229, 199, 121, 0.05) 55%, transparent 75%)",
          filter: "blur(32px)",
          animation: "vegas-halo-pulse 6s ease-in-out infinite",
        }}
      />

      {/* 3. Baroque gold fleur-de-lys pattern tiled over the whole felt */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.11 }}
      >
        <defs>
          <pattern
            id="vegas-baroque"
            x="0"
            y="0"
            width="140"
            height="140"
            patternUnits="userSpaceOnUse"
          >
            {/* Central fleur-de-lys */}
            <g stroke="rgba(229, 199, 121, 1)" strokeWidth="0.9" fill="none" strokeLinecap="round">
              {/* Vertical stem of fleur */}
              <path d="M 70 40 Q 70 55 70 85" />
              {/* Upper bud */}
              <path d="M 70 40 Q 60 48 62 60 Q 70 54 70 50" />
              <path d="M 70 40 Q 80 48 78 60 Q 70 54 70 50" />
              {/* Side scrolls */}
              <path d="M 70 70 Q 55 68 50 80 Q 55 74 62 76" />
              <path d="M 70 70 Q 85 68 90 80 Q 85 74 78 76" />
              {/* Horizontal bar */}
              <path d="M 55 75 L 85 75" />
              {/* Bottom flourish */}
              <path d="M 70 85 Q 65 90 68 95" />
              <path d="M 70 85 Q 75 90 72 95" />
            </g>
            {/* Center jewel dot */}
            <circle cx="70" cy="72" r="1.6" fill="rgba(246, 228, 169, 0.9)" />
            {/* Corner scrollwork — small quarter-arabesques */}
            <g stroke="rgba(229, 199, 121, 0.75)" strokeWidth="0.6" fill="none">
              {/* TL */}
              <path d="M 0 14 Q 8 10 14 0" />
              <path d="M 0 20 Q 12 14 20 0" />
              {/* TR */}
              <path d="M 140 14 Q 132 10 126 0" />
              <path d="M 140 20 Q 128 14 120 0" />
              {/* BL */}
              <path d="M 0 126 Q 8 130 14 140" />
              <path d="M 0 120 Q 12 126 20 140" />
              {/* BR */}
              <path d="M 140 126 Q 132 130 126 140" />
              <path d="M 140 120 Q 128 126 120 140" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vegas-baroque)" />
      </svg>

      {/*
        4. Chrome Hearts cross watermark — large, centered on the dealer
        half of the felt. Barely visible (6% opacity) so it reads as a
        'house mark' embroidered deep in the fabric rather than overt
        branding.
      */}
      <svg
        className="absolute left-1/2 top-[20%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.045 }}
      >
        <g fill="rgba(246, 228, 169, 1)" stroke="rgba(229, 199, 121, 1)" strokeWidth="0.4">
          {/* Vertical bar with flared ends */}
          <path d="M 45 10 L 55 10 L 55 42 L 55 58 L 55 90 L 45 90 L 45 58 L 45 42 Z" />
          {/* Horizontal bar with flared ends */}
          <path d="M 10 45 L 42 45 L 58 45 L 90 45 L 90 55 L 58 55 L 42 55 L 10 55 Z" />
          {/* Center orb */}
          <circle cx="50" cy="50" r="4" />
          {/* Tiny fleur-tips on each arm */}
          <circle cx="50" cy="7"  r="2" />
          <circle cx="50" cy="93" r="2" />
          <circle cx="7"  cy="50" r="2" />
          <circle cx="93" cy="50" r="2" />
        </g>
      </svg>

      {/* 5. Concentric gold arcs radiating from the betting area (bottom) */}
      <div
        className="absolute left-1/2 top-full h-[900px] w-[900px] -translate-x-1/2 -translate-y-[60%] rounded-full"
        style={{ border: "1px solid rgba(229, 199, 121, 0.11)" }}
      />
      <div
        className="absolute left-1/2 top-full h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-[55%] rounded-full"
        style={{ border: "1px solid rgba(229, 199, 121, 0.07)" }}
      />
      <div
        className="absolute left-1/2 top-full h-[1550px] w-[1550px] -translate-x-1/2 -translate-y-[52%] rounded-full"
        style={{ border: "1px solid rgba(229, 199, 121, 0.045)" }}
      />

      {/* 6. Edge vignette so pattern softens into the frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.55) 100%)",
        }}
      />

      {/* 7. Champagne sparkles — fewer and softer than before */}
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
            boxShadow: `0 0 ${p.size * 2}px rgba(246, 228, 169, 0.9), 0 0 ${p.size}px rgba(255, 255, 255, 0.75)`,
            animation: `vegas-sparkle ${p.dur}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
