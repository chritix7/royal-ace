import { describe, expect, it } from "vitest";
import { hashRand, round2 } from "../lib/hashRand";

describe("hashRand (décor identique sur le serveur et dans le navigateur)", () => {
  it("always returns the same values, because it only uses integer math", () => {
    // Valeurs figées : si ce test casse, le décor n'est plus identique partout.
    expect(hashRand(1)).toBe(0.5464560757391155);
    expect(hashRand(50)).toBe(0.6012026888784021);
    expect(hashRand(123456)).toBe(0.3541148549411446);
  });
  it("stays in [0, 1) and is evenly spread", () => {
    let sum = 0;
    for (let i = 0; i < 20_000; i++) {
      const v = hashRand(i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(Math.abs(sum / 20_000 - 0.5)).toBeLessThan(0.01);
  });
  it("rounds to two decimals", () => {
    expect(round2(129.20155844949477)).toBe(129.2);
    expect(round2(1.6860642997402466)).toBe(1.69);
  });
});