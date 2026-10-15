import { describe, expect, it } from "vitest";
import { advise, canSplitCards, handValue, hiLo, isBlackjack, makeShoe, type Card } from "../lib/blackjack";
import { perfectPairs, twentyOnePlusThree } from "../lib/sidebets";

const c = (rank: string, suit = "♠"): Card => {
  const value = rank === "A" ? 11 : ["J", "Q", "K"].includes(rank) ? 10 : Number(rank);
  return { rank, suit, value };
};

describe("hand value", () => {
  it("counts an ace as 11 then 1", () => {
    expect(handValue([c("A"), c("6")])).toEqual({ total: 17, soft: true });
    expect(handValue([c("A"), c("6"), c("10")])).toEqual({ total: 17, soft: false });
    expect(handValue([c("A"), c("A"), c("9")]).total).toBe(21);
  });
  it("detects a natural blackjack only on two cards", () => {
    expect(isBlackjack([c("A"), c("K")])).toBe(true);
    expect(isBlackjack([c("7"), c("7"), c("7")])).toBe(false);
  });
  it("allows splitting equal values (K + Q)", () => {
    expect(canSplitCards([c("K"), c("Q")])).toBe(true);
    expect(canSplitCards([c("8"), c("9")])).toBe(false);
  });
});

describe("shoe", () => {
  it("has 52 cards per deck and a balanced Hi-Lo count", () => {
    const shoe = makeShoe(6);
    expect(shoe).toHaveLength(312);
    expect(shoe.reduce((a, x) => a + hiLo(x), 0)).toBe(0);
  });
});

describe("basic strategy", () => {
  it("splits aces and eights, never tens", () => {
    expect(advise([c("A"), c("A", "♥")], c("6"), true, true)).toBe("Split");
    expect(advise([c("8"), c("8", "♥")], c("10"), true, true)).toBe("Split");
    expect(advise([c("10"), c("K")], c("6"), true, true)).toBe("Stand");
  });
  it("doubles 11 and hits 12 against a 2", () => {
    expect(advise([c("6"), c("5")], c("6"), true, false)).toBe("Double");
    expect(advise([c("10"), c("2")], c("2"), true, false)).toBe("Hit");
  });
});

describe("side bets", () => {
  it("pays pairs by color and suit", () => {
    expect(perfectPairs(c("9", "♠"), c("9", "♠"))?.odds).toBe(25);
    expect(perfectPairs(c("9", "♠"), c("9", "♣"))?.odds).toBe(12);
    expect(perfectPairs(c("9", "♠"), c("9", "♥"))?.odds).toBe(5);
    expect(perfectPairs(c("9"), c("8"))).toBeNull();
  });
  it("recognizes 21+3 hands including ace-low and ace-high straights", () => {
    expect(twentyOnePlusThree(c("2", "♥"), c("3", "♥"), c("4", "♥"))?.odds).toBe(40);
    expect(twentyOnePlusThree(c("A"), c("2", "♥"), c("3", "♦"))?.odds).toBe(10);
    expect(twentyOnePlusThree(c("Q"), c("K", "♥"), c("A", "♦"))?.odds).toBe(10);
    expect(twentyOnePlusThree(c("K"), c("A", "♥"), c("2", "♦"))).toBeNull();
    expect(twentyOnePlusThree(c("7"), c("7", "♥"), c("7", "♦"))?.odds).toBe(30);
    expect(twentyOnePlusThree(c("2"), c("9"), c("K"))?.odds).toBe(5);
  });
});