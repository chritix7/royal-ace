import { describe, expect, it } from "vitest";
import {
  BASE_RTP, BET_LEVELS, FS_CAP, MAX_RESPINS, PAYLINES, PAYS, REELS, ROWS, STRIPS,
  evaluate, mulberry32, playSequence, reelTimings, resolveSpin, retriggerSpins, simulate, type Sym,
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