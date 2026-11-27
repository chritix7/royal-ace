"use client";

import { useEffect, useState } from "react";

/**
 * First-launch tour of the lobby: five short notes under a gold spotlight
 * (the lounge, the daily bonus, the games, challenges and rewards, the
 * settings and shop). Shown once; can be replayed from Settings.
 */
const STEPS: { target: string; title: string; text: string }[] = [
  { target: ".lb-hero", title: "Welcome to Chrysonyx", text: "Your lounge: name, level and VIP status. Tap your name to see your VIP card. Everything is played with virtual chips." },
  { target: ".lb-bonus", title: "A bonus every day", text: "Claim free chips once a day. Come back the next day: the streak raises the bonus." },
  { target: ".lb-grid, .lb-rail", title: "Seven games", text: "Blackjack, slots, roulette, Hold'em, craps, penalty and the sportsbook. Tap a card for its details, or Play to sit down." },
  { target: ".lb-summary", title: "Challenges and rewards", text: "Two challenges per game every day, a weekly chest to fill and a ranking against the house regulars." },
  { target: "[data-tour=settings]", title: "Settings and shop", text: "Language, sound and ambience, reduced animations — and the shop for new felts, roulette rooms and VIP card finishes." },
];
export const WELCOME_KEY = "royalace:welcome-tour";

export default function WelcomeTour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
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
  const close = () => {
    try {
      localStorage.setItem(WELCOME_KEY, "done");
    } catch {}
    onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = !box || box.y + box.h < vh * 0.55;
  const last = i === STEPS.length - 1;
  return (
    <div className="cr-tour !pointer-events-auto" aria-live="polite">
      {box && <div className="cr-tour__spot" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />}
      <div className="cr-tour__card" role="dialog" aria-label={step.title} style={box ? (below ? { top: Math.min(vh - 200, box.y + box.h + 12) } : { top: Math.max(12, box.y - 180) }) : { top: "35%" }}>
        <div className="flex items-center justify-between gap-2">
          <p className="cr-tour__title">{step.title}</p>
          <span className="text-[10px] text-white/40">
            {i + 1}/{STEPS.length}
          </span>
        </div>
        <p className="cr-tour__text">{step.text}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button type="button" onClick={close} className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 hover:text-white/70">
            Skip tour
          </button>
          <div className="flex gap-1.5">
            {i > 0 && (
              <button type="button" onClick={() => setI(i - 1)} className="rl-key">
                Back
              </button>
            )}
            <button type="button" onClick={() => (last ? close() : setI(i + 1))} className="rl-key is-on">
              {last ? "Let's play" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
