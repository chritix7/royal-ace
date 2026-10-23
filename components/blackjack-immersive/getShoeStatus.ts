import type { Game } from "../../lib/useBlackjack";

export function getShoeStatus(g: Game): {
  label: string;
  tone: "gold" | "green" | "red" | "orange" | "white";
} {
  const { s } = g;

  if (s.shuffling) {
    return { label: "Shuffling", tone: "orange" };
  }

  if (s.phase === "betting") {
    return { label: "Ready", tone: "gold" };
  }

  if (s.phase === "dealing") {
    return { label: "Dealing", tone: "gold" };
  }

  if (s.phase === "insurance") {
    return { label: "Insurance", tone: "orange" };
  }

  if (s.phase === "player") {
    return { label: "Your turn", tone: "green" };
  }

  if (s.phase === "dealer") {
    return { label: "Dealer", tone: "white" };
  }

  if (s.phase === "settled") {
    const net = s.net ?? 0;

    if (net > 0) return { label: "Win", tone: "green" };
    if (net < 0) return { label: "Loss", tone: "red" };
    return { label: "Push", tone: "white" };
  }

  return { label: "Ready", tone: "gold" };
}
