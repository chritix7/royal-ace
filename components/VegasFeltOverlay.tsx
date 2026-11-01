"use client";

/**
 * Vegas felt — fusion of three design directions:
 *   • E (Royal Spade Insignia): big centered spade watermark + ROYAL
 *     ACE wordmark + gold frame around the whole table.
 *   • A (Monte Carlo Noir): fine gold corner flourishes + slow
 *     candle-light shimmer passing across the gold.
 *   • B (Marble Royal): black-marble surface with real gold veins
 *     running through it.
 *
 * Composition (bottom → top):
 *   1. Black-marble base (SVG turbulence-free "veins" + fine grain).
 *   2. Soft rim-light under the dealer shoe (kept).
 *   3. Rectangular inlay gold frame around the whole table.
 *   4. Four corner flourishes (Monte Carlo-style scrollwork).
 *   5. Big centered spade watermark with a slow moving specular.
 *   6. "ROYAL ACE" blackletter wordmark under the spade.
 *   7. Slow gold shimmer sweep across the whole table.
 */

export default function VegasFeltOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <style>{`
        @keyframes vegas-rim-pulse {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        /* Specular highlight slowly drifting over the center spade */
        @keyframes vegas-spade-sheen {
          0%   { transform: translateX(-80%) rotate(-15deg); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(80%) rotate(-15deg);  opacity: 0; }
        }
        /* Candlelight shimmer passing across the gold accents */
        @keyframes vegas-shimmer {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 0.5; }
          80%  { opacity: 0.5; }
          100% { transform: translateX(100%);  opacity: 0; }
        }
        /* Frame pulse — very subtle breathing on the gold trim */
        @keyframes vegas-frame-breath {
          0%, 100% { opacity: 0.82; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* ========== 1. BLACK MARBLE VEINS ========== */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 900"
      >
        <defs>
          <linearGradient id="vein-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(246, 228, 169, 0)" />
            <stop offset="30%" stopColor="rgba(246, 228, 169, 0.9)" />
            <stop offset="55%" stopColor="rgba(229, 199, 121, 0.7)" />
            <stop offset="100%" stopColor="rgba(246, 228, 169, 0)" />
          </linearGradient>
        </defs>
        <g
          fill="none"
          stroke="url(#vein-gold)"
          strokeLinecap="round"
          style={{ opacity: 0.55 }}
        >
          {/* Primary veins — large diagonal arteries */}
          <path d="M -40 180 Q 300 240 540 160 Q 820 60 1120 180 Q 1380 270 1680 150" strokeWidth="1.6" />
          <path d="M -20 720 Q 260 640 540 760 Q 820 860 1120 720 Q 1380 620 1680 740" strokeWidth="1.4" />
          <path d="M 100 -20 Q 180 220 320 420 Q 440 640 540 920" strokeWidth="1.1" />
          <path d="M 1280 -20 Q 1340 220 1420 440 Q 1500 680 1540 920" strokeWidth="1.1" />
          {/* Secondary veins — thinner branches */}
          <path d="M 280 80 Q 420 220 540 300 Q 700 400 820 280" strokeWidth="0.6" opacity="0.7" />
          <path d="M 920 820 Q 1060 700 1200 760 Q 1340 820 1440 700" strokeWidth="0.6" opacity="0.7" />
          <path d="M -20 420 Q 180 460 360 420 Q 540 380 720 440" strokeWidth="0.5" opacity="0.55" />
          <path d="M 880 460 Q 1060 420 1240 440 Q 1420 460 1620 420" strokeWidth="0.5" opacity="0.55" />
          <path d="M 500 40 Q 580 180 540 320" strokeWidth="0.5" opacity="0.6" />
          <path d="M 1140 820 Q 1080 680 1120 540" strokeWidth="0.5" opacity="0.6" />
          {/* Hairline tertiary veins — crackles */}
          <path d="M 360 300 Q 420 320 480 300" strokeWidth="0.3" opacity="0.4" />
          <path d="M 1180 580 Q 1240 600 1300 580" strokeWidth="0.3" opacity="0.4" />
          <path d="M 220 540 Q 300 560 380 540" strokeWidth="0.3" opacity="0.4" />
          <path d="M 740 220 Q 780 240 820 220" strokeWidth="0.3" opacity="0.4" />
          <path d="M 1020 680 Q 1080 700 1140 680" strokeWidth="0.3" opacity="0.4" />
        </g>
      </svg>

      {/* Fine grain overlay — gives the marble its micro-texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(246, 228, 169, 0.012) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.08) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* ========== 2. SOFT RIM-LIGHT under the dealer shoe ========== */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-80px",
          right: "-30px",
          width: "340px",
          height: "340px",
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(246, 228, 169, 0.28) 55%, rgba(229, 199, 121, 0.1) 72%, transparent 90%)",
          filter: "blur(14px)",
          animation: "vegas-rim-pulse 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "-120px",
          right: "-80px",
          width: "460px",
          height: "460px",
          background:
            "radial-gradient(circle at center, rgba(229, 199, 121, 0.12) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* ========== 3. INLAY GOLD FRAME ========== */}
      {/* Outer thin gold rule */}
      <div
        className="vegas-anim absolute inset-3"
        style={{
          border: "1px solid rgba(229, 199, 121, 0.4)",
          boxShadow:
            "inset 0 0 1px rgba(246, 228, 169, 0.3), 0 0 10px rgba(229, 199, 121, 0.08)",
          animation: "vegas-frame-breath 7s ease-in-out infinite",
        }}
      />
      {/* Inner hairline rule — the double-rule inlay look */}
      <div
        className="absolute inset-5"
        style={{
          border: "1px solid rgba(229, 199, 121, 0.14)",
        }}
      />

      {/* ========== 4. CORNER FLOURISHES (Monte Carlo scrollwork) ========== */}
      <CornerFlourish className="absolute left-3 top-3" />
      <CornerFlourish
        className="absolute right-3 top-3"
        style={{ transform: "scaleX(-1)" }}
      />
      <CornerFlourish
        className="absolute left-3 bottom-3"
        style={{ transform: "scaleY(-1)" }}
      />
      <CornerFlourish
        className="absolute right-3 bottom-3"
        style={{ transform: "scale(-1, -1)" }}
      />

      {/* ========== 5. BIG CENTERED SPADE WATERMARK ========== */}
      <div
        className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        style={{
          width: "clamp(220px, 24vw, 320px)",
          height: "clamp(260px, 28vw, 380px)",
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 100 112"
          xmlns="http://www.w3.org/2000/svg"
          className="relative block h-full w-full"
          style={{ opacity: 0.14 }}
        >
          <defs>
            <linearGradient id="spade-mark-gold" x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#fff7d4" />
              <stop offset="40%" stopColor="#e5c779" />
              <stop offset="100%" stopColor="#8c6b23" />
            </linearGradient>
          </defs>
          <path
            d="M 50 6
               C 50 6 84 32 84 58
               C 84 72 75 82 65 82
               C 60 82 55 79 53 75
               C 53 86 55 94 61 100
               L 39 100
               C 45 94 47 86 47 75
               C 45 79 40 82 35 82
               C 25 82 16 72 16 58
               C 16 32 50 6 50 6 Z"
            fill="url(#spade-mark-gold)"
            stroke="rgba(246, 228, 169, 0.6)"
            strokeWidth="0.5"
          />
          {/* Thin center groove */}
          <path
            d="M 50 10 L 50 72"
            stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth="0.4"
            fill="none"
          />
        </svg>
        {/* Specular highlight that drifts slowly across the spade (E) */}
        <div
          className="vegas-anim absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, transparent 35%, rgba(255, 250, 220, 0.28) 48%, rgba(255, 250, 220, 0.5) 50%, rgba(255, 250, 220, 0.28) 52%, transparent 65%)",
            animation: "vegas-spade-sheen 11s ease-in-out infinite",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      {/* ========== 6. ROYAL ACE blackletter wordmark under the spade ========== */}
      <div
        className="absolute left-1/2 whitespace-nowrap uppercase"
        style={{
          top: "72%",
          transform: "translateX(-50%)",
          fontFamily:
            "'Cloister Black', var(--font-blackletter), 'UnifrakturMaguntia', 'Luminari', serif",
          fontSize: "clamp(18px, 2.2vw, 28px)",
          color: "rgba(246, 228, 169, 0.22)",
          letterSpacing: "0.08em",
          lineHeight: 1,
          textShadow:
            "0 1px 2px rgba(0, 0, 0, 0.85), 0 0 10px rgba(229, 199, 121, 0.12)",
        }}
      >
        Royal Ace
      </div>

      {/* ========== 7. CANDLELIGHT SHIMMER sweep across the whole table ========== */}
      <div
        className="vegas-anim absolute inset-y-0 w-[260px]"
        style={{
          left: "0",
          background:
            "linear-gradient(100deg, transparent 20%, rgba(246, 228, 169, 0.08) 50%, transparent 80%)",
          filter: "blur(32px)",
          mixBlendMode: "overlay",
          animation: "vegas-shimmer 16s ease-in-out infinite",
        }}
      />

      {/* ========== Soft edge vignette (keep brightness) ========== */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(0, 0, 0, 0.35) 100%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   Corner flourish — Monte Carlo scrollwork, 60x60
   ============================================================ */

function CornerFlourish({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        width: "54px",
        height: "54px",
        ...style,
      }}
    >
      <g
        stroke="rgba(229, 199, 121, 0.65)"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Main curve */}
        <path
          d="M 4 4 L 24 4 Q 32 4 32 12 Q 32 20 24 20 L 20 20 Q 12 20 12 28 L 12 44"
          strokeWidth="0.9"
        />
        {/* Secondary curve (inner) */}
        <path
          d="M 4 10 L 20 10 Q 26 10 26 16 Q 26 22 20 22 L 18 22 Q 14 22 14 26"
          strokeWidth="0.6"
          opacity="0.75"
        />
        {/* Small scroll at the end */}
        <path
          d="M 32 12 Q 36 8 40 10 Q 42 12 40 14 Q 38 16 36 14"
          strokeWidth="0.6"
          opacity="0.9"
        />
        {/* Terminal dot */}
        <circle cx="40" cy="12" r="1.4" fill="rgba(246, 228, 169, 0.9)" stroke="none" />
        {/* Small jewel in the inside angle */}
        <circle cx="20" cy="20" r="1.6" fill="rgba(246, 228, 169, 0.75)" stroke="none" />
        {/* Short decorative tick */}
        <path d="M 32 32 Q 36 36 32 40" strokeWidth="0.5" opacity="0.6" />
      </g>
    </svg>
  );
}
