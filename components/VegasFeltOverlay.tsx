"use client";

/**
 * Vegas "Prime" — futuristic premium felt layered on the vegas base
 * gradient. Dark charcoal + gold with HUD-style framing and
 * sticker-style graphics placed at specific anchor points.
 *
 * No tiled patterns, no sparkles. Instead:
 *   • A strong gold spotlight under the dealer shoe so it stays
 *     visually dominant.
 *   • A HUD-style gold frame with corner brackets around the whole
 *     table.
 *   • Three large "sticker" graphics placed at anchor spots:
 *       - Royal Ace crest (hexagonal badge with wordmark + spade)
 *         on the mid-left.
 *       - A single gold spade outline on the top-left as a signature.
 *       - A "HOUSE EDITION" tech plate on the bottom-right.
 *   • Thin geometric gold hairlines connecting the elements.
 *   • A faint CRT-style scan line sweeping down very slowly.
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
        @keyframes vegas-spot-pulse {
          0%, 100% { opacity: 0.9; transform: translate(0, 0) scale(1); }
          50%      { opacity: 1;   transform: translate(0, 0) scale(1.03); }
        }
        @keyframes vegas-scan-sweep {
          0%   { transform: translateY(-20%); opacity: 0; }
          15%  { opacity: 0.35; }
          85%  { opacity: 0.35; }
          100% { transform: translateY(120%); opacity: 0; }
        }
        @keyframes vegas-corner-breath {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.85 !important; transform: none !important; }
        }
      `}</style>

      {/* ====== 1. Strong gold spotlight anchored under the dealer shoe ====== */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-180px",
          right: "-120px",
          width: "620px",
          height: "620px",
          background:
            "radial-gradient(circle at center, rgba(246, 228, 169, 0.42) 0%, rgba(229, 199, 121, 0.24) 22%, rgba(229, 199, 121, 0.1) 45%, transparent 72%)",
          filter: "blur(32px)",
          animation: "vegas-spot-pulse 6s ease-in-out infinite",
        }}
      />
      {/* Hard-edge inner rim just behind the shoe for a crisp outline */}
      <div
        className="absolute rounded-full"
        style={{
          top: "-60px",
          right: "-20px",
          width: "340px",
          height: "340px",
          background:
            "radial-gradient(circle at center, rgba(255, 240, 190, 0.3) 0%, rgba(229, 199, 121, 0.14) 42%, transparent 72%)",
          filter: "blur(14px)",
        }}
      />

      {/* ====== 2. HUD frame around the whole felt ====== */}
      {/* Thin outer gold border */}
      <div
        className="absolute inset-3"
        style={{
          border: "1px solid rgba(229, 199, 121, 0.22)",
          boxShadow: "inset 0 0 24px rgba(0, 0, 0, 0.5)",
        }}
      />
      {/* Even thinner second line for the "double rule" look */}
      <div
        className="absolute inset-5"
        style={{ border: "1px solid rgba(229, 199, 121, 0.08)" }}
      />
      {/* Four corner brackets */}
      <HudCorner className="vegas-anim absolute left-4 top-4" rotation={0} />
      <HudCorner className="vegas-anim absolute right-4 top-4" rotation={90} />
      <HudCorner
        className="vegas-anim absolute right-4 bottom-4"
        rotation={180}
      />
      <HudCorner
        className="vegas-anim absolute left-4 bottom-4"
        rotation={270}
      />

      {/* ====== 3. Sticker graphics at anchor spots ====== */}

      {/* 3a. Royal Ace hexagonal crest — mid-left, flanks the betting area */}
      <RoyalAceCrest
        className="absolute"
        style={{
          top: "50%",
          left: "4%",
          width: "150px",
          height: "150px",
          transform: "translateY(-50%)",
          opacity: 0.85,
        }}
      />

      {/* 3b. Large faint spade watermark — top-left of the dealer half */}
      <SpadeWatermark
        className="absolute"
        style={{
          top: "6%",
          left: "4%",
          width: "140px",
          height: "160px",
          opacity: 0.17,
        }}
      />

      {/* 3c. HOUSE EDITION tech plate — bottom-right */}
      <HouseEditionPlate
        className="absolute"
        style={{
          bottom: "6%",
          right: "4%",
          width: "180px",
          height: "40px",
          opacity: 0.85,
        }}
      />

      {/* ====== 4. Geometric gold hairlines connecting the anchor points ====== */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ opacity: 0.3 }}
      >
        {/* Horizontal mid-line from the crest, dashed */}
        <line
          x1="18%"
          y1="50%"
          x2="46%"
          y2="50%"
          stroke="rgba(229, 199, 121, 1)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        <line
          x1="54%"
          y1="50%"
          x2="82%"
          y2="50%"
          stroke="rgba(229, 199, 121, 1)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        {/* Vertical dashed on the right, connecting shoe area to plate */}
        <line
          x1="92%"
          y1="22%"
          x2="92%"
          y2="78%"
          stroke="rgba(229, 199, 121, 1)"
          strokeWidth="0.4"
          strokeDasharray="3 5"
        />
        {/* Two "fiducial" cross-hairs on the right-edge */}
        <Fiducial cx="92%" cy="42%" />
        <Fiducial cx="92%" cy="62%" />
      </svg>

      {/* ====== 5. Very slow CRT-style scan line sweeping down ====== */}
      <div
        className="vegas-anim absolute left-0 right-0 h-[120px]"
        style={{
          top: 0,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(246, 228, 169, 0.08) 50%, transparent 100%)",
          filter: "blur(8px)",
          animation: "vegas-scan-sweep 14s ease-in-out infinite",
        }}
      />

      {/* ====== 6. Edge vignette (final layer) ====== */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.5) 100%)",
        }}
      />
    </div>
  );
}

