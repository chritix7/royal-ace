// Décor du thème Miami : ciel étoilé, soleil rayé, gratte-ciel néon, palmiers et grille à l'horizon.
// Dessin fixe (aucun hasard au rendu), donc identique sur le serveur et dans le navigateur.

import { hashRand as rand, round2 } from "../lib/hashRand";

const HORIZON = 470;

// [x, largeur, hauteur] des immeubles, de chaque côté du soleil
const LEFT: [number, number, number][] = [[0, 70, 150], [62, 54, 230], [110, 66, 120], [170, 48, 190], [214, 62, 100], [270, 50, 150]];
const RIGHT: [number, number, number][] = [[740, 50, 140], [786, 64, 105], [846, 50, 200], [890, 70, 125], [950, 52, 235]];
const STARS = Array.from({ length: 36 }, (_, i) => ({
  x: round2(rand(i + 1) * 1000),
  y: round2(rand(i + 50) * 250),
  r: round2(0.8 + rand(i + 90) * 1.6),
  o: round2(0.35 + rand(i + 7) * 0.65),
}));

function Building({ x, w, h, i }: { x: number; w: number; h: number; i: number }) {
  const top = HORIZON - h;
  const neon = i % 2 ? "#22d3ee" : "#ff4fa3";
  const cols = Math.floor((w - 10) / 12);
  const rows = Math.floor((h - 16) / 16);
  const windows: { x: number; y: number; c: string }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (rand(i * 97 + r * 13 + c * 7) > 0.62) windows.push({ x: x + 8 + c * 12, y: top + 12 + r * 16, c: rand(i + r + c) > 0.5 ? "#ff7ac0" : "#67e8f9" });
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill="#1a0a3a" stroke={neon} strokeWidth="1.6" opacity="0.95" />
      <rect x={x + w * 0.2} y={top - 14} width={w * 0.6} height={14} fill="#1a0a3a" stroke={neon} strokeWidth="1.6" />
      <rect x={x + w * 0.42} y={top - 30} width={3} height={16} fill={neon} />
      {windows.map((wd, k) => (
        <rect key={k} x={wd.x} y={wd.y} width="6" height="8" fill={wd.c} opacity="0.85" />
      ))}
    </g>
  );
}

