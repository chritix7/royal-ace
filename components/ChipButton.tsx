"use client";

import { useRef } from "react";

/**
 * Sidebar / bet-input chip button. Now drawn as an SVG casino chip
 * with denomination-colored body, 8 white edge pips, an inner ring,
 * a subtle highlight gloss, and the value on a dark center dot — the
 * look lifted from a real roulette chip. Flashes a gold ring outward
 * on every click (chip-click keyframe, 500ms ease-out) via a ref-
 * reset so rapid repeated taps each produce their own ring, and
 * scales down slightly on :active for a tactile press.
 *
 * Variants:
 *   size="md"  → sidebar chip (h/w-14), classic view
 *   size="sm"  → immersive bet-entry chip (h/w-8)
 */

type Scheme = {
  body: string;
  edge: string;
  center: string;
  text: string;
};

// Scheme per denomination — body/rim tone + the contrasting center
// disc. Classic casino chip ladder from $10 (blue) up to $50,000
// (silver). High-roller plaques (1K+) get warmer / brighter bodies.
const SCHEMES: Record<number, Scheme> = {
  10: { body: "#0a6ea8", edge: "#043e62", center: "#083a5a", text: "#f5f7fa" },
  20: { body: "#0a7451", edge: "#044529", center: "#0a3b25", text: "#f5f7fa" },
  50: { body: "#b3301e", edge: "#6b1d13", center: "#5e1812", text: "#fff6ef" },
  100: { body: "#1e2630", edge: "#06090d", center: "#0a0d12", text: "#f5f7fa" },
  500: { body: "#6b299c", edge: "#3b1360", center: "#331355", text: "#f7eaff" },
  1000: { body: "#d4a84e", edge: "#876524", center: "#8a6c2e", text: "#1a1612" },
  2000: { body: "#b34666", edge: "#5c1f32", center: "#5a1e2f", text: "#fff6ef" },
  5000: { body: "#8a4a1e", edge: "#4a260f", center: "#3f2210", text: "#fff6ef" },
  10000: { body: "#0a8bba", edge: "#054b67", center: "#083d51", text: "#f5f7fa" },
  20000: { body: "#4a7a2a", edge: "#1e3310", center: "#20331a", text: "#f5f7fa" },
  50000: { body: "#8a8fa2", edge: "#3a3e4c", center: "#2d3140", text: "#1a1612" },
};

/** Short label on the center disc. Keeps the SVG from overflowing for
 *  the big denominations by switching to k-suffix notation at $1,000. */
function chipLabel(value: number): string {
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
}

function ChipFace({ value }: { value: number }) {
  const scheme = SCHEMES[value] ?? SCHEMES[100];
  // 8 edge pips at 45° intervals, rotated from the top.
  const pipAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const label = chipLabel(value);
  // Shrink the text slightly for 3-char labels so "10K" / "20K" / "50K"
  // don't crowd the center ring.
  const fontSize = label.length >= 3 ? 11 : 12.5;

  return (
    <svg
      viewBox="0 0 48 48"
      className="pointer-events-none block h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient
          id={`chip-shine-${value}`}
          cx="34%"
          cy="30%"
          r="60%"
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient
          id={`chip-body-${value}`}
          cx="50%"
          cy="40%"
          r="60%"
        >
          <stop offset="0%" stopColor={scheme.body} stopOpacity="1" />
          <stop offset="100%" stopColor={scheme.edge} stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Outer rim */}
      <circle
        cx="24"
        cy="24"
        r="23"
        fill={`url(#chip-body-${value})`}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="1"
      />

      {/* Edge pips: 8 off-white rectangles rotated around the rim. */}
      <g>
        {pipAngles.map((a) => (
          <rect
            key={a}
            x="22.25"
            y="0.5"
            width="3.5"
            height="5"
            rx="0.6"
            fill="rgba(255,255,255,0.88)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.3"
            transform={`rotate(${a} 24 24)`}
          />
        ))}
      </g>

      {/* Inner ring (concentric) */}
      <circle
        cx="24"
        cy="24"
        r="15.5"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.8"
      />

      {/* Center dot — darker disc holding the denomination */}
      <circle
        cx="24"
        cy="24"
        r="13.5"
        fill={scheme.center}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.6"
      />

      {/* Value text */}
      <text
        x="24"
        y="28.5"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui"
        fill={scheme.text}
        style={{
          letterSpacing: "0.5px",
          paintOrder: "stroke",
        }}
      >
        {label}
      </text>

      {/* Specular highlight */}
      <ellipse
        cx="18"
        cy="15"
        rx="10"
        ry="5"
        fill={`url(#chip-shine-${value})`}
        pointerEvents="none"
      />
    </svg>
  );
}

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
      node.classList.remove("animate-chip-click");
      void node.offsetWidth;
      node.classList.add("animate-chip-click");
    }
    onClick();
  }

  // md is the sidebar size — slim enough that all 5 denominations fit
  // on a single row inside a 300px sidebar column.
  const dims = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Add ${value} chips`}
      className={`relative rounded-full outline-none shadow-[0_3px_6px_rgba(0,0,0,0.5)] transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-[#e5c779] enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 ${dims}`}
    >
      <span
        ref={ringRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
      />
      <ChipFace value={value} />
    </button>
  );
}
