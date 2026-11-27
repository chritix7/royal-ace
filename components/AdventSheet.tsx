"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { advent, adventReward, adventStatus, useAdvent } from "../lib/advent";
import { useLang } from "../lib/i18n";
import { useLocked } from "../lib/wallet";

const fmt = (n: number) => n.toLocaleString("en-US");
// Doors are scattered, like a real calendar.
const ORDER = [7, 19, 2, 14, 23, 10, 5, 16, 24, 1, 12, 20, 9, 3, 18, 11, 22, 6, 15, 8, 21, 13, 4, 17];

/** The advent calendar: 24 doors, one a day in December. */
export default function AdventSheet({ onClose }: { onClose: () => void }) {
  useAdvent();
  const locked = useLocked();
  const fr = useLang() === "fr";
  const st = adventStatus();
  const [just, setJust] = useState<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  const open = (n: number) => {
    if (advent.open(n)) setJust(n);
  };
  const r = just ? adventReward(just) : null;
  return createPortal(
    <div className="safe-y fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={fr ? "Calendrier de l'Avent" : "Advent calendar"} translate="no">
      <button type="button" aria-label="Close" onClick={onClose} className="backdrop-in absolute inset-0 cursor-default bg-black/70" />
      <div className="lb-detail adv relative flex max-h-[min(94dvh,46rem)] w-full max-w-xl flex-col overflow-hidden">
        <div className="adv__snow" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b45b]/80">{fr ? "Édition hiver 2026" : "Winter edition 2026"}</p>
            <h2 className="font-display gold-text mt-0.5 text-2xl font-bold tracking-[0.12em]">{fr ? "CALENDRIER DE L'AVENT" : "ADVENT CALENDAR"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rl-icon-key">
            ✕
          </button>
        </div>
        <p className="relative px-5 pt-1 text-[11.5px] leading-snug text-white/60">
          {st.live
            ? fr
              ? "Une porte par jour jusqu'au 24. Une porte oubliée s'ouvre encore jusqu'au 31 décembre. Jour 12 : titre exclusif · jour 24 : carte VIP Frost gold."
              : "One door a day until the 24th. A missed door still opens until 31 December. Day 12: exclusive title · day 24: Frost gold VIP card."
            : fr
              ? `Ouverture le 1er décembre (dans ${st.opensIn} jour${st.opensIn > 1 ? "s" : ""}). Jour 12 : titre exclusif · jour 24 : carte VIP Frost gold.`
              : `Opens on 1 December (in ${st.opensIn} day${st.opensIn > 1 ? "s" : ""}). Day 12: exclusive title · day 24: Frost gold VIP card.`}
        </p>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
          <div className="adv__grid">
            {ORDER.map((n) => {
              const done = st.opened.includes(n);
              const ready = st.ready.includes(n);
              const isToday = st.today === n;
              const big = n === 24 || n === 12 || n === 6 || n === 18;
              const rw = adventReward(n);
              return (
                <button
                  key={n}
                  type="button"
                  disabled={!ready || locked}
                  onClick={() => open(n)}
                  className={`adv__door ${done ? "is-open" : ready ? "is-ready" : "is-locked"} ${isToday ? "is-today" : ""} ${big ? "is-big" : ""} ${just === n ? "is-just" : ""}`}
                  aria-label={done ? `${n} · ◈ ${fmt(rw.chips)}` : `${fr ? "Porte" : "Door"} ${n}`}
                >
                  {done ? (
                    <span className="adv__prize">
                      {rw.item ? <span className="adv__gift">★</span> : <span className="adv__gift">◈</span>}
                      <span className="adv__amt">{fmt(rw.chips)}</span>
                    </span>
                  ) : (
                    <span className="adv__num">{n}</span>
                  )}
                </button>
              );
            })}
          </div>
          {r && just && (
            <p className="adv__msg" role="status">
              {fr ? `Porte ${just} : ◈ ${fmt(r.chips)}` : `Door ${just}: ◈ ${fmt(r.chips)}`}
              {r.label && <> + {fr ? (r.item === "card:frost" ? "carte VIP Frost gold" : "titre Winter Star") : r.label}</>} ✓
            </p>
          )}
          {locked && <p className="mt-2 text-center text-[11px] text-white/45">{fr ? "Termine la manche en cours pour ouvrir une porte." : "Finish the round in progress to open a door."}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
