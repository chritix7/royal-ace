import { useId } from "react";

/**
 * Vector artwork for the playing cards: the engraved back and the
 * court-card panel (Jack / Queen / King). Drawn as inline SVG so it is
 * identical on every device and scales with the card.
 */

/** useId() can contain characters that are unsafe inside url(#…). */
const useSafeId = () => `ca${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

const GOLD = "#d7b45b";
const GOLD_DEEP = "#8a6c2b";
const GOLD_LIGHT = "#f0d896";

/** Card back: lattice field, double frame, a central rosette and corner fans. */
export function CardBackArt({ back }: { back: [string, string] }) {
  const id = useSafeId();
  const lattice = `${id}-lattice`;
  const field = `${id}-field`;
  const glow = `${id}-glow`;

  return (
    <svg
      viewBox="0 0 70 98"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id={field} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={back[1]} />
          <stop offset="1" stopColor={back[0]} />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.28" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <pattern id={lattice} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45 35 49)">
          <path d="M0 0 H7 M0 0 V7" stroke={GOLD} strokeOpacity="0.34" strokeWidth="0.45" fill="none" />
          <circle cx="0" cy="0" r="0.6" fill={GOLD} fillOpacity="0.5" />
        </pattern>
      </defs>

      <rect width="70" height="98" fill={`url(#${field})`} />

      {/* Lattice field inside the frame */}
      <rect x="5.5" y="5.5" width="59" height="87" rx="4" fill={`url(#${lattice})`} />
      <rect x="5.5" y="5.5" width="59" height="87" rx="4" fill={`url(#${glow})`} />

      {/* Double frame */}
      <rect x="3.2" y="3.2" width="63.6" height="91.6" rx="5.5" fill="none" stroke={GOLD} strokeOpacity="0.85" strokeWidth="0.9" />
      <rect x="5.5" y="5.5" width="59" height="87" rx="4" fill="none" stroke={GOLD} strokeOpacity="0.45" strokeWidth="0.5" />

      {/* Corner fans */}
      {[
        [5.5, 5.5, 0],
        [64.5, 5.5, 90],
        [64.5, 92.5, 180],
        [5.5, 92.5, 270],
      ].map(([x, y, rot]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d="M0 11 A11 11 0 0 0 11 0 L0 0 Z" fill={back[0]} stroke={GOLD} strokeOpacity="0.7" strokeWidth="0.5" />
          <path d="M0 7 A7 7 0 0 0 7 0" fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="0.4" />
          <circle cx="2.6" cy="2.6" r="1" fill={GOLD} fillOpacity="0.85" />
        </g>
      ))}

      {/* Central rosette: a lozenge with a sunburst and a spade */}
      <g transform="translate(35 49)">
        <path d="M0 -21 L15 0 L0 21 L-15 0 Z" fill={back[0]} stroke={GOLD} strokeWidth="0.9" />
        <path d="M0 -17.5 L12.3 0 L0 17.5 L-12.3 0 Z" fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="0.45" />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d="M0 -11.5 L0.9 -7.2 L-0.9 -7.2 Z"
            fill={GOLD}
            fillOpacity="0.75"
            transform={`rotate(${i * 30})`}
          />
        ))}
        <circle r="6.6" fill={back[1]} stroke={GOLD} strokeWidth="0.7" />
        {/* Spade */}
        <path
          d="M0 -4.4 C2.6 -1.6 4.2 -0.2 4.2 1.5 C4.2 3 3.1 3.9 1.9 3.9 C1.2 3.9 0.7 3.6 0.4 3.2 C0.5 4.2 0.9 4.9 1.7 5.3 L-1.7 5.3 C-0.9 4.9 -0.5 4.2 -0.4 3.2 C-0.7 3.6 -1.2 3.9 -1.9 3.9 C-3.1 3.9 -4.2 3 -4.2 1.5 C-4.2 -0.2 -2.6 -1.6 0 -4.4 Z"
          fill={GOLD_LIGHT}
          transform="translate(0 -0.4)"
        />
        {/* Lozenge tips */}
        <circle cx="0" cy="-21" r="1.3" fill={GOLD} />
        <circle cx="0" cy="21" r="1.3" fill={GOLD} />
        <circle cx="-15" cy="0" r="1.1" fill={GOLD} />
        <circle cx="15" cy="0" r="1.1" fill={GOLD} />
      </g>

      {/* Small ornaments above and below the rosette */}
      {[18, 80].map((y) => (
        <g key={y} transform={`translate(35 ${y})`}>
          <path d="M0 -3.4 L2.4 0 L0 3.4 L-2.4 0 Z" fill={GOLD} fillOpacity="0.9" />
          <path d="M-9 0 H-4 M4 0 H9" stroke={GOLD} strokeOpacity="0.7" strokeWidth="0.5" />
        </g>
      ))}
    </svg>
  );
}

