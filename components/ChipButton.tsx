"use client";

import { useRef } from "react";
import { CHIP_BG } from "../lib/game";

/**
 * Sidebar / bet-input chip button. A circular chip with the value
 * written on it, plus a one-shot gold ring that flashes outward on
 * every click — chip-click animation reset via ref so the ring fires
 * even on rapid successive taps. Scales down slightly on :active for
 * a tactile press.
 *
 * Variants:
 *   size="md"  → sidebar chip (h/w-14), used in classic view
 *   size="sm"  → immersive bet-entry chip (h/w-8)
 */
export default function ChipButton({
  value,
  disabled,
  onClick,
  size = "md",
}: {
  value: number;
  disabled?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const ringRef = useRef<HTMLSpanElement>(null);

  function handleClick() {
    const node = ringRef.current;
    if (node) {
      // Re-trigger the animation by removing the class, forcing a
      // reflow, then adding it back on the next frame.
      node.classList.remove("animate-chip-click");
      void node.offsetWidth;
      node.classList.add("animate-chip-click");
    }
    onClick();
  }

  const dims =
    size === "sm"
      ? "h-8 w-8 border-2 text-[10px]"
      : "h-14 w-14 border-4 text-sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Add ${value} chips`}
      className={`relative flex items-center justify-center rounded-full border-dashed border-white/70 font-black text-white shadow-lg outline-none transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 ${dims} ${CHIP_BG[value]}`}
    >
      <span
        ref={ringRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
      />
      <span className="relative">{value}</span>
    </button>
  );
}
