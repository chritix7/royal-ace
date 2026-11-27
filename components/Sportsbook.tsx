"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChipFace } from "./ChipButton";
import { Counter } from "./ui";
import { money } from "../lib/game";
import { marketsOf, PLAYER_KINDS, playerMarket, priced, type Priced } from "../lib/sports/odds";
import type { Match, Sport } from "../lib/sports/types";
import { MAX_PAYOUT, SPORT_CHIPS, SPORTS_MIN, useSportsbook, type SportsGame, type Ticket } from "../lib/useSportsbook";
import { BOOST_MAX_STAKE, endsIn, type Boost } from "../lib/sports/boosts";
import { isNarrowScreen, requestFullscreenSettled } from "../lib/fullscreen";
import { useSession } from "../lib/sessionStore";
import { sfx } from "../lib/sound";
import { ambience } from "../lib/ambience";
import { shareTicket } from "../lib/sports/shareCard";
import { compKey, favs, teamKey, useFavs } from "../lib/sports/favs";

function useDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}
const compact = (v: number) =>
  v < 10000 ? money(v) : v < 1e6 ? `${Math.round(v / 100) / 10}K`.replace(".0K", "K") : v < 1e9 ? `${Math.round(v / 1e5) / 10}M`.replace(".0M", "M") : `${Math.round(v / 1e8) / 10}B`.replace(".0B", "B");
const fmtOdds = (o: number) => (o >= 100 ? o.toFixed(0) : o.toFixed(2));

const SPORTS: { id: Sport; label: string; icon: string }[] = [
  { id: "football", label: "Football", icon: "⚽" },
  { id: "basketball", label: "Basketball", icon: "🏀" },
  { id: "hockey", label: "Hockey", icon: "🏒" },
];
type View = "boosts" | "live" | "today" | "upcoming" | "results";
const VIEWS: { id: View; label: string }[] = [
  { id: "boosts", label: "Boosts" },
  { id: "live", label: "Live" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "results", label: "Results" },
];

const isLive = (m: Match) => m.status === "live" || m.status === "break";
function sameDay(a: number, b: number) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
function when(m: Match, now: number) {
  if (m.status === "void") return "Postponed";
  if (m.status === "done") return "FT";
  if (isLive(m)) return m.clock?.label ?? "Live";
  const d = new Date(m.kickoff);
  const hm = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay(m.kickoff, now)) return hm;
  if (sameDay(m.kickoff, now + 86400000)) return `Tomorrow ${hm}`;
  return `${d.toLocaleDateString([], { weekday: "short", day: "numeric" })} ${hm}`;
}
function errorText(e: string | undefined) {
  if (!e) return "";
  if (e === "missing-key") return "Real matches need the API key in Vercel.";
  if (e === "busy") return "Data provider busy — retrying shortly.";
  if (e.startsWith("provider")) return `Data provider: ${e.replace(/^provider:?\s*/, "")}`;
  return "Data unavailable — retrying shortly.";
}

/* ───────────── Odds button ───────────── */

function OddButton({ p, on, onClick, wide = false }: { p: Priced; on: boolean; onClick: () => void; wide?: boolean }) {
  const prev = useRef(p.odds);
  const born = useRef(0);
  const [move, setMove] = useState<"" | "is-up" | "is-down">("");
  useEffect(() => {
    if (!born.current) born.current = Date.now();
    // No flash while the tables load (first seconds).
    if (prev.current !== null && p.odds !== null && p.odds !== prev.current && Date.now() - born.current > 4000) {
      setMove(p.odds > prev.current ? "is-up" : "is-down");
      const t = window.setTimeout(() => setMove(""), 2500);
      prev.current = p.odds;
      return () => window.clearTimeout(t);
    }
    prev.current = p.odds;
  }, [p.odds]);
  return (
    <button type="button" disabled={p.odds === null && !on} onClick={onClick} aria-pressed={on} title={p.label} className={`sb-odd ${on ? "is-on" : ""} ${move} ${wide ? "is-wide" : ""}`}>
      <span className="sb-odd__label">{p.label}</span>
      <span className="sb-odd__value">{p.odds === null ? "🔒" : fmtOdds(p.odds)}</span>
    </button>
  );
}

/* ───────────── One match ───────────── */

