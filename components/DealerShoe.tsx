"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Royal Ace × House Edition — "Sanctum" dealer shoe.
 *
 * Volumetric matte-black body (top / front / right / left faces, directionally
 * lit) sitting at the current rotateX(56°) rotateZ(-28°) perspective. Big
 * gold spade crowns the top, framed by HUD-style futuristic ornaments:
 * a soft golden aura, two counter-rotating orbital rings with light dots,
 * reticle corner brackets, and a vertical scan line. One suit at each of
 * the four corners (♠ ♥ ♦ ♣ clockwise). A gold medallion with an engraved
 * spade sits bottom-right, a Cloister Black / Share Tech Mono status LCD
 * sits bottom-left. Card dispenser ramp on top with the live dispense &
 * refill animations driven by `dealTick`.
 *
 * The outer footprint (300 × 230) and the `id` / `data-shoe-outlet` hooks
 * stay the same as before, so BlackjackImmersive and the card flight
 * animation keep working with no changes.
 */

type ShoeStatus = {
  label: string;
  tone: "gold" | "green" | "red" | "orange" | "white";
};

type DealerShoeProps = {
  className?: string;
  status?: ShoeStatus;
  dealTick?: number;
};

const CARD_BACK =
  "repeating-linear-gradient(45deg, #102d27 0 3px, #1b4034 3px 6px), linear-gradient(135deg, #245b49, #102b25)";

// Colors for the status LED (gold by default; semantic tones override it).
const LED_COLOR: Record<ShoeStatus["tone"], { base: string; pale: string }> = {
  gold:   { base: "#e5c779", pale: "#f6e4a9" },
  green:  { base: "#52c47a", pale: "#86efac" },
  red:    { base: "#f87171", pale: "#fecaca" },
  orange: { base: "#fb923c", pale: "#fdba74" },
  white:  { base: "#f8fafc", pale: "#ffffff" },
};

