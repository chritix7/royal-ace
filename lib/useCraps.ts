"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HAPTIC, haptic } from "./haptics";
import { sfx } from "./sound";
import { track } from "./events";
import { sessionStore } from "./sessionStore";
import { useBalance, wallet } from "./wallet";
import { canPlace, kindOf, TABLE_MAX, limitFor, maxOdds, MIN_BET, numOf, removable, resolve, rollDie, totalOf, type Bets, type BoxNum, type RollResult } from "./craps";
import { brag } from "./brag";

/**
 * Craps at the Chrysonyx table. Chips leave the credit when they are
 * placed and come back with the payouts. The dice are thrown when Roll is
 * pressed and saved with the table, so a reload during the throw settles
 * the very same roll.
 */

export const CRAPS_CHIPS = [10, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
const HISTORY_MAX = 120;
const KEY = "royalace:craps";

export type RollRecord = { id: number; at: number; d: [number, number]; total: number; event: RollResult["event"]; won: number; lost: number };
type Pending = { id: number; bets: Bets; point: BoxNum | null; dice: [number, number] };
type Saved = { chip: number; bets: Bets; point: BoxNum | null; history: RollRecord[]; lastOneRoll: Bets; hintOn: boolean; rollId: number; pending: Pending | null };
const EMPTY: Saved = { chip: 10, bets: {}, point: null, history: [], lastOneRoll: {}, hintOn: true, rollId: 0, pending: null };

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const s = JSON.parse(raw) as Partial<Saved>;
    return {
      chip: CRAPS_CHIPS.includes(s.chip ?? 0) ? (s.chip as number) : EMPTY.chip,
      bets: s.bets && typeof s.bets === "object" ? s.bets : {},
      point: (s.point as BoxNum | null) ?? null,
      history: Array.isArray(s.history) ? s.history.slice(-HISTORY_MAX) : [],
      lastOneRoll: s.lastOneRoll ?? {},
      hintOn: s.hintOn ?? true,
      rollId: s.rollId ?? 0,
      pending: s.pending ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}
function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

const ONE_ROLL = (k: string) => {
  const kind = kindOf(k);
  return kind === "field" || kind === "prop";
};

export function useCraps(active: boolean, rollMs: number) {
  const balance = useBalance();
  const [bets, setBets] = useState<Bets>({});
  const [point, setPoint] = useState<BoxNum | null>(null);
  const [chip, setChipState] = useState(EMPTY.chip);
  const [history, setHistory] = useState<RollRecord[]>([]);
  const [hintOn, setHintOn] = useState(true);
  const [lastOneRoll, setLastOneRoll] = useState<Bets>({});
  const [undoStack, setUndoStack] = useState<{ key: string; amount: number }[]>([]);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [rollId, setRollId] = useState(0);
  const [result, setResult] = useState<RollResult | null>(null);
  const [message, setMessage] = useState("Place your bets · come-out roll");
  const [refused, setRefused] = useState(0);

  const savedRef = useRef<Saved>({ ...EMPTY });
  const persist = (patch: Partial<Saved>) => {
    savedRef.current = { ...savedRef.current, ...patch };
    save(savedRef.current);
  };
  const refuse = (why: string) => {
    setMessage(why);
    setRefused((n) => n + 1);
    haptic(HAPTIC.tick);
    return false;
  };

  // ---- Settle a thrown roll (live, or restored after a reload)
  const settle = useCallback((p: Pending, quiet = false) => {
    const res = resolve(p.bets, p.point, p.dice[0], p.dice[1]);
    if (res.returned > 0) wallet.add(res.returned);
    wallet.setLocked(false);
    const rec: RollRecord = { id: p.id, at: Date.now(), d: p.dice, total: res.total, event: res.event, won: res.won, lost: res.lost };
    const nextHistory = [...savedRef.current.history, rec].slice(-HISTORY_MAX);
    persist({ bets: res.bets, point: res.point, history: nextHistory, pending: null });
    setBets(res.bets);
    setPoint(res.point);
    setHistory(nextHistory);
    setResult(res);
    setDice(p.dice);
    setRolling(false);
    setUndoStack([]);
    // Stats and challenges, after the result is on screen.
    const resolvedStake = res.lines.filter((l) => l.result === "win" || l.result === "lose").reduce((a, l) => a + l.stake, 0);
    window.setTimeout(
      () => {
        track("crapsRoll");
        if (resolvedStake > 0) sessionStore.recordCraps(resolvedStake, res.won - res.lost);
        if (res.won > res.lost) track("crapsWin");
        if (res.event === "pointMade" && p.bets.pass) track("crapsPoint");
        if (res.lines.some((l) => kindOf(l.key) === "hard" && l.result === "win")) track("crapsHard");
        if (res.lines.some((l) => l.result === "win" && l.win >= l.stake * 10)) {
          track("crapsBigWin");
          const best = Math.max(...res.lines.filter((l) => l.result === "win").map((l) => l.win / l.stake));
          brag({ game: "Craps", amount: res.won, mult: best });
        }
      },
      quiet ? 0 : 600,
    );
    return res;
  }, []);

  // ---- Restore
  useEffect(() => {
    const s = load();
    savedRef.current = s;
    setChipState(s.chip);
    setBets(s.bets);
    setPoint(s.point);
    setHistory(s.history);
    setLastOneRoll(s.lastOneRoll);
    setHintOn(s.hintOn);
    setRollId(s.rollId);
    const last = s.history[s.history.length - 1];
    if (last) setDice(last.d);
    if (s.pending) {
      const r = settle(s.pending, true);
      setMessage(r.call);
    } else if (s.point) setMessage(`Point is ${s.point}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => wallet.setLocked(false), []);

  const onTable = totalOf(bets);

  // ---- Bets
  const place = (key: string, amount = chip) => {
    if (rolling) return false;
    const why = canPlace(key, bets, point);
    if (why) return refuse(why);
    const have = bets[key] ?? 0;
    const lim = limitFor(key, bets, point);
    if (have >= lim) return refuse(lim === 0 ? "Nothing to back here" : `Limit ◈ ${lim.toLocaleString("en-US")} on this bet`);
    const room = TABLE_MAX - totalOf(bets);
    if (room <= 0) return refuse(`Table limit ◈ ${TABLE_MAX.toLocaleString("en-US")} on the layout`);
    const add = Math.min(amount, lim - have, room);
    if (add + have < MIN_BET) return refuse(`Minimum ◈ ${MIN_BET}`);
    if (add > wallet.getBalance()) return refuse("Not enough chips");
    wallet.add(-add);
    const next = { ...bets, [key]: have + add };
    setBets(next);
    persist({ bets: next });
    setUndoStack((u) => [...u.slice(-40), { key, amount: add }]);
    sfx.chip();
    setResult(null);
    return true;
  };
  const undo = () => {
    if (rolling || undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const have = bets[last.key] ?? 0;
    const back = Math.min(have, last.amount);
    const next = { ...bets };
    if (have - back > 0) next[last.key] = have - back;
    else delete next[last.key];
    wallet.add(back);
    setBets(next);
    persist({ bets: next });
    setUndoStack((u) => u.slice(0, -1));
  };
  /** Take down everything the rules allow. */
  const clear = () => {
    if (rolling) return;
    const next: Bets = {};
    let back = 0;
    for (const [k, v] of Object.entries(bets)) {
      if (removable(k, point)) back += v;
      else next[k] = v;
    }
    if (!back) return refuse("Line and come bets stay until they are decided");
    wallet.add(back);
    setBets(next);
    persist({ bets: next });
    setUndoStack([]);
    setMessage("Bets taken down");
  };
  /** Same one-roll bets (field, props) as on the last roll, within the rules and limits. */
  const rebet = () => {
    if (rolling) return;
    const add = Object.entries(lastOneRoll);
    if (!add.length) return refuse("No one-roll bets to repeat");
    const next = { ...bets };
    let cost = 0;
    for (const [k, v] of add) {
      if (canPlace(k, next, point)) continue;
      const have = next[k] ?? 0;
      const amount = Math.min(v, limitFor(k, next, point) - have, TABLE_MAX - totalOf(next), wallet.getBalance() - cost);
      if (amount + have < MIN_BET || amount <= 0) continue;
      next[k] = have + amount;
      cost += amount;
    }
    if (!cost) return refuse("Not enough chips or limits reached");
    wallet.add(-cost);
    setBets(next);
    persist({ bets: next });
    sfx.chip();
  };
  /** Back every line and come bet with the most odds allowed. */
  const maxAllOdds = () => {
    if (rolling) return;
    const next = { ...bets };
    let cost = 0;
    const add = (key: string, max: number) => {
      const have = next[key] ?? 0;
      const want = Math.max(0, max - have);
      if (want <= 0) return;
      const can = Math.min(want, wallet.getBalance() - cost, TABLE_MAX - totalOf(next));
      if (can < MIN_BET) return;
      next[key] = have + can;
      cost += can;
    };
    if (point && bets.pass) add("passOdds", maxOdds(bets.pass, point, false));
    if (point && bets.dontPass) add("dontPassOdds", maxOdds(bets.dontPass, point, true));
    for (const k of Object.keys(bets)) {
      const kind = kindOf(k);
      if (kind === "comePoint") add(`comeOdds${numOf(k)}`, maxOdds(bets[k], numOf(k), false));
      if (kind === "dcPoint") add(`dcOdds${numOf(k)}`, maxOdds(bets[k], numOf(k), true));
    }
    if (!cost) return refuse(point ? "Nothing more to back with odds" : "Odds open once a point is set");
    wallet.add(-cost);
    setBets(next);
    persist({ bets: next });
    sfx.chip();
    setMessage(`Odds ◈ ${cost.toLocaleString("en-US")} · paid at true odds`);
  };
  const setChip = (v: number) => {
    setChipState(v);
    persist({ chip: v });
  };
  const toggleHint = () => {
    const on = !hintOn;
    setHintOn(on);
    persist({ hintOn: on });
    setMessage(on ? "Hints on · tips show under the dice" : "Hints off");
  };

  // ---- Roll
  const timer = useRef(0);
  const roll = () => {
    if (rolling) return false;
    if (onTable === 0) return refuse("Place a bet first");
    const d: [number, number] = [rollDie(), rollDie()];
    const id = rollId + 1;
    const p: Pending = { id, bets, point, dice: d };
    const oneRoll = Object.fromEntries(Object.entries(bets).filter(([k]) => ONE_ROLL(k)));
    persist({ pending: p, rollId: id, lastOneRoll: Object.keys(oneRoll).length ? oneRoll : savedRef.current.lastOneRoll });
    if (Object.keys(oneRoll).length) setLastOneRoll(oneRoll);
    setRollId(id);
    setDice(d);
    setRolling(true);
    setResult(null);
    wallet.setLocked(true);
    setMessage(point ? `Point is ${point} · dice are out` : "Come-out roll · dice are out");
    sfx.diceShake();
    window.setTimeout(() => sfx.diceRoll(), 140);
    timer.current = window.setTimeout(() => {
      timer.current = 0;
      const r = settle(p);
      sfx.diceLand();
      setMessage(r.call);
      const net = r.won - r.lost;
      if (r.won > 0) {
        window.setTimeout(() => (r.lines.some((l) => l.result === "win" && l.win >= l.stake * 10) ? sfx.bigWin() : sfx.win()), 160);
        haptic(net > 0 ? HAPTIC.win : HAPTIC.tick);
      } else if (r.lost > 0) window.setTimeout(() => sfx.lose(), 160);
    }, rollMs);
    return true;
  };
  // Leaving mid-throw: settle at once (the dice were already drawn).
  useEffect(
    () => () => {
      if (timer.current && savedRef.current.pending) {
        window.clearTimeout(timer.current);
        settle(savedRef.current.pending, true);
      }
    },
    [settle],
  );

  // ---- Hints for newcomers
  const hint = (() => {
    if (!hintOn || rolling) return null;
    if (point === null && !bets.pass && !bets.dontPass) return "Start with the Pass line: 1.41% edge, even money.";
    if (point !== null && bets.pass && !bets.passOdds) return "Take odds behind your Pass bet: paid at true odds, no house edge.";
    if (point !== null && bets.dontPass && !bets.dontPassOdds) return "Lay odds behind Don't pass: true odds, no house edge.";
    const comeNoOdds = Object.keys(bets).find((k) => kindOf(k) === "comePoint" && !bets[`comeOdds${numOf(k)}`]);
    if (comeNoOdds) return `Back your come bet on ${numOf(comeNoOdds)} with odds.`;
    const badPlace = (["place6", "place8"] as const).find((k) => bets[k] && bets[k] % 6);
    if (badPlace) return `Place ${numOf(badPlace)} pays 7:6 — bet in multiples of 6 for the full payout.`;
    if (Object.keys(bets).some((k) => kindOf(k) === "prop")) return "Props pay big but carry an 11–17% edge. Keep them small.";
    return null;
  })();

  // ---- Keyboard: Space roll · U undo · C clear · R rebet · O odds · H hint · 1–9 0 chips · F focus
  const actions = useRef({ roll, undo, clear, rebet, maxAllOdds, toggleHint, setChip });
  actions.current = { roll, undo, clear, rebet, maxAllOdds, toggleHint, setChip };
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
        a.roll();
      } else if (k === "u" || k === "backspace") a.undo();
      else if (k === "c") a.clear();
      else if (k === "r") a.rebet();
      else if (k === "o") a.maxAllOdds();
      else if (k === "h") a.toggleHint();
      else if (k === "f") window.dispatchEvent(new CustomEvent("royal-ace:toggle-focus"));
      else if (k >= "0" && k <= "9") a.setChip(CRAPS_CHIPS[k === "0" ? 9 : Number(k) - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return {
    balance,
    bets,
    point,
    chip,
    history,
    hintOn,
    hint,
    rolling,
    dice,
    rollId,
    result,
    message,
    refused,
    onTable,
    canUndo: !rolling && undoStack.length > 0,
    canRebet: !rolling && Object.keys(lastOneRoll).length > 0,
    place,
    undo,
    clear,
    rebet,
    maxAllOdds,
    setChip,
    toggleHint,
    roll,
  };
}

export type CrapsGame = ReturnType<typeof useCraps>;
