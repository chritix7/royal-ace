"use client";

import { useState } from "react";
import { useLang } from "../../lib/i18n";
import Glyph from "../Glyph";
import { achievementsStore, challengeView, useAchievements } from "../../lib/achievementsStore";
import { COLLECTION_CHIP_MULT } from "../../lib/collection";
import { money } from "../../lib/game";
import { useSession } from "../../lib/sessionStore";
import { useSlotBonuses } from "../../lib/slotBonuses";
import { RANKS, SKIN_IDS, type SkinId, type Skin } from "../../lib/skins";
import {
  BELL_BUY_MULT,
  BONUS_PRICE_MULT,
  FS_AWARD,
  FS_CAP,
  FS_MULT,
  FS_RETRIGGER,
  MACHINES,
  PAYLINES,
  PAYS,
  SCATTER_PAYS,
  THEORETICAL_RTP,
  type Paying,
} from "../../lib/slots";
import { VAULT_TRIGGER } from "../../lib/vault";

const SHORT: Record<SkinId, string> = { miami: "Miami", gold: "Gold", pharaoh: "Pharaoh", classic: "Bells" };

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
  // Long sentences with numbers inside: written in both languages here.
  const fr = useLang() === "fr";
  const L = (en: string, frText: string) => (fr ? frText : en);
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
        <div role="status" className="animate-pop fixed right-4 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] z-50 rounded-2xl border border-[#ff4fa3]/70 bg-[#1a0d2e] px-5 py-3 text-sm font-semibold text-[#ff9fd0] shadow-2xl">
          ★ {rankToast}
        </div>
      )}

      {/* Theme */}
      <div className={`${card} flex items-center justify-between gap-3 lg:py-2`}>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d7b45b]/80">Machine</p>
        <div className="flex gap-1.5" role="group" aria-label="Machine theme">
          {SKIN_IDS.map((id) => (
            <button
              key={id}
              onClick={() => !busy && setSkinId(id)}
              disabled={busy}
              aria-pressed={skinId === id}
              className="lux-btn !rounded-full px-3 py-1.5 text-xs"
              translate="no"
            >
              {SHORT[id]}
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
            {L(`${PAYLINES.length} lines, wins pay left to right in multiples of the line bet (◈ ${money(lineBet)} now).`, `${PAYLINES.length} lignes, les gains se lisent de gauche à droite, en multiples de la mise par ligne (◈ ${money(lineBet)} en ce moment).`)}
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
                  {PAYS[sym].map((p0, i) => {
                    const p = Math.round(p0 * MACHINES[skinId].pay * 10) / 10;
                    return (
                    <td key={i} className="py-1.5 text-right font-mono font-bold text-[#e5c779] lg:py-1">
                      {p}
                      <span className="block text-[10px] font-normal text-white/35">◈ {money(Math.round(p0 * MACHINES[skinId].pay * lineBet))}</span>
                    </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-white/40">
            {L(`Theoretical return ${(THEORETICAL_RTP * 100).toFixed(0)}% including the vault and the jackpots.`, `Retour théorique ${(THEORETICAL_RTP * 100).toFixed(0)} %, coffre et jackpots compris.`)}
          </p>
        </div>
      )}

      {current === "features" && (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
          <div className={rule}>
            <Glyph sym="wild" skin={skin} className="h-8 w-8 shrink-0" />
            <p translate="no"><b className="text-white">{`Wild · ${skin.names.wild}.`}</b> {skinId === "gold"
                ? L("Lands on every reel (about one spin in 4), replaces every symbol except the scatter and carries a ×2, ×3 or ×5 multiplier. Two wilds on one line multiply together (×3 and ×5 = ×15), up to ×50.", "Tombe sur tous les rouleaux (environ un tour sur 4), remplace tous les symboles sauf le scatter et porte un multiplicateur ×2, ×3 ou ×5. Deux wilds sur une même ligne se multiplient entre eux (×3 et ×5 = ×15), jusqu'à ×50.")
                : L("Replaces every symbol except the scatter. Lands on reels 2, 3 and 4, expands to fill the reel and gives a free re-spin (up to 3 in a row).", "Remplace tous les symboles sauf le scatter. Tombe sur les rouleaux 2, 3 et 4, s'étend sur tout le rouleau et offre un re-spin gratuit (jusqu'à 3 de suite).")}</p>
          </div>
          {skinId === "classic" ? (
            <div className={`${rule} border-[#d7b45b]/45`}>
              <Glyph sym="bell" skin={skin} className="h-8 w-8 shrink-0" />
              <p translate="no"><b className="text-white">{L("Bell bonus.", "Bonus cloches.")}</b> {L("5 golden bells or more on the screen start it. The bells stay, each one shows a value (×1 to ×25 the bet) or a jackpot (Mini, Minor, Major), and you get 3 respins: every new bell stays and puts the respins back to 3. From 15 bells, every value is ×3. Fill the 20 cells for the Grand (the Kingpin jackpot). Bells do not pay on the lines.", "5 cloches dorées ou plus à l'écran le déclenchent. Les cloches restent, chacune affiche une valeur (×1 à ×25 la mise) ou un jackpot (Mini, Minor, Major), et tu as 3 relances : chaque nouvelle cloche reste et remet les relances à 3. Dès 15 cloches, toutes les valeurs sont ×3. Remplis les 20 cases pour le Grand (le jackpot Kingpin). Les cloches ne paient pas sur les lignes.")}</p>
            </div>
          ) : skinId === "pharaoh" ? (
            <div className={`${rule} border-[#d7b45b]/45`}>
              <span className="w-8 shrink-0 text-center text-xl">📜</span>
              <p translate="no"><b className="text-white">{L(`Expanding symbol · ${skin.labels.freeSpins}.`, `Symbole extensible · ${skin.labels.freeSpins}.`)}</b> {L("At the start of the free spins the Pharaoh picks one symbol. On every free spin, when it shows on 3 reels or more, it fills those reels and pays on all 20 lines, wherever the reels are. The Pharaoh (wild) lands more often: he fills his whole reel and that reel counts for the expanding symbol too.", "Au début des tours gratuits, le Pharaon choisit un symbole. À chaque tour gratuit, s'il apparaît sur 3 rouleaux ou plus, il remplit ces rouleaux et paie sur les 20 lignes, même si les rouleaux ne se suivent pas. Le Pharaon (wild) tombe plus souvent : il remplit tout son rouleau, et ce rouleau compte aussi pour le symbole extensible.")}</p>
            </div>
          ) : (
            <div className={`${rule} border-[#d7b45b]/45`}>
              <span className="w-8 shrink-0 text-center text-xl">🔒</span>
              <p translate="no"><b className="text-white">{L(`Sticky wilds · ${skin.labels.freeSpins}.`, `Wilds collants · ${skin.labels.freeSpins}.`)}</b> {skinId === "gold"
                ? L("Wilds land more often, on every reel. Each one locks in place as a ×2 wild until the last free spin and the next ones pile up with it: about 3 per bonus.", "Les wilds tombent plus souvent, sur tous les rouleaux. Chacun se verrouille en wild ×2 jusqu'au dernier tour gratuit et les suivants s'ajoutent : environ 3 par bonus.")
                : L("During the free spins, wilds can land on every reel. Each one locks in place until the last free spin and the next ones pile up with it: 1, 2, 3 wilds or more stay on the reels and pay on every line they touch. About 3 per bonus on average.", "Pendant les tours gratuits, les wilds peuvent tomber sur tous les rouleaux. Chacun se verrouille sur place jusqu'au dernier tour gratuit et les suivants s'ajoutent : 1, 2, 3 wilds ou plus restent sur les rouleaux et paient sur chaque ligne qu'ils touchent. Environ 3 par bonus en moyenne.")}</p>
            </div>
          )}
          <div className={rule}>
            <Glyph sym="scatter" skin={skin} className="h-8 w-8 shrink-0" />
            <p translate="no"><b className="text-white">{`Scatter · ${skin.names.scatter}.`}</b> {skinId === "classic" ? L(`3, 4 or 5 anywhere pay ${SCATTER_PAYS[3]}×, ${SCATTER_PAYS[4]}× or ${SCATTER_PAYS[5]}× the bet.`, `3, 4 ou 5 n'importe où paient ${SCATTER_PAYS[3]}×, ${SCATTER_PAYS[4]}× ou ${SCATTER_PAYS[5]}× la mise.`) : L(`3, 4 or 5 anywhere pay ${SCATTER_PAYS[3]}×, ${SCATTER_PAYS[4]}× or ${SCATTER_PAYS[5]}× the bet and award ${FS_AWARD[3]}, ${FS_AWARD[4]} or ${FS_AWARD[5]} free spins. Retrigger +${FS_RETRIGGER[3]} / +${FS_RETRIGGER[4]} / +${FS_RETRIGGER[5]} (max ${FS_CAP}).`, `3, 4 ou 5 n'importe où paient ${SCATTER_PAYS[3]}×, ${SCATTER_PAYS[4]}× ou ${SCATTER_PAYS[5]}× la mise et donnent ${FS_AWARD[3]}, ${FS_AWARD[4]} ou ${FS_AWARD[5]} tours gratuits. Relance +${FS_RETRIGGER[3]} / +${FS_RETRIGGER[4]} / +${FS_RETRIGGER[5]} (max ${FS_CAP}).`)}</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">👑</span>
            <p translate="no"><b className="text-white">{L("Crown collection.", "Collection de couronnes.")}</b> {L(`Every scatter that lands adds a crown, kept separately for each bet. At 10 crowns pick 5 free spins or ${COLLECTION_CHIP_MULT}× your bet in chips.`, `Chaque scatter qui tombe ajoute une couronne, comptée à part pour chaque mise. À 10 couronnes, choisis 5 tours gratuits ou ${COLLECTION_CHIP_MULT}× ta mise en jetons.`)}</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">🔐</span>
            <p translate="no"><b className="text-white">{L("The vault.", "Le coffre.")}</b> {L(`Each paid spin has a 1 in ${Math.round(1 / VAULT_TRIGGER)} chance to open it. Pick 3 of 12 cases: chips or one of the 4 jackpots (♣ Mini, ♦ Minor, ♥ Major, ♠ Kingpin), which grow with every spin and scale with your bet.`, `Chaque tour payant a 1 chance sur ${Math.round(1 / VAULT_TRIGGER)} de l'ouvrir. Choisis 3 coffrets sur 12 : des jetons ou l'un des 4 jackpots (♣ Mini, ♦ Minor, ♥ Major, ♠ Kingpin), qui grossissent à chaque tour et suivent ta mise.`)}</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">🎟️</span>
            <p translate="no"><b className="text-white">{L("Buy bonus.", "Acheter le bonus.")}</b> {skinId === "classic"
                ? L(`Start the bell bonus with 6 bells for ◈ ${money(bonusPrice)} (${BELL_BUY_MULT}× the bet). On average it returns about 96% of its price.`, `Lance le bonus cloches avec 6 cloches pour ◈ ${money(bonusPrice)} (${BELL_BUY_MULT}× la mise). En moyenne, il rend environ 96 % de son prix.`)
                : L(`Start ${FS_AWARD[3]} free spins now for ◈ ${money(bonusPrice)} (${BONUS_PRICE_MULT}× the bet). On average it returns about 96% of its price.`, `Lance ${FS_AWARD[3]} tours gratuits tout de suite pour ◈ ${money(bonusPrice)} (${BONUS_PRICE_MULT}× la mise). En moyenne, il rend environ 96 % de son prix.`)}</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">🃏</span>
            <p><b className="text-white">Gamble.</b> After a win, double it by guessing the colour of a card (50/50, up to 3 times in a row).</p>
          </div>
          <div className={rule}>
            <span className="w-8 shrink-0 text-center text-xl">⌨️</span>
            <p translate="no"><b className="text-white">{L("Keys.", "Raccourcis.")}</b> {L("Space spins, ← → change the bet, T toggles turbo.", "Espace pour lancer, ← → pour la mise, T pour le turbo.")}</p>
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
            {L(
              `Empire value = everything you have won on this machine: ◈ ${money(stats.won)}${rank.next ? `. ${rank.next.name} at ◈ ${money(rank.next.min)}.` : ". You own the skyline."}`,
              `Valeur de l'empire = tout ce que tu as gagné sur cette machine : ◈ ${money(stats.won)}${rank.next ? `. ${rank.next.name} à ◈ ${money(rank.next.min)}.` : ". La ville est à toi."}`,
            )}
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
                  <span className="block text-[10.5px] opacity-70">{r.bonus > 0 ? L(`Promotion bonus ◈ ${money(r.bonus)}`, `Prime de promotion ◈ ${money(r.bonus)}`) : L("Starting rank", "Rang de départ")}</span>
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
          <BonusHistory card={card} />
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
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-[12.5px] text-white/55 lg:grid-cols-4 lg:gap-x-3 lg:gap-y-1 lg:text-[12px]">
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7b45b]/80">{L("Today's slot challenges", "Défis machine du jour")}</p>
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

/** The last free-spin bonuses: spins, retriggers, total and × the bet. */
function BonusHistory({ card }: { card: string }) {
  const list = useSlotBonuses();
  const best = list.reduce((m, b) => Math.max(m, b.bet ? b.win / b.bet : 0), 0);
  return (
    <div className={card}>
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7b45b]/80">Bonus history</p>
        {list.length > 0 && <p className="text-[10px] text-white/40">best ×{Math.round(best)}</p>}
      </div>
      {!list.length ? (
        <p className="mt-2 text-[12px] text-white/40">No bonus yet — three scatters, or buy one.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {list.slice(0, 8).map((b) => {
            const x = b.bet ? b.win / b.bet : 0;
            return (
              <li key={b.at} className="flex items-center gap-2 rounded-lg bg-black/30 px-2.5 py-1.5 text-[11.5px]">
                <span className="w-12 shrink-0 font-mono text-[10px] text-white/40">{new Date(b.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="min-w-0 flex-1 truncate text-white/70">
                  {b.spins} spins{b.retriggers ? ` · +${b.retriggers} retrig.` : ""}
                  {b.bought && <span className="ml-1 rounded bg-[#d7b45b]/20 px-1 text-[9px] font-bold text-[#f0d38b]">BUY</span>}
                </span>
                <span className={`font-mono font-bold ${x >= 50 ? "text-[#f5d778]" : x >= 20 ? "text-[#f0d99a]" : "text-white/80"}`}>◈ {money(b.win)}</span>
                <span className="w-12 shrink-0 text-right font-mono text-[10px] text-white/45">×{x >= 100 ? Math.round(x) : x.toFixed(1)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
