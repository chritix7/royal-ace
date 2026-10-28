"use client";

/**
 * Chrome Hearts "House Edition" overlay — dark-luxury charcoal felt
 * with motifs engraved at specific anchor points (not tiled all over
 * like a wallpaper). Reads as a real high-end pit-boss table where
 * the house marks are placed deliberately.
 *
 * Anchored motifs:
 *   • Bottom-center: large "ROYAL ACE" blackletter wordmark engraved
 *     under the betting arc (the house signature).
 *   • Bottom-left + bottom-right: ornate corner medallions flanking
 *     the player area.
 *   • Top-left + top-right: two Chrome Hearts crosses on the dealer
 *     half, flanking the shoe area.
 *   • Center: a single horizontal gold flourish on the mid-line.
 *
 * The dealer shoe (at top-right) gets a strong gold spotlight +
 * tight halo behind it, so it stays legible against the dark felt.
 */

const SPARKLE_POINTS: ReadonlyArray<{
  x: number; y: number; size: number; delay: number; dur: number;
}> = [
  { x: 14, y: 18, size: 1.8, delay: 0.0, dur: 4.4 },
  { x: 44, y: 10, size: 1.5, delay: 1.4, dur: 4.6 },
  { x: 90, y: 24, size: 2.0, delay: 2.3, dur: 4.0 },
  { x: 96, y: 58, size: 1.6, delay: 0.6, dur: 4.4 },
  { x: 8,  y: 60, size: 1.8, delay: 1.9, dur: 4.2 },
  { x: 24, y: 86, size: 1.7, delay: 2.8, dur: 4.0 },
  { x: 72, y: 88, size: 1.8, delay: 1.1, dur: 4.4 },
];

