"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChipFace } from "./ChipButton";
import { Counter } from "./ui";
import { money } from "../lib/game";
import { LEVELS, MAX_BET, MAX_SHOTS, MIN_BET, PENALTY_CHIPS, RTP, ZONES, ZONE_LABEL, ladderOf, multiplierAt, type Level, type Zone } from "../lib/penalty";
import { usePenalty, type PenaltyGame, type RoundRecord, type ShotRecord } from "../lib/usePenalty";
import { isNarrowScreen, requestFullscreenSettled } from "../lib/fullscreen";
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

/* ───────────── Pitch geometry (percent of the scene) ───────────── */

const GOAL = { l: 11, r: 89, t: 9, b: 62 };
const GW = GOAL.r - GOAL.l;
const GH = GOAL.b - GOAL.t;
const ZONE_AT: Record<Zone, [number, number]> = {
  tl: [GOAL.l + GW / 6, GOAL.t + GH / 4],
  tr: [GOAL.r - GW / 6, GOAL.t + GH / 4],
  c: [50, GOAL.t + GH * 0.45],
  bl: [GOAL.l + GW / 6, GOAL.t + (GH * 3) / 4],
  br: [GOAL.r - GW / 6, GOAL.t + (GH * 3) / 4],
};
const SPOT: [number, number] = [50, 88];
const KEEPER_FEET = GOAL.b - 1;
const ZONE_KEY: Record<Zone, string> = { tl: "1", tr: "2", c: "3", bl: "4", br: "5" };

/* ───────────── Scene: goal, keeper, ball ───────────── */

function Keeper() {
  return (
    <svg viewBox="0 0 60 80" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="pe-kit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a2f" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
      </defs>
      {/* arms out */}
      <path d="M8 24 L22 30 M52 24 L38 30" stroke="#d7b45b" strokeWidth="5" strokeLinecap="round" />
      <circle cx="7" cy="23" r="4.2" fill="#f0d38b" />
      <circle cx="53" cy="23" r="4.2" fill="#f0d38b" />
      {/* body */}
      <path d="M20 28 Q30 24 40 28 L38 54 H22 Z" fill="url(#pe-kit)" stroke="#d7b45b" strokeWidth="1.6" />
      <path d="M24 36 H36" stroke="#d7b45b" strokeOpacity="0.55" strokeWidth="1.2" />
      <text x="30" y="49" textAnchor="middle" fontSize="9" fontWeight="800" fill="#e5c779" fontFamily="Georgia, serif">
        1
      </text>
      {/* head */}
      <circle cx="30" cy="17" r="7" fill="#151517" stroke="#d7b45b" strokeWidth="1.6" />
      {/* legs */}
      <path d="M25 54 L21 76 M35 54 L39 76" stroke="#1d1d21" strokeWidth="6" strokeLinecap="round" />
      <path d="M25 54 L21 76 M35 54 L39 76" stroke="#d7b45b" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function Ball() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="pe-ball" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#ece6d6" />
          <stop offset="1" stopColor="#a99f86" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#pe-ball)" stroke="#8f6a26" strokeWidth="1.2" />
      <path d="M20 12 l7 5 -3 8 h-8 l-3 -8z" fill="#141416" />
      <path d="M20 12 V3 M27 17 l8 -3 M24 25 l5 7 M16 25 l-5 7 M13 17 l-8 -3" stroke="#141416" strokeWidth="1.4" />
    </svg>
  );
}

