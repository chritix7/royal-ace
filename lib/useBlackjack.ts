import { useCallback, useEffect, useRef, useState } from "react";
import { type Advice, type Card, type Hand, type Result, advise, canSplitCards, handValue, hiLo, isBlackjack, makeShoe } from "./blackjack";
import { perfectPairs, twentyOnePlusThree } from "./sidebets";
import { ACHIEVEMENTS } from "./achievements";
import { track as sendTrack } from "./events";
import { sfx } from "./sound";
import { music } from "./music";
import { wallet } from "./wallet";
import { CHIPS, MIN_BET, REFILL, EMPTY_STATS, EMPTY_RECORDS, DEFAULT_SETTINGS, INITIAL, BACKS, sleep as delay, floor10 } from "./game";
import type { S, Settings, Records } from "./game";
import { winHistory } from "./winHistory";
import { sessionStore } from "./sessionStore";
import {
  createPending,
  readRecovery,
  seededRandom,
  writeRecovery,
  type ActionName,
  type PendingAction,
  type RecoverySave,
  type RoundBreakdown,
  type Snapshot,
} from "./blackjackRecovery";

export type DealFlightEvent = {
  id: number;
  card: Card;
  target: "dealer" | `hand-${number}`;
  cardIndex: number;
  faceDown: boolean;
};