export default function VegasFeltOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <style>{`
        @keyframes vegas-halo-pulse {
          0%, 100% { opacity: 0.9;  transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.04); }
        }
        @keyframes vegas-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          45%      { opacity: 0.85; transform: scale(1.15); }
          60%      { opacity: 0.55; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* 1. Fine velvet grain over the whole felt */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, rgba(246, 228, 169, 0.015) 0 1px, transparent 1px 3px)",
            "repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 0 1px, transparent 1px 3px)",
          ].join(", "),
          mixBlendMode: "overlay",
        }}
      />

      {/*
        2. STRONG shoe spotlight — a tight, hot gold cone of light
        anchored exactly where the dealer shoe sits. The shoe becomes
        the brightest region of the felt instead of a dark object on
        dark felt.
      */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-120px",
          right: "-80px",
          width: "520px",
          height: "520px",
          background:
            "radial-gradient(circle at center, rgba(246, 228, 169, 0.38) 0%, rgba(229, 199, 121, 0.22) 25%, rgba(229, 199, 121, 0.1) 50%, transparent 75%)",
          filter: "blur(28px)",
          animation: "vegas-halo-pulse 6s ease-in-out infinite",
        }}
      />
      {/* Hard-edge gold rim right behind the shoe for a crisp silhouette */}
      <div
        className="absolute rounded-full"
        style={{
          top: "-40px",
          right: "0px",
          width: "320px",
          height: "320px",
          background:
            "radial-gradient(circle at center, rgba(255, 240, 190, 0.22) 0%, rgba(229, 199, 121, 0.12) 40%, transparent 75%)",
          filter: "blur(12px)",
        }}
      />

      {/*
        3. ANCHORED MOTIFS — placed at specific spots instead of tiled.
      */}

      {/* 3a. Top-left Chrome Hearts cross (dealer half, flanking shoe) */}
      <HeartsCross
        className="absolute"
        style={{
          top: "16%",
          left: "8%",
          width: "88px",
          height: "88px",
          opacity: 0.12,
          transform: "rotate(-8deg)",
        }}
      />

      {/* 3b. Mid-left ornate baroque medallion flanking the betting area */}
      <BaroqueMedallion
        className="absolute"
        style={{
          top: "58%",
          left: "4%",
          width: "150px",
          height: "150px",
          opacity: 0.11,
          transform: "translateY(-50%) rotate(-6deg)",
        }}
      />

      {/* 3c. Mid-right ornate baroque medallion flanking the betting area */}
      <BaroqueMedallion
        className="absolute"
        style={{
          top: "58%",
          right: "4%",
          width: "150px",
          height: "150px",
          opacity: 0.11,
          transform: "translateY(-50%) scaleX(-1) rotate(-6deg)",
        }}
      />

      {/* 3d. Bottom-center ROYAL ACE blackletter engraving (house mark) */}
      <div
        className="absolute whitespace-nowrap uppercase"
        style={{
          left: "50%",
          bottom: "6%",
          transform: "translateX(-50%)",
          fontFamily:
            "'Cloister Black', var(--font-blackletter), 'UnifrakturMaguntia', 'Luminari', serif",
          fontSize: "clamp(32px, 5vw, 64px)",
          lineHeight: 1,
          color: "rgba(229, 199, 121, 0.14)",
          textShadow:
            "0 0 10px rgba(229, 199, 121, 0.18), 0 1px 0 rgba(0, 0, 0, 0.5)",
          letterSpacing: "0.01em",
        }}
      >
        Royal Ace
      </div>

      {/* 3e. A single horizontal gold flourish on the mid-line */}
      <svg
        className="absolute left-1/2 top-1/2 h-[14px] w-[min(72%,560px)] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 560 14"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.14 }}
      >
        <g stroke="rgba(229, 199, 121, 1)" fill="none" strokeLinecap="round">
          {/* Center diamond */}
          <path d="M 275 2 L 280 7 L 275 12 L 270 7 Z" strokeWidth="0.9" />
          {/* Right scrolls */}
          <path d="M 285 7 Q 320 7 350 4" strokeWidth="0.7" />
          <path d="M 285 7 Q 320 7 350 10" strokeWidth="0.7" />
          <path d="M 360 4 Q 400 4 440 7" strokeWidth="0.5" />
          <path d="M 360 10 Q 400 10 440 7" strokeWidth="0.5" />
          <circle cx="450" cy="7" r="1.6" fill="rgba(246, 228, 169, 0.9)" stroke="none" />
          <path d="M 460 7 L 540 7" strokeWidth="0.4" />
          {/* Left scrolls (mirror) */}
          <path d="M 265 7 Q 230 7 200 4" strokeWidth="0.7" />
          <path d="M 265 7 Q 230 7 200 10" strokeWidth="0.7" />
          <path d="M 190 4 Q 150 4 110 7" strokeWidth="0.5" />
          <path d="M 190 10 Q 150 10 110 7" strokeWidth="0.5" />
          <circle cx="100" cy="7" r="1.6" fill="rgba(246, 228, 169, 0.9)" stroke="none" />
          <path d="M 90 7 L 10 7" strokeWidth="0.4" />
        </g>
      </svg>

      {/* 4. Concentric gold arcs radiating from the betting area */}
      <div
        className="absolute left-1/2 top-full h-[900px] w-[900px] -translate-x-1/2 -translate-y-[60%] rounded-full"
        style={{ border: "1px solid rgba(229, 199, 121, 0.11)" }}
      />
      <div
        className="absolute left-1/2 top-full h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-[55%] rounded-full"
        style={{ border: "1px solid rgba(229, 199, 121, 0.07)" }}
      />
      <div
        className="absolute left-1/2 top-full h-[1550px] w-[1550px] -translate-x-1/2 -translate-y-[52%] rounded-full"
        style={{ border: "1px solid rgba(229, 199, 121, 0.045)" }}
      />

      {/* 5. Edge vignette so motifs settle into the frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.55) 100%)",
        }}
      />

      {/* 6. Champagne sparkles — a few, on the perimeter */}
      {SPARKLE_POINTS.map((p, i) => (
        <span
          key={i}
          className="vegas-anim absolute block rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "#fff2b8",
            boxShadow: `0 0 ${p.size * 2}px rgba(246, 228, 169, 0.9), 0 0 ${p.size}px rgba(255, 255, 255, 0.75)`,
            animation: `vegas-sparkle ${p.dur}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Reusable motif components ---------- */

type MotifProps = {
  className?: string;
  style?: React.CSSProperties;
};

/** Chrome Hearts cross — gold filigree, filled silhouette. */
function HeartsCross({ className, style }: MotifProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <g fill="rgba(246, 228, 169, 0.95)" stroke="rgba(229, 199, 121, 1)" strokeWidth="0.4" strokeLinejoin="round">
        {/* Vertical arm */}
        <path d="M 45 8 L 55 8 L 55 42 L 55 58 L 55 92 L 45 92 L 45 58 L 45 42 Z" />
        {/* Horizontal arm */}
        <path d="M 8 45 L 42 45 L 58 45 L 92 45 L 92 55 L 58 55 L 42 55 L 8 55 Z" />
        {/* Center orb */}
        <circle cx="50" cy="50" r="4.5" />
        {/* Four fleur-tips */}
        <circle cx="50" cy="4" r="2.5" />
        <circle cx="50" cy="96" r="2.5" />
        <circle cx="4"  cy="50" r="2.5" />
        <circle cx="96" cy="50" r="2.5" />
        {/* Mini-flares at arm bases */}
        <circle cx="45" cy="12" r="1.3" />
        <circle cx="55" cy="12" r="1.3" />
        <circle cx="45" cy="88" r="1.3" />
        <circle cx="55" cy="88" r="1.3" />
        <circle cx="12" cy="45" r="1.3" />
        <circle cx="12" cy="55" r="1.3" />
        <circle cx="88" cy="45" r="1.3" />
        <circle cx="88" cy="55" r="1.3" />
      </g>
    </svg>
  );
}

