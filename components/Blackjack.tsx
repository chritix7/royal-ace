"use client";

import { useEffect, useState } from "react";
import { useBlackjack } from "../lib/useBlackjack";
import Sidebar from "./Sidebar";
import Table from "./Table";
import BlackjackImmersive from "./BlackjackImmersive";

export default function Blackjack({
  active = true,
}: {
  active?: boolean;
}) {
  const g = useBlackjack(active);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    if (!active) setImmersive(false);
  }, [active]);

  return (
    <>
      {immersive && active ? (
        <BlackjackImmersive
          g={g}
          onClose={() => setImmersive(false)}
        />
      ) : (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setImmersive(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d7b45b]/40 bg-[#101713] px-4 py-2 text-xs font-bold text-[#e5c779] outline-none transition hover:border-[#e5c779] hover:bg-[#1a241b] focus-visible:ring-2 focus-visible:ring-[#e5c779]"
            >
              <span aria-hidden="true">⛶</span>
              Immersive mode
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
            <Table g={g} />
            <Sidebar g={g} />
          </div>
        </div>
      )}
    </>
  );
}