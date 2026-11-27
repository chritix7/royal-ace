"use client";

import { useEffect, useState } from "react";
import { STAKE_CAP } from "../lib/board";
import { useCloud } from "../lib/cloud";
import { useLang } from "../lib/i18n";
import { board, useBoard } from "../lib/leaderboard";
import { useProfile } from "../lib/profile";
import { AvatarBadge } from "./Avatar";

const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
const signed = (n: number) => `${n >= 0 ? "+" : "−"}◈ ${fmt(Math.abs(n))}`;

function left(ends: number, fr: boolean) {
  const ms = Math.max(0, ends - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return d > 0 ? (fr ? `${d} j ${h} h` : `${d}d ${h}h`) : fr ? `${h} h` : `${h}h`;
}

/** The real weekly ranking (signed-in players), with the admin tools for the owner. */
export default function RankingPanel({ onJoin }: { onJoin?: () => void }) {
  const b = useBoard();
  const linked = useCloud().linked;
  const name = useProfile().name || "Player";
  const fr = useLang() === "fr";
  useEffect(() => {
    void board.refresh();
  }, [linked]);
  const me = b.me;
  const meIn = b.rows.some((r) => r.you);

  return (
    <div translate="no">
      <p className="mb-2 text-[11px] leading-snug text-white/55">
        {fr
          ? `Vrais joueurs · gains nets de la semaine · remise à zéro lundi (dans ${left(b.ends, fr)}). Les mises au-delà de ${fmt(STAKE_CAP)} comptent pour ${fmt(STAKE_CAP)}.`
          : `Real players · net winnings this week · resets Monday (in ${left(b.ends, fr)}). Stakes above ${fmt(STAKE_CAP)} count as ${fmt(STAKE_CAP)}.`}
      </p>

      {!linked && (
        <button type="button" onClick={() => {
            onJoin?.();
            window.dispatchEvent(new CustomEvent("royal-ace:settings"));
          }} className="rk-join">
          <span className="rk-join__t">{fr ? "Rejoins le classement" : "Join the ranking"}</span>
          <span className="rk-join__s">{fr ? "Connecte-toi (Google, e-mail ou Face ID) : tes manches compteront dès maintenant." : "Sign in (Google, e-mail or Face ID): your rounds count from then on."}</span>
        </button>
      )}

      {linked && me?.status === "review" && (
        <p className="rk-note">{fr ? "Tes résultats sont en cours de vérification : ils réapparaîtront dès qu'ils seront validés." : "Your results are being checked: they'll show again once approved."}</p>
      )}

      {b.loading && !b.loaded ? (
        <p className="py-6 text-center text-[12px] text-white/40">{fr ? "Chargement…" : "Loading…"}</p>
      ) : b.error ? (
        <p className="py-6 text-center text-[12px] text-white/40">{fr ? "Classement indisponible pour le moment." : "Ranking unavailable right now."}</p>
      ) : b.rows.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-white/45">{fr ? "Personne encore cette semaine : à toi la première place !" : "Nobody yet this week: the top spot is yours to take!"}</p>
      ) : (
        <ol className="space-y-1">
          {b.rows.slice(0, 20).map((r) => (
            <li key={r.pos} className={`rk-row ${r.you ? "is-you" : ""} ${r.pos <= 3 ? `is-top${r.pos}` : ""}`}>
              <span className="rk-row__pos">{r.pos}</span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                {r.you && <AvatarBadge size="sm" />}
                <span className="truncate">{r.you ? `${r.name} (${fr ? "toi" : "you"})` : r.name}</span>
                {r.founder && (
                  <span className="rk-founder" title={fr ? "Fondateur de Chrysonyx" : "Founder of Chrysonyx"}>
                    ✦ {fr ? "Fondateur" : "Founder"}
                  </span>
                )}
              </span>
              <span className="rk-row__net">{signed(r.score)}</span>
            </li>
          ))}
          {!meIn && linked && me && me.rank > 20 && (
            <>
              <li className="py-0.5 text-center text-white/30">⋯</li>
              <li className="rk-row is-you">
                <span className="rk-row__pos">{me.rank}</span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                  <AvatarBadge size="sm" />
                  <span className="truncate">{name} ({fr ? "toi" : "you"})</span>
                </span>
                <span className="rk-row__net">{signed(me.score)}</span>
              </li>
            </>
          )}
        </ol>
      )}

      {linked && me && me.rounds === 0 && b.loaded && !b.error && (
        <p className="mt-2 text-center text-[11px] text-white/45">{fr ? "Joue une manche pour apparaître (mise à jour toutes les 20 s)." : "Play a round to appear (updates every 20 s)."}</p>
      )}
      <p className="mt-3 text-center text-[10px] text-white/35">
        {fr ? `${b.total} joueur${b.total > 1 ? "s" : ""} classé${b.total > 1 ? "s" : ""} · seul ton pseudo est affiché · jetons virtuels uniquement` : `${b.total} ranked player${b.total === 1 ? "" : "s"} · only your nickname is shown · virtual chips only`}
      </p>

      {b.admin && <AdminTools fr={fr} />}
    </div>
  );
}

function AdminTools({ fr }: { fr: boolean }) {
  const b = useBoard();
  const [amount, setAmount] = useState("10000000");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const grant = async () => {
    const n = Math.floor(Number(amount.replace(/[^\d]/g, "")));
    if (!n) return;
    setBusy(true);
    try {
      const got = await board.grant(n);
      setMsg(fr ? `◈ ${fmt(got)} ajoutés à ton solde ✓` : `◈ ${fmt(got)} added to your balance ✓`);
    } catch {
      setMsg(fr ? "Refusé." : "Refused.");
    }
    setBusy(false);
  };
  return (
    <section className="rk-admin">
      <p className="rk-admin__h">{fr ? "Admin · visible par toi seul" : "Admin · only you see this"}</p>
      <div className="flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className="rk-admin__in" aria-label={fr ? "Montant" : "Amount"} />
        <button type="button" onClick={grant} disabled={busy} className="rk-admin__btn">
          {fr ? "Créditer" : "Credit me"}
        </button>
      </div>
      <p className="mt-1 text-[10px] text-white/40">{msg || (fr ? "Pour ton compte uniquement · ne compte pas au classement." : "Your account only · never counts in the ranking.")}</p>
      {b.review.length > 0 && (
        <>
          <p className="rk-admin__h mt-3">{fr ? "À vérifier" : "To review"}</p>
          <ul className="space-y-1">
            {b.review.map((r) => (
              <li key={r.uid} className="rk-row">
                <span className="min-w-0 flex-1 truncate">
                  {r.name} · {signed(r.score)} · {fmt(r.rounds)} {fr ? "manches" : "rounds"} · <em className="text-white/45">{r.why}</em>
                </span>
                <button type="button" onClick={() => void board.review(r.uid, "approve")} className="rk-admin__mini">
                  ✓
                </button>
                <button type="button" onClick={() => void board.review(r.uid, "hide")} className="rk-admin__mini is-no">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
