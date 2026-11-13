"use client";

import { useSyncExternalStore } from "react";
import { music, type CalmTheme } from "../lib/music";

const THEMES: Array<{ id: CalmTheme; label: string; blurb: string; glyph: string }> = [
  { id: "lounge", label: "Lounge", blurb: "After-dinner bar, no rush", glyph: "🎷" },
  { id: "vegas", label: "Vegas", blurb: "Strip casino floor, full house", glyph: "🎲" },
  { id: "neon", label: "Neon", blurb: "Slow synthwave, late night", glyph: "✦" },
  { id: "silent", label: "Silent", blurb: "Table quiet, cards only", glyph: "∅" },
];

export default function TableThemePicker({ className = "" }: { className?: string }) {
  const current = useSyncExternalStore<CalmTheme>(
    music.subscribeCalmTheme,
    music.getCalmTheme,
    () => "lounge",
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d7b45b]/70">
        Table music
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {THEMES.map((t) => {
          const active = t.id === current;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => music.setCalmTheme(t.id)}
              aria-pressed={active}
              title={t.blurb}
              className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left outline-none transition-[background,border-color,transform] enabled:active:translate-y-px focus-visible:ring-2 focus-visible:ring-[#e5c779] ${
                active
                  ? "border-[#d7b45b]/60 bg-gradient-to-b from-[#d7b45b]/[0.14] to-black/20 shadow-[inset_0_1px_0_rgba(229,199,121,0.2)]"
                  : "border-white/10 bg-gradient-to-b from-black/30 to-black/10 hover:border-[#d7b45b]/40"
              }`}
            >
              <span
                aria-hidden
                className={`text-sm leading-none ${
                  active ? "text-[#f5d778]" : "text-white/55 group-hover:text-[#d7b45b]"
                }`}
              >
                {t.glyph}
              </span>
              <span className="min-w-0 flex-1">
                <p
                  className={`text-[11px] font-black tracking-wide ${
                    active ? "text-[#f5d778]" : "text-white"
                  }`}
                >
                  {t.label}
                </p>
                <p className="truncate text-[9px] text-white/50">{t.blurb}</p>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
