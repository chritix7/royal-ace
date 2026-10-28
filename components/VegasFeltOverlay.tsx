"use client";

/**
 * Vegas felt — classic French-casino BJ layout: dense muted-grey
 * damask-acanthus pattern on near-black ground, with the house rules
 * printed in a central arc flanked by two uppercase lines.
 *
 * Reference layout:
 *   • BLACKJACK wordmark big and centered on the dealer half.
 *   • "Blackjack pays 3 to 2" under the wordmark.
 *   • Arc curving down with "Dealer stands on soft 17 · Insurance 2 to 1".
 *   • Dense damask pattern across the entire felt (grey on near-black
 *     so the shoe + bet circles still read on top).
 *   • A soft gold spotlight under the dealer shoe keeps it visible.
 */

export default function VegasFeltOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <style>{`
        @keyframes vegas-spot-pulse {
          0%, 100% { opacity: 0.9;  transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.03); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vegas-anim { animation: none !important; opacity: 0.9 !important; transform: none !important; }
        }
      `}</style>

      {/* ====== 1. Dense damask-acanthus pattern across the whole felt ====== */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.5 }}
      >
        <defs>
          <pattern
            id="vegas-damask"
            x="0"
            y="0"
            width="160"
            height="200"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(0.9)"
          >
            {/*
              A single ornate acanthus-scroll tile. Drawn in muted grey so
              the pattern reads as fabric texture, not foreground graphics.
              Mirrored and offset to look organic rather than griddy.
            */}
            <g
              stroke="rgba(100, 100, 108, 0.55)"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
            >
              {/* Central vertical acanthus leaf */}
              <path d="M 80 20 Q 70 50 80 80 Q 90 50 80 20 Z" />
              {/* Upper buds */}
              <path d="M 80 20 Q 72 10 68 2" />
              <path d="M 80 20 Q 88 10 92 2" />
              {/* Side scrolls — big curling tendrils left and right */}
              <path d="M 80 50 Q 55 40 40 55 Q 30 70 42 82 Q 50 70 55 60" />
              <path d="M 80 50 Q 105 40 120 55 Q 130 70 118 82 Q 110 70 105 60" />
              {/* Lower acanthus flourish */}
              <path d="M 80 80 Q 65 100 50 110 Q 45 120 55 128 Q 65 118 68 108" />
              <path d="M 80 80 Q 95 100 110 110 Q 115 120 105 128 Q 95 118 92 108" />
              {/* Lower center stem */}
              <path d="M 80 80 Q 76 110 80 140" />
              {/* Lower bud leaves */}
              <path d="M 80 140 Q 68 150 60 165 Q 55 175 62 182" />
              <path d="M 80 140 Q 92 150 100 165 Q 105 175 98 182" />
              {/* Center dot cluster — small jewels in the fabric */}
              <circle cx="80" cy="50" r="1.2" fill="rgba(130, 130, 138, 0.7)" />
              <circle cx="42" cy="82" r="0.9" fill="rgba(130, 130, 138, 0.55)" />
              <circle cx="118" cy="82" r="0.9" fill="rgba(130, 130, 138, 0.55)" />
              <circle cx="55" cy="128" r="0.9" fill="rgba(130, 130, 138, 0.55)" />
              <circle cx="105" cy="128" r="0.9" fill="rgba(130, 130, 138, 0.55)" />
            </g>
            {/* Mirrored half-offset copy for the interlocking damask feel */}
            <g
              stroke="rgba(100, 100, 108, 0.4)"
              strokeWidth="0.7"
              strokeLinecap="round"
              fill="none"
              transform="translate(80, 100) scale(0.7)"
            >
              <path d="M 0 -40 Q -10 -20 0 0 Q 10 -20 0 -40 Z" />
              <path d="M 0 0 Q -20 10 -30 30" />
              <path d="M 0 0 Q 20 10 30 30" />
              <path d="M 0 0 Q -5 25 0 50" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vegas-damask)" />
      </svg>

      {/* ====== 2. Soft dark vignette so the pattern falls off at the edges ====== */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, transparent 30%, rgba(0, 0, 0, 0.55) 85%)",
        }}
      />

      {/* ====== 3. Soft gold spotlight under the dealer shoe (top-right) ====== */}
      <div
        className="vegas-anim absolute rounded-full"
        style={{
          top: "-160px",
          right: "-100px",
          width: "580px",
          height: "580px",
          background:
            "radial-gradient(circle at center, rgba(246, 228, 169, 0.3) 0%, rgba(229, 199, 121, 0.14) 32%, transparent 70%)",
          filter: "blur(32px)",
          animation: "vegas-spot-pulse 6s ease-in-out infinite",
        }}
      />

      {/*
        ====== 4. Central house-rules arc + wordmark ======

        BLACKJACK (big, centered at top of dealer half)
        PAYS 3 TO 2 (sub-line immediately under)
        -------- arc -------- (dealer stands on soft 17)
        INSURANCE PAYS 2 TO 1
      */}
      {/*
        Rules text block — opacity kept intentionally low (~0.5) so it reads
        as PRINTED into the felt, not as live UI competing with the dealer
        cards + 'Place your bet to start' message that sit above it.
      */}
      <div
        className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-[8px] whitespace-nowrap"
        style={{
          top: "14%",
          textShadow:
            "0 1px 2px rgba(0, 0, 0, 0.85), 0 0 8px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            fontFamily:
              "'Playfair Display', 'Didot', 'Bodoni 72', Georgia, serif",
            fontSize: "clamp(30px, 4.4vw, 52px)",
            fontWeight: 700,
            letterSpacing: "0.18em",
            lineHeight: 1,
            color: "rgba(240, 240, 245, 0.55)",
          }}
        >
          BLACKJACK
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', 'Didot', Georgia, serif",
            fontSize: "clamp(13px, 1.5vw, 17px)",
            fontStyle: "italic",
            letterSpacing: "0.08em",
            color: "rgba(240, 240, 245, 0.45)",
          }}
        >
          pays 3 to 2
        </div>
      </div>

      {/* Curved rule banner (SVG) — arc that reads along its curve */}
      <svg
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: "26%", width: "min(560px, 70%)", height: "90px" }}
        viewBox="0 0 560 90"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <path
            id="vegas-rule-arc"
            d="M 40 20 Q 280 72 520 20"
            fill="none"
          />
        </defs>
        <path
          d="M 40 20 Q 280 72 520 20"
          fill="none"
          stroke="rgba(229, 199, 121, 0.28)"
          strokeWidth="0.6"
        />
        <path
          d="M 40 28 Q 280 80 520 28"
          fill="none"
          stroke="rgba(229, 199, 121, 0.12)"
          strokeWidth="0.4"
        />
        <text
          style={{
            fontFamily:
              "'Playfair Display', 'Didot', 'Bodoni 72', Georgia, serif",
            fontSize: "15px",
            fontStyle: "italic",
            fill: "rgba(240, 240, 245, 0.5)",
            letterSpacing: "0.08em",
          }}
        >
          <textPath href="#vegas-rule-arc" startOffset="50%" textAnchor="middle">
            Dealer stands on soft 17
          </textPath>
        </text>
      </svg>

      {/* Insurance line centered under the arc */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap uppercase"
        style={{
          top: "38%",
          fontFamily:
            "'Playfair Display', 'Didot', 'Bodoni 72', Georgia, serif",
          fontSize: "clamp(10px, 1.1vw, 13px)",
          letterSpacing: "0.32em",
          color: "rgba(240, 240, 245, 0.45)",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.85)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span style={{ color: "rgba(229, 199, 121, 0.55)" }}>2 to 1</span>
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "1px",
            background: "rgba(229, 199, 121, 0.4)",
          }}
        />
        <span>Insurance</span>
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "1px",
            background: "rgba(229, 199, 121, 0.4)",
          }}
        />
        <span style={{ color: "rgba(229, 199, 121, 0.55)" }}>2 to 1</span>
      </div>
    </div>
  );
}