/** Crown / coronet / plumed cap, centred on (0,0), about 16 wide. */
function Crest({ rank }: { rank: string }) {
  if (rank === "K") {
    return (
      <g>
        <path d="M-8 4 L-8 -3 L-4 1 L0 -6 L4 1 L8 -3 L8 4 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.5" strokeLinejoin="round" />
        <rect x="-8" y="4" width="16" height="2" rx="0.6" fill={GOLD_DEEP} />
        <circle cx="0" cy="-6.6" r="1.1" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="0.3" />
        <circle cx="-8" cy="-3.6" r="0.9" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="0.3" />
        <circle cx="8" cy="-3.6" r="0.9" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="0.3" />
      </g>
    );
  }
  if (rank === "Q") {
    return (
      <g>
        <path d="M-8 4 L-9 -2 L-5 1 L-3 -4.5 L0 0.5 L3 -4.5 L5 1 L9 -2 L8 4 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.5" strokeLinejoin="round" />
        <rect x="-8" y="4" width="16" height="1.8" rx="0.6" fill={GOLD_DEEP} />
        {[-9, -3, 3, 9].map((x) => (
          <circle key={x} cx={x} cy={x === -9 || x === 9 ? -2.6 : -5.1} r="0.9" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="0.3" />
        ))}
      </g>
    );
  }
  return (
    <g>
      {/* Jack: a low coronet with a single pearl */}
      <path d="M-7.5 4 L-7.5 0.5 L-3.5 2.2 L0 -3.6 L3.5 2.2 L7.5 0.5 L7.5 4 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.5" strokeLinejoin="round" />
      <rect x="-7.5" y="4" width="15" height="1.8" rx="0.6" fill={GOLD_DEEP} />
      <circle cx="0" cy="-4.4" r="1.2" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="0.3" />
    </g>
  );
}

/**
 * Court card panel, double-ended like a real court card: a framed
 * tinted field with the crest and the letter at the top, the same
 * turned upside down at the bottom, and the suit in a lozenge between.
 */
export function CourtArt({
  rank,
  suit,
  ink,
}: {
  rank: string;
  suit: string;
  ink: string;
}) {
  const id = useSafeId();
  const hatch = `${id}-hatch`;
  const tint = `${id}-tint`;
  const red = suit === "♥" || suit === "♦";

  const half = (
    <g>
      <g transform="translate(20 11.5)">
        <Crest rank={rank} />
      </g>
      <text
        x="20"
        y="35.5"
        textAnchor="middle"
        fontSize="19"
        fontWeight="900"
        fill={ink}
        style={{ fontFamily: "var(--font-display), Georgia, 'Times New Roman', serif" }}
      >
        {rank}
      </text>
    </g>
  );

  return (
    <svg viewBox="0 0 40 88" aria-hidden className="h-full w-full">
      <defs>
        <linearGradient id={tint} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={red ? "#f6dfd6" : "#e3e0d6"} />
          <stop offset="0.5" stopColor={red ? "#f9ece2" : "#efece2"} />
          <stop offset="1" stopColor={red ? "#f6dfd6" : "#e3e0d6"} />
        </linearGradient>
        <pattern id={hatch} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 V3" stroke={ink} strokeOpacity="0.09" strokeWidth="0.6" />
        </pattern>
      </defs>

      {/* Framed field */}
      <rect x="1" y="1" width="38" height="86" rx="3" fill={`url(#${tint})`} />
      <rect x="1" y="1" width="38" height="86" rx="3" fill={`url(#${hatch})`} />
      <rect x="1" y="1" width="38" height="86" rx="3" fill="none" stroke={GOLD_DEEP} strokeOpacity="0.9" strokeWidth="0.8" />
      <rect x="3" y="3" width="34" height="82" rx="2" fill="none" stroke={GOLD} strokeOpacity="0.8" strokeWidth="0.45" />

      {half}
      <g transform="rotate(180 20 44)">{half}</g>

      {/* Sash and central lozenge with the suit */}
      <path d="M3 44 H12 M28 44 H37" stroke={GOLD_DEEP} strokeOpacity="0.8" strokeWidth="0.6" />
      <path d="M20 35.5 L28 44 L20 52.5 L12 44 Z" fill="#fbf6e8" stroke={GOLD_DEEP} strokeWidth="0.7" />
      <path d="M20 37.6 L26 44 L20 50.4 L14 44 Z" fill="none" stroke={GOLD} strokeOpacity="0.8" strokeWidth="0.4" />
      <text x="20" y="47.2" textAnchor="middle" fontSize="8.5" fill={ink} style={{ fontFamily: "Arial, sans-serif" }}>
        {suit}
      </text>
    </svg>
  );
}
