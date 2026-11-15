import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dayNumber, isNextDay, resetClock, setClock, today } from "../lib/clock";
import { DAILY_BASE, DAILY_MAX_DAYS, dailyReward, dailyStatus, dailyStore } from "../lib/daily";
import { onEvent, track, type GameEvent } from "../lib/events";
import { wallet } from "../lib/wallet";

const at = (iso: string) => setClock(() => new Date(`${iso}T12:00:00`));
beforeEach(() => {
  wallet.setBalance(1000);
  dailyStore._reset();
});
afterEach(resetClock);

describe("days", () => {
  it("compares days across month, year and leap-day boundaries", () => {
    expect(isNextDay("2026-10-14", "2026-10-15")).toBe(true);
    expect(isNextDay("2026-10-31", "2026-11-01")).toBe(true);
    expect(isNextDay("2026-12-31", "2027-01-01")).toBe(true);
    expect(isNextDay("2028-02-28", "2028-02-29")).toBe(true);
    expect(isNextDay("2028-02-29", "2028-03-01")).toBe(true);
    expect(isNextDay("2026-10-14", "2026-10-16")).toBe(false);
    expect(isNextDay("2026-10-15", "2026-10-14")).toBe(false);
    expect(dayNumber("1970-01-02")).toBe(1);
    at("2026-03-05");
    expect(today()).toBe("2026-03-05");
  });
});

describe("daily bonus", () => {
  it("grows by 500 per day up to day 7, then stays flat", () => {
    expect(dailyReward(1)).toBe(DAILY_BASE);
    expect(dailyReward(2)).toBe(1500);
    expect(dailyReward(DAILY_MAX_DAYS)).toBe(4000);
    expect(dailyReward(30)).toBe(4000);
    expect(dailyReward(0)).toBe(DAILY_BASE);
  });
  it("keeps the streak on consecutive days, restarts after a missed day, and blocks a second claim", () => {
    const first = dailyStatus({ lastClaim: null, streak: 0 }, "2026-10-14");
    expect(first).toEqual({ canClaim: true, streakDay: 1, reward: 1000 });
    expect(dailyStatus({ lastClaim: "2026-10-14", streak: 1 }, "2026-10-14").canClaim).toBe(false);
    expect(dailyStatus({ lastClaim: "2026-10-14", streak: 3 }, "2026-10-15")).toEqual({ canClaim: true, streakDay: 4, reward: 2500 });
    expect(dailyStatus({ lastClaim: "2026-10-14", streak: 5 }, "2026-10-17")).toEqual({ canClaim: true, streakDay: 1, reward: 1000 });
  });
  it("pays chips into the wallet once per day", () => {
    at("2026-10-14");
    expect(dailyStore.claim()).toBe(1000);
    expect(wallet.getBalance()).toBe(2000);
    expect(dailyStore.claim()).toBe(0);
    expect(wallet.getBalance()).toBe(2000);
    at("2026-10-15");
    expect(dailyStore.claim()).toBe(1500);
    expect(dailyStore.get().streak).toBe(2);
    at("2026-10-20"); // des jours manqués : la série repart
    expect(dailyStore.claim()).toBe(1000);
    expect(dailyStore.get().streak).toBe(1);
  });
});

describe("event bus", () => {
  it("ignores events with a zero or negative amount, and the bus reaches every listener", () => {
    const seen: [GameEvent, number][] = [];
    const off = onEvent((e, n) => seen.push([e, n]));
    track("spin", 0);
    track("spin", -3);
    track("bjWin", 2);
    off();
    track("bjWin", 5);
    expect(seen).toEqual([["bjWin", 2]]);
  });
});