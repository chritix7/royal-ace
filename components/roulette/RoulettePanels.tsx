"use client";

import { useEffect, useState } from "react";
import CoinRain from "../CoinRain";
import { money } from "../../lib/game";
import { betName, colorOf, totalOf, type Bets } from "../../lib/roulette";
import { type RouletteGame, type RoundRecord } from "../../lib/useRoulette";

export const pill = (n: number) => `rl-pill rl-pill--${colorOf(n)} flex shrink-0 items-center justify-center rounded-md font-black tabular-nums`;
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}◈ ${money(Math.abs(v))}`;

/* ---------- Table themes ---------- */
export const THEMES = [
  { id: "carbon", name: "Carbon 911", note: "Matte black, carbon, gold", swatch: ["#0c0d0f", "#24262b", "#d7b45b"] },
  { id: "monaco", name: "Monaco", note: "Green baize, mahogany, brass", swatch: ["#1a0f0a", "#0f5c3a", "#d9b45e"] },
  { id: "velours", name: "Rouge velours", note: "Bordeaux velvet, black lacquer", swatch: ["#140608", "#5a0f1c", "#e3c27a"] },
  { id: "royal", name: "Royal Blue", note: "Royal blue, white, silver", swatch: ["#06102a", "#0f3a8c", "#e8eef8"] },
] as const;

/** Original emblem of the Royal Blue table: a crown over a diamond. */
export function RoyalEmblem({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="reSilver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#c9d4e6" />
          <stop offset="100%" stopColor="#8a9ab5" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#0f3a8c" stroke="url(#reSilver)" strokeWidth="3" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
      <path d="M18 27 L22 18 L27 24 L32 15 L37 24 L42 18 L46 27 Z" fill="url(#reSilver)" />
      <path d="M32 30 L41 40 L32 50 L23 40 Z" fill="url(#reSilver)" />
      <path d="M32 34 L37 40 L32 46 L27 40 Z" fill="#0f3a8c" />
    </svg>
  );
}

export function StylePanel({ g }: { g: RouletteGame }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => g.setTheme(t.id)}
            aria-pressed={g.theme === t.id}
            className={`rl-theme-card ${g.theme === t.id ? "is-on" : ""}`}
          >
            <span className="flex gap-1">
              {t.swatch.map((c) => (
                <span key={c} className="h-4 w-4 rounded-full border border-white/20" style={{ background: c }} />
              ))}
            </span>
            <span className="mt-1.5 block text-left">
              <span className="block font-display text-[12px] font-bold tracking-[0.12em] text-[#f1e3bb]">{t.name}</span>
              <span className="block text-[10px] text-white/45">{t.note}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Detailed history ---------- */
export function RoundHistory({ g }: { g: RouletteGame }) {
  const [open, setOpen] = useState<RoundRecord | null>(null);
  const list = [...g.rounds].reverse();
  if (list.length === 0) return <p className="py-6 text-center text-[11px] text-white/35">Your rounds will appear here.</p>;
  return (
    <>
      <ul className="max-h-full space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {list.map((r) => {
          const net = r.returned - r.staked;
          return (
            <li key={r.id}>
              <button type="button" onClick={() => setOpen(r)} className="rl-round-row">
                <span className={`${pill(r.n)} h-6 w-6 text-[10px]`}>{r.n}</span>
                <span className="min-w-0 flex-1 truncate text-left text-[11px] text-white/55">
                  {Object.keys(r.bets).length} bet{Object.keys(r.bets).length > 1 ? "s" : ""} · ◈ {money(r.staked)}
                  {r.lucky?.length ? " · ⚡" : ""}
                </span>
                <span className={`shrink-0 font-mono text-[11px] font-bold ${net > 0 ? "text-emerald-300" : net < 0 ? "text-red-300/80" : "text-white/50"}`}>{signed(net)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open && <RoundDetail r={open} onClose={() => setOpen(null)} />}
    </>
  );
}

export function RoundDetail({ r, onClose }: { r: RoundRecord; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const net = r.returned - r.staked;
  return (
    <div className="safe-y backdrop-in fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 cursor-default bg-black/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Round details" className="blur-in relative w-[min(26rem,100%)] rounded-2xl rl-result-card !flex-col !items-stretch !gap-3 !p-5">
        <div className="flex items-center gap-3">
          <span className={`rl-result-num rl-pill--${colorOf(r.n)} !h-12 !w-12 !text-xl`}>{r.n}</span>
          <div>
            <p className="text-[10px] tracking-[0.2em] text-white/45">{new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            <p className={`font-display text-xl font-bold ${net > 0 ? "gold-text" : "text-white/80"}`}>{signed(net)}</p>
          </div>
        </div>
        {r.lucky?.length ? (
          <p className="text-[11px] text-[#f5d778]">⚡ Strikes: {r.lucky.map((l) => `${l.n} (${l.mult}×)`).join(" · ")}</p>
        ) : null}
        <ul className="max-h-64 divide-y divide-white/[0.06] overflow-y-auto text-[12px]">
          {Object.entries(r.bets).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3 py-1.5">
              <span className="text-white/75">{betName(k)}</span>
              <span className="font-mono text-white/60">◈ {money(v)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between text-[11px] text-white/50">
          <span>Staked ◈ {money(r.staked)}</span>
          <span>Paid ◈ {money(r.returned)}</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- Favourites ---------- */
export function Favourites({ g }: { g: RouletteGame }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const canSave = totalOf(g.phase === "result" ? g.lastBets : g.bets) > 0;
  return (
    <div className="space-y-2">
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (g.saveFavourite(name)) setName("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={canSave ? "Name this layout…" : "Put chips on the table first"}
          maxLength={24}
          className="rl-input min-w-0 flex-1"
          aria-label="Favourite name"
        />
        <button type="submit" disabled={!canSave} className="rl-key">
          Save
        </button>
      </form>
      {g.favourites.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-white/35">Save a layout you like and replay it in one click.</p>
      ) : (
        <ul className="space-y-1">
          {g.favourites.map((f, i) => (
            <li key={f.name} className="flex items-center gap-1.5">
              {editing === i ? (
                <form
                  className="flex min-w-0 flex-1 gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = (new FormData(e.currentTarget).get("name") as string) ?? "";
                    if (g.renameFavourite(i, v)) setEditing(null);
                  }}
                >
                  <input name="name" defaultValue={f.name} maxLength={24} autoFocus className="rl-input min-w-0 flex-1" aria-label="New name" onKeyDown={(e) => e.key === "Escape" && setEditing(null)} />
                  <button type="submit" className="rl-key">
                    OK
                  </button>
                </form>
              ) : (
              <button type="button" onClick={() => g.applyFavourite(i)} disabled={g.phase === "spinning"} className="rl-round-row min-w-0 flex-1">
                <span className="rl-fav-star" aria-hidden="true">
                  ◆
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold text-white/85">{f.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-white/45">
                  {Object.keys(f.bets).length} · ◈ {money(totalOf(f.bets as Bets))}
                </span>
              </button>
              )}
              <button type="button" onClick={() => setEditing(i)} aria-label={`Rename ${f.name}`} className="rl-mini-key">
                ✎
              </button>
              <button type="button" onClick={() => g.deleteFavourite(i)} aria-label={`Delete ${f.name}`} className="rl-mini-key">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Autoplay menu ---------- */
export function AutoMenu({ g, onClose, withQuick = false }: { g: RouletteGame; onClose: () => void; withQuick?: boolean }) {
  const limits = [0, 10000, 50000, 100000, 500000];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  const toggle = (label: string, on: boolean, set: () => void) => (
    <button type="button" onClick={set} aria-pressed={on} className="flex w-full items-center justify-between gap-3 py-1 text-[11px] text-white/70">
      {label}
      <span className={`rl-switch ${on ? "is-on" : ""}`} />
    </button>
  );
  return (
    <>
      <button aria-label="Close autoplay" className="fixed inset-0 z-[59] cursor-default" onClick={onClose} />
      <div role="menu" aria-label="Autoplay" className="blur-in-fast rl-popover absolute bottom-full right-0 z-[60] mb-2 w-64">
        <p className="rl-eyebrow">Autoplay · same bets</p>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {[10, 25, 50, 100].map((n) => (
            <button
              key={n}
              type="button"
              className="rl-key"
              onClick={() => {
                onClose();
                g.startAuto(n);
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 border-t border-white/10 pt-2">
          {withQuick && toggle("Quick spins", g.quick, g.toggleQuick)}
          {toggle("Stop on any win", g.autoStops.onWin, () => g.setAutoStops({ ...g.autoStops, onWin: !g.autoStops.onWin }))}
          {toggle("Stop on a straight up", g.autoStops.onStraight, () => g.setAutoStops({ ...g.autoStops, onStraight: !g.autoStops.onStraight }))}
          <p className="mt-1.5 text-[11px] text-white/70">Stop after losing</p>
          <div className="mt-1 grid grid-cols-5 gap-1">
            {limits.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={g.autoStops.lossLimit === l}
                onClick={() => g.setAutoStops({ ...g.autoStops, lossLimit: l })}
                className={`rl-mini-key !w-auto ${g.autoStops.lossLimit === l ? "is-on" : ""}`}
              >
                {l === 0 ? "—" : l >= 1000 ? `${l / 1000}K` : l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Big win celebration ---------- */
export function BigWin({
  multiple,
  amount,
  lightning,
  onDone,
  light = false,
}: {
  multiple: number;
  amount: number;
  lightning: boolean;
  onDone: () => void;
  /** Phones: fewer coins, smaller title. */
  light?: boolean;
}) {
  const tier = multiple >= 100 ? "EPIC WIN" : multiple >= 25 ? "MEGA WIN" : "BIG WIN";
  useEffect(() => {
    const t = window.setTimeout(onDone, 4200);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="rl-bigwin absolute inset-0 z-40 flex cursor-pointer flex-col items-center justify-center overflow-hidden" onClick={onDone} role="status">
      <div aria-hidden="true" className="win-rays" />
      <CoinRain count={light ? 20 : multiple >= 100 ? 70 : multiple >= 25 ? 54 : 38} />
      {lightning && <p className="rl-bigwin__bolt">⚡ LIGHTNING ⚡</p>}
      <p className={`win-title-in font-display gold-text relative font-bold tracking-[0.12em] drop-shadow-[0_6px_0_rgba(0,0,0,0.6)] ${light ? "text-4xl" : "text-6xl xl:text-7xl"}`}>{tier}</p>
      <p className="relative mt-3 font-display text-3xl font-bold tracking-[0.08em] text-[#fff6d8] drop-shadow-[0_0_18px_rgba(240,211,139,0.7)]">◈ {money(amount)}</p>
      <p className="relative mt-1 text-[11px] font-bold tracking-[0.3em] text-white/55">{Math.round(multiple)}× YOUR STAKE</p>
    </div>
  );
}
