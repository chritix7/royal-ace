"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChipFace } from "./ChipButton";
import { Counter } from "./ui";
import RouletteTable from "./roulette/RouletteTable";
import RouletteRacetrack from "./roulette/RouletteRacetrack";
import { AutoMenu, BigWin, Favourites, RoundHistory, StylePanel } from "./roulette/RoulettePanels";
import AchievementToast from "./AchievementToast";
import RouletteWheel from "./roulette/RouletteWheel";
import { money } from "../lib/game";
import {
  ANNOUNCES,
  announceBets,
  betName,
  colorOf,
  coverage,
  insideKey,
  LIGHTNING_STRAIGHT,
  LIMIT_BY_SIZE,
  limitOf,
  neighbours,
  OUTSIDE,
  payoutOf,
  TABLE_MAX,
  TABLE_MIN,
  type AnnounceKey,
} from "../lib/roulette";
import { ROULETTE_CHIPS, useRoulette, type RouletteGame } from "../lib/useRoulette";
import { exitFullscreenSettled, isNarrowScreen, requestFullscreenSettled, whenViewportStable } from "../lib/fullscreen";
import { useSession } from "../lib/sessionStore";

/** Desktop or phone layout, decided on the client. */
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

const pill = (n: number) =>
  `rl-pill rl-pill--${colorOf(n)} flex shrink-0 items-center justify-center rounded-md font-mono font-black tabular-nums`;

