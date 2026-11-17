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
      {/* Soft tile behind each symbol */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-[4px] hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.07),transparent_70%)] ring-1 ring-inset ring-white/[0.05] lg:block" />
      {win && <span aria-hidden="true" className="win-frame" />}
      {sym === "wild" && <span className={`${tag} ${skin.wildTag}`}>WILD</span>}
      {sym === "scatter" && <span className={`${tag} ${skin.scatterTag}`}>SCATTER</span>}
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
    <div className={`relative h-[calc(var(--cell)*4)] w-[var(--cell-w)] overflow-hidden border-r last:border-r-0 ${skin.divider} ${skin.reel}`}>
      <div className={!spinning && spinId > 0 ? "reel-land" : ""}>
        <div ref={stripEl} className={spinning ? "reel-moving" : ""} style={{ willChange: "transform" }}>
          {strip.map((sym, i) => (
            <SymbolCell key={i} sym={sym} skin={skin} win={!spinning && i < ROWS && !!cells?.[i]} dim={anyWin && !spinning && i < ROWS && !cells?.[i]} />
          ))}
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
      {anticipate && spinning && (
        <div className="pointer-events-none absolute inset-0 z-[8] animate-pulse ring-4 ring-inset ring-[#ffd166] shadow-[inset_0_0_34px_rgba(255,209,102,0.55)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ffd166]/0 via-[#ffd166]/15 to-[#ffd166]/0" />
        </div>
      )}
    </div>
  );
}

/**
 * Marquee of real bulbs following the rounded bezel. Two alternating
 * banks blink like a casino sign and a soft wave of light travels around
 * the frame; everything speeds up and warms on wins.
 */
function BulbRing({ color, mood }: { color: string; mood: "idle" | "win" | "jackpot" }) {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useIsoLayoutEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pad = 9;
  const rad = 15;
  const W = Math.max(0, box.w - pad * 2);
  const H = Math.max(0, box.h - pad * 2);
  const per = 2 * (W + H - 4 * rad) + 2 * Math.PI * rad;
  const n = Math.max(8, Math.round(per / 19));
  const len = n * 2; // pathLength: one bulb every 2 units
  const warm = mood === "jackpot" ? "#fff4d6" : "#ffd98a";
  const tone = mood === "jackpot" ? "#ff4d6d" : color;
  const blink = mood === "jackpot" ? "0.16s" : mood === "win" ? "0.32s" : "1.1s";
  const wave = mood === "jackpot" ? "1.2s" : mood === "win" ? "2.2s" : "6s";
  const rect = { x: pad, y: pad, width: W, height: H, rx: rad, fill: "none", pathLength: len } as const;
  return (
    <svg ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      {W > 0 && (
        <>
          {/* Sockets */}
          <rect {...rect} stroke="#000" strokeOpacity={0.7} strokeWidth={8.5} strokeLinecap="round" strokeDasharray="0.001 2" />
          {/* Travelling wave of light under the bulbs */}
          <rect
            {...rect}
            className="bulb-wave"
            stroke={warm}
            strokeOpacity={mood === "idle" ? 0.22 : 0.4}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${len * 0.16} ${len * 0.84}`}
            style={{ ["--to" as string]: `${-len}`, animationDuration: wave, filter: "blur(6px)" }}
          />
          {/* Bank A (warm gold) and bank B (theme colour) */}
          <g className="bulb-bank" style={{ animationDuration: blink }}>
            <rect {...rect} stroke={warm} strokeWidth={6} strokeLinecap="round" strokeDasharray="0.001 4" style={{ filter: `drop-shadow(0 0 4px ${warm})` }} />
            <rect {...rect} stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeDasharray="0.001 4" />
          </g>
          <g className="bulb-bank bulb-bank--b" style={{ animationDuration: blink }}>
            <rect {...rect} stroke={tone} strokeWidth={6} strokeLinecap="round" strokeDasharray="0.001 4" strokeDashoffset={-2} style={{ filter: `drop-shadow(0 0 4px ${tone})` }} />
            <rect {...rect} stroke="#fff" strokeOpacity={0.85} strokeWidth={2} strokeLinecap="round" strokeDasharray="0.001 4" strokeDashoffset={-2} />
          </g>
        </>
      )}
    </svg>
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
          : "[--cell:3.3rem] sm:[--cell:4.6rem] lg:[--cell:clamp(4.25rem,min(calc((100dvh_-_var(--slots-top,10rem)_-_228px)_/_4),calc((100vw_-_8rem_-_430px)_/_6.5)),10rem)]"
      } [--cell-w:var(--cell)] lg:[--cell-w:calc(var(--cell)*1.3)] ${shake ? `shake-${shake}` : ""}`}
    >

      <div
  className="cabinet-bezel relative rounded-[28px] p-3.5 sm:p-5 lg:rounded-[24px] lg:p-[18px]"
>
  {/* Marquee bulbs around the screen */}
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
    <BulbRing color={skin.lineColor} mood={mood} />
  </div>
  {/* Gold studs at the corners */}
  {["left-[5px] top-[5px]", "right-[5px] top-[5px]", "left-[5px] bottom-[5px]", "right-[5px] bottom-[5px]"].map((pos) => (
    <span key={pos} aria-hidden="true" className={`absolute ${pos} hidden h-2.5 w-2.5 rotate-45 border border-[#fff1bf]/70 lg:block`} style={{ background: "linear-gradient(135deg,#fff3c4,#b8873a 60%,#6b4f1d)", boxShadow: "0 0 6px rgba(240,211,139,0.5)" }} />
  ))}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-[5px] rounded-[23px] lg:hidden"
    style={{
      border: "1px solid rgba(244,114,182,0.28)",
      boxShadow:
        "0 0 5px rgba(236,72,153,0.10), inset 0 0 4px rgba(236,72,153,0.06)",
    }}
  />
  {["left-2 top-2", "right-2 top-2", "left-2 bottom-2", "right-2 bottom-2"].map((pos) => (
    <span
  key={pos}
  aria-hidden="true"
  className={`absolute ${pos} flex h-2.5 w-2.5 items-center justify-center rounded-full lg:hidden`}
  style={{
    background:
      "radial-gradient(circle at 35% 30%, #a1a1aa, #52525b 55%, #27272a)",
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.25)",
  }}
>
  <span className="h-px w-1.5 -rotate-45 bg-black/65" />
</span>
  ))}
        <div className="relative rounded-xl bg-black p-1 shadow-[inset_0_0_20px_#000] sm:p-1.5 lg:shadow-[0_0_0_1px_rgba(240,211,139,0.55),0_0_0_3px_#000,0_0_18px_rgba(0,0,0,0.8),inset_0_0_20px_#000]">
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