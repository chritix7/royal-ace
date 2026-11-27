import { describe, expect, it } from "vitest";
import { boardName, countRound, suspicious, toRound, weekEnds, weekKey } from "../lib/board";

describe("weekly ranking rules", () => {
  it("counts possible rounds and caps big stakes", () => {
    expect(countRound(["slots", 100, 400])).toEqual({ stake: 100, ret: 500, net: 400, big: false });
    expect(countRound(["slots", 1_000_000, 1_000_000])?.net).toBe(500_000);
    expect(countRound(["slots", 10, 2000])?.big).toBe(true);
  });
  it("rejects impossible rounds", () => {
    expect(countRound(["roulette", 10, 10000])).toBeNull();
    expect(countRound(["gamble", 50, 60])).toBeNull();
    expect(countRound(["slots", 0, 5])).toBeNull();
    expect(countRound(["slots", 10, -20])).toBeNull();
    expect(countRound(["nope", 5, 5])).toBeNull();
  });
  it("maps gamble adjustments", () => {
    expect(toRound("slots", 0, -40)).toEqual(["gamble", 40, -40]);
  });
  it("flags implausible weeks but allows one monster hit", () => {
    const base = { rounds: 1000, staked: 100000, won: 95000, score: -5000, big: 2, max: 3000, bad: 0 };
    expect(suspicious(base)).toBeNull();
    expect(suspicious({ ...base, won: 300000, max: 200000 })).toBeNull();
    expect(suspicious({ ...base, won: 300000, max: 5000 })).toBe("return-too-high");
    expect(suspicious({ ...base, big: 20 })).toBe("too-many-big-hits");
    expect(suspicious({ ...base, bad: 3, ok: 1 })).toBeNull();
  });
  it("weeks start on Monday UTC", () => {
    expect(weekKey(Date.parse("2026-11-28T12:00:00Z"))).toBe("2026-11-23");
    expect(new Date(weekEnds(Date.parse("2026-11-28T12:00:00Z"))).toISOString()).toBe("2026-11-30T00:00:00.000Z");
    expect(boardName("<b>")).toBe("Player");
  });
});
