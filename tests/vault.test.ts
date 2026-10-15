import { describe, expect, it } from "vitest";
import { JACKPOT_TIERS, JACKPOTS, freshPools, growPools, resetPool, sanitizePools } from "../lib/jackpot";
import { CASE_JACKPOT, COIN_TABLE, VAULT_CASES, VAULT_PICKS, drawPrize, drawVault, prizeValue, settleVault, simulateVault } from "../lib/vault";
import { BASE_RTP, BONUS_PRICE_MULT, THEORETICAL_RTP, averageBonus, mulberry32 } from "../lib/slots";
import { GAMBLE_MAX_MULT, SUITS, canGamble, drawGambleCard } from "../lib/gamble";

describe("progressive jackpots", () => {
  it("grow on every paid spin and only the won tier resets", () => {
    let p = freshPools();
    for (let i = 0; i < 100; i++) p = growPools(p);
    JACKPOT_TIERS.forEach((t) => expect(p[t]).toBeCloseTo(JACKPOTS[t].seed + 100 * JACKPOTS[t].growth, 8));
    const after = resetPool(p, "major");
    expect(after.major).toBe(JACKPOTS.major.seed);
    expect(after.mini).toBe(p.mini);
    expect(after.kingpin).toBe(p.kingpin);
  });
  it("rejects invalid saved pools", () => {
    expect(sanitizePools(null)).toEqual(freshPools());
    expect(sanitizePools({ mini: -5, minor: "x", major: Number.NaN, kingpin: 1e9 }).kingpin).toBe(1e9);
    expect(sanitizePools({ mini: -5, minor: "x", major: Number.NaN }).mini).toBe(JACKPOTS.mini.seed);
    expect(sanitizePools({ mini: 7.5 }).mini).toBe(7.5);
  });
  it("scales with the bet: a pool is a multiple of the bet", () => {
    const pools = { ...freshPools(), mini: 12 };
    expect(prizeValue({ kind: "jackpot", tier: "mini" }, pools, 20)).toBe(240);
    expect(prizeValue({ kind: "jackpot", tier: "mini" }, pools, 100)).toBe(1200);
  });
});

describe("vault bonus", () => {
  it("has 12 cases and 3 picks, and every coin prize comes from the table", () => {
    expect(VAULT_CASES).toBe(12);
    expect(VAULT_PICKS).toBe(3);
    const prizes = drawVault(mulberry32(1));
    expect(prizes).toHaveLength(12);
    const mults = new Set(COIN_TABLE.map(([m]) => m));
    prizes.forEach((p) => p.kind === "jackpot" || expect(mults.has(p.mult)).toBe(true));
  });
  it("draws jackpot markers at the configured rates", () => {
    const rng = mulberry32(7);
    const N = 400_000;
    const count = { mini: 0, minor: 0 };
    for (let i = 0; i < N; i++) {
      const p = drawPrize(rng);
      if (p.kind === "jackpot" && (p.tier === "mini" || p.tier === "minor")) count[p.tier]++;
    }
    expect(Math.abs(count.mini / N - CASE_JACKPOT.mini)).toBeLessThan(0.004);
    expect(Math.abs(count.minor / N - CASE_JACKPOT.minor)).toBeLessThan(0.002);
  });
  it("pays the sum of the three opened cases, in whole chips for every bet", () => {
    const prizes = Array.from({ length: 12 }, (_, i) => (i === 4 ? ({ kind: "jackpot", tier: "mini" } as const) : ({ kind: "coins", mult: 0.5 } as const)));
    const pools = { ...freshPools(), mini: 6 };
    const r = settleVault(prizes, [4, 0, 1], pools, 20);
    expect(r.items.map((i) => i.value)).toEqual([120, 10, 10]);
    expect(r.total).toBe(140);
    expect(r.jackpots).toEqual(["mini"]);
    ([20, 40, 60, 100, 200, 400, 600, 1000, 2000, 5000]).forEach((bet) =>
      COIN_TABLE.forEach(([m]) => expect(Number.isInteger(m * bet)).toBe(true))
    );
  });
  it("keeps vault + jackpots near 5% RTP and the whole game near the advertised 96%", () => {
    const v = simulateVault(3_000_000, 4);
    expect(v.rtp).toBeGreaterThan(0.04);
    expect(v.rtp).toBeLessThan(0.07);
    expect(Math.abs(v.vaultEvery - 250)).toBeLessThan(25);
    expect(Math.abs(BASE_RTP + 0.0528 - THEORETICAL_RTP)).toBeLessThan(0.01);
  }, 60_000);
});

describe("bonus buy", () => {
  it("is priced so that the buy returns about 96%", () => {
    const ratio = averageBonus(50_000, 11) / BONUS_PRICE_MULT;
    expect(ratio).toBeGreaterThan(0.88);
    expect(ratio).toBeLessThan(1.05);
    ([20, 40, 60, 100, 200, 400, 600, 1000, 2000, 5000]).forEach((bet) => expect(Number.isInteger(bet * BONUS_PRICE_MULT)).toBe(true));
  }, 60_000);
});

describe("gamble", () => {
  it("is a fair 50/50 and the card matches the colour", () => {
    const rng = mulberry32(3);
    let wins = 0;
    const N = 100_000;
    for (let i = 0; i < N; i++) {
      const d = drawGambleCard(rng, "red");
      if (d.won) wins++;
      expect(SUITS[d.color]).toContain(d.suit);
      expect(d.won).toBe(d.color === "red");
    }
    expect(Math.abs(wins / N - 0.5)).toBeLessThan(0.01);
  });
  it("is only offered after a normal win of reasonable size", () => {
    expect(canGamble(0, 20, false)).toBe(false);
    expect(canGamble(100, 20, false)).toBe(true);
    expect(canGamble(100, 20, true)).toBe(false); // pas après un bonus ou un coffre
    expect(canGamble(GAMBLE_MAX_MULT * 20 + 1, 20, false)).toBe(false);
  });
});