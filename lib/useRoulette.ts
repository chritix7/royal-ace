"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHIPS } from "./game";
import { HAPTIC, haptic } from "./haptics";
import { sfx } from "./sound";
import { track } from "./events";
import { sessionStore } from "./sessionStore";
import { useBalance, wallet } from "./wallet";
import { coverage, drawNumber, limitOf, ruleBreak, settle, TABLE_MAX, totalOf, type Bets } from "./roulette";

export type RoulettePhase = "betting" | "spinning" | "result";
export type RouletteResult = {
  n: number;
  /** Total paid back (stakes of winning bets + winnings). */
  returned: number;
  staked: number;
  winners: string[];
  /** Even-money bets half returned on zero (La Partage). */
  halved: string[];
  bets: Bets;
};

/** Spin length: full show / quick spin. */
export const SPIN_MS = { normal: 7200, quick: 3600 } as const;
/** The ball drops into its pocket at this share of the spin. */
export const BALL_LAND_AT = 0.8;

const KEY = "royalace:roulette";
const HISTORY_MAX = 200;
/** Chips offered on the roulette console. */
export const ROULETTE_CHIPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000].filter((v) => CHIPS.includes(v));

type Saved = {
  history: number[];
  lastBets: Bets;
  chip: number;
  quick: boolean;
  /** A spin whose result was drawn but not yet paid (page closed mid-spin). */
  pending?: RouletteResult | null;
};

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        history: Array.isArray(d.history) ? d.history.filter((n: unknown) => typeof n === "number" && n >= 0 && n <= 36).slice(-HISTORY_MAX) : [],
        lastBets: d.lastBets && typeof d.lastBets === "object" ? d.lastBets : {},
        chip: ROULETTE_CHIPS.includes(d.chip) ? d.chip : ROULETTE_CHIPS[0],
        quick: Boolean(d.quick),
        pending: d.pending ?? null,
      };
    }
  } catch {}
  return { history: [], lastBets: {}, chip: ROULETTE_CHIPS[0], quick: false, pending: null };
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function useRoulette(active: boolean) {
  const balance = useBalance();
  const [phase, setPhase] = useState<RoulettePhase>("betting");
  const [bets, setBets] = useState<Bets>({});
  const [undoStack, setUndoStack] = useState<Bets[]>([]);
  const [chip, setChipState] = useState<number>(ROULETTE_CHIPS[0]);
  const [quick, setQuick] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [lastBets, setLastBets] = useState<Bets>({});
  const [result, setResult] = useState<RouletteResult | null>(null);
  // Drawn at spin start, revealed when the ball lands.
  const [target, setTarget] = useState<number | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [message, setMessage] = useState("Place your bets");
  // Bumped when a chip is refused (rule, limit): the table shakes the message.
  const [refused, setRefused] = useState(0);

  const savedRef = useRef<Saved>({ history: [], lastBets: {}, chip: ROULETTE_CHIPS[0], quick: false, pending: null });
  const persist = (patch: Partial<Saved>) => {
    savedRef.current = { ...savedRef.current, ...patch };
    save(savedRef.current);
  };

  // Restore history, last bets, chip and a spin left unpaid.
  useEffect(() => {
    const s = load();
    savedRef.current = s;
    setHistory(s.history);
    setLastBets(s.lastBets);
    setChipState(s.chip);
    setQuick(s.quick);
    if (s.pending) {
      wallet.add(s.pending.returned);
      setHistory((h) => [...h, s.pending!.n].slice(-HISTORY_MAX));
      persist({ pending: null, history: [...s.history, s.pending.n].slice(-HISTORY_MAX) });
    }
  }, []);

  const staked = totalOf(bets);
  // Chips not yet on the table (bets are only taken when the wheel spins).
  const available = balance - (phase === "betting" ? staked : 0);

  /** Start a fresh round when the player acts on a finished one. */
  const freshBets = (): Bets => (phase === "result" ? {} : bets);
  const leaveResult = () => {
    if (phase === "result") {
      setResult(null);
      setPhase("betting");
      setUndoStack([]);
    }
  };

  const place = useCallback(
    (key: string, amount = chip) => {
      if (phase === "spinning") return false;
      const base = freshBets();
      const total = totalOf(base);
      const current = base[key] ?? 0;
      const broken = ruleBreak(base, key);
      if (broken) {
        setMessage(broken);
        setRefused((r) => r + 1);
        return false;
      }
      const room = Math.min(limitOf(key) - current, balance - total, TABLE_MAX - total);
      const add = Math.min(amount, room);
      if (add <= 0) {
        setMessage(
          balance - total <= 0
            ? "Not enough chips"
            : total >= TABLE_MAX
              ? `Table maximum ◈ ${TABLE_MAX.toLocaleString("en-US")} reached`
              : `Maximum ◈ ${limitOf(key).toLocaleString("en-US")} on this bet`,
        );
        setRefused((r) => r + 1);
        return false;
      }
      leaveResult();
      setUndoStack((u) => [...(phase === "result" ? [] : u), base].slice(-60));
      setBets({ ...base, [key]: current + add });
      setMessage("Place your bets");
      sfx.chip();
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, bets, chip, balance],
  );

  const undo = () => {
    if (phase !== "betting" || undoStack.length === 0) return;
    setBets(undoStack[undoStack.length - 1]);
    setUndoStack((u) => u.slice(0, -1));
    sfx.chip();
  };

  const clear = () => {
    if (phase === "spinning") return;
    leaveResult();
    if (Object.keys(bets).length && phase === "betting") setUndoStack((u) => [...u, bets].slice(-60));
    setBets({});
  };

  /** Put last round's bets back (if the chips allow). */
  const rebet = () => {
    if (phase === "spinning") return false;
    const total = totalOf(lastBets);
    if (total === 0) return false;
    if (total > balance) {
      setMessage("Not enough chips to rebet");
      return false;
    }
    leaveResult();
    setUndoStack((u) => [...(phase === "result" ? [] : u), freshBets()].slice(-60));
    setBets({ ...lastBets });
    sfx.chip();
    return true;
  };

  const double = () => {
    if (phase === "spinning") return;
    const base = freshBets();
    const total = totalOf(base);
    if (total === 0) return;
    if (total * 2 > balance) {
      setMessage("Not enough chips to double");
      return;
    }
    if (total * 2 > TABLE_MAX) {
      setMessage(`Table maximum ◈ ${TABLE_MAX.toLocaleString("en-US")}`);
      return;
    }
    const next: Bets = {};
    for (const [k, v] of Object.entries(base)) next[k] = Math.min(limitOf(k), v * 2);
    leaveResult();
    setUndoStack((u) => [...(phase === "result" ? [] : u), base].slice(-60));
    setBets(next);
    sfx.chip();
  };

  const setChip = (v: number) => {
    setChipState(v);
    persist({ chip: v });
  };

  const toggleQuick = () =>
    setQuick((q) => {
      persist({ quick: !q });
      return !q;
    });

  const landedFor = useRef(0);
  const runningSpin = useRef<{ id: number; result: RouletteResult } | null>(null);

  const spin = () => {
    if (phase === "spinning") return;
    let round = phase === "result" ? {} : bets;
    // Nothing on the table: Space / Spin repeats the last bets.
    if (totalOf(round) === 0 && totalOf(lastBets) > 0 && totalOf(lastBets) <= balance) round = { ...lastBets };
    const total = totalOf(round);
    if (total === 0) {
      setMessage("Place a chip on the table first");
      return;
    }
    if (total > balance) {
      setMessage("Not enough chips");
      return;
    }
    const n = drawNumber();
    const { returned, winners, halved } = settle(round, n);
    const res: RouletteResult = { n, returned, staked: total, winners, halved, bets: round };
    wallet.add(-total);
    wallet.setLocked(true);
    persist({ pending: res, lastBets: round });
    setLastBets(round);
    setBets(round);
    setResult(null);
    setUndoStack([]);
    setTarget(n);
    setPhase("spinning");
    setMessage("No more bets");
    const id = spinId + 1;
    setSpinId(id);
    runningSpin.current = { id, result: res };
    sfx.ballLaunch();
    sfx.ballRoll(((quick ? SPIN_MS.quick : SPIN_MS.normal) / 1000) * BALL_LAND_AT);
    track("rouletteSpin");
  };

  /** The ball has dropped into its pocket: pay and show the result. */
  const landed = useCallback((id: number) => {
    const run = runningSpin.current;
    if (!run || run.id !== id || landedFor.current === id) return;
    landedFor.current = id;
    const res = run.result;
    sfx.ballDrop();
    wallet.add(res.returned);
    wallet.setLocked(false);
    const net = res.returned - res.staked;
    sessionStore.recordRoulette(res.staked, net);
    setHistory((h) => {
      const next = [...h, res.n].slice(-HISTORY_MAX);
      persist({ history: next, pending: null });
      return next;
    });
    setResult(res);
    setPhase("result");
    if (res.returned > 0) {
      if (res.winners.length) track("rouletteWin");
      if (res.winners.some((k) => coverage(k).length === 1)) track("rouletteStraight");
      window.setTimeout(() => (net >= res.staked * 10 ? sfx.bigWin() : sfx.win()), 250);
      haptic(net >= res.staked * 10 ? HAPTIC.big : HAPTIC.win);
      setMessage(
        net > 0
          ? `You win ◈ ${res.returned.toLocaleString("en-US")}`
          : res.winners.length === 0 && res.halved.length
            ? `La Partage · ◈ ${res.returned.toLocaleString("en-US")} back`
            : `◈ ${res.returned.toLocaleString("en-US")} back`,
      );
    } else {
      setMessage("No win this time");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: if no wheel reports the landing (tab hidden…), settle anyway.
  useEffect(() => {
    if (phase !== "spinning") return;
    const ms = (quick ? SPIN_MS.quick : SPIN_MS.normal) * BALL_LAND_AT + 1500;
    const t = window.setTimeout(() => landed(spinId), ms);
    return () => window.clearTimeout(t);
  }, [phase, spinId, quick, landed]);

  useEffect(() => () => wallet.setLocked(false), []);

  // Keyboard: Space spin · U / Backspace undo · C clear · R rebet ·
  // X double · 1–8 chip · T quick spin · F focus.
  const actions = useRef({ spin, undo, clear, rebet, double, setChip, toggleQuick });
  actions.current = { spin, undo, clear, rebet, double, setChip, toggleQuick };
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest("input, textarea, select, [contenteditable], [role=dialog], [role=menu]")) return;
      if (document.querySelector("[role=dialog][aria-modal=true]")) return;
      const a = actions.current;
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") {
        if (k === "enter" && t?.closest("button, a")) return;
        e.preventDefault();
        t?.blur?.();
        a.spin();
      } else if (k === "u" || k === "backspace") a.undo();
      else if (k === "c") a.clear();
      else if (k === "r") a.rebet();
      else if (k === "x") a.double();
      else if (k === "t") a.toggleQuick();
      else if (k === "f") window.dispatchEvent(new CustomEvent("royal-ace:toggle-focus"));
      else if (k >= "1" && k <= "8") a.setChip(ROULETTE_CHIPS[Number(k) - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return {
    phase,
    bets,
    staked,
    available,
    balance,
    chip,
    quick,
    history,
    lastBets,
    result,
    target,
    spinId,
    message,
    refused,
    canUndo: phase === "betting" && undoStack.length > 0,
    spinMs: quick ? SPIN_MS.quick : SPIN_MS.normal,
    place,
    undo,
    clear,
    rebet,
    double,
    setChip,
    toggleQuick,
    spin,
    landed,
  };
}

export type RouletteGame = ReturnType<typeof useRoulette>;