/* ========= Reusable graphic parts ========= */

/** HUD corner bracket, 24px square with 2 gold lines like a camera viewfinder. */
function HudCorner({
  className,
  rotation,
}: {
  className?: string;
  rotation: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        width: "24px",
        height: "24px",
        transform: `rotate(${rotation}deg)`,
        animation: "vegas-corner-breath 4s ease-in-out infinite",
      }}
    >
      <path
        d="M 2 10 L 2 2 L 10 2"
        fill="none"
        stroke="rgba(246, 228, 169, 0.85)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M 4 6 L 6 6 M 6 4 L 6 6"
        fill="none"
        stroke="rgba(246, 228, 169, 0.5)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A fiducial cross-hair — small HUD cross used as "waypoint" marker */
function Fiducial({ cx, cy }: { cx: string; cy: string }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r="4"
        fill="none"
        stroke="rgba(246, 228, 169, 0.6)"
        strokeWidth="0.5"
      />
      <line
        x1={cx}
        y1={`calc(${cy} - 8px)`}
        x2={cx}
        y2={`calc(${cy} - 2px)`}
        stroke="rgba(246, 228, 169, 0.6)"
        strokeWidth="0.5"
      />
      <line
        x1={cx}
        y1={`calc(${cy} + 2px)`}
        x2={cx}
        y2={`calc(${cy} + 8px)`}
        stroke="rgba(246, 228, 169, 0.6)"
        strokeWidth="0.5"
      />
      <line
        x1={`calc(${cx} - 8px)`}
        y1={cy}
        x2={`calc(${cx} - 2px)`}
        y2={cy}
        stroke="rgba(246, 228, 169, 0.6)"
        strokeWidth="0.5"
      />
      <line
        x1={`calc(${cx} + 2px)`}
        y1={cy}
        x2={`calc(${cx} + 8px)`}
        y2={cy}
        stroke="rgba(246, 228, 169, 0.6)"
        strokeWidth="0.5"
      />
    </g>
  );
}

