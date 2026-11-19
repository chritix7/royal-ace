"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChipFace, TableChip } from "./ChipButton";
import { Counter } from "./ui";
import { money } from "../lib/game";
import { BOX, EDGES, HARD_PAYS, LIMITS, PROP_LIMITS, TABLE_MAX, MIN_BET, PLACE_PAYS, PROPS, betName, kindOf, numOf, type BoxNum } from "../lib/craps";
import { CRAPS_CHIPS, useCraps, type CrapsGame, type RollRecord } from "../lib/useCraps";
import { exitFullscreenSettled, isNarrowScreen, requestFullscreenSettled, whenViewportStable } from "../lib/fullscreen";
import { useSession } from "../lib/sessionStore";

function useDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}
function compactMoney(v: number) {
  if (v < 10000) return money(v);
  if (v < 1000000) return `${Math.round(v / 100) / 10}K`.replace(".0K", "K");
  return `${Math.round(v / 100000) / 10}M`.replace(".0M", "M");
}
const Kbd = ({ k }: { k: string }) => <kbd className="rl-kbd hidden 2xl:inline-flex">{k}</kbd>;
const BOX_LABEL: Record<BoxNum, string> = { 4: "4", 5: "5", 6: "SIX", 8: "8", 9: "NINE", 10: "10" };

/* ───────────── Dice ───────────── */

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
// Which rotation brings each value to the front.
const FACE_ROT: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 2: [90, 0] };
const FACES: { v: number; t: string }[] = [
  { v: 1, t: "translateZ(var(--h))" },
  { v: 6, t: "rotateY(180deg) translateZ(var(--h))" },
  { v: 3, t: "rotateY(90deg) translateZ(var(--h))" },
  { v: 4, t: "rotateY(-90deg) translateZ(var(--h))" },
  { v: 5, t: "rotateX(90deg) translateZ(var(--h))" },
  { v: 2, t: "rotateX(-90deg) translateZ(var(--h))" },
];