/** Ornate baroque medallion — crown of scrolls around a star of suits. */
function BaroqueMedallion({ className, style }: MotifProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <g stroke="rgba(229, 199, 121, 1)" fill="none" strokeLinecap="round">
        {/* Outer ring */}
        <circle cx="50" cy="50" r="46" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="42" strokeWidth="0.35" />
        {/* Inner ring */}
        <circle cx="50" cy="50" r="28" strokeWidth="0.5" />
        {/* 8 radial scrolls spraying out between the rings */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          const x1 = 50 + Math.cos(angle) * 28;
          const y1 = 50 + Math.sin(angle) * 28;
          const x2 = 50 + Math.cos(angle) * 42;
          const y2 = 50 + Math.sin(angle) * 42;
          const cx = 50 + Math.cos(angle + 0.25) * 36;
          const cy = 50 + Math.sin(angle + 0.25) * 36;
          return (
            <path
              key={i}
              d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
              strokeWidth="0.5"
            />
          );
        })}
        {/* Center fleur */}
        <path d="M 50 36 Q 44 42 46 50 Q 50 46 50 44" strokeWidth="0.5" />
        <path d="M 50 36 Q 56 42 54 50 Q 50 46 50 44" strokeWidth="0.5" />
        <path d="M 50 44 L 50 64" strokeWidth="0.5" />
        <path d="M 44 56 L 56 56" strokeWidth="0.5" />
      </g>
      {/* Central dot jewel */}
      <circle cx="50" cy="50" r="1.8" fill="rgba(246, 228, 169, 0.95)" />
      {/* Four cardinal pips just outside the outer ring */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * 90 * Math.PI) / 180;
        const x = 50 + Math.cos(a) * 48;
        const y = 50 + Math.sin(a) * 48;
        return (
          <circle
            key={i}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r="1.6"
            fill="rgba(229, 199, 121, 0.9)"
          />
        );
      })}
    </svg>
  );
}
