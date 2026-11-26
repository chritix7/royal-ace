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
export const FS_MULT = 1; // free spins pay like the base game: the sticky wilds make the difference
/** Free spins ajoutés quand 3, 4 ou 5 scatters tombent PENDANT les free spins. */
export const FS_RETRIGGER: Record<number, number> = { 3: 5, 4: 8, 5: 12 };
export const FS_CAP = 60;

/** Total bet per spin. Levels are only ever added at the end: the saved
 *  choice is an index. Up to 100K, like the other high-roller tables. */
export const BET_LEVELS = [20, 40, 60, 100, 200, 400, 600, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

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
const STACK_SIZES = [1, 2, 3, 1, 2];

/** Construit une bande par rouleau en répartissant les symboles le plus régulièrement possible. */
export function buildStrips(counts: Record<Sym, number[]> = COUNTS, stack?: Sym): Sym[][] {
  return Array.from({ length: REELS }, (_, r) => {
    const items: { key: number; si: number; sym: Sym }[] = [];
    ORDER.forEach((sym, si) => {
      const n = counts[sym][r];
      const offset = (si * 0.381966 + r * 0.2) % 1;
      if (sym === stack) {
        // Stacked: groups of 1, 2 or 3 in a row, so one reel can show several.
        const sizes: number[] = [];
        for (let left = n, i = 0; left > 0; i++) {
          const k = Math.min(left, STACK_SIZES[(i + r) % STACK_SIZES.length]);
          sizes.push(k);
          left -= k;
        }
        sizes.forEach((k, g) => { for (let j = 0; j < k; j++) items.push({ key: (g + offset) / sizes.length, si, sym }); });
        return;
      }
      for (let j = 0; j < n; j++) items.push({ key: (j + offset) / n, si, sym });
    });
    items.sort((a, b) => a.key - b.key || a.si - b.si);
    return items.map((i) => i.sym);
  });
}
export const STRIPS: Sym[][] = buildStrips();

/**
 * Penthouse Spins (free spins): STICKY WILDS. The reels are the same, with a
 * few more wilds, on every reel. A wild that lands stays where it is until the
 * last free spin, and the next ones pile up with it. No expansion and no
 * re-spin during the free spins.
 */
export const FS_WILDS = [1, 2, 1, 2, 1];
export const FS_COUNTS: Record<Sym, number[]> = { ...COUNTS, wild: FS_WILDS };
export const FS_STRIPS: Sym[][] = buildStrips(FS_COUNTS);
export type Sticky = boolean[][];
export const noSticky = (): Sticky => Array.from({ length: REELS }, () => Array<boolean>(ROWS).fill(false));
export const noMults = (): number[][] => Array.from({ length: REELS }, () => Array<number>(ROWS).fill(1));

/**
 * The machines share this engine; each has one signature feature.
 * - classic / miami: expanding wild + re-spins; free spins with sticky wilds.
 * - gold: every wild carries a ×2, ×3 or ×5 multiplier (they multiply
 *   together on a line, up to ×50); it stays in its cell (no expansion);
 *   free spins: more wilds, each one sticky and ×2.
 * - pharaoh: expanding wild + re-spins; free spins with one EXPANDING SYMBOL
 *   drawn at the start, which fills its reels and pays on every line.
 * `pay` and `fsPay` scale the line pays so every machine returns the same.
 */
export type MachineId = "classic" | "miami" | "gold" | "pharaoh";
export type Machine = {
  pay: number;
  fs: "sticky" | "expand";
  fsPay: number;
  fsWilds: number[];
  mults?: { v: number; w: number }[];
  /** Highest multiplier on one line. */
  cap?: number;
  /** Free spins: their own multipliers and cap (default: the base ones). */
  fsMults?: { v: number; w: number }[];
  fsCap?: number;
  /** Wilds per reel strip in the base game (default COUNTS.wild). */
  wilds?: number[];
  /** Other symbol counts on the strips (base and free spins). */
  counts?: Partial<Record<Sym, number[]>>;
  /** Royal Bells: the bell is the link symbol (no line pay); 5+ start the bell bonus. */
  link?: boolean;
  /** This symbol comes in stacks of 1 to 3 on the strips. */
  stack?: Sym;
  /** No free spins from scatters (they still pay). */
  noFs?: boolean;
  /** false: the wild stays in its cell (no expansion, no re-spin). */
  expand?: boolean;
  /** Pharaoh: scale of the expanding symbol's pay. */
  bookPay?: number;
};
export const BELLS_ON_REELS = [2, 7, 7, 7, 2];
export const setBellsOnReels = (b: number[]) => { BELLS_ON_REELS.splice(0, 5, ...b); STRIP_CACHE.clear(); };
export const MACHINES: Record<MachineId, Machine> = {
  // Royal Bells (the old Classic): fruit lines, the red 7 as a wild on every
  // reel, bells that show their value, and the bell bonus. Scatters pay
  // anywhere but give no free spins.
  classic: { fs: "sticky", fsPay: 1, fsWilds: FS_WILDS, link: true, noFs: true, counts: { bell: BELLS_ON_REELS, scatter: [0, 0, 0, 0, 0] }, stack: "bell", wilds: [2, 6, 6, 6, 2], expand: false, pay: 0.593 },
  miami: { pay: 1, fs: "sticky", fsPay: 1, fsWilds: FS_WILDS },
  // Gold: wilds on every reel (about one spin in 4), each with its multiplier; it stays in its cell.
  gold: { pay: 1.02, wilds: [1, 1, 1, 1, 1], fs: "sticky", fsPay: 0.55, fsWilds: [1, 2, 1, 2, 1], expand: false, mults: [{ v: 2, w: 60 }, { v: 3, w: 28 }, { v: 5, w: 12 }], cap: 50, fsMults: [{ v: 2, w: 1 }], fsCap: 2 },
  pharaoh: { pay: 1, fs: "expand", fsPay: 1, fsWilds: [0, 3, 3, 3, 0], bookPay: 0.03 },
};
const STRIP_CACHE = new Map<string, Sym[][]>();
function baseStrips(m: Machine): Sym[][] {
  if (!m.wilds && !m.counts) return STRIPS;
  const key = "b" + JSON.stringify([m.wilds, m.counts]);
  let st = STRIP_CACHE.get(key);
  if (!st) STRIP_CACHE.set(key, (st = buildStrips({ ...COUNTS, ...(m.counts ?? {}), ...(m.wilds ? { wild: m.wilds } : {}) } as Record<Sym, number[]>, m.stack)));
  return st;
}
function fsStrips(m: Machine): Sym[][] {
  const key = JSON.stringify([m.fsWilds, m.counts]);
  let st = STRIP_CACHE.get(key);
  if (!st) STRIP_CACHE.set(key, (st = buildStrips({ ...COUNTS, ...(m.counts ?? {}), wild: m.fsWilds } as Record<Sym, number[]>, m.stack)));
  return st;
}
export function drawMult(rng: () => number, m: Machine): number {
  if (!m.mults) return 1;
  const total = m.mults.reduce((t, x) => t + x.w, 0);
  let r = rng() * total;
  for (const x of m.mults) if ((r -= x.w) <= 0) return x.v;
  return m.mults[m.mults.length - 1].v;
}
/** Symbols the Pharaoh can pick for the free spins (lower ones more often). */
export const BOOK_SYMS: { sym: Paying; w: number }[] = [
  { sym: "cherry", w: 26 },
  { sym: "lemon", w: 26 },
  { sym: "grape", w: 20 },
  { sym: "bell", w: 14 },
  { sym: "gem", w: 9 },
  { sym: "seven", w: 5 },
];
export function drawBook(rng: () => number): Paying {
  const total = BOOK_SYMS.reduce((t, x) => t + x.w, 0);
  let r = rng() * total;
  for (const x of BOOK_SYMS) if ((r -= x.w) <= 0) return x.sym;
  return "cherry";
}
export const LINE_MULT_CAP = 50;

export type LineWin = { line: number; sym: Sym; count: number; pay: number; mult?: number };
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
  /** Royal Ace Gold: multiplier of each wild cell (1 elsewhere). */
  mults?: number[][];
  /** Royal Bells: bells on the screen (5+ start the bell bonus). */
  bells?: number;
  /** Royal Bells: the value shown on each bell (index = reel * ROWS + row). */
  bellVals?: (Bell | null)[];
}; 
export type EvalOpts = { mults?: number[][] | null; pay?: number; cap?: number };

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
export function evaluate(grid: Sym[][], bet: number, mult = 1, stops: number[] = [], scatterGrid: Sym[][] | null = grid, opts: EvalOpts = {}): SpinResult {
  const scale = opts.pay ?? 1;
  const mg = opts.mults ?? null;
  const lineBet = bet / PAYLINES.length;
  const cells = grid.map((col) => col.map(() => false));
  const lineWins: LineWin[] = [];
  let linesPay = 0;

  PAYLINES.forEach((rows, li) => {
    const w = evalLine(rows.map((row, reel) => grid[reel][row]));
    if (!w) return;
    let lm = 1;
    if (mg) for (let reel = 0; reel < w.count; reel++) if (grid[reel][rows[reel]] === "wild") lm *= mg[reel][rows[reel]] || 1;
    lm = Math.min(opts.cap ?? LINE_MULT_CAP, lm);
    lineWins.push({ line: li + 1, ...w, ...(lm > 1 ? { mult: lm } : {}) });
    linesPay += w.pay * lineBet * lm * scale;
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
    total: Math.round((linesPay + scatterPay * bet) * mult),
    ...(mg ? { mults: mg } : {}),
  };
}

/** Applique l'expansion des wilds puis calcule les gains, à partir de ce que les rouleaux affichent.
 *  `reelMult`: Royal Ace Gold, the multiplier of each expanded (or held) wild reel. */
export function resolveSpin(raw: Sym[][], bet: number, mult = 1, held: boolean[] = Array(REELS).fill(false), stops: number[] = [], m: Machine = MACHINES.miami, reelMult: number[] = Array(REELS).fill(1)): SpinResult {
  // Un wild qui tombe sur les rouleaux 2, 3 ou 4 remplit tout le rouleau
  const grid = raw.map((col) => [...col]);
  const expanded: number[] = [];
  if (m.expand !== false)
    for (const k of WILD_REELS) {
      if (!held[k] && raw[k].includes("wild")) {
        grid[k] = Array<Sym>(ROWS).fill("wild");
        expanded.push(k);
      }
    }
  const isRespin = held.some(Boolean);
  const mults = m.mults ? grid.map((col, k) => col.map((x) => (x === "wild" ? reelMult[k] || 1 : 1))) : null;
  // Royal Bells: bells are not a line symbol (they break the line, like a scatter).
  const lineGrid = m.link ? grid.map((col) => col.map((x): Sym => (x === "bell" ? "scatter" : x))) : grid;
  const res = evaluate(lineGrid, bet, mult, stops, isRespin ? null : raw, { mults, pay: m.pay, cap: m.cap });
  const bells = m.link && !isRespin ? raw.reduce((n, col) => n + col.filter((x) => x === "bell").length, 0) : 0;
  return { ...res, grid, raw, held: [...held], expanded, ...(m.noFs ? { freeSpins: 0 } : {}), ...(m.link ? { bells } : {}) };
}

export function spin(rng: () => number, bet: number, mult = 1, held: boolean[] = Array(REELS).fill(false), m: Machine = MACHINES.miami, reelMult: number[] = Array(REELS).fill(1)): SpinResult & { reelMult: number[] } {
  const strips = baseStrips(m);
  const stops = strips.map((s) => Math.floor(rng() * s.length));
  const raw: Sym[][] = strips.map((strip, r) => {
    if (held[r]) return Array<Sym>(ROWS).fill("wild"); // rouleau gardé : il ne tourne pas
    const L = strip.length;
    return Array.from({ length: ROWS }, (_, row) => strip[(stops[r] - 1 + row + L) % L]);
  });
  const rm = [...reelMult];
  if (m.mults) for (let k = 0; k < REELS; k++) if (!held[k] && raw[k].includes("wild")) rm[k] = drawMult(rng, m);
  // (one multiplier per reel: a reel shows at most one wild in a 4-row window)
  const res = resolveSpin(raw, bet, mult, held, stops, m, rm);
  // Royal Bells: every bell shows its value on the reels already.
  if (m.link && !held.some(Boolean)) return { ...res, bellVals: startBoard(raw, rng), reelMult: rm };
  return { ...res, reelMult: rm };
}

/** Un tour complet : le tour de base, puis les re-spins déclenchés par les wilds étendus (3 maximum). */
export function playSequence(rng: () => number, bet: number, mult = 1, m: Machine = MACHINES.miami): SpinResult[] {
  let rm: number[] = Array(REELS).fill(1);
  const first = spin(rng, bet, mult, undefined, m, rm);
  rm = first.reelMult;
  const steps: SpinResult[] = [first];
  let held: boolean[] = Array(REELS).fill(false);
  while (steps[steps.length - 1].expanded.length > 0 && steps.length - 1 < MAX_RESPINS) {
    const last = steps[steps.length - 1];
    held = held.map((h, k) => h || last.expanded.includes(k));
    const next = spin(rng, bet, mult, held, m, rm);
    rm = next.reelMult;
    steps.push(next);
  }
  return steps;
}

/**
 * One free spin with sticky wilds. `sticky` = the wilds already on the reels
 * (they cover whatever spins under them). The new wilds join them.
 * `mults` (Royal Ace Gold): the multiplier of each wild cell, new ones included.
 */
export function stickyFromRaw(raw: Sym[][], sticky: Sticky, bet: number, mult: number, stops: number[] = [], mults: number[][] | null = null, pay = 1, cap = LINE_MULT_CAP) {
  const grid = raw.map((col, r) => col.map((s, row): Sym => (sticky[r][row] ? "wild" : s)));
  // Scatters count only where no sticky wild covers the reel.
  const scatterGrid = raw.map((col, r) => col.map((s, row): Sym => (sticky[r][row] ? "cherry" : s)));
  const res = evaluate(grid, bet, mult, stops, scatterGrid, { mults, pay, cap });
  const landed: [number, number][] = [];
  raw.forEach((col, r) => col.forEach((s, row) => { if (s === "wild" && !sticky[r][row]) landed.push([r, row]); }));
  const next = sticky.map((col, r) => col.map((v, row) => v || raw[r][row] === "wild"));
  return { ...res, raw, landed, sticky: next };
}

/** State carried from one free spin to the next. */
export type FsState = { sticky: Sticky; mults: number[][]; book: Paying | null };
export const freshFs = (m: Machine, rng: () => number = Math.random): FsState => ({ sticky: noSticky(), mults: noMults(), book: m.fs === "expand" ? drawBook(rng) : null });

export type FreeSpinResult = SpinResult & {
  landed: [number, number][];
  sticky: Sticky;
  /** Pharaoh: reels the book symbol fills, the reels the Pharaoh fills, and what the symbol paid. */
  bookReels: number[];
  wildReels?: number[];
  bookPay: number;
  state: FsState;
};

/** Pharaoh's free spin: plain wilds, then the book symbol expands on its reels and pays on every line. */
export function expandFromRaw(raw: Sym[][], book: Paying, bet: number, mult: number, stops: number[] = [], pay = 1, bookScale = 1) {
  // The Pharaoh (wild) fills his reel during the tomb spins, and his reel
  // also counts for the expanding symbol.
  const grid = raw.map((col) => (col.includes("wild") ? Array<Sym>(ROWS).fill("wild") : [...col]));
  const wildReels = raw.map((col, r) => (col.includes("wild") ? r : -1)).filter((r) => r >= 0);
  const res = evaluate(grid, bet, mult, stops, raw, { pay });
  const withBook = raw.map((col, r) => (col.includes(book) ? r : -1)).filter((r) => r >= 0);
  const reels = [...new Set([...withBook, ...wildReels])].sort((a, b) => a - b);
  // At least one real book symbol is needed (wilds alone do not pay it).
  let bookPay = 0;
  if (reels.length >= 3 && withBook.length > 0) {
    bookPay = Math.round(PAYS[book][Math.min(reels.length, 5) - 3] * (bet / PAYLINES.length) * PAYLINES.length * bookScale * mult);
    for (const r of reels) for (let row = 0; row < ROWS; row++) res.cells[r][row] = true;
  }
  const bookReels = bookPay ? withBook.filter((r) => !wildReels.includes(r)) : [];
  return { ...res, raw, grid, total: res.total + bookPay, bookReels, wildReels, bookPay };
}

export function freeSpin(rng: () => number, bet: number, mult: number, st: FsState | Sticky, m: Machine = MACHINES.miami): FreeSpinResult {
  const state: FsState = Array.isArray(st) ? { sticky: st, mults: noMults(), book: null } : st;
  const strips = fsStrips(m);
  const stops = strips.map((s) => Math.floor(rng() * s.length));
  const raw: Sym[][] = strips.map((strip, r) => {
    const L = strip.length;
    return Array.from({ length: ROWS }, (_, row) => strip[(stops[r] - 1 + row + L) % L]);
  });
  if (m.fs === "expand" && state.book) {
    const r = expandFromRaw(raw, state.book, bet, mult, stops, m.fsPay, m.bookPay ?? 1);
    return { ...r, landed: [], sticky: state.sticky, state };
  }
  let mults = state.mults;
  if (m.mults) {
    const fm: Machine = { ...m, mults: m.fsMults ?? m.mults };
    mults = state.mults.map((col) => [...col]);
    raw.forEach((col, r) => col.forEach((s, row) => { if (s === "wild" && !state.sticky[r][row]) mults[r][row] = drawMult(rng, fm); }));
  }
  const r = stickyFromRaw(raw, state.sticky, bet, mult, stops, m.mults ? mults : null, m.fsPay, m.fsCap ?? m.cap);
  return { ...r, bookReels: [], bookPay: 0, state: { sticky: r.sticky, mults, book: null } };
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
  // Durées de base (en ms). Le mode turbo divise tout par deux, re-spins compris.
  // Turbo halves the re-spins too.
  const k = turbo ? 0.5 : 1;
  const first = 900 * k;
  const step = 325 * k;
  const suspense = 650 * k;
  const landMs = 280 * k;

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
export function playBonus(rng: () => number, bet: number, initialSpins = FS_AWARD[3], m: Machine = MACHINES.miami) {
  let total = 0;
  let spins = 0;
  let left = initialSpins;
  let used = 0;
  let st = freshFs(m, rng);
  while (left > 0) {
    left--;
    used++;
    spins++;
    const r = freeSpin(rng, bet, FS_MULT, st, m);
    st = r.state;
    total += r.total;
    left += retriggerSpins(r.scatters, used, left);
  }
  const wilds = st.sticky.flat().filter(Boolean).length;
  return { total, respins: 0, spins, wilds };
}

/** Une manche complète (tour de base + re-spins + free spins éventuels). Sert aux simulations. */
export function playRound(rng: () => number, bet: number, m: Machine = MACHINES.miami) {
  const baseSeq = playSequence(rng, bet, 1, m);
  const base = baseSeq[0];
  const baseTotal = baseSeq.reduce((a, s) => a + s.total, 0);
  let total = baseTotal;
  let respins = baseSeq.length - 1;
  if (base.freeSpins > 0) {
    const bonus = playBonus(rng, bet, base.freeSpins, m);
    total += bonus.total;
    respins += bonus.respins;
  }
  let bellTotal = 0;
  if (m.link && (base.bells ?? 0) >= BELL_TRIGGER) {
    const start = base.bellVals ?? startBoard(base.raw, rng);
    const steps = playBells(rng, start);
    const end = steps.length ? steps[steps.length - 1].board : start;
    bellTotal = bellPay(end, SEED_POOLS).total * bet;
    total += bellTotal;
  }
  return { total, triggered: base.freeSpins > 0 || bellTotal > 0, baseTotal, respins, expanded: base.expanded.length > 0, bellTotal };
}

/** Gain moyen d'un bonus de 10 free spins, en multiples de la mise (sert à fixer le prix de l'achat de bonus). */
export function averageBonus(rounds: number, seed = 1, bet = 20, m: Machine = MACHINES.miami) {
  const rng = mulberry32(seed);
  let sum = 0;
  for (let i = 0; i < rounds; i++) sum += playBonus(rng, bet, undefined, m).total;
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
export function simulate(rounds: number, seed = 1, bet = 10, m: Machine = MACHINES.miami) {
  const rng = mulberry32(seed);
  let won = 0, hits = 0, max = 0, triggers = 0, big = 0, expands = 0, respins = 0;
  for (let i = 0; i < rounds; i++) {
    const r = playRound(rng, bet, m);
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

/* ───────────── Royal Bells · the bell bonus (hold & win) ───────────── */
/** Jackpots at their starting value, in multiples of the bet (for the simulations). */
export const SEED_POOLS = { mini: 5, minor: 20, major: 100, kingpin: 500 };
export const BELL_TRIGGER = 5;
/** Price of a bought bell bonus (6 bells, no Slot Reels), in multiples of the bet: it returns about 96%. */
export const BELL_BUY_MULT = 29;
export const BELL_RESPINS = 3;
export const BELL_X3_AT = 15;
export const CELLS = REELS * ROWS;
/** Jackpot bells: kingpin is the GRAND. They can land at any moment, like the others. */
export type JpTier = "mini" | "minor" | "major" | "kingpin";
/** A bell: a value in multiples of the total bet, or a jackpot. `boost`: the SLOT REELS bell. */
export type Bell = { v: number; jp?: JpTier; boost?: boolean };
export const BELL_VALUES: { v: number; w: number }[] = [
  { v: 1, w: 40 }, { v: 2, w: 28 }, { v: 3, w: 12 }, { v: 4, w: 7 }, { v: 5, w: 5 },
  { v: 8, w: 3 }, { v: 10, w: 2 }, { v: 15, w: 1.2 }, { v: 20, w: 0.6 }, { v: 25, w: 0.4 },
];
export const BELL_JP: { jp: JpTier; w: number }[] = [
  { jp: "mini", w: 1.0 }, { jp: "minor", w: 0.3 }, { jp: "major", w: 0.05 }, { jp: "kingpin", w: 0.008 },
];
/** The SLOT REELS bell: only on the reels of the base game, worth 5× the bet. */
export const BOOST_P = 0.05;
export const BOOST_VALUE = 5;
/** Chance for each empty cell to get a bell on a respin. */
export let BELL_P = 0.042;
export const setBellP = (p: number) => { BELL_P = p; };
export function drawBell(rng: () => number): Bell {
  const tv = BELL_VALUES.reduce((t, x) => t + x.w, 0);
  const tj = BELL_JP.reduce((t, x) => t + x.w, 0);
  let r = rng() * (tv + tj);
  for (const x of BELL_VALUES) if ((r -= x.w) <= 0) return { v: x.v };
  for (const x of BELL_JP) if ((r -= x.w) <= 0) return { v: 0, jp: x.jp };
  return { v: 1 };
}
export type BellBoard = (Bell | null)[]; // 20 cells, index = reel * ROWS + row
export type BellStep = { board: BellBoard; added: number[]; left: number };
/**
 * Multiplier on the bell values (not on the jackpots).
 * With a SLOT REELS bell in the trigger: ×3 from 15 bells, ×4 on a full screen.
 * Without: ×2 on a full screen only.
 */
export function bellMult(count: number, boost: boolean): number {
  if (count >= CELLS) return boost ? 4 : 2;
  return boost && count >= BELL_X3_AT ? 3 : 1;
}
/** Values of a finished board, in multiples of the bet. `pools`: jackpots in multiples of the bet. */
export function bellPay(board: BellBoard, pools: { mini: number; minor: number; major: number; kingpin: number }) {
  const bells = board.filter(Boolean) as Bell[];
  const boost = bells.some((b) => b.boost);
  const mult = bellMult(bells.length, boost);
  const coins = bells.reduce((t, b) => t + b.v, 0) * mult;
  const jps = bells.filter((b) => b.jp).map((b) => b.jp!) as JpTier[];
  const jp = jps.reduce((t, j) => t + pools[j], 0);
  const full = bells.length === CELLS;
  return { coins, jps, jp, full, boost, mult, total: coins + jp, count: bells.length };
}
/** Plays the respins from a starting board; returns every step (for the show). */
export function playBells(rng: () => number, start: BellBoard): BellStep[] {
  const board = [...start];
  const steps: BellStep[] = [];
  let left = BELL_RESPINS;
  while (left > 0 && board.some((b) => !b)) {
    left--;
    const added: number[] = [];
    for (let i = 0; i < CELLS; i++) if (!board[i] && rng() < BELL_P) {
      board[i] = drawBell(rng);
      added.push(i);
    }
    if (added.length) left = BELL_RESPINS;
    steps.push({ board: [...board], added, left });
  }
  return steps;
}
/** The board that starts the bonus, from the bells on the screen. */
export function startBoard(raw: Sym[][], rng: () => number): BellBoard {
  const b: BellBoard = Array(CELLS).fill(null);
  let boost = false;
  raw.forEach((col, r) => col.forEach((x, row) => {
    if (x !== "bell") return;
    if (!boost && rng() < BOOST_P) {
      boost = true;
      b[r * ROWS + row] = { v: BOOST_VALUE, boost: true };
    } else b[r * ROWS + row] = drawBell(rng);
  }));
  return b;
}
/** A bought bell bonus: 6 bells at random places. */
export function boughtBoard(rng: () => number, n = 6): BellBoard {
  const b: BellBoard = Array(CELLS).fill(null);
  const idx = Array.from({ length: CELLS }, (_, i) => i).sort(() => rng() - 0.5).slice(0, n);
  for (const i of idx) b[i] = drawBell(rng);
  return b;
}
