"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HAPTIC, haptic } from "./haptics";
import { sfx } from "./sound";
import { track } from "./events";
import { sessionStore } from "./sessionStore";
import { useBalance, wallet } from "./wallet";
import {
  coverage,
  drawLightning,
  drawNumber,
  limitOf,
  ruleBreak,
  settle,
  TABLE_MAX,
  totalOf,
  type Bets,
  type LuckyNumber,
} from "./roulette";

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
  /** Lightning strikes of that round (null on a classic round). */
  lucky?: LuckyNumber[] | null;
  /** Stake that was on a struck number and won. */
  multiplied?: number;
};
/** One line of the detailed history. */
export type RoundRecord = { id: number; at: number; n: number; staked: number; returned: number; bets: Bets; lucky?: LuckyNumber[] | null };
export type Favourite = { name: string; bets: Bets };
export type AutoStops = { onWin: boolean; onStraight: boolean; lossLimit: number };

/** Spin length: full show / quick spin. */
export const SPIN_MS = { normal: 7200, quick: 3600 } as const;
/** The ball drops into its pocket at this share of the spin. */
export const BALL_LAND_AT = 0.8;

const KEY = "royalace:roulette";
const HISTORY_MAX = 200;
const ROUNDS_MAX = 60;
const FAVS_MAX = 8;
/** Chips offered on the roulette console. */
export const ROULETTE_CHIPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000];

/** Career badges of the roulette table. */
export const ROULETTE_BADGES = [
  { id: "straight", title: "Straight up", desc: "Win a bet on a single number" },
  { id: "zero", title: "Zero hero", desc: "Win with zero" },
  { id: "lightning", title: "Struck by lightning", desc: "Win a Lightning multiplier" },
  { id: "announce", title: "Le cylindre", desc: "Win with an announced bet" },
  { id: "streak3", title: "On a roll", desc: "Win 3 spins in a row" },
  { id: "highroller", title: "High roller", desc: "Stake ◈ 100,000 on one spin" },
  { id: "x100", title: "Hundredfold", desc: "Win 100× your stake on one spin" },
  { id: "twice", title: "Déjà vu", desc: "The same number twice in a row" },
] as const;
export type BadgeId = (typeof ROULETTE_BADGES)[number]["id"];