export function useBlackjack(active = true) {
  const activeRef = useRef(active);
  activeRef.current = active;

  // Ambiance musicale calme quand on joue au blackjack
  useEffect(() => {
    if (active) music.setMode("calm");
  }, [active]);
  // Un seul état + une ref miroir : les fonctions async lisent toujours la valeur à jour.
  const ref = useRef<S>(INITIAL);
  const [s, setS] = useState<S>(INITIAL);
  const [showHint, setShowHint] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [roundBreakdown, setRoundBreakdownState] =
  useState<RoundBreakdown | null>(null);

const breakdownRef = useRef<RoundBreakdown | null>(null);

const [dealEvents, setDealEvents] = useState<DealFlightEvent[]>([]);
const nextDealEventId = useRef(0);
const dealSequence = useRef(0);
const consumeDealEvent = useCallback((id: number) => {
  setDealEvents((events) => events.filter((event) => event.id !== id));
}, []);

function setRoundBreakdown(value: RoundBreakdown | null) {
  breakdownRef.current = value;
  setRoundBreakdownState(value);
}

  const roundSides = useRef({
    wagered: 0,
    perfectPairs: 0,
    twentyOnePlusThree: 0,
  });

  const ready = useRef(false);
const initialized = useRef(false);
const mounted = useRef(false);
const blocked = useRef(false);

const transaction = useRef<RecoverySave | null>(null);
const pendingResume = useRef<PendingAction | null>(null);
const actionRandom = useRef<() => number>(Math.random);
const resultTimer = useRef<number | null>(null);

function clearResultTimer() {
  if (resultTimer.current !== null) {
    clearTimeout(resultTimer.current);
    resultTimer.current = null;
  }
}

function scheduleResultReset() {
  clearResultTimer();

  resultTimer.current = window.setTimeout(() => {
    resultTimer.current = null;

    if (!mounted.current) return;

    const current = ref.current;

    if (current.phase !== "settled") return;

    set({
      hands: [],
      dealer: [],
      hole: false,
      insurance: 0,
      net: null,
      sideNote: null,
      celebrate: 0,
      phase: "betting",
      message: "Place your bet to start.",
    });
  }, 10000);
}

useEffect(() => {
  mounted.current = true;

  return () => {
    mounted.current = false;
  };
}, []);

function snapshot(): Snapshot {
  return {
    state: ref.current,
    sides: { ...roundSides.current },
    breakdown: breakdownRef.current,
  };
}

function saveIdle() {
  writeRecovery({
    version: 1,
    snapshot: snapshot(),
    pending: null,
  });
}

function storageFailure(error: unknown) {
  console.error("Blackjack persistence error:", error);
  blocked.current = true;

  ref.current = {
    ...ref.current,
    busy: true,
    message:
      "Save interrupted. Stop playing and reload to recover the last action.",
  };

  setS(ref.current);
}

async function sleep(ms: number) {
  await delay(ms);

  if (!mounted.current) {
    throw new Error("Blackjack component unmounted.");
  }
}

function emitOnce(key: string, effect: () => void) {
  const tx = transaction.current;
  const pending = tx?.pending;

  if (!tx || !pending) {
    effect();
    return;
  }

  if (pending.effects.includes(key)) return;

  const next: RecoverySave = {
    ...tx,
    pending: {
      ...pending,
      effects: [...pending.effects, key],
    },
  };

  writeRecovery(next);
  transaction.current = next;
  effect();
}

const track: typeof sendTrack = (...args) => {
  emitOnce(`track:${args[0]}`, () => sendTrack(...args));
};

  const set = (patch: Partial<S>) => {
  if (patch.balance !== undefined) {
    wallet.setBalanceDurable(patch.balance);
  }

  ref.current = { ...ref.current, ...patch };
  setS(ref.current);

  if (
    ready.current &&
    !transaction.current &&
    !blocked.current
  ) {
    try {
      saveIdle();
    } catch (error) {
      storageFailure(error);
    }
  }
};
  const setHand = (i: number, patch: Partial<Hand>) =>
    set({ hands: ref.current.hands.map((h, k) => (k === i ? { ...h, ...patch } : h)) });

  useEffect(() => {
  if (initialized.current) return;
  initialized.current = true;

  wallet.hydrate();
  sessionStore.hydrate();

  const balance = wallet.getBalance();

  set({
    balance,
    trend: [balance],
    bet: Math.max(
      0,
      Math.min(ref.current.bet, floor10(balance))
    ),
  });

  try {
    const raw = localStorage.getItem("royalace:blackjack");
    const d = raw ? JSON.parse(raw) : {};

    set({
      stats: { ...EMPTY_STATS, ...d.stats },
      settings: { ...DEFAULT_SETTINGS, ...d.settings },
      unlocked: Array.isArray(d.unlocked) ? d.unlocked : [],
      records: { ...EMPTY_RECORDS, ...d.records },
    });
  } catch (error) {
    console.warn("Could not read legacy Blackjack settings:", error);
  }

  try {
    const saved = readRecovery();

    if (saved) {
  roundSides.current = { ...saved.snapshot.sides };

  const restoredBalance = saved.pending
    ? saved.snapshot.state.balance
    : wallet.getBalance();

  if (saved.pending) {
    wallet.setBalanceDurable(restoredBalance);
    pendingResume.current = saved.pending;

    setRoundBreakdown(saved.snapshot.breakdown);

    set({
      ...saved.snapshot.state,
      balance: restoredBalance,
      busy: false,
      shuffling: false,
      celebrate: 0,
      toast: null,
    });
  } else if (saved.snapshot.state.phase === "settled") {
    // Manche déjà réglée avant le refresh : on repart sur l'écran de mise.
    setRoundBreakdown(null);

    set({
      ...saved.snapshot.state,
      balance: restoredBalance,
      busy: false,
      shuffling: false,
      celebrate: 0,
      toast: null,
      hands: [],
      dealer: [],
      hole: false,
      insurance: 0,
      net: null,
      sideNote: null,
      phase: "betting",
      message: "Place your bet to start.",
    });
  } else {
    setRoundBreakdown(saved.snapshot.breakdown);

    set({
      ...saved.snapshot.state,
      balance: restoredBalance,
      busy: false,
      shuffling: false,
      celebrate: 0,
      toast: null,
    });
  }
}

    ready.current = true;
    setHydrated(true);
  } catch (error) {
    storageFailure(error);
  }
}, []);

  // Si l'autre jeu change le solde, on le recopie ici tout de suite.
  useEffect(
    () =>
      wallet.subscribe(() => {
        const b = wallet.getBalance();
        if (b !== ref.current.balance) {
          ref.current = { ...ref.current, balance: b };
          setS(ref.current);
        }
      }),
    []
  );

  // Pendant une manche, on ne peut pas passer à l'autre jeu.
  useEffect(() => {
    wallet.setLocked(!(s.phase === "betting" || s.phase === "settled"));
  }, [s.phase]);
  useEffect(() => () => wallet.setLocked(false), []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "royalace:blackjack",
        JSON.stringify({ balance: s.balance, stats: s.stats, settings: s.settings, unlocked: s.unlocked, records: s.records })
      );
    } catch {}
  }, [hydrated, s.balance, s.stats, s.settings, s.unlocked, s.records]);

  async function runAction(
  name: ActionName,
  take?: boolean,
  resume?: PendingAction
) {
  if (
    !ready.current ||
    blocked.current ||
    transaction.current ||
    !mounted.current
  ) {
    return;
  }

  try {
    const pending = resume ?? createPending(name, take);

    const tx: RecoverySave = {
      version: 1,
      snapshot: snapshot(),
      pending,
    };

    writeRecovery(tx);
    transaction.current = tx;
    actionRandom.current = seededRandom(pending.seed);

    switch (name) {
      case "deal":
        await dealImpl();
        break;
      case "insurance":
        await takeInsuranceImpl(Boolean(pending.take));
        break;
      case "hit":
        await hitImpl();
        break;
      case "stand":
        await standImpl();
        break;
      case "double":
        await doubleImpl();
        break;
      case "split":
        await splitImpl();
        break;
      case "surrender":
        await surrenderImpl();
        break;
    }

    if (!mounted.current) return;

    writeRecovery({
      version: 1,
      snapshot: snapshot(),
      pending: null,
    });

    transaction.current = null;
    actionRandom.current = Math.random;
  } catch (error) {
    if (mounted.current) storageFailure(error);
  }
}

