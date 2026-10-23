// Moteur de la machine à sous : 5 rouleaux, 4 rangées, 20 lignes de gains.
// Tout est pur (aucun React) : on peut le tester et simuler des millions de tours.

export const REELS = 5;
export const ROWS = 4;

export type Sym = "cherry" | "lemon" | "grape" | "bell" | "gem" | "seven" | "wild" | "scatter";
export type Paying = Exclude<Sym, "scatter">;

export const EMOJI: Record<Sym, string> = {
  cherry: "🍒",
  lemon: "🍋",
  grape: "🍇",
  bell: "🔔",
  gem: "💎",
  seven: "7️⃣",
  wild: "👑",
  scatter: "⭐",
};

/** Ligne de gain = numéro de rangée (0 haut ... 3 bas) pour chacun des 5 rouleaux. */
export const PAYLINES: number[][] = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0],
  [1, 2, 3, 2, 1],
  [3, 2, 1, 2, 3],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [3, 3, 2, 3, 3],
  [1, 0, 0, 0, 1],
  [2, 3, 3, 3, 2],
  [0, 1, 1, 1, 0],
  [3, 2, 2, 2, 3],
  [1, 1, 0, 1, 1],
  [2, 2, 3, 2, 2],
  [0, 1, 2, 3, 3],
  [3, 2, 1, 0, 0],
  [1, 2, 2, 2, 1],
  [2, 1, 1, 1, 2],
];

/** Gains pour 3, 4 et 5 symboles identiques, en multiples de la mise PAR LIGNE. */
export const PAYS: Record<Paying, [number, number, number]> = {
  cherry: [5, 14, 42],
  lemon: [5, 14, 42],
  grape: [8, 22, 70],
  bell: [12, 36, 135],
  gem: [18, 68, 250],
  seven: [36, 180, 900],
  wild: [36, 180, 900],
};

/** Le scatter paie n'importe où, en multiples de la mise TOTALE. */
export const SCATTER_PAYS: Record<number, number> = { 3: 3, 4: 15, 5: 100 };
export const FS_AWARD: Record<number, number> = { 3: 10, 4: 15, 5: 20 };
export const FS_MULT = 2;
/** Free spins ajoutés quand 3, 4 ou 5 scatters tombent PENDANT les free spins. */
export const FS_RETRIGGER: Record<number, number> = { 3: 5, 4: 8, 5: 12 };
export const FS_CAP = 60;

export const BET_LEVELS = [20, 40, 60, 100, 200, 400, 600, 1000, 2000, 5000];

// Combien de fois chaque symbole apparaît sur la bande de chaque rouleau.
// Les rouleaux 2, 3 et 4 ont une bande plus longue (191 cases) pour que le wild reste rare.
// Le wild n'existe que sur les rouleaux 2, 3 et 4 (comme dans les vraies machines).
export const COUNTS: Record<Sym, number[]> = {
  cherry: [9, 40, 40, 40, 9],
  lemon: [8, 35, 35, 35, 8],
  grape: [7, 35, 35, 35, 7],
  bell: [6, 30, 30, 30, 6],
  gem: [5, 25, 25, 25, 5],
  seven: [4, 20, 20, 20, 4],
  wild: [0, 1, 1, 1, 0], // très rare : un wild étendu remplit tout un rouleau
  scatter: [1, 5, 5, 5, 1],
};
const ORDER = Object.keys(COUNTS) as Sym[];

/** Construit une bande par rouleau en répartissant les symboles le plus régulièrement possible. */
export function buildStrips(): Sym[][] {
  return Array.from({ length: REELS }, (_, r) => {
    const items: { key: number; si: number; sym: Sym }[] = [];
    ORDER.forEach((sym, si) => {
      const n = COUNTS[sym][r];
      const offset = (si * 0.381966 + r * 0.2) % 1;
      for (let j = 0; j < n; j++) items.push({ key: (j + offset) / n, si, sym });
    });
    items.sort((a, b) => a.key - b.key || a.si - b.si);
    return items.map((i) => i.sym);
  });
}
export const STRIPS: Sym[][] = buildStrips();

export type LineWin = { line: number; sym: Sym; count: number; pay: number };
/** Wild qui s'étend : sur les rouleaux 2, 3 et 4, un wild remplit tout le rouleau et déclenche un re-spin. */
export const WILD_REELS = [1, 2, 3];
export const MAX_RESPINS = 3;

export type SpinResult = {
  stops: number[];
  raw: Sym[][]; // ce que les rouleaux montrent à l'arrêt, avant l'expansion des wilds
  held: boolean[]; // rouleaux gardés (wild étendu) pendant ce re-spin
  expanded: number[]; // rouleaux où un wild s'est étendu à ce tour
  grid: Sym[][]; // grid[rouleau][rangée], après expansion : c'est elle qui est payée
  lineWins: LineWin[];
  cells: boolean[][]; // cellules gagnantes, même forme que grid
  scatters: number;
  scatterPay: number; // en multiples de la mise totale
  freeSpins: number; // free spins gagnés par ce tour
  total: number; // gain total en chips (mult. free spins inclus)
};