function MatchRow({ g, m, open, onOpen, lite }: { g: SportsGame; m: Match; open: boolean; onOpen: () => void; lite: boolean }) {
  const model = useMemo(() => g.modelFor(m), [g, m]);
  const markets = useMemo(() => marketsOf(m, model), [m, model]);
  const main = markets[0];
  const mainPriced = main ? priced(m, model, main, g.now || Date.now()) : [];
  const live = isLive(m);
  const add = (p: Priced, title: string) => {
    // Labels that read on their own in a ticket or a bet builder.
    const k = p.market.split(":")[0];
    const label = k === "btts" ? `Both score: ${p.label}` : k === "cs" ? `Score ${p.label}` : p.label;
    return g.toggle(m, p.market, p.pick, label, title);
  };
  const short = (p: Priced) => ({ ...p, label: p.pick === "X" ? "Draw" : p.pick === "1" ? "1" : p.pick === "2" ? "2" : p.label });
  const boosts = useMemo(() => [...g.boostById.values()].filter((b) => b.matchId === m.id), [g.boostById, m.id]);
  return (
    <div className={`sb-match ${open ? "is-open" : ""} ${live ? "is-live" : ""} ${boosts.length ? "has-boost" : ""}`}>
      <div className="sb-match__row">
        <button type="button" onClick={onOpen} className="sb-match__info" aria-expanded={open}>
          <span className={`sb-when ${live ? "is-live" : ""}`}>
            {live && <i className="sb-dot" />}
            {when(m, g.now || Date.now())}
            {boosts.length > 0 && <i className={`sb-flag ${boosts.some((b) => b.kind === "flash") ? "is-flash" : ""}`}>{boosts.some((b) => b.kind === "flash") ? "⚡" : "🔥"}</i>}
          </span>
          <span className="sb-teams">
            <span className="sb-team">
              <span className="truncate">{m.home.name}</span>
              {m.score && <b>{m.score.h}</b>}
            </span>
            <span className="sb-team">
              <span className="truncate">{m.away.name}</span>
              {m.score && <b>{m.score.a}</b>}
            </span>
          </span>
        </button>
        {m.status !== "done" && m.status !== "void" ? (
          <div className={`sb-main ${mainPriced.length === 2 ? "is-two" : ""}`}>
            {mainPriced.map((p) => (
              <OddButton key={p.pick} p={lite ? short(p) : short(p)} on={g.inSlip.has(`${m.id}|${p.market}|${p.pick}`)} onClick={() => add(p, main.title)} />
            ))}
          </div>
        ) : (
          <span className="sb-final">{m.status === "done" ? "Full time" : "Postponed"}</span>
        )}
        {m.status !== "done" && m.status !== "void" && (
          <button type="button" onClick={onOpen} className="sb-more" aria-label="All markets">
            {open ? "−" : `+${markets.reduce((n, k) => n + k.picks.length, 0) - mainPriced.length}`}
          </button>
        )}
      </div>
      {open && m.status !== "done" && m.status !== "void" && (
        <div className="sb-markets">
          <FollowRow m={m} />
          {boosts.length > 0 && (
            <div className="sb-market">
              <p className="sb-market__title text-[#ffb35c]">Boosted odds</p>
              <div className="space-y-1.5">
                {boosts.map((b) => (
                  <BoostLine key={b.id} g={g} b={b} m={m} />
                ))}
              </div>
            </div>
          )}
          {markets.slice(1).map((k) => {
            const ps = priced(m, model, k, g.now || Date.now());
            return (
              <div key={k.key} className="sb-market">
                <p className="sb-market__title">{k.title}</p>
                <div className={`sb-market__picks ${ps.length > 3 ? "is-grid" : ps.length === 2 ? "is-two" : ""}`}>
                  {ps.map((p) => (
                    <OddButton key={p.pick} p={p} wide on={g.inSlip.has(`${m.id}|${p.market}|${p.pick}`)} onClick={() => add(p, k.title)} />
                  ))}
                </div>
              </div>
            );
          })}
          {m.sport === "football" && m.status === "pre" && <Players g={g} m={m} />}
          {!model && <p className="text-[11px] text-white/40">Odds not available for this match.</p>}
        </div>
      )}
    </div>
  );
}

