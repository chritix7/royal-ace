"use client";

/**
 * Vegas felt — futuristic premium: dark slate base + a soft rim-light
 * outlining (not washing out) the dealer shoe, plus two mirrored
 * holographic hex emblems placed at anchor points on either side of
 * the play area.
 *
 * Each HexEmblem is a layered sci-fi "data core":
 *   - Outer hexagonal frame with glowing corner studs.
 *   - Three concentric inner hexagons at decreasing scale.
 *   - Central spade reimagined with angular/digital cuts and a
 *     spectral gold core.
 *   - Six radial gold circuit traces fanning outward.
 *   - A slow rotating ring under the frame.
 *   - Micro-text ring: 'ROYAL ACE · HOUSE EDITION' spelled around
 *     the outer frame.
 *   - Subtle pulse animation.
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
        @keyframes vegas-hex-breath {
          0%, 100% { opacity: 0.78; transform: scale(1); }
          50%      { opacity: 0.9;  transform: scale(1.02); }
        }
        @keyframes vegas-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vegas-core-pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.85 !important; transform: none !important; }
        }
      `}</style>

      {/* Fine grain overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(246, 228, 169, 0.012) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.08) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />

      {/*
        Rim-light under the shoe — tighter, directional, outlines the
        shoe silhouette instead of washing it out. The previous
        spotlight was so wide and strong that it bled over the whole
        corner and the shoe got lost in it. This one is a focused ring
        of light that follows the shoe's edge.
      */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-80px",
          right: "-30px",
          width: "320px",
          height: "320px",
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(246, 228, 169, 0.22) 55%, rgba(229, 199, 121, 0.08) 72%, transparent 90%)",
          filter: "blur(14px)",
          animation: "vegas-rim-pulse 5s ease-in-out infinite",
        }}
      />
      {/* Soft ambient warmth behind the rim-light so the corner reads lit */}
      <div
        className="absolute rounded-full"
        style={{
          top: "-120px",
          right: "-80px",
          width: "440px",
          height: "440px",
          background:
            "radial-gradient(circle at center, rgba(229, 199, 121, 0.1) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* ============ Two mirrored hex emblems ============ */}

      {/* Right emblem — mid-right, below shoe area */}
      <HexEmblem
        className="absolute"
        style={{
          top: "48%",
          right: "4%",
          width: "190px",
          height: "190px",
          transform: "translateY(-50%)",
        }}
        reverseRing
      />

      {/* Left emblem — mirror position */}
      <HexEmblem
        className="absolute"
        style={{
          top: "48%",
          left: "4%",
          width: "190px",
          height: "190px",
          transform: "translateY(-50%)",
        }}
      />

      {/* Edge vignette (soft, since the base is already brighter) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, transparent 50%, rgba(0, 0, 0, 0.4) 95%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   Holographic hex emblem
   ============================================================ */

function HexEmblem({
  className,
  style,
  reverseRing = false,
}: MotifProps & { reverseRing?: boolean }) {
  const uid = reverseRing ? "r" : "l";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        ...style,
        animation: "vegas-hex-breath 5s ease-in-out infinite",
        filter: "drop-shadow(0 0 12px rgba(229, 199, 121, 0.25))",
      }}
    >
      <defs>
        {/* Spectral gold gradient for the spade core */}
        <radialGradient id={`he-core-${uid}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff2b8" />
          <stop offset="40%" stopColor="#e5c779" />
          <stop offset="100%" stopColor="#5c440f" />
        </radialGradient>
        {/* Gold line gradient */}
        <linearGradient id={`he-line-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(246, 228, 169, 1)" />
          <stop offset="50%" stopColor="rgba(229, 199, 121, 1)" />
          <stop offset="100%" stopColor="rgba(140, 107, 35, 0.8)" />
        </linearGradient>
        {/* Micro-text path around the outer hex */}
        <path
          id={`he-text-${uid}`}
          d="M 100 20 L 169 60 L 169 140 L 100 180 L 31 140 L 31 60 Z"
          fill="none"
        />
      </defs>

      {/* Outer rotating ring (slow) — dashed, under everything else */}
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        stroke="rgba(229, 199, 121, 0.22)"
        strokeWidth="0.6"
        strokeDasharray="2 6"
        style={{
          transformOrigin: "100px 100px",
          animation: `vegas-ring-spin ${reverseRing ? "60s" : "80s"} linear infinite ${
            reverseRing ? "reverse" : ""
          }`,
        }}
      />

      {/* Six radial gold circuit traces fanning outward */}
      <g stroke={`url(#he-line-${uid})`} strokeWidth="0.6" fill="none" opacity="0.7">
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 - 30) * (Math.PI / 180);
          const x1 = 100 + Math.cos(angle) * 72;
          const y1 = 100 + Math.sin(angle) * 72;
          const x2 = 100 + Math.cos(angle) * 92;
          const y2 = 100 + Math.sin(angle) * 92;
          const xk = 100 + Math.cos(angle) * 82;
          const yk = 100 + Math.sin(angle) * 82;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={xk} y2={yk} />
              <circle cx={xk} cy={yk} r="1.6" fill="rgba(246, 228, 169, 0.95)" stroke="none" />
              <line x1={xk} y1={yk} x2={x2} y2={y2} />
            </g>
          );
        })}
      </g>

      {/* Outer hexagonal frame */}
      <polygon
        points="100,22 167,61 167,139 100,178 33,139 33,61"
        fill="rgba(10, 8, 14, 0.42)"
        stroke={`url(#he-line-${uid})`}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Glowing stud at each hex vertex */}
      {[
        [100, 22],
        [167, 61],
        [167, 139],
        [100, 178],
        [33, 139],
        [33, 61],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4.5" fill="rgba(246, 228, 169, 0.2)" />
          <circle cx={x} cy={y} r="2.4" fill="rgba(246, 228, 169, 1)" stroke="#5c440f" strokeWidth="0.4" />
        </g>
      ))}

      {/* Second hexagon (inner frame rule) */}
      <polygon
        points="100,34 156,66 156,134 100,166 44,134 44,66"
        fill="none"
        stroke="rgba(229, 199, 121, 0.55)"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />

      {/* Third hexagon (deepest inner rule) */}
      <polygon
        points="100,52 140,74 140,126 100,148 60,126 60,74"
        fill="none"
        stroke="rgba(229, 199, 121, 0.28)"
        strokeWidth="0.5"
        strokeDasharray="3 3"
        strokeLinejoin="round"
      />

      {/* Micro-text around the outer hex */}
      <text
        style={{
          fontFamily:
            "'JetBrains Mono', var(--font-tech-mono), 'Share Tech Mono', monospace",
          fontSize: "6px",
          fill: "rgba(246, 228, 169, 0.65)",
          letterSpacing: "0.42em",
          textTransform: "uppercase",
        }}
      >
        <textPath href={`#he-text-${uid}`} startOffset="0%">
          ROYAL ACE · HOUSE EDITION · ROYAL ACE · HOUSE EDITION ·
        </textPath>
      </text>

      {/* Digital spade centerpiece — angular, holographic */}
      <g
        style={{
          transformOrigin: "100px 100px",
          animation: "vegas-core-pulse 3.6s ease-in-out infinite",
        }}
      >
        {/* Spade body with angular cuts */}
        <path
          d="M 100 68
             L 112 80
             L 122 94
             L 126 108
             L 122 118
             L 112 122
             L 104 118
             L 104 124
             L 108 130
             L 92 130
             L 96 124
             L 96 118
             L 88 122
             L 78 118
             L 74 108
             L 78 94
             L 88 80
             Z"
          fill={`url(#he-core-${uid})`}
          stroke="#2a1f08"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        {/* Horizontal cut line across the spade (digital look) */}
        <line
          x1="78"
          y1="106"
          x2="122"
          y2="106"
          stroke="#2a1f08"
          strokeWidth="0.5"
          opacity="0.5"
        />
        {/* Vertical cut line */}
        <line
          x1="100"
          y1="72"
          x2="100"
          y2="128"
          stroke="rgba(255, 255, 240, 0.5)"
          strokeWidth="0.4"
        />
        {/* Specular highlight blob on upper left */}
        <path
          d="M 90 82
             L 88 92
             L 86 100
             L 88 108"
          fill="none"
          stroke="rgba(255, 250, 220, 0.85)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Tiny digital bits around the spade */}
        <circle cx="100" cy="68" r="1.6" fill="#fff2b8" />
        <circle cx="78" cy="118" r="1" fill="rgba(246, 228, 169, 0.9)" />
        <circle cx="122" cy="118" r="1" fill="rgba(246, 228, 169, 0.9)" />
      </g>

      {/* Four cardinal fiducials inside the frame (compass marks) */}
      {[
        [100, 44],
        [150, 100],
        [100, 156],
        [50, 100],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(246, 228, 169, 0.75)" />
      ))}
    </svg>
  );
}
