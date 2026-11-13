"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "../lib/useBlackjack";

/**
 * Floating speech bubble next to the dealer, feeding one short line of
 * flavor text per trigger. Lines are picked from themed pools so the
 * dealer never repeats the same line twice in a row.
 *
 * Triggers (driven off game state, not direct calls — we watch phase +
 * result transitions and react once):
 *   - start of a new hand (transition into "dealing")
 *   - player's move begins (into "player")
 *   - split happens (message contains "Split")
 *   - dealer pulls the hole (into "dealer")
 *   - settle: win / blackjack / loss / push / bust (into "settled")
 *   - insurance ask (into "insurance")
 */
type Mood = "deal" | "move" | "split" | "dealer" | "insurance" | "settle-win" | "settle-bj" | "settle-loss" | "settle-push" | "settle-bust";

const LINES: Record<Mood, string[]> = {
  deal: [
    "Good luck.",
    "New shoe energy.",
    "Let's see the cards.",
    "Fresh hand.",
    "Cards up.",
    "Here we go.",
  ],
  move: [
    "Your call.",
    "Take your time.",
    "What's it going to be?",
    "The table waits.",
    "Play it.",
  ],
  split: [
    "Two tracks now.",
    "Nice split.",
    "Double trouble.",
  ],
  dealer: [
    "My turn.",
    "Let's see what I've got.",
    "Hole card…",
    "Dealer plays.",
  ],
  insurance: [
    "Insurance is open.",
    "Fancy some protection?",
    "Ace showing — your move.",
  ],
  "settle-bj": [
    "Blackjack! Clean pay.",
    "Twenty-one on the deal — well done.",
    "That's the dream hand.",
    "Natural. Beautiful.",
  ],
  "settle-win": [
    "Nicely played.",
    "That's a winner.",
    "Hand goes to you.",
    "Chips your way.",
    "Smooth.",
  ],
  "settle-loss": [
    "House takes it.",
    "Tough break.",
    "Next shoe, next chance.",
    "Not this one.",
  ],
  "settle-push": [
    "Push. Bets stay.",
    "Even-up.",
    "Standoff.",
  ],
  "settle-bust": [
    "Bust. One too many.",
    "Over the top.",
    "Twenty-two hurts.",
  ],
};

function pick(mood: Mood, last: string | null): string {
  const pool = LINES[mood];
  if (pool.length <= 1) return pool[0];
  let line = pool[Math.floor(Math.random() * pool.length)];
  // Avoid repeating the exact previous line.
  if (line === last) {
    line = pool[(pool.indexOf(line) + 1) % pool.length];
  }
  return line;
}

function classifySettle(g: Game): Mood | null {
  const s = g.s;
  if (s.phase !== "settled") return null;
  // Blackjack natural beats regular win styling.
  if (s.hands.some((h) => h.result === "blackjack")) return "settle-bj";
  if (s.hands.every((h) => h.result === "bust")) return "settle-bust";
  if (s.net != null && s.net > 0) return "settle-win";
  if (s.net != null && s.net < 0) return "settle-loss";
  return "settle-push";
}

export default function DealerBubble({ g, className = "" }: { g: Game; className?: string }) {
  const [line, setLine] = useState<string | null>(null);
  const prevLineRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<string>(g.s.phase);
  const prevMessageRef = useRef<string>(g.s.message);
  const hideTimerRef = useRef<number | null>(null);

  const say = (mood: Mood, holdMs = 2800) => {
    const next = pick(mood, prevLineRef.current);
    prevLineRef.current = next;
    setLine(next);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setLine(null), holdMs);
  };

  useEffect(() => {
    const phase = g.s.phase;
    const prev = prevPhaseRef.current;
    if (phase !== prev) {
      if (phase === "dealing") say("deal");
      else if (phase === "player") say("move", 2400);
      else if (phase === "insurance") say("insurance");
      else if (phase === "dealer") say("dealer", 2000);
      else if (phase === "settled") {
        const m = classifySettle(g);
        if (m) say(m, 3800);
      }
      prevPhaseRef.current = phase;
    }
    // Splits leave phase at "player" but flip message to "Split!"
    if (
      g.s.message === "Split!" &&
      prevMessageRef.current !== "Split!"
    ) {
      say("split", 2200);
    }
    prevMessageRef.current = g.s.message;
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [g.s.phase, g.s.message, g]);

  if (!line) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute z-20 max-w-[220px] animate-insurance-slide-in ${className}`}
    >
      <div className="relative rounded-2xl rounded-tl-sm border border-[#d7b45b]/40 bg-gradient-to-b from-[#1b1612]/95 to-[#0a0806]/95 px-3 py-1.5 text-[11px] font-semibold leading-tight text-[#f5d778] shadow-[0_6px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(229,199,121,0.15)] backdrop-blur-sm sm:text-[12px]">
        {/* Little tail pointing up-left toward the dealer */}
        <span
          aria-hidden
          className="absolute -top-1.5 left-3 h-3 w-3 rotate-45 border-l border-t border-[#d7b45b]/40 bg-[#1b1612]"
        />
        {line}
      </div>
    </div>
  );
}
