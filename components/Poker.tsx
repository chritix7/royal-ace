"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import PlayingCard from "./PlayingCard";
import { handOdds, type HandOdds } from "../lib/pokerOdds";
import { hint as hintOf, settle as settleHand } from "../lib/poker";
import { ChipFace, TableChip } from "./ChipButton";
import { Counter } from "./ui";
import { money } from "../lib/game";
import type { Card } from "../lib/blackjack";
import { ANTE_MAX, ANTE_MIN, ANTE_PAYS, BONUS_MAX, BONUS_PAYS, type Settlement } from "../lib/poker";
import { POKER_CHIPS, usePoker, type HandRecord, type PokerGame, type Spot } from "../lib/usePoker";
import { exitFullscreenSettled, isNarrowScreen, requestFullscreenSettled, whenViewportStable } from "../lib/fullscreen";
import { useSession } from "../lib/sessionStore";
import { useEco } from "../lib/motion";

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

const BACK: [string, string] = ["#121315", "#24262a"];
const same = (a: Card, b: Card) => a.rank === b.rank && a.suit === b.suit;
function compactMoney(v: number) {
  if (v < 10000) return money(v);
  if (v < 1000000) return `${Math.round(v / 100) / 10}K`.replace(".0K", "K");
  return `${Math.round(v / 100000) / 10}M`.replace(".0M", "M");
}
const Kbd = ({ k }: { k: string }) => <kbd className="rl-kbd hidden 2xl:inline-flex">{k}</kbd>;

/** One card place on the felt: an engraved slot, the card dealt into it. */
function Seat({ card, shown, open, best, dim, delay = 0 }: { card?: Card; shown: boolean; open: boolean; best?: boolean; dim?: boolean; delay?: number }) {
  return (
    <div className="pk-slot relative h-[var(--bj-card-h)] w-[calc(var(--bj-card-h)*0.72)] shrink-0">
      {card && shown && (
        <div className={`pk-card-in absolute inset-0 ${best ? "is-best" : ""} ${dim ? "is-dim" : ""}`} style={{ animationDelay: `${delay}ms` }}>
          <PlayingCard card={card} faceDown={!open} fit animated={false} back={BACK} flipDurationMs={560} />
        </div>
      )}
    </div>
  );
}

/** Bet circle on the felt, with its chip stack. */
function BetSpot({ g, spot, label, sub, amount, onClick, hot, small }: { g: PokerGame; spot: Spot | "call"; label: string; sub: string; amount: number; onClick?: () => void; hot?: boolean; small?: boolean }) {
  const can = Boolean(onClick) && (g.phase === "betting" || g.phase === "result");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!can}
      aria-label={`${label}${amount ? ` · ◈ ${money(amount)}` : ""}`}
      className={`pk-spot pk-spot--${spot} ${small ? "is-small" : ""} ${hot ? "is-hot" : ""} ${can ? "is-live" : ""}`}
    >
      <span className="pk-spot__ring" aria-hidden="true" />
      <span className="pk-spot__label">{label}</span>
      {amount > 0 ? (
        <span key={amount} className="pk-spot__chip">
          <TableChip amount={amount} />
        </span>
      ) : (
        <span className="pk-spot__sub">{sub}</span>
      )}
    </button>
  );
}

/** "Flush, Ace high" under a hand, with a state colour. */
function HandTag({ text, tone }: { text: string | null; tone?: "win" | "lose" | "push" | "muted" }) {
  if (!text) return <span className="pk-tag invisible">·</span>;
  return <span className={`pk-tag ${tone ? `is-${tone}` : ""}`}>{text}</span>;
}