function deal() {
  return runAction("deal");
}

function takeInsurance(take: boolean) {
  return runAction("insurance", take);
}

function hit() {
  return runAction("hit");
}

function stand() {
  return runAction("stand");
}

function double() {
  return runAction("double");
}

function split() {
  return runAction("split");
}

function surrender() {
  return runAction("surrender");
}

useEffect(() => {
  if (!hydrated || !pendingResume.current) return;

  const pending = pendingResume.current;
  pendingResume.current = null;

  void runAction(pending.name, pending.take, pending);
}, [hydrated]);

  // ---------- Pioche ----------
  function draw(): Card {
    let shoe = ref.current.shoe;
    if (shoe.length === 0) {
  shoe = makeShoe(
    ref.current.settings.decks,
    actionRandom.current
  );
}
    const card = shoe[shoe.length - 1];
    set({ shoe: shoe.slice(0, -1) });
    return card;
  }
  function bumpDeal(
  card: Card,
  target: DealFlightEvent["target"],
  cardIndex: number,
  faceDown = false
) {
  setDealEvents((events) => [
    ...events,
    {
      id: ++dealSequence.current,
      card,
      target,
      cardIndex,
      faceDown,
    },
  ]);

  set({ dealTick: ref.current.dealTick + 1 });
}

function giveCard(i: number) {
  const card = draw();
  sfx.deal();

  const cardIndex = ref.current.hands[i].cards.length;
  setHand(i, { cards: [...ref.current.hands[i].cards, card] });

  bumpDeal(card, `hand-${i}`, cardIndex);
}

