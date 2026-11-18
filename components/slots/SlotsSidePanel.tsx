"use client";

import { useState } from "react";
import Glyph from "../Glyph";
import { achievementsStore, challengeView, useAchievements } from "../../lib/achievementsStore";
import { COLLECTION_CHIP_MULT } from "../../lib/collection";
import { money } from "../../lib/game";
import { useSession } from "../../lib/sessionStore";
import { RANKS, SKINS, type SkinId, type Skin } from "../../lib/skins";
import {
  BONUS_PRICE_MULT,
  FS_AWARD,
  FS_CAP,
  FS_MULT,
  FS_RETRIGGER,
  PAYLINES,
  PAYS,
  SCATTER_PAYS,
  THEORETICAL_RTP,
  type Paying,
} from "../../lib/slots";
import { VAULT_TRIGGER } from "../../lib/vault";

const PAY_ROWS: Paying[] = ["seven", "wild", "gem", "bell", "grape", "lemon", "cherry"];

type SlotsStats = {
  spins: number;
  wagered: number;
  won: number;
  biggest: number;
  freeSpinRounds: number;
  vaults: number;
  jackpotWins: number;
};

type Rank = {
  current: { name: string; min: number };
  next: { name: string; min: number } | null;
  index: number;
  progress: number;
};

const SLOT_KEYS = new Set(["spin", "slotWin", "bigWin", "bonus", "wildExpand", "respin", "gambleWin", "vault"]);

type Tab = "pay" | "features" | "rank" | "session";