function Die({ value, rollId, rolling, ms, size, travel, index }: { value: number; rollId: number; rolling: boolean; ms: number; size: string; travel: boolean; index: number }) {
  const cube = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  // Resting face (no animation) on mount / restore.
  useLayoutEffect(() => {
    const [x, y] = FACE_ROT[value];
    if (cube.current && !rolling) cube.current.style.transform = `rotateX(${x - 12}deg) rotateY(${y + 18}deg)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!rolling || shown.current === rollId || !cube.current) return;
    shown.current = rollId;
    const [x, y] = FACE_ROT[value];
    const spinX = 720 + (index ? 360 : 0);
    const spinY = 540 + (index ? 180 : 360);
    const end = `rotateX(${x - 12}deg) rotateY(${y + 18}deg)`;
    const dur = Math.max(300, ms - 60);
    cube.current.animate(
      [
        { transform: `rotateX(${x - 12 - spinX}deg) rotateY(${y + 18 - spinY}deg) rotateZ(${index ? 40 : -30}deg)` },
        { transform: end },
      ],
      { duration: dur, easing: "cubic-bezier(0.15, 0.7, 0.25, 1)", fill: "both" },
    );
    if (travel && wrap.current) {
      wrap.current.animate(
        [
          { transform: `translate(${index ? -260 : -300}%, ${index ? -40 : 30}%) scale(0.8)`, opacity: 0 },
          { transform: `translate(${index ? -60 : -80}%, ${index ? -20 : 10}%)`, opacity: 1, offset: 0.3 },
          { transform: `translate(14%, 0)`, offset: 0.62 },
          { transform: `translate(-4%, 0)`, offset: 0.8 },
          { transform: "none" },
        ],
        { duration: dur, easing: "ease-out", fill: "both" },
      );
    }
  }, [rolling, rollId, value, ms, travel, index]);
  return (
    <div ref={wrap} className="cr-die" style={{ ["--s" as string]: size }} role="img" aria-label={`Die showing ${value}`}>
      <div ref={cube} className="cr-cube">
        {FACES.map((f) => (
          <div key={f.v} className="cr-face" style={{ transform: f.t }}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={PIPS[f.v].includes(i) ? "cr-pip" : ""} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Table pieces ───────────── */

function Chip({ amount, small }: { amount: number; small?: boolean }) {
  return (
    <span key={amount} className={`cr-chip ${small ? "is-small" : ""}`}>
      <TableChip amount={amount} />
    </span>
  );
}

/** Result flash per bet key after a roll. */
function useFlash(g: CrapsGame) {
  return useMemo(() => {
    const m: Record<string, "win" | "lose" | "push" | "move"> = {};
    if (!g.result) return m;
    for (const l of g.result.lines) {
      if (l.result === "off") continue;
      if (l.result === "move") m[`${kindOf(l.key) === "come" ? "come" : "dc"}${g.result.total}`] = "move";
      else m[l.key] = l.result;
    }
    return m;
  }, [g.result]);
}

function Zone({
  g,
  k,
  flash,
  className = "",
  children,
  chipPos = "cr-chip-br",
  title,
  small,
}: {
  g: CrapsGame;
  k: string;
  flash: Record<string, string>;
  className?: string;
  children: ReactNode;
  chipPos?: string;
  title?: string;
  small?: boolean;
}) {
  const amt = g.bets[k] ?? 0;
  const f = flash[k];
  return (
    <button type="button" onClick={() => g.place(k)} disabled={g.rolling} title={title ?? betName(k)} aria-label={`${betName(k)}${amt ? ` · ◈ ${money(amt)}` : ""}`} className={`cr-zone ${className} ${f ? `is-${f}` : ""}`}>
      {children}
      {amt > 0 && <span className={`cr-chip-pos ${chipPos}`}>{<Chip amount={amt} small={small} />}</span>}
    </button>
  );
}

function NumberBox({ g, n, flash, compact }: { g: CrapsGame; n: BoxNum; flash: Record<string, string>; compact: boolean }) {
  const place = g.bets[`place${n}`] ?? 0;
  const come = g.bets[`come${n}`] ?? 0;
  const comeOdds = g.bets[`comeOdds${n}`] ?? 0;
  const dc = g.bets[`dc${n}`] ?? 0;
  const dcOdds = g.bets[`dcOdds${n}`] ?? 0;
  const f = flash[`place${n}`] ?? flash[`come${n}`] ?? flash[`comeOdds${n}`] ?? flash[`dc${n}`];
  const [w, per] = PLACE_PAYS[n];
  return (
    <div className={`cr-box ${g.point === n ? "is-point" : ""} ${f ? `is-${f}` : ""}`}>
      <button type="button" onClick={() => g.place(`place${n}`)} disabled={g.rolling} className="cr-box__hit" aria-label={`Place ${n}${place ? ` · ◈ ${money(place)}` : ""}`} title={`Place ${n} · pays ${w}:${per}`} />
      {g.point === n && <span className="cr-puck is-on">ON</span>}
      <span className={`cr-box__num ${n === 6 || n === 9 ? "is-word" : ""}`}>{compact ? n : BOX_LABEL[n]}</span>
      {!compact && <span className="cr-box__pay">{w}:{per}</span>}
      {/* Come / don't come travelling here, with their odds (tap to add odds) */}
      {(come > 0 || dc > 0) && (
        <span className="cr-box__come">
          {come > 0 && (
            <button type="button" className="cr-box__stack" onClick={() => g.place(`comeOdds${n}`)} disabled={g.rolling} title={`Come ${n}: tap to add odds`} aria-label={`Come ${n} · add odds`}>
              <Chip amount={come} small />
              {comeOdds > 0 && (
                <span className="cr-odds-chip">
                  <Chip amount={comeOdds} small />
                </span>
              )}
            </button>
          )}
          {dc > 0 && (
            <button type="button" className="cr-box__stack is-dc" onClick={() => g.place(`dcOdds${n}`)} disabled={g.rolling} title={`Don't come ${n}: tap to lay odds`} aria-label={`Don't come ${n} · lay odds`}>
              <Chip amount={dc} small />
              {dcOdds > 0 && (
                <span className="cr-odds-chip">
                  <Chip amount={dcOdds} small />
                </span>
              )}
            </button>
          )}
        </span>
      )}
      {place > 0 && (
        <span className="cr-chip-pos cr-chip-bc">
          <Chip amount={place} small={compact} />
        </span>
      )}
    </div>
  );
}

const DiceFace = ({ a, b }: { a: number; b: number }) => (
  <span className="cr-mini-dice" aria-hidden="true">
    <span className="cr-mini-die">{"⚀⚁⚂⚃⚄⚅"[a - 1]}</span>
    <span className="cr-mini-die">{"⚀⚁⚂⚃⚄⚅"[b - 1]}</span>
  </span>
);

/** Hardways and one-roll propositions. */
function Props({ g, flash, compact = false }: { g: CrapsGame; flash: Record<string, string>; compact?: boolean }) {
  return (
    <div className={`cr-props ${compact ? "is-compact" : ""}`}>
      <p className="cr-props__title">Hardways</p>
      <div className="grid grid-cols-2 gap-1.5">
        {([6, 10, 8, 4] as const).map((n) => (
          <Zone key={n} g={g} k={`hard${n}`} flash={flash} className="cr-prop" chipPos="cr-chip-tr" small>
            <DiceFace a={n / 2} b={n / 2} />
            <span className="cr-prop__pay">{HARD_PAYS[n]}:1</span>
          </Zone>
        ))}
      </div>
      <p className="cr-props__title">One roll</p>
      <Zone g={g} k="any7" flash={flash} className="cr-prop cr-prop--wide is-red" chipPos="cr-chip-r">
        <span className="cr-prop__label">Any seven</span>
        <span className="cr-prop__pay">4:1</span>
      </Zone>
      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            ["two", 1, 1],
            ["twelve", 6, 6],
            ["three", 1, 2],
            ["eleven", 5, 6],
          ] as const
        ).map(([k, a, b]) => (
          <Zone key={k} g={g} k={k} flash={flash} className="cr-prop" chipPos="cr-chip-tr" small>
            <DiceFace a={a} b={b} />
            <span className="cr-prop__pay">{PROPS[k].pays}:1</span>
          </Zone>
        ))}
      </div>
      <Zone g={g} k="anyCraps" flash={flash} className="cr-prop cr-prop--wide" chipPos="cr-chip-r">
        <span className="cr-prop__label">Any craps</span>
        <span className="cr-prop__pay">7:1</span>
      </Zone>
    </div>
  );
}

/** The main layout: numbers, come, field, don't pass, pass line. */
function Layout({ g, flash, compact }: { g: CrapsGame; flash: Record<string, string>; compact: boolean }) {
  const passOddsOpen = g.point !== null && (g.bets.pass ?? 0) > 0;
  const dpOddsOpen = g.point !== null && (g.bets.dontPass ?? 0) > 0;
  return (
    <div className="cr-layout">
      <div className="cr-row cr-row--boxes">
        <Zone g={g} k="dontCome" flash={flash} className="cr-dcbar" chipPos="cr-chip-bc">
          <span className="cr-vert">Don&apos;t come bar</span>
          {g.point === null && <span className="cr-puck">OFF</span>}
        </Zone>
        <div className="cr-boxes">
          {BOX.map((n) => (
            <NumberBox key={n} g={g} n={n} flash={flash} compact={compact} />
          ))}
        </div>
      </div>
      <Zone g={g} k="come" flash={flash} className="cr-come" chipPos="cr-chip-r">
        <span className="cr-big">COME</span>
      </Zone>
      <Zone g={g} k="field" flash={flash} className="cr-field" chipPos="cr-chip-r">
        <span className="cr-field__nums">
          <b className="is-ring">2</b>
          <i>3</i>
          <i>4</i>
          <i>9</i>
          <i>10</i>
          <i>11</i>
          <b className="is-ring">12</b>
        </span>
        <span className="cr-field__label">FIELD · 2 pays double · 12 pays triple</span>
      </Zone>
      <div className="cr-row cr-row--dp">
        <Zone g={g} k="dontPass" flash={flash} className="cr-dp" chipPos="cr-chip-r">
          <span className="cr-mid">Don&apos;t pass bar</span>
          <span className="cr-mini-dice ml-2" aria-hidden="true">
            <span className="cr-mini-die">⚅</span>
            <span className="cr-mini-die">⚅</span>
          </span>
        </Zone>
        {dpOddsOpen && (
          <Zone g={g} k="dontPassOdds" flash={flash} className="cr-odds" chipPos="cr-chip-c" title="Lay odds behind Don't pass (true odds)">
            <span className="cr-odds__label">Lay odds</span>
          </Zone>
        )}
      </div>
      <div className="cr-row cr-row--pass">
        <Zone g={g} k="pass" flash={flash} className="cr-pass" chipPos="cr-chip-r">
          <span className="cr-big">PASS LINE</span>
        </Zone>
        {passOddsOpen && (
          <Zone g={g} k="passOdds" flash={flash} className="cr-odds" chipPos="cr-chip-c" title="Odds behind Pass (true odds, 3-4-5×)">
            <span className="cr-odds__label">Odds</span>
          </Zone>
        )}
      </div>
    </div>
  );
}

/* ───────────── Panels ───────────── */

function RollHistory({ items, max }: { items: RollRecord[]; max?: number }) {
  const list = [...items].reverse().slice(0, max ?? items.length);
  if (!list.length) return <p className="py-3 text-center text-[11px] text-white/35">Your rolls will show here.</p>;
  return (
    <ul className="grid grid-cols-6 gap-1">
      {list.map((r) => (
        <li key={r.id} title={`${r.d[0]} + ${r.d[1]}`} className={`cr-hist ${r.total === 7 ? "is-seven" : r.event === "pointMade" ? "is-made" : r.d[0] === r.d[1] ? "is-hard" : ""}`}>
          {r.total}
        </li>
      ))}
    </ul>
  );
}

function RollStats({ g }: { g: CrapsGame }) {
  const session = useSession();
  const today = session.craps;
  const counts = new Array(13).fill(0);
  g.history.forEach((r) => counts[r.total]++);
  const n = g.history.length;
  const ways = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const maxShare = Math.max(6 / 36, ...counts.map((c) => (n ? c / n : 0)));
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg border border-white/[0.05] bg-black/25 px-2 py-1.5">
          <p className="text-[8.5px] font-black tracking-[0.2em] text-[#d7b45b]/70">TODAY</p>
          <p className="font-mono text-[12.5px] font-bold text-white/85">{today?.spins ?? 0} decisions</p>
        </div>
        <div className="rounded-lg border border-white/[0.05] bg-black/25 px-2 py-1.5">
          <p className="text-[8.5px] font-black tracking-[0.2em] text-[#d7b45b]/70">TODAY NET</p>
          <p className={`font-mono text-[12.5px] font-bold ${(today?.net ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {(today?.net ?? 0) >= 0 ? "+" : "−"}
            {compactMoney(Math.abs(today?.net ?? 0))}
          </p>
        </div>
      </div>
      <div>
        <p className="rl-eyebrow mb-1 !text-[9px]">Totals · last {n} rolls</p>
        <div className="flex h-24 items-end gap-[3px]">
          {Array.from({ length: 11 }, (_, i) => {
            const t = i + 2;
            const share = n ? counts[t] / n : 0;
            return (
              <div key={t} className="flex flex-1 flex-col items-center gap-0.5">
                <div className="relative w-full flex-1">
                  <span className="absolute inset-x-0 bottom-0 rounded-sm bg-white/[0.06]" style={{ height: `${((ways[t] / 36) / maxShare) * 100}%` }} />
                  <span className={`absolute inset-x-[18%] bottom-0 rounded-sm ${t === 7 ? "bg-red-400/80" : "bg-[#d7b45b]/85"}`} style={{ height: `${(share / maxShare) * 100}%` }} />
                </div>
                <span className="font-mono text-[9px] text-white/50">{t}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-[9.5px] text-white/35">Gold: what came out · grey: what chance gives.</p>
      </div>
    </div>
  );
}

function Rules() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-white/70">
      <p>
        <b className="text-[#f0d38b]">Come-out roll:</b> Pass wins on 7 or 11, loses on 2, 3 or 12. Any other number becomes the <b>point</b> (the puck turns ON).
      </p>
      <p>
        <b className="text-[#f0d38b]">Point:</b> Pass wins if the point comes again before a 7 — a 7 first is a <b>seven out</b>. Don&apos;t pass is the
        reverse (12 on the come-out pushes).
      </p>
      <p>
        <b className="text-[#f0d38b]">Come / Don&apos;t come</b> work the same way, starting on the next roll; the chips travel to the number thrown. Tap a
        come chip on its number to add odds.
      </p>
      <p>
        <b className="text-[#f0d38b]">Odds</b> pay true odds (no house edge), up to 3-4-5×: 4/10 2:1, 5/9 3:2, 6/8 6:5.
      </p>
      <p>
        <b className="text-[#f0d38b]">Place</b> bets win when their number comes before a 7 (9:5, 7:5, 7:6). <b>Hardways</b> need the pair before a 7 or the
        easy way. Place bets and hardways are off on the come-out roll. Field and props are decided in one roll.
      </p>
      <div>
        <p className="rl-eyebrow mb-1 !text-[9px]">Table limits</p>
        <ul className="grid grid-cols-1 gap-[3px] sm:grid-cols-2">
          {(
            [
              ["Pass, Don't pass, Come, Don't come", LIMITS.line],
              ["Odds", "3-4-5× the bet (lay 6×)"],
              ["Field", LIMITS.field],
              ["Place 6 / 8", LIMITS.place[6]],
              ["Place 5 / 9", LIMITS.place[5]],
              ["Place 4 / 10", LIMITS.place[4]],
              ["Hard 6 / 8", LIMITS.hard[6]],
              ["Hard 4 / 10", LIMITS.hard[4]],
              ["Any 7", PROP_LIMITS.any7],
              ["Any craps", PROP_LIMITS.anyCraps],
              ["3 / 11", PROP_LIMITS.three],
              ["2 / 12", PROP_LIMITS.two],
              ["Whole layout", TABLE_MAX],
            ] as [string, number | string][]
          ).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-2 rounded bg-white/[0.03] px-2 py-0.5 text-[11px]">
              <span className="truncate">{k}</span>
              <span className="shrink-0 font-mono text-white/55">{typeof v === "number" ? `◈ ${compactMoney(v)}` : v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[10.5px] text-white/45">Minimum ◈ {MIN_BET} a bet. Bets that cancel out are refused: Pass with Don&apos;t pass, Come with Don&apos;t come, a Place bet on a number you bet against with Don&apos;t come.</p>
      </div>
      <div>
        <p className="rl-eyebrow mb-1 !text-[9px]">House edge</p>
        <ul className="grid grid-cols-1 gap-[3px] sm:grid-cols-2">
          {EDGES.map(([k, v]) => (
            <li key={k} className="flex justify-between rounded bg-white/[0.03] px-2 py-0.5 text-[11px]">
              <span>{k}</span>
              <span className="font-mono text-white/55">{v}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-white/45">Keys: Space roll · O max odds · R repeat one-roll bets · U undo · C clear · H hints · 1–9, 0 chips.</p>
    </div>
  );
}

type SheetTab = "props" | "rolls" | "stats" | "rules";
function Sheet({ g, flash, tab, setTab, onClose }: { g: CrapsGame; flash: Record<string, string>; tab: SheetTab; setTab: (t: SheetTab) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tabs: [SheetTab, string][] = [
    ["props", "Props"],
    ["rolls", "Rolls"],
    ["stats", "Stats"],
    ["rules", "Rules"],
  ];
  return (
    <div className="fixed inset-0 z-[80]">
      <button aria-label="Close" className="backdrop-in absolute inset-0 cursor-default bg-black/55" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Craps panels" className="rl-sheet absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col">
        <div className="flex items-center gap-2 px-3 pb-2 pt-2.5">
          <div className="rl-tabs !grid-cols-4 flex-1" role="tablist">
            {tabs.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rl-tab ${tab === id ? "is-on" : ""}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="rl-icon-key" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 [scrollbar-width:thin]" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.9rem)" }}>
          {tab === "props" && (
            <>
              <Props g={g} flash={flash} compact />
              <div className="mt-2 flex justify-between text-[11px] text-white/50">
                <span>On the table: ◈ {money(g.onTable)}</span>
                <span>Chip ◈ {money(g.chip)}</span>
              </div>
            </>
          )}
          {tab === "rolls" && <RollHistory items={g.history} />}
          {tab === "stats" && <RollStats g={g} />}
          {tab === "rules" && <Rules />}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Game ───────────── */

export default function Craps({ active, focus = false, onFocusChange }: { active: boolean; focus?: boolean; onFocusChange?: (v: boolean) => void }) {
  const desktop = useDesktop();
  const g = useCraps(active, desktop ? 1500 : 850);
  const flash = useFlash(g);
  const [sheet, setSheet] = useState<SheetTab | null>(null);
  const [panel, setPanel] = useState<"rolls" | "stats" | "rules">("rolls");

  // ---- Focus (same behaviour as the other games)
  const [focusAnim, setFocusAnim] = useState("");
  const firstFocus = useRef(true);
  useEffect(() => {
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    if (isNarrowScreen()) setFocusAnim("");
    else setFocusAnim(focus ? "focus-pending" : "slots-view-in");
  }, [focus]);
  const focusLeaving = useRef(false);
  const closeRef = useRef(onFocusChange);
  closeRef.current = onFocusChange;
  const requestFocusExit = () => {
    if (focusLeaving.current) return;
    focusLeaving.current = true;
    // Focus closes at once (no animation); fullscreen is left by the effect cleanup.
    {
      onFocusChange?.(false);
      return;
    }
    setFocusAnim("slots-focus-out");
    let closed = false;
    const done = () => {
      if (closed) return;
      closed = true;
      closeRef.current?.(false);
    };
    window.setTimeout(() => exitFullscreenSettled(done), 0);
    window.setTimeout(done, 1000);
  };
  useEffect(() => {
    if (!focus) return;
    const close = () => closeRef.current?.(false);
    const root = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    const prevGutter = root.style.scrollbarGutter;
    document.body.style.overflow = "hidden";
    root.style.scrollbarGutter = "auto";
    (document.activeElement as HTMLElement | null)?.blur?.();
    const wasFullscreen = Boolean(document.fullscreenElement);
    const narrow = isNarrowScreen();
    focusLeaving.current = false;
    const cancelFs = requestFullscreenSettled(() => {
      if (!narrow) setFocusAnim("slots-focus-in");
    });
    let entered = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered && !wasFullscreen && !focusLeaving.current) {
        focusLeaving.current = true;
        if (narrow) return close();
        setFocusAnim("slots-focus-out");
        whenViewportStable(close);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector("[role=dialog][aria-modal=true]")) close();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelFs();
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      root.style.scrollbarGutter = prevGutter;
      if (!wasFullscreen && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    };
  }, [focus]);

  // Phones share one line: a new message (call, refusal) shows for a moment,
  // then the tip comes back when hints are on.
  const [msgFresh, setMsgFresh] = useState(false);
  useEffect(() => {
    setMsgFresh(true);
    const t = window.setTimeout(() => setMsgFresh(false), 2400);
    return () => window.clearTimeout(t);
  }, [g.message, g.refused]);
  const res = g.rolling ? null : g.result;
  const won = res ? res.returned : 0;
  const net = res ? res.won - res.lost : null;
  const total = g.dice[0] + g.dice[1];

  const messageLine = (
    <p key={g.refused} className={`rl-message truncate ${g.refused ? "rl-shake" : ""}`} role="status">
      {g.message}
    </p>
  );
  const pointBadge = (
    <span className={`cr-point ${g.point ? "is-on" : ""}`}>
      <span className="cr-point__puck">{g.point ? "ON" : "OFF"}</span>
      {g.point ? `Point ${g.point}` : "Come-out"}
    </span>
  );
  const callText = g.rolling ? "…" : res ? res.call : g.history.length ? `${total}` : "Roll the dice";

  const chips = (cls: string) =>
    CRAPS_CHIPS.map((v, i) => (
      <button
        key={v}
        type="button"
        role="radio"
        aria-checked={g.chip === v}
        aria-label={`Chip ${v}`}
        title={`Chip ${money(v)} (${i === 9 ? 0 : i + 1})`}
        onClick={() => g.setChip(v)}
        className={`rl-chip-pick relative aspect-square shrink-0 rounded-full ${cls} ${g.chip === v ? "is-selected" : ""}`}
      >
        <ChipFace value={v} />
      </button>
    ));
  const key = (label: ReactNode, onClick: () => void, disabled: boolean, aria: string, extra = "") => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={aria} className={`rl-key ${extra}`}>
      {label}
    </button>
  );
  const oddsAvailable = g.point !== null || Object.keys(g.bets).some((k) => kindOf(k) === "comePoint" || kindOf(k) === "dcPoint");

  // ---- PC
  if (desktop) {
    return (
      <div
        data-theme="carbon"
        className={`rl-root cr-root ${focusAnim} ${focus ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black" : "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[540px] lg:h-[calc(100dvh-10rem)]"}`}
      >
        {focus && (
          <button
            type="button"
            onClick={requestFocusExit}
            aria-label="Exit focus mode"
            title="Exit focus (Esc)"
            className="fixed right-4 top-3 z-[61] flex h-9 items-center gap-1.5 rounded-full border border-[#d7b45b]/50 bg-black/85 px-3 text-[11px] font-bold uppercase tracking-wider text-[#e5c779] hover:border-[#e5c779]"
          >
            ✕ <span>Exit</span>
          </button>
        )}
        <section className={`rl-stage relative flex h-full flex-col overflow-hidden ${focus ? "" : "rounded-3xl border border-white/10"}`}>
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,min(28%,21rem))_minmax(0,1fr)] gap-5 px-6 pb-4 pt-5">
            {/* Left: plaque, dice tray, panels */}
            <aside className="flex min-h-0 flex-col gap-3">
              <div className="rl-plaque mx-auto flex flex-col items-center px-7 py-2 text-center">
                <span className="font-display gold-text text-[20px] font-bold tracking-[0.32em]">CRAPS</span>
                <span className="text-[9px] font-bold tracking-[0.35em] text-white/45">LAS VEGAS · 3-4-5× ODDS</span>
              </div>
              <div className="cr-tray">
                <div className="flex items-center justify-center gap-5">
                  <Die index={0} value={g.dice[0]} rollId={g.rollId} rolling={g.rolling} ms={1500} size="3.4rem" travel />
                  <Die index={1} value={g.dice[1]} rollId={g.rollId} rolling={g.rolling} ms={1500} size="3.4rem" travel />
                </div>
                <p key={`c-${g.rollId}-${g.rolling}`} className={`cr-call ${res && (res.event === "sevenOut" || res.event === "craps") ? "is-bad" : res && res.won > 0 ? "is-good" : ""}`}>
                  {callText}
                </p>
                <div className="flex justify-center">{pointBadge}</div>
              </div>
              <div className="rl-card flex min-h-0 flex-1 flex-col p-3">
                <div className="rl-tabs !grid-cols-3" role="tablist">
                  {(
                    [
                      ["rolls", "Rolls"],
                      ["stats", "Stats"],
                      ["rules", "Rules"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={panel === id} onClick={() => setPanel(id)} className={`rl-tab ${panel === id ? "is-on" : ""}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  {panel === "rolls" && <RollHistory items={g.history} max={60} />}
                  {panel === "stats" && <RollStats g={g} />}
                  {panel === "rules" && <Rules />}
                </div>
              </div>
            </aside>
            {/* Right: table and console */}
            <div className="flex min-h-0 flex-col gap-3">
              <div className={`flex items-center justify-between gap-3 ${focus ? "pr-24" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="rl-announce max-w-full">{messageLine}</div>
                </div>
                {g.hint && <p className="hidden max-w-[45%] truncate text-[11px] text-[#e9d9a9]/70 xl:block">💡 {g.hint}</p>}
              </div>
              <div className="cr-table min-h-0 flex-1">
                <div className="cr-felt grid h-full grid-cols-[minmax(0,1fr)_minmax(0,clamp(9.5rem,17vw,14rem))] gap-3 p-3 xl:gap-4 xl:p-4">
                  <Layout g={g} flash={flash} compact={false} />
                  <Props g={g} flash={flash} />
                </div>
              </div>
              <div className="rl-console rl-console--pc grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-3 xl:gap-x-4 xl:p-3.5">
                <div className="grid grid-cols-3 gap-2 xl:gap-2.5">
                  {(
                    [
                      ["Credit", g.balance, false],
                      ["On the table", g.onTable, false],
                      ["Last roll", won, won > 0],
                    ] as const
                  ).map(([label, value, hot], i) => (
                    <div key={label} className={`rl-window ${hot ? "is-hot" : ""}`}>
                      <span className="rl-window__label">{label}</span>
                      <span key={hot ? `w-${g.rollId}` : label} className={`rl-window__value ${hot ? "meter-hit" : ""}`}>
                        <span className="rl-window__cur">◈</span>
                        <Counter value={value} />
                      </span>
                      {i === 2 && net !== null && net !== 0 && (
                        <span className={`rl-window__net ${net > 0 ? "is-up" : "is-down"}`}>
                          {net > 0 ? "+" : "−"}◈ {money(Math.abs(net))} net
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="row-span-3 flex items-center justify-center">
                  <button type="button" onClick={g.roll} disabled={g.rolling || g.onTable === 0} aria-label="Roll the dice" className={`rl-round-spin ${!g.rolling && g.onTable > 0 ? "is-ready" : ""} ${g.rolling ? "is-spinning" : ""}`}>
                    <span aria-hidden="true" className="rl-round-spin__crown" />
                    <span aria-hidden="true" className="rl-round-spin__sheen" />
                    <span className="rl-round-spin__dome">
                      <span className="rl-round-spin__label">{g.rolling ? "…" : "Roll"}</span>
                      <span className="rl-round-spin__sub">{g.rolling ? "Dice out" : "Space"}</span>
                    </span>
                  </button>
                </div>
                <div className="rl-tray min-w-0">
                  <div className="flex items-center justify-center gap-1 xl:gap-1.5" role="radiogroup" aria-label="Chip value">
                    {chips("w-[clamp(1.6rem,2.35vw,2.45rem)]")}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {key(<>Undo<Kbd k="U" /></>, g.undo, !g.canUndo, "Undo")}
                  {key(<>Clear<Kbd k="C" /></>, g.clear, g.rolling, "Take down bets")}
                  {key(<>Rebet<Kbd k="R" /></>, g.rebet, !g.canRebet, "Repeat one-roll bets")}
                  {key(<>Max odds<Kbd k="O" /></>, g.maxAllOdds, g.rolling || !oddsAvailable, "Take max odds", oddsAvailable ? "is-hot" : "")}
                  <button type="button" onClick={g.toggleHint} aria-pressed={g.hintOn} className={`rl-key ${g.hintOn ? "is-on" : ""}`}>
                    Hints<Kbd k="H" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ---- Phones / tablets (light version)
  return (
    <div
      data-theme="carbon"
      className={`rl-root cr-root m-lite ${focus ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black" : "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[500px]"}`}
    >
      {focus && (
        <button
          type="button"
          onClick={requestFocusExit}
          aria-label="Exit focus mode"
          style={{ top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
          className="fixed right-4 z-[61] flex h-9 touch-manipulation items-center gap-1.5 rounded-full border border-[#d7b45b]/50 bg-black/85 px-3 text-[11px] font-bold uppercase tracking-wider text-[#e5c779]"
        >
          ✕ <span>Exit</span>
        </button>
      )}
      <section
        className={`rl-stage relative flex h-full flex-col overflow-hidden ${focus ? "" : "rounded-3xl border border-white/10"}`}
        style={focus ? { paddingTop: "max(3.25rem, calc(env(safe-area-inset-top) + 3rem))" } : undefined}
      >
        <div className="flex min-h-0 flex-1 flex-col px-2 pt-2">
          {/* Dice, call and the point */}
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex shrink-0 items-center gap-1.5">
              <Die index={0} value={g.dice[0]} rollId={g.rollId} rolling={g.rolling} ms={850} size="2.15rem" travel={false} />
              <Die index={1} value={g.dice[1]} rollId={g.rollId} rolling={g.rolling} ms={850} size="2.15rem" travel={false} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`cr-call truncate !text-left !text-[14px] ${res && (res.event === "sevenOut" || res.event === "craps") ? "is-bad" : res && res.won > 0 ? "is-good" : ""}`}>{callText}</p>
              <div className="mt-0.5">{pointBadge}</div>
            </div>
            <button type="button" onClick={g.toggleHint} aria-pressed={g.hintOn} className={`rl-icon-key !w-auto px-2 text-[9.5px] font-bold tracking-[0.12em] ${g.hintOn ? "is-on" : ""}`}>
              HINT
            </button>
            <button type="button" onClick={() => setSheet("rolls")} className="rl-icon-key" aria-label="Rolls, stats and rules">
              ☰
            </button>
          </div>
          <div className="mb-1 flex h-5 items-center justify-center">{g.hint && !msgFresh ? <p className="truncate text-[10.5px] text-[#e9d9a9]/75">💡 {g.hint}</p> : messageLine}</div>
          <div className="cr-table min-h-0 flex-1">
            <div className="cr-felt h-full p-2">
              <Layout g={g} flash={flash} compact />
            </div>
          </div>
        </div>
        {/* Console */}
        <div className="rl-console px-2 pb-2 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}>
          <ChipRow g={g} chips={chips} />
          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_5.25rem] gap-1.5">
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ["Credit", g.balance, false],
                  ["Table", g.onTable, false],
                  ["Win", won, won > 0],
                ] as const
              ).map(([label, value, hot]) => (
                <div key={label} className={`rl-window rl-window--sm ${hot ? "is-hot" : ""}`}>
                  <span className="rl-window__label">{label}</span>
                  <span className="rl-window__value">
                    <span className="rl-window__cur">◈</span>
                    {compactMoney(value)}
                  </span>
                </div>
              ))}
            </div>
            <button type="button" onClick={g.roll} disabled={g.rolling || g.onTable === 0} className={`rl-spin row-span-2 ${!g.rolling && g.onTable > 0 ? "is-ready" : ""} ${g.rolling ? "is-spinning" : ""}`}>
              <span className="text-[14px] tracking-[0.22em]">{g.rolling ? "…" : "ROLL"}</span>
              <span className="text-[9px] font-black tracking-[0.2em] opacity-60">{g.point ? `POINT ${g.point}` : "COME-OUT"}</span>
            </button>
            <div className="grid grid-cols-4 gap-1">
              {key("Undo", g.undo, !g.canUndo, "Undo")}
              {key("Clear", g.clear, g.rolling, "Take down bets")}
              {key("Odds", g.maxAllOdds, g.rolling || !oddsAvailable, "Take max odds", oddsAvailable ? "is-hot" : "")}
              {key("Props", () => setSheet("props"), false, "Hardways and propositions")}
            </div>
          </div>
        </div>
      </section>
      {sheet && <Sheet g={g} flash={flash} tab={sheet} setTab={setSheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function ChipRow({ g, chips }: { g: CrapsGame; chips: (cls: string) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>("[aria-checked=true]");
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [g.chip]);
  return (
    <div ref={ref} className="rl-chip-scroll" role="radiogroup" aria-label="Chip value">
      {chips("w-[2.55rem] snap-center")}
    </div>
  );
}