// Shared ramp card (the ones sticking out of the dispenser slit).
function RampCard({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute h-[58px] w-[42px] overflow-hidden rounded-[4px] border border-[#c9ac65]/60 shadow-[0_7px_13px_rgba(0,0,0,0.65)] ${className}`}
      style={{ background: CARD_BACK, ...style }}
    >
      <div className="absolute inset-[4px] rounded-[2px] border border-[#e4c879]/55" />
      <div className="absolute inset-0 grid place-items-center text-[15px] leading-none text-[#e4c879]/80">
        ♠
      </div>
      <div className="absolute inset-x-1 top-[3px] h-px bg-white/25" />
    </div>
  );
}

export default function DealerShoe({
  className = "",
  status = { label: "Ready", tone: "gold" },
  dealTick = 0,
}: DealerShoeProps) {
  const [cycle, setCycle] = useState<"idle" | "dispense" | "refill">("idle");
  const firstTick = useRef(true);
  const led = LED_COLOR[status.tone] ?? LED_COLOR.gold;
  const active = status.tone === "orange" || status.label.toLowerCase() === "dealing";

  useEffect(() => {
    if (firstTick.current) {
      firstTick.current = false;
      return;
    }
    setCycle("dispense");
    const refill = window.setTimeout(() => setCycle("refill"), 440);
    const idle = window.setTimeout(() => setCycle("idle"), 950);
    return () => {
      window.clearTimeout(refill);
      window.clearTimeout(idle);
    };
  }, [dealTick]);

  return (
    <div
      id="dealer-shoe"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "2000px", perspectiveOrigin: "50% 32%" }}
    >
      <style>{`
        /* Dispenser refill: top card eases back onto the stack */
        @keyframes shoe-stack-settle {
          0%   { transform: translateY(-8px); }
          65%  { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        /* Hero spade: subtle breath */
        @keyframes bj-hero-breath {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.035); }
        }
        /* Pulsing aura behind the hero spade */
        @keyframes bj-aura-pulse {
          0%, 100% { opacity: 0.55; transform: scale(0.92); }
          50%      { opacity: 1;    transform: scale(1.08); }
        }
        /* Orbital rings rotating around the hero spade */
        @keyframes bj-orbit-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Scan line sweeping vertically across the hero spade */
        @keyframes bj-suit-scan {
          0%   { transform: translateY(-24px); opacity: 0; }
          15%  { opacity: 1; }
          50%  { transform: translateY(24px);  opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(-24px); opacity: 0; }
        }
        /* LED pulse ring */
        @keyframes bj-led-pulse-ring {
          0%   { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0;   transform: scale(2.6); }
        }
        /* Thin gold line inside the deck window drifting */
        @keyframes bj-glint-drift {
          0%, 100% { opacity: 0.65; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          #dealer-shoe * { animation: none !important; }
        }
      `}</style>

      {/* Inline SVG defs: gradients and reusable suit symbols. */}
      <svg aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <defs>
          <linearGradient id="dsg-silver" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%"  stopColor="#f1f5f9" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="65%" stopColor="#7f8898" />
            <stop offset="100%" stopColor="#2a2f3a" />
          </linearGradient>
          <linearGradient id="dsg-engrave" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#5c440f" />
            <stop offset="100%" stopColor="#2a1e08" />
          </linearGradient>
          <linearGradient id="dsg-rich-gold" x1="0.25" y1="0" x2="0.75" y2="1">
            <stop offset="0%"   stopColor="#fff7d4" />
            <stop offset="12%"  stopColor="#f6e4a9" />
            <stop offset="35%"  stopColor="#e5c779" />
            <stop offset="58%"  stopColor="#c9a344" />
            <stop offset="80%"  stopColor="#8c6b23" />
            <stop offset="100%" stopColor="#2a1f08" />
          </linearGradient>
          <linearGradient id="dsg-gloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(255, 250, 220, 0.85)" />
            <stop offset="40%"  stopColor="rgba(255, 250, 220, 0.30)" />
            <stop offset="100%" stopColor="rgba(255, 250, 220, 0)" />
          </linearGradient>
          <radialGradient id="dsg-rim" cx="50%" cy="50%" r="52%">
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="95%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>

          {/* Shared spade silhouette, reused as clip and base for several variants */}
          <clipPath id="dsg-spade-clip">
            <path d="M 50 5 C 50 5 82 28 82 55 C 82 70 73 80 63 80 C 58 80 54 77 52 73 C 52 83 54 90 60 95 L 40 95 C 46 90 48 83 48 73 C 46 77 42 80 37 80 C 27 80 18 70 18 55 C 18 28 50 5 50 5 Z" />
          </clipPath>

          {/* Hero spade (gold, embossed, with gloss & specular) */}
          <symbol id="dsg-spade-hero" viewBox="0 0 100 100">
            <path d="M 50 5 C 50 5 82 28 82 55 C 82 70 73 80 63 80 C 58 80 54 77 52 73 C 52 83 54 90 60 95 L 40 95 C 46 90 48 83 48 73 C 46 77 42 80 37 80 C 27 80 18 70 18 55 C 18 28 50 5 50 5 Z"
                  fill="rgba(0,0,0,0.5)" transform="translate(1 2.5)" />
            <path d="M 50 5 C 50 5 82 28 82 55 C 82 70 73 80 63 80 C 58 80 54 77 52 73 C 52 83 54 90 60 95 L 40 95 C 46 90 48 83 48 73 C 46 77 42 80 37 80 C 27 80 18 70 18 55 C 18 28 50 5 50 5 Z"
                  fill="url(#dsg-rich-gold)" stroke="#2a1f08" strokeWidth="1.8" strokeLinejoin="round" />
            <rect x="0" y="0" width="100" height="100" fill="url(#dsg-rim)" clipPath="url(#dsg-spade-clip)" />
            <path d="M 50 7 C 50 7 76 24 80 44 C 70 38 60 36 50 36 C 40 36 30 38 20 44 C 24 24 50 7 50 7 Z"
                  fill="url(#dsg-gloss)" clipPath="url(#dsg-spade-clip)" />
            <path d="M 44 14 C 34 24 26 36 23 48 C 22 52 23 56 25 59"
                  fill="none" stroke="rgba(255, 250, 220, 0.85)" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="38" cy="22" rx="5" ry="3"
                     fill="rgba(255, 255, 240, 0.9)"
                     transform="rotate(-20 38 22)"
                     clipPath="url(#dsg-spade-clip)" />
            <ellipse cx="62" cy="42" rx="2" ry="1.2"
                     fill="rgba(255, 255, 240, 0.55)"
                     transform="rotate(30 62 42)"
                     clipPath="url(#dsg-spade-clip)" />
            <path d="M 50 8 L 50 68" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" fill="none" />
            <path d="M 44 73 Q 50 76 56 73" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" />
          </symbol>

          {/* Silver corner suits */}
          <symbol id="dsg-spade-silver" viewBox="0 0 100 100">
            <path d="M 50 5 C 50 5 82 28 82 55 C 82 70 73 80 63 80 C 58 80 54 77 52 73 C 52 83 54 90 60 95 L 40 95 C 46 90 48 83 48 73 C 46 77 42 80 37 80 C 27 80 18 70 18 55 C 18 28 50 5 50 5 Z"
                  fill="url(#dsg-silver)" stroke="#1a1d26" strokeWidth="2" strokeLinejoin="round" />
          </symbol>
          <symbol id="dsg-heart-silver" viewBox="0 0 100 100">
            <path d="M 50 28 C 50 15 62 8 74 10 C 86 12 93 24 91 38 C 87 58 68 75 50 92 C 32 75 13 58 9 38 C 7 24 14 12 26 10 C 38 8 50 15 50 28 Z"
                  fill="url(#dsg-silver)" stroke="#1a1d26" strokeWidth="2" strokeLinejoin="round" />
          </symbol>
          <symbol id="dsg-diamond-silver" viewBox="0 0 100 100">
            <path d="M 50 8 Q 60 32 90 50 Q 60 68 50 92 Q 40 68 10 50 Q 40 32 50 8 Z"
                  fill="url(#dsg-silver)" stroke="#1a1d26" strokeWidth="2" strokeLinejoin="round" />
          </symbol>
          <symbol id="dsg-club-silver" viewBox="0 0 100 100">
            <path d="M 50 8 C 61 8 70 17 70 28 C 70 33 69 37 66 41 C 71 36 78 34 85 37 C 94 41 97 52 92 60 C 87 68 77 70 69 66 C 73 73 78 86 83 95 L 17 95 C 22 86 27 73 31 66 C 23 70 13 68 8 60 C 3 52 6 41 15 37 C 22 34 29 36 34 41 C 31 37 30 33 30 28 C 30 17 39 8 50 8 Z"
                  fill="url(#dsg-silver)" stroke="#1a1d26" strokeWidth="2" strokeLinejoin="round" />
          </symbol>

          {/* Engraved spade on the gold medallion */}
          <symbol id="dsg-spade-engraved" viewBox="0 0 100 100">
            <path d="M 50 5 C 50 5 82 28 82 55 C 82 70 73 80 63 80 C 58 80 54 77 52 73 C 52 83 54 90 60 95 L 40 95 C 46 90 48 83 48 73 C 46 77 42 80 37 80 C 27 80 18 70 18 55 C 18 28 50 5 50 5 Z"
                  fill="url(#dsg-engrave)" stroke="rgba(0,0,0,0.5)" strokeWidth="1" strokeLinejoin="round" />
          </symbol>
        </defs>
      </svg>

      {/* ============================================================
          The shoe. Keep its 300×230 footprint and current perspective.
          ============================================================ */}
      <div
        className="relative h-[230px] w-[300px] [transform-style:preserve-3d]"
        style={{ transform: "rotateX(56deg) rotateZ(-28deg)" }}
      >
        {/* Floor shadow + warm glow */}
        <div
          className="absolute left-[2px] top-[90px] h-[160px] w-[290px] rounded-[70px] bg-black/75 blur-3xl"
          style={{ transform: "translateZ(-55px)" }}
        />
        <div
          className="absolute left-[30px] top-[118px] h-[110px] w-[240px] rounded-full bg-[#e5c779]/10 blur-2xl"
          style={{ transform: "translateZ(-35px)" }}
        />

        {/* ============== 3D body (260×160) ============== */}
        <div
          className="absolute left-[20px] top-[48px] h-[160px] w-[260px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/*
            3D walls that drop from the lit top face down to the base.
            The top face is lifted to Z=38 (further down). Each wall is a
            flat panel that we parked just OUTSIDE the body's bounding box
            (top:100%, left:100%, right:100%) and then stand up by rotating
            90° around the edge that touches the top face. The pivot stays
            at Z=0 and the opposite edge swings up to Z=38, forming a wall.
          */}

          {/*
            Four side walls dropping from the lit top face down to the base.
            Each is parked just outside the body on the side it belongs to,
            then stood up by a 90° rotation around the edge that touches the
            top face. All faces share the same matte-black material; the
            lighting difference comes from a one-direction gradient per face
            (brighter near the top where it meets the lit surface, blacker
            at the base) plus a slight ambient-occlusion shadow at the join.
            No visible borders on the joins so the body reads as one solid
            volume rather than four separate panels.
          */}

          {/* Front wall — brightest visible wall, rim highlight at the top
              where it meets the lit top face, darkens toward the base. */}
          <div
            className="absolute left-0 h-[38px] w-[260px]"
            style={{
              top: "100%",
              background:
                "linear-gradient(180deg, #1c1c1e 0%, #121214 35%, #080809 75%, #030304 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(246, 228, 169, 0.18), inset 0 -8px 14px -6px rgba(0,0,0,0.85)",
              transform: "rotateX(-90deg)",
              transformOrigin: "top center",
            }}
          />

          {/* Right wall — slightly dimmer, light grazes it */}
          <div
            className="absolute top-0 h-[160px] w-[38px]"
            style={{
              left: "100%",
              background:
                "linear-gradient(180deg, #16161a 0%, #0e0e10 40%, #060608 80%, #020203 100%)",
              boxShadow:
                "inset 1px 0 0 rgba(246, 228, 169, 0.12), inset -8px 0 14px -6px rgba(0,0,0,0.9)",
              transform: "rotateY(-90deg)",
              transformOrigin: "left center",
            }}
          />

          {/* Left wall (dim fill, mostly hidden by the rotateZ tilt) */}
          <div
            className="absolute top-0 h-[160px] w-[38px]"
            style={{
              right: "100%",
              background:
                "linear-gradient(180deg, #0a0a0c 0%, #050506 60%, #020203 100%)",
              transform: "rotateY(90deg)",
              transformOrigin: "right center",
            }}
          />

          {/* Back wall (dim fill, hidden by the rotateX tilt) */}
          <div
            className="absolute left-0 h-[38px] w-[260px]"
            style={{
              bottom: "100%",
              background:
                "linear-gradient(180deg, #060608 0%, #0a0a0c 100%)",
              transform: "rotateX(90deg)",
              transformOrigin: "bottom center",
            }}
          />

          {/* Top face (lit, carries the decoration) — sharp 4px chamfer
              so the four side walls meet it along a straight line and the
              body reads as one solid block instead of four taped panels. */}
          <div
            className="absolute inset-0 rounded-[4px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 25%, transparent 55%, rgba(0,0,0,0.3) 100%), linear-gradient(180deg, #1e1e20 0%, #121214 55%, #060608 100%)",
              boxShadow:
                "0 32px 55px rgba(0,0,0,0.9), inset 0 1px 0 rgba(240, 229, 199, 0.14), inset 0 -1px 0 rgba(0,0,0,0.6)",
              transform: "translateZ(38px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Brushed grain overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[4px]"
              style={{
                background:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.013) 0 1px, transparent 1px 3px)",
              }}
            />
            {/* Inner gold bezel */}
            <div
              className="pointer-events-none absolute inset-[6px] rounded-[2px]"
              style={{
                border: "1px solid rgba(229, 199, 121, 0.28)",
                boxShadow: "inset 0 1px 0 rgba(229, 199, 121, 0.1)",
              }}
            />
            {/* Top edge hairline */}
            <div
              className="absolute left-[12px] right-[12px] top-[3px] h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #e5c779 20%, #f6e4a9 50%, #e5c779 80%, transparent)",
                boxShadow: "0 0 4px rgba(229, 199, 121, 0.5)",
                transform: "translateZ(0.5px)",
              }}
            />

            {/* --- Hero spade crown with HUD effects --- */}
            <div
              className="absolute left-1/2 top-0 grid h-[84px] w-[84px] place-items-center"
              style={{ transform: "translateX(-50%) translateZ(6px)", transformStyle: "preserve-3d", pointerEvents: "none" }}
            >
              {/* Aura */}
              <div
                className="absolute inset-[6px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(246, 228, 169, 0.45) 0%, rgba(229, 199, 121, 0.20) 32%, transparent 62%)",
                  animation: "bj-aura-pulse 2.8s ease-in-out infinite",
                  filter: "blur(2px)",
                  zIndex: 1,
                }}
              />
              {/* Outer orbit (solid, slow, reverse) */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: "4px",
                  border: "1px solid rgba(229, 199, 121, 0.14)",
                  animation: "bj-orbit-rotate 22s linear infinite reverse",
                  zIndex: 2,
                }}
              >
                <div
                  className="absolute h-[2.5px] w-[2.5px] rounded-full"
                  style={{
                    top: "-1.25px",
                    left: "calc(50% - 1.25px)",
                    background: "#f6e4a9",
                    boxShadow: "0 0 5px #f6e4a9, 0 0 2px #f6e4a9",
                  }}
                />
                <div
                  className="absolute h-[2.5px] w-[2.5px] rounded-full"
                  style={{
                    bottom: "-1.25px",
                    left: "calc(50% - 1.25px)",
                    background: "#e5c779",
                    boxShadow: "0 0 4px #e5c779",
                  }}
                />
              </div>
              {/* Inner orbit (dashed) */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: "11px",
                  border: "1px dashed rgba(229, 199, 121, 0.35)",
                  animation: "bj-orbit-rotate 14s linear infinite",
                  zIndex: 2,
                }}
              >
                <div
                  className="absolute h-[2.5px] w-[2.5px] rounded-full"
                  style={{
                    top: "-1.25px",
                    left: "calc(50% - 1.25px)",
                    background: "#f6e4a9",
                    boxShadow: "0 0 5px #f6e4a9, 0 0 2px #f6e4a9",
                  }}
                />
              </div>
              {/* Scan line */}
              <div
                className="absolute left-[16px] right-[16px] top-1/2 h-px"
                style={{
                  background: "linear-gradient(90deg, transparent, #f6e4a9 50%, transparent)",
                  boxShadow: "0 0 4px #f6e4a9",
                  animation: "bj-suit-scan 4s ease-in-out infinite",
                  zIndex: 2,
                }}
              />
              {/* The spade itself */}
              <div
                className="relative h-[58px] w-[54px]"
                style={{
                  filter:
                    "drop-shadow(0 2px 2px rgba(0,0,0,0.85)) drop-shadow(0 5px 8px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(246, 228, 169, 0.25))",
                  animation: "bj-hero-breath 3.6s ease-in-out infinite",
                  zIndex: 3,
                }}
              >
                <svg className="block h-full w-full"><use href="#dsg-spade-hero" /></svg>
              </div>
            </div>

            {/* --- 4 corner suits (silver), clockwise ♠ ♥ ♦ ♣ --- */}
            {/* Top-left ♠ */}
            <div
              className="absolute left-[12px] top-[12px] h-[14px] w-[14px]"
              style={{ transform: "translateZ(3px)", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.9))" }}
            >
              <svg className="block h-full w-full"><use href="#dsg-spade-silver" /></svg>
            </div>
            {/* Top-right ♥ */}
            <div
              className="absolute right-[12px] top-[12px] h-[14px] w-[14px]"
              style={{ transform: "translateZ(3px)", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.9))" }}
            >
              <svg className="block h-full w-full"><use href="#dsg-heart-silver" /></svg>
            </div>
            {/* Bottom-right ♦ (lifted above the medallion so it stays visible) */}
            <div
              className="absolute bottom-[62px] right-[12px] h-[14px] w-[14px]"
              style={{ transform: "translateZ(3px)", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.9))" }}
            >
              <svg className="block h-full w-full"><use href="#dsg-diamond-silver" /></svg>
            </div>
            {/* Bottom-left ♣ (lifted above the LCD so it stays visible) */}
            <div
              className="absolute bottom-[62px] left-[12px] h-[14px] w-[14px]"
              style={{ transform: "translateZ(3px)", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.9))" }}
            >
              <svg className="block h-full w-full"><use href="#dsg-club-silver" /></svg>
            </div>

            {/* --- Smoked lucite window with internal deck --- */}
            <div
              className="absolute left-[42px] right-[42px] top-[78px] h-[66px] overflow-hidden rounded-[10px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10, 20, 15, 0.95) 0%, rgba(5, 10, 7, 0.98) 100%)",
                border: "1px solid rgba(229, 199, 121, 0.5)",
                boxShadow:
                  "inset 0 5px 12px rgba(0, 0, 0, 0.95), inset 0 -1px 0 rgba(229, 199, 121, 0.18), 0 1px 0 rgba(229, 199, 121, 0.2)",
                transform: "translateZ(4px)",
              }}
            >
              {/* Top ambient highlight */}
              <div
                className="absolute left-[10%] right-[10%] top-[4px] h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(229, 199, 121, 0.5), transparent)",
                }}
              />
              {/* Inner well with card stack */}
              <div
                className="absolute inset-x-[14px] inset-y-[8px] overflow-hidden rounded-[6px] border border-white/[0.06]"
                style={{ background: "linear-gradient(180deg, #1a2b22 0%, #0a140e 100%)" }}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute inset-x-[14px] h-[32px] rounded-[3px] border border-[#c9ac65]/40"
                    style={{
                      bottom: `${2 + i * 2}px`,
                      background: CARD_BACK,
                      opacity: 0.85,
                    }}
                  >
                    <div className="absolute inset-[4px] rounded-[2px] border border-[#e4c879]/35" />
                  </div>
                ))}
              </div>
              {/* Thin gold LED strip across the deck */}
              <div
                className="absolute left-[14%] right-[14%] top-1/2 h-px"
                style={{
                  background: "linear-gradient(90deg, transparent, #f6e4a9, transparent)",
                  boxShadow: "0 0 6px rgba(246, 228, 169, 0.65)",
                  animation: "bj-glint-drift 2.6s ease-in-out infinite",
                }}
              />
            </div>

            {/* --- Small gold studs flourish --- */}
            <div
              className="absolute bottom-[56px] left-[26px] flex h-[6px] w-[48px] items-center justify-between"
              style={{ transform: "translateZ(2px)" }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <i
                  key={i}
                  className="h-[3px] w-[3px] rounded-full"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, #f6e4a9, #8c6b23)",
                    boxShadow: "0 0 2px rgba(229, 199, 121, 0.5)",
                  }}
                />
              ))}
            </div>

            {/* --- Status LCD (bottom-left): ROYAL ACE + READY --- */}
            <div
              className="absolute bottom-[14px] left-[16px] flex h-[40px] w-[138px] flex-col justify-between rounded-[7px] px-[9px] py-[6px]"
              style={{
                background: "linear-gradient(180deg, #0a0a0b 0%, #040405 100%)",
                border: "1px solid rgba(229, 199, 121, 0.6)",
                boxShadow:
                  "inset 0 4px 10px rgba(0, 0, 0, 0.98), inset 0 -1px 0 rgba(229, 199, 121, 0.12), 0 0 10px rgba(229, 199, 121, 0.12)",
                transform: "translateZ(4px)",
              }}
            >
              {/* Top scan line */}
              <div
                className="absolute left-[4px] right-[4px] top-[2px] h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(229, 199, 121, 0.5), transparent)",
                }}
              />
              {/* ROYAL ACE in Cloister Black (blackletter fallback) */}
              <div
                className="whitespace-nowrap uppercase leading-none"
                style={{
                  fontFamily:
                    "'Cloister Black', var(--font-blackletter), 'UnifrakturMaguntia', 'Luminari', serif",
                  fontSize: "15px",
                  color: "#e5c779",
                  letterSpacing: "-0.005em",
                  textShadow:
                    "0 0 6px rgba(229, 199, 121, 0.55), 0 0 2px rgba(246, 228, 169, 0.85), 0 1px 0 rgba(0, 0, 0, 0.6)",
                }}
              >
                Royal Ace
              </div>
              {/* READY + LED */}
              <div className="flex items-center justify-between gap-1 leading-none">
                <span
                  className="truncate uppercase"
                  style={{
                    fontFamily:
                      "var(--font-tech-mono), 'Share Tech Mono', 'JetBrains Mono', 'SF Mono', Menlo, monospace",
                    fontSize: "8px",
                    color: "rgba(229, 199, 121, 0.55)",
                    letterSpacing: "0.3em",
                    textShadow: "0 0 3px rgba(229, 199, 121, 0.2)",
                  }}
                >
                  {status.label}
                </span>
                <span className="relative h-[6px] w-[6px] shrink-0 rounded-full"
                  style={{
                    background: led.base,
                    boxShadow: `0 0 8px ${led.pale}, 0 0 2px ${led.pale}`,
                  }}
                >
                  {active && (
                    <span
                      className="absolute inset-[-2px] rounded-full"
                      style={{
                        background: led.base,
                        animation: "bj-led-pulse-ring 1.6s ease-out infinite",
                      }}
                    />
                  )}
                </span>
              </div>
            </div>

            {/* --- Gold medallion with engraved spade --- */}
            <div
              className="absolute bottom-[12px] right-[14px] grid h-[40px] w-[40px] place-items-center rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 32% 25%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 242, 184, 0.6) 10%, transparent 25%), radial-gradient(circle at 40% 35%, #f6e4a9 0%, #e5c779 32%, #c9a344 60%, #8c6b23 85%, #4a3608 100%), radial-gradient(circle at 70% 75%, transparent 55%, rgba(0,0,0,0.4) 100%)",
                border: "1px solid rgba(255, 242, 184, 0.85)",
                boxShadow:
                  "0 8px 14px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(90, 60, 15, 0.5)",
                transform: "translateZ(5px)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-[3px] rounded-full"
                style={{
                  border: "1px solid rgba(90, 60, 15, 0.5)",
                  boxShadow: "inset 0 1px 1px rgba(255, 242, 184, 0.3)",
                }}
              />
              <div
                className="relative h-[21px] w-[20px]"
                style={{ filter: "drop-shadow(0 1px 0 rgba(255, 242, 184, 0.5))" }}
              >
                <svg className="block h-full w-full"><use href="#dsg-spade-engraved" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* ============== Dispenser ramp (unchanged footprint) ============== */}
        <div
          className="absolute left-[73px] top-[-64px] h-[100px] w-[154px]"
          style={{ transform: "translateZ(24px)" }}
        >
          {/* Ramp track */}
          <div
            className="absolute bottom-[10px] left-3 right-3 h-[52px] rounded-t-[13px]"
            style={{
              background:
                "linear-gradient(180deg, #050506 0%, #15151a 50%, #26262c 100%)",
              border: "1px solid rgba(229, 199, 121, 0.4)",
              boxShadow:
                "0 12px 21px rgba(0,0,0,0.72), inset 0 1px 2px rgba(229, 199, 121, 0.16)",
            }}
          />
          {/* Exit slit — the card flight animation starts here */}
          <div
            data-shoe-outlet=""
            className={`absolute bottom-[54px] left-1/2 h-[9px] w-[112px] -translate-x-1/2 rounded-full border border-black/80 bg-black ${
              cycle === "dispense" ? "ring-1 ring-[#e5c779]/70" : ""
            }`}
            style={{ boxShadow: "inset 0 3px 6px rgba(0,0,0,0.95)" }}
          />
          {/* Gold glint on the slit lip */}
          <div
            className="absolute bottom-[55px] left-1/2 h-[2px] w-[76px] -translate-x-1/2 rounded-full"
            style={{
              background: "#f6e4a9",
              boxShadow: "0 0 7px rgba(246, 228, 169, 0.55)",
            }}
          />
          {/* Three cards sticking out, top one animates during dispense */}
          {[0, 1, 2].map((i) => {
            const isTop = i === 2;
            return (
              <RampCard
                key={i}
                className={
                  isTop && cycle === "dispense"
                    ? "animate-shoe-top-dispense"
                    : ""
                }
                style={{
                  left: `${55 + (2 - i) * 2}px`,
                  bottom: `${14 + (2 - i) * 6}px`,
                  transform: `translateZ(${3 + i * 3}px)`,
                  animation:
                    cycle === "refill"
                      ? "shoe-stack-settle 420ms cubic-bezier(.2,.8,.25,1) both"
                      : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
