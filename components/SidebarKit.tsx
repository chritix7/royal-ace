"use client";

import type { ReactNode } from "react";

/**
 * Shared sidebar design primitives. Keeps every panel on the same
 * typography / spacing / button grid so the sidebar reads as one
 * instrument panel rather than seven unrelated cards.
 *
 * Exports:
 *  - Panel: rounded container with a consistent border/padding
 *  - PanelHeader: small gold eyebrow + title, with optional right-aligned slot
 *  - btnGhost / btnPrimary / btnPill: the three button styles
 *  - eyebrow: the small gold uppercase label used at the top of sections
 *  - hairline: a horizontal gold-tinted divider
 */

export const eyebrow =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7b45b]/80";

export const hairline =
  "my-4 h-px w-full bg-gradient-to-r from-transparent via-[#d7b45b]/15 to-transparent";

/** Primary (gold) — Deal, main confirms. */
export const btnPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d7b45b]/70 bg-gradient-to-b from-[#e5c779]/90 to-[#c89a3f] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#10130e] shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] outline-none transition-[filter,transform,box-shadow] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#e5c779] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101713] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";

/** Ghost — the default info button. Dark glass, hair-thin border. */
export const btnGhost =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-white/65 outline-none transition hover:border-[#d7b45b]/40 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-30";

/** Pill — used for quick bet controls (Rebet / ×2 / Clear). Smaller.
 *  Gradient glass body + inset top-highlight, uppercase tracked label,
 *  gold hover state, press-down 1px on active. */
export const btnPill =
  "inline-flex min-h-8 items-center justify-center rounded-full border border-white/12 bg-gradient-to-b from-[#1a2219]/90 to-[#0e1310]/90 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(0,0,0,0.45)] outline-none transition hover:border-[#d7b45b]/60 hover:text-[#e5c779] focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-30";

export function Panel({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-[#c8a65b]/15 bg-[#0e1310]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_1px_0_rgba(0,0,0,0.6)] ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  eyebrow: eyebrowText,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-2">
      <div className="min-w-0">
        {eyebrowText && (
          <p className={eyebrow}>{eyebrowText}</p>
        )}
        <h3 className="text-sm font-black tracking-wide text-white">
          {title}
        </h3>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