function FollowRow({ m }: { m: Match }) {
  const f = useFavs();
  return (
    <div className="sb-follow">
      {[m.home, m.away].map((t) => {
        const k = teamKey(m.sport, t.id);
        const on = f.teams.includes(k);
        return (
          <button key={t.id} type="button" onClick={() => favs.toggleTeam(k)} aria-pressed={on} className={`sb-follow__key ${on ? "is-on" : ""}`}>
            {on ? "★" : "☆"} {on ? "Following" : "Follow"} {t.name}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Player bets (football, before kick-off) ───────────── */

function Players({ g, m }: { g: SportsGame; m: Match }) {
  useEffect(() => {
    g.loadScorers(m.comp.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.comp.id]);
  const players = g.playersFor(m);
  if (g.demo) return null;
  return (
    <div className="sb-market sb-players">
      <p className="sb-market__title">Players · before kick-off</p>
      {!players.length && <p className="text-[11px] text-white/40">No player market for this match (leading scorers only).</p>}
      {players.map((p) => (
        <div key={p.id} className="sb-player">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold text-[#efe2bd]">{p.name}</p>
            <p className="truncate text-[10px] text-white/40">
              {p.teamId === m.home.id ? m.home.name : m.away.name} · {p.goals} G · {p.assists} A · {p.played} games
            </p>
          </div>
          <div className="sb-player__picks">
            {PLAYER_KINDS.map(({ kind, label, title }) => {
              const market = playerMarket(kind, p.id);
              const odds = g.oddsNow(m, market, "yes");
              const pk: Priced = { market, pick: "yes", label, odds };
              return (
                <OddButton key={kind} p={pk} on={g.inSlip.has(`${m.id}|${market}|yes`)} onClick={() => g.toggle(m, market, "yes", `${p.name} · ${label}`, title)} />
              );
            })}
          </div>
        </div>
      ))}
      <p className="mt-1 text-[9.5px] leading-relaxed text-white/30">Settled on the official season totals after the match. Refunded if the player does not play.</p>
    </div>
  );
}

/* ───────────── Daily boost and my live matches ───────────── */

function Highlights({ g, onBoosts }: { g: SportsGame; onBoosts: () => void }) {
  const now = g.now || 0;
  // My matches in play: those with an open pick.
  const mine = useMemo(() => {
    const ids = new Set(g.tickets.filter((t) => t.status === "open").flatMap((t) => t.legs.filter((l) => !l.result).map((l) => l.matchId)));
    return g.matches.filter((m) => ids.has(m.id) && isLive(m));
  }, [g.tickets, g.matches]);
  // A goal on one of my matches: gold flash.
  const prev = useRef(new Map<string, number>());
  const [flash_, setFlash] = useState<Record<string, number>>({});
  useEffect(() => {
    const hits: Record<string, number> = {};
    for (const m of mine) {
      const tot = (m.score?.h ?? 0) + (m.score?.a ?? 0);
      const p = prev.current.get(m.id);
      if (p !== undefined && tot > p) hits[m.id] = Date.now();
      prev.current.set(m.id, tot);
    }
    if (Object.keys(hits).length) {
      setFlash((f) => ({ ...f, ...hits }));
      sfx.net();
      ambience.cheer();
    }
  }, [mine]);
  const progress = (m: Match) => {
    const len = m.sport === "football" ? 90 : m.sport === "hockey" ? 60 : /nba/i.test(m.comp.name) ? 48 : 40;
    const per = m.sport === "football" ? 45 : len / (m.sport === "hockey" ? 3 : 4);
    const c = m.clock;
    let e = c?.minute !== undefined ? (m.sport === "football" ? c.minute : (Math.max(1, c.period) - 1) * per + c.minute) : (now - m.kickoff) / 60000 - (m.sport === "football" && now - m.kickoff > 60 * 60000 ? 15 : 0);
    if (m.status === "break" && c?.period) e = c.period * per;
    return Math.max(2, Math.min(100, (e / len) * 100));
  };
  const flash = g.boosts.flash.filter((x) => g.matches.some((mm) => mm.id === x.matchId));
  const nBoosts = g.boosts.flash.length + g.boosts.daily.length;
  if (!mine.length && !flash.length && !nBoosts) return null;
  return (
    <div className="mb-3 space-y-2">
      {mine.length > 0 && (
        <div className="sb-mylive" aria-label="My live matches">
          {mine.map((m) => (
            <div key={`${m.id}-${flash_[m.id] ?? 0}`} className={`sb-live ${flash_[m.id] && Date.now() - flash_[m.id] < 3000 ? "is-goal" : ""}`}>
              <div className="sb-live__row">
                <span className="truncate">{m.home.name}</span>
                <b>{m.score?.h ?? 0}</b>
              </div>
              <div className="sb-live__row">
                <span className="truncate">{m.away.name}</span>
                <b>{m.score?.a ?? 0}</b>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[9.5px] font-bold text-[#ff8080]">
                <i className="sb-dot" />
                {m.clock?.label ?? "Live"}
              </div>
              <div className="sb-live__bar">
                <i style={{ width: `${progress(m)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {flash.slice(0, 1).map((x) => (
        <BoostCard key={x.id} g={g} b={x} />
      ))}
      {nBoosts > 0 && (
        <button type="button" onClick={onBoosts} className="sb-boostbar">
          <span className="sb-boostbar__icon" aria-hidden="true">🔥</span>
          <span className="min-w-0 flex-1 truncate text-left">{`${nBoosts} boosted odds today`}</span>
          <span className="sb-boostbar__go">See all →</span>
        </button>
      )}
    </div>
  );
}

/* ───────────── Boosted odds ───────────── */

/** A one-second clock for the countdowns. */
function useTick(on: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    setT(Date.now());
    const id = window.setInterval(() => setT(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [on]);
  return t;
}

const SPORT_ICON: Record<Sport, string> = { football: "⚽", basketball: "🏀", hockey: "🏒" };

function BoostLine({ g, b, m }: { g: SportsGame; b: Boost; m: Match }) {
  const on = g.inSlip.has(b.id);
  return (
    <button type="button" onClick={() => g.toggle(m, b.market, b.pick, b.label, b.kind === "flash" ? "Flash boost" : "Boosted odds")} aria-pressed={on} className={`sb-bodds is-line ${on ? "is-on" : ""}`}>
      <span className="min-w-0 flex-1 truncate text-left">{b.label}</span>
      <s>{fmtOdds(b.was)}</s>
      <span aria-hidden="true">→</span>
      <b>{fmtOdds(b.odds)}</b>
    </button>
  );
}

function BoostCard({ g, b }: { g: SportsGame; b: Boost }) {
  const m = g.matches.find((x) => x.id === b.matchId);
  const tick = useTick(b.kind === "flash");
  if (!m) return null;
  const on = g.inSlip.has(b.id);
  const t = tick || g.now || 0;
  return (
    <div className={`sb-bcard is-${b.kind}`}>
      <div className="sb-bcard__top">
        <span className="sb-bcard__tag">{b.kind === "flash" ? "⚡ Flash boost" : "🔥 Boost"}</span>
        <span className="min-w-0 truncate text-white/45">
          {SPORT_ICON[m.sport]} {m.comp.name}
        </span>
        <span className={`ml-auto shrink-0 ${b.kind === "flash" ? "sb-bcard__timer" : "text-white/55"}`} translate="no">
          {b.kind === "flash" ? `⏱ ${endsIn(b.ends, t)}` : when(m, g.now || Date.now())}
        </span>
      </div>
      <p className="sb-bcard__match">
        {m.home.name} – {m.away.name}
      </p>
      <div className="sb-bcard__row">
        <p className="sb-bcard__pick">{b.label}</p>
        <button type="button" onClick={() => g.toggle(m, b.market, b.pick, b.label, b.kind === "flash" ? "Flash boost" : "Boosted odds")} aria-pressed={on} className={`sb-bodds ${on ? "is-on" : ""}`}>
          <s>{fmtOdds(b.was)}</s>
          <span aria-hidden="true">→</span>
          <b>{fmtOdds(b.odds)}</b>
        </button>
      </div>
    </div>
  );
}

function BoostsView({ g }: { g: SportsGame }) {
  const flash = g.boosts.flash.filter((x) => g.matches.some((m) => m.id === x.matchId));
  const daily = g.boosts.daily.filter((x) => g.matches.some((m) => m.id === x.matchId));
  if (!g.loaded.football) return <p className="sb-empty">Loading matches…</p>;
  return (
    <div className="space-y-3">
      {flash.length > 0 && (
        <section>
          <p className="sb-comp !text-[#ffcf6b]">
            <span>⚡ Flash boosts</span>
            <span>Until 5 min before kick-off</span>
          </p>
          <div className="grid gap-1.5 xl:grid-cols-2">
            {flash.map((b) => (
              <BoostCard key={b.id} g={g} b={b} />
            ))}
          </div>
        </section>
      )}
      <section>
        <p className="sb-comp">🔥 Today&apos;s boosted odds</p>
        {daily.length ? (
          <div className="grid gap-1.5 xl:grid-cols-2">
            {daily.map((b) => (
              <BoostCard key={b.id} g={g} b={b} />
            ))}
          </div>
        ) : (
          <p className="sb-empty !py-6">New boosted odds arrive with the next big matches.</p>
        )}
      </section>
      <p className="sb-boostrules">
        {`Boosted odds are single bets, stake up to ◈ ${compact(BOOST_MAX_STAKE)}, no cash-out. New boosts every day; flash boosts open one hour before a big kick-off and close 5 minutes before it.`}
      </p>
    </div>
  );
}

/* ───────────── Match list ───────────── */

function useList(g: SportsGame, sport: Sport, view: View, comp: string) {
  const now = g.now || 0;
  const fav = useFavs();
  return useMemo(() => {
    const favComp = (id: string) => fav.comps.includes(compKey(sport, id));
    const favTeam = (m: Match) => fav.teams.includes(teamKey(sport, m.home.id)) || fav.teams.includes(teamKey(sport, m.away.id));
    const list = g.matches.filter((m) => m.sport === sport);
    const inView = list.filter((m) => {
      if (view === "live") return isLive(m);
      if (view === "results") return m.status === "done" || m.status === "void";
      if (m.status !== "pre") return false;
      return view === "today" ? sameDay(m.kickoff, now) : !sameDay(m.kickoff, now);
    });
    const comps = new Map<string, { id: string; name: string; country?: string; n: number; live: number }>();
    for (const m of list) {
      const c = comps.get(m.comp.id) ?? { id: m.comp.id, name: m.comp.name, country: m.comp.country, n: 0, live: 0 };
      if (m.status === "pre" || isLive(m)) c.n++;
      if (isLive(m)) c.live++;
      comps.set(m.comp.id, c);
    }
    const shown = (comp === "all" ? inView : inView.filter((m) => m.comp.id === comp)).sort((a, b) => (view === "results" ? b.kickoff - a.kickoff : a.kickoff - b.kickoff));
    const groups: { id: string; name: string; country?: string; matches: Match[]; pinned?: boolean }[] = [];
    // My teams first, then pinned competitions, then the rest.
    const mine = comp === "all" ? shown.filter(favTeam) : [];
    if (mine.length) groups.push({ id: "★teams", name: "★ My teams", matches: mine });
    for (const m of shown) {
      if (mine.includes(m)) continue;
      let grp = groups.find((x) => x.id === m.comp.id);
      if (!grp) groups.push((grp = { id: m.comp.id, name: m.comp.name, country: m.comp.country, matches: [], pinned: favComp(m.comp.id) }));
      grp.matches.push(m);
    }
    const rank = (x: (typeof groups)[number]) => (x.id === "★teams" ? 0 : x.pinned ? 1 : 2);
    groups.sort((a, b) => rank(a) - rank(b));
    const counts: Record<View, number> = {
      boosts: g.boosts.flash.length + g.boosts.daily.length,
      live: list.filter(isLive).length,
      today: list.filter((m) => m.status === "pre" && sameDay(m.kickoff, now)).length,
      upcoming: list.filter((m) => m.status === "pre" && !sameDay(m.kickoff, now)).length,
      results: list.filter((m) => m.status === "done" || m.status === "void").length,
    };
    return {
      groups,
      comps: [...comps.values()].sort((a, b) => Number(favComp(b.id)) - Number(favComp(a.id)) || b.live - a.live || b.n - a.n).map((c) => ({ ...c, fav: favComp(c.id) })),
      counts,
      total: shown.length,
    };
  }, [g.matches, g.boosts, sport, view, comp, now, fav]);
}

function MatchList({ g, sport, view, comp, lite }: { g: SportsGame; sport: Sport; view: View; comp: string; lite: boolean }) {
  const { groups } = useList(g, sport, view, comp);
  const [open, setOpen] = useState<string | null>(null);
  const err = g.errors[sport];
  if (!g.loaded[sport]) return <p className="sb-empty">Loading matches…</p>;
  if (!groups.length)
    return (
      <div className="sb-empty">
        {err ? errorText(err) : view === "live" ? "No live match right now." : view === "results" ? "No recent result." : "No match in this view."}
        {sport !== "football" && err === "missing-key" && <span className="mt-1 block text-white/35">Basketball and hockey use API_SPORTS_KEY.</span>}
      </div>
    );
  return (
    <div className="space-y-3">
      {groups.map((grp) => (
        <section key={grp.id}>
          <p className="sb-comp">
            {grp.id !== "★teams" && (
              <button type="button" onClick={() => favs.toggleComp(compKey(sport, grp.id))} className={`sb-fav ${grp.pinned ? "is-on" : ""}`} aria-pressed={Boolean(grp.pinned)} aria-label={`Pin ${grp.name}`}>
                {grp.pinned ? "★" : "☆"}
              </button>
            )}
            {grp.name}
            {grp.country && <span>{grp.country}</span>}
          </p>
          <div className="space-y-1.5">
            {grp.matches.map((m) => (
              <MatchRow key={m.id} g={g} m={m} lite={lite} open={open === m.id} onOpen={() => setOpen((o) => (o === m.id ? null : m.id))} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ───────────── Ticket (bet slip) ───────────── */

function Slip({ g, lite }: { g: SportsGame; lite: boolean }) {
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(String(g.stake)), [g.stake]);
  const n = g.slip.length;
  const builder = n === 1 && g.slip[0].market === "bb";
  const kind = n > 1 ? `Combo · ${n} picks` : builder ? "Bet builder" : n ? "Single" : "";
  const allIn = g.stake >= Math.floor(g.balance) && g.balance >= SPORTS_MIN;
  if (!n)
    return (
      <div className="sb-slip-empty">
        <span className="sb-slip-empty__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V9a2 2 0 0 0 0 4v3.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V13a2 2 0 0 0 0-4z" />
            <path d="M9 4v14" strokeDasharray="2 2" />
          </svg>
        </span>
        <p className="sb-slip-empty__title">Your ticket is empty</p>
        <p className="sb-slip-empty__text">Tap any odds to add a pick.</p>
        <ul className="sb-slip-empty__tips">
          <li>Several matches make a combo: the odds multiply.</li>
          <li>3 picks or more: combo boost on the winnings.</li>
          <li>Two picks on one football match: bet builder.</li>
        </ul>
      </div>
    );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sb-slip-head">
        <span className="sb-slip-kind">{kind}</span>
        <button type="button" onClick={g.clearSlip} className="sb-textkey">
          Clear all
        </button>
      </div>
      <div className="lux-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {g.slip.map((s) => {
          const moved = s.now !== null && s.now !== s.odds;
          const boost = s.market.startsWith("boost");
          return (
            <div key={s.key} className={`sb-sel ${s.now === null ? "is-closed" : ""} ${s.live ? "is-live" : ""} ${boost ? "is-boost" : ""}`}>
              <div className="min-w-0 flex-1">
                {s.market === "bb" ? (
                  <>
                    <p className="sb-sel__market">Bet builder</p>
                    {s.label.split(" + ").map((x) => (
                      <p key={x} className="sb-sel__pick">
                        · {x}
                      </p>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="sb-sel__pick">{s.label}</p>
                    <p className="sb-sel__market">{s.marketTitle}</p>
                  </>
                )}
                <p className="sb-sel__match">
                  {s.live && <span className="sb-sel__live">Live</span>}
                  {s.matchLabel}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end justify-between gap-1">
                <button type="button" onClick={() => g.removeSel(s.key)} className="sb-sel__x" aria-label="Remove pick">
                  ✕
                </button>
                <span className={`sb-sel__odds ${moved ? (s.now! > s.odds ? "is-up" : "is-down") : ""}`}>
                  {moved && <small>{fmtOdds(s.odds)}</small>}
                  {s.now === null ? "Closed" : fmtOdds(s.now)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sb-slip-foot">
        <div className={`flex items-center gap-1 overflow-x-auto [scrollbar-width:none] ${lite ? "" : "justify-between"}`} role="radiogroup" aria-label="Stake">
          {SPORT_CHIPS.map((v) => (
            <button key={v} type="button" role="radio" aria-checked={g.stake === v} onClick={() => g.setStake(v)} className={`rl-chip-pick relative aspect-square shrink-0 rounded-full ${lite ? "w-[2.3rem]" : "w-[clamp(1.45rem,1.75vw,2rem)]"} ${g.stake === v ? "is-selected" : ""}`}>
              <ChipFace value={v} />
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <label className="sb-stake min-w-0 flex-1">
            <span>Stake</span>
            <b aria-hidden="true">◈</b>
            <input
              inputMode="numeric"
              value={typed}
              onChange={(e) => setTyped(e.target.value.replace(/[^\d]/g, "").slice(0, 13))}
              onBlur={() => g.setStake(+typed || SPORTS_MIN)}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              aria-label={`Stake, from ${SPORTS_MIN}`}
            />
          </label>
          <button type="button" onClick={g.halfStake} className="pr-btn is-ghost is-sm !px-2.5">
            ½
          </button>
          <button type="button" onClick={g.doubleStake} className="pr-btn is-ghost is-sm !px-2.5">
            2×
          </button>
          <button type="button" onClick={g.allIn} className={`pr-btn is-sm !px-2.5 ${allIn ? "" : "is-ghost"}`}>
            All in
          </button>
        </div>
        {(g.slipHasBoost || (n > 1 && (g.slipBoost > 0 || g.slipInsured || n < 3))) && (
          <div className="sb-perks">
            {g.slipHasBoost && <span className="sb-perk is-boost">{`Boosted odds · single bet · max ◈ ${compact(BOOST_MAX_STAKE)} · no cash-out`}</span>}
            {n > 1 && (g.slipBoost > 0 ? <span className="sb-perk is-on">Combo boost +{Math.round(g.slipBoost * 100)}%</span> : <span className="sb-perk">3 picks → +5% boost</span>)}
            {n > 1 && (g.slipInsured ? <span className="sb-perk is-on">Insured · 1 miss refunded</span> : n >= 3 && <span className="sb-perk">5 picks → insurance</span>)}
          </div>
        )}
        <dl className="sb-receipt">
          <div>
            <dt>Total odds</dt>
            <dd>{fmtOdds(g.slipOdds)}</dd>
          </div>
          <div>
            <dt>Stake</dt>
            <dd>◈ {money(g.stake)}</dd>
          </div>
          <div className="is-total">
            <dt>{g.potential >= MAX_PAYOUT ? "Max win" : "Potential win"}</dt>
            <dd>◈ {money(g.potential)}</dd>
          </div>
        </dl>
        <button type="button" onClick={g.place} className={`sb-place ${g.slipChanged ? "is-changed" : ""}`}>
          <span className="sb-place__main">{g.slipChanged ? "Accept new odds" : n > 1 ? "Place combo" : "Place bet"}</span>
          <span className="sb-place__sub">{g.slipChanged ? "The odds moved — check them first" : `◈ ${compact(g.stake)} to win ◈ ${compact(g.potential)}`}</span>
        </button>
        {g.slip.some((x) => x.live) && <p className="sb-note">Live bets are confirmed after a 12-second check of the score.</p>}
      </div>
    </div>
  );
}

function useSeconds(on: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    setT(Date.now());
    const id = window.setInterval(() => setT(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [on]);
  return t;
}

const STATE: Record<Ticket["status"], string> = {
  open: "Open",
  pending: "Checking",
  won: "Won",
  lost: "Lost",
  cashed: "Cashed out",
  refund: "Refunded · insurance",
  void: "Void · refunded",
  declined: "Declined · refunded",
};

function TicketCard({ g, t }: { g: SportsGame; t: Ticket }) {
  const waiting = t.status === "pending" || !!t.cashing;
  const now = useSeconds(waiting);
  const co = t.status === "open" && !t.cashing ? g.cashOutValue(t) : null;
  const potential = Math.min(MAX_PAYOUT, Math.floor(t.stake * t.odds + (t.stake * t.odds - t.stake) * (t.boost ?? 0)));
  const left = (until?: number) => Math.max(0, Math.ceil(((until ?? 0) - (now || Date.now())) / 1000));
  const settled = t.status !== "open" && t.status !== "pending";
  return (
    <div className={`sb-ticket is-${t.status}`}>
      <div className="sb-ticket__head">
        <span className={`sb-ticket__state is-${t.status}`}>
          {t.status === "pending" && <i className="sb-spin" aria-hidden="true" />}
          {t.status === "pending" ? `Checking · ${left(t.accept?.until)} s` : STATE[t.status]}
        </span>
        <span className="sb-ticket__meta">
          {`${t.legs.length > 1 ? `Combo · ${t.legs.length}` : "Single"} · @ ${fmtOdds(t.odds)}${t.boost ? ` · +${Math.round(t.boost * 100)}%` : ""}${t.insured ? " · insured" : ""}`}
        </span>
      </div>
      <ul className="sb-ticket__legs">
        {t.legs.map((l) => (
          <li key={l.key}>
            <i className={`sb-leg ${l.result ? `is-${l.result}` : ""}`} />
            <span className="min-w-0 flex-1">
              <b>{l.label}</b>
              <span className="sb-ticket__match">
                {l.live && <em>Live · </em>}
                {l.matchLabel}
              </span>
            </span>
            <span className="sb-ticket__odds">{l.final ?? fmtOdds(l.odds)}</span>
          </li>
        ))}
      </ul>
      <div className="sb-ticket__foot">
        <div>
          <p className="sb-ticket__k">Stake</p>
          <p className="sb-ticket__v">◈ {money(t.stake)}</p>
        </div>
        <div className="text-right">
          <p className="sb-ticket__k">{settled ? (t.status === "won" || t.status === "cashed" ? "Paid" : t.payout ? "Returned" : "Return") : "To win"}</p>
          <p className={`sb-ticket__v ${t.payout > t.stake ? "is-gold" : ""}`}>{settled ? (t.payout ? `◈ ${money(t.payout)}` : "—") : `◈ ${compact(potential)}`}</p>
        </div>
      </div>
      {t.status === "open" &&
        (t.cashing ? (
          <button type="button" disabled className="pr-btn is-ghost is-sm mt-2 w-full">
            <i className="sb-spin" aria-hidden="true" />
            {`Cash-out · checking ${left(t.cashing.until)} s`}
          </button>
        ) : co !== null ? (
          <button type="button" onClick={() => g.cashOut(t.id)} className="pr-btn is-sm mt-2 w-full">
            {`Cash out ◈ ${compact(co)}`}
          </button>
        ) : null)}
      {(t.status === "open" || t.status === "won" || t.status === "cashed") && (
        <button type="button" onClick={() => shareTicket(t)} className="sb-textkey mt-1.5">
          Share ticket ↗
        </button>
      )}
    </div>
  );
}

function MyBets({ g }: { g: SportsGame }) {
  const s = useSession().sports;
  const [tab, setTab] = useState<"open" | "settled">("open");
  const open = g.tickets.filter((t) => t.status === "open" || t.status === "pending").reverse();
  const done = g.tickets.filter((t) => t.status !== "open" && t.status !== "pending").reverse().slice(0, 40);
  useEffect(() => {
    g.markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const list = tab === "open" ? open : done;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {(
          [
            ["Tickets today", String(s.spins), ""],
            ["Net today", `${s.net >= 0 ? "+" : "−"}◈ ${compact(Math.abs(s.net))}`, s.net > 0 ? "is-up" : s.net < 0 ? "is-down" : ""],
            ["Best", `◈ ${compact(Math.max(0, s.biggest))}`, ""],
          ] as const
        ).map(([l, v, c]) => (
          <div key={l} className="sb-kpi">
            <p className="sb-kpi__k">{l}</p>
            <p className={`sb-kpi__v ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "open"} onClick={() => setTab("open")} className={`st-chip flex-1 justify-center ${tab === "open" ? "is-on" : ""}`}>
          {`Open · ${open.length}`}
        </button>
        <button type="button" role="tab" aria-selected={tab === "settled"} onClick={() => setTab("settled")} className={`st-chip flex-1 justify-center ${tab === "settled" ? "is-on" : ""}`}>
          {`Settled · ${done.length}`}
        </button>
      </div>
      <div className="lux-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {!list.length && <p className="sb-empty !py-8">{tab === "open" ? "No open ticket." : "No settled ticket yet."}</p>}
        {list.map((t) => (
          <TicketCard key={t.id} g={g} t={t} />
        ))}
        <p className="pb-1 pt-1 text-center text-[9.5px] leading-relaxed text-white/30">Virtual chips only — no real money. Odds by the Chrysonyx model. Data: football-data.org, API-Sports.</p>
      </div>
    </div>
  );
}

/* ───────────── Game ───────────── */

export default function Sportsbook({ active, focus = false, onFocusChange }: { active: boolean; focus?: boolean; onFocusChange?: (v: boolean) => void }) {
  const desktop = useDesktop();
  const g = useSportsbook(active);
  const [sport, setSport] = useState<Sport>("football");
  const [view, setView] = useState<View>("today");
  const [comp, setComp] = useState("all");
  const [side, setSide] = useState<"slip" | "bets">("slip");
  const [sheet, setSheet] = useState<null | "slip" | "bets">(null);
  const { counts, comps } = useList(g, sport, view, comp);

  // Open on Live when something is on.
  const picked = useRef(false);
  useEffect(() => {
    if (picked.current || !g.loaded.football) return;
    picked.current = true;
    if (g.matches.some((m) => m.sport === "football" && isLive(m))) setView("live");
  }, [g.loaded.football, g.matches]);
  useEffect(() => setComp("all"), [sport]);

  // ---- Focus (instant, like the other games)
  const closeRef = useRef(onFocusChange);
  closeRef.current = onFocusChange;
  useEffect(() => {
    if (!focus) return;
    const root = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const wasFullscreen = Boolean(document.fullscreenElement);
    const cancelFs = isNarrowScreen() ? () => {} : requestFullscreenSettled(() => {});
    let entered = false;
    const onFsChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered && !wasFullscreen) closeRef.current?.(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector("[role=dialog][aria-modal=true]")) closeRef.current?.(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelFs();
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      void root;
      if (!wasFullscreen && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    };
  }, [focus]);
  // F toggles focus, like the other games.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || (t && t.closest("input, textarea, select, [contenteditable]"))) return;
      if (e.key.toLowerCase() === "f") window.dispatchEvent(new CustomEvent("royal-ace:toggle-focus"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const messageLine = (
    <p key={g.refused} className={`rl-message truncate ${g.refused ? "rl-shake" : ""}`} role="status">
      {g.message || (g.demo ? "Demo fixtures" : "Pick your odds")}
    </p>
  );
  const sportTabs = (cls: string) =>
    SPORTS.map((s) => {
      const live = g.matches.filter((m) => m.sport === s.id && isLive(m)).length;
      return (
        <button key={s.id} type="button" onClick={() => { setSport(s.id); if (view === "boosts") setView("today"); }} aria-pressed={sport === s.id && view !== "boosts"} className={`sb-sport ${cls} ${sport === s.id && view !== "boosts" ? "is-on" : ""}`}>
          <span aria-hidden="true">{s.icon}</span>
          <span>{s.label}</span>
          {live > 0 && <em>{live}</em>}
        </button>
      );
    });
  const viewTabs = desktop ? (
    <div className="rl-tabs sb-views !grid-cols-5" role="tablist">
      {VIEWS.map((v) => (
        <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={`rl-tab ${view === v.id ? "is-on" : ""}`}>
          {v.id === "boosts" && <span aria-hidden="true">🔥 </span>}
          {v.label}
          {counts[v.id] > 0 && <span className="ml-1 opacity-60">{counts[v.id]}</span>}
        </button>
      ))}
    </div>
  ) : (
    // Phones: a row of chips, swiped with a finger.
    <div className="sb-viewchips" role="tablist">
      {VIEWS.map((v) => (
        <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={`st-chip ${view === v.id ? "is-on" : ""} ${v.id === "boosts" ? "is-boost" : ""}`}>
          {v.id === "boosts" && <span aria-hidden="true">🔥</span>}
          <span>{v.label}</span>
          {counts[v.id] > 0 && <em>{counts[v.id]}</em>}
        </button>
      ))}
    </div>
  );
  const demoNote = g.demo && (
    <p className="sb-demo">Demo fixtures — real matches appear once the API keys are set in Vercel.</p>
  );
  const frame = (lite: boolean) =>
    `rl-root sb-root ${lite ? "m-lite" : ""} ${focus ? "fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-black" : lite ? "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[500px]" : "h-[calc(100dvh_-_10.15rem_-_env(safe-area-inset-top))] min-h-[540px] lg:h-[calc(100dvh-10rem)]"}`;
  const exitKey = focus && (
    <button
      type="button"
      onClick={() => onFocusChange?.(false)}
      aria-label="Exit focus mode"
      style={{ top: "max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
      className="fixed right-4 z-[61] flex h-9 items-center gap-1.5 rounded-full border border-[#d7b45b]/50 bg-black/85 px-3 text-[11px] font-bold uppercase tracking-wider text-[#e5c779]"
    >
      ✕ <span>Exit</span>
    </button>
  );

  // ---- PC
  if (desktop) {
    return (
      <div data-theme="carbon" className={frame(false)}>
        {exitKey}
        <section className={`rl-stage relative flex h-full flex-col overflow-hidden ${focus ? "" : "rounded-3xl border border-white/10"}`}>
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)_minmax(0,clamp(17rem,24vw,22rem))] gap-4 px-5 pb-4 pt-5 xl:gap-5">
            <aside className="flex min-h-0 flex-col gap-3">
              <div className="rl-plaque mx-auto flex flex-col items-center px-5 py-2 text-center">
                <span className="font-display gold-text text-[17px] font-bold tracking-[0.28em]">SPORTSBOOK</span>
                <span className="text-[8.5px] font-bold tracking-[0.3em] text-white/45">REAL MATCHES · LIVE</span>
              </div>
              <div className="flex flex-col gap-1.5">{sportTabs("")}</div>
              <div className="rl-card flex min-h-0 flex-1 flex-col p-2.5">
                <p className="rl-eyebrow mb-1.5 !text-[9px]">Competitions</p>
                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
                  <button type="button" onClick={() => setComp("all")} className={`sb-compkey ${comp === "all" ? "is-on" : ""}`}>
                    <span className="truncate">All competitions</span>
                  </button>
                  {comps.map((c) => (
                    <button key={c.id} type="button" onClick={() => setComp(c.id)} className={`sb-compkey ${comp === c.id ? "is-on" : ""}`}>
                      {c.fav && <span className="text-[#f5d778]">★</span>}
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      {c.live > 0 && <i className="sb-dot" />}
                      <span className="text-white/35">{c.n}</span>
                    </button>
                  ))}
                  {!comps.length && <p className="px-1 text-[11px] text-white/35">—</p>}
                </div>
              </div>
            </aside>
            <div className="flex min-h-0 flex-col gap-3">
              <div className={`flex items-center justify-between gap-3 ${focus ? "pr-24" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="rl-announce max-w-full">{messageLine}</div>
                </div>
                <div className="rl-window rl-window--sm !min-w-[9rem] !py-1">
                  <span className="rl-window__label">Credit</span>
                  <span className="rl-window__value">
                    <span className="rl-window__cur">◈</span>
                    <Counter value={g.balance} />
                  </span>
                </div>
              </div>
              {viewTabs}
              {demoNote}
              <div className="sb-list min-h-0 flex-1 overflow-y-auto pr-1">
                {view === "boosts" ? (
                  <BoostsView g={g} />
                ) : (
                  <>
                    <Highlights g={g} onBoosts={() => setView("boosts")} />
                    <MatchList g={g} sport={sport} view={view} comp={comp} lite={false} />
                  </>
                )}
              </div>
            </div>
            <aside className="rl-card flex min-h-0 flex-col p-3">
              <div className="rl-tabs !grid-cols-2" role="tablist">
                <button type="button" role="tab" aria-selected={side === "slip"} onClick={() => setSide("slip")} className={`rl-tab ${side === "slip" ? "is-on" : ""}`}>
                  Ticket{g.slip.length ? ` · ${g.slip.length}` : ""}
                </button>
                <button type="button" role="tab" aria-selected={side === "bets"} onClick={() => setSide("bets")} className={`rl-tab ${side === "bets" ? "is-on" : ""}`}>
                  My bets{g.openCount ? ` · ${g.openCount}` : ""}
                  {g.unseen > 0 && <i className="sb-badge">{g.unseen}</i>}
                </button>
              </div>
              <div className="mt-2.5 flex min-h-0 flex-1 flex-col">{side === "slip" ? <Slip g={g} lite={false} /> : <MyBets g={g} />}</div>
            </aside>
          </div>
        </section>
      </div>
    );
  }

  // ---- Phones / tablets (light version)
  return (
    <div data-theme="carbon" className={frame(true)}>
      {exitKey}
      <section
        className={`rl-stage relative flex h-full flex-col overflow-hidden ${focus ? "" : "rounded-3xl border border-white/10"}`}
        style={focus ? { paddingTop: "max(3.25rem, calc(env(safe-area-inset-top) + 3rem))" } : undefined}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-2 pt-2">
          <div className="grid grid-cols-3 gap-1">{sportTabs("is-sm")}</div>
          {viewTabs}
          <div className="flex h-5 items-center justify-center">{messageLine}</div>
          {demoNote}
          <div className="sb-list min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {view === "boosts" ? (
              <BoostsView g={g} />
            ) : (
              <>
                <Highlights g={g} onBoosts={() => setView("boosts")} />
                <MatchList g={g} sport={sport} view={view} comp="all" lite />
              </>
            )}
          </div>
        </div>
        <div className="rl-console grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 px-2 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}>
          <button type="button" onClick={() => setSheet("slip")} className={`rl-spin !flex-row !justify-between !px-3 !py-2 ${g.slip.length ? "is-ready" : ""}`}>
            <span className="text-[12px] !tracking-[0.1em]">TICKET · {g.slip.length}</span>
            <span className="text-[11px] font-black !tracking-[0.06em]">{g.slip.length ? `×${fmtOdds(g.slipOdds)} · ◈ ${compact(g.potential)}` : "Tap odds"}</span>
          </button>
          <button type="button" onClick={() => setSheet("bets")} className="rl-key relative !h-auto px-3">
            My bets{g.openCount ? ` · ${g.openCount}` : ""}
            {g.unseen > 0 && <i className="sb-badge">{g.unseen}</i>}
          </button>
        </div>
      </section>
      {sheet && <Sheet g={g} tab={sheet} setTab={setSheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Sheet({ g, tab, setTab, onClose }: { g: SportsGame; tab: "slip" | "bets"; setTab: (t: "slip" | "bets") => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tabs: [typeof tab, ReactNode][] = [
    ["slip", `Ticket${g.slip.length ? ` · ${g.slip.length}` : ""}`],
    ["bets", `My bets${g.openCount ? ` · ${g.openCount}` : ""}`],
  ];
  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div role="dialog" aria-modal="true" aria-label="Bet slip" className="rl-sheet absolute inset-x-0 bottom-0 flex h-[78dvh] flex-col">
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="rl-tabs !grid-cols-2 flex-1" role="tablist">
            {tabs.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rl-tab ${tab === id ? "is-on" : ""}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="rl-icon-key" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mt-1.5 truncate px-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9dcb8]" role="status">
          {g.message}
        </p>
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">{tab === "slip" ? <Slip g={g} lite /> : <MyBets g={g} />}</div>
      </div>
    </div>
  );
}
