import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dayNumber, isNextDay, resetClock, setClock, today } from "../lib/clock";
import { DAILY_BASE, DAILY_MAX_DAYS, dailyReward, dailyStatus, dailyStore } from "../lib/daily";
import { onEvent, track, type GameEvent } from "../lib/events";
import { MISSION_POOL, missionView, missionsFor, missionsStore } from "../lib/missions";
import { wallet } from "../lib/wallet";

const at = (iso: string) => setClock(() => new Date(`${iso}T12:00:00`));
beforeEach(() => {
  wallet.setBalance(1000);
  missionsStore._reset();
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
  it("grows by 100 per day up to day 7, then stays flat", () => {
    expect(dailyReward(1)).toBe(DAILY_BASE);
    expect(dailyReward(2)).toBe(300);
    expect(dailyReward(DAILY_MAX_DAYS)).toBe(800);
    expect(dailyReward(30)).toBe(800);
    expect(dailyReward(0)).toBe(DAILY_BASE);
  });
  it("keeps the streak on consecutive days, restarts after a missed day, and blocks a second claim", () => {
    const first = dailyStatus({ lastClaim: null, streak: 0 }, "2026-10-14");
    expect(first).toEqual({ canClaim: true, streakDay: 1, reward: 200 });
    expect(dailyStatus({ lastClaim: "2026-10-14", streak: 1 }, "2026-10-14").canClaim).toBe(false);
    expect(dailyStatus({ lastClaim: "2026-10-14", streak: 3 }, "2026-10-15")).toEqual({ canClaim: true, streakDay: 4, reward: 500 });
    expect(dailyStatus({ lastClaim: "2026-10-14", streak: 5 }, "2026-10-17")).toEqual({ canClaim: true, streakDay: 1, reward: 200 });
  });
  it("pays chips into the wallet once per day", () => {
    at("2026-10-14");
    expect(dailyStore.claim()).toBe(200);
    expect(wallet.getBalance()).toBe(1200);
    expect(dailyStore.claim()).toBe(0);
    expect(wallet.getBalance()).toBe(1200);
    at("2026-10-15");
    expect(dailyStore.claim()).toBe(300);
    expect(dailyStore.get().streak).toBe(2);
    at("2026-10-20"); // des jours manqués : la série repart
    expect(dailyStore.claim()).toBe(200);
    expect(dailyStore.get().streak).toBe(1);
  });
});

describe("missions", () => {
  it("draws one easy, one medium and one hard mission, the same all day and different over time", () => {
    const a = missionsFor("2026-10-14");
    expect(a.map((m) => m.tier)).toEqual(["easy", "medium", "hard"]);
    expect(missionsFor("2026-10-14")).toEqual(a);
    const week = Array.from({ length: 30 }, (_, i) => missionsFor(`2026-11-${String(i + 1).padStart(2, "0")}`).map((m) => m.id).join());
    expect(new Set(week).size).toBeGreaterThan(10); // elle change d'un jour à l'autre
    expect(missionsFor("")).toEqual([]);
    expect(new Set(MISSION_POOL.map((m) => m.id)).size).toBe(MISSION_POOL.length);
  });
  it("counts game events, caps the progress at the goal and pays each reward once", () => {
    at("2026-10-14");
    missionsStore.hydrate();
    const [easy] = missionsFor("2026-10-14");
    track(easy.event, easy.goal - 1);
    let v = missionView(missionsStore.get());
    expect(v[0].progress).toBe(easy.goal - 1);
    expect(v[0].done).toBe(false);
    expect(missionsStore.claim(easy.id)).toBe(0); // pas encore terminée
    track(easy.event, 50);
    v = missionView(missionsStore.get());
    expect(v[0].progress).toBe(easy.goal);
    expect(v[0].done).toBe(true);
    expect(missionsStore.claim(easy.id)).toBe(easy.reward);
    expect(wallet.getBalance()).toBe(1000 + easy.reward);
    expect(missionsStore.claim(easy.id)).toBe(0); // une seule fois
    expect(missionView(missionsStore.get())[0].claimed).toBe(true);
  });
  it("starts fresh on a new day", () => {
    at("2026-10-14");
    missionsStore.hydrate();
    const [easy] = missionsFor("2026-10-14");
    track(easy.event, easy.goal);
    missionsStore.claim(easy.id);
    at("2026-10-15");
    track("spin", 1); // le premier événement du lendemain remet tout à zéro
    const s = missionsStore.get();
    expect(s.day).toBe("2026-10-15");
    expect(s.claimed).toEqual([]);
    expect(s.counters).toEqual({ spin: 1 });
  });
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