function giveDealer() {
  const card = draw();
  sfx.deal();

  const cardIndex = ref.current.dealer.length;
  set({ dealer: [...ref.current.dealer, card] });

  bumpDeal(
    card,
    "dealer",
    cardIndex,
    cardIndex === 1 && !ref.current.hole
  );
}

  function reveal() {
    if (!ref.current.hole) {
      set({ hole: true });
      sfx.flip();
    }
  }

  // ---------- Mise ----------
  const canBet = s.phase === "betting" || s.phase === "settled";
  function addChip(v: number) {
    if (!ready.current || blocked.current || transaction.current) return;
    const c = ref.current;
    if (c.phase !== "betting" && c.phase !== "settled") return;
    if ((c.bet + v) * c.settings.spots + c.ppBet + c.t3Bet <= c.balance) {
      set({ bet: c.bet + v });
      sfx.chip();
    }
  }
  function setBetTo(amount: number) {
    if (!ready.current || blocked.current || transaction.current) return;
    const c = ref.current;
    if (c.phase !== "betting" && c.phase !== "settled") return;
    const room = c.balance - c.ppBet - c.t3Bet;
    set({ bet: Math.max(0, Math.min(floor10(amount), floor10(room / c.settings.spots))) });
    sfx.chip();
  }
  function updateSettings(patch: Partial<Settings>) {
    if (!ready.current || blocked.current || transaction.current) return;
    const c = ref.current;
    if (patch.theme === undefined && c.phase !== "betting" && c.phase !== "settled") return;
    const settings = { ...c.settings, ...patch };
    set({
      settings,
      ...(patch.decks ? { shoe: [] } : {}),
      ...(patch.spots
        ? { bet: Math.min(c.bet, floor10((c.balance - c.ppBet - c.t3Bet) / patch.spots)) }
        : {}),
    });
  }

  function adjustSide(key: "ppBet" | "t3Bet", delta: number) {
    const c = ref.current;
    if (!ready.current || blocked.current || transaction.current) return;
    if (c.phase !== "betting" && c.phase !== "settled") return;
    const next = c[key] + delta;
    if (next < 0 || next > 100) return;
    if (c.bet * c.settings.spots + c.ppBet + c.t3Bet + delta > c.balance) return;
    set({ [key]: next } as Partial<S>);
    sfx.chip();
  }

  // ---------- Déroulé d'une manche ----------
  function unlock(id: string) {
  const c = ref.current;
  if (c.unlocked.includes(id)) return;
  set({ unlocked: [...c.unlocked, id] });
  sfx.win();
}

  /** Note ta décision avant qu'elle ne s'exécute et la compare à la stratégie de base. */
  function grade(action: Advice) {
    const c = ref.current;
    const h = c.hands[c.active];
    const up = c.dealer[0];
    if (!h || !up) return;
    const cd = h.cards.length === 2 && c.balance >= h.bet;
    const cs = canSplitCards(h.cards) && c.hands.length < 4 && c.balance >= h.bet;
    const best = advise(h.cards, up, cd, cs);
    const ok = best === action;
    set({
      stats: { ...c.stats, decisions: c.stats.decisions + 1, correct: c.stats.correct + (ok ? 1 : 0) },
      goodStreak: ok ? c.goodStreak + 1 : 0,
      coach: ok ? `✓ ${action} was the right play.` : `✗ You chose ${action}. Basic strategy says ${best}.`,
    });
    if (ok) track("bjCorrect");
    if (ok && c.goodStreak + 1 >= 10) unlock("sharp");
  }

  /** Paris annexes : résolus dès la distribution, sur la 1re main. */
  function resolveSide() {
  const c = ref.current;
  const sideWagered = c.ppBet + c.t3Bet;

  if (sideWagered === 0) return;

  const p = c.hands[0].cards;
  let ppPayout = 0;
  let t3Payout = 0;
  let big = false;
  const notes: string[] = [];

  if (c.ppBet > 0) {
    const w = perfectPairs(p[0], p[1]);

    if (w) {
      ppPayout = c.ppBet * (w.odds + 1);
      notes.push(`${w.label} +${c.ppBet * w.odds}`);
      unlock("pair");
      track("pairWin");

      if (w.odds >= 25) big = true;
    }
  }

  if (c.t3Bet > 0) {
    const w = twentyOnePlusThree(p[0], p[1], c.dealer[0]);

    if (w) {
      t3Payout = c.t3Bet * (w.odds + 1);
      notes.push(`${w.label} +${c.t3Bet * w.odds}`);
      unlock("suited");
      track("suitedWin");

      if (w.odds >= 40) big = true;
    }
  }

  const payout = ppPayout + t3Payout;

  roundSides.current = {
    wagered: sideWagered,
    perfectPairs: ppPayout - c.ppBet,
    twentyOnePlusThree: t3Payout - c.t3Bet,
  };

  const now = ref.current;

  if (payout > 0) sfx.win();

  set({
    balance: now.balance + payout,
    sideNote: notes.length
      ? `Side bets: ${notes.join(" · ")}`
      : "Side bets lost.",
    ...(big ? { celebrate: Date.now() } : {}),
  });
}

  async function dealImpl() {
    const c = ref.current;
    clearResultTimer();
    const { spots, decks } = c.settings;
    const stake = c.bet * spots + c.ppBet + c.t3Bet;
    if ((c.phase !== "betting" && c.phase !== "settled") || c.bet < MIN_BET || stake > c.balance) return;
    setRoundBreakdown(null);

    roundSides.current = {
      wagered: 0,
      perfectPairs: 0,
      twentyOnePlusThree: 0,
    };

    const fresh = c.shoe.length < Math.max(26, Math.floor(decks * 52 * 0.25));
    sfx.chip();
    set({
      shoe: fresh
  ? makeShoe(decks, actionRandom.current)
  : c.shoe,
      balance: c.balance - stake,
      lastBet: c.bet,
      hands: Array.from({ length: spots }, () => ({ cards: [], bet: c.bet, done: false, doubled: false, split: false })),
      dealer: [],
      hole: false,
      active: 0,
      insurance: 0,
      net: null,
      sideNote: null,
      celebrate: 0,
      phase: "dealing",
      shuffling: fresh,
      message: fresh ? "Shuffling a new shoe…" : "Dealing…",
    });
    if (fresh) {
      sfx.flip();
      await sleep(1100);
      set({ shuffling: false, message: "Dealing…" });
    }
    await sleep(250);

    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < spots; i++) {
        giveCard(i);
        await sleep(620);
      }
      giveDealer();
      await sleep(620);
    }
    await sleep(100);
    resolveSide();

    const { dealer, hands, balance } = ref.current;
    const total = hands.reduce((a, h) => a + h.bet, 0);
    if (dealer[0].rank === "A" && balance >= total / 2) {
      set({ phase: "insurance", message: "Dealer shows an Ace. Take insurance?" });
      return;
    }
    await peek();
  }

  async function takeInsuranceImpl(take: boolean) {
    const c = ref.current;
    if (c.phase !== "insurance" || c.busy) return;
    set({ busy: true });
    if (take) {
      const cost = c.hands.reduce((a, h) => a + h.bet, 0) / 2;
      set({ balance: c.balance - cost, insurance: cost });
      sfx.chip();
    }
    await peek();
    set({ busy: false });
  }

  /** Le croupier vérifie s'il a un blackjack. Les blackjacks du joueur sont réglés tout de suite. */
  async function peek() {
    const { dealer, hands } = ref.current;
    const naturals = hands.map((h) => isBlackjack(h.cards));
    if (isBlackjack(dealer) || naturals.every(Boolean)) {
      set({ phase: "dealer" });
      reveal();
      await sleep(900);
      await settle();
      return;
    }
    set({ hands: hands.map((h, i) => (naturals[i] ? { ...h, done: true } : h)), phase: "player" });
    await advance();
  }

  async function advance() {
    const { hands } = ref.current;
    const next = hands.findIndex((h) => !h.done);
    if (next === -1) {
      await dealerPlay();
      return;
    }
    set({ active: next, message: hands.length > 1 ? `Hand ${next + 1}: your move.` : "Your move." });
  }

  async function hitImpl() {
    const c = ref.current;
    if (c.phase !== "player" || c.busy) return;
    const i = c.active;
    grade("Hit");
    set({ busy: true });
    giveCard(i);
    await sleep(620);
    if (handValue(ref.current.hands[i].cards).total >= 21) {
      setHand(i, { done: true });
      await advance();
    }
    set({ busy: false });
  }

  async function standImpl() {
    const c = ref.current;
    if (c.phase !== "player" || c.busy) return;
    grade("Stand");
    set({ busy: true });
    setHand(c.active, { done: true });
    await advance();
    set({ busy: false });
  }

  async function doubleImpl() {
    const c = ref.current;
    const h = c.hands[c.active];
    if (c.phase !== "player" || c.busy || !h || h.cards.length !== 2 || c.balance < h.bet) return;
    grade("Double");
    set({ busy: true, balance: c.balance - h.bet });
    sfx.chip();
    setHand(c.active, { bet: h.bet * 2, doubled: true });
    giveCard(c.active);
    await sleep(700);
    setHand(c.active, { done: true });
    await advance();
    set({ busy: false });
  }

  async function splitImpl() {
    const c = ref.current;
    const h = c.hands[c.active];
    if (c.phase !== "player" || c.busy || !h || !canSplitCards(h.cards) || c.hands.length >= 4 || c.balance < h.bet) return;
    const i = c.active;
    const aces = h.cards[0].rank === "A";
    grade("Split");
    set({ busy: true, balance: c.balance - h.bet });
    sfx.chip();

    const a: Hand = { ...h, cards: [h.cards[0]], split: true };
    const b: Hand = { cards: [h.cards[1]], bet: h.bet, done: false, doubled: false, split: true };
    const hands = [...c.hands];
    hands.splice(i, 1, a, b);
    set({ hands, message: "Split!" });
    await sleep(350);

    giveCard(i); await sleep(620);
    giveCard(i + 1); await sleep(620);

    // As splittés : une seule carte chacun. 21 : main terminée.
    set({
      hands: ref.current.hands.map((x, k) =>
        (k === i || k === i + 1) && (aces || handValue(x.cards).total === 21) ? { ...x, done: true } : x
      ),
    });
    await advance();
    set({ busy: false });
  }

  /** Abandon : seulement en début de main, sans split. Rend la moitié de la mise. */
  async function surrenderImpl() {
    const c = ref.current;
    const h = c.hands[0];
    if (c.phase !== "player" || c.busy || c.hands.length !== 1 || !h || h.cards.length !== 2 || h.split) return;
    set({ busy: true, phase: "dealer", message: "You surrender." });
    setHand(0, { done: true, result: "surrender" });
    reveal();
    await sleep(800);
    await settle();
    set({ busy: false });
  }

  async function dealerPlay() {
    set({ phase: "dealer", message: "Dealer's turn…" });
    reveal();
    await sleep(900);
    const { h17 } = ref.current.settings;
    const anyLive = ref.current.hands.some(
      (h) => h.result !== "surrender" && !(!h.split && isBlackjack(h.cards)) && handValue(h.cards).total <= 21
    );
    for (;;) {
      const { total, soft } = handValue(ref.current.dealer);
      if (!anyLive || total > 17 || (total === 17 && !(h17 && soft))) break;
      giveDealer();
      await sleep(800);
    }
    await settle();
  }

  async function settle() {
    const c = ref.current;
    if (c.phase === "settled") return;

const settlementId = transaction.current?.pending?.id;

if (!settlementId) {
  throw new Error("Missing Blackjack settlement identifier.");
}
    const dv = handValue(c.dealer).total;
    const dBJ = isBlackjack(c.dealer);
    let payout = 0;
    let wagered = c.insurance;
    let gotBJ = false;
    let doubledWin = false;
    let splitWin = false;
    let doubledWins = 0; // nombre de mains doublées gagnées
    let splitWins = 0; // nombre de mains splittées gagnées
    let won = 0, lost = 0, pushed = 0;

    const hands = c.hands.map((h) => {
      wagered += h.bet;
      if (h.result === "surrender") {
        payout += h.bet / 2;
        lost++;
        return h;
      }
      const pv = handValue(h.cards).total;
      const pBJ = !h.split && isBlackjack(h.cards);
      let result: Result;
      if (pv > 21) result = "bust";
      else if (pBJ && !dBJ) {
        result = "blackjack";
        payout += h.bet + (c.settings.bj65 ? (h.bet * 6) / 5 : (h.bet * 3) / 2);
        gotBJ = true;
      } else if (dBJ && !pBJ) result = "lose";
      else if (pBJ && dBJ) { result = "push"; payout += h.bet; }
      else if (dv > 21 || pv > dv) { result = "win"; payout += h.bet * 2; }
      else if (pv === dv) { result = "push"; payout += h.bet; }
      else result = "lose";

      if (result === "win" || result === "blackjack") {
        won++;
        if (h.doubled) {
          doubledWin = true;
          doubledWins++;
        }
        if (h.split) {
          splitWin = true;
          splitWins++;
        }
      } else if (result === "push") pushed++;
      else lost++;
      return { ...h, result, done: true };
    });

    const insurancePayout = dBJ ? c.insurance * 3 : 0;
    payout += insurancePayout;

    const insuranceNet = insurancePayout - c.insurance;
    const mainNet =
      (payout - insurancePayout) - (wagered - c.insurance);

    const sides = roundSides.current;
    const sideNet = sides.perfectPairs + sides.twentyOnePlusThree;

    const net = mainNet + insuranceNet + sideNet;
    const balance = c.balance + payout;

    setRoundBreakdown({
      main: mainNet,
      insurance: insuranceNet,
      perfectPairs: sides.perfectPairs,
      twentyOnePlusThree: sides.twentyOnePlusThree,
      total: net,
    });
    const streak = net > 0 ? c.streak + 1 : net < 0 ? 0 : c.streak;
    const records: Records = {
      biggestWin: Math.max(c.records.biggestWin, net),
      bestStreak: Math.max(c.records.bestStreak, streak),
      peakBalance: Math.max(c.records.peakBalance, balance),
    };

    const message = hands.every((h) => h.result === "surrender")
      ? "You surrendered. Half your bet is returned."
      : gotBJ
      ? `Blackjack! Pays ${c.settings.bj65 ? "6 to 5" : "3 to 2"}.`
      : dBJ
      ? "Dealer has blackjack."
      : hands.every((h) => h.result === "bust")
      ? "Bust. The dealer wins."
      : net > 0
      ? "Round complete · net profit."
      : net < 0
      ? "Round complete · net loss."
      : "Round complete · break even.";

    if (gotBJ) sfx.blackjack();
    else if (net > 0) sfx.win();
    else if (hands.every((h) => h.result === "bust")) sfx.bust();
    else if (net < 0) sfx.lose();
    else sfx.push();

    // Le croupier a vraiment joué sa main (il n'a ni blackjack, ni joué contre des mains déjà perdues)
    const dealerPlayed = !dBJ && hands.some((h) => h.result !== "bust" && h.result !== "surrender" && h.result !== "blackjack");

    // Les mises sont ramenées à ce que le solde permet encore
    const spots = c.settings.spots;
    const bet = Math.min(c.bet, floor10(balance / spots));
    const ppBet = Math.min(c.ppBet, floor10(balance - bet * spots));
    const t3Bet = Math.min(c.t3Bet, floor10(balance - bet * spots - ppBet));

    set({
      hands,
      balance,
      net,
      message,
      phase: "settled",
      hole: true,
      bet,
      ppBet,
      t3Bet,
      streak,
      records,
      celebrate: gotBJ || net >= 200 ? Date.now() : ref.current.celebrate,
      history: [...c.history, { net, bj: gotBJ }].slice(-14),
      trend: [...c.trend, balance].slice(-40),
      stats: {
        ...ref.current.stats,
        played: c.stats.played + 1,
        won: c.stats.won + won,
        lost: c.stats.lost + lost,
        pushed: c.stats.pushed + pushed,
        blackjacks: c.stats.blackjacks + (gotBJ ? 1 : 0),
        profit: ref.current.stats.profit + net,
        // Contrôle d'équité : ce que fait réellement le croupier
        dealerBJs: c.stats.dealerBJs + (dBJ ? 1 : 0),
        dealerPlayed: c.stats.dealerPlayed + (dealerPlayed ? 1 : 0),
        dealerBusts: c.stats.dealerBusts + (dealerPlayed && dv > 21 ? 1 : 0),
      },
    });

    scheduleResultReset();

    sessionStore.recordBjOnce(
  settlementId,
  wagered + sides.wagered,
  net
);

    // On annonce ce qui s'est passé (les missions et succès écoutent)
    track("bjHand", hands.length);
    track("bjWin", won);
    if (gotBJ) track("bjBlackjack");
    track("bjDouble", doubledWins);
    track("bjSplit", splitWins);
    if (streak > 0) track("bjStreak", streak);

    if (gotBJ) {
  emitOnce("blackjack-history", () => {
    winHistory.record({
      game: "blackjack",
      kind: "blackjack",
      amount: Math.max(0, net),
    });
  });
}

    if (gotBJ) unlock("bj");
    if (streak >= 5) unlock("streak5");
    if (doubledWin) unlock("double");
    if (splitWin) unlock("split");
    if (balance >= 10000) unlock("rich");
  }

  function refill() {
    if (!ready.current || blocked.current || transaction.current) return;
    const c = ref.current;
    if ((c.phase !== "betting" && c.phase !== "settled") || c.balance >= MIN_BET) return;
    sfx.win();
    set({ balance: c.balance + REFILL, bet: 20, message: `Refill: ◈ ${REFILL} added. Good luck!` });
  }

  function resetAll() {
    if (!ready.current || blocked.current || transaction.current) return;
    const c = ref.current;
    clearResultTimer();

  if (
    c.phase !== "betting" &&
    c.phase !== "settled"
  ) {
    return;
  }

  const confirmed = window.confirm(
    [
      "Reset the shared wallet and Blackjack statistics?",
      "",
      `The shared Slots / Blackjack wallet will be set to ${INITIAL.balance.toLocaleString("en-US")} chips.`,
      "",
      "Blackjack session statistics and recent round history will be cleared.",
      "",
      "Table settings, achievements, personal records, Slots statistics and Today tracking will be kept.",
      "",
      "This cannot be undone.",
    ].join("\n")
  );

  if (!confirmed) return;

  setRoundBreakdown(null);

  roundSides.current = {
    wagered: 0,
    perfectPairs: 0,
    twentyOnePlusThree: 0,
  };

  set({
    ...INITIAL,
    settings: c.settings,
    shoe: c.shoe,
    unlocked: c.unlocked,
    records: c.records,
    trend: [INITIAL.balance],
    message: "Wallet and Blackjack stats reset. Place your bet.",
  });
}

  // ---------- Raccourcis clavier ----------
  const actions = useRef({ hit, stand, double, split, surrender, deal, addChip });
  actions.current = { hit, stand, double, split, surrender, deal, addChip };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
  if (
    !activeRef.current ||
    e.metaKey ||
    e.ctrlKey ||
    e.altKey ||
    e.repeat ||
    e.isComposing
  ) {
    return;
  }

  const target = e.target;

  if (
    target instanceof HTMLElement &&
    (
      target.isContentEditable ||
      target.closest(
        "input, textarea, select, button, summary, a, [role='dialog']"
      )
    )
  ) {
    return;
  }

  const k = e.key.toLowerCase();
      const a = actions.current;
      if (k === "h") a.hit();
      else if (k === "s") a.stand();
      else if (k === "d") a.double();
      else if (k === "p") a.split();
      else if (k === "r") a.surrender();
      else if (k >= "1" && k <= "5") a.addChip(CHIPS[Number(k) - 1]);
      else if (k === " " || k === "enter") {
        const ph = ref.current.phase;
        if (ph === "betting" || ph === "settled") {
          e.preventDefault();
          a.deal();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- Dérivés d'affichage ----------
  const hand = s.hands[s.active];
  const playing = s.phase === "player" && !s.busy;
  const canDouble = playing && !!hand && hand.cards.length === 2 && s.balance >= hand.bet;
  const canSplit = playing && !!hand && canSplitCards(hand.cards) && s.hands.length < 4 && s.balance >= hand.bet;
  const canSurrender = playing && s.hands.length === 1 && !!hand && hand.cards.length === 2 && !hand.split;
  const advice =
    showHint && playing && hand && s.dealer[0] ? advise(hand.cards, s.dealer[0], canDouble, canSplit) : null;

  const dealerShown = s.hole ? s.dealer : s.dealer.slice(0, 1);
  const dealerVal = handValue(dealerShown);
  const outOfChips = canBet && s.balance < MIN_BET;
  const totalCards = s.settings.decks * 52;
  const shoePct = s.shoe.length ? Math.min(100, Math.round((s.shoe.length / totalCards) * 100)) : 100;
  const resolvedHands =
  s.stats.won + s.stats.lost + s.stats.pushed;

const winRate = resolvedHands
  ? Math.round((s.stats.won / resolvedHands) * 100)
  : 0;
  const compact = s.hands.length > 1;
  const spots = s.settings.spots;
  const sides = s.ppBet + s.t3Bet;
  const stake = s.bet * spots + sides;
  const back = BACKS[s.settings.theme];
  const pileAmount = canBet ? s.bet * spots : s.hands.reduce((sum, h) => sum + h.bet, 0);

  // Comptage Hi-Lo : le sabot est équilibré, donc compte courant = -(somme du sabot restant),
  // sans compter la carte cachée du croupier tant qu'elle n'est pas retournée.
  const hiddenCard = !s.hole && s.dealer[1] ? hiLo(s.dealer[1]) : 0;
  const running = s.shoe.length ? -s.shoe.reduce((a, c) => a + hiLo(c), 0) - hiddenCard : 0;
  const decksLeft = s.shoe.length / 52;
  const trueCount = decksLeft > 0.5 ? running / decksLeft : running;

  return {
    s,
    roundBreakdown,
    dealEvents,
    consumeDealEvent,
    showHint,
    setShowHint,
    showCount,
    setShowCount,
    canBet,
    playing,
    canDouble,
    canSplit,
    canSurrender,
    advice,
    dealerVal,
    outOfChips,
    totalCards,
    shoePct,
    winRate,
    compact,
    spots,
    sides,
    stake,
    back,
    pileAmount,
    running,
    trueCount,
    decksLeft,
    deal,
    takeInsurance,
    hit,
    stand,
    double,
    split,
    surrender,
    addChip,
    setBetTo,
    adjustSide,
    updateSettings,
    refill,
    resetAll,
  };
}

export type Game = ReturnType<typeof useBlackjack>;
