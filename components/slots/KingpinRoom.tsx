"use client";

/**
 * Desktop backdrop of the Miami machine: the drawing room of a 1980s
 * Miami kingpin's villa. Sunset light through venetian blinds, art-deco
 * gold fans, pink and cyan neon tubes, palm silhouettes and a marble
 * checkerboard floor, all kept dark so the machine owns the light.
 * In free spins (party) the room pulses and spotlights sweep.
 */
export default function KingpinRoom({ party = false }: { party?: boolean }) {
  const blinds = Array.from({ length: 11 }, (_, i) => i);
  const fanRays = Array.from({ length: 9 }, (_, i) => i);
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
        <radialGradient id="krGlow" cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#3b0f33" />
          <stop offset="45%" stopColor="#1a0819" />
          <stop offset="100%" stopColor="#06030a" />
        </radialGradient>
        <linearGradient id="krSun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb36b" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ff4f8b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ff4f8b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="krGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6dc8f" />
          <stop offset="100%" stopColor="#9a7432" />
        </linearGradient>
        <linearGradient id="krFloorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06030a" stopOpacity="1" />
          <stop offset="35%" stopColor="#06030a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06030a" stopOpacity="0.85" />
        </linearGradient>
        <pattern id="krChecker" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#0d0a10" />
          <rect width="40" height="40" fill="#2a2430" />
          <rect x="40" y="40" width="40" height="40" fill="#2a2430" />
        </pattern>
        <filter id="krNeon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="krFloorClip">
          <rect x="0" y="640" width="1600" height="260" />
        </clipPath>
        <filter id="krSoft">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* Room */}
      <rect width="1600" height="900" fill="url(#krGlow)" />

      {/* Wall panelling: thin art-deco pilasters */}
      <g stroke="#d7b45b" strokeOpacity="0.08" strokeWidth="1.5">
        {[120, 260, 1340, 1480].map((x) => (
          <g key={x}>
            <line x1={x} y1="60" x2={x} y2="640" />
            <line x1={x + 10} y1="60" x2={x + 10} y2="640" />
          </g>
        ))}
      </g>

      {/* Sunset through venetian blinds, falling across the right wall */}
      <g transform="translate(980 40) skewX(-18)" filter="url(#krSoft)">
        {blinds.map((i) => (
          <rect key={i} x="0" y={i * 46} width="560" height="22" fill="url(#krSun)" />
        ))}
      </g>
      <g transform="translate(-60 120) skewX(18)" filter="url(#krSoft)" opacity="0.45">
        {blinds.slice(0, 8).map((i) => (
          <rect key={i} x="0" y={i * 46} width="380" height="20" fill="url(#krSun)" />
        ))}
      </g>

      {/* Art-deco gold fans in the top corners */}
      {[
        { cx: 0, flip: 1 },
        { cx: 1600, flip: -1 },
      ].map(({ cx, flip }) => (
        <g key={cx} stroke="url(#krGold)" fill="none" opacity="0.32">
          {[90, 150, 210].map((r) => (
            <path key={r} d={`M${cx} ${r} A${r} ${r} 0 0 ${flip > 0 ? 0 : 1} ${cx + flip * r} 0`} strokeWidth="1.6" />
          ))}
          {fanRays.map((i) => {
            const a = (i / (fanRays.length - 1)) * (Math.PI / 2);
            return (
              <line
                key={i}
                x1={cx}
                y1="0"
                x2={cx + flip * Math.round(250 * Math.sin(a))}
                y2={Math.round(250 * Math.cos(a))}
                strokeWidth="0.8"
              />
            );
          })}
        </g>
      ))}

      {/* Neon tubes framing the machine */}
      <g filter="url(#krNeon)" strokeLinecap="round" fill="none">
        <path d="M70 120 V560 Q70 600 110 600 H190" stroke="#ff4fa3" strokeWidth="4" opacity="0.75" />
        <path d="M1530 120 V560 Q1530 600 1490 600 H1410" stroke="#22d3ee" strokeWidth="4" opacity="0.7" />
        <path d="M40 90 H260" stroke="#22d3ee" strokeWidth="2.5" opacity="0.45" />
        <path d="M1340 90 H1560" stroke="#ff4fa3" strokeWidth="2.5" opacity="0.5" />
      </g>

      {/* Palm silhouettes at the windows */}
      <g fill="#0b0410" opacity="0.95">
        {[
          { x: 150, s: 1 },
          { x: 1460, s: -1 },
        ].map(({ x, s }) => (
          <g key={x} transform={`translate(${x} 640) scale(${s} 1)`}>
            <path d="M0 0 C6 -120 18 -220 30 -330 L40 -330 C30 -220 18 -120 14 0 Z" />
            {[-160, -120, -70, -20, 30, 80].map((rot) => (
              <path
                key={rot}
                transform={`translate(35 -330) rotate(${rot})`}
                d="M0 0 C40 -14 90 -10 140 18 C90 4 40 4 0 6 Z"
              />
            ))}
          </g>
        ))}
      </g>

      {/* Marble checkerboard floor in perspective */}
      <g clipPath="url(#krFloorClip)">
      <g transform="translate(800 640)">
        <g transform="scale(1 0.32) rotate(45)">
          <rect x="-1400" y="-1400" width="2800" height="2800" fill="url(#krChecker)" opacity="0.9" />
        </g>
      </g>
      </g>
      <rect x="0" y="640" width="1600" height="260" fill="url(#krFloorFade)" />
      <line x1="0" y1="640" x2="1600" y2="640" stroke="#d7b45b" strokeOpacity="0.28" strokeWidth="1.5" />

      {/* Free spins: the party starts */}
      {party && (
        <g style={{ mixBlendMode: "screen" }}>
          <rect width="1600" height="900" fill="#ff2e88" opacity="0.08" className="animate-pulse" />
          {[
            { x: 260, c: "#ff4fa3", delay: 0 },
            { x: 620, c: "#ffd166", delay: -1.2 },
            { x: 980, c: "#22d3ee", delay: -2.2 },
            { x: 1340, c: "#a78bfa", delay: -0.6 },
          ].map((b) => (
            <polygon
              key={b.x}
              className="beam"
              style={{ ["--delay" as string]: `${b.delay}s` }}
              points={`${b.x - 16},900 ${b.x + 16},900 ${b.x + 120},40 ${b.x - 120},40`}
              fill={b.c}
              opacity="0.22"
            />
          ))}
        </g>
      )}

    </svg>
  );
}
