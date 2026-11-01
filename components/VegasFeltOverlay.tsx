"use client";

/**
 * Vegas felt — premium Blackjack table. Stays firmly in the casino
 * vocabulary (no HUD / radar / tech-grid): just the brighter slate
 * ground, a soft gold spotlight under the dealer shoe, and two
 * mirrored golden spade emblems placed on either side of the center.
 *
 * Each GoldSpade is a large iconic card suit drawn with a rich 22k
 * gold gradient, soft specular highlight, a thin raised bevel, and
 * a very subtle breathing animation. No tiled background, no
 * scanner, no circuit traces — reads as a classic high-end BJ felt.
 */

type MotifProps = { className?: string; style?: React.CSSProperties };

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
        @keyframes vegas-spade-breath {
          0%, 100% { opacity: 0.88; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.025); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* Fine grain so the slate isn't dead flat */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(246, 228, 169, 0.012) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.08) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Soft rim-light outlining the shoe silhouette (top-right) */}
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
      {/* Ambient warmth behind the rim-light */}
      <div
        className="absolute rounded-full"
        style={{
          top: "-120px",
          right: "-80px",
          width: "460px",
          height: "460px",
          background:
            "radial-gradient(circle at center, rgba(229, 199, 121, 0.13) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* ============ Two mirrored golden spades ============ */}

      {/* Right spade */}
      <GoldSpade
        className="absolute"
        style={{
          top: "48%",
          right: "6%",
          width: "160px",
          height: "180px",
          transform: "translateY(calc(-50% - 12px))",
        }}
      />

      {/* Left spade */}
      <GoldSpade
        className="absolute"
        style={{
          top: "48%",
          left: "6%",
          width: "160px",
          height: "180px",
          transform: "translateY(calc(-50% - 12px))",
        }}
      />

      {/* Very soft edge vignette (keep brightness) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, transparent 60%, rgba(0, 0, 0, 0.3) 100%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   GoldSpade — large iconic card suit, premium gold render
   ============================================================ */

function GoldSpade({ className, style }: MotifProps) {
  const uid = Math.random().toString(36).slice(2, 7);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 112"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        ...style,
        animation: "vegas-spade-breath 6s ease-in-out infinite",
        filter:
          "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 14px rgba(229, 199, 121, 0.35))",
      }}
    >
      <defs>
        {/* Rich 22k gold gradient — matches the dealer shoe's gilt accents */}
        <linearGradient id={`gs-gold-${uid}`} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#fff7d4" />
          <stop offset="12%" stopColor="#f6e4a9" />
          <stop offset="38%" stopColor="#e5c779" />
          <stop offset="62%" stopColor="#c9a344" />
          <stop offset="82%" stopColor="#8c6b23" />
          <stop offset="100%" stopColor="#4a3608" />
        </linearGradient>
        {/* Glossy sheen overlay for the top third */}
        <linearGradient id={`gs-gloss-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 250, 220, 0.85)" />
          <stop offset="45%" stopColor="rgba(255, 250, 220, 0.25)" />
          <stop offset="100%" stopColor="rgba(255, 250, 220, 0)" />
        </linearGradient>
        {/* Rim darken */}
        <radialGradient id={`gs-rim-${uid}`} cx="50%" cy="50%" r="52%">
          <stop offset="70%" stopColor="rgba(0, 0, 0, 0)" />
          <stop offset="95%" stopColor="rgba(0, 0, 0, 0.55)" />
        </radialGradient>
        <clipPath id={`gs-clip-${uid}`}>
          <path d="M 50 6
                   C 50 6 84 32 84 58
                   C 84 72 75 82 65 82
                   C 60 82 55 79 53 75
                   C 53 86 55 94 61 100
                   L 39 100
                   C 45 94 47 86 47 75
                   C 45 79 40 82 35 82
                   C 25 82 16 72 16 58
                   C 16 32 50 6 50 6 Z" />
        </clipPath>
      </defs>

      {/* Drop shadow behind the spade */}
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
        fill="rgba(0, 0, 0, 0.4)"
        transform="translate(1 3)"
        style={{ filter: "blur(1.2px)" }}
      />

      {/* Main spade body with rich gold gradient */}
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
        fill={`url(#gs-gold-${uid})`}
        stroke="#2a1f08"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Rim darken vignette inside the spade */}
      <rect
        x="0"
        y="0"
        width="100"
        height="112"
        fill={`url(#gs-rim-${uid})`}
        clipPath={`url(#gs-clip-${uid})`}
      />

      {/* Glossy top-third sheen */}
      <path
        d="M 50 8
           C 50 8 78 28 82 48
           C 70 42 60 40 50 40
           C 40 40 30 42 18 48
           C 22 28 50 8 50 8 Z"
        fill={`url(#gs-gloss-${uid})`}
        clipPath={`url(#gs-clip-${uid})`}
      />

      {/* Bright specular on the upper-left shoulder */}
      <path
        d="M 44 14
           C 34 24 26 36 23 50
           C 22 54 23 58 25 61"
        fill="none"
        stroke="rgba(255, 250, 220, 0.9)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Small polished specks */}
      <ellipse
        cx="38"
        cy="22"
        rx="5"
        ry="3"
        fill="rgba(255, 255, 240, 0.9)"
        transform="rotate(-20 38 22)"
        clipPath={`url(#gs-clip-${uid})`}
      />
      <ellipse
        cx="62"
        cy="44"
        rx="2"
        ry="1.2"
        fill="rgba(255, 255, 240, 0.55)"
        transform="rotate(30 62 44)"
        clipPath={`url(#gs-clip-${uid})`}
      />

      {/* Center groove (very subtle vertical crease) */}
      <path
        d="M 50 8 L 50 70"
        stroke="rgba(0, 0, 0, 0.16)"
        strokeWidth="0.7"
        fill="none"
      />

      {/* Stem notch */}
      <path
        d="M 44 76 Q 50 79 56 76"
        fill="none"
        stroke="rgba(0, 0, 0, 0.4)"
        strokeWidth="1.2"
      />
    </svg>
  );
}
