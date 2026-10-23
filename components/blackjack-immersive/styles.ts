import { money } from "../../lib/game";

export const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}◈ ${money(Math.abs(value))}`;

export const control =
  "inline-flex min-h-10 items-center justify-center rounded-xl border px-2 py-2 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm";

export const gold =
  "border-[#d7b45b] bg-[#d7b45b] text-[#10130e] enabled:hover:bg-[#efd58c]";

export const neutral =
  "border-white/20 bg-white/[0.04] text-white/85 enabled:hover:border-[#d7b45b] enabled:hover:text-[#e5c779]";