function Palm({ x, flip }: { x: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${HORIZON + 4}) scale(${flip ? -1 : 1} 1)`} fill="#0d0420">
      <path d="M-4 0 C-8 -60 2 -140 22 -200 L32 -198 C16 -140 10 -60 8 0 Z" />
      <path d="M27 -199 C0 -232 -50 -228 -84 -190 C-52 -206 -14 -204 27 -199 Z" />
      <path d="M27 -199 C52 -236 104 -232 130 -196 C96 -210 60 -206 27 -199 Z" />
      <path d="M27 -199 C14 -240 24 -268 46 -280 C40 -250 42 -224 27 -199 Z" />
      <path d="M27 -199 C-14 -206 -62 -178 -80 -134 C-48 -166 -12 -184 27 -199 Z" />
      <path d="M27 -199 C64 -196 104 -170 118 -128 C88 -158 56 -178 27 -199 Z" />
    </g>
  );
}

export default function MiamiBackdrop({ party = false }: { party?: boolean }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 1000 560"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mbSky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor="#070912" />
  <stop offset="0.55" stopColor="#171127" />
  <stop offset="1" stopColor="#3b193e" />
</linearGradient>

<linearGradient id="mbSun" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor="#c69260" />
  <stop offset="0.55" stopColor="#b45a72" />
  <stop offset="1" stopColor="#863455" />
</linearGradient>

<linearGradient id="mbFloor" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor="#21152e" />
  <stop offset="1" stopColor="#080a12" />
</linearGradient>

{/* Lumière diffuse derrière la scène */}
<radialGradient id="mbAmbient" cx="50%" cy="58%" r="60%">
  <stop offset="0" stopColor="#b44d85" stopOpacity="0.16" />
  <stop offset="0.55" stopColor="#673b8b" stopOpacity="0.06" />
  <stop offset="1" stopColor="#673b8b" stopOpacity="0" />
</radialGradient>

{/* Bords plus sombres, centre dégagé */}
<radialGradient id="mbVignette" cx="50%" cy="48%" r="70%">
  <stop offset="0" stopColor="#03050c" stopOpacity="0" />
  <stop offset="0.48" stopColor="#03050c" stopOpacity="0.06" />
  <stop offset="0.78" stopColor="#03050c" stopOpacity="0.35" />
  <stop offset="1" stopColor="#03050c" stopOpacity="0.72" />
</radialGradient>

        <mask id="mbStripes">
          <rect x="0" y="0" width="1000" height="560" fill="#fff" />
          <rect x="300" y="372" width="400" height="5" fill="#000" />
          <rect x="300" y="402" width="400" height="8" fill="#000" />
          <rect x="300" y="436" width="400" height="12" fill="#000" />
        </mask>
        <filter id="mbGlow" x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width="1000" height="560" fill="url(#mbSky)" />
      {STARS.map((s, i) => (
        <circle
  key={i}
  cx={s.x}
  cy={s.y}
  r={s.r}
  fill="#dce4f5"
  opacity={s.o * 0.4}
/>
      ))}

      {/* Étoiles filantes */}
      {[0, 4.5].map((d) => (
        <g key={d} className="shooting" style={{ ["--delay" as string]: `${d}s` }}>
          <line x1={180 + d * 60} y1={50 + d * 8} x2={150 + d * 60} y2={40 + d * 8} stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </g>
      ))}
      {/* Nuages */}
      {[
        { y: 90, s: 1, d: 80, delay: -20 },
        { y: 150, s: 0.7, d: 110, delay: -70 },
      ].map((c, i) => (
        <g key={i} className="cloud" style={{ ["--d" as string]: `${c.d}s`, ["--delay" as string]: `${c.delay}s` }} opacity="0.08">
          <ellipse cx="0" cy={c.y} rx={round2(70 * c.s)} ry={round2(14 * c.s)} fill="#ff9fd0" />
          <ellipse cx={round2(30 * c.s)} cy={round2(c.y - 10 * c.s)} rx={round2(40 * c.s)} ry={round2(11 * c.s)} fill="#ffc8e6" />
        </g>
      ))}

      <circle
  cx="500"
  cy="330"
  r="150"
  fill="url(#mbSun)"
  mask="url(#mbStripes)"
  opacity="0.55"
/>

<circle
  cx="500"
  cy="330"
  r="160"
  fill="none"
  stroke="#d66b9b"
  strokeWidth="1"
  opacity="0.12"
/>

      {LEFT.map(([x, w, h], i) => (
        <Building key={`l${i}`} x={x} w={w} h={h} i={i} />
      ))}
      {RIGHT.map(([x, w, h], i) => (
        <Building key={`r${i}`} x={x} w={w} h={h} i={i + 10} />
      ))}
      <Palm x={96} />
      <Palm x={904} flip />

      {/* Un hors-bord traverse l'horizon */}
      <g className="boat">
        <path d={`M0 ${HORIZON - 4} L36 ${HORIZON - 4} L30 ${HORIZON + 4} L6 ${HORIZON + 4} Z`} fill="#0d0420" stroke="#ff4fa3" strokeWidth="1.2" />
        <path d={`M12 ${HORIZON - 4} L18 ${HORIZON - 12} L28 ${HORIZON - 12} L30 ${HORIZON - 4} Z`} fill="#0d0420" stroke="#22d3ee" strokeWidth="1.2" />
        <path d={`M-30 ${HORIZON + 2} L0 ${HORIZON - 1}`} stroke="#fff" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      </g>
      <rect
  x="0"
  y={HORIZON - 1}
  width="1000"
  height="2"
  fill="#cc6297"
  opacity="0.35"
  filter="url(#mbGlow)"
/>
      <rect x="0" y={HORIZON} width="1000" height="100" fill="url(#mbFloor)" />
      <g stroke="#7393ac" strokeWidth="0.8" opacity="0.16" fill="none">
        {[8, 20, 38, 62, 94].map((d) => (
          <path key={d} d={`M0 ${HORIZON + d} H1000`} />
        ))}
        {Array.from({ length: 15 }, (_, i) => i - 7).map((i) => (
          <path key={i} d={`M500 ${HORIZON} L${500 + i * 190} 560`} />
        ))}
      </g>
      {/* Mode fête (free spins) : projecteurs qui balayent la scène */}
      {party && (
        <g style={{ mixBlendMode: "screen" }} opacity="0.5">
          {[
            { x: 160, c: "#ff4fa3", delay: 0 },
            { x: 420, c: "#22d3ee", delay: -1.2 },
            { x: 580, c: "#ffd166", delay: -2.2 },
            { x: 840, c: "#a78bfa", delay: -0.6 },
          ].map((b, i) => (
            <polygon key={i} className="beam" style={{ ["--delay" as string]: `${b.delay}s` }} points={`${b.x - 14},560 ${b.x + 14},560 ${b.x + 90},60 ${b.x - 90},60`} fill={b.c} opacity="0.45" />
          ))}
        </g>
      )}
      {/* Lumière d'ambiance discrète */}
<rect
  width="1000"
  height="560"
  fill="url(#mbAmbient)"
/>

{/* Finition : bords assombris */}
<rect
  width="1000"
  height="560"
  fill="url(#mbVignette)"
/>
    </svg>
  );
}