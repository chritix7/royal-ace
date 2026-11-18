"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { ChipFace, TableChip } from "../ChipButton";
import { betName, colorOf, coverage, insideKey, payoutOf, type OutsideKey } from "../../lib/roulette";
import { ROULETTE_CHIPS, type RouletteGame } from "../../lib/useRoulette";

/**
 * The betting layout. Numbers sit on a 12 × 3 grid in "logical" units:
 * u runs along the table (0 → 12, one unit per column of three numbers),
 * v runs across it (0 → 3, from the 3-6-9 side to the 1-4-7 side).
 * Splits, corners, streets and six lines are hot spots on the lines
 * between numbers, exactly where a croupier would place the chip.
 * PC lays the table horizontally, phones vertically (u downwards).
 */
type Spot = { key: string; u: number; v: number };

const numAt = (c: number, r: number) => 3 * c + 3 - r;

function buildSpots(): Spot[] {
  const s: Spot[] = [];
  for (let c = 0; c < 12; c++) {
    for (let r = 0; r < 2; r++) s.push({ key: insideKey([numAt(c, r), numAt(c, r + 1)]), u: c + 0.5, v: r + 1 });
    if (c < 11) {
      for (let r = 0; r < 3; r++) s.push({ key: insideKey([numAt(c, r), numAt(c + 1, r)]), u: c + 1, v: r + 0.5 });
      for (let r = 0; r < 2; r++)
        s.push({ key: insideKey([numAt(c, r), numAt(c + 1, r), numAt(c, r + 1), numAt(c + 1, r + 1)]), u: c + 1, v: r + 1 });
      s.push({ key: insideKey([3 * c + 1, 3 * c + 2, 3 * c + 3, 3 * c + 4, 3 * c + 5, 3 * c + 6]), u: c + 1, v: 3 });
    }
    s.push({ key: insideKey([3 * c + 1, 3 * c + 2, 3 * c + 3]), u: c + 0.5, v: 3 });
  }
  // Zero: splits with 3, 2, 1, the two trios and the first four.
  for (let r = 0; r < 3; r++) s.push({ key: insideKey([0, numAt(0, r)]), u: 0, v: r + 0.5 });
  s.push({ key: insideKey([0, 2, 3]), u: 0, v: 1 });
  s.push({ key: insideKey([0, 1, 2]), u: 0, v: 2 });
  s.push({ key: insideKey([0, 1, 2, 3]), u: 0, v: 3 });
  return s;
}
const SPOTS = buildSpots();

/** Chips under the top one, biggest first (at most 4 more discs). */
function stackOf(amount: number) {
  const discs: number[] = [];
  let rest = amount;
  for (const v of [...ROULETTE_CHIPS].reverse()) {
    while (rest >= v && discs.length < 5) {
      discs.push(v);
      rest -= v;
    }
  }
  return discs.slice(0, -1);
}

