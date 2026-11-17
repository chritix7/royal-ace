"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PAYLINES, REELS, ROWS, STRIPS, type LineWin, type Sym } from "../lib/slots";
import type { Skin } from "../lib/skins";
import type { SlotsGame } from "../lib/useSlots";

const randomSym = (): Sym => {
  const strip = STRIPS[Math.floor(Math.random() * REELS)];
  return strip[Math.floor(Math.random() * strip.length)];
};

export function SymbolCell({ sym, skin, win, dim = false }: { sym: Sym; skin: Skin; win: boolean; dim?: boolean }) {
  const special = sym === "wild" ? skin.wildBg : sym === "scatter" ? skin.scatterBg : "";
  const isSpecial = sym === "wild" || sym === "scatter";
  const motion = win ? `anim-${sym}` : sym === "wild" ? "idle-wild" : sym === "scatter" ? "idle-scatter" : "";
  const tag = "absolute inset-x-0.5 bottom-0.5 rounded-[3px] bg-gradient-to-r py-px text-center text-[7px] font-black tracking-wider shadow sm:text-[10px]";
  return (
    <div
  className={`relative flex h-[var(--cell)] items-center justify-center transition-[opacity,filter] duration-300 ${dim ? "opacity-40 saturate-[0.4]" : ""} ${win ? "sym-win-pop" : ""} ${skin.art ? "border-b border-white/[0.05]" : ""} ${special} ${win ? skin.win : ""}`}
  role="img"
  aria-label={skin.names[sym]}
>
      {skin.art ? (
        <img
          src={skin.art[sym]}
          alt=""
          draggable={false}
          className={`select-none object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] ${motion} ${isSpecial ? "h-[68%] w-[68%] -translate-y-[7%]" : "h-[80%] w-[80%]"}`}
        />
      ) : (
        <span className={`inline-block text-[1.8rem] leading-none drop-shadow-sm sm:text-[2.5rem] lg:text-[calc(var(--cell)*0.55)] ${win ? `anim-${sym}` : ""}`}>{skin.emoji[sym]}</span>
      )}
      {(sym === "wild" || sym === "scatter") && !win && (
        <span aria-hidden="true" className="sym-halo" style={{ ["--halo-c" as string]: sym === "wild" ? "rgba(255,79,163,0.55)" : "rgba(34,211,238,0.55)" }} />
      )}
      {/* Soft tile behind each symbol */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-[3px] rounded-lg bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.07),transparent_70%)] ring-1 ring-inset ring-white/[0.05] lg:inset-[4px] lg:rounded-xl" />
      {win && <span aria-hidden="true" className="win-frame" />}
      {sym === "wild" && <span className={`${tag} ${skin.wildTag}`}>WILD</span>}
      {sym === "scatter" && <span className={`${tag} ${skin.scatterTag}`}>SCATTER</span>}
    </div>
  );
}

/**
 * Symbol that only flashes past while a reel travels: just the picture,
 * no tile, halo, tags or labels. Keeps the spin start light on phones
 * (a reel strip holds dozens of these).
 */
