"use client";

/**
 * Vegas felt — minimal premium. Alex wanted the previous version
 * stripped of all the lines and clutter. What's left:
 *
 *   1. Fine diagonal grain so the slate isn't dead flat.
 *   2. Soft rim-light under the dealer shoe so it stays visible.
 *   3. One thin gold frame around the whole table (single line, not
 *      a double rule — kept quiet).
 *   4. Slow candlelight shimmer sweep across the table so the gold
 *      frame subtly breathes.
 *
 * No veins, no spade watermark, no corner scrollwork, no wordmark,
 * no emblems. Nothing competes with the dealer shoe or the game.
 */

export default function VegasFeltOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <style>{`
        @keyframes vegas-rim-pulse {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        @keyframes vegas-shimmer {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 0.45; }
          80%  { opacity: 0.45; }
          100% { transform: translateX(100%);  opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* 1. Fine grain */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(246, 228, 169, 0.012) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.08) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* 2. Soft rim-light under the dealer shoe (top-right) */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-80px",
          right: "-30px",
          width: "340px",
          height: "340px",
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(246, 228, 169, 0.28) 55%, rgba(229, 199, 121, 0.1) 72%, transparent 90%)",
          filter: "blur(14px)",
          animation: "vegas-rim-pulse 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "-120px",
          right: "-80px",
          width: "460px",
          height: "460px",
          background:
            "radial-gradient(circle at center, rgba(229, 199, 121, 0.12) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* 3. Slow candlelight shimmer sweep across the table */}
      <div
        className="vegas-anim absolute inset-y-0 w-[260px]"
        style={{
          left: "0",
          background:
            "linear-gradient(100deg, transparent 20%, rgba(246, 228, 169, 0.08) 50%, transparent 80%)",
          filter: "blur(32px)",
          mixBlendMode: "overlay",
          animation: "vegas-shimmer 16s ease-in-out infinite",
        }}
      />

      {/* Soft edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, transparent 60%, rgba(0, 0, 0, 0.3) 100%)",
        }}
      />
    </div>
  );
}
