"use client";

import { useId } from "react";

/**
 * Reshuffle animation.
 *
 * A continuous stream of card-back shapes flies in from random angles,
 * meets briefly in the center (the stack being cut), then flies out the
 * opposite side. 12 cards staggered by ~140ms = a steady river of
 * motion that reads as "the shoe is being reshuffled" rather than just
 * a text label. Loops while mounted; parent controls visibility.
 *
 * Overlay style (fills parent, dims the table). Call with `relative`
 * parent for scoped overlay, or inside an `absolute inset-0` wrapper
 * from the caller.
 */
export default function ShuffleAnimation({
  message = "Shuffling the shoe…",
}: {
  message?: string;
}) {
  const uid = useId();
  const cards = 14;

  return (
    <div
      role="status"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm"
    >
      <style>{`
        @keyframes rshoe-${uid.replace(/:/g, "")} {
          0%   { opacity: 0; transform: translate(var(--rx, 0), var(--ry, 0)) rotate(var(--rr, 0deg)) scale(0.6); }
          25%  { opacity: 1; transform: translate(calc(var(--rx, 0) * 0.4), calc(var(--ry, 0) * 0.4)) rotate(calc(var(--rr, 0deg) * 0.4)) scale(0.95); }
          55%  { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          85%  { opacity: 1; transform: translate(calc(var(--rx, 0) * -0.6), calc(var(--ry, 0) * -0.6)) rotate(calc(var(--rr, 0deg) * -0.5)) scale(0.9); }
          100% { opacity: 0; transform: translate(calc(var(--rx, 0) * -0.9), calc(var(--ry, 0) * -0.9)) rotate(calc(var(--rr, 0deg) * -0.6)) scale(0.55); }
        }
      `}</style>

      {/* Card stream */}
      <div className="relative flex h-32 w-40 items-center justify-center">
        {/* Soft gold glow behind the shuffle */}
        <div
          aria-hidden
          className="absolute h-24 w-24 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(229,199,121,0.3) 0%, rgba(229,199,121,0) 70%)",
            filter: "blur(6px)",
          }}
        />

        {Array.from({ length: cards }).map((_, i) => {
          const angle = (i / cards) * Math.PI * 2;
          const radius = 90 + ((i * 13) % 30);
          const rx = Math.cos(angle) * radius;
          const ry = Math.sin(angle) * radius * 0.6;
          const rotation = ((i * 47) % 180) - 90;
          const delay = i * 140;
          const duration = 1600;
          return (
            <div
              key={i}
              className="absolute h-16 w-11 rounded-md border border-[#c9ac65]/60 shadow-[0_6px_12px_rgba(0,0,0,0.55)]"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #142d27 0 3px, #1b4034 3px 6px)",
                animation: `rshoe-${uid.replace(/:/g, "")} ${duration}ms ease-in-out ${delay}ms infinite`,
                ["--rx" as string]: `${rx}px`,
                ["--ry" as string]: `${ry}px`,
                ["--rr" as string]: `${rotation}deg`,
                willChange: "transform, opacity",
              }}
            >
              {/* inner gold frame */}
              <div className="absolute inset-[3px] rounded-[3px] border border-[#e4c879]/35" />
              {/* small spade medallion */}
              <div className="absolute inset-0 grid place-items-center text-sm text-[#e4c879]/70">
                ♠
              </div>
            </div>
          );
        })}
      </div>

      {/* Label with suits */}
      <div className="flex flex-col items-center gap-2">
        <div
          aria-hidden
          className="flex gap-3 text-xl text-[#e5c779]/80"
        >
          {["♠", "♥", "♦", "♣"].map((g, i) => (
            <span
              key={g}
              className="animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {g}
            </span>
          ))}
        </div>
        <p
          className="text-sm font-black uppercase tracking-[0.22em] text-[#e5c779]"
          style={{
            textShadow:
              "0 0 6px rgba(229,199,121,0.4), 0 1px 0 rgba(0,0,0,0.9)",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
