import { describe, expect, it } from "vitest";
import {
  BASE_RTP, BET_LEVELS, FS_CAP, MAX_RESPINS, PAYLINES, PAYS, REELS, ROWS, STRIPS,
  BELL_X3_AT, CELLS, MACHINES, SEED_POOLS, averageBonus, bellPay, playBells, boughtBoard, evaluate, expandFromRaw, noMults, mulberry32, noSticky, playSequence, reelTimings, resolveSpin, retriggerSpins, simulate, spin, stickyFromRaw, type Sym,
} from "../lib/slots";
import { wallet } from "../lib/wallet";

// Grille de remplissage : deux cases voisines d'une même ligne sont toujours différentes,
// donc aucun gain accidentel. On y "pose" ensuite les symboles à tester.
const FILL: Sym[] = ["gem", "bell", "grape", "lemon"];
const base = (): Sym[][] => Array.from({ length: REELS }, (_, r) => Array.from({ length: ROWS }, (_, w) => FILL[(r * 2 + w) % 4]));
const put = (g: Sym[][], row: number, syms: (Sym | null)[]) => {
  syms.forEach((s, reel) => {
    if (s) g[reel][row] = s;
  });
  return g;
};

describe("slot layout", () => {
  it("has 4 rows, 5 reels, 20 distinct lines and integer line bets for every bet level", () => {
    expect(ROWS).toBe(4);
    expect(PAYLINES).toHaveLength(20);
    expect(new Set(PAYLINES.map((l) => l.join(""))).size).toBe(20);
    PAYLINES.forEach((l) => {
      expect(l).toHaveLength(REELS);
      l.forEach((row) => expect(row >= 0 && row < ROWS).toBe(true));
    });
    BET_LEVELS.forEach((b) => expect(Number.isInteger(b / PAYLINES.length)).toBe(true));
  });
  it("keeps wilds on reels 2-4 only, and rare (about 1 case in 190)", () => {
    expect(STRIPS).toHaveLength(REELS);
    expect(STRIPS[0]).not.toContain("wild");
    expect(STRIPS[4]).not.toContain("wild");
    [1, 2, 3].forEach((k) => expect(STRIPS[k].filter((x) => x === "wild")).toHaveLength(1));
    expect(STRIPS.map((s) => s.length)).toEqual([40, 191, 191, 191, 40]);
  });
});

describe("slot evaluation", () => {
  it("pays three cherries on line 2", () => {
    const r = evaluate(put(base(), 1, ["cherry", "cherry", "cherry", null, null]), 20);
    expect(r.lineWins).toHaveLength(1);
    expect(r.lineWins[0].line).toBe(2);
    expect(r.total).toBe(5); // 5x la mise par ligne (1 chip)
  });
  it("lets a wild substitute", () => {
    const r = evaluate(put(base(), 1, ["wild", "cherry", "cherry", null, null]), 20);
    expect(r.total).toBe(5);
  });
  it("pays five wilds as the top prize on the line", () => {
    const r = evaluate(put(base(), 1, ["wild", "wild", "wild", "wild", "wild"]), 20);
    expect(r.lineWins.find((w) => w.line === 2)?.pay).toBe(PAYS.wild[2]);
    expect(r.total).toBeGreaterThanOrEqual(PAYS.wild[2]);
  });
  it("pays scatters anywhere on the 4x5 grid and awards free spins", () => {
    const g = base();
    g[0][0] = "scatter";
    g[2][1] = "scatter";
    g[4][3] = "scatter";
    const r = evaluate(g, 20);
    expect(r.scatters).toBe(3);
    expect(r.scatterPay).toBe(3);
    expect(r.freeSpins).toBe(10);
    expect(r.total).toBe(60);
  });
  it("multiplies wins during free spins", () => {
    const r = evaluate(put(base(), 1, ["cherry", "cherry", "cherry", null, null]), 20, 2);
    expect(r.total).toBe(10);
  });
});

