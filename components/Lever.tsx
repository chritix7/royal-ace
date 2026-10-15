"use client";

import { useEffect, useRef, useState } from "react";

/** Levier de la machine : il s'abaisse à chaque tour, et on peut le tirer pour lancer un spin. */
export default function Lever({ spinId, onPull, disabled }: { spinId: number; onPull: () => void; disabled: boolean }) {
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
      onClick={onPull}
      disabled={disabled}
      aria-label="Pull the lever to spin"
      className="relative hidden h-44 w-12 shrink-0 self-center outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 lg:block"
    >
      <span className="absolute bottom-0 left-1/2 h-5 w-12 -translate-x-1/2 rounded-md border border-zinc-300/60 bg-gradient-to-b from-zinc-300 to-zinc-600 shadow" />
      <span
        className="absolute bottom-4 left-1/2 w-2.5 -translate-x-1/2 rounded bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600 transition-all duration-300"
        style={{ height: down ? 20 : 98 }}
      />
      <span
        className="absolute left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-red-950/60 bg-[radial-gradient(circle_at_35%_30%,#fecaca,#ef4444_45%,#7f1d1d)] shadow-[0_4px_10px_#0008] transition-all duration-300"
        style={{ bottom: down ? 26 : 104 }}
      />
    </button>
  );
}