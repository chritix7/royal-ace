import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CHALLENGE_POOL, CHALLENGES_PER_DAY, challengesFor } from "../lib/achievements";
import { achievementsStore, challengeView } from "../lib/achievementsStore";
import { resetClock, setClock } from "../lib/clock";
import { wallet } from "../lib/wallet";

const at = (iso: string) => setClock(() => new Date(`${iso}T12:00:00`));
beforeEach(() => {
  wallet.setBalance(1000);
  wallet.setLocked(false);
  achievementsStore._reset();
});
afterEach(resetClock);

describe("daily challenges draw", () => {
  it("draws eight challenges a day, never two on the same counter", () => {
    for (let d = 1; d <= 28; d++) {
      const set = challengesFor(`2026-02-${String(d).padStart(2, "0")}`);
      expect(set).toHaveLength(CHALLENGES_PER_DAY);
      expect(new Set(set.map((c) => c.key)).size).toBe(CHALLENGES_PER_DAY);
    }
  });
  it("is the same all day and changes the next day", () => {
    const ids = (day: string) => challengesFor(day).map((c) => c.id).join();
    expect(ids("2026-11-15")).toBe(ids("2026-11-15"));
    expect(ids("2026-11-15") === ids("2026-11-16")).toBe(false);
  });
  it("has unique ids in the pool", () => {
    expect(new Set(CHALLENGE_POOL.map((c) => c.id)).size).toBe(CHALLENGE_POOL.length);
  });
});

describe("daily challenges progress", () => {
  it("keeps the best run of correct decisions across hands and resets it on a mistake", () => {
    at("2026-11-15");
    for (let i = 0; i < 6; i++) achievementsStore.add("bjCorrect");
    achievementsStore.add("bjHand");
    for (let i = 0; i < 6; i++) achievementsStore.add("bjCorrect");
    expect(achievementsStore.get().counters.bjCorrectRun).toBe(12);
    achievementsStore.add("bjMistake");
    achievementsStore.add("bjCorrect");
    expect(achievementsStore.get().counters.bjCorrectRun).toBe(12);
    expect(achievementsStore.get().counters.bjCorrect).toBe(13);
  });
  it("keeps the best win streak rather than adding streaks up", () => {
    at("2026-11-15");
    achievementsStore.add("bjStreak", 4);
    achievementsStore.add("bjStreak", 1);
    expect(achievementsStore.get().counters.bjStreak).toBe(4);
  });
  it("announces a completed challenge once and pays it once, outside a round", () => {
    at("2026-11-15");
    const target = challengesFor("2026-11-15").find((c) => c.mode === "count")!;
    achievementsStore.add(target.key as never, target.goal);
    achievementsStore.add(target.key as never, 1);
    expect(achievementsStore.getToasts().filter((t) => t.id === target.id)).toHaveLength(1);

    wallet.setLocked(true);
    expect(achievementsStore.claim(target.id)).toBe(0);
    wallet.setLocked(false);
    expect(achievementsStore.claim(target.id)).toBe(target.reward);
    expect(wallet.getBalance()).toBe(1000 + target.reward);
    expect(achievementsStore.claim(target.id)).toBe(0);
  });
  it("starts over on a new day", () => {
    at("2026-11-15");
    const target = challengesFor("2026-11-15").find((c) => c.mode === "count")!;
    achievementsStore.add(target.key as never, target.goal);
    at("2026-11-16");
    achievementsStore.refresh();
    const views = challengeView(achievementsStore.get());
    expect(views).toHaveLength(CHALLENGES_PER_DAY);
    expect(views.some((v) => v.done || v.claimed)).toBe(false);
  });
});