export default function RouletteTable({
  g,
  vertical,
  onHover,
  extraHot,
}: {
  g: RouletteGame;
  vertical: boolean;
  /** The bet under the mouse (PC), for the info line. */
  onHover?: (key: string | null) => void;
  /** Numbers lit from outside (racetrack hover). */
  extraHot?: number[] | null;
}) {
  const { bets, phase, result, place } = g;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState({ w: 60, h: 60 });
  const [hover, setHover] = useState<string | null>(null);
  const locked = phase === "spinning";

  useLayoutEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const read = () => {
      // Layout size (not the on-screen one: the table may be tilted in 3D).
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      setCell(vertical ? { w: width / 3, h: height / 12 } : { w: width / 12, h: height / 3 });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vertical]);

  const base = Math.min(cell.w, cell.h);
  const chipPx = Math.max(18, Math.min(34, base * 0.62));
  const spotPx = Math.max(14, base * 0.4);

  const hot = useMemo(() => new Set(hover ? coverage(hover) : extraHot ?? []), [hover, extraHot]);
  // Lightning strikes of this round: number → multiplier.
  const lucky = useMemo(() => new Map((g.lucky ?? []).map((l) => [l.n, l.mult])), [g.lucky]);
  const winN = phase === "result" && result ? result.n : null;
  const winners = new Set(phase === "result" && result ? result.winners : []);

  /** Logical position → CSS (percent of the number area). */
  const at = (u: number, v: number): CSSProperties =>
    vertical ? { top: `${(u / 12) * 100}%`, left: `${((3 - v) / 3) * 100}%` } : { left: `${(u / 12) * 100}%`, top: `${(v / 3) * 100}%` };

  const halved = new Set(phase === "result" && result ? (result.halved ?? []) : []);
  const chipState = (key: string) =>
    phase !== "result" ? "" : winners.has(key) ? "rt-chip--win" : halved.has(key) ? "rt-chip--half" : "rt-chip--lose";
  const chip = (key: string, style?: CSSProperties) => {
    const amount = bets[key];
    if (!amount) return null;
    return (
      <span
        key={`c-${key}`}
        className={`rt-chip pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 ${chipState(key)}`}
        style={{ width: chipPx, height: chipPx, ...style }}
      >
        {(() => {
          const under = stackOf(amount);
          return under.map((v, i) => (
            <span key={i} className="rt-disc" style={{ transform: `translateY(${(under.length - i) * 11}%)` }}>
              <ChipFace value={v} label="" />
            </span>
          ));
        })()}
        <span className="rt-disc rt-disc--top">
          <TableChip amount={amount} />
        </span>
        {phase === "result" && winners.has(key) && <span className="rt-chip-pay">×{payoutOf(key)}</span>}
        {phase === "result" && halved.has(key) && <span className="rt-chip-pay">½</span>}
      </span>
    );
  };

  const hoverProps = (key: string) => ({
    onPointerEnter: (e: RPointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setHover(key);
      onHover?.(key);
    },
    onPointerLeave: () => {
      setHover((h) => (h === key ? null : h));
      onHover?.(null);
    },
  });

  const label = (key: string) => `${betName(key)} · pays ${payoutOf(key)} to 1${bets[key] ? ` · ◈ ${bets[key]} on it` : ""}`;

  const numberCell = (n: number, style: CSSProperties) => {
    const key = insideKey([n]);
    return (
      <button
        key={n}
        type="button"
        onClick={() => place(key)}
        disabled={locked}
        aria-label={label(key)}
        className={`rt-num rt-num--${colorOf(n)} ${hot.has(n) ? "is-hot" : ""} ${winN === n ? "is-win" : ""} ${lucky.has(n) ? "rt-lucky" : ""}`}
        style={style}
        {...hoverProps(key)}
      >
        <span className="rt-num__label">{n}</span>
        {winN === n && <span className="rt-dolly" aria-hidden="true" />}
      </button>
    );
  };

  const outsideCell = (key: OutsideKey, content: ReactNode, style: CSSProperties, extra = "") => (
    <button
      key={key}
      type="button"
      onClick={() => place(key)}
      disabled={locked}
      aria-label={label(key)}
      className={`rt-out relative ${extra} ${winN != null && coverage(key).includes(winN) ? "is-win" : ""}`}
      style={style}
      {...hoverProps(key)}
    >
      {content}
      {chip(key, { left: "50%", top: "50%" })}
    </button>
  );

  const diamond = (red: boolean) => (
    <svg aria-hidden="true" viewBox="0 0 40 22" className={`rt-diamond ${vertical ? "rotate-90" : ""}`}>
      <defs>
        <linearGradient id={red ? "rtdR" : "rtdB"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={red ? "#c8192b" : "#3a3b40"} />
          <stop offset="100%" stopColor={red ? "#7d0c14" : "#0b0b0d"} />
        </linearGradient>
      </defs>
      <polygon points="20,1 39,11 20,21 1,11" fill={`url(#${red ? "rtdR" : "rtdB"})`} stroke="#d7b45b" strokeOpacity="0.8" strokeWidth="1" />
    </svg>
  );
  const vText = (t: string) => <span className={vertical ? "rt-vtext" : ""}>{t}</span>;

  // Grid placement for both orientations.
  const H = !vertical;
  const zero = insideKey([0]);
  const gridStyle: CSSProperties = H
    ? {
        gridTemplateColumns: "minmax(0,0.95fr) repeat(12, minmax(0,1fr)) minmax(0,0.95fr)",
        gridTemplateRows: "repeat(3, var(--rt-row)) var(--rt-out) var(--rt-out)",
      }
    : {
        gridTemplateColumns: "minmax(0,0.62fr) minmax(0,0.78fr) repeat(3, minmax(0,1fr))",
        gridTemplateRows: "var(--rt-zero) repeat(12, minmax(0,1fr)) var(--rt-zero)",
      };

  const pos = (col: number, row: number, colSpan = 1, rowSpan = 1): CSSProperties => ({
    gridColumn: `${col} / span ${colSpan}`,
    gridRow: `${row} / span ${rowSpan}`,
  });

  const cells: ReactNode[] = [];
  for (let c = 0; c < 12; c++)
    for (let r = 0; r < 3; r++) {
      const n = numAt(c, r);
      cells.push(numberCell(n, H ? pos(c + 2, r + 1) : pos(3 + (2 - r), c + 2)));
    }

  const outsideOrder: { key: OutsideKey; node: ReactNode; extra?: string }[] = [
    { key: "low", node: vText("1–18") },
    { key: "even", node: vText("EVEN") },
    { key: "red", node: diamond(true) },
    { key: "black", node: diamond(false) },
    { key: "odd", node: vText("ODD") },
    { key: "high", node: vText("19–36") },
  ];
  const dozens: { key: OutsideKey; t: string }[] = [
    { key: "dz1", t: "1st 12" },
    { key: "dz2", t: "2nd 12" },
    { key: "dz3", t: "3rd 12" },
  ];
  // Columns: on the horizontal table the top row is the 3-6-9 column.
  const columns: OutsideKey[] = ["col3", "col2", "col1"];

  return (
    <div
      className={`roulette-felt relative grid h-full w-full select-none ${locked ? "is-locked" : ""} ${g.lightning ? "is-lightning" : ""}`}
      style={gridStyle}
      role="group"
      aria-label="Roulette betting table"
      onPointerLeave={() => {
        setHover(null);
        onHover?.(null);
      }}
    >
      {/* Zero */}
      <button
        type="button"
        onClick={() => place(zero)}
        disabled={locked}
        aria-label={label(zero)}
        className={`rt-num rt-num--green ${H ? "rt-zero" : "rt-zero-v"} relative ${hot.has(0) ? "is-hot" : ""} ${winN === 0 ? "is-win" : ""} ${lucky.has(0) ? "rt-lucky" : ""}`}
        style={H ? pos(1, 1, 1, 3) : pos(3, 1, 3, 1)}
        {...hoverProps(zero)}
      >
        <span className="rt-num__label">0</span>
        {winN === 0 && <span className="rt-dolly" aria-hidden="true" />}
        {chip(zero, { left: "50%", top: "50%" })}
        {lucky.has(0) && (
          <span className="rt-lucky-mark" style={{ left: "50%", top: "50%", width: "100%", height: "100%" }} aria-hidden="true">
            <span key={`b${g.spinId}`} className="rt-bolt" />
            <span className="rt-mult">{lucky.get(0)}×</span>
          </span>
        )}
      </button>

      {cells}

      {/* Columns 2 to 1 */}
      {columns.map((k, i) =>
        outsideCell(k, <span className={H ? "" : "rt-small"}>2:1</span>, H ? pos(14, i + 1) : pos(3 + (2 - i), 14), "rt-out--col"),
      )}

      {/* Dozens */}
      {dozens.map((d, i) => outsideCell(d.key, vText(d.t), H ? pos(2 + i * 4, 4, 4, 1) : pos(1, 2 + i * 4, 1, 4)))}

      {/* Even chances */}
      {outsideOrder.map((o, i) => outsideCell(o.key, o.node, H ? pos(2 + i * 2, 5, 2, 1) : pos(2, 2 + i * 2, 1, 2), o.extra))}

      {/* Inside bets on the lines + chips on the numbers */}
      <div
        ref={overlayRef}
        className="pointer-events-none relative z-10"
        style={H ? pos(2, 1, 12, 3) : pos(3, 2, 3, 12)}
      >
        {SPOTS.map((sp) => (
          <button
            key={sp.key}
            type="button"
            onClick={() => place(sp.key)}
            disabled={locked}
            aria-label={label(sp.key)}
            className={`rt-spot pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 ${hover === sp.key ? "is-hover" : ""}`}
            style={{ width: spotPx, height: spotPx, ...at(sp.u, sp.v) }}
            {...hoverProps(sp.key)}
          />
        ))}
        {Array.from({ length: 36 }, (_, i) => {
          const n = i + 1;
          const c = Math.floor((n - 1) / 3);
          const r = 3 - (n - 3 * c);
          return chip(insideKey([n]), at(c + 0.5, r + 0.5));
        })}
        {SPOTS.map((sp) => chip(sp.key, at(sp.u, sp.v)))}
        {/* Lightning strikes on top of the chips, so they stay visible */}
        {[...lucky.entries()]
          .filter(([n]) => n > 0)
          .map(([n, mult]) => {
            const c = Math.floor((n - 1) / 3);
            const r = 3 * c + 3 - n;
            return (
              <span
                key={`l-${n}`}
                className="rt-lucky-mark"
                style={{ ...at(c + 0.5, r + 0.5), width: cell.w, height: cell.h }}
                aria-hidden="true"
              >
                <span key={`b${g.spinId}`} className="rt-bolt" />
                <span className="rt-mult">{mult}×</span>
              </span>
            );
          })}
      </div>
    </div>
  );
}
