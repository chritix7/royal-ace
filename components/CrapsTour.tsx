"use client";

import { useEffect, useRef, useState } from "react";
import type { CrapsGame } from "../lib/useCraps";

/**
 * Guided first game of craps: a spotlight on the part of the table to use
 * and a short note, moving on by itself when the player does the step
 * (bet the Pass line, roll, take odds…). Can be skipped at any time.
 */
type Step = { id: string; title: string; text: string; target: string; next?: "auto" | "button" };

const STEPS: Step[] = [
  { id: "hello", title: "Craps in five steps", text: "Every roll, two dice. The simplest way to play — and one of the best bets in the casino — is the Pass line. Follow the gold spotlight.", target: ".cr-table", next: "button" },
  { id: "pass", title: "1 · Bet the Pass line", text: "Pick a chip below, then tap PASS LINE to put it down.", target: ".cr-pass", next: "auto" },
  { id: "comeout", title: "2 · The come-out roll", text: "7 or 11 wins at once. 2, 3 or 12 loses. Any other number becomes the point. Roll!", target: ".cr-root .rl-round-spin, .cr-root .rl-spin", next: "auto" },
  { id: "odds", title: "3 · Take the odds", text: "The puck says ON: that number is the point. Add Odds behind your Pass bet — they pay true odds, with no house edge at all.", target: ".cr-odds", next: "button" },
  { id: "point", title: "4 · Hit the point", text: "Keep rolling: the point again and you win (with your odds). A 7 first and the Pass line loses. Other numbers don't matter.", target: ".cr-root .rl-round-spin, .cr-root .rl-spin", next: "auto" },
  { id: "more", title: "5 · More bets, when you're ready", text: "Field is a one-roll bet, Place bets back a number, Hardways and props pay big but cost more. Keep Hints on: the line above the table tells you what each roll did.", target: ".cr-field", next: "button" },
];
const KEY = "royalace:craps-tour";

export function useCrapsTour() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    try {
      setSeen(localStorage.getItem(KEY) === "done");
    } catch {}
  }, []);
  const close = () => {
    setOpen(false);
    setSeen(true);
    try {
      localStorage.setItem(KEY, "done");
    } catch {}
  };
  return { open, seen, start: () => setOpen(true), close };
}

export default function CrapsTour({ g, onClose }: { g: CrapsGame; onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const rolls = useRef(g.history.length);
  const hadPoint = useRef(g.point !== null);

  // Follow the target (it moves with the layout and the phone keyboard).
  useEffect(() => {
    const find = () => {
      const el = [...document.querySelectorAll<HTMLElement>(step.target)].find((e) => e.offsetParent !== null);
      if (!el) return setBox(null);
      const r = el.getBoundingClientRect();
      setBox({ x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 });
    };
    find();
    const t = window.setInterval(find, 400);
    window.addEventListener("resize", find);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", find);
    };
  }, [step.target]);

  // Steps that move on by themselves.
  useEffect(() => {
    if (step.id === "pass" && (g.bets.pass ?? 0) > 0) setI(2);
    if (step.id === "odds" && (g.bets.passOdds ?? 0) > 0) setI(4);
    if (!g.rolling && g.history.length > rolls.current) {
      rolls.current = g.history.length;
      if (step.id === "comeout") {
        // Decided at once (7, 11, craps): bet again; otherwise a point is on.
        if (g.point !== null) {
          hadPoint.current = true;
          setI(3);
        } else if ((g.bets.pass ?? 0) === 0) setI(1);
      } else if (step.id === "point" || step.id === "odds") {
        if (g.point === null) setI(5);
      }
    }
  }, [g.bets, g.point, g.history.length, g.rolling, step.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = !box || box.y + box.h < vh * 0.55;
  const last = i === STEPS.length - 1;
  return (
    <div className="cr-tour" aria-live="polite">
      {box && <div className="cr-tour__spot" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />}
      <div
        className="cr-tour__card"
        role="dialog"
        aria-label={step.title}
        style={box ? (below ? { top: Math.min(vh - 220, box.y + box.h + 12) } : { top: Math.max(12, box.y - 190) }) : { top: "30%" }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="cr-tour__title">{step.title}</p>
          <span className="text-[10px] text-white/40">
            {i + 1}/{STEPS.length}
          </span>
        </div>
        <p className="cr-tour__text">{step.text}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 hover:text-white/70">
            Skip tour
          </button>
          {(step.next === "button" || step.id === "odds") && (
            <button type="button" onClick={() => (last ? onClose() : setI(step.id === "odds" ? 4 : i + 1))} className="rl-key is-on">
              {last ? "Let's play" : step.id === "odds" ? "Skip odds" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
