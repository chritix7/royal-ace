"use client";

/**
 * Vegas felt — minimal: deep near-black ground, soft gold spotlight
 * at the dealer area, and two mirrored heraldic emblems placed to
 * the left and right flanking the center of play. No text, no tiled
 * damask — just two "stickers" that read as premium royal insignia.
 *
 * Each emblem is a full armorial crest: outer rope circle, inner
 * laurel wreath, central crowned spade on a gold field, and a
 * ribbon banner under reading "ROYAL ACE" in blackletter.
 */

type MotifProps = {
  className?: string;
  style?: React.CSSProperties;
};

export default function VegasFeltOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <style>{`
        @keyframes vegas-spot-pulse {
          0%, 100% { opacity: 0.9;  transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.03); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* Subtle fine grain so the ground isn't dead flat */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(246, 228, 169, 0.012) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Soft gold spotlight anchored under the dealer shoe (top-right) */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-160px",
          right: "-100px",
          width: "580px",
          height: "580px",
          background:
            "radial-gradient(circle at center, rgba(246, 228, 169, 0.32) 0%, rgba(229, 199, 121, 0.14) 32%, transparent 72%)",
          filter: "blur(32px)",
          animation: "vegas-spot-pulse 6s ease-in-out infinite",
        }}
      />

      {/* ====== Two mirrored heraldic crests ====== */}

      {/* Right crest — under the shoe area */}
      <RoyalCrest
        className="absolute"
        style={{
          top: "32%",
          right: "6%",
          width: "180px",
          height: "220px",
          opacity: 0.78,
        }}
      />

      {/* Left crest — mirror position */}
      <RoyalCrest
        className="absolute"
        style={{
          top: "32%",
          left: "6%",
          width: "180px",
          height: "220px",
          opacity: 0.78,
          transform: "scaleX(-1)",
        }}
      />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, transparent 40%, rgba(0, 0, 0, 0.55) 95%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   Royal Ace armorial crest — the premium "sticker"
   ============================================================ */

function RoyalCrest({ className, style }: MotifProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        {/* Rich 22k gold gradient */}
        <linearGradient id="rc-gold" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#fff2b8" />
          <stop offset="20%" stopColor="#f6e4a9" />
          <stop offset="55%" stopColor="#e5c779" />
          <stop offset="85%" stopColor="#8c6b23" />
          <stop offset="100%" stopColor="#4a3608" />
        </linearGradient>
        {/* Softer gold (background shield) */}
        <linearGradient id="rc-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2320" />
          <stop offset="100%" stopColor="#0e0c0a" />
        </linearGradient>
        {/* Ribbon gradient */}
        <linearGradient id="rc-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a344" />
          <stop offset="50%" stopColor="#8c6b23" />
          <stop offset="100%" stopColor="#4a3608" />
        </linearGradient>
      </defs>

      {/* ====== Crown on top ====== */}
      <g transform="translate(90, 32)">
        {/* Base band */}
        <rect
          x="-26"
          y="-4"
          width="52"
          height="8"
          rx="1.5"
          fill="url(#rc-gold)"
          stroke="#5c440f"
          strokeWidth="0.7"
        />
        {/* Three points with jewels */}
        {/* Left arch */}
        <path
          d="M -24 -4 Q -22 -16 -14 -12 Q -8 -8 -6 -4 Z"
          fill="url(#rc-gold)"
          stroke="#5c440f"
          strokeWidth="0.7"
        />
        <circle cx="-18" cy="-14" r="2.2" fill="#e63946" stroke="#5c440f" strokeWidth="0.4" />
        {/* Center arch (tallest) */}
        <path
          d="M -8 -4 Q -4 -22 0 -22 Q 4 -22 8 -4 Z"
          fill="url(#rc-gold)"
          stroke="#5c440f"
          strokeWidth="0.7"
        />
        <circle cx="0" cy="-18" r="2.6" fill="#4a9eff" stroke="#5c440f" strokeWidth="0.4" />
        {/* Right arch */}
        <path
          d="M 6 -4 Q 8 -8 14 -12 Q 22 -16 24 -4 Z"
          fill="url(#rc-gold)"
          stroke="#5c440f"
          strokeWidth="0.7"
        />
        <circle cx="18" cy="-14" r="2.2" fill="#e63946" stroke="#5c440f" strokeWidth="0.4" />
        {/* Cross on top of center arch */}
        <path
          d="M -1.4 -26 L 1.4 -26 L 1.4 -23 L 4 -23 L 4 -20.5 L 1.4 -20.5 L 1.4 -17 L -1.4 -17 L -1.4 -20.5 L -4 -20.5 L -4 -23 L -1.4 -23 Z"
          fill="url(#rc-gold)"
          stroke="#5c440f"
          strokeWidth="0.5"
        />
        {/* Band pearls */}
        {[-20, -10, 0, 10, 20].map((x, i) => (
          <circle key={i} cx={x} cy="0" r="1.2" fill="#f6e4a9" stroke="#5c440f" strokeWidth="0.3" />
        ))}
      </g>

      {/* ====== Shield outline ====== */}
      <path
        d="M 90 48
           L 150 54
           L 148 110
           Q 145 140 125 160
           Q 108 175 90 182
           Q 72 175 55 160
           Q 35 140 32 110
           L 30 54
           Z"
        fill="url(#rc-field)"
        stroke="url(#rc-gold)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Inner shield rule (thin gold line following shield shape) */}
      <path
        d="M 90 54
           L 144 59
           L 142 108
           Q 140 136 122 154
           Q 106 168 90 175
           Q 74 168 58 154
           Q 40 136 38 108
           L 36 59
           Z"
        fill="none"
        stroke="rgba(229, 199, 121, 0.6)"
        strokeWidth="0.6"
      />

      {/* ====== Laurel wreath wrapping the shield sides ====== */}
      {/* Left side laurel */}
      <g transform="translate(32, 110)">
        {Array.from({ length: 5 }).map((_, i) => {
          const t = i / 4;
          const y = -40 + t * 65;
          const angle = -20 + t * 18;
          return (
            <ellipse
              key={i}
              cx="-6"
              cy={y}
              rx="7"
              ry="3.5"
              fill="url(#rc-gold)"
              stroke="#5c440f"
              strokeWidth="0.4"
              transform={`rotate(${angle} -6 ${y})`}
              opacity="0.85"
            />
          );
        })}
      </g>
      {/* Right side laurel (mirror) */}
      <g transform="translate(148, 110)">
        {Array.from({ length: 5 }).map((_, i) => {
          const t = i / 4;
          const y = -40 + t * 65;
          const angle = 20 - t * 18;
          return (
            <ellipse
              key={i}
              cx="6"
              cy={y}
              rx="7"
              ry="3.5"
              fill="url(#rc-gold)"
              stroke="#5c440f"
              strokeWidth="0.4"
              transform={`rotate(${angle} 6 ${y})`}
              opacity="0.85"
            />
          );
        })}
      </g>

      {/* ====== Central spade on gold field ====== */}
      <path
        d="M 90 76
           C 90 76 118 96 118 118
           C 118 128 112 134 104 134
           C 100 134 96 132 94 128
           C 94 138 96 144 100 148
           L 80 148
           C 84 144 86 138 86 128
           C 84 132 80 134 76 134
           C 68 134 62 128 62 118
           C 62 96 90 76 90 76 Z"
        fill="url(#rc-gold)"
        stroke="#2a1f08"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Highlight on spade upper-left */}
      <path
        d="M 86 84
           C 78 92 72 102 70 112"
        fill="none"
        stroke="rgba(255, 250, 220, 0.75)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* ====== Ribbon banner at bottom with ROYAL ACE ====== */}
      <g transform="translate(90, 188)">
        {/* Left tail */}
        <path
          d="M -58 0
             L -36 -4
             L -32 2
             L -52 10
             L -58 6 Z"
          fill="url(#rc-ribbon)"
          stroke="#2a1f08"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Right tail */}
        <path
          d="M 58 0
             L 36 -4
             L 32 2
             L 52 10
             L 58 6 Z"
          fill="url(#rc-ribbon)"
          stroke="#2a1f08"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Main banner */}
        <path
          d="M -40 -6
             Q 0 -2 40 -6
             L 40 10
             Q 0 14 -40 10 Z"
          fill="url(#rc-gold)"
          stroke="#2a1f08"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
        {/* Inner banner rule */}
        <path
          d="M -36 -3
             Q 0 1 36 -3
             L 36 7
             Q 0 11 -36 7 Z"
          fill="none"
          stroke="rgba(90, 60, 15, 0.6)"
          strokeWidth="0.4"
        />
        {/* ROYAL ACE text */}
        <text
          x="0"
          y="4"
          textAnchor="middle"
          style={{
            fontFamily:
              "'Cloister Black', var(--font-blackletter), 'UnifrakturMaguntia', 'Luminari', serif",
            fontSize: "10px",
            fill: "#2a1f08",
            letterSpacing: "0.04em",
          }}
        >
          Royal Ace
        </text>
      </g>
    </svg>
  );
}
