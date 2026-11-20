/**
 * Lobby illustrations: gold line art on carbon black, one per game.
 * Pure SVG (no images), light enough for phones.
 */
export type ArtId = "blackjack" | "slots" | "roulette" | "poker" | "craps" | "penalty";

const Defs = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff3c4" />
      <stop offset="0.45" stopColor="#e5c779" />
      <stop offset="1" stopColor="#8f6a26" />
    </linearGradient>
    <radialGradient id={`glow-${id}`} cx="50%" cy="55%" r="55%">
      <stop offset="0" stopColor="rgba(240,211,139,0.28)" />
      <stop offset="1" stopColor="rgba(240,211,139,0)" />
    </radialGradient>
  </defs>
);

const Card = ({ x, y, r, rank, suit, red, id }: { x: number; y: number; r: number; rank: string; suit: string; red?: boolean; id: string }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x="-30" y="-42" width="60" height="84" rx="7" fill="#f6efdc" stroke={`url(#g-${id})`} strokeWidth="2" />
    <rect x="-25" y="-37" width="50" height="74" rx="4" fill="none" stroke="#c8a65b" strokeOpacity="0.45" />
    <text x="-21" y="-20" fontSize="15" fontWeight="700" fontFamily="Georgia, serif" fill={red ? "#a01c2c" : "#1a1612"}>
      {rank}
    </text>
    <text x="0" y="12" fontSize="30" textAnchor="middle" fill={red ? "#a01c2c" : "#1a1612"}>
      {suit}
    </text>
  </g>
);

export default function GameArt({ id, className = "" }: { id: ArtId; className?: string }) {
  const g = `url(#g-${id})`;
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden="true">
      <Defs id={id} />
      <ellipse cx="160" cy="112" rx="150" ry="90" fill={`url(#glow-${id})`} />
      {id === "blackjack" && (
        <>
          <ellipse cx="160" cy="168" rx="120" ry="18" fill="none" stroke={g} strokeOpacity="0.35" />
          <Card x={135} y={100} r={-12} rank="A" suit="♠" id={id} />
          <Card x={185} y={96} r={10} rank="K" suit="♥" red id={id} />
          <text x="160" y="186" textAnchor="middle" fontSize="11" letterSpacing="4" fill="#e5c779" fillOpacity="0.7" fontFamily="Georgia, serif">
            BLACKJACK PAYS 3 TO 2
          </text>
        </>
      )}
      {id === "slots" && (
        <>
          <rect x="70" y="48" width="180" height="110" rx="14" fill="#0b0b0d" stroke={g} strokeWidth="3" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={84 + i * 52} y="62" width="44" height="82" rx="6" fill="#16161a" stroke="#c8a65b" strokeOpacity="0.4" />
              <text x={106 + i * 52} y="116" textAnchor="middle" fontSize="40" fontWeight="900" fontFamily="Georgia, serif" fill={g}>
                7
              </text>
            </g>
          ))}
          <line x1="78" x2="242" y1="103" y2="103" stroke="#ff4fa3" strokeOpacity="0.55" strokeWidth="2" />
          <circle cx="262" cy="70" r="7" fill={g} />
          <path d="M262 77 v38" stroke={g} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {id === "roulette" && (
        <>
          <circle cx="160" cy="104" r="78" fill="#0b0b0d" stroke={g} strokeWidth="3" />
          {Array.from({ length: 37 }, (_, i) => {
            const a = (i / 37) * Math.PI * 2;
            const x1 = 160 + Math.cos(a) * 62;
            const y1 = 104 + Math.sin(a) * 62;
            const x2 = 160 + Math.cos(a) * 76;
            const y2 = 104 + Math.sin(a) * 76;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i === 0 ? "#1f9d55" : i % 2 ? "#a01c2c" : "#2a2a2e"} strokeWidth="10" />;
          })}
          <circle cx="160" cy="104" r="44" fill="#121215" stroke="#c8a65b" strokeOpacity="0.5" />
          <path d="M160 70 v68 M126 104 h68" stroke={g} strokeWidth="4" strokeLinecap="round" />
          <circle cx="160" cy="104" r="9" fill={g} />
          <circle cx="210" cy="56" r="5" fill="#f4f4f4" />
        </>
      )}
      {id === "poker" && (
        <>
          <Card x={112} y={96} r={-8} rank="A" suit="♦" red id={id} />
          <Card x={160} y={92} r={0} rank="A" suit="♣" id={id} />
          <Card x={208} y={96} r={8} rank="K" suit="♥" red id={id} />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${246} ${160 - i * 7})`}>
              <ellipse rx="22" ry="8" fill="#151517" stroke={g} strokeWidth="2" />
            </g>
          ))}
        </>
      )}
      {id === "craps" && (
        <>
          {[
            [128, 104, -14, [0, 2, 4, 6, 8]],
            [196, 100, 12, [0, 2, 6, 8]],
          ].map(([x, y, r, pips], k) => (
            <g key={k} transform={`translate(${x} ${y}) rotate(${r})`}>
              <rect x="-34" y="-34" width="68" height="68" rx="13" fill="#f6efdc" stroke={g} strokeWidth="2.5" />
              {(pips as number[]).map((p) => (
                <circle key={p} cx={-20 + (p % 3) * 20} cy={-20 + Math.floor(p / 3) * 20} r="6" fill={p === 4 && k === 0 ? "#a01c2c" : "#121212"} />
              ))}
            </g>
          ))}
          <ellipse cx="160" cy="166" rx="110" ry="14" fill="none" stroke={g} strokeOpacity="0.35" />
        </>
      )}
      {id === "penalty" && (
        <>
          <path d="M70 150 V60 H250 V150" fill="none" stroke={g} strokeWidth="4" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={`v${i}`} d={`M${90 + i * 20} 62 V150`} stroke="#c8a65b" strokeOpacity="0.2" />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <path key={`h${i}`} d={`M72 ${80 + i * 20} H248`} stroke="#c8a65b" strokeOpacity="0.2" />
          ))}
          <circle cx="160" cy="170" r="16" fill="#0d0d0f" stroke={g} strokeWidth="2.5" />
          <path d="M160 160 l8 6 -3 9 h-10 l-3 -9z" fill={g} />
          <path d="M60 182 H260" stroke={g} strokeOpacity="0.4" />
        </>
      )}
    </svg>
  );
}