/** The verdict across the board for a moment after the showdown. */
function Verdict({ s, bets }: { s: Settlement; bets: { ante: number; bonus: number } }) {
  const net = s.returned - s.staked;
  const big = net >= bets.ante * 10;
  const folded = s.outcome === "fold";
  const title = folded ? "FOLDED" : s.outcome === "push" ? "PUSH" : s.outcome === "lose" ? "DEALER WINS" : big ? "BIG WIN" : "YOU WIN";
  const sub =
    s.outcome === "noQualify"
      ? "Dealer doesn't qualify · Call pushes"
      : folded
        ? s.bonusBack
          ? "AA Bonus still pays"
          : "Ante lost"
        : `${s.player.name} vs ${s.dealer.name}`;
  return (
    <div className="pk-verdict pointer-events-none absolute inset-0 z-30 flex items-center justify-center" role="status">
      <div className={`pk-verdict__card ${net > 0 ? "is-win" : ""}`}>
        <p className="text-[9px] font-black tracking-[0.3em] text-white/50 lg:text-[10px]">{sub.toUpperCase()}</p>
        <p className={`font-display text-[22px] font-bold tracking-[0.1em] lg:text-3xl ${net > 0 ? "gold-text" : "text-white/85"}`}>
          {title}
          {s.returned > 0 && <span className="ml-3">◈ {money(s.returned)}</span>}
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-1.5">
          <Piece label="Ante" net={s.anteBack - bets.ante} />
          {!folded && <Piece label="Call" net={s.callBack - bets.ante * 2} />}
          {bets.bonus > 0 && <Piece label="AA Bonus" net={s.bonusBack - bets.bonus} />}
        </div>
      </div>
    </div>
  );
}
function Piece({ label, net }: { label: string; net: number }) {
  return (
    <span className={`pk-piece ${net > 0 ? "is-up" : net < 0 ? "is-down" : ""}`}>
      {label} {net > 0 ? `+${compactMoney(net)}` : net < 0 ? `−${compactMoney(-net)}` : "push"}
    </span>
  );
}

