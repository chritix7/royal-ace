"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Premium achievement-unlocked toast.
 *
 * Reads the hook's `s.toast` (format: "id|title|desc" when triggered by
 * unlock()) and renders a gold-badged slide-in notification top-right on
 * desktop / top-center on mobile. Auto-dismisses after ~3.6s with a
 * clean fade-out. Clicking the toast dismisses it immediately.
 *
 * The toast is non-blocking (pointer-events-auto only on itself, not
 * the overlay), so game flow continues underneath.
 */

const DISPLAY_MS = 3600;
const EXIT_MS = 320;

export default function AchievementToast({
  toast,
  onDismiss,
}: {
  toast: string | null;
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => setMounted(true), []);

  // When a new toast arrives, show it and schedule its auto-dismiss.
  useEffect(() => {
    // Clear any pending timers from the previous toast.
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];

    if (!toast) {
      setVisible(null);
      setLeaving(false);
      return;
    }

    setVisible(toast);
    setLeaving(false);

    const leaveTimer = window.setTimeout(() => setLeaving(true), DISPLAY_MS);
    const clearTimer = window.setTimeout(() => {
      setVisible(null);
      setLeaving(false);
      onDismiss();
    }, DISPLAY_MS + EXIT_MS);

    timers.current.push(leaveTimer, clearTimer);
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
      timers.current = [];
    };
  }, [toast, onDismiss]);

  if (!mounted || !visible) return null;

  // Parse "id|title|desc" or fall back to a bare message.
  const parts = visible.split("|");
  const title = parts[1] ?? visible;
  const desc = parts[2] ?? "";

  return createPortal(
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-[200] w-[min(92vw,22rem)] -translate-x-1/2 sm:left-auto sm:right-4 sm:top-4 sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes ach-enter {
          0% { opacity: 0; transform: translateY(-12px) scale(0.96); }
          60% { opacity: 1; transform: translateY(2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ach-exit {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-12px) scale(0.96); }
        }
        @keyframes ach-shine {
          0% { transform: translateX(-110%); }
          60%, 100% { transform: translateX(220%); }
        }
      `}</style>

      <button
        type="button"
        onClick={() => {
          setLeaving(true);
          window.setTimeout(() => {
            setVisible(null);
            setLeaving(false);
            onDismiss();
          }, EXIT_MS);
        }}
        className="pointer-events-auto relative block w-full cursor-default overflow-hidden rounded-2xl border border-[#d7b45b]/60 p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779]"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, rgba(215,180,91,0.2) 0%, transparent 60%), linear-gradient(180deg, #1a1512 0%, #120e0b 100%)",
          boxShadow:
            "0 0 0 1px rgba(229,199,121,0.2), 0 20px 44px rgba(0,0,0,0.6), inset 0 1px 0 rgba(229,199,121,0.15)",
          animation: leaving
            ? `ach-exit ${EXIT_MS}ms ease-in both`
            : "ach-enter 420ms cubic-bezier(0.22, 0.9, 0.3, 1) both",
        }}
      >
        {/* top-side gold shine sweep (plays once on enter) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-24"
          style={{
            background:
              "linear-gradient(100deg, transparent 0%, rgba(246,228,169,0.35) 50%, transparent 100%)",
            animation: "ach-shine 1200ms ease-out 200ms 1 both",
            mixBlendMode: "screen",
          }}
        />

        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Gold medallion with trophy */}
          <div
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #f6e4a9 0%, #d7b45b 55%, #8a6c2b 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.6), 0 0 14px rgba(229,199,121,0.55)",
            }}
          >
            <span className="text-lg leading-none" style={{ color: "#1a1612" }}>
              ★
            </span>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p
              className="text-[9px] font-black uppercase tracking-[0.22em]"
              style={{
                color: "#e5c779",
                textShadow: "0 1px 0 rgba(0,0,0,0.9)",
              }}
            >
              Achievement unlocked
            </p>
            <p className="mt-0.5 truncate text-sm font-black text-white">
              {title}
            </p>
            {desc && (
              <p className="truncate text-[11px] text-white/55">{desc}</p>
            )}
          </div>
        </div>

        {/* Gold hairline at the bottom */}
        <span
          aria-hidden
          className="absolute inset-x-4 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(229,199,121,0.5), transparent)",
          }}
        />
      </button>
    </div>,
    document.body
  );
}
