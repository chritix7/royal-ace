"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "./blackjack";
import { HAPTIC, haptic } from "./haptics";
import { sfx } from "./sound";
import { track } from "./events";
import { sessionStore } from "./sessionStore";
import { useBalance, wallet } from "./wallet";
import { ANTE_MAX, ANTE_MIN, BONUS_MAX, bonusOf, evaluate, freshDeck, hint, settle, type Evaluated, type Settlement } from "./poker";
import { brag } from "./brag";

/**
 * Casino Hold'em at the Royal Ace table: bets, the deal, Call / Fold, the
 * showdown and the payout. All nine cards are drawn when the hand is
 * dealt (and saved), so a reload never changes a hand: it resumes at the
 * decision, or settles a hand that was already called or folded.
 */

export type PokerPhase = "betting" | "dealing" | "decision" | "showdown" | "result";
export type Spot = "ante" | "bonus";
export type PokerBets = { ante: number; bonus: number };
export type Hand = { player: Card[]; dealer: Card[]; board: Card[] };
export type HandRecord = {
  id: number;
  at: number;
  player: Card[];
  dealer: Card[];
  board: Card[];
  ante: number;
  bonus: number;
  called: boolean;
  outcome: Settlement["outcome"];
  playerName: string;
  dealerName: string;
  staked: number;
  returned: number;
};

export const POKER_CHIPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000];
const HISTORY_MAX = 40;
const KEY = "royalace:poker";