describe("expanding wild and re-spin", () => {
  it("expands a wild on reels 2-4 to fill the whole reel", () => {
    const raw = base();
    raw[2][1] = "wild";
    const r = resolveSpin(raw, 20);
    expect(r.expanded).toEqual([2]);
    expect(r.grid[2]).toEqual(["wild", "wild", "wild", "wild"]);
    expect(r.raw[2][1]).toBe("wild"); // ce que le rouleau montrait avant l'expansion
  });
  it("does not expand a wild on reels 1 or 5", () => {
    const raw = base();
    raw[0][1] = "wild";
    expect(resolveSpin(raw, 20).expanded).toEqual([]);
  });
  it("pays full wild reels as substitutes", () => {
    const raw = put(base(), 1, ["cherry", "wild", "wild", "wild", "cherry"]);
    const r = resolveSpin(raw, 20);
    expect(r.expanded).toEqual([1, 2, 3]);
    expect(r.lineWins.find((w) => w.line === 2)?.pay).toBe(PAYS.cherry[2]); // 5 cerises avec wilds
  });
  it("counts scatters on the spun symbols, even under an expanding wild", () => {
    const raw = base();
    raw[1][0] = "wild";
    raw[1][3] = "scatter";
    raw[0][0] = "scatter";
    raw[4][2] = "scatter";
    const r = resolveSpin(raw, 20);
    expect(r.scatters).toBe(3);
    expect(r.freeSpins).toBe(10);
  });
  it("ignores scatters and free spins during a re-spin", () => {
    const raw = base();
    raw[1] = ["wild", "wild", "wild", "wild"];
    raw[0][0] = raw[2][1] = raw[4][2] = "scatter";
    const r = resolveSpin(raw, 20, 1, [false, true, false, false, false]);
    expect(r.scatterPay).toBe(0);
    expect(r.freeSpins).toBe(0);
  });
  it("keeps held reels all-wild, never re-spins more than the limit, and accumulates held reels", () => {
    const rng = mulberry32(99);
    let withRespin = 0;
    for (let i = 0; i < 40_000; i++) {
      const steps = playSequence(rng, 20);
      expect(steps.length).toBeLessThanOrEqual(1 + MAX_RESPINS);
      const expandedSoFar = new Set<number>();
      steps.forEach((st, idx) => {
        st.held.forEach((h, k) => {
          if (h) {
            expect(expandedSoFar.has(k)).toBe(true);
            expect(st.raw[k]).toEqual(["wild", "wild", "wild", "wild"]);
          }
        });
        st.expanded.forEach((k) => expandedSoFar.add(k));
        if (idx > 0) expect(steps[idx - 1].expanded.length).toBeGreaterThan(0);
      });
      if (steps.length > 1) withRespin++;
    }
    expect(withRespin).toBeGreaterThan(1000); // environ 6 % des tours
  });
});

describe("free spin retrigger", () => {
  it("adds more spins for more scatters and respects the cap", () => {
    expect(retriggerSpins(2, 1, 5)).toBe(0);
    expect(retriggerSpins(3, 1, 5)).toBe(5);
    expect(retriggerSpins(4, 1, 5)).toBe(8);
    expect(retriggerSpins(5, 1, 5)).toBe(12);
    expect(retriggerSpins(3, 30, FS_CAP - 32)).toBe(0);
  });
});

describe("reel timings", () => {
  it("stops reels left to right, and slows down after two scatters", () => {
    const calm = reelTimings(base());
    expect(calm.anticipate.some(Boolean)).toBe(false);
    calm.stopAt.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(calm.stopAt[i - 1]));

    const g = base();
    g[0][1] = "scatter";
    g[1][2] = "scatter";
    const tense = reelTimings(g);
    expect(tense.anticipate).toEqual([false, false, true, true, true]);
    expect(tense.stopAt[2]).toBeGreaterThan(calm.stopAt[2]);
  });
  it("makes columns land one at a time while the others keep spinning", () => {
    const { stopAt, landMs } = reelTimings(base());
    for (let k = 1; k < stopAt.length; k++) {
      // la colonne k ne commence à ralentir qu'après l'arrêt complet de la colonne k-1
      expect(stopAt[k] - landMs).toBeGreaterThanOrEqual(stopAt[k - 1]);
    }
    // et la première colonne tourne un bon moment avant de tomber
    expect(stopAt[0] - landMs).toBeGreaterThan(500);
  });
  it("does not spin held reels, and re-spins are faster with no suspense", () => {
    const held = [false, true, false, false, false];
    const t = reelTimings(base(), false, held, true);
    expect(t.stopAt[1]).toBe(0);
    expect(t.stopAt[0]).toBe(900);
    expect(t.stopAt[2]).toBeGreaterThan(t.stopAt[0]);
    expect(t.anticipate.some(Boolean)).toBe(false);
    for (let k = 1; k < 5; k++) if (!held[k] && k > 0) expect(t.stopAt[k] - t.landMs).toBeGreaterThanOrEqual(0);
  });
  it("halves every duration in turbo mode", () => {
    const g = base();
    const normal = reelTimings(g);
    const fast = reelTimings(g, true);
    fast.stopAt.forEach((t, i) => expect(Math.abs(t - normal.stopAt[i] / 2)).toBeLessThanOrEqual(1));
  });
});

