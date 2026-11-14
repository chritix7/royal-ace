import { describe, expect, it } from "vitest";
import { advise, canSplitCards, cardsNeeded, dealerCall, handValue, hiLo, isBlackjack, makeShoe, type Card } from "../lib/blackjack";
import { heatOf, jackpotShare, perfectPairs, twentyOnePlusThree } from "../lib/sidebets";

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

describe("basic strategy: surrender and H17", () => {
  const sur = { canSurrender: true };
  it("surrenders hard 16 against 9, 10 and ace, and 15 against 10", () => {
    expect(advise([c("10"), c("6")], c("9"), true, false, sur)).toBe("Surrender");
    expect(advise([c("10"), c("6")], c("K"), true, false, sur)).toBe("Surrender");
    expect(advise([c("10"), c("6")], c("A"), true, false, sur)).toBe("Surrender");
    expect(advise([c("10"), c("5")], c("10"), true, false, sur)).toBe("Surrender");
  });
  it("never suggests surrender when it is not available", () => {
    expect(advise([c("10"), c("6")], c("K"), true, false)).toBe("Hit");
    expect(advise([c("10"), c("6")], c("8"), true, false, sur)).toBe("Hit");
  });
  it("still splits eights rather than surrendering them", () => {
    expect(advise([c("8"), c("8", "♥")], c("10"), true, true, sur)).toBe("Split");
  });
  it("changes the close calls when the dealer hits soft 17", () => {
    expect(advise([c("6"), c("5")], c("A"), true, false)).toBe("Hit");
    expect(advise([c("6"), c("5")], c("A"), true, false, { h17: true })).toBe("Double");
    expect(advise([c("A"), c("7")], c("2"), true, false)).toBe("Stand");
    expect(advise([c("A"), c("7")], c("2"), true, false, { h17: true })).toBe("Double");
    expect(advise([c("A"), c("8")], c("6"), true, false)).toBe("Stand");
    expect(advise([c("A"), c("8")], c("6"), true, false, { h17: true })).toBe("Double");
    expect(advise([c("10"), c("5")], c("A"), true, false, sur)).toBe("Hit");
    expect(advise([c("10"), c("5")], c("A"), true, false, { ...sur, h17: true })).toBe("Surrender");
  });
});

describe("dealer call", () => {
  it("announces single-hand results with the totals", () => {
    expect(dealerCall(["win"], 20, 18, false)).toBe("Player wins · 20 over 18");
    expect(dealerCall(["lose"], 17, 19, false)).toBe("Dealer wins · 19 over 17");
    expect(dealerCall(["push"], 19, 19, false)).toBe("Push on 19 · bet returned");
    expect(dealerCall(["bust"], 24, 10, false)).toBe("Bust on 24 · dealer wins");
    expect(dealerCall(["win"], 15, 24, false)).toBe("Dealer busts on 24 · player wins");
  });
  it("announces blackjacks, dealer blackjack and surrender", () => {
    expect(dealerCall(["blackjack"], 21, 18, false)).toBe("Blackjack · pays 3 to 2");
    expect(dealerCall(["blackjack"], 21, 18, false, true)).toBe("Blackjack · pays 6 to 5");
    expect(dealerCall(["lose"], 20, 21, true)).toBe("Dealer blackjack");
    expect(dealerCall(["push"], 21, 21, true)).toBe("Dealer blackjack · push");
    expect(dealerCall(["surrender"], 16, 20, false)).toBe("Surrender · half the bet returned");
  });
  it("summarises several hands", () => {
    expect(dealerCall(["win", "lose", "push"], 20, 19, false)).toBe("Player wins 1 of 3 hands");
    expect(dealerCall(["lose", "push"], 18, 19, false)).toBe("Push on 1 of 2 hands");
    expect(dealerCall(["lose", "bust"], 18, 19, false)).toBe("Dealer wins all 2 hands");
    expect(dealerCall(["bust", "bust"], 23, 10, false)).toBe("All hands bust · dealer wins");
  });
});

describe("jackpot and side-bet heat", () => {
  it("scales the jackpot share with the 21+3 stake", () => {
    expect(jackpotShare(10)).toBe(0.1);
    expect(jackpotShare(125)).toBe(0.5);
    expect(jackpotShare(250)).toBe(1);
    expect(jackpotShare(5000)).toBe(1);
  });
  it("only suited trips reaches the jackpot odds", () => {
    expect(twentyOnePlusThree(c("7", "♥"), c("7", "♥"), c("7", "♥"))?.odds).toBe(100);
    expect(twentyOnePlusThree(c("7", "♥"), c("7", "♠"), c("7", "♦"))?.odds).toBe(30);
    expect(perfectPairs(c("7", "♥"), c("7", "♥"))?.odds).toBe(25);
  });
  it("marks a side bet hot after two hits and cold after eight misses", () => {
    expect(heatOf([])).toBe("neutral");
    expect(heatOf([true, false, true])).toBe("hot");
    expect(heatOf(Array(7).fill(false))).toBe("neutral");
    expect(heatOf(Array(8).fill(false))).toBe("cold");
    expect(heatOf([...Array(8).fill(false), true])).toBe("neutral");
  });
});

describe("shoe reserve", () => {
  it("asks for more cards as spots are added", () => {
    expect(cardsNeeded(1)).toBe(18);
    expect(cardsNeeded(5)).toBe(50);
  });
});
