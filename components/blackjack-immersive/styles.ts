import { money } from "../../lib/game";

export const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}◈ ${money(Math.abs(value))}`;

export const control =
  "inline-flex min-h-10 items-center justify-center rounded-xl border px-2 py-2 text-xs font-bold uppercase tracking-wide outline-none shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] transition-[filter,transform,background,color,border-color] focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:translate-y-px enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm";

export const gold =
  "border-[#d7b45b]/70 bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] text-[#10130e]";

export const neutral =
  "border-white/15 bg-white/[0.04] text-white/85 enabled:hover:border-[#d7b45b]/60 enabled:hover:text-[#e5c779]";
