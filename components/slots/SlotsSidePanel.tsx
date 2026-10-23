"use client";

import Glyph from "../Glyph";
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
}: {
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

  return (
    <aside className={`flex flex-col gap-5 ${fullscreen ? "hidden" : ""}`}>
      {rankToast && (
        <div role="status" className="animate-pop fixed right-4 top-4 z-50 rounded-2xl border border-[#ff4fa3]/70 bg-[#1a0d2e] px-5 py-3 text-sm font-semibold text-[#ff9fd0] shadow-2xl">
          ★ {rankToast}
        </div>
      )}

      <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
        <h3 className="text-lg font-bold">Theme</h3>
        <div className="mt-3 flex gap-2" role="group" aria-label="Machine theme">
          {Object.values(SKINS).map((k) => (
            <button
              key={k.id}
              onClick={() => !busy && setSkinId(k.id)}
              disabled={busy}
              aria-pressed={skinId === k.id}
              className={`flex-1 rounded-full border py-2 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-[#e5c779] disabled:opacity-40 ${
                skinId === k.id ? "border-[#d7b45b] bg-[#d7b45b]/10 text-[#e5c779]" : "border-white/10 text-white/60"
              }`}
            >
              {k.id === "miami" ? "Miami" : "Classic"}
            </button>
          ))}
        </div>
      </div>

      {skinId === "miami" && (
        <div className="rounded-3xl border border-[#ff4fa3]/30 bg-[#1a0d2e] p-6">
          <p className="text-[11px] text-white/40">Your rank</p>
          <h3 className="mt-1 text-2xl font-black text-[#ff7ac0] [text-shadow:0_0_14px_#ff2e8888]">{rank.current.name}</h3>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(rank.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next rank">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff4fa3,#22d3ee)] transition-all duration-700" style={{ width: `${rank.progress * 100}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-white/45">
            Empire value ◈ {money(stats.won)}
            {rank.next ? ` · next: ${rank.next.name} at ◈ ${money(rank.next.min)}` : " · you own the skyline"}
          </p>
          <ol className="mt-3 space-y-1 text-[11px]">
            {RANKS.map((r, i) => (
              <li key={r.name} className={i <= rank.index ? "text-[#ff9fd0]" : "text-white/25"}>
                {i <= rank.index ? "★" : "☆"} {r.name}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
        <h3 className="text-lg font-bold">Paytable</h3>
        <p className="mt-1 text-[11px] text-white/40">
          {PAYLINES.length} lines · wins in multiples of the line bet (◈ {money(lineBet)}), left to right.
        </p>
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="text-white/40">
              <th className="py-1 text-left font-normal"> </th>
              <th className="py-1 text-right font-normal">3×</th>
              <th className="py-1 text-right font-normal">4×</th>
              <th className="py-1 text-right font-normal">5×</th>
            </tr>
          </thead>
          <tbody>
            {PAY_ROWS.map((sym) => (
              <tr key={sym} className="border-t border-white/5">
                <td className="py-1.5 text-base" title={skin.names[sym]}>
                  <Glyph sym={sym} skin={skin} className="h-8 w-8" />
                  {sym === "wild" && <span className="ml-2 rounded bg-white/10 px-1 text-[9px] font-bold text-white/70">WILD</span>}
                </td>
                {PAYS[sym].map((p, i) => (
                  <td key={i} className="py-1.5 text-right font-bold text-[#e5c779]">{p}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-2 text-[11px] leading-4 text-white/45">
          <li>
            <Glyph sym="wild" skin={skin} /> <b className="text-white/70">WILD</b> ({skin.names.wild}) replaces every symbol except <Glyph sym="scatter" skin={skin} />. It lands on reels 2, 3 and 4, then expands to fill the whole reel and triggers a free re-spin (up to 3 in a row, expanded wilds stay in place).
          </li>
          <li>
            <Glyph sym="scatter" skin={skin} /> <b className="text-white/70">SCATTER</b> ({skin.names.scatter}): 3, 4 or 5 anywhere pay {SCATTER_PAYS[3]}×, {SCATTER_PAYS[4]}× and {SCATTER_PAYS[5]}× the total bet and award {FS_AWARD[3]}, {FS_AWARD[4]} or {FS_AWARD[5]} free spins with all wins ×{FS_MULT}.
          </li>
          <li>
            <b className="text-white/70">Retrigger:</b> 3, 4 or 5 <Glyph sym="scatter" skin={skin} /> during free spins add +{FS_RETRIGGER[3]}, +{FS_RETRIGGER[4]} or +{FS_RETRIGGER[5]} spins (up to {FS_CAP} in one bonus).
          </li>
          <li>
            <b className="text-white/70">The vault and the jackpots:</b> each paid spin has a 1 in {Math.round(1 / VAULT_TRIGGER)} chance to open the vault. Pick 3 of 12 cases: chips, or one of 4 growing jackpots (Mini, Minor, Major, Kingpin). Jackpots are multiples of your bet, so a higher bet means bigger jackpots.
          </li>
          <li>
            <b className="text-white/70">Buy bonus:</b> start the free spins right away for ◈ {money(bonusPrice)} ({BONUS_PRICE_MULT}× your bet).
          </li>
          <li>
            <b className="text-white/70">Gamble:</b> after a win you can double it by guessing a card's colour (50 / 50, up to 3 times in a row).
          </li>
          <li>
            Theoretical return {(THEORETICAL_RTP * 100).toFixed(0)}% including the vault and the jackpots. Wins can be streaky: that is how real machines behave.
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-white/[0.07] bg-[#101713] p-6">
        <h3 className="text-lg font-bold">Session</h3>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Today</p>
          <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs text-white/50">
            <dt>Net</dt>
            <dd className={`text-right font-bold ${session.slots.net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {session.slots.net >= 0 ? "+" : "−"}◈ {money(Math.abs(session.slots.net))}
            </dd>
            <dt>Spins</dt>
            <dd className="text-right text-white">{money(session.slots.spins)}</dd>
            <dt>Biggest win</dt>
            <dd className="text-right text-white">◈ {money(session.slots.biggest)}</dd>
          </dl>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-white/50">
          <dt>Spins</dt><dd className="text-right text-white">{money(stats.spins)}</dd>
          <dt>Wagered</dt><dd className="text-right text-white">◈ {money(stats.wagered)}</dd>
          <dt>Won</dt><dd className="text-right text-white">◈ {money(stats.won)}</dd>
          <dt>Net</dt>
          <dd className={`text-right font-bold ${net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {net >= 0 ? "+" : "−"}{money(Math.abs(net))}
          </dd>
          <dt>Biggest win</dt><dd className="text-right text-white">◈ {money(stats.biggest)}</dd>
          <dt>Bonus rounds</dt><dd className="text-right text-white">{stats.freeSpinRounds}</dd>
          <dt>Vaults opened</dt><dd className="text-right text-white">{stats.vaults}</dd>
          <dt>Jackpots won</dt><dd className="text-right text-white">{stats.jackpotWins}</dd>
        </dl>
        {history.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Recent rounds">
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

      <p className="px-3 text-center text-[11px] leading-5 text-white/25">
        Virtual chips only. No real money, deposits or cash-outs.
      </p>
    </aside>
  );
}
