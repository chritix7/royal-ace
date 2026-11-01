"use client";

/**
 * Vegas felt — futuristic premium: brighter slate base, soft rim-light
 * outlining the dealer shoe, and two mirrored holographic hex emblems
 * with full sci-fi animation layers (orbital particles, scanner sweep,
 * inner grid, data stream, pulse core).
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
          0%, 100% { opacity: 0.82; transform: scale(1); }
          50%      { opacity: 0.95; transform: scale(1.015); }
        }
        @keyframes vegas-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vegas-core-pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        /* Horizontal scanner line sweeping down across the emblem */
        @keyframes vegas-scanner {
          0%   { transform: translateY(-100%); opacity: 0; }
          15%  { opacity: 0.85; }
          85%  { opacity: 0.85; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        /* Orbital particle traversing a circular path */
        @keyframes vegas-orbit-cw {
          from { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
        }
        @keyframes vegas-orbit-ccw {
          from { transform: rotate(0deg) translateX(78px) rotate(0deg); }
          to   { transform: rotate(-360deg) translateX(78px) rotate(360deg); }
        }
        /* Vertical data stream — bits dropping from the top of the emblem */
        @keyframes vegas-data-fall {
          0%   { transform: translateY(-14px); opacity: 0; }
          20%  { opacity: 0.9; }
          80%  { opacity: 0.9; }
          100% { transform: translateY(80px);  opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* Fine grain */}
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
          width: "320px",
          height: "320px",
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(246, 228, 169, 0.24) 55%, rgba(229, 199, 121, 0.08) 72%, transparent 90%)",
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
          width: "440px",
          height: "440px",
          background:
            "radial-gradient(circle at center, rgba(229, 199, 121, 0.1) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* ============ Two mirrored holographic hex emblems ============
          Positioned at the SAME vertical anchor but 12px higher than
          the previous iteration — Alex's request. */}

      <HexEmblem
        className="absolute"
        style={{
          top: "48%",
          right: "4%",
          width: "190px",
          height: "190px",
          transform: "translateY(calc(-50% - 12px))",
        }}
        reverseRing
      />

      <HexEmblem
        className="absolute"
        style={{
          top: "48%",
          left: "4%",
          width: "190px",
          height: "190px",
          transform: "translateY(calc(-50% - 12px))",
        }}
      />

      {/* Edge vignette (very soft since base is brighter now) */}
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
   Holographic hex emblem — sci-fi data core
   ============================================================ */

function HexEmblem({
  className,
  style,
  reverseRing = false,
}: MotifProps & { reverseRing?: boolean }) {
  const uid = reverseRing ? "r" : "l";

  return (
    <div
      className={className}
      style={{
        ...style,
        animation: "vegas-hex-breath 5s ease-in-out infinite",
        filter: "drop-shadow(0 0 14px rgba(229, 199, 121, 0.3))",
      }}
    >
      {/* Orbital particles layer (HTML, animated via @keyframes) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* CW orbit particle */}
        <span
          className="absolute block rounded-full"
          style={{
            top: "50%",
            left: "50%",
            width: "4px",
            height: "4px",
            marginTop: "-2px",
            marginLeft: "-2px",
            background: "#fff2b8",
            boxShadow: "0 0 8px #f6e4a9, 0 0 4px #fff2b8",
            animation: `vegas-orbit-cw ${reverseRing ? "9s" : "11s"} linear infinite`,
          }}
        />
        {/* CCW inner orbit particle */}
        <span
          className="absolute block rounded-full"
          style={{
            top: "50%",
            left: "50%",
            width: "3px",
            height: "3px",
            marginTop: "-1.5px",
            marginLeft: "-1.5px",
            background: "#e5c779",
            boxShadow: "0 0 6px #e5c779",
            animation: `vegas-orbit-ccw ${reverseRing ? "7s" : "8s"} linear infinite`,
          }}
        />
      </div>

      {/* Data-stream particles falling vertically through the emblem */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute block"
            style={{
              top: "0",
              left: `${50 + (i - 1) * 24}%`,
              width: "1px",
              height: "10px",
              background:
                "linear-gradient(180deg, transparent, rgba(246, 228, 169, 0.95), transparent)",
              boxShadow: "0 0 4px rgba(246, 228, 169, 0.8)",
              animation: `vegas-data-fall ${2.4 + i * 0.4}s linear infinite`,
              animationDelay: `${i * 0.8}s`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="relative block h-full w-full"
      >
        <defs>
          <radialGradient id={`he-core-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff2b8" />
            <stop offset="40%" stopColor="#e5c779" />
            <stop offset="100%" stopColor="#5c440f" />
          </radialGradient>
          <linearGradient id={`he-line-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(246, 228, 169, 1)" />
            <stop offset="50%" stopColor="rgba(229, 199, 121, 1)" />
            <stop offset="100%" stopColor="rgba(140, 107, 35, 0.8)" />
          </linearGradient>
          <path
            id={`he-text-${uid}`}
            d="M 100 20 L 169 60 L 169 140 L 100 180 L 31 140 L 31 60 Z"
            fill="none"
          />
          {/* Clip the inner grid to the inner hexagon */}
          <clipPath id={`he-clip-${uid}`}>
            <polygon points="100,34 156,66 156,134 100,166 44,134 44,66" />
          </clipPath>
        </defs>

        {/* Rotating dashed outer ring */}
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

        {/* Second rotating ring at a different speed */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="rgba(246, 228, 169, 0.12)"
          strokeWidth="0.4"
          strokeDasharray="8 3 2 3"
          style={{
            transformOrigin: "100px 100px",
            animation: `vegas-ring-spin ${reverseRing ? "40s" : "50s"} linear infinite`,
          }}
        />

        {/* 6 radial circuit traces fanning outward */}
        <g stroke={`url(#he-line-${uid})`} strokeWidth="0.6" fill="none" opacity="0.75">
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
          fill="rgba(14, 10, 18, 0.48)"
          stroke={`url(#he-line-${uid})`}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Glowing studs at hex vertices */}
        {[
          [100, 22],
          [167, 61],
          [167, 139],
          [100, 178],
          [33, 139],
          [33, 61],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="rgba(246, 228, 169, 0.22)" />
            <circle
              cx={x}
              cy={y}
              r="2.6"
              fill="rgba(246, 228, 169, 1)"
              stroke="#5c440f"
              strokeWidth="0.4"
            />
          </g>
        ))}

        {/* Second hexagon (inner frame rule) */}
        <polygon
          points="100,34 156,66 156,134 100,166 44,134 44,66"
          fill="none"
          stroke="rgba(229, 199, 121, 0.6)"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* === Holographic GRID inside the inner hex (clipped) === */}
        <g clipPath={`url(#he-clip-${uid})`} opacity="0.35">
          {/* Horizontal grid lines */}
          {[48, 60, 72, 84, 96, 108, 120, 132, 144, 156].map((y, i) => (
            <line
              key={`h${i}`}
              x1="44"
              x2="156"
              y1={y}
              y2={y}
              stroke="rgba(229, 199, 121, 0.5)"
              strokeWidth="0.3"
            />
          ))}
          {/* Vertical grid lines */}
          {[52, 64, 76, 88, 100, 112, 124, 136, 148].map((x, i) => (
            <line
              key={`v${i}`}
              x1={x}
              x2={x}
              y1="40"
              y2="160"
              stroke="rgba(229, 199, 121, 0.5)"
              strokeWidth="0.3"
            />
          ))}
          {/* HORIZONTAL SCANNER LINE sweeping down the grid */}
          <rect
            x="44"
            y="0"
            width="112"
            height="3"
            fill="rgba(246, 228, 169, 0.9)"
            style={{
              transformOrigin: "100px 100px",
              animation: "vegas-scanner 3.4s ease-in-out infinite",
              filter: "drop-shadow(0 0 4px rgba(246, 228, 169, 1))",
            }}
          />
        </g>

        {/* Third hexagon (deepest inner dashed rule) */}
        <polygon
          points="100,52 140,74 140,126 100,148 60,126 60,74"
          fill="none"
          stroke="rgba(229, 199, 121, 0.4)"
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
            fill: "rgba(246, 228, 169, 0.72)",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
          }}
        >
          <textPath href={`#he-text-${uid}`} startOffset="0%">
            ROYAL ACE · HOUSE EDITION · ROYAL ACE · HOUSE EDITION ·
          </textPath>
        </text>

        {/* Digital spade centerpiece */}
        <g
          style={{
            transformOrigin: "100px 100px",
            animation: "vegas-core-pulse 3.6s ease-in-out infinite",
          }}
        >
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
          <line
            x1="78"
            y1="106"
            x2="122"
            y2="106"
            stroke="#2a1f08"
            strokeWidth="0.5"
            opacity="0.5"
          />
          <line
            x1="100"
            y1="72"
            x2="100"
            y2="128"
            stroke="rgba(255, 255, 240, 0.5)"
            strokeWidth="0.4"
          />
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
          <circle cx="100" cy="68" r="1.6" fill="#fff2b8" />
          <circle cx="78" cy="118" r="1" fill="rgba(246, 228, 169, 0.9)" />
          <circle cx="122" cy="118" r="1" fill="rgba(246, 228, 169, 0.9)" />
        </g>

        {/* Four cardinal fiducials */}
        {[
          [100, 44],
          [150, 100],
          [100, 156],
          [50, 100],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="2.4" fill="rgba(246, 228, 169, 0.18)" />
            <circle cx={x} cy={y} r="1.2" fill="rgba(246, 228, 169, 0.85)" />
          </g>
        ))}

        {/* Up/down tick marks on the vertical axis — HUD altimeter */}
        <g stroke="rgba(246, 228, 169, 0.55)" strokeWidth="0.4">
          <line x1="100" y1="24" x2="100" y2="32" />
          <line x1="100" y1="168" x2="100" y2="176" />
          <path d="M 97 28 L 100 24 L 103 28" fill="none" />
          <path d="M 97 172 L 100 176 L 103 172" fill="none" />
        </g>
      </svg>
    </div>
  );
}
