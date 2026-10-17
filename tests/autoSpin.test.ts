import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTO_COUNTS, loadAutoCount, parseAutoCount, runAutoSpins, saveAutoCount } from "../lib/autoSpin";

beforeAll(() => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as unknown as Storage;
});

describe("auto spin count", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("offers 10, 25 and 50 spins", () => {
    expect([...AUTO_COUNTS]).toEqual([10, 25, 50]);
  });

  it("accepts only valid counts and falls back to 10", () => {
    expect(parseAutoCount("25")).toBe(25);
    expect(parseAutoCount("50")).toBe(50);
    expect(parseAutoCount("7")).toBe(10);
    expect(parseAutoCount("abc")).toBe(10);
    expect(parseAutoCount(null)).toBe(10);
  });

  it("round-trips the chosen count through storage", () => {
    saveAutoCount(50);
    expect(loadAutoCount()).toBe(50);
  });

  it("returns the default when storage is unavailable", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(loadAutoCount()).toBe(10);
  });

  it("does not throw when saving is unavailable", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => saveAutoCount(25)).not.toThrow();
  });
});

describe("runAutoSpins scheduling", () => {
  const base = (over: Partial<Parameters<typeof runAutoSpins>[2]> = {}) => ({
    shouldStop: () => false,
    canAfford: () => true,
    onInsufficientFunds: () => {},
    onProgress: () => {},
    pause: () => Promise.resolve(),
    ...over,
  });

  it("plays the requested number of spins", async () => {
    let spins = 0;
    const done = await runAutoSpins(3, async () => {
      spins++;
      return { stop: false };
    }, base());
    expect(spins).toBe(3);
    expect(done).toBe(3);
  });

  it("STOP pressed between two spins prevents the next wager", async () => {
    let spins = 0;
    let stopped = false;
    const done = await runAutoSpins(5, async () => {
      spins++;
      return { stop: false };
    }, base({
      pause: async () => {
        stopped = true; // STOP pressed while waiting between spins
      },
      shouldStop: () => stopped,
    }));
    // the spin in flight finished, but no second wager started
    expect(spins).toBe(1);
    expect(done).toBe(1);
  });

  it("STOP before the first spin plays nothing", async () => {
    let spins = 0;
    const done = await runAutoSpins(10, async () => {
      spins++;
      return { stop: false };
    }, base({ shouldStop: () => true }));
    expect(spins).toBe(0);
    expect(done).toBe(0);
  });

  it("stops when a round says so (bonus, vault, big win)", async () => {
    let spins = 0;
    const done = await runAutoSpins(10, async () => {
      spins++;
      return { stop: spins >= 2 };
    }, base());
    expect(spins).toBe(2);
    expect(done).toBe(2);
  });

  it("stops without wagering when chips are insufficient", async () => {
    let spins = 0;
    let warned = false;
    const done = await runAutoSpins(10, async () => {
      spins++;
      return { stop: false };
    }, base({
      canAfford: () => spins === 0,
      onInsufficientFunds: () => {
        warned = true;
      },
    }));
    expect(spins).toBe(1);
    expect(done).toBe(1);
    expect(warned).toBe(true);
  });
});
