"use client";

import { useEffect, useRef, useState } from "react";
import {
  BET_LEVELS,
  BONUS_PRICE_MULT,
  FS_AWARD,
  FS_MULT,
  PAYLINES,
  REELS,
  ROWS,
  STRIPS,
  reelTimings,
  playSequence,
  retriggerSpins,
  type LineWin,
  type Sym,
} from "./slots";
import { track } from "./events";
import { GAMBLE_MAX_ROUNDS, canGamble, drawGambleCard, type CardColor } from "./gamble";
import { HAPTIC, haptic } from "./haptics";
import { JACKPOTS, growPools, resetPool, sanitizePools, freshPools, type JackpotTier, type Pools } from "./jackpot";
import { VAULT_PICKS, VAULT_TRIGGER, drawVault, settleVault, type VaultPrize } from "./vault";
import { music } from "./music";
import type { SlotLabels } from "./skins";
import { sfx } from "./sound";
import { useBalance, wallet } from "./wallet";
import { winHistory } from "./winHistory";

export type SlotStats = { spins: number; wagered: number; won: number; biggest: number; freeSpinRounds: number; vaults: number; jackpotWins: number };
export type FreeSpins = { left: number; played: number; total: number; win: number };
export type Tier = "" | "big" | "mega" | "epic";
export type VaultState = { prizes: VaultPrize[]; picks: number[]; done: boolean; bet: number; pools: Pools };
export type GambleState = {
  amount: number;
  rounds: number;
  phase: "choose" | "flip" | "result";
  guess?: CardColor;
  card: { color: CardColor; suit: string } | null;
  won: boolean | null;
};

type S = {
  grid: Sym[][];
  target: Sym[][];
  spinId: number;
  stopAt: number[];
  landMs: number;
  anticipate: boolean[];
  held: boolean[];
  expanding: number[];
  winBanner: { label: string; amount: number; tier: Tier } | null;
  pools: Pools;
  vault: VaultState | null;
  gamble: GambleState | null;
  confirmBuy: boolean;
  spinning: boolean[];
  cells: boolean[][];
  lineWins: LineWin[];
  betIdx: number;
  busy: boolean;
  turbo: boolean;
  message: string;
  lastWin: number;
  autoLeft: number;
  fs: FreeSpins | null;
  banner: string | null;
  celebrate: number;
  stats: SlotStats;
  history: number[];
};

const KEY = "royalace:slots";
const EMPTY_STATS: SlotStats = { spins: 0, wagered: 0, won: 0, biggest: 0, freeSpinRounds: 0, vaults: 0, jackpotWins: 0 };
const emptyCells = () => Array.from({ length: REELS }, () => Array<boolean>(ROWS).fill(false));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const INITIAL: S = {
  grid: STRIPS.map((strip) => Array.from({ length: ROWS }, (_, r) => strip[r])),
  target: STRIPS.map((strip) => Array.from({ length: ROWS }, (_, r) => strip[r])),
  spinId: 0,
  stopAt: Array(REELS).fill(0),
  landMs: 560,
  anticipate: Array(REELS).fill(false),
  held: Array(REELS).fill(false),
  expanding: [],
  winBanner: null,
  pools: freshPools(),
  vault: null,
  gamble: null,
  confirmBuy: false,
  spinning: Array(REELS).fill(false),
  cells: emptyCells(),
  lineWins: [],
  betIdx: 1,
  busy: false,
  turbo: false,
  message: "Choose your bet and spin.",
  lastWin: 0,
  autoLeft: 0,
  fs: null,
  banner: null,
  celebrate: 0,
  stats: EMPTY_STATS,
  history: [],
};

const DEFAULT_LABELS: SlotLabels = { big: "BIG WIN", mega: "MEGA WIN", epic: "EPIC WIN", freeSpins: "FREE SPINS" };
function debugVault() {
  try {
    return localStorage.getItem("royalace:debug") === "vault";
  } catch {}
  return false;
}