function evalLine(syms: Sym[]): { sym: Sym; count: number; pay: number } | null {
  let target: Paying | null = null;
  let count = 0;
  let lead = 0; // wilds au tout début de la ligne
  let leading = true;
  for (const s of syms) {
    if (s === "scatter") break;
    if (s === "wild") {
      count++;
      if (leading) lead++;
      continue;
    }
    leading = false;
    if (!target) {
      target = s;
      count++;
    } else if (s === target) count++;
    else break;
  }
  let best: { sym: Sym; count: number; pay: number } | null = null;
  if (target && count >= 3) best = { sym: target, count, pay: PAYS[target][count - 3] };
  if (lead >= 3) {
    const wp = PAYS.wild[lead - 3];
    if (!best || wp > best.pay) best = { sym: "wild", count: lead, pay: wp };
  }
  return best;
}

/** `scatterGrid` : où compter les scatters (null = pas de scatter, ex. pendant un re-spin). */
export function evaluate(grid: Sym[][], bet: number, mult = 1, stops: number[] = [], scatterGrid: Sym[][] | null = grid): SpinResult {
  const lineBet = bet / PAYLINES.length;
  const cells = grid.map((col) => col.map(() => false));
  const lineWins: LineWin[] = [];
  let linesPay = 0;

  PAYLINES.forEach((rows, li) => {
    const w = evalLine(rows.map((row, reel) => grid[reel][row]));
    if (!w) return;
    lineWins.push({ line: li + 1, ...w });
    linesPay += w.pay * lineBet;
    for (let reel = 0; reel < w.count; reel++) cells[reel][rows[reel]] = true;
  });

  const sg = scatterGrid ?? grid.map((col) => col.map((): Sym => "cherry"));
  const scatters = sg.reduce((n, col) => n + col.filter((s) => s === "scatter").length, 0);
  const scatterPay = scatters >= 3 ? SCATTER_PAYS[Math.min(scatters, 5)] : 0;
  if (scatters >= 3) {
    sg.forEach((col, reel) => col.forEach((s, row) => { if (s === "scatter") cells[reel][row] = true; }));
  }

  return {
    stops,
    raw: grid,
    held: grid.map(() => false),
    expanded: [],
    grid,
    lineWins,
    cells,
    scatters,
    scatterPay,
    freeSpins: scatters >= 3 ? FS_AWARD[Math.min(scatters, 5)] : 0,
    total: (linesPay + scatterPay * bet) * mult,
  };
}

/** Applique l'expansion des wilds puis calcule les gains, à partir de ce que les rouleaux affichent. */
export function resolveSpin(raw: Sym[][], bet: number, mult = 1, held: boolean[] = Array(REELS).fill(false), stops: number[] = []): SpinResult {
  // Un wild qui tombe sur les rouleaux 2, 3 ou 4 remplit tout le rouleau
  const grid = raw.map((col) => [...col]);
  const expanded: number[] = [];
  for (const k of WILD_REELS) {
    if (!held[k] && raw[k].includes("wild")) {
      grid[k] = Array<Sym>(ROWS).fill("wild");
      expanded.push(k);
    }
  }
  const isRespin = held.some(Boolean);
  const res = evaluate(grid, bet, mult, stops, isRespin ? null : raw);
  return { ...res, raw, held: [...held], expanded };
}

export function spin(rng: () => number, bet: number, mult = 1, held: boolean[] = Array(REELS).fill(false)): SpinResult {
  const stops = STRIPS.map((s) => Math.floor(rng() * s.length));
  const raw: Sym[][] = STRIPS.map((strip, r) => {
    if (held[r]) return Array<Sym>(ROWS).fill("wild"); // rouleau gardé : il ne tourne pas
    const L = strip.length;
    return Array.from({ length: ROWS }, (_, row) => strip[(stops[r] - 1 + row + L) % L]);
  });
  return resolveSpin(raw, bet, mult, held, stops);
}

/** Un tour complet : le tour de base, puis les re-spins déclenchés par les wilds étendus (3 maximum). */
export function playSequence(rng: () => number, bet: number, mult = 1): SpinResult[] {
  const steps = [spin(rng, bet, mult)];
  let held: boolean[] = Array(REELS).fill(false);
  while (steps[steps.length - 1].expanded.length > 0 && steps.length - 1 < MAX_RESPINS) {
    const last = steps[steps.length - 1];
    held = held.map((h, k) => h || last.expanded.includes(k));
    steps.push(spin(rng, bet, mult, held));
  }
  return steps;
}

/** Free spins ajoutés par un retrigger (0 si le plafond serait dépassé). */
export function retriggerSpins(scatters: number, used: number, left: number) {
  if (scatters < 3) return 0;
  const add = FS_RETRIGGER[Math.min(scatters, 5)];
  return used + left + add <= FS_CAP ? add : 0;
}