/** Ante and AA Bonus paytables; the hand being played lights up. */
function Paytable({ g }: { g: PokerGame }) {
  const anteCat = g.called && g.result ? g.result.player.cat : g.playerHand?.cat ?? -1;
  const anteRow = anteCat < 0 ? -1 : ANTE_PAYS.findIndex((r) => (anteCat <= 4 ? r.cat === 4 : r.cat === anteCat));
  const bonusKey = g.bonusNow?.key ?? null;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div>
        <p className="rl-eyebrow mb-1 !text-[9px]">Ante pays</p>
        <ul className="space-y-[3px]">
          {ANTE_PAYS.map((r, i) => (
            <li key={r.cat} className={`pk-pay ${i === anteRow ? "is-on" : ""}`}>
              <span className="truncate">{r.label}</span>
              <span className="font-mono">{r.pays}:1</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[9.5px] leading-snug text-white/40">Call pays 1:1. Dealer qualifies with a pair of 4s or better.</p>
      </div>
      <div>
        <p className="rl-eyebrow mb-1 !text-[9px]">AA Bonus</p>
        <ul className="space-y-[3px]">
          {BONUS_PAYS.map((r) => (
            <li key={r.key} className={`pk-pay ${r.key === bonusKey ? "is-on" : ""}`}>
              <span className="truncate">{r.label}</span>
              <span className="font-mono">{r.pays}:1</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const MiniCard = ({ c }: { c: Card }) => (
  <span className={`pk-mini ${c.suit === "♥" || c.suit === "♦" ? "is-red" : ""}`}>
    {c.rank}
    {c.suit}
  </span>
);

/** Replays open from any hand in the list (a module-level setter keeps the props simple). */
let openReplay: ((h: HandRecord) => void) | null = null;

function HistoryList({ items, max }: { items: HandRecord[]; max?: number }) {
  const list = [...items].reverse().slice(0, max ?? items.length);
  if (!list.length) return <p className="py-3 text-center text-[11px] text-white/35">Your hands will show here.</p>;
  return (
    <ul className="space-y-1">
      {list.map((h) => {
        const net = h.returned - h.staked;
        return (
          <li key={h.id + "-" + h.at} onClick={() => openReplay?.(h)} title="Replay this hand" className="pk-hist flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.05] bg-black/25 px-2 py-1">
            <span className="flex shrink-0 gap-0.5">
              {h.player.map((c, i) => (
                <MiniCard key={i} c={c} />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate text-[10.5px] text-white/60">
              {h.called ? `${h.playerName} · ${h.outcome === "noQualify" ? "dealer NQ" : h.dealerName}` : "Folded"}
            </span>
            <span className={`shrink-0 font-mono text-[11px] font-bold ${net > 0 ? "text-emerald-300" : net < 0 ? "text-red-300/80" : "text-white/50"}`}>
              {net > 0 ? "+" : net < 0 ? "−" : ""}
              {compactMoney(Math.abs(net))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function StatsBlock({ g }: { g: PokerGame }) {
  const session = useSession();
  const today = session.poker;
  const h = g.history;
  const played = h.filter((x) => x.called);
  const wins = played.filter((x) => x.outcome === "win" || x.outcome === "noQualify").length;
  const folds = h.length - played.length;
  const best = g.best >= 0 ? ["High card", "Pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush", "Royal flush"][g.best] : "—";
  const cell = (label: string, value: ReactNode) => (
    <div className="rounded-lg border border-white/[0.05] bg-black/25 px-2 py-1.5">
      <p className="text-[8.5px] font-black tracking-[0.2em] text-[#d7b45b]/70">{label}</p>
      <p className="truncate font-mono text-[12.5px] font-bold text-white/85">{value}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {cell("TODAY", `${today?.spins ?? 0} hands`)}
      {cell("TODAY NET", `${(today?.net ?? 0) >= 0 ? "+" : "−"}${compactMoney(Math.abs(today?.net ?? 0))}`)}
      {cell("WIN RATE", played.length ? `${Math.round((wins / played.length) * 100)}%` : "—")}
      {cell("FOLDED", h.length ? `${Math.round((folds / h.length) * 100)}%` : "—")}
      <div className="col-span-2">{cell("BEST HAND", best)}</div>
    </div>
  );
}

function Rules() {
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-white/70">
      <p>
        <b className="text-[#f0d38b]">Casino Hold&apos;em</b> is Texas Hold&apos;em against the dealer. Place an Ante (◈ {ANTE_MIN} to ◈ {money(ANTE_MAX)}), and if you
        like the AA Bonus (up to ◈ {money(BONUS_MAX)}).
      </p>
      <p>You and the dealer get two cards, then the flop. Call with twice your Ante to see the turn and the river, or fold and lose the Ante.</p>
      <p>
        The dealer needs a <b>pair of 4s or better</b> to qualify. If not, the Ante pays the table and the Call is returned. If the dealer qualifies, the best
        five cards win: the Ante pays the table and the Call 1:1. A tie returns everything.
      </p>
      <p>The AA Bonus is paid on your two cards and the flop (pair of aces or better), even if you fold.</p>
      <p className="text-white/45">Keys: Space deal / call · D fold · R rebet · X double · U undo · C clear · H hint · 1–9, 0 chips.</p>
    </div>
  );
}

function Sheet({ g, tab, setTab, onClose }: { g: PokerGame; tab: SheetTab; setTab: (t: SheetTab) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tabs: [SheetTab, string][] = [
    ["pay", "Paytable"],
    ["hands", "Hands"],
    ["stats", "Stats"],
    ["rules", "Rules"],
  ];
  return (
    <div className="fixed inset-0 z-[80]">
      <button aria-label="Close" className="backdrop-in absolute inset-0 cursor-default bg-black/55" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Casino Hold'em panels" className="rl-sheet absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col">
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
        <div className="min-h-0 flex-1 overflow-y-auto px-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.9rem)" }}>
          {tab === "pay" && <Paytable g={g} />}
          {tab === "hands" && <HistoryList items={g.history} />}
          {tab === "stats" && <StatsBlock g={g} />}
          {tab === "rules" && <Rules />}
        </div>
      </div>
    </div>
  );
}
type SheetTab = "pay" | "hands" | "stats" | "rules";

/* ───────────── Hand odds (optional) and hand replay ───────────── */

function useOddsSwitch() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem("royalace:poker-odds") === "on");
    } catch {}
  }, []);
  const toggle = () =>
    setOn((v) => {
      try {
        localStorage.setItem("royalace:poker-odds", v ? "off" : "on");
      } catch {}
      return !v;
    });
  return [on, toggle] as const;
}

/** Odds at the decision, worked out just after the flop is shown. */
function useHandOdds(player: Card[] | undefined, flop: Card[] | undefined, on: boolean) {
  const [odds, setOdds] = useState<HandOdds | null>(null);
  const key = player && flop && flop.length === 3 ? [...player, ...flop].map((c) => c.rank + c.suit).join(",") : "";
  useEffect(() => {
    setOdds(null);
    if (!on || !key || !player || !flop) return;
    const t = window.setTimeout(() => setOdds(handOdds(player, flop, window.matchMedia("(min-width: 1024px)").matches ? 1600 : 900)), 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, on]);
  return odds;
}
const pct = (x: number) => `${Math.round(x * 100)}%`;
const OddsBadge = ({ odds }: { odds: HandOdds | null }) =>
  odds ? (
    <span className={`pk-hint pk-odds ${odds.callEv > -1 ? "is-call" : "is-fold"}`} title={`Over ${odds.samples} simulated run-outs. Folding costs 1 Ante; calling is worth ${odds.callEv.toFixed(2)} Ante on average.`}>
      Win {pct(odds.win)} · Tie {pct(odds.tie)} · Call {odds.callEv >= 0 ? "+" : ""}
      {odds.callEv.toFixed(2)}
    </span>
  ) : (
    <span className="pk-hint is-off">Odds…</span>
  );

function Replay({ h, onClose }: { h: HandRecord; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing || step >= 3) return;
    const t = window.setTimeout(() => setStep((x) => x + 1), 1400);
    return () => window.clearTimeout(t);
  }, [playing, step]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const flop = h.board.slice(0, 3);
  const advice = hintOf(h.player, flop);
  const odds = useMemo(() => handOdds(h.player, flop, 900), [h]);
  const st = useMemo(() => settleHand({ ante: h.ante, bonus: h.bonus }, h.called, h.player, h.dealer, h.board), [h]);
  const net = h.returned - h.staked;
  const board = step >= 2 ? h.board : step >= 1 ? flop : [];
  const steps = ["Your cards", "The flop · decision", "Turn and river", "Showdown"];
  const row = (cards: Card[], hidden = 0) => (
    <div className="flex justify-center gap-1">
      {cards.map((c, i) => (
        <span key={i} className={`pk-rcard ${c.suit === "♥" || c.suit === "♦" ? "is-red" : ""}`}>
          {c.rank}
          <small>{c.suit}</small>
        </span>
      ))}
      {Array.from({ length: hidden }, (_, i) => (
        <span key={`h${i}`} className="pk-rcard is-back" />
      ))}
    </div>
  );
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Hand replay">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="rl-sheet relative w-full max-w-md rounded-3xl p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="rl-eyebrow !text-[9px]">Hand replay · {steps[step]}</p>
          <button type="button" onClick={onClose} className="rl-icon-key" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Dealer</p>
        {step >= 3 ? row(h.dealer) : row([], 2)}
        <div className="my-3">{row(board, 5 - board.length)}</div>
        {row(h.player)}
        <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">You</p>
        <div className="mt-3 min-h-[3.5rem] rounded-xl bg-black/30 px-3 py-2 text-center text-[12px] text-white/75">
          {step === 0 && <>Ante ◈ {money(h.ante)}{h.bonus ? ` · AA Bonus ◈ ${money(h.bonus)}` : ""}</>}
          {step === 1 && (
            <>
              You {h.called ? "called" : "folded"} · hint said <b className={advice === "call" ? "text-emerald-300" : "text-red-300"}>{advice}</b>
              <span className="mt-0.5 block text-[11px] text-white/45">
                Win {pct(odds.win)} · Tie {pct(odds.tie)} · Call worth {odds.callEv.toFixed(2)} Ante (fold −1)
              </span>
            </>
          )}
          {step === 2 && <>Your hand: {st.player.name}</>}
          {step === 3 && (
            <>
              {h.called ? `${st.player.name} vs ${st.dealer.name}${st.dealerQualifies ? "" : " (no qualify)"}` : "Folded"}
              <span className={`mt-0.5 block font-mono text-[13px] font-bold ${net > 0 ? "text-emerald-300" : net < 0 ? "text-red-300" : "text-white/60"}`}>
                {net > 0 ? "+" : net < 0 ? "−" : ""}◈ {money(Math.abs(net))}
              </span>
            </>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button type="button" className="rl-key" disabled={step === 0} onClick={() => { setPlaying(false); setStep((x) => Math.max(0, x - 1)); }}>
            ◂ Back
          </button>
          <button type="button" className="rl-key is-on" onClick={() => { if (step >= 3) setStep(0); setPlaying((p) => step >= 3 || !p); }}>
            {step >= 3 ? "Again" : playing ? "Pause" : "Play"}
          </button>
          <button type="button" className="rl-key" disabled={step >= 3} onClick={() => { setPlaying(false); setStep((x) => Math.min(3, x + 1)); }}>
            Next ▸
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Poker({ active, focus = false, onFocusChange }: { active: boolean; focus?: boolean; onFocusChange?: (v: boolean) => void }) {
  const g = usePoker(active);
  const [oddsOn, toggleOdds] = useOddsSwitch();
  const handOddsNow = useHandOdds(g.phase === "decision" ? g.hand?.player : undefined, g.phase === "decision" ? g.hand?.board.slice(0, 3) : undefined, oddsOn);
  const [replay, setReplay] = useState<HandRecord | null>(null);
  useEffect(() => {
    openReplay = setReplay;
    return () => {
      openReplay = null;
    };
  }, []);
  const desktop = useDesktop();
  const eco = useEco();
  const [sheet, setSheet] = useState<SheetTab | null>(null);
  const [panel, setPanel] = useState<"pay" | "hands" | "stats" | "rules">("pay");

  // The verdict shows for a moment after each showdown.
  const [verdict, setVerdict] = useState(false);
  useEffect(() => {
    if (g.phase !== "result" || !g.result) {
      setVerdict(false);
      return;
    }
    setVerdict(true);
    const t = window.setTimeout(() => setVerdict(false), 2600);
    return () => window.clearTimeout(t);
  }, [g.phase, g.handId, g.result]);

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

  // ---- What the table shows
  const h = g.hand;
  const d = g.dealt;
  const res = g.phase === "result" ? g.result : null;
  const winnerBest = res && res.outcome !== "fold" ? (res.outcome === "lose" ? res.dealer.best : res.outcome === "push" ? null : res.player.best) : null;
  const isBest = (c?: Card) => Boolean(c && winnerBest?.some((b) => same(b, c)));
  const dimOthers = Boolean(winnerBest);
  const playerTone = res ? (res.outcome === "win" || res.outcome === "noQualify" ? "win" : res.outcome === "push" ? "push" : "lose") : undefined;
  const dealerTone = res && res.outcome !== "fold" ? (res.outcome === "lose" ? "win" : res.outcome === "push" ? "push" : "muted") : undefined;
  const dealerLine = g.dealerHand ? `${g.dealerHand.name}${res && !res.dealerQualifies ? " · no qualify" : ""}` : null;
  const playerLine = g.playerHand ? g.playerHand.name : null;

  const hintBadge =
    g.phase === "decision" && g.hintOn && g.advice ? (
      <span className={`pk-hint ${g.advice === "call" ? "is-call" : "is-fold"}`}>Hint · {g.advice === "call" ? "Call" : "Fold"}</span>
    ) : null;
  const bonusBadge =
    g.bonusNow && g.bets.bonus > 0 ? (
      <span className={`pk-hint ${g.bonusNow.pays ? "is-call" : "is-off"}`}>{g.bonusNow.pays ? `AA Bonus · ${g.bonusNow.pays}:1` : "AA Bonus · no"}</span>
    ) : null;

  const seat = (c: Card | undefined, shown: boolean, open: boolean) => (
    <Seat card={c} shown={shown} open={open} best={isBest(c)} dim={dimOthers && !isBest(c)} />
  );
  const dealerCards = (
    <div className="flex gap-2">
      {seat(h?.dealer[0], d >= 2, g.dealerOpen)}
      {seat(h?.dealer[1], d >= 4, g.dealerOpen)}
    </div>
  );
  const boardCards = (
    <div className="relative flex gap-1.5 lg:gap-2.5">
      {!h && (
        <span className="pk-idle" aria-hidden="true">
          {g.bets.ante > 0 || g.lastBets.ante > 0 ? "Ready · press Deal" : "Tap Ante to bet · then Deal"}
        </span>
      )}
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i}>{seat(h?.board[i], d >= 5 + i, true)}</span>
      ))}
    </div>
  );
  const playerCards = (
    <div className="flex gap-2">
      {seat(h?.player[0], d >= 1, true)}
      {seat(h?.player[1], d >= 3, true)}
    </div>
  );
  const spots = (
    <div className="flex items-end gap-1.5 xl:gap-2.5">
      <BetSpot g={g} spot="bonus" label="AA" sub="Bonus" amount={g.bets.bonus} onClick={() => g.place("bonus")} small hot={Boolean(res && res.bonusBack)} />
      <BetSpot g={g} spot="ante" label="Ante" sub={`min ${ANTE_MIN}`} amount={g.bets.ante} onClick={() => g.place("ante")} hot={Boolean(res && res.anteBack > g.bets.ante)} />
      <BetSpot g={g} spot="call" label="Call" sub="2× ante" amount={g.callStake} hot={Boolean(res && res.callBack > g.callStake)} />
    </div>
  );
  const oddsBadge = g.phase === "decision" && oddsOn ? <OddsBadge odds={handOddsNow} /> : null;
  const badges = (
    <div className="flex min-h-5 flex-wrap items-center justify-center gap-1.5 lg:justify-end">
      {hintBadge}
      {oddsBadge}
      {bonusBadge}
    </div>
  );
  // Card height: as big as the felt allows (three rows of cards, five across).
  const cardH = desktop
    ? "min(8.6rem, calc((100cqh - 4.6rem) / 3), calc((100cqw - 16rem) / 3.9))"
    : "max(44px, min(84px, calc((100cqh - 7rem) / 3), calc((100cqw - 2.2rem) / 3.75), calc((100cqw - 13rem) / 1.55)))";
  const row = "grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 xl:gap-6";
  const table = (
    <div className="pk-felt relative h-full min-h-0 overflow-hidden">
      <div className="relative flex h-full flex-col items-center justify-evenly px-3 py-2.5 lg:px-6 lg:py-4" style={{ "--bj-card-h": cardH } as CSSProperties}>
        {desktop ? (
          <>
            <div className={row}>
              <span className="pk-eyebrow justify-self-end">Dealer</span>
              {dealerCards}
              <div className="justify-self-start">
                <HandTag text={dealerLine} tone={dealerTone} />
              </div>
            </div>
            <div className={row}>
              <p className="pk-arc hidden justify-self-end text-right xl:block">
                Dealer qualifies
                <br />
                pair of 4s or better
              </p>
              <div className="col-start-2 row-start-1">{boardCards}</div>
              <p className="pk-arc col-start-3 row-start-1 hidden justify-self-start xl:block">
                AA Bonus pays
                <br />
                up to 100 to 1
              </p>
            </div>
            <div className={row}>
              <div className="flex flex-col items-end gap-1.5 justify-self-end">
                <HandTag text={playerLine} tone={playerTone} />
                {badges}
              </div>
              {playerCards}
              <div className="justify-self-start">{spots}</div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1">
              {dealerCards}
              <HandTag text={dealerLine} tone={dealerTone} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="pk-arc">Dealer qualifies with 4s or better</p>
              {boardCards}
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex max-w-full items-center gap-1.5 overflow-hidden">
                <HandTag text={playerLine} tone={playerTone} />
                {hintBadge}
                {oddsBadge}
                {g.bonusNow?.pays ? bonusBadge : null}
              </div>
              <div className="flex items-center gap-3">
                {playerCards}
                {spots}
              </div>
            </div>
          </>
        )}
      </div>
      {res && verdict && <Verdict key={g.handId} s={res} bets={g.bets} />}
    </div>
  );

  // ---- Console
  const won = res ? res.returned : 0;
  const deciding = g.phase === "decision";
  const busy = g.phase === "dealing" || g.phase === "showdown";
  const rebetDeal = g.bets.ante === 0 && g.lastBets.ante > 0;
  const key = (label: ReactNode, onClick: () => void, disabled: boolean, aria: string, extra = "") => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={aria} className={`rl-key ${extra}`}>
      {label}
    </button>
  );
  const betKeys = (
    <>
      {key(<>Undo<Kbd k="U" /></>, g.undo, !g.canUndo, "Undo")}
      {key(<>Clear<Kbd k="C" /></>, g.clear, busy || deciding || (g.bets.ante === 0 && g.bets.bonus === 0), "Clear bets")}
      {key(<>Rebet<Kbd k="R" /></>, g.rebet, busy || deciding || g.lastBets.ante === 0, "Rebet")}
      {key(<>×2<Kbd k="X" /></>, g.double, busy || deciding || g.bets.ante === 0, "Double bets")}
    </>
  );
  const decisionKeys = (
    <div className="grid w-full grid-cols-2 gap-2">
      <button type="button" onClick={g.fold} className={`pk-act pk-act--fold ${g.hintOn && g.advice === "fold" ? "is-advised" : ""}`}>
        <span>Fold</span>
        <small>lose ◈ {compactMoney(g.bets.ante)} ante</small>
      </button>
      <button type="button" onClick={g.call} className={`pk-act pk-act--call ${g.hintOn && g.advice === "call" ? "is-advised" : ""}`}>
        <span>Call</span>
        <small>◈ {compactMoney(g.bets.ante * 2)}</small>
      </button>
    </div>
  );
  const chips = (cls: string) =>
    POKER_CHIPS.map((v, i) => (
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
  const net = res ? res.returned - res.staked : null;

  const pcConsole = (
    <div className="rl-console rl-console--pc grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-3 xl:gap-x-4 xl:p-3.5">
      <div className="grid grid-cols-3 gap-2 xl:gap-2.5">
        {(
          [
            ["Credit", g.balance, false],
            ["Total bet", g.staked, false],
            [g.phase === "result" ? "Win" : "Last win", won, won > 0],
          ] as const
        ).map(([label, value, hot], i) => (
          <div key={label} className={`rl-window ${hot ? "is-hot" : ""}`}>
            <span className="rl-window__label">{label}</span>
            <span key={hot ? `w-${g.handId}` : label} className={`rl-window__value ${hot ? "meter-hit" : ""}`}>
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
      <div className="row-span-3 flex items-center justify-center">
        <button
          type="button"
          onClick={() => (deciding ? g.call() : g.deal())}
          disabled={busy || (!deciding && !g.canDeal)}
          aria-label={deciding ? "Call" : "Deal"}
          className={`rl-round-spin ${(deciding || g.canDeal) && !busy ? "is-ready" : ""} ${busy ? "is-spinning" : ""}`}
        >
          <span aria-hidden="true" className="rl-round-spin__crown" />
          <span aria-hidden="true" className="rl-round-spin__sheen" />
          <span className="rl-round-spin__dome">
            <span className="rl-round-spin__label">{busy ? "…" : deciding ? "Call" : rebetDeal ? "Rebet" : "Deal"}</span>
            <span className="rl-round-spin__sub">{busy ? "Dealing" : deciding ? `◈ ${compactMoney(g.bets.ante * 2)}` : rebetDeal ? "& deal" : "Space"}</span>
          </span>
        </button>
      </div>
      <div className="relative row-span-2 grid min-w-0 gap-y-2">
        <div className={`contents ${deciding ? "[&>*]:invisible" : ""}`}>
          <div className="rl-tray min-w-0">
            <div className="flex items-center justify-center gap-1 xl:gap-1.5" role="radiogroup" aria-label="Chip value">
              {chips("w-[clamp(1.6rem,2.35vw,2.45rem)]")}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {betKeys}
            <button type="button" onClick={g.toggleHint} aria-pressed={g.hintOn} className={`rl-key ${g.hintOn ? "is-on" : ""}`} title="Show the suggested play at the decision">
              Hint<Kbd k="H" />
            </button>
            <button type="button" onClick={toggleOdds} aria-pressed={oddsOn} className={`rl-key ${oddsOn ? "is-on" : ""}`} title="Show your chances at the decision">
              Odds
            </button>
          </div>
        </div>
        {deciding && <div className="absolute inset-0 flex items-stretch [&_.pk-act]:h-full">{decisionKeys}</div>}
      </div>
    </div>
  );

  const phoneConsole = (
    <div className="rl-console px-2 pb-2 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}>
      {deciding ? (
        <div className="flex h-[2.85rem] items-center justify-center text-center text-[11px] text-white/55">Call to see the turn and the river, or fold.</div>
      ) : (
        <ChipRow g={g} chips={chips} />
      )}
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_5.25rem] gap-1.5">
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              ["Credit", g.balance, false],
              ["Bet", g.staked, false],
              ["Win", won, won > 0],
            ] as const
          ).map(([label, value, hot], i) => (
            <div key={label} className={`rl-window rl-window--sm ${hot ? "is-hot" : ""}`}>
              <span className="rl-window__label">{label}</span>
              <span className="rl-window__value">
                <span className="rl-window__cur">◈</span>
                {compactMoney(value)}
              </span>
              {i === 2 && net !== null && (
                <span className={`rl-window__net ${net > 0 ? "is-up" : net < 0 ? "is-down" : ""}`}>
                  {net > 0 ? "+" : net < 0 ? "−" : ""}
                  {compactMoney(Math.abs(net))}
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => (deciding ? g.call() : g.deal())}
          disabled={busy || (!deciding && !g.canDeal)}
          className={`rl-spin row-span-2 ${(deciding || g.canDeal) && !busy ? "is-ready" : ""} ${busy ? "is-spinning" : ""}`}
        >
          <span className="text-[13px] tracking-[0.22em]">{busy ? "DEALING" : deciding ? "CALL" : rebetDeal ? "REBET" : "DEAL"}</span>
          <span className="text-[9px] font-black tracking-[0.2em] opacity-60">{deciding ? `◈ ${compactMoney(g.bets.ante * 2)}` : rebetDeal ? "& DEAL" : `◈ ${compactMoney(g.staked)}`}</span>
        </button>
        <div className="grid grid-cols-4 gap-1">
          {deciding ? (
            <button type="button" onClick={g.fold} className={`rl-key col-span-4 ${g.hintOn && g.advice === "fold" ? "is-on" : ""}`}>
              Fold · lose ◈ {compactMoney(g.bets.ante)}
            </button>
          ) : (
            betKeys
          )}
        </div>
      </div>
    </div>
  );

  const plaque = (
    <div className="rl-plaque mx-auto flex items-center gap-3 px-6 py-1.5 text-center lg:px-8 lg:py-2">
      <div className="flex flex-col items-center">
        <span className="font-display gold-text text-[16px] font-bold tracking-[0.28em] lg:text-[20px]">HOLD&apos;EM</span>
        <span className="text-[8px] font-bold tracking-[0.35em] text-white/45 lg:text-[9px]">VS THE DEALER</span>
      </div>
    </div>
  );

  const messageLine = (
    <p key={g.refused} className={`rl-message truncate ${g.refused ? "rl-shake" : ""}`} role="status">
      {g.message}
    </p>
  );

  return (
    <div
      data-theme="carbon"
      className={`rl-root pk-root ${desktop && !eco ? "" : "m-lite"} ${focusAnim} ${
        focus ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black" : "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[500px] lg:h-[calc(100dvh-10rem)] lg:min-h-[540px]"
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
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,min(30%,22rem))] gap-5 px-6 pb-4 pt-5">
            <div className="flex min-h-0 flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="rl-announce max-w-full">{messageLine}</div>
                </div>
                <p className="shrink-0 text-[10px] font-bold tracking-[0.2em] text-white/35">
                  ANTE ◈ {ANTE_MIN} – {money(ANTE_MAX)} · AA ◈ {money(BONUS_MAX)}
                </p>
              </div>
              <div className="pk-table min-h-0 flex-1">{table}</div>
              {pcConsole}
            </div>
            <aside className="flex min-h-0 flex-col gap-3">
              {plaque}
              <div className="rl-card flex min-h-0 flex-1 flex-col p-3">
                <div className="rl-tabs !grid-cols-4" role="tablist">
                  {(
                    [
                      ["pay", "Pays"],
                      ["hands", "Hands"],
                      ["stats", "Stats"],
                      ["rules", "Rules"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={panel === id} onClick={() => setPanel(id)} className={`rl-tab ${panel === id ? "is-on" : ""}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto pr-0.5">
                  {panel === "pay" && <Paytable g={g} />}
                  {panel === "hands" && <HistoryList items={g.history} />}
                  {panel === "stats" && <StatsBlock g={g} />}
                  {panel === "rules" && <Rules />}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col px-2 pt-2 sm:px-6">
            <div className="mb-1.5 flex items-center gap-1.5">
              <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
                {[...g.history]
                  .reverse()
                  .slice(0, 6)
                  .map((x) => {
                    const n = x.returned - x.staked;
                    return (
                      <span key={x.id + "-" + x.at} className={`pk-dot ${n > 0 ? "is-up" : n < 0 ? "is-down" : ""}`}>
                        {n > 0 ? "W" : !x.called ? "F" : n < 0 ? "L" : "P"}
                      </span>
                    );
                  })}
                {g.history.length === 0 && <span className="text-[10px] tracking-[0.2em] text-white/35">CASINO HOLD&apos;EM</span>}
              </div>
              <button type="button" onClick={g.toggleHint} aria-pressed={g.hintOn} className={`rl-icon-key !w-auto px-2.5 text-[10px] font-bold tracking-[0.15em] ${g.hintOn ? "is-on" : ""}`}>
                HINT
              </button>
              <button type="button" onClick={toggleOdds} aria-pressed={oddsOn} className={`rl-icon-key !w-auto px-2 text-[10px] font-bold tracking-[0.12em] ${oddsOn ? "is-on" : ""}`}>
                %
              </button>
              <button type="button" onClick={() => setSheet("pay")} className="rl-icon-key" aria-label="Paytable, hands and rules">
                ☰
              </button>
            </div>
            <div className="mb-1 flex h-5 items-center justify-center">{messageLine}</div>
            <div className="pk-table min-h-0 flex-1">{table}</div>
          </div>
        )}
        {!desktop && phoneConsole}
      </section>
      {!desktop && sheet && <Sheet g={g} tab={sheet} setTab={setSheet} onClose={() => setSheet(null)} />}
      {replay && <Replay h={replay} onClose={() => setReplay(null)} />}
    </div>
  );
}

/** Phones: swipeable chips; the chosen one centres itself. */
function ChipRow({ g, chips }: { g: PokerGame; chips: (cls: string) => ReactNode }) {
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