/** Last numbers, newest first. */
function History({ history, count, size = "md" }: { history: number[]; count: number; size?: "sm" | "md" }) {
  const list = history.slice(-count).reverse();
  if (list.length === 0) return <span className="text-[11px] text-white/35">No spins yet</span>;
  return (
    <div className="flex min-w-0 items-center gap-1" aria-label="Last numbers">
      {list.map((n, i) => (
        <span
          key={`${history.length}-${i}`}
          className={`${pill(n)} ${size === "sm" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]"} ${i === 0 ? "rl-pill--latest" : "opacity-80"}`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

/** Hot / cold numbers and colour split over the last 100 spins. */
function useTrends(history: number[]) {
  return useMemo(() => {
    const last = history.slice(-100);
    const counts = new Map<number, number>();
    for (let n = 0; n <= 36; n++) counts.set(n, 0);
    last.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1));
    const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const red = last.filter((n) => colorOf(n) === "red").length;
    const black = last.filter((n) => colorOf(n) === "black").length;
    const zero = last.filter((n) => n === 0).length;
    const pct = (x: number) => (last.length ? Math.round((x / last.length) * 100) : 0);
    const share = (key: keyof typeof OUTSIDE) => pct(last.filter((n) => (OUTSIDE[key].nums as readonly number[]).includes(n)).length);
    // Sleepers: numbers that haven't come out for the longest time.
    const lastSeen = new Map<number, number>();
    history.forEach((n, i) => lastSeen.set(n, i));
    const sleepers = Array.from({ length: 37 }, (_, n) => [n, lastSeen.has(n) ? history.length - 1 - lastSeen.get(n)! : history.length] as [number, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    // Current run of the same colour.
    let run = 0;
    const lastColor = history.length ? colorOf(history[history.length - 1]) : null;
    for (let i = history.length - 1; i >= 0 && colorOf(history[i]) === lastColor; i--) run++;
    return {
      total: last.length,
      hot: byCount.slice(0, 4),
      cold: byCount.slice(-4).reverse(),
      red: pct(red),
      black: pct(black),
      zero: pct(zero),
      dozens: [share("dz1"), share("dz2"), share("dz3")],
      columns: [share("col1"), share("col2"), share("col3")],
      sleepers,
      run,
      runColor: lastColor,
    };
  }, [history]);
}

/** Full statistics (Stats tab and info panel). */
function StatsFull({ g }: { g: RouletteGame }) {
  const t = useTrends(g.history);
  const bars = (label: string, values: number[], names: string[]) => (
    <div>
      <p className="rl-eyebrow mb-1 !text-[9px]">{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {values.map((v, i) => (
          <div key={i} className="rounded-lg bg-black/30 px-2 py-1">
            <div className="flex justify-between text-[10px] text-white/55">
              <span>{names[i]}</span>
              <span className="font-mono text-[#f0d99a]">{v}%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-gradient-to-r from-[#9a7330] to-[#f3d995]" style={{ width: `${Math.min(100, v * 2.2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-2.5">
      <Trends g={g} />
      {t.total > 0 && (
        <>
          {bars("Dozens", t.dozens, ["1st", "2nd", "3rd"])}
          {bars("Columns", t.columns, ["Col 1", "Col 2", "Col 3"])}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.06] bg-black/30 px-2 py-1.5">
              <p className="text-[9px] font-black tracking-[0.25em] text-white/50">SLEEPERS</p>
              <div className="mt-1 flex gap-1">
                {t.sleepers.map(([n, ago]) => (
                  <span key={n} title={`${n}: not out for ${ago} spins`} className={`${pill(n)} h-6 w-6 text-[10px]`}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/30 px-2 py-1.5">
              <p className="text-[9px] font-black tracking-[0.25em] text-white/50">CURRENT RUN</p>
              <p className="mt-1 text-[13px] font-bold text-white/85">
                {t.run} × <span className={t.runColor === "red" ? "text-[#ff7a85]" : t.runColor === "green" ? "text-emerald-300" : "text-white"}>{t.runColor}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Trends({ g, compact = false }: { g: RouletteGame; compact?: boolean }) {
  const t = useTrends(g.history);
  return (
    <div className={`grid gap-2 ${compact ? "" : "text-[11px]"}`}>
      <div className="flex h-2 overflow-hidden rounded-full bg-white/5" aria-label={`Red ${t.red}%, black ${t.black}%, zero ${t.zero}%`}>
        <span className="bg-gradient-to-b from-[#c0182a] to-[#7d0c14]" style={{ width: `${t.red}%` }} />
        <span className="bg-[#0f7a4c]" style={{ width: `${t.zero}%` }} />
        <span className="bg-gradient-to-b from-[#3a3b40] to-[#121316]" style={{ width: `${t.black}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-bold tracking-wider text-white/45">
        <span className="text-[#ff7a85]">RED {t.red}%</span>
        <span className="text-emerald-300/80">0 · {t.zero}%</span>
        <span className="text-white/70">BLACK {t.black}%</span>
      </div>
      {t.total === 0 ? (
        <p className="text-[11px] text-white/35">Hot and cold numbers appear after a few spins.</p>
      ) : (
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["Hot", t.hot, "text-[#f5b04a]"],
            ["Cold", t.cold, "text-sky-300"],
          ] as const
        ).map(([label, list, tone]) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-black/30 px-2 py-1.5">
            <p className={`text-[9px] font-black tracking-[0.25em] ${tone}`}>{label.toUpperCase()}</p>
            <div className="mt-1 flex gap-1">
              {list.map(([n, c]: [number, number]) => (
                <span key={n} title={`${n}: ${c} times in the last ${t.total}`} className={`${pill(n)} h-6 w-6 text-[10px]`}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

/** Rules and payouts. */
function InfoPanel({ onClose, g }: { onClose: () => void; g: RouletteGame }) {
  const session = useSession();
  const today = session.roulette;
  const rows: [string, string, string, number][] = [
    ["Straight", "1 number", "35 : 1", LIMIT_BY_SIZE[1]],
    ["Split", "2 numbers", "17 : 1", LIMIT_BY_SIZE[2]],
    ["Street / Trio", "3 numbers", "11 : 1", LIMIT_BY_SIZE[3]],
    ["Corner / First four", "4 numbers", "8 : 1", LIMIT_BY_SIZE[4]],
    ["Six line", "6 numbers", "5 : 1", LIMIT_BY_SIZE[6]],
    ["Dozen / Column", "12 numbers", "2 : 1", LIMIT_BY_SIZE[12]],
    ["Red · Black · Even · Odd · 1–18 · 19–36", "18 numbers", "1 : 1", LIMIT_BY_SIZE[18]],
  ];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="backdrop-in fixed inset-0 z-[90]">
      <button aria-label="Close game info" className="absolute inset-0 cursor-default bg-black/65" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Roulette info"
        className="[animation:drawerIn_.4s_cubic-bezier(0.22,1,0.36,1)_both] absolute right-0 top-0 flex h-full w-full flex-col border-l border-white/10 bg-[#0c0c0e] shadow-[-20px_0_60px_rgba(0,0,0,0.6)] sm:w-[min(520px,94vw)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#e5c779]">European roulette</p>
          <button onClick={onClose} aria-label="Close" className="lux-btn h-9 w-9 text-sm">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 [scrollbar-width:thin]" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}>
          <section className="rl-card">
            <p className="rl-eyebrow">Payouts</p>
            <dl className="mt-2 divide-y divide-white/[0.06] text-[12.5px]">
              {rows.map(([bet, nums, pays, max]) => (
                <div key={bet} className="grid grid-cols-[minmax(0,1fr)_auto_4.5rem] items-center gap-3 py-1.5">
                  <dt className="text-white/80">
                    {bet} <span className="text-white/35">· {nums}</span>
                  </dt>
                  <dd className="shrink-0 font-mono font-black text-[#f0d99a]">{pays}</dd>
                  <dd className="text-right font-mono text-[11px] text-white/45">max {money(max)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rl-card text-[12.5px] leading-5 text-white/65">
            <p className="rl-eyebrow">Table rules</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Single zero wheel (37 pockets).</li>
              <li>
                <span className="text-[#f0d99a]">La Partage:</span> when zero comes out, even-money bets (Red, Black, Even, Odd, 1–18, 19–36) get half their stake back. Dozens and
                columns lose.
              </li>
              <li>Opposite even-money bets can&apos;t be played together (Red with Black, Even with Odd, 1–18 with 19–36).</li>
              <li>Two dozens and two columns at most per spin.</li>
              <li>
                <span className="text-[#cfe0ff]">⚡ Lightning:</span> 1 to 5 numbers are struck before each spin with a 50× to 500× multiplier on straight-up bets.
                Straight ups that aren&apos;t struck pay {LIGHTNING_STRAIGHT}:1; every other bet pays as usual.
              </li>
              <li>
                Racetrack: Voisins du zéro (9 chips), Tiers du cylindre (6), Orphelins (5), Jeu zéro (4), or a number with 1 to 4 neighbours each
                side.
              </li>
              <li>
                Minimum chip ◈ {TABLE_MIN} · table maximum ◈ {money(TABLE_MAX)} per spin. Each bet has its own maximum (see payouts).
              </li>
              <li>Tap a line between numbers for a split, a corner for four numbers, the edge of a row for a street or six line.</li>
            </ul>
          </section>
          <section className="rl-card">
            <p className="rl-eyebrow">Today</p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
              {[
                ["Net", `${today.net >= 0 ? "+" : "−"}◈ ${money(Math.abs(today.net))}`, today.net >= 0 ? "text-emerald-300" : "text-red-300"],
                ["Spins", money(today.spins), "text-white"],
                ["Best", `◈ ${money(today.biggest)}`, "text-white"],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-xl bg-black/30 px-2 py-2">
                  <dt className="text-[10px] text-white/45">{k}</dt>
                  <dd className={`mt-0.5 font-mono text-sm font-bold ${c}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rl-card">
            <p className="rl-eyebrow">Last 100 spins</p>
            <div className="mt-2">
              <Trends g={g} />
            </div>
          </section>
          <section className="rl-card text-[12px] text-white/55">
            <p className="rl-eyebrow">Keyboard</p>
            <p className="mt-2 leading-6">
              <kbd className="rl-kbd">Space</kbd> spin · <kbd className="rl-kbd">U</kbd> undo · <kbd className="rl-kbd">C</kbd> clear ·{" "}
              <kbd className="rl-kbd">R</kbd> rebet · <kbd className="rl-kbd">X</kbd> double · <kbd className="rl-kbd">1</kbd>–<kbd className="rl-kbd">0</kbd> chip ·{" "}
              <kbd className="rl-kbd">T</kbd> quick spin · <kbd className="rl-kbd">L</kbd> Lightning · <kbd className="rl-kbd">F</kbd> focus · <kbd className="rl-kbd">Space</kbd> stops autoplay
            </p>
          </section>
          <p className="text-center text-[11px] text-white/30">Virtual chips only. No real money, deposits or cash-outs.</p>
        </div>
      </div>
    </div>
  );
}

const Kbd = ({ k }: { k: string }) => (
  <span aria-hidden="true" className="ml-1 hidden rounded-[4px] border border-current px-1 py-px text-[8px] leading-none opacity-45 2xl:inline-block">
    {k}
  </span>
);

/** Big result announcement over the table (PC). */
function ResultBanner({
  result,
}: {
  result: { n: number; returned: number; staked: number; winners: string[]; halved?: string[]; lucky?: { n: number; mult: number }[] | null; multiplied?: number };
}) {
  const n = result.n;
  const c = colorOf(n);
  const facts =
    n === 0
      ? ["Zero"]
      : [c === "red" ? "Red" : "Black", n % 2 ? "Odd" : "Even", n <= 18 ? "1–18" : "19–36", `${Math.ceil(n / 12)}${["st", "nd", "rd"][Math.ceil(n / 12) - 1]} dozen`];
  const net = result.returned - result.staked;
  const straight = result.winners.some((k) => coverage(k).length === 1);
  return (
    <div className="rl-result-banner pointer-events-none absolute inset-0 z-30 flex items-center justify-center" role="status">
      <div className={`rl-result-card ${net > 0 ? "is-win" : ""}`}>
        <span className={`rl-result-num rl-pill--${c}`}>{n}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.3em] text-white/50">{facts.join(" · ").toUpperCase()}</p>
          <p className={`font-display text-2xl font-bold tracking-[0.08em] xl:text-3xl ${net > 0 ? "gold-text" : "text-white/80"}`}>
            {net > 0 ? `WIN ◈ ${money(result.returned)}` : result.returned > 0 ? `◈ ${money(result.returned)} BACK` : "NO WIN"}
          </p>
          {result.multiplied ? (
            <p className="text-[10px] font-black tracking-[0.25em] text-[#f5d778]">⚡ LIGHTNING {result.lucky?.find((l) => l.n === n)?.mult}× STRIKE</p>
          ) : (
            straight && <p className="text-[10px] font-black tracking-[0.25em] text-[#f5d778]">STRAIGHT UP · {result.lucky ? LIGHTNING_STRAIGHT : 35} TO 1</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Chip selector + quick keys + Spin. */
function Console({ g, onInfo, desktop }: { g: RouletteGame; onInfo: () => void; desktop: boolean }) {
  const spinning = g.phase === "spinning";
  const [autoOpen, setAutoOpen] = useState(false);
  const won = g.phase === "result" && g.result ? g.result.returned : 0;
  const canSpin = !spinning && (g.staked > 0 || (Object.keys(g.lastBets).length > 0 && g.phase !== "spinning"));
  const key = (label: ReactNode, onClick: () => void, disabled: boolean, aria: string) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={aria} className="rl-key">
      {label}
    </button>
  );
  const chips = (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5" role="radiogroup" aria-label="Chip value">
      {ROULETTE_CHIPS.map((v, i) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={g.chip === v}
          aria-label={`Chip ${v}`}
          title={`Chip ${money(v)} (${i === 9 ? 0 : i + 1})`}
          onClick={() => g.setChip(v)}
          className={`rl-chip-pick relative aspect-square w-[clamp(1.9rem,9.6vw,2.4rem)] shrink-0 rounded-full lg:w-[clamp(1.6rem,2.35vw,2.45rem)] ${g.chip === v ? "is-selected" : ""}`}
        >
          <ChipFace value={v} />
        </button>
      ))}
    </div>
  );
  const keys = (
    <>
      {key(<>Undo<Kbd k="U" /></>, g.undo, !g.canUndo, "Undo last chip")}
      {key(<>Clear<Kbd k="C" /></>, g.clear, spinning || g.staked === 0, "Clear bets")}
      {key(<>Rebet<Kbd k="R" /></>, g.rebet, spinning || Object.keys(g.lastBets).length === 0, "Rebet")}
      {key(<>×2<Kbd k="X" /></>, g.double, spinning || g.staked === 0, "Double bets")}
    </>
  );
  const rebetSpin = g.staked === 0 && Object.keys(g.lastBets).length > 0 && !spinning;
  const spinKey = (
    <button
      type="button"
      onClick={g.spin}
      disabled={!canSpin}
      aria-label="Spin"
      className={`rl-spin ${canSpin ? "is-ready" : ""} ${spinning ? "is-spinning" : ""}`}
    >
      {desktop && (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="rl-spin__icon">
          <path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M20 4v4.5h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="text-[13px] tracking-[0.22em] lg:text-[17px]">{spinning ? "SPINNING" : rebetSpin ? "REBET" : "SPIN"}</span>
      <span className="text-[9px] font-black tracking-[0.2em] opacity-60">
        {spinning ? "NO MORE BETS" : rebetSpin ? "& SPIN" : desktop ? "SPACE" : `◈ ${money(g.staked)}`}
      </span>
    </button>
  );
  // PC: a round Spin button — knurled gold crown, black glass dome.
  const roundSpin = (
    <button
      type="button"
      onClick={g.spin}
      disabled={!canSpin}
      aria-label="Spin"
      className={`rl-round-spin ${canSpin ? "is-ready" : ""} ${spinning ? "is-spinning" : ""}`}
    >
      <span aria-hidden="true" className="rl-round-spin__crown" />
      <span aria-hidden="true" className="rl-round-spin__sheen" />
      <span className="rl-round-spin__dome">
        <span className="rl-round-spin__label">{spinning ? "…" : rebetSpin ? "Rebet" : "Spin"}</span>
        <span className="rl-round-spin__sub">{spinning ? "No more bets" : rebetSpin ? "& spin" : "Space"}</span>
      </span>
    </button>
  );
  const meters = (
    <>
      <div className="jewel flex min-w-0 flex-col justify-center px-2.5 lg:px-3">
        <span className="text-[8px] font-black tracking-[0.25em] text-[#d7b45b]/80">BET</span>
        <span className="gold-text truncate font-mono text-[15px] font-black tabular-nums lg:text-lg">◈ {money(g.staked)}</span>
      </div>
      <div className={`jewel flex min-w-0 flex-col justify-center px-2.5 text-right lg:px-3 ${won > 0 ? "jewel--hot" : ""}`}>
        <span className="text-[8px] font-black tracking-[0.25em] text-[#d7b45b]/80">WIN</span>
        <span className={`truncate font-mono text-[15px] font-black tabular-nums lg:text-lg ${won > 0 ? "meter-hit text-[#fff8dc]" : "gold-text"}`}>◈ {money(won)}</span>
      </div>
    </>
  );

  if (desktop) {
    const credit = g.available;
    const net = g.phase === "result" && g.result ? g.result.returned - g.result.staked : null;
    const autoOn = g.autoLeft > 0;
    return (
      <div className="rl-console rl-console--pc grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-3 xl:gap-x-4 xl:p-3.5">
        {/* Display: credit · total bet · win */}
        <div className="grid grid-cols-3 gap-2 xl:gap-2.5">
          {(
            [
              ["Credit", credit, false],
              ["Total bet", g.staked, false],
              [g.phase === "result" ? "Win" : "Last win", won, won > 0],
            ] as const
          ).map(([label, value, hot], i) => (
            <div key={label} className={`rl-window ${hot ? "is-hot" : ""}`}>
              <span className="rl-window__label">{label}</span>
              <span key={hot ? `w-${g.spinId}` : label} className={`rl-window__value ${hot ? "meter-hit" : ""}`}>
                <span className="rl-window__cur">◈</span>
                <Counter value={value} />
              </span>
              {i === 2 && net !== null && (
                <span className={`rl-window__net ${net > 0 ? "is-up" : net < 0 ? "is-down" : ""}`}>
                  {net > 0 ? "+" : net < 0 ? "−" : ""}◈ {money(Math.abs(net))} net
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="row-span-3 flex items-center justify-center">{roundSpin}</div>
        {/* Chip tray */}
        <div className="rl-tray min-w-0">{chips}</div>
        {/* Keys */}
        <div className="relative flex flex-wrap items-center justify-center gap-1">
          {keys}
          <button type="button" onClick={g.toggleQuick} aria-pressed={g.quick} className={`rl-key ${g.quick ? "is-on" : ""}`}>
            Quick<Kbd k="T" />
          </button>
          <button
            type="button"
            onClick={g.toggleLightning}
            disabled={spinning}
            aria-pressed={g.lightning}
            className={`rl-key rl-key--bolt ${g.lightning ? "is-on" : ""}`}
            title="Lightning: 1 to 5 numbers struck each spin, 50× to 500× on straight ups (straight ups pay 29:1)"
          >
            ⚡ Lightning<Kbd k="L" />
          </button>
          <button
            type="button"
            onClick={() => (autoOn ? g.stopAuto() : setAutoOpen((v) => !v))}
            aria-expanded={autoOpen}
            disabled={!autoOn && spinning}
            className={`rl-key ${autoOn ? "is-on" : ""}`}
          >
            {autoOn ? `Stop · ${g.autoLeft}` : "Auto"}
          </button>
          <button type="button" onClick={onInfo} className="rl-key" aria-label="Rules and payouts">
            Info
          </button>
          {autoOpen && <AutoMenu g={g} onClose={() => setAutoOpen(false)} />}
        </div>
      </div>
    );
  }
  return (
    <div className="rl-console px-2 pb-2 pt-2.5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}>
      {chips}
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.25rem] gap-1.5">
        <div className="col-span-2 grid grid-cols-2 gap-1.5">{meters}</div>
        <div className="row-span-2 flex">{spinKey}</div>
        <div className="col-span-2 grid grid-cols-4 gap-1">{keys}</div>
      </div>
    </div>
  );
}

export default function Roulette({
  active = true,
  focus = false,
  onFocusChange,
}: {
  active?: boolean;
  focus?: boolean;
  onFocusChange?: (next: boolean) => void;
}) {
  const g = useRoulette(active);
  const desktop = useDesktop();
  const [infoOpen, setInfoOpen] = useState(false);

  // Phones: the wheel takes over the screen while it spins, then hands
  // the table back with the winning number lit.
  const [wheelOpen, setWheelOpen] = useState(false);
  useEffect(() => {
    if (desktop) return;
    if (g.phase === "spinning") setWheelOpen(true);
    if (g.phase === "result") {
      const t = window.setTimeout(() => setWheelOpen(false), 1900);
      return () => window.clearTimeout(t);
    }
  }, [g.phase, desktop]);

  // ---- Focus (same behaviour as the slots: fullscreen, no animation on phones)
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
    if (isNarrowScreen()) {
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
    window.setTimeout(() => exitFullscreenSettled(done), 260);
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

  const wheelResult = g.phase === "result" && g.result ? g.result.n : null;
  const wheel = (size: string, tilt = false) => (
    <RouletteWheel size={size} spinId={g.spinId} target={g.target} spinMs={g.spinMs} onLanded={g.landed} showResult={wheelResult} tilt={tilt} />
  );
  // PC: the bet under the mouse, described in the croupier's line.
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  // A refused chip's reason stays readable for a moment, even under the mouse.
  const [refusalShown, setRefusalShown] = useState(false);
  useEffect(() => {
    if (!g.refused) return;
    setRefusalShown(true);
    const t = window.setTimeout(() => setRefusalShown(false), 1800);
    return () => window.clearTimeout(t);
  }, [g.refused]);
  // Racetrack: neighbours each side, hovered numbers and label.
  const [span, setSpan] = useState(2);
  const [rtHot, setRtHot] = useState<number[] | null>(null);
  const [rtLabel, setRtLabel] = useState<string | null>(null);
  const playNeighbours = (n: number) => {
    const nums = span ? neighbours(n, span) : [n];
    g.placeMany(
      nums.map((x) => [insideKey([x]), g.chip] as [string, number]),
      span ? `${n} and neighbours` : `Straight ${n}`,
    );
  };
  const playAnnounce = (a: AnnounceKey) => {
    if (g.placeMany(announceBets(a, g.chip), ANNOUNCES[a].label)) g.markAnnounced();
  };
  const [tab, setTab] = useState<"track" | "history" | "favs" | "stats" | "style">("track");

  // Close-up on the wheel while the ball drops, released after the result.
  const [closeup, setCloseup] = useState(false);
  useEffect(() => {
    if (!desktop) return;
    if (g.phase === "spinning") {
      const t = window.setTimeout(() => setCloseup(true), g.spinMs * 0.5);
      return () => window.clearTimeout(t);
    }
    if (g.phase === "result") {
      const t = window.setTimeout(() => setCloseup(false), 1400);
      return () => window.clearTimeout(t);
    }
    setCloseup(false);
  }, [g.phase, g.spinMs, desktop, g.spinId]);

  // Big win celebration (10× the stake and more, or a Lightning hit).
  const [bigWin, setBigWin] = useState<{ multiple: number; amount: number; lightning: boolean } | null>(null);
  useEffect(() => {
    if (g.phase !== "result" || !g.result) return;
    const r = g.result;
    const multiple = r.staked ? r.returned / r.staked : 0;
    if (multiple >= 10 || (r.multiplied ?? 0) > 0) {
      const t = window.setTimeout(() => setBigWin({ multiple, amount: r.returned, lightning: (r.multiplied ?? 0) > 0 }), 900);
      return () => window.clearTimeout(t);
    }
  }, [g.phase, g.result]);

  const hoverInfo = rtLabel && g.phase !== "spinning" && !refusalShown ? rtLabel : 
    hoverKey && g.phase !== "spinning" && !refusalShown
      ? `${betName(hoverKey)} · pays ${payoutOf(hoverKey)} to 1 · max ◈ ${money(limitOf(hoverKey))}${g.bets[hoverKey] && g.phase === "betting" ? ` · ◈ ${money(g.bets[hoverKey])} on it` : ""}`
      : null;

  const plaque = (
    <div className="rl-plaque mx-auto flex items-center gap-3 px-6 py-1.5 text-center lg:px-8 lg:py-2">
      <div className="flex flex-col items-center">
        <span className="font-display gold-text text-[17px] font-bold tracking-[0.32em] lg:text-[22px]">ROULETTE</span>
        <span className="text-[8px] font-bold tracking-[0.35em] text-white/45 lg:text-[9px]">{g.lightning ? "⚡ LIGHTNING · SINGLE ZERO" : "EUROPEAN · SINGLE ZERO"}</span>
      </div>
    </div>
  );
  const tabs: [typeof tab, string, string][] = [
    ["track", "Racetrack", "Track"],
    ["history", "History", "History"],
    ["favs", "Favourites", "Favs"],
    ["stats", "Stats", "Stats"],
    ["style", "Style", "Style"],
  ];

  return (
    <div
      data-theme={g.theme}
      className={`rl-root ${focusAnim} ${
        focus
          ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black"
          : "h-[calc(100dvh-10.15rem)] min-h-[500px] lg:h-[calc(100dvh-10rem)] lg:min-h-[540px]"
      }`}
    >
      {focus && (
        <button
          type="button"
          onClick={requestFocusExit}
          aria-label="Exit focus mode"
          title="Exit focus (Esc)"
          style={{ top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
          className="fixed right-4 z-[61] flex h-9 touch-manipulation items-center gap-1.5 rounded-full border border-[#d7b45b]/50 bg-black/85 px-3 text-[11px] font-bold uppercase tracking-wider text-[#e5c779] hover:border-[#e5c779]"
        >
          ✕ <span>Exit</span>
        </button>
      )}

      <section
        className={`rl-stage relative flex h-full flex-col overflow-hidden ${focus ? "" : "rounded-3xl border border-white/10"}`}
        style={focus && !desktop ? { paddingTop: "max(3.25rem, calc(env(safe-area-inset-top) + 3rem))" } : undefined}
      >
        {desktop ? (
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,min(34%,32rem))_minmax(0,1fr)] gap-6 px-6 pb-4 pt-5">
            {/* Wheel column */}
            <div className="flex min-h-0 flex-col items-center gap-3">
              {plaque}
              <div className={`rl-wheel-zone flex min-h-0 w-full flex-1 items-center justify-center ${closeup ? "is-closeup" : ""}`}>
                {wheel("min(100cqw, 114cqh, 30rem)", true)}
              </div>
              <div className="rl-card flex w-full flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="rl-eyebrow shrink-0">Last</p>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <History history={g.history} count={10} size="sm" />
                  </div>
                </div>
                <div className="rl-tabs" role="tablist" aria-label="Roulette panels">
                  {tabs.map(([id, label, short]) => (
                    <button key={id} type="button" role="tab" aria-selected={tab === id} aria-label={label} onClick={() => setTab(id)} className={`rl-tab ${tab === id ? "is-on" : ""}`}>
                      <span className="hidden 2xl:inline">{label}</span>
                      <span className="2xl:hidden">{short}</span>
                    </button>
                  ))}
                </div>
                <div className="h-[clamp(7.25rem,17dvh,11.5rem)] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  {tab === "track" && (
                    <RouletteRacetrack
                      onNumber={playNeighbours}
                      onAnnounce={playAnnounce}
                      onHover={(nums, label) => {
                        setRtHot(nums);
                        setRtLabel(label);
                      }}
                      disabled={g.phase === "spinning"}
                      span={span}
                      setSpan={setSpan}
                      winning={wheelResult}
                    />
                  )}
                  {tab === "history" && <RoundHistory g={g} />}
                  {tab === "favs" && <Favourites g={g} />}
                  {tab === "stats" && <StatsFull g={g} />}
                  {tab === "style" && <StylePanel g={g} />}
                </div>
              </div>
            </div>
            {/* Table column */}
            <div className="flex min-h-0 flex-col justify-center gap-3">
              <div className="flex items-center justify-between gap-3">
                <p
                  key={`m-${g.refused}`}
                  className={`rl-announce ${refusalShown ? "rl-shake" : ""} ${hoverInfo ? "is-hover" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="rl-announce__dot" aria-hidden="true" />
                  {hoverInfo ?? g.message}
                </p>
                <p className="shrink-0 text-[10px] font-bold tracking-[0.2em] text-white/35">
                  MIN ◈ {TABLE_MIN} · MAX ◈ {money(TABLE_MAX)}
                </p>
              </div>
              <div className="relative">
                <div className="rl-table3d [--rt-out:calc(var(--rt-row)*0.7)] [--rt-row:clamp(2.75rem,8.6dvh,6.25rem)]">
                  <div className="rl-rail">
                    <RouletteTable g={g} vertical={false} onHover={setHoverKey} extraHot={rtHot} />
                  </div>
                </div>
                {g.phase === "result" && g.result && <ResultBanner key={g.spinId} result={g.result} />}
                {g.lucky && g.phase === "spinning" && <div key={`flash-${g.spinId}`} className="rl-lightning-flash" aria-hidden="true" />}
              </div>
              <Console g={g} onInfo={() => setInfoOpen(true)} desktop />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col px-2 pt-2 sm:px-6">
            <div className="mb-2 flex items-center gap-2">
              <button type="button" onClick={() => setWheelOpen(true)} aria-label="Show the wheel" className="rl-mini-wheel shrink-0">
                <span className="rl-mini-wheel__dot" />
              </button>
              <div className="min-w-0 flex-1 overflow-hidden">
                <History history={g.history} count={9} size="sm" />
              </div>
              <button type="button" onClick={() => setInfoOpen(true)} className="rl-key !h-7 shrink-0 !px-2.5" aria-label="Rules, payouts and stats">
                Info
              </button>
            </div>
            <p className="rl-message mb-1.5 text-center" role="status" aria-live="polite">
              {g.message}
            </p>
            <div className="mx-auto min-h-0 w-full max-w-md flex-1 pb-2 [--rt-zero:clamp(2rem,5.2dvh,2.75rem)]">
              <RouletteTable g={g} vertical />
            </div>
            <div className="-mx-2 sm:-mx-6">
              <Console g={g} onInfo={() => setInfoOpen(true)} desktop={false} />
            </div>
          </div>
        )}
        {desktop && bigWin && <BigWin {...bigWin} onDone={() => setBigWin(null)} />}
      </section>

      {/* Phones: the wheel over the table while it spins */}
      {!desktop && wheelOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-black/90 px-4" onClick={() => g.phase !== "spinning" && setWheelOpen(false)}>
          {plaque}
          {wheel("min(88vw, 52dvh, 26rem)")}
          <p className="rl-message text-center" role="status">
            {g.message}
          </p>
          {g.phase !== "spinning" && <p className="text-[10px] tracking-[0.25em] text-white/35">TAP TO CLOSE</p>}
        </div>
      )}

      {infoOpen && <InfoPanel g={g} onClose={() => setInfoOpen(false)} />}
      <AchievementToast toast={g.badgeToast} onDismiss={g.dismissBadge} />
    </div>
  );
}
