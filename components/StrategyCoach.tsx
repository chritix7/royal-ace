"use client";

import { useMemo, useState } from "react";
import { advise, type Advice, type Card } from "../lib/blackjack";
import { bjCoach, useCoach, type HandKind } from "../lib/bjCoach";

/**
 * Basic strategy, the player's record: accuracy by hand type and by the
 * right play, the last mistakes, and the full chart (6 decks, S17/H17).
 */
const ACTIONS: Advice[] = ["Hit", "Stand", "Double", "Split", "Surrender"];
const KINDS: HandKind[] = ["Hard", "Soft", "Pairs"];
const LETTER: Record<Advice, string> = { Hit: "H", Stand: "S", Double: "D", Split: "P", Surrender: "R" };
const UPS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const card = (v: number): Card => ({ rank: v === 11 ? "A" : v === 10 ? "10" : String(v), suit: "♠", value: v });
const pct = (c: { n: number; ok: number }) => (c.n ? Math.round((c.ok / c.n) * 100) : null);

function Chart({ h17 }: { h17: boolean }) {
  const rows = useMemo(() => {
    const out: { label: string; cells: Advice[] }[] = [];
    // Hard totals made of two non-pair cards (10 + x), 5 to 17+.
    for (let t = 5; t <= 17; t++) {
      const a = t <= 11 ? card(2) : card(10);
      const b = t <= 11 ? card(t - 2) : card(t - 10);
      out.push({ label: t === 17 ? "17+" : String(t), cells: UPS.map((u) => advise([a, b], card(u), true, false, { canSurrender: true, h17 })) });
    }
    for (let x = 2; x <= 9; x++) out.push({ label: `A,${x}`, cells: UPS.map((u) => advise([card(11), card(x)], card(u), true, false, { h17 })) });
    for (const v of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) out.push({ label: v === 11 ? "A,A" : `${v},${v}`, cells: UPS.map((u) => advise([card(v), card(v)], card(u), true, true, { h17 })) });
    return out;
  }, [h17]);
  return (
    <div className="bj-chart" role="table" aria-label="Basic strategy chart">
      <div className="bj-chart__row is-head" role="row">
        <span />
        {UPS.map((u) => (
          <span key={u}>{u === 11 ? "A" : u}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.label} className={`bj-chart__row ${i === 13 || i === 21 ? "is-gap" : ""}`} role="row">
          <span className="bj-chart__label">{r.label}</span>
          {r.cells.map((a, j) => (
            <span key={j} className={`bj-cell is-${LETTER[a]}`}>
              {LETTER[a]}
            </span>
          ))}
        </div>
      ))}
      <p className="mt-2 text-[10px] text-white/40">H hit · S stand · D double · P split · R surrender (late). Hard hands, then soft (A,x), then pairs; columns: dealer up-card.</p>
    </div>
  );
}

export default function StrategyCoach({ h17 = false }: { h17?: boolean }) {
  const c = useCoach();
  const [tab, setTab] = useState<"stats" | "chart">("stats");
  const all = KINDS.reduce((s, k) => ({ n: s.n + c.byKind[k].n, ok: s.ok + c.byKind[k].ok }), { n: 0, ok: 0 });
  return (
    <div className="mt-3 space-y-3">
      <div className="rl-tabs !grid-cols-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "stats"} onClick={() => setTab("stats")} className={`rl-tab ${tab === "stats" ? "is-on" : ""}`}>
          My record
        </button>
        <button type="button" role="tab" aria-selected={tab === "chart"} onClick={() => setTab("chart")} className={`rl-tab ${tab === "chart" ? "is-on" : ""}`}>
          Strategy chart
        </button>
      </div>
      {tab === "chart" ? (
        <Chart h17={h17} />
      ) : (
        <>
          <table className="bj-coach">
            <thead>
              <tr>
                <th>Hand type</th>
                <th>Decisions</th>
                <th>Right</th>
              </tr>
            </thead>
            <tbody>
              {KINDS.map((k) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{c.byKind[k].n}</td>
                  <td>
                    <Bar v={pct(c.byKind[k])} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="bj-coach">
            <thead>
              <tr>
                <th>Right play was</th>
                <th>Times</th>
                <th>You found it</th>
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((a) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{c.byBest[a].n}</td>
                  <td>
                    <Bar v={pct(c.byBest[a])} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="rl-eyebrow mb-1 !text-[9px]">Last mistakes</p>
            {!c.mistakes.length ? (
              <p className="text-[11px] text-white/40">{all.n ? "No mistake recorded — perfect play." : "Play a few hands to fill this in."}</p>
            ) : (
              <ul className="space-y-1">
                {c.mistakes.slice(0, 6).map((m) => (
                  <li key={m.at} className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-1.5 text-[11px]">
                    <span className="text-white/70">
                      {m.hand} vs {m.up}
                    </span>
                    <span>
                      <span className="text-[#ff8a8a]">{m.chose}</span>
                      <span className="text-white/30"> → </span>
                      <span className="text-[#f5d778]">{m.best}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {all.n > 0 && (
            <button type="button" onClick={() => bjCoach.reset()} className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 hover:text-white/70">
              Reset my record
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Bar({ v }: { v: number | null }) {
  if (v === null) return <span className="text-white/30">—</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <span className={`block h-full rounded-full ${v >= 90 ? "bg-[#f0d38b]" : v >= 70 ? "bg-[#c8a65b]" : "bg-[#c45050]"}`} style={{ width: `${v}%` }} />
      </span>
      <span className="font-mono text-[11px] text-[#efe2bd]">{v}%</span>
    </span>
  );
}