function Scene({ g, ms, lite }: { g: PenaltyGame; ms: number; lite: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const keeper = useRef<HTMLDivElement>(null);
  const net = useRef<HTMLDivElement>(null);
  const played = useRef(0);
  const [hover, setHover] = useState<Zone | null>(null);
  const canShoot = Boolean(g.round) && (g.phase === "aim" || g.phase === "goal");

  // A new round: ball back on the spot, keeper in the middle.
  const roundId = g.round?.id ?? 0;
  useLayoutEffect(() => {
    if (!g.round || g.round.shots.length > 0) return;
    [ball.current, keeper.current, net.current].forEach((el) => el?.getAnimations().forEach((a) => a.cancel()));
  }, [roundId, g.round]);
  // Before the next shot, reset ball and keeper.
  useLayoutEffect(() => {
    if (g.phase !== "goal" && g.phase !== "aim") return;
    const t = window.setTimeout(() => {
      [ball.current, keeper.current, net.current].forEach((el) => el?.getAnimations().forEach((a) => a.cancel()));
    }, 650);
    return () => window.clearTimeout(t);
  }, [g.phase, g.shotId]);

  useEffect(() => {
    const shot = g.lastShot;
    if (!shot || played.current === g.shotId || g.phase !== "shooting") return;
    played.current = g.shotId;
    const el = box.current;
    if (!el || !ball.current || !keeper.current) return;
    [ball.current, keeper.current, net.current].forEach((n) => n?.getAnimations().forEach((a) => a.cancel()));
    const W = el.clientWidth;
    const H = el.clientHeight;
    const [zx, zy] = ZONE_AT[shot.aim];
    // A little scatter inside the zone so no two shots look the same.
    const jx = (Math.random() - 0.5) * (GW / 9);
    const jy = (Math.random() - 0.5) * (GH / 7);
    const dx = ((zx + jx - SPOT[0]) / 100) * W;
    const dy = ((zy + jy - SPOT[1]) / 100) * H;
    const flight = ms * 0.55;
    const curve = shot.aim === "c" ? 0 : (zx < 50 ? -1 : 1) * W * 0.03;
    if (shot.goal) {
      ball.current.animate(
        [
          { transform: "translate(-50%, -50%) scale(1)" },
          { transform: `translate(calc(-50% + ${dx * 0.5 + curve}px), calc(-50% + ${dy * 0.55}px)) scale(0.78)`, offset: 0.45 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.56)`, offset: 0.85 },
          { transform: `translate(calc(-50% + ${dx * 1.02}px), calc(-50% + ${dy * 0.98 - H * 0.01}px)) scale(0.5)` },
        ],
        { duration: flight * 1.15, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)", fill: "forwards" },
      );
      if (net.current && !lite) {
        net.current.style.setProperty("--nx", `${zx}%`);
        net.current.style.setProperty("--ny", `${((zy - GOAL.t) / GH) * 100}%`);
        net.current.animate([{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1)", offset: 0.3 }, { opacity: 0, transform: "scale(1.25)" }], {
          duration: 600,
          delay: flight * 0.85,
          easing: "ease-out",
          fill: "both",
        });
      }
    } else {
      // Saved: the ball meets the gloves and drops away.
      ball.current.animate(
        [
          { transform: "translate(-50%, -50%) scale(1)" },
          { transform: `translate(calc(-50% + ${dx * 0.5 + curve}px), calc(-50% + ${dy * 0.55}px)) scale(0.78)`, offset: 0.42 },
          { transform: `translate(calc(-50% + ${dx * 0.92}px), calc(-50% + ${dy * 0.9}px)) scale(0.6)`, offset: 0.78 },
          { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.55}px)) scale(0.72)` },
        ],
        { duration: flight * 1.35, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)", fill: "forwards" },
      );
    }
    // Keeper: waits a beat, then dives.
    const [kx, ky] = ZONE_AT[shot.dive];
    const side = shot.dive === "c" ? 0 : kx < 50 ? -1 : 1;
    const kdx = ((kx - 50) / 100) * W * 0.82;
    const top = shot.dive === "tl" || shot.dive === "tr";
    const kdy = shot.dive === "c" ? -H * 0.07 : top ? -((KEEPER_FEET - ky) / 100) * H * 0.55 : H * 0.02;
    const rot = side * (top ? 62 : 82);
    keeper.current.animate(
      [
        { transform: "translateX(-50%) rotate(0deg)" },
        { transform: "translateX(-50%) translateY(2%) scale(1.02, 0.96) rotate(0deg)", offset: 0.25 },
        { transform: `translateX(calc(-50% + ${kdx}px)) translateY(${kdy}px) rotate(${rot}deg)` },
      ],
      { duration: flight * 1.05, delay: flight * 0.12, easing: "cubic-bezier(0.25, 0.8, 0.35, 1)", fill: "both" },
    );
  }, [g.shotId, g.lastShot, g.phase, ms, lite]);

  const banner =
    g.phase === "goal" ? (
      <span className="pe-banner is-goal">GOAL</span>
    ) : g.phase === "saved" ? (
      <span className="pe-banner is-saved">SAVED</span>
    ) : g.phase === "cashed" && g.result ? (
      <span className="pe-banner is-cash">
        <small>{g.result.goals === MAX_SHOTS ? "PERFECT FIVE" : "CASHED OUT"}</small>◈ {money(g.result.won)}
      </span>
    ) : null;

  return (
    <div className={`pe-scene ${canShoot ? "can-shoot" : ""} ${g.phase === "shooting" && ms > 1500 ? "is-slow" : ""}`}>
      <div aria-hidden="true" className="pe-lights" />
      {!lite && (g.phase === "goal" || (g.phase === "cashed" && (g.result?.goals ?? 0) > 0)) && (
        <div key={`f-${g.shotId}-${g.phase}`} aria-hidden="true" className="pe-flashes">
          {[8, 17, 26, 35, 64, 73, 82, 91, 13, 87].map((x, i) => (
            <i key={i} style={{ left: `${x}%`, top: `${4 + ((i * 7) % 14)}%`, animationDelay: `${(i * 137) % 700}ms` }} />
          ))}
        </div>
      )}
      <div ref={box} className="pe-field">
        <div aria-hidden="true" className="pe-grass" style={{ top: `${GOAL.b}%` }} />
      {/* Box lines and the spot */}
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pe-lines">
        <path d={`M4 ${GOAL.b + 1} H96`} />
        <path d={`M24 ${GOAL.b + 1} L18 80 H82 L76 ${GOAL.b + 1}`} />
        <path d={`M2 ${GOAL.b + 1} L-8 99 M98 ${GOAL.b + 1} L108 99`} />
      </svg>
      <span aria-hidden="true" className="pe-spot" style={{ left: `${SPOT[0]}%`, top: `${SPOT[1] + 2.8}%` }} />
      {/* Goal */}
      <div className="pe-goal" style={{ left: `${GOAL.l}%`, right: `${100 - GOAL.r}%`, top: `${GOAL.t}%`, bottom: `${100 - GOAL.b}%` }}>
        <div aria-hidden="true" className="pe-net" />
        <div ref={net} aria-hidden="true" className="pe-ripple" />
        <div className="pe-zones" role="group" aria-label="Pick your corner">
          {ZONES.map((z) => (
            <button
              key={z}
              type="button"
              disabled={!canShoot}
              onClick={() => g.shootAt(z)}
              onPointerEnter={() => setHover(z)}
              onPointerLeave={() => setHover((h) => (h === z ? null : h))}
              aria-label={`Shoot ${ZONE_LABEL[z]}`}
              className={`pe-zone pe-zone--${z} ${hover === z ? "is-hover" : ""} ${g.lastShot && g.phase !== "aim" && g.lastShot.aim === z && !canShoot ? "is-last" : ""}`}
            >
              <span className="pe-zone__ring">
                <span className="pe-zone__key">{ZONE_KEY[z]}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Keeper */}
      <div ref={keeper} className="pe-keeper" style={{ bottom: `${100 - KEEPER_FEET}%` }}>
        <Keeper />
      </div>
      {/* Ball */}
      <div ref={ball} className="pe-ball" style={{ left: `${SPOT[0]}%`, top: `${SPOT[1]}%` }}>
        <Ball />
      </div>
      </div>
      {banner && (
        <div key={`${g.phase}-${g.shotId}`} className="pe-banner-wrap">
          {banner}
        </div>
      )}
    </div>
  );
}

/* ───────────── Ladder, shots, history ───────────── */

function ShotDots({ shots, inAir }: { shots: ShotRecord[]; inAir: boolean }) {
  return (
    <div className="pe-dots" aria-label={`Shot ${Math.min(MAX_SHOTS, shots.length + 1)} of ${MAX_SHOTS}`}>
      {Array.from({ length: MAX_SHOTS }, (_, i) => {
        const s = shots[i];
        const now = i === shots.length && inAir;
        return <span key={i} className={`pe-dot ${s ? (s.goal ? "is-goal" : "is-saved") : now ? "is-now" : ""}`} />;
      })}
    </div>
  );
}

function Ladder({ g, horizontal }: { g: PenaltyGame; horizontal: boolean }) {
  const ladder = ladderOf(g.level).map((m, i) => ({ m, k: i + 1 }));
  const steps = horizontal ? ladder : [...ladder].reverse();
  return (
    <ol className={`pe-ladder ${horizontal ? "is-row" : ""}`} aria-label="Multipliers">
      {steps.map(({ m, k }) => {
        const state = g.goals >= k ? "is-done" : g.round && g.goals + 1 === k ? "is-next" : "";
        return (
          <li key={k} className={`pe-step ${state} ${g.goals === k && g.round ? "is-now" : ""}`}>
            <span className="pe-step__n">{horizontal ? `${k}` : `Goal ${k}`}</span>
            <span className="pe-step__m">×{m}</span>
            {!horizontal && <span className="pe-step__v">◈ {compactMoney(Math.floor(g.bet * m))}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function LevelPick({ g }: { g: PenaltyGame }) {
  return (
    <div className="pe-levels mb-2" role="radiogroup" aria-label="Keeper">
      {LEVELS.map((l) => (
        <button key={l.id} type="button" role="radio" aria-checked={g.level === l.id} disabled={Boolean(g.round)} onClick={() => g.setLevel(l.id as Level)} className={`pe-level ${g.level === l.id ? "is-on" : ""}`}>
          <span>{l.label}</span>
          <small className="whitespace-nowrap"><span className="hidden 2xl:inline">{Math.round(l.goal * 100)}% · </span>×{ladderOf(l.id)[MAX_SHOTS - 1]}</small>
        </button>
      ))}
    </div>
  );
}

function History({ items }: { items: RoundRecord[] }) {
  if (!items.length) return <p className="py-6 text-center text-[11px] text-white/40">No round yet — kick off!</p>;
  return (
    <ul className="space-y-1">
      {[...items].reverse().map((r) => {
        const net = r.won - r.bet;
        return (
          <li key={r.id} className="pe-hist">
            <span className="pe-hist__shots">
              {Array.from({ length: r.cashed ? r.goals : r.goals + 1 }, (_, i) => (
                <i key={i} className={i < r.goals ? "is-goal" : "is-saved"} />
              ))}
            </span>
            <span className="flex-1 truncate text-white/60">{r.cashed ? `${r.goals} goal${r.goals > 1 ? "s" : ""} · ×${multiplierAt(r.goals, r.level)}` : `Saved on shot ${r.goals + 1}`}
              {r.level && r.level !== "normal" && <em className="ml-1 not-italic text-[#e5c779]/60">{LEVELS.find((l) => l.id === r.level)?.short}</em>}</span>
            <span className={net > 0 ? "text-[#f0d38b]" : "text-white/35"}>
              {net > 0 ? "+" : "−"}◈ {compactMoney(Math.abs(net))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Today({ g }: { g: PenaltyGame }) {
  const s = useSession().penalty;
  const r = g.records;
  return (
    <div className="grid grid-cols-3 gap-1.5 text-center">
      {(
        [
          ["Rounds", String(s.spins)],
          ["Net today", `${s.net >= 0 ? "+" : "−"}◈ ${compactMoney(Math.abs(s.net))}`],
          ["Best today", `◈ ${compactMoney(Math.max(0, s.biggest))}`],
          ["Goal streak", `${r.streak} · best ${r.bestStreak}`],
          ["Perfect fives", String(r.perfects)],
          ["Record cash", `◈ ${compactMoney(r.bestCash)}`],
        ] as const
      ).map(([l, v]) => (
        <div key={l} className="rounded-lg border border-white/10 bg-black/30 px-1 py-1.5">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/40">{l}</p>
          <p className="truncate text-[12px] font-bold text-[#efe2bd]">{v}</p>
        </div>
      ))}
    </div>
  );
}

function Rules() {
  return (
    <div className="space-y-2 text-[11.5px] leading-relaxed text-white/65">
      <p>Set your stake and kick off: the bet leaves your credit.</p>
      <p>Pick a corner and beat the keeper. Choose him before kick-off: Rookie (62% goals, up to ×10.48), Pro (50%, up to ×30.72) or Legend (40%, up to ×93.75).</p>
      <p>After any goal, cash out or shoot again. A save loses the stake. The fifth goal cashes out on its own.</p>
      <p className="text-white/45">
        Bet ◈ {money(MIN_BET)} – {money(MAX_BET)} · return to player {Math.round(RTP * 100)}% whenever you cash out.
      </p>
      <p className="hidden text-white/40 2xl:block">Keys: Space kick off / cash out · 1–5 corners · X double · H half · F focus</p>
    </div>
  );
}

/* ───────────── Game ───────────── */

export default function Penalty({ active, focus = false, onFocusChange }: { active: boolean; focus?: boolean; onFocusChange?: (v: boolean) => void }) {
  const desktop = useDesktop();
  const ms = desktop ? 1100 : 760;
  const g = usePenalty(active, ms, desktop);
  const [panel, setPanel] = useState<"rounds" | "rules">("rounds");
  const [sheet, setSheet] = useState(false);

  // ---- Focus (instant, like the other games)
  const closeRef = useRef(onFocusChange);
  closeRef.current = onFocusChange;
  const requestFocusExit = () => onFocusChange?.(false);
  useEffect(() => {
    if (!focus) return;
    const root = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    const prevGutter = root.style.scrollbarGutter;
    document.body.style.overflow = "hidden";
    root.style.scrollbarGutter = "auto";
    (document.activeElement as HTMLElement | null)?.blur?.();
    const wasFullscreen = Boolean(document.fullscreenElement);
    const cancelFs = isNarrowScreen() ? () => {} : requestFullscreenSettled(() => {});
    let entered = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered && !wasFullscreen) closeRef.current?.(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector("[role=dialog][aria-modal=true]")) closeRef.current?.(false);
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

  const inRound = Boolean(g.round);
  const shooting = g.phase === "shooting";
  const canCash = inRound && g.goals > 0 && !shooting;
  const shootRandom = () => g.shootAt(ZONES[Math.floor(Math.random() * ZONES.length)]);
  const main = () => (!inRound ? g.kickOff() : canCash ? g.cashOut() : undefined);
  const mainLabel = shooting ? "…" : !inRound ? "Kick off" : canCash ? "Cash out" : "Aim";
  const mainSub = shooting ? "Shot" : !inRound ? `◈ ${compactMoney(g.bet)}` : canCash ? `◈ ${compactMoney(g.cashValue)}` : "Tap goal";
  const mainReady = !shooting && (!inRound || canCash);
  const lastWin = g.result?.won ?? 0;

  const messageLine = (
    <p key={g.refused} className={`rl-message truncate ${g.refused ? "rl-shake" : ""}`} role="status">
      {g.message}
    </p>
  );
  const chips = (cls: string) =>
    PENALTY_CHIPS.map((v) => (
      <button
        key={v}
        type="button"
        role="radio"
        aria-checked={!inRound && g.bet === v}
        aria-label={`Bet ${v}`}
        disabled={inRound}
        onClick={() => g.setChip(v)}
        className={`rl-chip-pick relative aspect-square shrink-0 rounded-full ${cls} ${!inRound && g.bet === v ? "is-selected" : ""}`}
      >
        <ChipFace value={v} />
      </button>
    ));
  const key = (label: ReactNode, onClick: () => void, disabled: boolean, aria: string, extra = "") => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={aria} className={`rl-key ${extra}`}>
      {label}
    </button>
  );
  const windows: [string, number, boolean][] = [
    ["Credit", g.balance, false],
    [inRound ? "Stake" : "Bet", g.bet, false],
    [inRound ? "Cash value" : "Last win", inRound ? g.cashValue : lastWin, inRound ? g.cashValue > 0 : lastWin > 0],
  ];

  const frame = (lite: boolean) =>
    `rl-root pe-root ${lite ? "m-lite" : ""} ${focus ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black" : lite ? "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[500px]" : "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[540px] lg:h-[calc(100dvh-10rem)]"}`;

  // ---- PC
  if (desktop) {
    return (
      <div data-theme="carbon" className={frame(false)}>
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
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,min(26%,19rem))_minmax(0,1fr)] gap-5 px-6 pb-4 pt-5">
            <aside className="flex min-h-0 flex-col gap-3">
              <div className="rl-plaque mx-auto flex flex-col items-center px-7 py-2 text-center">
                <span className="font-display gold-text text-[20px] font-bold tracking-[0.32em]">PENALTY</span>
                <span className="text-[9px] font-bold tracking-[0.35em] text-white/45">SCORE · RAISE · CASH OUT</span>
              </div>
              <div className="rl-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="rl-eyebrow !text-[9px]">Multiplier</p>
                  <ShotDots shots={g.round?.shots ?? []} inAir={shooting || (inRound && !shooting)} />
                </div>
                <LevelPick g={g} />
                <Ladder g={g} horizontal={false} />
              </div>
              <div className="rl-card flex min-h-0 flex-1 flex-col p-3">
                <div className="rl-tabs !grid-cols-2" role="tablist">
                  {(
                    [
                      ["rounds", "Rounds"],
                      ["rules", "Rules"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={panel === id} onClick={() => setPanel(id)} className={`rl-tab ${panel === id ? "is-on" : ""}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  {panel === "rounds" ? (
                    <div className="space-y-2.5">
                      <Today g={g} />
                      <History items={g.history} />
                    </div>
                  ) : (
                    <Rules />
                  )}
                </div>
              </div>
            </aside>
            <div className="flex min-h-0 flex-col gap-3">
              <div className={`flex items-center justify-between gap-3 ${focus ? "pr-24" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="rl-announce max-w-full">{messageLine}</div>
                </div>
                <p className="hidden shrink-0 text-[11px] text-[#e9d9a9]/60 xl:block">Next goal pays ◈ {money(g.nextValue)}</p>
              </div>
              <div className="min-h-0 flex-1">
                <Scene g={g} ms={g.shotTime} lite={false} />
              </div>
              <div className="rl-console rl-console--pc grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-3 xl:gap-x-4 xl:p-3.5">
                <div className="grid grid-cols-3 gap-2 xl:gap-2.5">
                  {windows.map(([label, value, hot]) => (
                    <div key={label} className={`rl-window ${hot ? "is-hot" : ""}`}>
                      <span className="rl-window__label">{label}</span>
                      <span className="rl-window__value">
                        <span className="rl-window__cur">◈</span>
                        <Counter value={value} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="row-span-3 flex items-center justify-center">
                  <button type="button" onClick={main} disabled={!mainReady} aria-label={mainLabel} className={`rl-round-spin ${mainReady ? "is-ready" : ""} ${shooting ? "is-spinning" : ""}`}>
                    <span aria-hidden="true" className="rl-round-spin__crown" />
                    <span aria-hidden="true" className="rl-round-spin__sheen" />
                    <span className="rl-round-spin__dome">
                      <span className="rl-round-spin__label !text-[13px]">{mainLabel}</span>
                      <span className="rl-round-spin__sub">{mainSub}</span>
                    </span>
                  </button>
                </div>
                <div className="rl-tray min-w-0">
                  <div className="flex items-center justify-center gap-1 xl:gap-1.5" role="radiogroup" aria-label="Bet">
                    {chips("w-[clamp(1.7rem,2.5vw,2.55rem)]")}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {key(<>½<Kbd k="H" /></>, g.half, inRound, "Half the bet")}
                  {key(<>2×<Kbd k="X" /></>, g.double, inRound, "Double the bet")}
                  {key("Random corner", shootRandom, !inRound || shooting, "Shoot a random corner", inRound && !shooting ? "is-hot" : "")}
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
    <div data-theme="carbon" className={frame(true)}>
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
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <Ladder g={g} horizontal />
            </div>
            <button
              type="button"
              disabled={inRound}
              onClick={() => g.setLevel(LEVELS[(LEVELS.findIndex((l) => l.id === g.level) + 1) % LEVELS.length].id)}
              className="rl-icon-key !w-auto px-2 text-[9px] font-bold uppercase tracking-[0.1em] disabled:opacity-50"
              aria-label={`Keeper: ${g.level}. Tap to change`}
            >
              {LEVELS.find((l) => l.id === g.level)?.short}
            </button>
            <button type="button" onClick={() => setSheet(true)} className="rl-icon-key" aria-label="Rounds and rules">
              ☰
            </button>
          </div>
          <div className="mb-1 flex h-5 items-center justify-center gap-2">
            <ShotDots shots={g.round?.shots ?? []} inAir={inRound} />
            {messageLine}
          </div>
          <div className="min-h-0 flex-1">
            <Scene g={g} ms={g.shotTime} lite />
          </div>
        </div>
        <div className="rl-console px-2 pb-2 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}>
          <ChipRow bet={g.bet}>{chips("w-[2.55rem] snap-center")}</ChipRow>
          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_5.75rem] gap-1.5">
            <div className="grid grid-cols-3 gap-1">
              {windows.map(([label, value, hot]) => (
                <div key={label} className={`rl-window rl-window--sm ${hot ? "is-hot" : ""}`}>
                  <span className="rl-window__label">{label === "Cash value" ? "Cash" : label}</span>
                  <span className="rl-window__value">
                    <span className="rl-window__cur">◈</span>
                    {compactMoney(value)}
                  </span>
                </div>
              ))}
            </div>
            <button type="button" onClick={main} disabled={!mainReady} className={`rl-spin row-span-2 ${mainReady ? "is-ready" : ""} ${shooting ? "is-spinning" : ""}`}>
              <span className="whitespace-nowrap text-[12px] !tracking-[0.06em]">{mainLabel.toUpperCase()}</span>
              <span className="text-[9px] font-black tracking-[0.12em] opacity-60">{mainSub}</span>
            </button>
            <div className="grid grid-cols-3 gap-1">
              {key("½", g.half, inRound, "Half the bet")}
              {key("2×", g.double, inRound, "Double the bet")}
              {key("Random", shootRandom, !inRound || shooting, "Shoot a random corner", inRound && !shooting ? "is-hot" : "")}
            </div>
          </div>
        </div>
      </section>
      {sheet && <Sheet g={g} onClose={() => setSheet(false)} />}
    </div>
  );
}

function ChipRow({ bet, children }: { bet: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>("[aria-checked=true]");
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [bet]);
  return (
    <div ref={ref} className="rl-chip-scroll" role="radiogroup" aria-label="Bet">
      {children}
    </div>
  );
}

function Sheet({ g, onClose }: { g: PenaltyGame; onClose: () => void }) {
  const [tab, setTab] = useState<"rounds" | "rules">("rounds");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div role="dialog" aria-modal="true" aria-label="Penalty panels" className="rl-sheet absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col">
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="rl-tabs !grid-cols-2 flex-1" role="tablist">
            {(
              [
                ["rounds", "Rounds"],
                ["rules", "Rules"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rl-tab ${tab === id ? "is-on" : ""}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="rl-icon-key" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
          {tab === "rounds" ? (
            <div className="space-y-2.5">
              <Today g={g} />
              <History items={g.history} />
            </div>
          ) : (
            <Rules />
          )}
        </div>
      </div>
    </div>
  );
}