function FillerCell({ sym, skin }: { sym: Sym; skin: Skin }) {
  return (
    <div className="flex h-[var(--cell)] items-center justify-center" aria-hidden="true">
      {skin.art ? (
        <img src={skin.art[sym]} alt="" draggable={false} decoding="async" className="h-[74%] w-[74%] select-none object-contain" />
      ) : (
        <span className="inline-block text-[1.8rem] leading-none sm:text-[2.5rem] lg:text-[calc(var(--cell)*0.55)]">{skin.emoji[sym]}</span>
      )}
    </div>
  );
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const MS_PER_CELL = 45;
const LAND_CELLS = 8;

export function Reel({
  spinId, prev, target, stopAt, landMs, spinning, anticipate, cells, skin, held = false, full = false, expanding = false, anyWin = false,
}: {
  spinId: number; prev: Sym[]; target: Sym[]; stopAt: number; landMs: number;
  spinning: boolean; anticipate: boolean; cells: boolean[]; skin: Skin;
  held?: boolean;
  full?: boolean;
  expanding?: boolean;
  anyWin?: boolean;
}) {
  const [strip, setStrip] = useState<Sym[]>(prev);
  const stripEl = useRef<HTMLDivElement>(null);
  const job = useRef<{ total: number; land: number } | null>(null);

  useIsoLayoutEffect(() => {
    if (spinId === 0 || held) return;
    const total = Math.max(600, stopAt);
    const land = Math.min(landMs, total * 0.6);
    const filler = Math.max(LAND_CELLS, Math.round((total - land) / MS_PER_CELL) + LAND_CELLS - ROWS);
    job.current = { total, land };
    setStrip([...target, ...Array.from({ length: filler }, randomSym), ...prev]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  useIsoLayoutEffect(() => {
    const j = job.current;
    const el = stripEl.current;
    if (!j || !el || typeof el.animate !== "function") return;
    job.current = null;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cell = el.offsetHeight / strip.length;
    const travel = (strip.length - ROWS) * cell;
    const anim = el.animate(
      [
        { transform: `translateY(-${travel}px)`, offset: 0, easing: "linear" },
        { transform: `translateY(-${LAND_CELLS * cell}px)`, offset: (j.total - j.land) / j.total, easing: "cubic-bezier(0.3,0.6,0.3,1)" },
        { transform: "translateY(0px)", offset: 1 },
      ],
      { duration: reduced ? 250 : j.total, fill: "both" }
    );
    return () => anim.cancel();
  }, [strip]);

  return (
    <div className={`reel-layer relative h-[calc(var(--cell)*4)] w-[var(--cell-w)] overflow-hidden border-r last:border-r-0 ${skin.divider} ${skin.reel}`}>
      <div className={!spinning && spinId > 0 ? "reel-land" : ""}>
        <div ref={stripEl} className={spinning ? "reel-moving" : ""} style={{ willChange: "transform" }}>
          {strip.map((sym, i) =>
            i >= ROWS && i < strip.length - ROWS ? (
              <FillerCell key={i} sym={sym} skin={skin} />
            ) : (
              <SymbolCell key={i} sym={sym} skin={skin} win={!spinning && i < ROWS && !!cells?.[i]} dim={anyWin && !spinning && i < ROWS && !cells?.[i]} />
            ),
          )}
        </div>
      </div>
      {full && !spinning && (
        <div className={`absolute inset-0 z-[5] ${skin.reel} ${expanding ? "wild-expand" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <SymbolCell key={i} sym="wild" skin={skin} win={!!cells?.[i]} />
          ))}
        </div>
      )}
      {/* Éclairage latéral : léger volume sur chaque rouleau */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 z-[6]"
  style={{
    background:
      "linear-gradient(90deg, rgba(0,0,0,0.20) 0%, rgba(255,255,255,0.025) 35%, transparent 65%, rgba(0,0,0,0.24) 100%)",
  }}
/>

{/* Ombres aux extrémités du rouleau */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-x-0 top-0 z-[7] h-[16%]"
  style={{
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.16) 45%, transparent)",
  }}
/>

<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-x-0 bottom-0 z-[7] h-[16%]"
  style={{
    background:
      "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.16) 45%, transparent)",
  }}
/>
      {/* Motion-blur look while travelling (off during the landing bounce) */}
      <div aria-hidden="true" className={`reel-speed ${spinning && !anticipate ? "is-on" : ""}`} />
      {anticipate && spinning && (
        <div className="pointer-events-none absolute inset-0 z-[8] animate-pulse ring-4 ring-inset ring-[#ffd166] shadow-[inset_0_0_34px_rgba(255,209,102,0.55)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ffd166]/0 via-[#ffd166]/15 to-[#ffd166]/0" />
        </div>
      )}
    </div>
  );
}

/**
 * Orbit around the reel screen: gold diamonds and theme-coloured stars
 * glide smoothly along an engraved rail (offset-path + Web Animations,
 * compositor-driven), with a soft light trail. Speed eases up on wins
 * and in free spins without restarting the motion.
 */
function OrbitRing({ color, mood }: { color: string; mood: "idle" | "win" | "jackpot" }) {
  const host = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useIsoLayoutEffect(() => {
    const el = host.current?.parentElement;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = 9;
  const r = 15;
  const W = Math.max(0, box.w - pad * 2);
  const H = Math.max(0, box.h - pad * 2);
  const x = pad, y = pad, cx = pad + W / 2;
  const d =
    W > 0
      ? `M ${cx} ${y} H ${x + W - r} A ${r} ${r} 0 0 1 ${x + W} ${y + r} V ${y + H - r} A ${r} ${r} 0 0 1 ${x + W - r} ${y + H} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + H - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`
      : "";
  const per = 2 * (W + H - 4 * r) + 2 * Math.PI * r;
  const n = W > 0 ? Math.max(12, Math.round(per / 40)) : 0;
  const LAP = 26000; // ms per lap at idle speed
  const rate = mood === "jackpot" ? 6 : mood === "win" ? 2.6 : 1;

  // Start one infinite animation per jewel, phase-shifted along the rail.
  const anims = useRef<Animation[]>([]);
  useEffect(() => {
    const root = host.current;
    if (!root || !d) return;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(root.querySelectorAll("[data-orbit]")) as HTMLElement[];
    const list: Animation[] = [];
    items.forEach((el, i) => {
      if (typeof el.animate !== "function") return;
      const a = el.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], {
        duration: LAP,
        iterations: Infinity,
        delay: -(i / items.length) * LAP,
        easing: "linear",
      });
      if (reduced) a.pause();
      list.push(a);
    });
    (Array.from(root.querySelectorAll("[data-trail]")) as SVGPathElement[]).forEach((trail) => {
      if (typeof trail.animate !== "function") return;
      const a = trail.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -100 }], { duration: LAP / 2.2, iterations: Infinity, easing: "linear" });
      if (reduced) a.pause();
      list.push(a);
    });
    anims.current = list;
    return () => list.forEach((a) => a.cancel());
  }, [d, n]);
  // Change speed smoothly when the mood changes.
  useEffect(() => {
    anims.current.forEach((a) => {
      if (typeof a.updatePlaybackRate === "function") a.updatePlaybackRate(rate);
      else a.playbackRate = rate;
    });
  }, [rate, d, n]);

  const hot = mood === "jackpot" ? "#ff4d6d" : color;
  return (
    <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {d && (
        <>
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            {/* Engraved rail */}
            <path d={d} fill="none" stroke="#000" strokeOpacity={0.75} strokeWidth={9} />
            <path d={d} fill="none" stroke="#d7b45b" strokeOpacity={0.35} strokeWidth={1} />
            {/* Light trail sweeping with the jewels */}
            {/* Stacked strokes fake a soft glow without a per-frame blur */}
            <g data-trail-group>
              {[
                [12, 0.1],
                [7, 0.16],
                [3, 0.35],
              ].map(([w, o]) => (
                <path
                  key={w}
                  data-trail
                  d={d}
                  fill="none"
                  pathLength={100}
                  stroke={mood === "idle" ? "#ffd98a" : hot}
                  strokeOpacity={mood === "idle" ? o : Math.min(1, o * 1.7)}
                  strokeWidth={w}
                  strokeLinecap="round"
                  strokeDasharray="14 36"
                />
              ))}
            </g>
          </svg>
          {Array.from({ length: n }, (_, i) => {
            const star = i % 5 === 0;
            return (
              <span
                key={i}
                data-orbit
                className={star ? "orbit-star" : "orbit-gem"}
                style={{ offsetPath: `path('${d}')`, offsetRotate: "0deg", ["--hot" as string]: hot }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export default function SlotReels({
  s, skin, activeLine, shake = 0, large = false, mood = "idle",
}: {
  s: SlotsGame["s"]; skin: Skin; activeLine: LineWin | null; fast: boolean; shake?: 0 | 1 | 2 | 3; onPull: () => void; canPull: boolean; large?: boolean; mood?: "idle" | "win" | "jackpot";
}) {

  const [cycle, setCycle] = useState(0);

useEffect(() => {
  if (s.lineWins.length <= 1) {
    setCycle(0);
    return;
  }
  const id = setInterval(() => setCycle((c) => c + 1), 450);
  return () => clearInterval(id);
}, [s.lineWins]);

const shownLine =
  s.lineWins.length > 1
    ? s.lineWins[cycle % s.lineWins.length]
    : activeLine;

  return (
    <div
      className={`mx-auto flex w-fit items-stretch gap-1.5 sm:gap-3 ${
        large
          ? "[--cell:4.2rem] sm:[--cell:5rem] lg:[--cell:5.2rem]"
          : "[--cell:min(calc(var(--cell-w)*1.12),max(40px,calc((100dvh_-_var(--slots-top-m,9.75rem)_-_366px)_/_4)))] lg:[--cell:clamp(4.25rem,min(calc((100dvh_-_var(--slots-top,10rem)_-_228px)_/_4),calc((100vw_-_8rem_-_430px)_/_6.5)),10rem)]"
      } [--cell-w:calc((100vw_-_100px)_/_5)] sm:[--cell-w:min(6.5rem,calc((100vw_-_160px)_/_5))] lg:[--cell-w:calc(var(--cell)*1.3)] ${shake ? `shake-${shake}` : ""}`}
    >

      <div
  className="cabinet-bezel relative rounded-[20px] p-4 lg:rounded-[24px] lg:p-[18px]"
>
  {/* Marquee bulbs around the screen */}
  <div aria-hidden="true" className="pointer-events-none absolute inset-0">
    <OrbitRing color={skin.lineColor} mood={mood} />
  </div>
  {/* Gold studs at the corners */}
  {["left-[5px] top-[5px]", "right-[5px] top-[5px]", "left-[5px] bottom-[5px]", "right-[5px] bottom-[5px]"].map((pos) => (
    <span key={pos} aria-hidden="true" className={`absolute ${pos} block h-2.5 w-2.5 rotate-45 border border-[#fff1bf]/70`} style={{ background: "linear-gradient(135deg,#fff3c4,#b8873a 60%,#6b4f1d)", boxShadow: "0 0 6px rgba(240,211,139,0.5)" }} />
  ))}
        <div className="relative rounded-xl bg-black p-1 shadow-[0_0_0_1px_rgba(240,211,139,0.55),0_0_0_3px_#000,0_0_18px_rgba(0,0,0,0.8),inset_0_0_20px_#000] lg:p-1.5">
          <div className="relative flex overflow-hidden rounded-lg">
            {Array.from({ length: REELS }, (_, k) => (
              <Reel
                key={k}
                spinId={s.spinId}
                prev={s.grid[k]}
                target={s.target[k]}
                stopAt={s.stopAt[k]}
                landMs={s.landMs}
                spinning={s.spinning[k]}
                anticipate={s.anticipate[k]}
                cells={s.cells[k]}
                skin={skin}
                held={s.held[k]}
                full={s.grid[k].every((x) => x === "wild")}
                expanding={s.expanding.includes(k)}
                anyWin={s.cells.some((col) => col.some(Boolean))}
              />
            ))}
            {shownLine && (
              <svg
                className="pointer-events-none absolute inset-0 z-10 h-full w-full"
                viewBox={`0 0 ${REELS} ${ROWS}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  key={`${shownLine.line}-${s.spinId}`}
                  className="line-draw"
                  pathLength={1}
                  points={PAYLINES[shownLine.line - 1].map((row, reel) => `${reel + 0.5},${row + 0.5}`).join(" ")}
                  fill="none"
                  stroke={skin.lineColor}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                  style={{ filter: `drop-shadow(0 0 5px ${skin.lineColor})` }}
                />
              </svg>
            )}
            {/* Vitre : reflet doux et profondeur du bord intérieur */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 z-20 rounded-lg"
  style={{
    background:
      "linear-gradient(125deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 24%, transparent 42%, transparent 78%, rgba(255,255,255,0.015) 100%)",
    boxShadow:
      "inset 0 2px 2px rgba(255,255,255,0.10), inset 0 0 14px rgba(0,0,0,0.48), inset 0 -2px 4px rgba(0,0,0,0.35)",
  }}
/>
<div aria-hidden="true" className="glass-sweep pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-lg" />
                  </div>
      </div>

    </div>

    </div>
  );
}