type Saved = {
  history: number[];
  rounds: RoundRecord[];
  favourites: Favourite[];
  badges: string[];
  lastBets: Bets;
  chip: number;
  quick: boolean;
  lightning: boolean;
  theme: string;
  heatmap: boolean;
  /** A spin whose result was drawn but not yet paid (page closed mid-spin). */
  pending?: RouletteResult | null;
};
const EMPTY: Saved = {
  history: [],
  rounds: [],
  favourites: [],
  badges: [],
  lastBets: {},
  chip: ROULETTE_CHIPS[0],
  quick: false,
  lightning: false,
  theme: "carbon",
  heatmap: false,
  pending: null,
};

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        history: Array.isArray(d.history) ? d.history.filter((n: unknown) => typeof n === "number" && n >= 0 && n <= 36).slice(-HISTORY_MAX) : [],
        rounds: Array.isArray(d.rounds) ? d.rounds.slice(-ROUNDS_MAX) : [],
        favourites: Array.isArray(d.favourites) ? d.favourites.slice(0, FAVS_MAX) : [],
        badges: Array.isArray(d.badges) ? d.badges : [],
        lastBets: d.lastBets && typeof d.lastBets === "object" ? d.lastBets : {},
        chip: ROULETTE_CHIPS.includes(d.chip) ? d.chip : ROULETTE_CHIPS[0],
        quick: Boolean(d.quick),
        lightning: Boolean(d.lightning),
        theme: typeof d.theme === "string" ? d.theme : "carbon",
        heatmap: Boolean(d.heatmap),
        pending: d.pending ?? null,
      };
    }
  } catch {}
  return { ...EMPTY };
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
  const [lightning, setLightningState] = useState(false);
  const [theme, setThemeState] = useState("carbon");
  const [heatmap, setHeatmap] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [rounds, setRounds] = useState<RoundRecord[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const [lastBets, setLastBets] = useState<Bets>({});
  const [result, setResult] = useState<RouletteResult | null>(null);
  // Drawn at spin start, revealed when the ball lands.
  const [target, setTarget] = useState<number | null>(null);
  // Lightning strikes of the current round (shown while the wheel turns).
  const [lucky, setLucky] = useState<LuckyNumber[] | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [message, setMessage] = useState("Place your bets");
  // Bumped when a chip is refused (rule, limit): the table shakes the message.
  const [refused, setRefused] = useState(0);
  // Autoplay
  const [autoLeft, setAutoLeft] = useState(0);
  const [autoStops, setAutoStops] = useState<AutoStops>({ onWin: false, onStraight: true, lossLimit: 0 });
  const autoStart = useRef(0);
  // Announced bets on the table this round (for the badge).
  const announced = useRef(false);
  const winStreak = useRef(0);

  const savedRef = useRef<Saved>({ ...EMPTY });
  const persist = (patch: Partial<Saved>) => {
    savedRef.current = { ...savedRef.current, ...patch };
    save(savedRef.current);
  };

  // Restore everything, and pay a spin left unpaid.
  useEffect(() => {
    const s = load();
    savedRef.current = s;
    setHistory(s.history);
    setRounds(s.rounds);
    setFavourites(s.favourites);
    setBadges(s.badges);
    setLastBets(s.lastBets);
    setChipState(s.chip);
    setQuick(s.quick);
    setLightningState(s.lightning);
    setThemeState(s.theme);
    setHeatmap(s.heatmap);
    if (s.pending) {
      // A spin interrupted by a reload: pay it and record it like any round.
      const p = s.pending;
      wallet.add(p.returned);
      const net = p.returned - p.staked;
      sessionStore.recordRoulette(p.staked, net);
      if (p.winners?.length) {
        track("rouletteWin");
        if (p.winners.some((k) => coverage(k).length === 1)) track("rouletteStraight");
        if (p.n === 0) track("rouletteZero");
        if (p.multiplied) track("rouletteLightning");
        if (net >= p.staked * 10) track("rouletteBigWin");
      }
      const nextHistory = [...s.history, p.n].slice(-HISTORY_MAX);
      const record: RoundRecord = { id: Date.now(), at: Date.now(), n: p.n, staked: p.staked, returned: p.returned, bets: p.bets, lucky: p.lucky ?? null };
      const nextRounds = [...s.rounds, record].slice(-ROUNDS_MAX);
      setHistory(nextHistory);
      setRounds(nextRounds);
      persist({ pending: null, history: nextHistory, rounds: nextRounds });
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
      setLucky(null);
      announced.current = false;
    }
  };
  const refuse = (msg: string) => {
    setMessage(msg);
    setRefused((r) => r + 1);
    return false;
  };

  /**
   * Put several chips at once (announces, neighbours, favourites): all or
   * nothing, one undo step.
   */
  const placeMany = (entries: [string, number][], label?: string) => {
    if (phase === "spinning" || entries.length === 0) return false;
    const base = freshBets();
    const next: Bets = { ...base };
    for (const [key, amount] of entries) {
      const broken = ruleBreak(next, key);
      if (broken) return refuse(broken);
      const after = (next[key] ?? 0) + amount;
      if (after > limitOf(key)) return refuse(`Maximum ◈ ${limitOf(key).toLocaleString("en-US")} on ${key.startsWith("i:") ? "a bet" : "this bet"}`);
      next[key] = after;
    }
    const total = totalOf(next);
    if (total > balance) return refuse("Not enough chips");
    if (total > TABLE_MAX) return refuse(`Table maximum ◈ ${TABLE_MAX.toLocaleString("en-US")}`);
    leaveResult();
    setUndoStack((u) => [...(phase === "result" ? [] : u), base].slice(-60));
    setBets(next);
    setMessage(label ? `${label} · ◈ ${totalOf(Object.fromEntries(entries)).toLocaleString("en-US")}` : "Place your bets");
    sfx.chip();
    return true;
  };

  const place = useCallback(
    (key: string, amount = chip) => {
      if (phase === "spinning") return false;
      const base = freshBets();
      const total = totalOf(base);
      const current = base[key] ?? 0;
      const broken = ruleBreak(base, key);
      if (broken) return refuse(broken);
      const room = Math.min(limitOf(key) - current, balance - total, TABLE_MAX - total);
      const add = Math.min(amount, room);
      if (add <= 0) {
        return refuse(
          balance - total <= 0
            ? "Not enough chips"
            : total >= TABLE_MAX
              ? `Table maximum ◈ ${TABLE_MAX.toLocaleString("en-US")} reached`
              : `Maximum ◈ ${limitOf(key).toLocaleString("en-US")} on this bet`,
        );
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
    if (total > balance) return refuse("Not enough chips to rebet");
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
    if (total * 2 > balance) return void refuse("Not enough chips to double");
    if (total * 2 > TABLE_MAX) return void refuse(`Table maximum ◈ ${TABLE_MAX.toLocaleString("en-US")}`);
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
  const toggleLightning = () => {
    if (phase === "spinning") return;
    setLightningState((l) => {
      persist({ lightning: !l });
      setMessage(!l ? "Lightning on · straight ups pay 29:1, strikes up to 500×" : "Classic table");
      return !l;
    });
  };
  const toggleHeatmap = () =>
    setHeatmap((h) => {
      persist({ heatmap: !h });
      return !h;
    });
  const setTheme = (t: string) => {
    setThemeState(t);
    persist({ theme: t });
  };

  // ---- Favourites
  const saveFavourite = (name: string) => {
    const b = phase === "result" ? lastBets : bets;
    if (totalOf(b) === 0) return refuse("Put chips on the table to save them");
    const fav = { name: name.trim().slice(0, 24) || `Favourite ${favourites.length + 1}`, bets: { ...b } };
    const next = [...favourites.filter((f) => f.name !== fav.name), fav].slice(-FAVS_MAX);
    setFavourites(next);
    persist({ favourites: next });
    setMessage(`Saved · ${fav.name}`);
    return true;
  };
  const applyFavourite = (i: number) => {
    const f = favourites[i];
    if (!f) return false;
    return placeMany(Object.entries(f.bets), f.name);
  };
  const renameFavourite = (i: number, name: string) => {
    const clean = name.trim().slice(0, 24);
    if (!clean || !favourites[i]) return false;
    if (favourites.some((f, k) => k !== i && f.name === clean)) return refuse("That name is already used");
    const next = favourites.map((f, k) => (k === i ? { ...f, name: clean } : f));
    setFavourites(next);
    persist({ favourites: next });
    return true;
  };
  const deleteFavourite = (i: number) => {
    const next = favourites.filter((_, k) => k !== i);
    setFavourites(next);
    persist({ favourites: next });
  };

  // ---- Badges
  const unlock = (id: BadgeId) => {
    const have = savedRef.current.badges;
    if (have.includes(id)) return;
    const b = ROULETTE_BADGES.find((x) => x.id === id)!;
    const next = [...have, id];
    setBadges(next);
    persist({ badges: next });
    setBadgeToast(`${b.id}|${b.title}|${b.desc}`);
  };

  const landedFor = useRef(0);
  const runningSpin = useRef<{ id: number; result: RouletteResult } | null>(null);

  const spin = () => {
    if (phase === "spinning") return false;
    let round = phase === "result" ? {} : bets;
    // Nothing on the table: Space / Spin repeats the last bets.
    if (totalOf(round) === 0 && totalOf(lastBets) > 0 && totalOf(lastBets) <= balance) round = { ...lastBets };
    const total = totalOf(round);
    if (total === 0) return refuse("Place a chip on the table first");
    if (total > balance) return refuse("Not enough chips");
    const strikes = lightning ? drawLightning() : null;
    const n = drawNumber();
    const { returned, winners, halved, multiplied } = settle(round, n, strikes);
    const res: RouletteResult = { n, returned, staked: total, winners, halved, bets: round, lucky: strikes, multiplied };
    wallet.add(-total);
    wallet.setLocked(true);
    persist({ pending: res, lastBets: round });
    setLastBets(round);
    setBets(round);
    setResult(null);
    setUndoStack([]);
    setTarget(n);
    setLucky(strikes);
    setPhase("spinning");
    setMessage(strikes ? "Lightning strikes…" : "No more bets");
    const id = spinId + 1;
    setSpinId(id);
    runningSpin.current = { id, result: res };
    if (strikes) sfx.thunder();
    sfx.ballLaunch();
    sfx.ballRoll(((quick ? SPIN_MS.quick : SPIN_MS.normal) / 1000) * BALL_LAND_AT);
    // Stats and badges after the opening animations.
    window.setTimeout(() => {
      track("rouletteSpin");
      if (total >= 100000) unlock("highroller");
    }, 900);
    return true;
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
    const prev = savedRef.current.history[savedRef.current.history.length - 1];
    const nextHistory = [...savedRef.current.history, res.n].slice(-HISTORY_MAX);
    const record: RoundRecord = { id, at: Date.now(), n: res.n, staked: res.staked, returned: res.returned, bets: res.bets, lucky: res.lucky ?? null };
    const nextRounds = [...savedRef.current.rounds, record].slice(-ROUNDS_MAX);
    setHistory(nextHistory);
    setRounds(nextRounds);
    persist({ history: nextHistory, rounds: nextRounds, pending: null });
    setResult(res);
    setPhase("result");

    // Stats, challenges and badges: done once the result is on screen, so
    // the reveal animation gets the main thread to itself (phones).
    const won = res.winners.length > 0;
    if (won) winStreak.current += 1;
    else winStreak.current = 0;
    const streak = winStreak.current;
    const ann = announced.current;
    window.setTimeout(() => {
      sessionStore.recordRoulette(res.staked, net);
      if (prev === res.n) unlock("twice");
      if (won) {
        track("rouletteWin");
        if (res.winners.some((k) => coverage(k).length === 1)) {
          track("rouletteStraight");
          unlock("straight");
        }
        if (res.n === 0) {
          track("rouletteZero");
          unlock("zero");
        }
        if (res.multiplied) {
          track("rouletteLightning");
          unlock("lightning");
        }
        if (ann) unlock("announce");
        if (streak >= 3) unlock("streak3");
        if (res.returned >= res.staked * 100) unlock("x100");
        if (net >= res.staked * 10) track("rouletteBigWin");
      }
    }, 700);
    if (res.returned > 0) {
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

  // ---- Autoplay: same bets, N spins, with stop rules.
  const startAuto = (count: number) => {
    if (phase === "spinning") return;
    autoStart.current = balance;
    if (spin()) setAutoLeft(count - 1);
  };
  const stopAuto = () => setAutoLeft(0);
  const actionsRef = useRef({ spin });
  actionsRef.current = { spin };
  // Leaving the roulette tab stops autoplay (it must not spin in the background).
  useEffect(() => {
    if (!active && autoLeft > 0) {
      setAutoLeft(0);
      setMessage("Autoplay stopped");
    }
  }, [active, autoLeft]);
  useEffect(() => {
    if (!active || phase !== "result" || autoLeft <= 0 || !result) return;
    const net = result.returned - result.staked;
    const stop =
      (autoStops.onWin && net > 0) ||
      (autoStops.onStraight && result.winners.some((k) => coverage(k).length === 1)) ||
      (autoStops.lossLimit > 0 && autoStart.current - balance >= autoStops.lossLimit) ||
      totalOf(lastBets) > balance;
    if (stop) {
      setAutoLeft(0);
      setMessage("Autoplay stopped");
      return;
    }
    const t = window.setTimeout(() => {
      if (actionsRef.current.spin()) setAutoLeft((n) => Math.max(0, n - 1));
      else setAutoLeft(0);
    }, 1900);
    return () => window.clearTimeout(t);
  }, [active, phase, autoLeft, result, autoStops, balance, lastBets]);

  // Keyboard: Space spin · U / Backspace undo · C clear · R rebet ·
  // X double · 1–9, 0 chip · T quick spin · L lightning · F focus.
  const actions = useRef({ spin, undo, clear, rebet, double, setChip, toggleQuick, toggleLightning, stopAuto });
  actions.current = { spin, undo, clear, rebet, double, setChip, toggleQuick, toggleLightning, stopAuto };
  const autoRef = useRef(0);
  autoRef.current = autoLeft;
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
        if (autoRef.current > 0) a.stopAuto();
        else a.spin();
      } else if (k === "u" || k === "backspace") a.undo();
      else if (k === "c") a.clear();
      else if (k === "r") a.rebet();
      else if (k === "x") a.double();
      else if (k === "t") a.toggleQuick();
      else if (k === "l") a.toggleLightning();
      else if (k === "f") window.dispatchEvent(new CustomEvent("royal-ace:toggle-focus"));
      else if (k >= "0" && k <= "9") a.setChip(ROULETTE_CHIPS[k === "0" ? 9 : Number(k) - 1]);
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
    lightning,
    lucky,
    theme,
    heatmap,
    history,
    rounds,
    favourites,
    badges,
    badgeToast,
    lastBets,
    result,
    target,
    spinId,
    message,
    refused,
    autoLeft,
    autoStops,
    canUndo: phase === "betting" && undoStack.length > 0,
    spinMs: quick ? SPIN_MS.quick : SPIN_MS.normal,
    place,
    placeMany,
    markAnnounced: () => (announced.current = true),
    undo,
    clear,
    rebet,
    double,
    setChip,
    toggleQuick,
    toggleLightning,
    setTheme,
    toggleHeatmap,
    renameFavourite,
    saveFavourite,
    applyFavourite,
    deleteFavourite,
    dismissBadge: () => setBadgeToast(null),
    startAuto,
    stopAuto,
    setAutoStops,
    spin,
    landed,
  };
}

export type RouletteGame = ReturnType<typeof useRoulette>;
