"use client";

/**
 * Desktop backdrop of the Classic machine: an old-school casino floor.
 * Green velvet walls with gold art-deco panels, warm chandelier light,
 * a patterned red carpet. Kept dark so the cabinet owns the light.
 */
export default function ClassicRoom({ party = false }: { party?: boolean }) {
  const panels = [70, 250, 1170, 1350];
  return (
    <svg
      className="room-svg pointer-events-none absolute inset-0 -z-10 h-full w-full"
      // Own GPU layer: rasterised once, never repainted when text or
      // numbers change above it (its blur filters are costly on phones).
      style={{ transform: "translateZ(0)", willChange: "transform" }}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="crWall" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#1f4a36" />
          <stop offset="50%" stopColor="#0f2a1e" />
          <stop offset="100%" stopColor="#050d09" />
        </radialGradient>
        <radialGradient id="crLamp" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <pattern id="crCarpet" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#3a0d12" />
          <path d="M30 6 L54 30 L30 54 L6 30 Z" fill="none" stroke="#d7b45b" strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="4" fill="#d7b45b" fillOpacity="0.3" />
        </pattern>
        <linearGradient id="crFloorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050d09" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#050d09" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#050d09" stopOpacity="0.85" />
        </linearGradient>
        <clipPath id="crFloorClip">
          <rect x="0" y="650" width="1600" height="250" />
        </clipPath>
      </defs>

      <rect width="1600" height="900" fill="url(#crWall)" />
      <rect width="1600" height="900" fill="url(#crLamp)" />

      {/* Gold-framed velvet panels with a deco sunburst */}
      <g stroke="#d7b45b" fill="none">
        {panels.map((x) => (
          <g key={x} strokeOpacity="0.28">
            <rect x={x} y="110" width="180" height="500" rx="6" strokeWidth="2" />
            <rect x={x + 10} y="120" width="160" height="480" rx="4" strokeWidth="0.8" />
            {Array.from({ length: 7 }, (_, i) => {
              const a = Math.PI * (0.15 + (i / 6) * 0.7);
              return <line key={i} x1={x + 90} y1="600" x2={x + 90 - Math.cos(a) * 70} y2={600 - Math.sin(a) * 70} strokeWidth="0.8" />;
            })}
          </g>
        ))}
      </g>

      {/* Chandeliers */}
      {[400, 1200].map((cx) => (
        <g key={cx}>
          <line x1={cx} y1="0" x2={cx} y2="40" stroke="#d7b45b" strokeOpacity="0.5" />
          <ellipse cx={cx} cy="52" rx="46" ry="12" fill="#ffd98a" fillOpacity="0.18" />
          {[-30, -15, 0, 15, 30].map((d) => (
            <circle key={d} cx={cx + d} cy={52 + Math.abs(d) * 0.2} r="3" fill="#fff1bf" fillOpacity="0.8" />
          ))}
          <ellipse cx={cx} cy="120" rx="220" ry="90" fill="#ffd98a" fillOpacity="0.05" />
        </g>
      ))}

      {/* Carpet in perspective */}
      <g clipPath="url(#crFloorClip)">
        <g transform="translate(800 650) scale(1 0.35) rotate(45)">
          <rect x="-1400" y="-1400" width="2800" height="2800" fill="url(#crCarpet)" />
        </g>
      </g>
      <rect x="0" y="650" width="1600" height="250" fill="url(#crFloorFade)" />
      <line x1="0" y1="650" x2="1600" y2="650" stroke="#d7b45b" strokeOpacity="0.35" strokeWidth="2" />

      {party && <rect width="1600" height="900" fill="#ffd166" opacity="0.07" className="animate-pulse" />}
    </svg>
  );
}
