import { describe, expect, it } from "vitest";
import { STRIPS } from "../lib/slots";
import { RANKS, SKINS, rankOf } from "../lib/skins";

describe("skins", () => {
  it("gives every symbol on the reels an emoji and a name in every skin", () => {
    const symbols = new Set(STRIPS.flat());
    Object.values(SKINS).forEach((skin) => {
      symbols.forEach((sym) => {
        expect(skin.emoji[sym]).toBeTruthy();
        expect(skin.names[sym]).toBeTruthy();
      });
      expect(new Set(Object.values(skin.emoji)).size).toBe(Object.keys(skin.emoji).length);
    });
  });
});

describe("hand-drawn symbols", () => {
  it("gives the Miami theme a valid drawing for every symbol and keeps emojis for Classic", () => {
    const symbols = new Set(STRIPS.flat());
    symbols.forEach((sym) => {
      const src = SKINS.miami.art?.[sym] ?? "";
      expect(src.startsWith("data:image/svg+xml")).toBe(true);
      const svg = decodeURIComponent(src.split(",")[1]);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(svg).toContain('viewBox="0 0 100 100"');
      // même nombre de balises ouvrantes et fermantes pour les groupes
      expect((svg.match(/<g[ >]/g) ?? []).length).toBe((svg.match(/<\/g>/g) ?? []).length);
    });
    expect(SKINS.classic.art).toBeNull();
  });
});

describe("ranks", () => {
  it("promotes at each threshold and caps at the top rank", () => {
    expect(rankOf(0).current.name).toBe("Dockhand");
    expect(rankOf(RANKS[1].min).current.name).toBe(RANKS[1].name);
    expect(rankOf(14_999).index).toBe(1);
    const top = rankOf(10_000_000);
    expect(top.next).toBeNull();
    expect(top.progress).toBe(1);
  });
});