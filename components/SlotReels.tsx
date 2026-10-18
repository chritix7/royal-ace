"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { PAYLINES, REELS, ROWS, STRIPS, type LineWin, type Sym } from "../lib/slots";
import type { Skin } from "../lib/skins";
import type { SlotsGame } from "../lib/useSlots";
import Lever from "./Lever";

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
      className={`relative flex h-[var(--cell)] items-center justify-center ${skin.art ? "border-b border-white/[0.05]" : ""} ${special} ${win ? skin.win : ""}`}
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
        <span className={`inline-block text-[1.8rem] leading-none drop-shadow-sm sm:text-[2.5rem] lg:text-5xl ${win ? `anim-${sym}` : ""}`}>{skin.emoji[sym]}</span>
      )}
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
    <div className={`relative h-[calc(var(--cell)*4)] w-[var(--cell)] overflow-hidden border-r last:border-r-0 ${skin.divider} ${skin.reel}`}>
      <div className={!spinning && spinId > 0 ? "reel-land" : ""}>
        <div ref={stripEl}>
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/40 to-transparent" />
      {anticipate && spinning && (
        <div className="pointer-events-none absolute inset-0 animate-pulse ring-4 ring-inset ring-[#22d3ee]/80" />
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

function LineTabs({ from, to, winLines, active }: { from: number; to: number; winLines: Set<number>; active: number | null }) {
  const nums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <div className="hidden flex-col justify-between py-5 sm:flex" aria-hidden="true">
      {nums.map((n) => (
        <span
          key={n}
          className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-black transition ${
            active === n ? "scale-125 bg-white text-black" : winLines.has(n) ? "bg-[#facc15] text-black" : "bg-white/10 text-white/45"
          }`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export default function SlotReels({
  s, skin, activeLine, fast, shake = 0, onPull, canPull, large = false, mood = "idle",
}: {
  s: SlotsGame["s"]; skin: Skin; activeLine: LineWin | null; fast: boolean; shake?: 0 | 1 | 2 | 3; onPull: () => void; canPull: boolean; large?: boolean; mood?: "idle" | "win" | "jackpot";
}) {
  const winLines = new Set(s.lineWins.map((w) => w.line));

  return (
    <div className={`mx-auto flex w-fit items-stretch gap-1.5 sm:gap-3 ${shake ? `shake-${shake}` : ""}`}>
      <LineTabs from={1} to={10} winLines={winLines} active={activeLine?.line ?? null} />

      <div className={`relative rounded-[28px] p-3.5 ring-1 ring-white/10 shadow-[0_18px_50px_rgba(0,0,0,.65),inset_0_1px_0_rgba(255,255,255,.12)] sm:p-5 ${skin.bezel}`}>
  {["left-2 top-2", "right-2 top-2", "left-2 bottom-2", "right-2 bottom-2"].map((pos) => (
    <span
      key={pos}
      className={`absolute ${pos} h-2.5 w-2.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#e5e7eb,#6b7280_60%,#374151)] shadow-inner`}
    />
  ))}
  <Bulbs color={skin.bulb} fast={fast} mood={mood} />
        <div className={`relative rounded-xl bg-black p-1 shadow-[inset_0_0_20px_#000] sm:p-1.5 ${large ? "[--cell:4.2rem] sm:[--cell:5rem] lg:[--cell:5.2rem]" : "[--cell:3.3rem] sm:[--cell:4.6rem] lg:[--cell:5.2rem]"}`}>
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
            {activeLine && (
              <svg
                className="pointer-events-none absolute inset-0 z-10 h-full w-full"
                viewBox={`0 0 ${REELS} ${ROWS}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  points={PAYLINES[activeLine.line - 1].map((row, reel) => `${reel + 0.5},${row + 0.5}`).join(" ")}
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
                  </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-br from-white/10 via-transparent to-transparent" />
    </div>

      <LineTabs from={11} to={20} winLines={winLines} active={activeLine?.line ?? null} />
      <Lever spinId={s.spinId} onPull={onPull} disabled={!canPull} />
    </div>
  );
}