const tierOf = (ratio: number): Tier => (ratio >= 100 ? "epic" : ratio >= 50 ? "mega" : ratio >= 20 ? "big" : "");
const fmt = (n: number) => n.toLocaleString("en-US");

export function useSlots(active: boolean, labels: SlotLabels = DEFAULT_LABELS) {
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  const ref = useRef<S>(INITIAL);
  const [s, setS] = useState<S>(INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const stopRef = useRef(false);
  const balance = useBalance();

  const set = (patch: Partial<S>) => {
    ref.current = { ...ref.current, ...patch };
    setS(ref.current);
  };
  const speed = () => (ref.current.turbo ? 0.5 : 1);

  useEffect(() => {
    wallet.hydrate();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        set({
          stats: { ...EMPTY_STATS, ...d.stats },
          betIdx: Math.min(Math.max(0, d.betIdx ?? 1), BET_LEVELS.length - 1),
          turbo: !!d.turbo,
          pools: sanitizePools(d.pools),
        });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ stats: s.stats, betIdx: s.betIdx, turbo: s.turbo, pools: s.pools }));
    } catch {}
  }, [hydrated, s.stats, s.betIdx, s.turbo, s.pools]);

  const bet = BET_LEVELS[s.betIdx];

  async function runSpin(free: boolean, mult: number) {
    const b = BET_LEVELS[ref.current.betIdx];
    if (!free) {
      wallet.add(-b);
      set({ pools: growPools(ref.current.pools) });
    }
    const steps = playSequence(Math.random, b, mult);
    let spinTotal = 0;

    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      const respin = i > 0;
      if (respin) {
        track("respin");
        sfx.respin();
        set({ message: `Re-spin ${i}!` });
        await sleep(650 * speed());
      }
      const { stopAt, anticipate, landMs } = reelTimings(st.raw, ref.current.turbo, st.held, respin);
      set({
        target: st.raw,
        spinId: ref.current.spinId + 1,
        stopAt,
        landMs,
        anticipate,
        held: st.held,
        expanding: [],
        spinning: st.held.map((h) => !h),
        cells: emptyCells(),
        lineWins: [],
        ...(respin ? {} : { lastWin: 0 }),
        message: respin ? `Re-spin ${i}!` : free ? "Free spin…" : "Good luck…",
      });
      sfx.spin();

      const t0 = performance.now();
      let scatters = 0;
      for (let k = 0; k < REELS; k++) {
        if (st.held[k]) continue;
        if (anticipate[k] && !anticipate[k - 1]) sfx.tension();
        await sleep(Math.max(0, stopAt[k] - (performance.now() - t0)));
        set({
          grid: ref.current.grid.map((col, r) => (r === k ? st.raw[k] : col)),
          spinning: ref.current.spinning.map((v, r) => (r === k ? false : v)),
        });
        sfx.reelStop();
        if (st.raw[k].includes("wild")) sfx.wildLand();
        const sc = st.raw[k].filter((x) => x === "scatter").length;
        if (sc > 0) {
          scatters += sc;
          sfx.scatterLand(scatters);
        }
      }
      await sleep(250 * speed());

      if (st.expanded.length > 0) {
        track("wildExpand");
        sfx.wildExpand();
        haptic(HAPTIC.big);
        set({ expanding: st.expanded, message: "WILD EXPANDS!" });
        await sleep(800 * speed());
        set({ grid: st.grid, expanding: [] });
      }

      if (st.total > 0) {
        wallet.add(st.total);
        spinTotal += st.total;
        const ratio = st.total / b;
        set({ cells: st.cells, lineWins: st.lineWins, lastWin: spinTotal, message: `You won ◈ ${fmt(spinTotal)}` });
        if (ratio >= 20) sfx.bigWin();
        else sfx.win();
        haptic(ratio >= 20 ? HAPTIC.big : HAPTIC.win);
        await sleep((ratio >= 10 ? 1500 : 900) * speed());
      }
    }
    return { total: spinTotal, scatters: steps[0].scatters, freeSpins: steps[0].freeSpins };
  }

  async function runFreeSpins(initial: number) {
    sfx.freeSpins();
    set({
      banner: `${initial} ${labelsRef.current.freeSpins}!`,
      fs: { left: initial, played: 0, total: initial, win: 0 },
      message: `All wins ×${FS_MULT} during free spins`,
    });
    await sleep(1900 * speed());
    set({ banner: null });

    let left = initial;
    let granted = initial;
    let used = 0;
    let fsWin = 0;
    while (left > 0) {
      left--;
      used++;
      set({ fs: { left, played: used, total: granted, win: fsWin } });
      const r = await runSpin(true, FS_MULT);
      fsWin += r.total;

      const add = retriggerSpins(r.scatters, used, left);
      if (add > 0) {
        left += add;
        granted += add;
        sfx.freeSpins();
        set({ banner: `+${add} ${labelsRef.current.freeSpins}!` });
        await sleep(1500 * speed());
        set({ banner: null });
      }
      set({ fs: { left, played: used, total: granted, win: fsWin } });
    }
    set({ fs: null, message: `Bonus complete: ◈ ${fmt(fsWin)}` });
    await sleep(900 * speed());
    return fsWin;
  }

  const vaultDone = useRef<(() => void) | null>(null);
  async function runVault(b: number) {
    sfx.vault();
    music.duck(2500);
    set({ banner: "VAULT BONUS!" });
    await sleep(1700 * speed());
    set({ banner: null, vault: { prizes: drawVault(Math.random), picks: [], done: false, bet: b, pools: ref.current.pools } });
    await new Promise<void>((resolve) => {
      vaultDone.current = resolve;
    });
    const v = ref.current.vault!;
    const res = settleVault(v.prizes, v.picks, v.pools, b);
    let pools = ref.current.pools;
    const wins: { tier: JackpotTier; amount: number }[] = [];
    res.items.forEach((it) => {
      if (it.prize.kind === "jackpot") {
        wins.push({ tier: it.prize.tier, amount: it.value });
        pools = resetPool(pools, it.prize.tier);
      }
    });
    wallet.add(res.total);
    set({ vault: null, pools });
    return { total: res.total, wins };
  }
  function vaultPick(i: number) {
    const v = ref.current.vault;
    if (!v || v.done || v.picks.includes(i) || v.picks.length >= VAULT_PICKS) return;
    const picks = [...v.picks, i];
    sfx.caseOpen();
    haptic(HAPTIC.tick);
    set({ vault: { ...v, picks, done: picks.length >= VAULT_PICKS } });
  }
  function vaultCollect() {
    if (ref.current.vault?.done) vaultDone.current?.();
  }

  const JP_TIER: Record<JackpotTier, Tier> = { mini: "big", minor: "mega", major: "epic", kingpin: "epic" };

  async function oneRound() {
    const b = BET_LEVELS[ref.current.betIdx];
    const base = await runSpin(false, 1);
    let total = base.total;
    const triggered = base.freeSpins > 0;
    let vaultHit = false;
    let jackpots: { tier: JackpotTier; amount: number }[] = [];

    if (debugVault() || Math.random() < VAULT_TRIGGER) {
      vaultHit = true;
      const v = await runVault(b);
      total += v.total;
      jackpots = v.wins;
      winHistory.record({ game: "slots", kind: "vault", amount: v.total });
    }
    if (triggered) total += await runFreeSpins(base.freeSpins);

    const ratio = total / b;
    const tier = tierOf(ratio);
    const st = ref.current.stats;
    set({
      stats: {
        spins: st.spins + 1,
        wagered: st.wagered + b,
        won: st.won + total,
        biggest: Math.max(st.biggest, total),
        freeSpinRounds: st.freeSpinRounds + (triggered ? 1 : 0),
        vaults: st.vaults + (vaultHit ? 1 : 0),
        jackpotWins: st.jackpotWins + jackpots.length,
      },
      history: [...ref.current.history, ratio].slice(-14),
      lastWin: total,
      message: total > 0 ? `You won ◈ ${fmt(total)}` : "No win this time. Spin again!",
    });

    track("spin");
    if (total > 0) track("slotWin");
    if (ratio >= 20) {
      track("bigWin");
      winHistory.record({ game: "slots", kind: "bigWin", amount: total });
    }
    if (triggered) track("bonus");
    if (vaultHit) track("vault");
    track("jackpot", jackpots.length);
    for (const jackpot of jackpots) {
      winHistory.record({ game: "slots", kind: "jackpot", amount: jackpot.amount });
    }

    if (jackpots.length > 0) {
      for (const j of jackpots) {
        sfx.jackpot();
        sfx.coin(20);
        music.duck(5200);
        haptic(HAPTIC.epic);
        set({ winBanner: { label: `${JACKPOTS[j.tier].label} JACKPOT`, amount: j.amount, tier: JP_TIER[j.tier] }, celebrate: Date.now() });
        await sleep(5400 * speed());
        set({ winBanner: null });
      }
    } else if (tier) {
      sfx.bigWin();
      sfx.coin(tier === "epic" ? 14 : 8);
      music.duck(3400);
      haptic(HAPTIC.epic);
      set({ winBanner: { label: labelsRef.current[tier], amount: total, tier }, celebrate: Date.now() });
      await sleep((tier === "epic" ? 4600 : 3400) * speed());
      set({ winBanner: null });
    }
    return { total, triggered, vault: vaultHit, ratio, jackpots };
  }

  async function play(count = 1) {
    if (ref.current.busy) return;
    stopRef.current = false;
    set({ busy: true, autoLeft: count > 1 ? count : 0, celebrate: 0, banner: null, gamble: null, confirmBuy: false });
    wallet.setLocked(true);
    sfx.lever();

    let remaining = count;
    while (remaining > 0) {
      const b = BET_LEVELS[ref.current.betIdx];
      if (wallet.getBalance() < b) {
        set({ message: "Not enough chips for this bet. Lower it or refill." });
        break;
      }
      const r = await oneRound();
      remaining--;
      set({ autoLeft: remaining > 0 ? remaining : 0 });
      if (count === 1 && canGamble(r.total, b, r.triggered || r.vault)) {
        set({ gamble: { amount: r.total, rounds: 0, phase: "choose", card: null, won: null } });
      }
      if (stopRef.current || r.triggered || r.vault || r.ratio >= 20) break;
      if (remaining > 0) await sleep(450 * speed());
    }

    wallet.setLocked(false);
    set({ busy: false, autoLeft: 0 });
  }

  async function gambleChoose(guess: CardColor) {
    const g = ref.current.gamble;
    if (!g || g.phase !== "choose" || ref.current.busy) return;
    set({ gamble: { ...g, phase: "flip", guess } });
    sfx.card();
    await sleep(900 * speed());
    const draw = drawGambleCard(Math.random, guess);
    const st = ref.current.stats;
    const card = { color: draw.color, suit: draw.suit };
    if (draw.won) {
      track("gambleWin");
      wallet.add(g.amount);
      const rounds = g.rounds + 1;
      const amount = g.amount * 2;
      sfx.win();
      haptic(HAPTIC.win);
      set({
        gamble: { amount, rounds, phase: "result", card, won: true, guess },
        lastWin: amount,
        message: `Doubled! ◈ ${fmt(amount)}`,
        stats: { ...st, won: st.won + g.amount, biggest: Math.max(st.biggest, amount) },
      });
      await sleep(1600 * speed());
      if (rounds < GAMBLE_MAX_ROUNDS) {
        set({ gamble: { amount, rounds, phase: "choose", card, won: true, guess } });
      }
    } else {
      const lost = Math.min(g.amount, wallet.getBalance());
      wallet.add(-lost);
      sfx.lose();
      set({
        gamble: { amount: 0, rounds: g.rounds + 1, phase: "result", card, won: false, guess },
        lastWin: 0,
        message: "Wrong color. The win is lost.",
        stats: { ...st, won: st.won - lost },
      });
    }
  }
  const gambleCollect = () => set({ gamble: null });

  const gambleOpen = s.gamble !== null;
  useEffect(() => {
    if (gambleOpen) wallet.setLocked(true);
    else if (!ref.current.busy) wallet.setLocked(false);
  }, [gambleOpen]);

  const bonusPrice = BONUS_PRICE_MULT * bet;
  async function runBuy(price: number) {
    const b = BET_LEVELS[ref.current.betIdx];
    set({ confirmBuy: false, gamble: null, busy: true, celebrate: 0, banner: null });
    wallet.setLocked(true);
    wallet.add(-price);
    sfx.lever();
    const win = await runFreeSpins(FS_AWARD[3]);
    track("bonus");
    const r = win / price;
    const tier: Tier = r >= 6 ? "epic" : r >= 3 ? "mega" : r >= 1.5 ? "big" : "";
    const st = ref.current.stats;
    set({
      stats: {
        ...st,
        spins: st.spins + 1,
        wagered: st.wagered + price,
        won: st.won + win,
        biggest: Math.max(st.biggest, win),
        freeSpinRounds: st.freeSpinRounds + 1,
      },
      history: [...ref.current.history, win / b].slice(-14),
      lastWin: win,
      message: win > 0 ? `Bonus paid ◈ ${fmt(win)}` : "The bonus paid nothing this time.",
    });
    if (tier) {
      sfx.bigWin();
      sfx.coin(tier === "epic" ? 14 : 8);
      music.duck(3400);
      haptic(HAPTIC.epic);
      set({ winBanner: { label: labelsRef.current[tier], amount: win, tier }, celebrate: Date.now() });
      await sleep((tier === "epic" ? 4600 : 3400) * speed());
      set({ winBanner: null });
    }
    wallet.setLocked(false);
    set({ busy: false });
  }
  function buyBonus() {
    const c = ref.current;
    if (c.busy || c.fs || wallet.getBalance() < bonusPrice) return;
    if (!c.confirmBuy) {
      set({ confirmBuy: true });
      window.setTimeout(() => set({ confirmBuy: false }), 4000);
      return;
    }
    void runBuy(bonusPrice);
  }

  const stopAuto = () => {
    stopRef.current = true;
    set({ autoLeft: 0 });
  };

  function setBetIdx(i: number) {
    if (ref.current.busy) return;
    const next = Math.min(BET_LEVELS.length - 1, Math.max(0, i));
    if (next === ref.current.betIdx) return;
    set({ betIdx: next, confirmBuy: false });
    sfx.chip();
  }
  const changeBet = (delta: number) => setBetIdx(ref.current.betIdx + delta);
  function maxBet() {
    const b = wallet.getBalance();
    let idx = 0;
    BET_LEVELS.forEach((v, i) => {
      if (v <= b) idx = i;
    });
    setBetIdx(idx);
  }
  const toggleTurbo = () => set({ turbo: !ref.current.turbo });
  function refill() {
    if (ref.current.busy || wallet.getBalance() >= BET_LEVELS[0]) return;
    wallet.add(500);
    sfx.win();
    set({ message: "Refill: ◈ 500 added. Good luck!" });
  }

  const actions = useRef({ play, stopAuto, changeBet });
  actions.current = { play, stopAuto, changeBet };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active || e.metaKey || e.ctrlKey || e.altKey) return;
      const a = actions.current;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (ref.current.busy) {
          if (ref.current.autoLeft > 0) a.stopAuto();
        } else a.play(1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        a.changeBet(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        a.changeBet(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => () => wallet.setLocked(false), []);

  const bonus = s.fs !== null;
  useEffect(() => {
    if (active) music.setMode(bonus ? "bonus" : "normal");
  }, [active, bonus]);

  const lineBet = bet / PAYLINES.length;
  const canSpin = !s.busy && balance >= bet;
  return {
    s, balance, bet, lineBet, canSpin, play, stopAuto, setBetIdx, changeBet, maxBet, toggleTurbo, refill,
    bonusPrice, buyBonus, vaultPick, vaultCollect, gambleChoose, gambleCollect,
  };
}

export type SlotsGame = ReturnType<typeof useSlots>;