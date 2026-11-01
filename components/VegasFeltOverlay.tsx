"use client";

/**
 * Vegas felt overlay — intentionally minimal, matching the simplicity
 * of the other three themes (which have no overlay at all). Just two
 * things so the "Vegas" theme is distinct from a plain dark gradient:
 *
 *   1. Soft gold warmth under the dealer shoe (keeps it visible,
 *      same role the themes' own radial lighting plays for the shoe).
 *   2. A very slow candlelight shimmer sweep so the gold accents on
 *      the shoe + bet pads catch a passing warm wash — that's the
 *      only "trucs en or" on the felt itself.
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
          20%  { opacity: 0.4; }
          80%  { opacity: 0.4; }
          100% { transform: translateX(100%);  opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* 1. Soft gold warmth under the dealer shoe (top-right) */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-80px",
          right: "-30px",
          width: "340px",
          height: "340px",
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(246, 228, 169, 0.26) 55%, rgba(229, 199, 121, 0.1) 72%, transparent 90%)",
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
            "radial-gradient(circle at center, rgba(229, 199, 121, 0.11) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* 2. Slow candlelight shimmer sweep across the table */}
      <div
        className="vegas-anim absolute inset-y-0 w-[260px]"
        style={{
          left: "0",
          background:
            "linear-gradient(100deg, transparent 20%, rgba(246, 228, 169, 0.07) 50%, transparent 80%)",
          filter: "blur(32px)",
          mixBlendMode: "overlay",
          animation: "vegas-shimmer 16s ease-in-out infinite",
        }}
      />
    </div>
  );
}
