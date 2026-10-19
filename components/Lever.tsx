"use client";

import { useEffect, useRef, useState } from "react";

/** Levier : il s'abaisse à chaque tour et permet de lancer un spin. */
export default function Lever({
  spinId,
  onPull,
  disabled,
}: {
  spinId: number;
  onPull: () => void;
  disabled: boolean;
}) {
  const [down, setDown] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    if (spinId === 0) return;

    setDown(true);

    const id = window.setTimeout(() => setDown(false), 420);

    return () => window.clearTimeout(id);
  }, [spinId]);

  return (
    <button
      type="button"
      onClick={onPull}
      disabled={disabled}
      aria-label="Pull the lever to spin"
      className="relative hidden h-44 w-12 shrink-0 self-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:cursor-not-allowed disabled:opacity-60 lg:block"
    >
      {/* Socle fixé au cabinet */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 h-7 w-12 -translate-x-1/2 rounded-md border border-white/15"
        style={{
          background:
            "linear-gradient(180deg, #454650 0%, #25262e 35%, #13141b 100%)",
          boxShadow:
            "0 4px 8px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -2px 0 rgba(0,0,0,0.50)",
        }}
      />

      {/* Vis du socle */}
      {["left-1", "right-1"].map((position) => (
        <span
          key={position}
          aria-hidden="true"
          className={`absolute bottom-2 ${position} flex h-1.5 w-1.5 items-center justify-center rounded-full`}
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #a1a1aa, #52525b 60%, #27272a)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.60)",
          }}
        >
          <span className="h-px w-1 -rotate-45 bg-black/70" />
        </span>
      ))}

      {/* Tige chromée */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 left-1/2 w-2.5 -translate-x-1/2 rounded-full transition-[height] duration-300 ease-in-out motion-reduce:transition-none"
        style={{
          height: down ? 20 : 98,
          background:
            "linear-gradient(90deg, #353943 0%, #a8adb7 22%, #f4f5f7 38%, #b4bac4 52%, #626976 75%, #292d36 100%)",
          boxShadow:
            "2px 0 4px rgba(0,0,0,0.35), inset 1px 0 0 rgba(255,255,255,0.35)",
        }}
      />

      {/* Pivot devant la base de la tige */}
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-black/60"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #a8adb7 0%, #656b76 35%, #30343e 65%, #171920 100%)",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.50), inset 0 1px 1px rgba(255,255,255,0.25)",
        }}
      />

      {/* Poignée rouge */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-red-950/70 transition-[bottom] duration-300 ease-in-out motion-reduce:transition-none"
        style={{
          bottom: down ? 26 : 104,
          background:
            "radial-gradient(circle at 32% 25%, #ffd1d1 0%, #f87171 15%, #dc2626 42%, #991b1b 70%, #450a0a 100%)",
          boxShadow:
            "0 5px 9px rgba(0,0,0,0.50), inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -3px 5px rgba(0,0,0,0.35)",
        }}
      >
        <span className="absolute left-2 top-1.5 h-2 w-3 -rotate-45 rounded-full bg-white/25 blur-[1px]" />
      </span>
    </button>
  );
}