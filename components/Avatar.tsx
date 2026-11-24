"use client";

import { itemOf, useShop } from "../lib/shop";

/** The player's avatar: an emblem in a gold ring, coloured by the item. */
export function AvatarBadge({ id, size = "md", className = "" }: { id?: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const st = useShop();
  const it = itemOf(id ?? st.avatar) ?? itemOf("av:ace")!;
  const [a, b, c] = it.swatch;
  return (
    <span
      className={`av-badge av-badge--${size} ${className}`}
      style={{ background: `radial-gradient(circle at 35% 28%, ${b}, ${a} 70%)`, color: c }}
      aria-hidden="true"
    >
      <span className="av-badge__glyph">{it.glyph}{"︎"}</span>
    </span>
  );
}

/** The equipped title (nothing for the starter one). */
export function useTitle(): string | null {
  const st = useShop();
  if (st.title === "title:newcomer") return null;
  return itemOf(st.title)?.glyph ?? null;
}
