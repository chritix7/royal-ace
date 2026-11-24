"use client";

import { useRef } from "react";
import { useShop } from "../lib/shop";

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
  pip?: string;
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
  100000: { body: "#16161a", edge: "#000000", center: "#c9a24a", text: "#16120a" },
  500000: { body: "#efe6cf", edge: "#9a8a5e", center: "#16161a", text: "#f3d995" },
};

/** Short label on the center disc. Keeps the SVG from overflowing for
 *  the big denominations by switching to k-suffix notation at $1,000. */
function chipLabel(value: number): string {
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
}

/** Chip sets from the shop: the centre keeps the denomination colour so
 *  values stay readable; body, rim and edge inlays change. */
const DENOMS = Object.keys(SCHEMES).map(Number);
const ink = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 150 ? "#16120a" : "#ffffff";
};
function themed(set: string, value: number, base: Scheme): Scheme {
  if (set === "chips:classic") return base;
  const s = themedRaw(set, value, base);
  return { ...s, text: ink(s.center) };
}
function themedRaw(set: string, value: number, base: Scheme): Scheme {
  const i = Math.max(0, DENOMS.indexOf(value));
  switch (set) {
    case "chips:carbon":
      return { body: "#1b1c21", edge: "#040405", center: base.body, text: "#ffffff", pip: "#e5c779" };
    case "chips:neon":
      return { body: "#14081f", edge: "#020004", center: base.body, text: "#ffffff", pip: i % 2 ? "#22e6ff" : "#ff2fd1" };
    case "chips:jade":
      return { body: i % 2 ? "#1f8a5f" : "#17734f", edge: "#06231a", center: base.body, text: "#ffffff", pip: "#e8c36a" };
    case "chips:porcelain":
      return { body: "#f6f2ea", edge: "#b9ad93", center: base.body, text: "#ffffff", pip: "#c9a24a" };
    case "chips:ruby":
      return { body: "#121014", edge: "#000000", center: base.body, text: "#ffffff", pip: "#ff4d5e" };
    default:
      return base;
  }
}

export function ChipFace({ value, label: forced, set: forcedSet }: { value: number; label?: string; set?: string }) {
  const equipped = useShop().chips;
  const set = forcedSet ?? equipped;
  const scheme = themed(set, value, SCHEMES[value] ?? SCHEMES[100]);
  const gid = `${set.replace(/\W/g, "")}-${value}`;
  // 8 edge pips at 45° intervals, rotated from the top.
  const pipAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const label = forced ?? chipLabel(value);
  // Shrink the text slightly for 3-char labels so "10K" / "20K" / "50K"
  // don't crowd the center ring.
  const fontSize = label.length >= 4 ? 9.5 : label.length >= 3 ? 11 : 12.5;

  return (
    <svg
      viewBox="0 0 48 48"
      className="pointer-events-none block h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient
          id={`chip-shine-${gid}`}
          cx="34%"
          cy="30%"
          r="60%"
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient
          id={`chip-body-${gid}`}
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
        fill={`url(#chip-body-${gid})`}
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
            fill={scheme.pip ?? "rgba(255,255,255,0.88)"}
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
        fill={`url(#chip-shine-${gid})`}
        pointerEvents="none"
      />
    </svg>
  );
}

/**
 * A bet sitting on a table: the colour of the biggest chip it contains
 * and the total amount on the face (1.5K, 12K…).
 */
export function amountLabel(amount: number) {
  if (amount < 1000) return String(amount);
  if (amount >= 1000000) {
    const m = amount / 1000000;
    return `${Number.isInteger(m) || m >= 10 ? Math.floor(m) : m.toFixed(1)}M`;
  }
  const k = amount / 1000;
  return `${k >= 10 || Number.isInteger(k) ? Math.floor(k) : k.toFixed(1)}K`;
}
export function TableChip({ amount }: { amount: number }) {
  const tones = Object.keys(SCHEMES).map(Number).sort((a, b) => a - b);
  const tone = tones.filter((v) => v <= amount).pop() ?? tones[0];
  return <ChipFace value={tone} label={amountLabel(amount)} />;
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
  size?: "xs" | "sm" | "md";
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
  const dims = size === "xs" ? "h-8 w-8" : size === "sm" ? "h-9 w-9" : "h-11 w-11";

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
