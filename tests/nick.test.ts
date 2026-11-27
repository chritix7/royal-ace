import { describe, expect, it } from "vitest";
import { cleanNick, isReserved, nickKey } from "../lib/nickRules";

describe("unique nicknames", () => {
  it("folds look-alikes to one key", () => {
    const k = nickKey("Chris");
    for (const v of ["chris", "CHRIS", "Chrïs", "Chr1s", "Chris_", "C.h.r.i.s", "Chriss", "Chr!s"]) expect(nickKey(v)).toBe(k);
    expect(nickKey("Kris")).not.toBe(k);
  });
  it("cleans names", () => {
    expect(cleanNick("  Chris  ")).toBe("Chris");
    expect(cleanNick("a")).toBeNull();
    expect(cleanNick("<b>")).toBeNull();
  });
  it("reserves staff names and look-alikes", () => {
    expect(isReserved("Admin")).toBe(true);
    expect(isReserved("Chrys0nyx")).toBe(true);
    expect(isReserved("Support_Team")).toBe(true);
    expect(isReserved("Valou.R")).toBe(false);
  });
});
