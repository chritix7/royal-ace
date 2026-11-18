"use client";

import { useMemo, useState } from "react";
import { ANNOUNCES, WHEEL, announceNumbers, colorOf, neighbours, type AnnounceKey } from "../../lib/roulette";

/**
 * The racetrack: the 37 numbers in wheel order around a stadium, with the
 * French announced bets in the middle. A number plays it with its
 * neighbours on the wheel; a zone plays the announce.
 */
const W = 640;
const H = 168;
const R = H / 2; // end radius (outer)
const T = 42; // track thickness
const L = W - 2 * R; // straight length
const RM = R - T / 2; // mid-line radius
const P = 2 * L + 2 * Math.PI * RM; // mid-line perimeter
const C = P / 37; // one cell along the mid-line

/** Point on a stadium of radius r (same centres), at mid-line distance s. */
function at(s: number, r: number): [number, number] {
  s = ((s % P) + P) % P;
  const top = R - RM; // y of the mid-line at the top straight
  if (s < L) return [R + s * 1, R - r]; // top straight, left → right
  s -= L;
  const arc = Math.PI * RM;
  if (s < arc) {
    const a = -Math.PI / 2 + (s / arc) * Math.PI; // right end, top → bottom
    return [R + L + r * Math.cos(a), R + r * Math.sin(a)];
  }
  s -= arc;
  if (s < L) return [R + L - s, R + r]; // bottom straight, right → left
  s -= L;
  const a = Math.PI / 2 + (s / arc) * Math.PI; // left end, bottom → top
  void top;
  return [R + r * Math.cos(a), R + r * Math.sin(a)];
}

function cellPath(s0: number, s1: number) {
  const steps = 6;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = s0 + ((s1 - s0) * i) / steps;
    outer.push(at(s, R).map((v) => v.toFixed(1)).join(" "));
    inner.unshift(at(s, R - T).map((v) => v.toFixed(1)).join(" "));
  }
  return `M${outer.join(" L")} L${inner.join(" L")} Z`;
}

// Zero sits at the middle of the right end.
const OFFSET = L + (Math.PI * RM) / 2 - C / 2;

const ZONES: { key: AnnounceKey; x0: number; x1: number }[] = [
  { key: "tiers", x0: T, x1: 0.36 * W },
  { key: "orphelins", x0: 0.36 * W, x1: 0.58 * W },
  { key: "voisins", x0: 0.58 * W, x1: 0.84 * W },
  { key: "zero", x0: 0.84 * W, x1: W - T },
];

export default function RouletteRacetrack({
  onNumber,
  onAnnounce,
  onHover,
  disabled,
  span,
  setSpan,
  winning,
}: {
  onNumber: (n: number) => void;
  onAnnounce: (a: AnnounceKey) => void;
  /** Numbers the hovered target would cover (to light the table too). */
  onHover: (nums: number[] | null, label: string | null) => void;
  disabled: boolean;
  /** Neighbours on each side. */
  span: number;
  setSpan: (n: number) => void;
  winning: number | null;
}) {
  const [hot, setHot] = useState<number[]>([]);
  const cells = useMemo(
    () =>
      WHEEL.map((n, i) => {
        const s0 = OFFSET + i * C;
        const [tx, ty] = at(s0 + C / 2, R - T / 2);
        return { n, d: cellPath(s0, s0 + C), tx, ty };
      }),
    [],
  );
  const hover = (nums: number[] | null, label: string | null) => {
    setHot(nums ?? []);
    onHover(nums, label);
  };
  const innerClip = `M${R} ${T} H${R + L} A${R - T} ${R - T} 0 0 1 ${R + L} ${H - T} H${R} A${R - T} ${R - T} 0 0 1 ${R} ${T} Z`;

  return (
    <div className={`rl-racetrack flex h-full flex-col ${disabled ? "is-locked" : ""}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block min-h-0 w-full flex-1" role="group" aria-label="Racetrack" onMouseLeave={() => hover(null, null)}>
        <defs>
          <clipPath id="rtInner">
            <path d={innerClip} />
          </clipPath>
        </defs>
        {/* Announce zones */}
        <g clipPath="url(#rtInner)">
          {ZONES.map((z) => (
            <g key={z.key}>
              <rect
                x={z.x0}
                y={0}
                width={z.x1 - z.x0}
                height={H}
                className={`rl-rt-zone ${hot.length && announceNumbers(z.key).every((n) => hot.includes(n)) && hot.length === announceNumbers(z.key).length ? "is-hot" : ""}`}
                onClick={() => !disabled && onAnnounce(z.key)}
                onMouseEnter={() => hover(announceNumbers(z.key), `${ANNOUNCES[z.key].label} · ${ANNOUNCES[z.key].units.reduce((a, [, u]) => a + u, 0)} chips`)}
              >
                <title>{ANNOUNCES[z.key].label}</title>
              </rect>
              <text x={(z.x0 + z.x1) / 2} y={H / 2} className="rl-rt-zone-label" textAnchor="middle" dominantBaseline="central">
                {ANNOUNCES[z.key].short}
              </text>
            </g>
          ))}
          {ZONES.slice(1).map((z) => (
            <line key={z.key} x1={z.x0} x2={z.x0} y1={0} y2={H} className="rl-rt-divider" />
          ))}
        </g>
        <path d={innerClip} className="rl-rt-inner-edge" />
        {/* Numbers */}
        {cells.map((c) => (
          <g
            key={c.n}
            className={`rl-rt-cell rl-rt-cell--${colorOf(c.n)} ${hot.includes(c.n) ? "is-hot" : ""} ${winning === c.n ? "is-win" : ""}`}
            onClick={() => !disabled && onNumber(c.n)}
            onMouseEnter={() => hover(neighbours(c.n, span), span ? `${c.n} and ${span} neighbour${span > 1 ? "s" : ""} each side · ${span * 2 + 1} chips` : `${c.n} straight up`)}
          >
            <path d={c.d} />
            <text x={c.tx} y={c.ty} textAnchor="middle" dominantBaseline="central">
              {c.n}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex shrink-0 items-center justify-between gap-2">
        <p className="hidden text-[9.5px] tracking-[0.14em] text-white/40 2xl:block">NUMBER = NEIGHBOURS · ZONE = ANNOUNCE</p>
        <div className="flex items-center gap-1.5" role="group" aria-label="Neighbours each side">
          <span className="rl-eyebrow !text-[9px]">
            <span className="hidden xl:inline">Neighbours</span>
            <span className="xl:hidden">Each side</span>
          </span>
          {[0, 1, 2, 3, 4].map((k) => (
            <button key={k} type="button" onClick={() => setSpan(k)} aria-pressed={span === k} className={`rl-mini-key ${span === k ? "is-on" : ""}`}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
