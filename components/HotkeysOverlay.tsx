"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating cheat-sheet listing every keyboard shortcut the table
 * supports. Pops open on `?` (or Shift+/), closes on Escape or any
 * further `?` press. Also listens for the global `showHotkeys` custom
 * event so buttons on the page (e.g. a help cog in the footer) can
 * open it without the keyboard.
 *
 * Hotkeys are read from a static list rather than scraped — the game
 * loop defines them in several places and a single source of truth
 * here is clearer than mapping key handlers.
 */

const SHORTCUTS: Array<{ keys: string[]; label: string; group: string }> = [
  // During a hand
  { keys: ["H"], label: "Hit", group: "In-hand" },
  { keys: ["S"], label: "Stand", group: "In-hand" },
  { keys: ["D"], label: "Double down", group: "In-hand" },
  { keys: ["P"], label: "Split", group: "In-hand" },
  { keys: ["R"], label: "Surrender", group: "In-hand" },
  { keys: ["Y"], label: "Take insurance", group: "In-hand" },
  { keys: ["N"], label: "Decline insurance", group: "In-hand" },

  // Betting / flow
  { keys: ["Space"], label: "Deal / Rebet", group: "Flow" },
  { keys: ["C"], label: "Clear bet", group: "Flow" },
  { keys: ["X"], label: "Double the current bet", group: "Flow" },

  // Interface
  { keys: ["F"], label: "Toggle Focus mode", group: "Interface" },
  { keys: ["?"], label: "Open this cheat-sheet", group: "Interface" },
  { keys: ["Esc"], label: "Close modal / exit Focus", group: "Interface" },
];

export default function HotkeysOverlay() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Global key listener for `?`.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in a form control.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // External trigger via custom event.
  useEffect(() => {
    const onEvt = () => setOpen((v) => !v);
    window.addEventListener("royal-ace:hotkeys", onEvt as EventListener);
    return () =>
      window.removeEventListener("royal-ace:hotkeys", onEvt as EventListener);
  }, []);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const grouped = SHORTCUTS.reduce<Record<string, typeof SHORTCUTS>>(
    (acc, s) => {
      (acc[s.group] ||= []).push(s);
      return acc;
    },
    {},
  );

  const body = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-vegas-fade">
      <button
        type="button"
        aria-label="Close keyboard shortcuts"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="relative w-full max-w-md animate-insurance-slide-in overflow-hidden rounded-2xl border border-[#d7b45b]/40 bg-gradient-to-b from-[#1a1612] to-[#0a0806] shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(229,199,121,0.15)]"
      >
        {/* Gold hairline frame */}
        <div className="pointer-events-none absolute inset-2 rounded-xl border border-[#d7b45b]/15" />

        <div className="relative px-5 pb-4 pt-5">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d7b45b]/70">
            Royal Ace
          </p>
          <h2 className="mt-0.5 text-lg font-black uppercase tracking-wider text-[#f5d778]">
            Keyboard Shortcuts
          </h2>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#d7b45b]/40 hover:text-[#f5d778]"
          >
            ×
          </button>
        </div>

        <div className="relative max-h-[60vh] overflow-y-auto px-5 pb-5">
          {Object.entries(grouped).map(([group, rows]) => (
            <div key={group} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[#d7b45b]/60">
                {group}
              </p>
              <ul className="space-y-1">
                {rows.map((row) => (
                  <li
                    key={row.keys.join("-") + row.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
                  >
                    <span className="text-xs text-white/85">{row.label}</span>
                    <span className="inline-flex items-center gap-1">
                      {row.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex min-w-[26px] items-center justify-center rounded-md border border-[#d7b45b]/40 bg-gradient-to-b from-[#2a211a] to-[#15110c] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#f5d778] shadow-[0_1px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(229,199,121,0.15)]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="mt-2 text-center text-[10px] text-white/40">
            Press <kbd className="inline-flex items-center justify-center rounded border border-white/15 bg-white/5 px-1 text-[9px] text-white/60">?</kbd> or <kbd className="inline-flex items-center justify-center rounded border border-white/15 bg-white/5 px-1 text-[9px] text-white/60">Esc</kbd> to close.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