/** Royal Ace hexagonal crest — the "signature badge" of the house. */
function RoyalAceCrest({ className, style }: MotifProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="rac-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(246, 228, 169, 0.9)" />
          <stop offset="50%" stopColor="rgba(229, 199, 121, 0.7)" />
          <stop offset="100%" stopColor="rgba(140, 107, 35, 0.55)" />
        </linearGradient>
      </defs>
      {/* Outer hexagon */}
      <polygon
        points="60,6 108,33 108,87 60,114 12,87 12,33"
        fill="none"
        stroke="url(#rac-gold)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Inner hexagon */}
      <polygon
        points="60,18 97,39 97,81 60,102 23,81 23,39"
        fill="none"
        stroke="rgba(229, 199, 121, 0.5)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* 6 fiducial dots at the hex corners */}
      {[
        [60, 6],
        [108, 33],
        [108, 87],
        [60, 114],
        [12, 87],
        [12, 33],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="rgba(246, 228, 169, 0.9)" />
      ))}
      {/* Center spade */}
      <path
        d="M 60 36 C 60 36 78 50 78 63 C 78 70 73 75 68 75 C 65 75 63 73 62 71 C 62 76 63 80 66 83 L 54 83 C 57 80 58 76 58 71 C 57 73 55 75 52 75 C 47 75 42 70 42 63 C 42 50 60 36 60 36 Z"
        fill="rgba(246, 228, 169, 0.95)"
        stroke="rgba(140, 107, 35, 0.7)"
        strokeWidth="0.5"
      />
      {/* "ROYAL ACE" wordmark around the top arc of the crest */}
      <text
        x="60"
        y="27"
        textAnchor="middle"
        style={{
          fontFamily:
            "'JetBrains Mono', var(--font-tech-mono), 'Share Tech Mono', monospace",
          fontSize: "7px",
          fill: "rgba(246, 228, 169, 0.9)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        ROYAL ACE
      </text>
      {/* Tech line under spade */}
      <line
        x1="46"
        y1="90"
        x2="74"
        y2="90"
        stroke="rgba(229, 199, 121, 0.55)"
        strokeWidth="0.4"
      />
      <text
        x="60"
        y="100"
        textAnchor="middle"
        style={{
          fontFamily:
            "'JetBrains Mono', var(--font-tech-mono), 'Share Tech Mono', monospace",
          fontSize: "5.5px",
          fill: "rgba(246, 228, 169, 0.7)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        · HOUSE ·
      </text>
    </svg>
  );
}

/** Large spade watermark — outlined signature on the dealer half */
function SpadeWatermark({ className, style }: MotifProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Big spade outline with concentric inner lines (like a target) */}
      <path
        d="M 50 8 C 50 8 85 32 85 60 C 85 72 78 80 70 80 C 65 80 61 77 58 73 C 58 84 60 92 65 95 L 35 95 C 40 92 42 84 42 73 C 39 77 35 80 30 80 C 22 80 15 72 15 60 C 15 32 50 8 50 8 Z"
        fill="none"
        stroke="rgba(246, 228, 169, 1)"
        strokeWidth="0.8"
      />
      <path
        d="M 50 16 C 50 16 78 36 78 58 C 78 68 72 74 66 74 C 62 74 59 72 57 69 C 57 78 59 85 62 88 L 38 88 C 41 85 43 78 43 69 C 41 72 38 74 34 74 C 28 74 22 68 22 58 C 22 36 50 16 50 16 Z"
        fill="none"
        stroke="rgba(229, 199, 121, 0.6)"
        strokeWidth="0.4"
      />
      {/* Center dot */}
      <circle cx="50" cy="52" r="1.6" fill="rgba(246, 228, 169, 0.9)" />
    </svg>
  );
}

/** Tech-plate style HOUSE EDITION label with model number */
function HouseEditionPlate({ className, style }: MotifProps) {
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "2px",
        padding: "4px 10px",
        background:
          "linear-gradient(180deg, rgba(10, 8, 12, 0.75) 0%, rgba(4, 3, 8, 0.75) 100%)",
        border: "1px solid rgba(229, 199, 121, 0.4)",
        borderRadius: "4px",
        boxShadow:
          "inset 0 0 10px rgba(229, 199, 121, 0.08), 0 1px 2px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div
        style={{
          fontFamily:
            "'JetBrains Mono', var(--font-tech-mono), 'Share Tech Mono', monospace",
          fontSize: "9px",
          color: "rgba(246, 228, 169, 0.9)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          lineHeight: 1,
          textShadow: "0 0 4px rgba(229, 199, 121, 0.4)",
        }}
      >
        House Edition
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily:
            "'JetBrains Mono', var(--font-tech-mono), 'Share Tech Mono', monospace",
          fontSize: "6px",
          color: "rgba(246, 228, 169, 0.55)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        <span>RA · S-17 · 6D</span>
        <span>v01</span>
      </div>
    </div>
  );
}
