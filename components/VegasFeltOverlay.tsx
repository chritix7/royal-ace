"use client";

/**
 * Vegas felt — fully futuristic alive table. Multiple animated layers
 * stacked to make the whole surface feel like a holographic playfield:
 *
 *   1. Hex grid pattern across the entire felt
 *   2. Gold LED strip trim running the full perimeter with pulse
 *   3. Giant rotating radar sweep beam
 *   4. Vertical volumetric light shafts coming down
 *   5. Glowing gold betting-arc on the player half
 *   6. Mirrored holographic hex emblems with full sci-fi animation
 *   7. Floating ambient particles across the surface
 *   8. Soft rim-light under the dealer shoe
 */

type MotifProps = { className?: string; style?: React.CSSProperties };

const AMBIENT_PARTICLES: ReadonlyArray<{
  x: number; y: number; size: number; delay: number; dur: number;
}> = [
  { x: 12, y: 22, size: 2.2, delay: 0.0, dur: 7 },
  { x: 28, y: 68, size: 1.6, delay: 1.5, dur: 8 },
  { x: 44, y: 36, size: 2.0, delay: 3.1, dur: 7.5 },
  { x: 58, y: 78, size: 1.8, delay: 0.6, dur: 8.5 },
  { x: 72, y: 44, size: 2.4, delay: 2.3, dur: 7 },
  { x: 86, y: 70, size: 1.7, delay: 4.2, dur: 9 },
  { x: 22, y: 86, size: 1.5, delay: 1.0, dur: 7.5 },
  { x: 90, y: 32, size: 1.9, delay: 3.5, dur: 8 },
  { x: 38, y: 58, size: 1.4, delay: 5.0, dur: 7 },
  { x: 66, y: 22, size: 1.8, delay: 2.0, dur: 8 },
];

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
          50%      { opacity: 0.95; transform: scale(1.02); }
        }
        @keyframes vegas-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vegas-core-pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        @keyframes vegas-scanner {
          0%   { transform: translateY(-100%); opacity: 0; }
          15%  { opacity: 0.85; }
          85%  { opacity: 0.85; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        @keyframes vegas-orbit-cw {
          from { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
        }
        @keyframes vegas-orbit-ccw {
          from { transform: rotate(0deg) translateX(78px) rotate(0deg); }
          to   { transform: rotate(-360deg) translateX(78px) rotate(360deg); }
        }
        @keyframes vegas-data-fall {
          0%   { transform: translateY(-14px); opacity: 0; }
          20%  { opacity: 0.9; }
          80%  { opacity: 0.9; }
          100% { transform: translateY(80px);  opacity: 0; }
        }
        /* ====== New table-wide effects ====== */
        @keyframes vegas-table-radar {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vegas-shaft-sway {
          0%, 100% { opacity: 0.4; transform: translateX(0); }
          50%      { opacity: 0.75; transform: translateX(10px); }
        }
        @keyframes vegas-arc-pulse {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 0.85; }
        }
        @keyframes vegas-led-pulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes vegas-particle-float {
          0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
          20%  { opacity: 0.8; }
          80%  { opacity: 0.8; }
          100% { opacity: 0; transform: translate(-18px, -22px) scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.85 !important; transform: none !important; }
        }
      `}</style>

      {/* ========== 1. HEX GRID across the entire felt ========== */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.4 }}
      >
        <defs>
          <pattern
            id="vegas-hex-grid"
            x="0"
            y="0"
            width="48"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <polygon
              points="24,2 46,15 46,41 24,54 2,41 2,15"
              fill="none"
              stroke="rgba(229, 199, 121, 0.22)"
              strokeWidth="0.6"
            />
            <polygon
              points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13"
              fill="none"
              stroke="rgba(229, 199, 121, 0.22)"
              strokeWidth="0.6"
            />
            <polygon
              points="48,-26 70,-13 70,13 48,26 26,13 26,-13"
              fill="none"
              stroke="rgba(229, 199, 121, 0.22)"
              strokeWidth="0.6"
            />
          </pattern>
          <radialGradient id="vegas-grid-mask" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="black" stopOpacity="1" />
            <stop offset="80%" stopColor="black" stopOpacity="0.5" />
            <stop offset="100%" stopColor="black" stopOpacity="0.2" />
          </radialGradient>
          <mask id="vegas-grid-fade">
            <rect width="100%" height="100%" fill="url(#vegas-grid-mask)" />
          </mask>
        </defs>
        <g mask="url(#vegas-grid-fade)">
          <rect width="100%" height="100%" fill="url(#vegas-hex-grid)" />
        </g>
      </svg>

      {/* ========== 2. GIANT ROTATING RADAR SWEEP from table center ========== */}
      <div
        className="vegas-anim absolute left-1/2 top-1/2"
        style={{
          width: "1600px",
          height: "1600px",
          marginLeft: "-800px",
          marginTop: "-800px",
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 335deg, rgba(246, 228, 169, 0.14) 350deg, rgba(246, 228, 169, 0.26) 355deg, rgba(255, 240, 190, 0.3) 358deg, transparent 360deg)",
          borderRadius: "50%",
          animation: "vegas-table-radar 18s linear infinite",
          filter: "blur(2px)",
          mixBlendMode: "screen",
        }}
      />

      {/* ========== 3. VOLUMETRIC LIGHT SHAFTS coming down ========== */}
      {[20, 50, 80].map((x, i) => (
        <div
          key={i}
          className="vegas-anim absolute top-0 h-full"
          style={{
            left: `${x}%`,
            width: "140px",
            marginLeft: "-70px",
            background:
              "linear-gradient(180deg, rgba(246, 228, 169, 0.12) 0%, rgba(229, 199, 121, 0.06) 40%, transparent 80%)",
            filter: "blur(14px)",
            animation: `vegas-shaft-sway ${7 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
            mixBlendMode: "screen",
          }}
        />
      ))}

      {/* ========== 4. GLOWING BETTING ARC on the player half ========== */}
      <div
        className="vegas-anim absolute left-1/2 top-full h-[1200px] w-[1200px] -translate-x-1/2 rounded-full"
        style={{
          marginTop: "-600px",
          border: "1px solid rgba(246, 228, 169, 0.5)",
          boxShadow:
            "0 0 24px rgba(229, 199, 121, 0.3), inset 0 0 24px rgba(229, 199, 121, 0.2)",
          animation: "vegas-arc-pulse 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-1/2 top-full h-[1000px] w-[1000px] -translate-x-1/2 rounded-full"
        style={{
          marginTop: "-500px",
          border: "1px solid rgba(246, 228, 169, 0.25)",
        }}
      />
      <div
        className="absolute left-1/2 top-full h-[1400px] w-[1400px] -translate-x-1/2 rounded-full"
        style={{
          marginTop: "-700px",
          border: "1px solid rgba(229, 199, 121, 0.14)",
        }}
      />

      {/* ========== 5. GOLD LED STRIP around the frame ========== */}
      {/* Top */}
      <div
        className="vegas-anim absolute left-6 right-6 top-2 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(246, 228, 169, 1) 15%, rgba(246, 228, 169, 1) 85%, transparent)",
          boxShadow:
            "0 0 10px rgba(246, 228, 169, 0.9), 0 0 24px rgba(229, 199, 121, 0.5)",
          animation: "vegas-led-pulse 3.5s ease-in-out infinite",
        }}
      />
      {/* Bottom */}
      <div
        className="vegas-anim absolute bottom-2 left-6 right-6 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(246, 228, 169, 1) 15%, rgba(246, 228, 169, 1) 85%, transparent)",
          boxShadow:
            "0 0 10px rgba(246, 228, 169, 0.9), 0 0 24px rgba(229, 199, 121, 0.5)",
          animation: "vegas-led-pulse 3.5s ease-in-out infinite",
          animationDelay: "1.75s",
        }}
      />
      {/* Left */}
      <div
        className="vegas-anim absolute bottom-6 left-2 top-6 w-[2px]"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(246, 228, 169, 1) 15%, rgba(246, 228, 169, 1) 85%, transparent)",
          boxShadow:
            "0 0 10px rgba(246, 228, 169, 0.9), 0 0 24px rgba(229, 199, 121, 0.5)",
          animation: "vegas-led-pulse 4s ease-in-out infinite",
          animationDelay: "0.5s",
        }}
      />
      {/* Right */}
      <div
        className="vegas-anim absolute bottom-6 right-2 top-6 w-[2px]"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(246, 228, 169, 1) 15%, rgba(246, 228, 169, 1) 85%, transparent)",
          boxShadow:
            "0 0 10px rgba(246, 228, 169, 0.9), 0 0 24px rgba(229, 199, 121, 0.5)",
          animation: "vegas-led-pulse 4s ease-in-out infinite",
          animationDelay: "2s",
        }}
      />

      {/* ========== 6. SOFT RIM-LIGHT under the dealer shoe ========== */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-80px",
          right: "-30px",
          width: "340px",
          height: "340px",
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(246, 228, 169, 0.3) 55%, rgba(229, 199, 121, 0.1) 72%, transparent 90%)",
          filter: "blur(14px)",
          animation: "vegas-rim-pulse 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "-120px",
          right: "-80px",
          width: "480px",
          height: "480px",
          background:
            "radial-gradient(circle at center, rgba(229, 199, 121, 0.14) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* ========== 7. FLOATING AMBIENT PARTICLES ========== */}
      {AMBIENT_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="vegas-anim absolute block rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "#fff2b8",
            boxShadow: `0 0 ${p.size * 3}px rgba(246, 228, 169, 1), 0 0 ${p.size}px #fff`,
            animation: `vegas-particle-float ${p.dur}s linear infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}

      {/* ========== 8. HEX EMBLEMS mirrored, lifted 12px ========== */}
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

      {/* ========== 9. Very soft edge vignette (keep brightness) ========== */}
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
   Holographic hex emblem
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
        filter: "drop-shadow(0 0 14px rgba(229, 199, 121, 0.35))",
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <span
          className="absolute block rounded-full"
          style={{
            top: "50%", left: "50%", width: "4px", height: "4px",
            marginTop: "-2px", marginLeft: "-2px",
            background: "#fff2b8",
            boxShadow: "0 0 8px #f6e4a9, 0 0 4px #fff2b8",
            animation: `vegas-orbit-cw ${reverseRing ? "9s" : "11s"} linear infinite`,
          }}
        />
        <span
          className="absolute block rounded-full"
          style={{
            top: "50%", left: "50%", width: "3px", height: "3px",
            marginTop: "-1.5px", marginLeft: "-1.5px",
            background: "#e5c779",
            boxShadow: "0 0 6px #e5c779",
            animation: `vegas-orbit-ccw ${reverseRing ? "7s" : "8s"} linear infinite`,
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute block"
            style={{
              top: "0", left: `${50 + (i - 1) * 24}%`,
              width: "1px", height: "10px",
              background: "linear-gradient(180deg, transparent, rgba(246, 228, 169, 0.95), transparent)",
              boxShadow: "0 0 4px rgba(246, 228, 169, 0.8)",
              animation: `vegas-data-fall ${2.4 + i * 0.4}s linear infinite`,
              animationDelay: `${i * 0.8}s`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <svg aria-hidden="true" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="relative block h-full w-full">
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
          <path id={`he-text-${uid}`} d="M 100 20 L 169 60 L 169 140 L 100 180 L 31 140 L 31 60 Z" fill="none" />
          <clipPath id={`he-clip-${uid}`}>
            <polygon points="100,34 156,66 156,134 100,166 44,134 44,66" />
          </clipPath>
        </defs>

        <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(229, 199, 121, 0.22)" strokeWidth="0.6" strokeDasharray="2 6"
          style={{ transformOrigin: "100px 100px", animation: `vegas-ring-spin ${reverseRing ? "60s" : "80s"} linear infinite ${reverseRing ? "reverse" : ""}` }} />
        <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(246, 228, 169, 0.12)" strokeWidth="0.4" strokeDasharray="8 3 2 3"
          style={{ transformOrigin: "100px 100px", animation: `vegas-ring-spin ${reverseRing ? "40s" : "50s"} linear infinite` }} />

        <g stroke={`url(#he-line-${uid})`} strokeWidth="0.6" fill="none" opacity="0.75">
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60 - 30) * (Math.PI / 180);
            const x1 = 100 + Math.cos(angle) * 72, y1 = 100 + Math.sin(angle) * 72;
            const x2 = 100 + Math.cos(angle) * 92, y2 = 100 + Math.sin(angle) * 92;
            const xk = 100 + Math.cos(angle) * 82, yk = 100 + Math.sin(angle) * 82;
            return (<g key={i}><line x1={x1} y1={y1} x2={xk} y2={yk} /><circle cx={xk} cy={yk} r="1.6" fill="rgba(246, 228, 169, 0.95)" stroke="none" /><line x1={xk} y1={yk} x2={x2} y2={y2} /></g>);
          })}
        </g>

        <polygon points="100,22 167,61 167,139 100,178 33,139 33,61" fill="rgba(14, 10, 18, 0.52)" stroke={`url(#he-line-${uid})`} strokeWidth="1.8" strokeLinejoin="round" />

        {[[100,22],[167,61],[167,139],[100,178],[33,139],[33,61]].map(([x,y],i) => (
          <g key={i}><circle cx={x} cy={y} r="5" fill="rgba(246, 228, 169, 0.22)" /><circle cx={x} cy={y} r="2.6" fill="rgba(246, 228, 169, 1)" stroke="#5c440f" strokeWidth="0.4" /></g>
        ))}

        <polygon points="100,34 156,66 156,134 100,166 44,134 44,66" fill="none" stroke="rgba(229, 199, 121, 0.6)" strokeWidth="0.8" strokeLinejoin="round" />

        <g clipPath={`url(#he-clip-${uid})`} opacity="0.35">
          {[48,60,72,84,96,108,120,132,144,156].map((y,i) => (<line key={`h${i}`} x1="44" x2="156" y1={y} y2={y} stroke="rgba(229, 199, 121, 0.5)" strokeWidth="0.3" />))}
          {[52,64,76,88,100,112,124,136,148].map((x,i) => (<line key={`v${i}`} x1={x} x2={x} y1="40" y2="160" stroke="rgba(229, 199, 121, 0.5)" strokeWidth="0.3" />))}
          <rect x="44" y="0" width="112" height="3" fill="rgba(246, 228, 169, 0.9)"
            style={{ transformOrigin: "100px 100px", animation: "vegas-scanner 3.4s ease-in-out infinite", filter: "drop-shadow(0 0 4px rgba(246, 228, 169, 1))" }} />
        </g>

        <polygon points="100,52 140,74 140,126 100,148 60,126 60,74" fill="none" stroke="rgba(229, 199, 121, 0.4)" strokeWidth="0.5" strokeDasharray="3 3" strokeLinejoin="round" />

        <text style={{ fontFamily: "'JetBrains Mono', var(--font-tech-mono), 'Share Tech Mono', monospace", fontSize: "6px", fill: "rgba(246, 228, 169, 0.72)", letterSpacing: "0.42em", textTransform: "uppercase" }}>
          <textPath href={`#he-text-${uid}`} startOffset="0%">ROYAL ACE · HOUSE EDITION · ROYAL ACE · HOUSE EDITION ·</textPath>
        </text>

        <g style={{ transformOrigin: "100px 100px", animation: "vegas-core-pulse 3.6s ease-in-out infinite" }}>
          <path d="M 100 68 L 112 80 L 122 94 L 126 108 L 122 118 L 112 122 L 104 118 L 104 124 L 108 130 L 92 130 L 96 124 L 96 118 L 88 122 L 78 118 L 74 108 L 78 94 L 88 80 Z"
            fill={`url(#he-core-${uid})`} stroke="#2a1f08" strokeWidth="1.1" strokeLinejoin="round" />
          <line x1="78" y1="106" x2="122" y2="106" stroke="#2a1f08" strokeWidth="0.5" opacity="0.5" />
          <line x1="100" y1="72" x2="100" y2="128" stroke="rgba(255, 255, 240, 0.5)" strokeWidth="0.4" />
          <path d="M 90 82 L 88 92 L 86 100 L 88 108" fill="none" stroke="rgba(255, 250, 220, 0.85)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="100" cy="68" r="1.6" fill="#fff2b8" />
          <circle cx="78" cy="118" r="1" fill="rgba(246, 228, 169, 0.9)" />
          <circle cx="122" cy="118" r="1" fill="rgba(246, 228, 169, 0.9)" />
        </g>

        {[[100,44],[150,100],[100,156],[50,100]].map(([x,y],i) => (
          <g key={i}><circle cx={x} cy={y} r="2.4" fill="rgba(246, 228, 169, 0.18)" /><circle cx={x} cy={y} r="1.2" fill="rgba(246, 228, 169, 0.85)" /></g>
        ))}

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
