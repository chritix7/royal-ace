"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Side-bet win toast.
 *
 * Watches `s.sideNote`; when it flips from null/loss to a win message
 * (starts with "Side bets:" and contains a "+"), pops a premium gold
 * toast top-center with the specific win details, e.g.
 * "Perfect Pair · +50". Auto-dismisses after ~3s with a clean fade.
 * Visible in both the classic and immersive views so the player
 * always knows WHY the confetti is firing.
 */

const DISPLAY_MS = 3000;
const EXIT_MS = 320;

export default function SideBetToast({
  sideNote,
}: {
  sideNote: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const prev = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const previous = prev.current;
    prev.current = sideNote;

    // Only fire on a WIN transition. "Side bets lost." or null → ignored.
    if (!sideNote || !sideNote.includes("+") || sideNote === previous) {
      return;
    }

    // Clear any pending timers from a previous toast.
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];

    setVisible(sideNote);
    setLeaving(false);

    const leaveTimer = window.setTimeout(() => setLeaving(true), DISPLAY_MS);
    const clearTimer = window.setTimeout(() => {
      setVisible(null);
      setLeaving(false);
    }, DISPLAY_MS + EXIT_MS);

    timers.current.push(leaveTimer, clearTimer);
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
      timers.current = [];
    };
  }, [sideNote]);

  if (!mounted || !visible) return null;

  // Trim the "Side bets: " prefix so the toast focuses on the win itself.
  const payload = visible.replace(/^Side bets:\s*/, "");

  return createPortal(
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-[170] w-[min(92vw,22rem)] -translate-x-1/2 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes sbt-enter {
          0% { opacity: 0; transform: translateY(-14px) scale(0.92); }
          55% { opacity: 1; transform: translateY(3px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sbt-exit {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }
        @keyframes sbt-shine {
          0% { transform: translateX(-110%); }
          60%, 100% { transform: translateX(220%); }
        }
      `}</style>

      <div
        className="pointer-events-auto relative overflow-hidden rounded-2xl border border-[#d7b45b]/60 p-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.24) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 100%)",
          boxShadow:
            "0 20px 44px rgba(0,0,0,0.65), 0 0 22px rgba(229,199,121,0.35), inset 0 1px 0 rgba(229,199,121,0.18)",
          animation: leaving
            ? `sbt-exit ${EXIT_MS}ms ease-in both`
            : "sbt-enter 420ms cubic-bezier(0.22, 0.9, 0.3, 1) both",
        }}
      >
        {/* Gold shine sweep across (one-shot on enter) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-28"
          style={{
            background:
              "linear-gradient(100deg, transparent 0%, rgba(246,228,169,0.45) 50%, transparent 100%)",
            animation: "sbt-shine 1200ms ease-out 200ms 1 both",
            mixBlendMode: "screen",
          }}
        />

        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Gold chip medallion */}
          <div
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #f6e4a9 0%, #d7b45b 55%, #8a6c2b 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 7px rgba(0,0,0,0.6), 0 0 14px rgba(229,199,121,0.55)",
            }}
          >
            <span
              className="text-base leading-none"
              style={{ color: "#1a1612" }}
            >
              ★
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-[9px] font-black uppercase tracking-[0.25em]"
              style={{
                color: "#e5c779",
                textShadow: "0 1px 0 rgba(0,0,0,0.9)",
              }}
            >
              Side bet win
            </p>
            <p className="mt-0.5 truncate text-sm font-black text-white">
              {payload}
            </p>
          </div>
        </div>

        {/* Gold hairline at the bottom */}
        <span
          aria-hidden
          className="absolute inset-x-4 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(229,199,121,0.6), transparent)",
          }}
        />
      </div>
    </div>,
    document.body
  );
}
