"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "../lib/useBlackjack";
import { wallet } from "../lib/wallet";

/**
 * Lucky-round feature: at the start of a random round (odds 1-in-15) a
 * gold banner lights up the table and the next win pays a 10% bonus on
 * top of the hand's net. If the player loses the round, the banner
 * fades at settle with no effect. One golden round at a time.
 *
 * Also catches "lucky-hour" cues — when the player's local clock shows
 * doublet minutes (11:11, 22:22, …) we force the golden flag on the
 * next hand, giving a reliable trigger a few times a day without
 * cluttering the UI with its own control.
 *
 * Purely client-side: rolls dice on "betting" phase entry, watches the
 * phase→"settled" transition, and pays out via `wallet.add`. The main
 * game store stays untouched.
 */

function isLuckyClockMinute(d: Date): boolean {
  // Mirror-minute moments feel lucky in casinos: 11:11, 22:22…
  const hh = d.getHours();
  const mm = d.getMinutes();
  if (mm === hh && mm > 0) return true; // 1:01 … 23:23
  if (mm === 11 && hh === 11) return true;
  if (mm === 22 && hh === 22) return true;
  return false;
}

export default function LuckyRound({ g }: { g: Game }) {
  const [active, setActive] = useState(false);
  // Keep the "we are watching this hand" flag in a ref so settle
  // doesn't double-fire after a React re-render.
  const activeRef = useRef(false);
  const prevPhaseRef = useRef<string>(g.s.phase);
  const settledNetRef = useRef<number | null>(null);
  const prevHistoryLenRef = useRef<number>(g.s.history.length);

  useEffect(() => {
    const phase = g.s.phase;
    const prev = prevPhaseRef.current;

    // Entering betting = chance to roll a golden round for the NEXT hand.
    if (phase === "betting" && prev !== "betting") {
      const luckyClock = isLuckyClockMinute(new Date());
      const rolled = luckyClock || Math.random() < 1 / 15;
      if (rolled && !activeRef.current) {
        setActive(true);
        activeRef.current = true;
      }
    }

    // Settle — pay the bonus if the flag was on and the player won.
    if (
      phase === "settled" &&
      prev !== "settled" &&
      activeRef.current
    ) {
      settledNetRef.current = g.s.net;
      if (g.s.net != null && g.s.net > 0) {
        const bonus = Math.round(g.s.net * 0.1);
        if (bonus > 0) {
          wallet.add(bonus);
        }
      }
      // Fade the banner out a beat after settle so the player sees it
      // linger on their win.
      const tid = window.setTimeout(() => {
        setActive(false);
        activeRef.current = false;
      }, 2800);
      prevPhaseRef.current = phase;
      return () => window.clearTimeout(tid);
    }

    prevPhaseRef.current = phase;
  }, [g.s.phase, g.s.net, g.s.history.length]);

  // Reset when the history length jumps backward (session reset).
  useEffect(() => {
    if (g.s.history.length < prevHistoryLenRef.current) {
      setActive(false);
      activeRef.current = false;
    }
    prevHistoryLenRef.current = g.s.history.length;
  }, [g.s.history.length]);

  if (!active) return null;

  const won = g.s.phase === "settled" && (g.s.net ?? 0) > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute left-1/2 top-1 z-20 -translate-x-1/2 animate-insurance-slide-in"
    >
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_6px_20px_rgba(229,199,121,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-sm sm:text-[11px] ${
          won
            ? "border-[#d7b45b] bg-gradient-to-b from-[#f5d778] to-[#c89a3f] text-[#10130e]"
            : "border-[#d7b45b]/70 bg-gradient-to-b from-[#d7b45b]/30 to-[#d7b45b]/10 text-[#f5d778]"
        }`}
      >
        <span aria-hidden className="text-[12px]">★</span>
        <span>{won ? "Golden win • +10% bonus paid" : "Golden Round • +10% on win"}</span>
        <span aria-hidden className="text-[12px]">★</span>
      </div>
    </div>
  );
}
