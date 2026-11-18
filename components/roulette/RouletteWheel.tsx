"use client";

import { memo, useEffect, useLayoutEffect, useRef } from "react";
import { WHEEL, colorOf } from "../../lib/roulette";
import { BALL_LAND_AT } from "../../lib/useRoulette";

const STEP = 360 / 37;
const C = 200; // SVG centre (viewBox 0 0 400 400)
// Radii in SVG units
const R_TRACK = 177; // ball rolling on the bowl track
const R_POCKET = 116; // ball resting in a pocket

const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
};
function sector(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = pt(r2, a1);
  const [x2, y2] = pt(r2, a2);
  const [x3, y3] = pt(r1, a2);
  const [x4, y4] = pt(r1, a1);
  return `M${x1} ${y1} A${r2} ${r2} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
}

/** Last spin animated by any wheel instance: a wheel mounted later (the
 *  phone overlay reopened) shows the ball at rest instead of replaying. */
let lastPlayedSpin = 0;

const POCKET_FILL = { red: "url(#rwRed)", black: "url(#rwBlack)", green: "url(#rwGreen)" } as const;

/** Static bowl: carbon rim, polished ball track, gold deflectors. */
const Bowl = memo(function Bowl() {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="rwCarbon" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#101113" />
          <rect width="4" height="4" fill="#191a1d" />
          <rect x="4" y="4" width="4" height="4" fill="#191a1d" />
        </pattern>
        <radialGradient id="rwTrack" cx="50%" cy="50%" r="50%">
          <stop offset="76%" stopColor="#0a0a0b" />
          <stop offset="86%" stopColor="#1d1e22" />
          <stop offset="92%" stopColor="#2b2c31" />
          <stop offset="100%" stopColor="#0d0d0f" />
        </radialGradient>
        <linearGradient id="rwGoldRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6e2a1" />
          <stop offset="45%" stopColor="#c9a24a" />
          <stop offset="100%" stopColor="#7a5c22" />
        </linearGradient>
      </defs>
      {/* Carbon outer rim */}
      <circle cx={C} cy={C} r="199" fill="url(#rwCarbon)" />
      <circle cx={C} cy={C} r="198" fill="none" stroke="url(#rwGoldRim)" strokeWidth="2.5" />
      <circle cx={C} cy={C} r="189" fill="none" stroke="#c9a24a" strokeOpacity="0.55" strokeWidth="1" />
      {/* Ball track */}
      <circle cx={C} cy={C} r="188" fill="url(#rwTrack)" />
      <circle cx={C} cy={C} r="160" fill="none" stroke="#c9a24a" strokeOpacity="0.35" strokeWidth="1" />
      {/* Track sheen */}
      <path d={`M ${pt(182, -60).join(" ")} A 182 182 0 0 1 ${pt(182, 40).join(" ")}`} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" strokeLinecap="round" />
      {/* Deflectors */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = 22.5 + i * 45;
        const [x, y] = pt(168, a);
        return (
          <rect
            key={i}
            x={x - 3.5}
            y={y - 7}
            width="7"
            height="14"
            rx="1.5"
            fill="url(#rwGoldRim)"
            stroke="#5c4418"
            strokeWidth="0.6"
            transform={`rotate(${a} ${x} ${y})`}
          />
        );
      })}
    </svg>
  );
});

/** The rotor: pockets, numbers, frets, cone and turret. */
const Rotor = memo(function Rotor() {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="rwRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b3141f" />
          <stop offset="100%" stopColor="#7d0c14" />
        </linearGradient>
        <linearGradient id="rwBlack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#202125" />
          <stop offset="100%" stopColor="#0b0b0d" />
        </linearGradient>
        <linearGradient id="rwGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#13734a" />
          <stop offset="100%" stopColor="#0a4129" />
        </linearGradient>
        <radialGradient id="rwCone" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#2a2b30" />
          <stop offset="70%" stopColor="#141518" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </radialGradient>
        <radialGradient id="rwKnob" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="45%" stopColor="#d7b45b" />
          <stop offset="100%" stopColor="#6e5320" />
        </radialGradient>
        <linearGradient id="rwArm" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7a5c22" />
          <stop offset="50%" stopColor="#f0d38b" />
          <stop offset="100%" stopColor="#7a5c22" />
        </linearGradient>
      </defs>
      {/* Number ring */}
      {WHEEL.map((n, i) => (
        <path key={`n${n}`} d={sector(128, 151, i * STEP - STEP / 2, i * STEP + STEP / 2)} fill={POCKET_FILL[colorOf(n)]} />
      ))}
      {/* Pockets (where the ball rests): a darker shade of the colour */}
      {WHEEL.map((n, i) => (
        <path
          key={`p${n}`}
          d={sector(103, 128, i * STEP - STEP / 2, i * STEP + STEP / 2)}
          fill={POCKET_FILL[colorOf(n)]}
          opacity="0.72"
        />
      ))}
      <circle cx={C} cy={C} r="128" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="3" />
      {/* Frets between pockets */}
      {WHEEL.map((_, i) => {
        const a = i * STEP + STEP / 2;
        const [x1, y1] = pt(103, a);
        const [x2, y2] = pt(151, a);
        return <line key={`f${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d7b45b" strokeOpacity="0.85" strokeWidth="1.3" />;
      })}
      <circle cx={C} cy={C} r="151" fill="none" stroke="#e5c779" strokeWidth="2" />
      <circle cx={C} cy={C} r="128" fill="none" stroke="#c9a24a" strokeOpacity="0.8" strokeWidth="1" />
      {/* Numbers */}
      {WHEEL.map((n, i) => {
        const a = i * STEP;
        const [x, y] = pt(139.5, a);
        return (
          <text
            key={`t${n}`}
            x={x}
            y={y}
            transform={`rotate(${a} ${x} ${y})`}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12.5"
            fontWeight="800"
            fontFamily="ui-sans-serif, system-ui"
            fill="#f7f3e8"
          >
            {n}
          </text>
        );
      })}
      {/* Cone */}
      <circle cx={C} cy={C} r="103" fill="url(#rwCone)" />
      <circle cx={C} cy={C} r="103" fill="none" stroke="#e5c779" strokeWidth="2" />
      <circle cx={C} cy={C} r="78" fill="none" stroke="#c9a24a" strokeOpacity="0.25" strokeWidth="1" />
      {/* Turret: four gold arms and a knob */}
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a} ${C} ${C})`}>
          <rect x={C - 4} y={C - 70} width="8" height="70" rx="4" fill="url(#rwArm)" />
          <circle cx={C} cy={C - 70} r="7" fill="url(#rwKnob)" />
        </g>
      ))}
      <circle cx={C} cy={C} r="22" fill="url(#rwKnob)" stroke="#5c4418" strokeWidth="1" />
      <circle cx={C} cy={C} r="9" fill="#fff6d6" opacity="0.55" />
    </svg>
  );
});

/**
 * European roulette wheel. The rotor turns clockwise while the ball runs
 * the other way around the track, drops through the deflectors and
 * settles into the drawn pocket — then rides it until the wheel stops.
 * Only transforms are animated (compositor), sized by `size`.
 */
export default function RouletteWheel({
  size,
  spinId,
  target,
  spinMs,
  onLanded,
  showResult,
  tilt = false,
}: {
  size: number | string;
  spinId: number;
  target: number | null;
  spinMs: number;
  onLanded: (id: number) => void;
  /** Number shown on the turret once the ball has landed. */
  showResult: number | null;
  /** PC: the wheel seen at an angle, with depth, turning slowly at rest. */
  tilt?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const radRef = useRef<HTMLDivElement>(null);
  const state = useRef({ rotor: 0, arm: 0, played: 0 });
  const anims = useRef<Animation[]>([]);
  const landedRef = useRef(onLanded);
  landedRef.current = onLanded;

  // Place the ball in the last pocket on mount (or at the top).
  useLayoutEffect(() => {
    const st = state.current;
    // Random resting angle, picked on the client (not during prerender).
    st.rotor = Math.random() * 360;
    if (target != null) st.arm = WHEEL.indexOf(target as (typeof WHEEL)[number]) * STEP;
    if (rotorRef.current) rotorRef.current.style.transform = `rotate(${st.rotor}deg)`;
    if (armRef.current) armRef.current.style.transform = `rotate(${st.arm}deg)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const st = state.current;
    if (!spinId || target == null || st.played === spinId || spinId <= lastPlayedSpin) return;
    st.played = spinId;
    lastPlayedSpin = spinId;
    const rotor = rotorRef.current;
    const arm = armRef.current;
    const rad = radRef.current;
    const root = rootRef.current;
    if (!rotor || !arm || !rad || !root) return;

    anims.current.forEach((a) => a.cancel());
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const D = reduced ? 600 : spinMs;
    const px = root.offsetWidth / 400; // SVG unit → px

    const quick = spinMs < 5000;
    const rotorFrom = st.rotor;
    const rotorTo = rotorFrom + (quick ? 300 : 560) + Math.random() * 40;
    const idx = WHEEL.indexOf(target as (typeof WHEEL)[number]);
    const armFrom = st.arm;
    const turns = quick ? 4 : 7;
    // Relative to the rotor the ball runs counter-clockwise and ends on the pocket.
    let armTo = idx * STEP;
    while (armTo > armFrom - turns * 360) armTo -= 360;
    st.rotor = rotorTo;
    st.arm = armTo;

    const land = BALL_LAND_AT;
    const rTrack = -R_TRACK * px;
    const rPocket = -R_POCKET * px;
    const bounce = (r: number) => `translateY(${r * px}px)`;

    const list = [
      rotor.animate(
        [{ transform: `rotate(${rotorFrom}deg)` }, { transform: `rotate(${rotorTo}deg)` }],
        { duration: D, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" },
      ),
      arm.animate(
        [
          { transform: `rotate(${armFrom}deg)`, offset: 0, easing: "cubic-bezier(0.1, 0.55, 0.32, 1)" },
          { transform: `rotate(${armTo}deg)`, offset: land },
          { transform: `rotate(${armTo}deg)`, offset: 1 },
        ],
        { duration: D, fill: "forwards" },
      ),
      rad.animate(
        [
          { transform: `translateY(${rTrack}px)`, offset: 0 },
          { transform: `translateY(${rTrack}px)`, offset: land * 0.62 },
          // Off the track, through the deflectors, a couple of hops.
          { transform: bounce(-150), offset: land * 0.74, easing: "ease-in" },
          { transform: bounce(-162), offset: land * 0.8, easing: "ease-out" },
          { transform: bounce(-124), offset: land * 0.88, easing: "ease-in" },
          { transform: bounce(-134), offset: land * 0.93, easing: "ease-out" },
          { transform: `translateY(${rPocket}px)`, offset: land, easing: "ease-in" },
          { transform: `translateY(${rPocket}px)`, offset: 1 },
        ],
        { duration: D, fill: "forwards" },
      ),
    ];
    anims.current = list;
    // The ball lands at a fixed point of the animation. On a busy phone the
    // animation can start a few frames after this effect, so the timer is
    // armed once it really runs: the result then shows exactly as the ball drops.
    let fired = false;
    let gone = false;
    let t = 0;
    const fire = () => {
      fired = true;
      landedRef.current(spinId);
    };
    list[1].ready.then(
      () => {
        if (gone) return;
        const ct = list[1].currentTime;
        const done = typeof ct === "number" ? ct : 0;
        t = window.setTimeout(fire, Math.max(0, D * land - done));
      },
      () => {},
    );
    return () => {
      gone = true;
      window.clearTimeout(t);
      // Unmounted mid-spin (dev double effects…): let the next mount replay it.
      if (!fired) {
        st.played = 0;
        st.rotor = rotorFrom;
        st.arm = armFrom;
        if (lastPlayedSpin === spinId) lastPlayedSpin = spinId - 1;
      }
    };
  }, [spinId, target, spinMs]);

  // Keep the ball at the pocket radius when the size changes.
  useEffect(() => {
    const root = rootRef.current;
    const rad = radRef.current;
    if (!root || !rad) return;
    const ro = new ResizeObserver(() => {
      const running = anims.current.some((a) => a.playState === "running");
      if (running) return;
      anims.current.forEach((a) => a.cancel());
      anims.current = [];
      const px = root.offsetWidth / 400;
      rad.style.transform = `translateY(${-R_POCKET * px}px)`;
      if (rotorRef.current) rotorRef.current.style.transform = `rotate(${state.current.rotor}deg)`;
      if (armRef.current) armRef.current.style.transform = `rotate(${state.current.arm}deg)`;
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  const color = showResult == null ? null : colorOf(showResult);
  return (
    <div
      ref={rootRef}
      className={`roulette-wheel relative aspect-square select-none ${tilt ? "is-3d" : ""}`}
      style={{ width: size }}
      role="img"
      aria-label={showResult == null ? "Roulette wheel" : `Roulette wheel — ${showResult} ${color}`}
    >
      <div className="rw-scene absolute inset-0">
        <div className="rw-tilt absolute inset-0">
          {tilt && (
            <div className="rw-body" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} style={{ transform: `translateZ(${-(i + 1) * 3.2}px)` }} />
              ))}
            </div>
          )}
          <Bowl />
          <div className={`absolute inset-0 ${tilt ? "rw-idle" : ""}`}>
            <div ref={rotorRef} className="absolute inset-0 will-change-transform">
              <Rotor />
              <div ref={armRef} className="absolute inset-0 will-change-transform">
                <div ref={radRef} className="absolute left-1/2 top-1/2 will-change-transform">
                  <span className="roulette-ball block" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Result medallion on the turret */}
      {showResult != null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            key={`${spinId}-${showResult}`}
            className={`roulette-result roulette-result--${color} flex aspect-square w-[22%] items-center justify-center rounded-full`}
          >
            <span className="font-display text-[clamp(14px,5.5cqw,40px)] font-bold leading-none text-white">{showResult}</span>
          </div>
        </div>
      )}
    </div>
  );
}
