"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { PAYLINES, REELS, ROWS, STRIPS, type LineWin, type Sym } from "../lib/slots";
import type { Skin } from "../lib/skins";
import type { SlotsGame } from "../lib/useSlots";

const randomSym = (): Sym => {
  const strip = STRIPS[Math.floor(Math.random() * REELS)];
  return strip[Math.floor(Math.random() * strip.length)];
};

export function SymbolCell({ sym, skin, win }: { sym: Sym; skin: Skin; win: boolean }) {
  const special = sym === "wild" ? skin.wildBg : sym === "scatter" ? skin.scatterBg : "";
  const isSpecial = sym === "wild" || sym === "scatter";
  const motion = win ? `anim-${sym}` : sym === "wild" ? "idle-wild" : sym === "scatter" ? "idle-scatter" : "";
  const tag = "absolute inset-x-0.5 bottom-0.5 rounded-[3px] bg-gradient-to-r py-px text-center text-[7px] font-black tracking-wider shadow sm:text-[10px]";
  return (
    <div
  className={`relative flex h-[var(--cell)] items-center justify-center ${win ? "sym-win-pop" : ""} ${skin.art ? "border-b border-white/[0.05]" : ""} ${special} ${win ? skin.win : ""}`}
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
  spinId, prev, target, stopAt, landMs, spinning, anticipate, cells, skin, held = false, full = false, expanding = false,
}: {
  spinId: number; prev: Sym[]; target: Sym[]; stopAt: number; landMs: number;
  spinning: boolean; anticipate: boolean; cells: boolean[]; skin: Skin;
  held?: boolean;
  full?: boolean;
  expanding?: boolean;
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
            <SymbolCell key={i} sym={sym} skin={skin} win={!spinning && i < ROWS && !!cells?.[i]} />
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

function Bulbs({ color, fast, mood = "idle" }: { color: string; fast: boolean; mood?: "idle" | "win" | "jackpot" }) {
  const led = mood === "jackpot" ? "#ff4d4d" : mood === "win" ? "#ffd166" : color;
  const anim = mood === "jackpot" ? "animate-[pulse_0.5s_ease-in-out_infinite]" : mood === "win" ? "animate-pulse" : "";
  const style = { "--bulb": led } as CSSProperties;
  const strips = [
    { pos: "inset-x-5 top-1 h-2", v: false },
    { pos: "inset-x-5 bottom-1 h-2", v: false },
    { pos: "inset-y-5 left-1 w-2", v: true },
    { pos: "inset-y-5 right-1 w-2", v: true },
  ];
  return (
    <>
      {strips.flatMap((st, i) =>
        [false, true].map((alt) => (
          <div
            key={`${i}-${alt}`}
            aria-hidden="true"
            style={style}
            className={`pointer-events-none absolute ${st.pos} ${st.v ? "bulbs-v" : "bulbs"}${alt ? " alt" : ""}${fast ? " bulbs-fast" : ""} ${anim}`}
          />
        ))
      )}
    </>
  );
}

export default function SlotReels({
  s, skin, activeLine, fast, shake = 0, large = false, mood = "idle",
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
  className="relative rounded-[28px] p-3.5 sm:p-5 lg:rounded-[22px] lg:p-3.5"
  style={{
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.07), transparent 35%, rgba(0,0,0,0.30) 75%), linear-gradient(180deg, #42444c 0%, #25262e 12%, #16171e 48%, #292a33 88%, #454650 100%)",
    boxShadow:
      "0 18px 36px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 rgba(0,0,0,0.70), inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.50)",
  }}
>
  {/* Marquee bulbs around the screen: idle chase, faster on wins */}
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
    <Bulbs color={skin.lineColor} fast={fast} mood={mood} />
  </div>
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
  className={`absolute ${pos} flex h-2.5 w-2.5 items-center justify-center rounded-full`}
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
        <div className="relative rounded-xl bg-black p-1 shadow-[inset_0_0_20px_#000] sm:p-1.5">
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
                  </div>
      </div>

    </div>

    </div>
  );
}