/**
 * Durées des rouleaux : chacun s'arrête un peu après le précédent. Si 2 scatters
 * sont déjà tombés, les rouleaux restants ralentissent ("suspense" comme en casino).
 * Les temps sont en millisecondes depuis le début du tour.
 */
export function reelTimings(
  grid: Sym[][],
  turbo = false,
  held: boolean[] = [],
  respin = false,
) {
  // Durées de base (en ms). Le mode turbo divise tout par deux ;
  // les re-spins conservent les durées normales.
  const first = respin ? 900 : (turbo ? 450 : 900);

  const step = respin ? 325 : (turbo ? 162.5 : 325);

  const suspense = turbo ? 325 : 650;

  const landMs = respin ? 280 : (turbo ? 140 : 280);

  const stopAt: number[] = [];
  const anticipate: boolean[] = [];

  let scattersSoFar = 0;
  let last = -1;

  for (let k = 0; k < grid.length; k++) {
    if (held[k]) {
      stopAt.push(0);
      anticipate.push(false);
      continue;
    }

    const slow = !respin && k >= 2 && scattersSoFar >= 2;

    const t =
      (last < 0 ? first : last + step) +
      (slow ? suspense : 0);

    anticipate.push(slow);
    stopAt.push(t);

    last = t;
    scattersSoFar += grid[k].filter((s) => s === "scatter").length;
  }

  return {
    stopAt,
    anticipate,
    landMs,
  };
}

/** Un bonus de free spins complet (avec re-spins et retriggers). Renvoie le gain total du bonus. */
export function playBonus(rng: () => number, bet: number, initialSpins = FS_AWARD[3]) {
  let total = 0;
  let respins = 0;
  let spins = 0;
  let left = initialSpins;
  let used = 0;
  while (left > 0) {
    left--;
    used++;
    spins++;
    const seq = playSequence(rng, bet, FS_MULT);
    total += seq.reduce((a, s) => a + s.total, 0);
    respins += seq.length - 1;
    left += retriggerSpins(seq[0].scatters, used, left);
  }
  return { total, respins, spins };
}

/** Une manche complète (tour de base + re-spins + free spins éventuels). Sert aux simulations. */
export function playRound(rng: () => number, bet: number) {
  const baseSeq = playSequence(rng, bet, 1);
  const base = baseSeq[0];
  const baseTotal = baseSeq.reduce((a, s) => a + s.total, 0);
  let total = baseTotal;
  let respins = baseSeq.length - 1;
  if (base.freeSpins > 0) {
    const bonus = playBonus(rng, bet, base.freeSpins);
    total += bonus.total;
    respins += bonus.respins;
  }
  return { total, triggered: base.freeSpins > 0, baseTotal, respins, expanded: base.expanded.length > 0 };
}

/** Gain moyen d'un bonus de 10 free spins, en multiples de la mise (sert à fixer le prix de l'achat de bonus). */
export function averageBonus(rounds: number, seed = 1, bet = 20) {
  const rng = mulberry32(seed);
  let sum = 0;
  for (let i = 0; i < rounds; i++) sum += playBonus(rng, bet).total;
  return sum / rounds / bet;
}

/** Générateur pseudo-aléatoire reproductible (pour des tests qui ne changent jamais). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simule `rounds` manches et résume : RTP, fréquence de gain, plus gros gain, free spins. */
export function simulate(rounds: number, seed = 1, bet = 10) {
  const rng = mulberry32(seed);
  let won = 0, hits = 0, max = 0, triggers = 0, big = 0, expands = 0, respins = 0;
  for (let i = 0; i < rounds; i++) {
    const r = playRound(rng, bet);
    won += r.total;
    if (r.total > 0) hits++;
    if (r.total > max) max = r.total;
    if (r.triggered) triggers++;
    if (r.expanded) expands++;
    respins += r.respins;
    if (r.total >= bet * 20) big++;
  }
  return {
    rtp: won / (rounds * bet),
    hitRate: hits / rounds,
    maxMultiple: max / bet,
    freeSpinEvery: triggers ? rounds / triggers : Infinity,
    bigWinEvery: big ? rounds / big : Infinity, // gain >= 20x la mise
    expandEvery: expands ? rounds / expands : Infinity, // un wild s'étend (tour de base)
    respinsPerRound: respins / rounds,
  };
}

/**
 * Retour au joueur, mesuré par simulation :
 * - jeu de base (lignes, wild étendu, re-spins, free spins) : environ 90,5 % ;
 * - coffre et jackpots (voir vault.ts) : environ 5,3 % ;
 * soit environ 96 % au total.
 */
export const BASE_RTP = 0.905;
export const THEORETICAL_RTP = 0.96;

/** Prix de l'achat de bonus : 10 free spins directs, en multiples de la mise (retour d'environ 96 %). */
export const BONUS_PRICE_MULT = 16.5;