export default function SlotsSidePanel({
  fullscreen,
  rankToast,
  skinId,
  setSkinId,
  skin,
  busy,
  stats,
  history,
  rank,
  lineBet,
  bonusPrice,
  net,
  initialTab = "pay",
}: {
  initialTab?: "pay" | "features" | "session";
  fullscreen: boolean;
  rankToast: string | null;
  skinId: SkinId;
  setSkinId: (id: SkinId) => void;
  skin: Skin;
  busy: boolean;
  stats: SlotsStats;
  history: number[];
  rank: Rank;
  lineBet: number;
  bonusPrice: number;
  net: number;
}) {
  const session = useSession();
  const ach = useAchievements();
  const [tab, setTab] = useState<Tab>(initialTab);
  const challenges = challengeView(ach).filter((c) => SLOT_KEYS.has(c.def.key));
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "pay", label: "Paytable" },
    { id: "features", label: "Features" },
    ...(skinId === "miami" ? [{ id: "rank" as Tab, label: "Rank" }] : []),
    { id: "session", label: "Session" },
  ];
  const current = tabs.some((t) => t.id === tab) ? tab : "pay";

  const card = "rounded-2xl border border-white/[0.08] bg-[#101713] p-4 lg:p-3";
  const rule = "flex gap-3 rounded-xl border border-white/[0.06] bg-black/25 p-3 text-[12.5px] leading-5 text-white/70 lg:p-2.5 lg:text-[12px] lg:leading-[1.45]";

  return (
    <aside className={`flex flex-col gap-4 lg:min-h-0 lg:gap-3 ${fullscreen ? "hidden" : ""}`}>
      {rankToast && (
        <div role="status" className="animate-pop fixed right-4 top-4 z-50 rounded-2xl border border-[#ff4fa3]/70 bg-[#1a0d2e] px-5 py-3 text-sm font-semibold text-[#ff9fd0] shadow-2xl">
          ★ {rankToast}
        </div>
      )}

      {/* Theme */}
      <div className={`${card} flex items-center justify-between gap-3 lg:py-2`}>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d7b45b]/80">Theme</p>
        <div className="flex gap-1.5" role="group" aria-label="Machine theme">
          {Object.values(SKINS).map((k) => (
            <button
              key={k.id}
              onClick={() => !busy && setSkinId(k.id)}
              disabled={busy}
              aria-pressed={skinId === k.id}
              className="lux-btn !rounded-full px-4 py-1.5 text-xs"
            >
              {k.id === "miami" ? "Miami" : "Classic"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid gap-1 rounded-full border border-white/10 bg-black/40 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} role="tablist" aria-label="Game info">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={current === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full py-1.5 text-[11px] font-black uppercase tracking-wider outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] ${
              current === t.id ? "bg-gradient-to-b from-[#f0d38b] to-[#c89a3f] text-[#10130e]" : "text-white/55 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {current === "pay" && (
        <div className={card}>
          <p className="text-[12px] leading-5 text-white/55">
            {PAYLINES.length} lines, wins pay left to right in multiples of the line bet (◈ {money(lineBet)} now).
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-[11px] text-white/40">
                <th className="py-1 text-left font-normal">Symbol</th>
                <th className="py-1 text-right font-normal">3×</th>
                <th className="py-1 text-right font-normal">4×</th>
                <th className="py-1 text-right font-normal">5×</th>
              </tr>
            </thead>
            <tbody>
              {PAY_ROWS.map((sym) => (
                <tr key={sym} className="border-t border-white/5">
                  <td className="py-1.5 lg:py-1" title={skin.names[sym]}>
                    <span className="flex items-center gap-2">
                      <Glyph sym={sym} skin={skin} className="h-8 w-8 lg:h-7 lg:w-7" />
                      <span className="text-[11px] text-white/60">{skin.names[sym]}</span>
                    </span>
                  </td>
                  {PAYS[sym].map((p, i) => (
                    <td key={i} className="py-1.5 text-right font-mono font-bold text-[#e5c779] lg:py-1">
                      {p}
                      <span className="block text-[10px] font-normal text-white/35">◈ {money(p * lineBet)}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-white/40">
            Theoretical return {(THEORETICAL_RTP * 100).toFixed(0)}% including the vault and the jackpots.
          </p>
        </div>
      )}

      {current === "features" && (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
          <div className={rule}>
            <Glyph sym="wild" skin={skin} className="h-8 w-8 shrink-0" />
            <p><b className="text-white">Wild · {skin.names.wild}.</b> Replaces every symbol except the scatter. Lands on reels 2, 3 and 4, expands to fill the reel and gives a free re-spin (up to 3 in a row).</p>
          </div>
          <div className={rule}>
            <Glyph sym="scatter" skin={skin} className="h-8 w-8 shrink-0" />
            <p><b className="text-white">Scatter · {skin.names.scatter}.</b> 3, 4 or 5 anywhere pay {SCATTER_PAYS[3]}×, {SCATTER_PAYS[4]}× or {SCATTER_PAYS[5]}× the bet and award {FS_AWARD[3]}, {FS_AWARD[4]} or {FS_AWARD[5]} free spins with every win ×{FS_MULT}. Retrigger +{FS_RETRIGGER[3]} / +{FS_RETRIGGER[4]} / +{FS_RETRIGGER[5]} (max {FS_CAP}).</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">👑</span>
            <p><b className="text-white">Crown collection.</b> Every scatter that lands adds a crown, kept separately for each bet. At 10 crowns pick 5 free spins or {COLLECTION_CHIP_MULT}× your bet in chips.</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">🔐</span>
            <p><b className="text-white">The vault.</b> Each paid spin has a 1 in {Math.round(1 / VAULT_TRIGGER)} chance to open it. Pick 3 of 12 cases: chips or one of the 4 jackpots (♣ Mini, ♦ Minor, ♥ Major, ♠ Kingpin), which grow with every spin and scale with your bet.</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">🎟️</span>
            <p><b className="text-white">Buy bonus.</b> Start {FS_AWARD[3]} free spins now for ◈ {money(bonusPrice)} ({BONUS_PRICE_MULT}× the bet). On average it returns about 95% of its price.</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">🃏</span>
            <p><b className="text-white">Gamble.</b> After a win, double it by guessing the colour of a card (50/50, up to 3 times in a row).</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">⌨️</span>
            <p><b className="text-white">Keys.</b> Space spins, ← → change the bet, T toggles turbo.</p>
          </div>
        </div>
      )}

      {current === "rank" && skinId === "miami" && (
        <div className="rounded-2xl border border-[#ff4fa3]/30 bg-[#1a0d2e] p-4">
          <p className="text-[11px] text-white/45">Your rank</p>
          <h3 className="mt-0.5 text-2xl font-black text-[#ff7ac0] [text-shadow:0_0_14px_#ff2e8888]">{rank.current.name}</h3>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(rank.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next rank">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff4fa3,#22d3ee)] transition-all duration-700" style={{ width: `${rank.progress * 100}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-white/55">
            Empire value = everything you have won on this machine: ◈ {money(stats.won)}
            {rank.next ? `. ${rank.next.name} at ◈ ${money(rank.next.min)}.` : ". You own the skyline."}
          </p>
          <ol className="mt-3 space-y-1.5 lg:mt-2 lg:space-y-1">
            {RANKS.map((r, i) => (
              <li
                key={r.name}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-[12px] lg:py-1.5 ${
                  i === rank.index ? "bg-[#ff4fa3]/15 text-[#ffc2e0]" : i < rank.index ? "text-[#ff9fd0]" : "text-white/35"
                }`}
              >
                <span>
                  {i <= rank.index ? "★" : "☆"} <b>{r.name}</b>
                  <span className="block text-[10.5px] opacity-70">{r.bonus > 0 ? `Promotion bonus ◈ ${money(r.bonus)}` : "Starting rank"}</span>
                </span>
                <span className="font-mono text-[11px]">◈ {money(r.min)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {current === "session" && (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
          <div className="space-y-3">
          <div className={card}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7b45b]/80">Today</p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
              {[
                ["Net", `${session.slots.net >= 0 ? "+" : "−"}◈ ${money(Math.abs(session.slots.net))}`, session.slots.net >= 0 ? "text-emerald-300" : "text-red-300"],
                ["Spins", money(session.slots.spins), "text-white"],
                ["Biggest", `◈ ${money(session.slots.biggest)}`, "text-white"],
                ["Wagered", `◈ ${money(session.slots.wagered)}`, "text-white"],
                ["Won", `◈ ${money(Math.max(0, session.slots.wagered + session.slots.net))}`, "text-white"],
                ["Return", session.slots.wagered > 0 ? `${Math.round(((session.slots.wagered + session.slots.net) / session.slots.wagered) * 100)}%` : "—", "text-[#f0d99a]"],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-xl bg-black/30 px-2 py-2">
                  <dt className="text-[10px] text-white/45">{k}</dt>
                  <dd className={`mt-0.5 font-mono text-sm font-bold ${c}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className={card}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7b45b]/80">All time</p>
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-[12.5px] text-white/55 lg:gap-y-1">
              <dt>Spins</dt><dd className="text-right text-white">{money(stats.spins)}</dd>
              <dt>Wagered</dt><dd className="text-right text-white">◈ {money(stats.wagered)}</dd>
              <dt>Won</dt><dd className="text-right text-white">◈ {money(stats.won)}</dd>
              <dt>Net</dt>
              <dd className={`text-right font-bold ${net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {net >= 0 ? "+" : "−"}◈ {money(Math.abs(net))}
              </dd>
              <dt>Biggest win</dt><dd className="text-right text-white">◈ {money(stats.biggest)}</dd>
              <dt>Bonus rounds</dt><dd className="text-right text-white">{stats.freeSpinRounds}</dd>
              <dt>Vaults opened</dt><dd className="text-right text-white">{stats.vaults}</dd>
              <dt>Jackpots won</dt><dd className="text-right text-white">{stats.jackpotWins}</dd>
            </dl>
            {history.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Recent rounds">
                {history.map((r, i) => (
                  <span
                    key={i}
                    title={`${r.toFixed(1)}× the bet`}
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      r >= 20 ? "bg-[#e5c779] text-black" : r >= 1 ? "bg-emerald-500/30 text-emerald-200" : r > 0 ? "bg-white/15 text-white/70" : "bg-red-500/25 text-red-200"
                    }`}
                  >
                    {r === 0 ? "0" : r >= 10 ? Math.round(r) : r.toFixed(1)}
                  </span>
                ))}
              </div>
            )}
          </div>
          </div>
          {challenges.length > 0 && (
            <div className={card}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7b45b]/80">Today&apos;s slot challenges</p>
              <ul className="mt-2 space-y-2">
                {challenges.map((c) => (
                  <li key={c.def.id} className="rounded-xl bg-black/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-[12.5px]">
                      <span className={c.claimed ? "text-white/40 line-through" : "text-white/80"}>{c.def.title}</span>
                      {c.done && !c.claimed ? (
                        <button
                          onClick={() => achievementsStore.claim(c.def.id)}
                          disabled={busy}
                          className="lux-btn lux-btn--gold shrink-0 !rounded-full px-3 py-1 text-[11px]"
                        >
                          Claim ◈ {money(c.def.reward)}
                        </button>
                      ) : (
                        <span className="shrink-0 font-mono text-[11px] text-[#e5c779]">◈ {money(c.def.reward)}</span>
                      )}
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#e5c779]" style={{ width: `${(c.progress / c.def.goal) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="px-3 text-center text-[11px] leading-5 text-white/25">
        Virtual chips only. No real money, deposits or cash-outs.
      </p>
    </aside>
  );
}