type Pending = { id: number; hand: Hand; bets: PokerBets; stage: "decision" | "called" | "folded" };
type Saved = {
  chip: number;
  lastBets: PokerBets;
  history: HandRecord[];
  hintOn: boolean;
  best: number; // best final hand category ever (called hands)
  pending: Pending | null;
};
const EMPTY_BETS: PokerBets = { ante: 0, bonus: 0 };
const EMPTY: Saved = { chip: 100, lastBets: EMPTY_BETS, history: [], hintOn: true, best: -1, pending: null };

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const s = JSON.parse(raw) as Partial<Saved>;
    return {
      chip: POKER_CHIPS.includes(s.chip ?? 0) ? (s.chip as number) : EMPTY.chip,
      lastBets: { ...EMPTY_BETS, ...(s.lastBets ?? {}) },
      history: Array.isArray(s.history) ? s.history.slice(-HISTORY_MAX) : [],
      hintOn: s.hintOn ?? true,
      best: typeof s.best === "number" ? s.best : -1,
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

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function usePoker(active: boolean) {
  const balance = useBalance();
  const [phase, setPhase] = useState<PokerPhase>("betting");
  const [bets, setBets] = useState<PokerBets>(EMPTY_BETS);
  const [undoStack, setUndoStack] = useState<PokerBets[]>([]);
  const [chip, setChipState] = useState(EMPTY.chip);
  const [lastBets, setLastBets] = useState<PokerBets>(EMPTY_BETS);
  const [history, setHistory] = useState<HandRecord[]>([]);
  const [hintOn, setHintOn] = useState(true);
  const [best, setBest] = useState(-1);
  const [hand, setHand] = useState<Hand | null>(null);
  /** Cards on the table, in dealing order: P1 D1 P2 D2 F1 F2 F3 T R (0–9). */
  const [dealt, setDealt] = useState(0);
  const [dealerOpen, setDealerOpen] = useState(false);
  const [called, setCalled] = useState<boolean | null>(null);
  const [result, setResult] = useState<Settlement | null>(null);
  const [handId, setHandId] = useState(0);
  const [message, setMessage] = useState("Place your Ante");
  const [refused, setRefused] = useState(0);

  const savedRef = useRef<Saved>({ ...EMPTY });
  const persist = (patch: Partial<Saved>) => {
    savedRef.current = { ...savedRef.current, ...patch };
    save(savedRef.current);
  };
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      wallet.setLocked(false);
    };
  }, []);

  const refuse = (why: string) => {
    setMessage(why);
    setRefused((n) => n + 1);
    haptic(HAPTIC.tick);
    return false;
  };

  // ---- Settle and record (shared by the live game and a resumed hand)
  const finish = useCallback((p: Pending, wasCalled: boolean, quiet = false) => {
    const s = settle(p.bets, wasCalled, p.hand.player, p.hand.dealer, p.hand.board);
    if (s.returned > 0) wallet.add(s.returned);
    wallet.setLocked(false);
    const rec: HandRecord = {
      id: p.id,
      at: Date.now(),
      player: p.hand.player,
      dealer: p.hand.dealer,
      board: p.hand.board,
      ante: p.bets.ante,
      bonus: p.bets.bonus,
      called: wasCalled,
      outcome: s.outcome,
      playerName: s.player.name,
      dealerName: s.dealer.name,
      staked: s.staked,
      returned: s.returned,
    };
    const nextHistory = [...savedRef.current.history, rec].slice(-HISTORY_MAX);
    const nextBest = wasCalled ? Math.max(savedRef.current.best, s.player.cat) : savedRef.current.best;
    persist({ history: nextHistory, pending: null, best: nextBest });
    setHistory(nextHistory);
    setBest(nextBest);
    // Stats and challenges once the result is on screen.
    const net = s.returned - s.staked;
    window.setTimeout(() => {
      sessionStore.recordPoker(s.staked, net);
      track("pokerHand");
      if (s.outcome === "win" || s.outcome === "noQualify") track("pokerWin");
      if (s.bonusBack > 0) track("pokerBonus");
      if (wasCalled && s.player.cat >= 5) track("pokerFlush");
      if (net >= p.bets.ante * 10) {
        track("pokerBigWin");
        brag({ game: "Casino Hold'em", amount: net, mult: net / p.bets.ante });
      }
    }, quiet ? 0 : 700);
    return s;
  }, []);

  // ---- Restore (and settle a hand interrupted after the decision)
  useEffect(() => {
    const s = load();
    savedRef.current = s;
    setChipState(s.chip);
    setLastBets(s.lastBets);
    setHistory(s.history);
    setHintOn(s.hintOn);
    setBest(s.best);
    const p = s.pending;
    if (!p) return;
    setHandId(p.id);
    setHand(p.hand);
    setBets(p.bets);
    if (p.stage === "decision") {
      wallet.setLocked(true);
      // Take the player back to the table where the hand is waiting.
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("royal-ace:goto-tab", { detail: "poker" })), 0);
      setDealt(7);
      setPhase("decision");
      setMessage("Call or fold?");
    } else {
      const r = finish(p, p.stage === "called", true);
      setDealt(9);
      setDealerOpen(true);
      setCalled(p.stage === "called");
      setResult(r);
      setPhase("result");
      setMessage(resultLine(r));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const staked = bets.ante + bets.bonus;
  /** What a hand would still need: Ante + AA Bonus + the Call (2× Ante). */
  const needed = (b: PokerBets) => b.ante * 3 + b.bonus;
  const betting = phase === "betting" || phase === "result";

  // ---- Bets
  const newRoundIfDone = () => {
    if (phase !== "result") return;
    setPhase("betting");
    setResult(null);
    setHand(null);
    setDealt(0);
    setDealerOpen(false);
    setCalled(null);
  };
  const apply = (next: PokerBets) => {
    newRoundIfDone();
    setUndoStack((u) => [...u.slice(-30), phase === "result" ? EMPTY_BETS : bets]);
    setBets(next);
  };
  const place = (spot: Spot) => {
    if (!betting) return false;
    const base = phase === "result" ? EMPTY_BETS : bets;
    const max = spot === "ante" ? ANTE_MAX : BONUS_MAX;
    if (spot === "bonus" && base.ante === 0) return refuse("Place the Ante first");
    if (base[spot] >= max) return refuse(`${spot === "ante" ? "Ante" : "AA Bonus"} limit ◈ ${max.toLocaleString("en-US")}`);
    const add = Math.min(chip, max - base[spot]);
    const next = { ...base, [spot]: base[spot] + add };
    if (needed(next) > balance) return refuse("Not enough chips to cover the Call");
    sfx.chip();
    apply(next);
    setMessage(spot === "ante" ? "Ante placed · deal when ready" : "AA Bonus placed");
    return true;
  };
  const undo = () => {
    if (!betting || undoStack.length === 0) return;
    newRoundIfDone();
    setBets(undoStack[undoStack.length - 1]);
    setUndoStack((u) => u.slice(0, -1));
  };
  const clear = () => {
    if (!betting || (staked === 0 && phase !== "result")) return;
    apply(EMPTY_BETS);
    setMessage("Place your Ante");
  };
  const rebet = () => {
    if (!betting || lastBets.ante === 0) return;
    if (needed(lastBets) > balance) return refuse("Not enough chips to cover the Call");
    sfx.chip();
    apply({ ...lastBets });
  };
  const double = () => {
    if (!betting) return;
    const base = bets;
    if (base.ante === 0) return;
    const next = { ante: Math.min(ANTE_MAX, base.ante * 2), bonus: Math.min(BONUS_MAX, base.bonus * 2) };
    if (needed(next) > balance) return refuse("Not enough chips to cover the Call");
    sfx.chip();
    setUndoStack((u) => [...u.slice(-30), base]);
    if (phase === "result") {
      newRoundIfDone();
    }
    setBets(next);
  };
  const setChip = (v: number) => {
    setChipState(v);
    persist({ chip: v });
  };
  const toggleHint = () => {
    const on = !hintOn;
    setHintOn(on);
    persist({ hintOn: on });
    setMessage(on ? "Hints on · the suggested play shows at the flop" : "Hints off");
  };

  // ---- The hand
  const running = useRef(false);
  const deal = async () => {
    if (running.current || !(phase === "betting" || phase === "result")) return false;
    let round = bets;
    if (round.ante === 0 && lastBets.ante > 0) round = { ...lastBets };
    if (round.ante === 0) return refuse("Place your Ante first");
    if (round.ante < ANTE_MIN) return refuse(`Minimum Ante ◈ ${ANTE_MIN}`);
    if (needed(round) > balance) return refuse("Not enough chips to cover the Call");
    running.current = true;
    const deck = freshDeck();
    const h: Hand = { player: [deck[0], deck[2]], dealer: [deck[1], deck[3]], board: deck.slice(4, 9) };
    const id = handId + 1;
    wallet.add(-(round.ante + round.bonus));
    wallet.setLocked(true);
    persist({ pending: { id, hand: h, bets: round, stage: "decision" }, lastBets: round });
    setLastBets(round);
    setBets(round);
    setUndoStack([]);
    setHandId(id);
    setHand(h);
    setResult(null);
    setCalled(null);
    setDealerOpen(false);
    setDealt(0);
    setPhase("dealing");
    setMessage("Dealing…");
    for (let i = 1; i <= 7; i++) {
      await wait(i === 5 ? 420 : 230);
      if (!alive.current) return true;
      setDealt(i);
      sfx.deal();
    }
    await wait(380);
    if (!alive.current) return true;
    setPhase("decision");
    setMessage("Call 2× your Ante, or fold?");
    running.current = false;
    return true;
  };

  const reveal = async (p: Pending, wasCalled: boolean) => {
    setPhase("showdown");
    for (const i of [8, 9]) {
      await wait(wasCalled ? 620 : 380);
      if (!alive.current) return;
      setDealt(i);
      sfx.deal();
    }
    await wait(wasCalled ? 650 : 420);
    if (!alive.current) return;
    setDealerOpen(true);
    sfx.flip();
    await wait(wasCalled ? 900 : 600);
    if (!alive.current) return;
    const s = finish(p, wasCalled);
    setResult(s);
    setPhase("result");
    setMessage(resultLine(s));
    const net = s.returned - s.staked;
    if (s.returned > 0 && net > 0) {
      window.setTimeout(() => (net >= p.bets.ante * 10 ? sfx.bigWin() : sfx.win()), 120);
      haptic(net >= p.bets.ante * 10 ? HAPTIC.big : HAPTIC.win);
    } else if (s.outcome === "push") sfx.push();
    else if (s.outcome === "lose") sfx.lose();
    running.current = false;
  };

  const decide = (call: boolean) => {
    if (phase !== "decision" || !hand || running.current) return false;
    const p = savedRef.current.pending;
    if (!p) return false;
    running.current = true;
    if (call) {
      if (bets.ante * 2 > wallet.getBalance()) {
        running.current = false;
        return refuse("Not enough chips to call");
      }
      wallet.add(-bets.ante * 2);
      sfx.chip();
    }
    const next: Pending = { ...p, stage: call ? "called" : "folded" };
    persist({ pending: next });
    setCalled(call);
    setMessage(call ? "Call · the turn and the river…" : "Fold · the dealer shows");
    void reveal(next, call);
    return true;
  };

  // The hint for the hand on the table (at the decision).
  const advice = phase === "decision" && hand ? hint(hand.player, hand.board.slice(0, 3)) : null;

  // Live hands, from the cards the player can see.
  const visibleBoard = hand ? hand.board.slice(0, Math.max(0, Math.min(5, dealt - 4))) : [];
  const playerSeen = hand ? hand.player.slice(0, dealt >= 3 ? 2 : dealt >= 1 ? 1 : 0) : [];
  const playerHand: Evaluated | null = playerSeen.length === 2 && visibleBoard.length >= 3 ? evaluate([...playerSeen, ...visibleBoard]) : null;
  const dealerHand: Evaluated | null = hand && dealerOpen ? evaluate([...hand.dealer, ...hand.board]) : null;
  const bonusNow = hand && bets.bonus > 0 && visibleBoard.length >= 3 ? bonusOf([...hand.player, ...hand.board.slice(0, 3)]) : null;

  // ---- Keyboard: Space deal / call · F fold · C clear · R rebet · X double · U undo · 1–9, 0 chips · H hint
  const actions = useRef({ deal, decide, clear, rebet, double, undo, setChip, toggleHint, phase });
  actions.current = { deal, decide, clear, rebet, double, undo, setChip, toggleHint, phase };
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
        if (a.phase === "decision") a.decide(true);
        else a.deal();
      } else if (a.phase === "decision") {
        if (k === "c") a.decide(true);
        else if (k === "d") a.decide(false);
      } else if (k === "u" || k === "backspace") a.undo();
      else if (k === "c") a.clear();
      else if (k === "r") a.rebet();
      else if (k === "x") a.double();
      else if (k === "h") a.toggleHint();
      else if (k === "f") window.dispatchEvent(new CustomEvent("royal-ace:toggle-focus"));
      else if (k >= "0" && k <= "9") a.setChip(POKER_CHIPS[k === "0" ? 9 : Number(k) - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const inPlay = phase === "dealing" || phase === "decision" || phase === "showdown";
  const callStake = called ? bets.ante * 2 : 0;
  return {
    phase,
    bets,
    staked: inPlay || phase === "result" ? bets.ante + bets.bonus + callStake : staked,
    callStake,
    balance,
    chip,
    lastBets,
    history,
    hintOn,
    best,
    hand,
    dealt,
    dealerOpen,
    called,
    result,
    handId,
    message,
    refused,
    advice,
    playerHand,
    dealerHand,
    bonusNow,
    canUndo: betting && undoStack.length > 0,
    canDeal: (phase === "betting" || phase === "result") && (bets.ante > 0 || lastBets.ante > 0),
    place,
    undo,
    clear,
    rebet,
    double,
    setChip,
    toggleHint,
    deal,
    call: () => decide(true),
    fold: () => decide(false),
  };
}

export function resultLine(s: Settlement) {
  const net = s.returned - s.staked;
  const amt = (v: number) => `◈ ${v.toLocaleString("en-US")}`;
  if (s.outcome === "fold") return s.bonusBack ? `Folded · AA Bonus pays ${amt(s.bonusBack)}` : "Folded";
  if (s.outcome === "noQualify") return `Dealer doesn't qualify · you win ${amt(s.returned)}`;
  if (s.outcome === "win") return `You win ${amt(s.returned)}`;
  if (s.outcome === "push") return "Push · bets returned";
  return net > 0 ? `Dealer wins · AA Bonus pays ${amt(s.bonusBack)}` : "Dealer wins";
}

export type PokerGame = ReturnType<typeof usePoker>;