describe("sticky wilds (free spins)", () => {
  it("keeps every landed wild until the end, without expanding, and hides scatters under it", () => {
    let g = base();
    g[0][2] = "wild";
    const a = stickyFromRaw(g, noSticky(), 20, 1);
    expect(a.sticky[0][2]).toBe(true);
    expect(a.grid[1].includes("wild")).toBe(false);
    g = base();
    g[0][2] = "scatter";
    g[3][1] = "wild";
    const b = stickyFromRaw(g, a.sticky, 20, 1);
    expect(b.grid[0][2]).toBe("wild");
    expect(b.grid[3][1]).toBe("wild");
    expect(b.scatters).toBe(0);
    expect(b.sticky.flat().filter(Boolean).length).toBe(2);
  });
  it("keeps the bonus worth about its buy price", () => {
    expect(Math.abs(averageBonus(20_000, 9) - 15.75)).toBeLessThan(1.5);
  });
  it("halves re-spins in turbo mode too", () => {
    const held = [false, true, false, false, false];
    const n = reelTimings(base(), false, held, true);
    const t = reelTimings(base(), true, held, true);
    expect(t.stopAt[0]).toBe(n.stopAt[0] / 2);
  });
});

describe("Royal Ace Gold and Pharaoh's Vault", () => {
  it("multiplies the wilds of one line together (Gold)", () => {
    const g = put(base(), 1, ["cherry", "wild", "wild", "cherry", null]);
    const m = noMults();
    m[1][1] = 3;
    m[2][1] = 5;
    const w = evaluate(g, 20, 1, [], g, { mults: m }).lineWins.find((x) => x.line === 2)!;
    expect(w.mult).toBe(15);
  });
  it("expands the Pharaoh's symbol on its reels and pays every line", () => {
    const g = base();
    g[0][0] = "cherry";
    g[2][3] = "cherry";
    g[4][2] = "cherry";
    const r = expandFromRaw(g, "cherry", 20, 1, [], 1, 1);
    expect(r.bookReels).toEqual([0, 2, 4]);
    expect(r.bookPay).toBe(100);
  });
  it("keeps both new machines at the same return", () => {
    for (const id of ["gold", "pharaoh"] as const) {
      expect(Math.abs(averageBonus(10_000, 4, 20, MACHINES[id]) - 15.8)).toBeLessThan(2);
      expect(Math.abs(simulate(100_000, 6, 20, MACHINES[id]).rtp - BASE_RTP)).toBeLessThan(0.035);
    }
  });
});

describe("Royal Bells", () => {
  it("does not pay bells on the lines and counts them for the bonus", () => {
    const g = put(base(), 1, ["bell", "bell", "bell", "bell", "bell"]);
    const r = evaluate(g.map((c) => c.map((x) => (x === "bell" ? "scatter" : x))) as Sym[][], 20, 1, [], g);
    expect(r.lineWins.length).toBe(0);
  });
  it("triples the values from 15 bells and pays the Grand on a full screen", () => {
    const b15 = Array.from({ length: CELLS }, (_, i) => (i < BELL_X3_AT ? { v: 1 } : null));
    expect(bellPay(b15, SEED_POOLS).coins).toBe(BELL_X3_AT * 3);
    const full = Array.from({ length: CELLS }, () => ({ v: 1 }));
    const p = bellPay(full, SEED_POOLS);
    expect(p.grand).toBe(true);
    expect(p.total).toBe(CELLS * 3 + SEED_POOLS.kingpin);
  });
  it("keeps the respins at 3 while new bells land, and ends with no new bell", () => {
    const steps = playBells(mulberry32(4), boughtBoard(mulberry32(5)));
    const last = steps[steps.length - 1];
    expect(last.left === 0 || last.board.every(Boolean)).toBe(true);
    steps.forEach((st) => expect(st.left).toBe(st.added.length ? 3 : st.left));
  });
  it("never expands the hot 7 and shows a value on every bell of the reels", () => {
    const rng = mulberry32(11);
    for (let i = 0; i < 400; i++) {
      const r = spin(rng, 20, 1, undefined, MACHINES.classic);
      expect(r.expanded).toEqual([]);
      const vals = r.bellVals!;
      expect(vals.length).toBe(CELLS);
      r.raw.forEach((col, k) => col.forEach((x, row) => expect(Boolean(vals[k * col.length + row])).toBe(x === "bell")));
    }
  });
  it("returns like the other machines", () => {
    expect(Math.abs(simulate(150_000, 6, 20, MACHINES.classic).rtp - BASE_RTP)).toBeLessThan(0.04);
  });
});

describe("slot return to player", () => {
  it("keeps the base game close to its advertised RTP over 300,000 seeded rounds", () => {
    const r = simulate(300_000, 5, 20);
    expect(Math.abs(r.rtp - BASE_RTP)).toBeLessThan(0.03);
    expect(r.hitRate).toBeGreaterThan(0.35);
    expect(r.hitRate).toBeLessThan(0.6);
  });
});

describe("shared wallet", () => {
  it("notifies listeners when the balance changes", () => {
    let calls = 0;
    const off = wallet.subscribe(() => calls++);
    const before = wallet.getBalance();
    wallet.add(50);
    expect(wallet.getBalance()).toBe(before + 50);
    expect(calls).toBe(1);
    wallet.setBalance(before);
    off();
  });
});