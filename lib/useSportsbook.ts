"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HAPTIC, haptic } from "./haptics";
import { sfx } from "./sound";
import { track } from "./events";
import { sessionStore } from "./sessionStore";
import { useBalance, wallet } from "./wallet";
import { demoForms, demoMatches } from "./sports/demo";
import { isOpen, modelOf, parsePlayerMarket, playerProb, priceOf, probOf, settle, type PlayerLine } from "./sports/odds";
import type { Feed, Match, Sport, Standings, StandingsFeed } from "./sports/types";

/**
 * Sports betting with virtual chips on real matches.
 * - The stake leaves the credit when the ticket is placed.
 * - A ticket of several picks is a combo: odds multiply, one lost pick loses it.
 * - Tickets settle on the official result as soon as the feed has it,
 *   even while another game is open (the page keeps this game mounted).
 * - Cash-out: the model's chance of winning × potential return, minus 8%.
 */

export const SPORTS_MIN = 10;
export const SPORTS_MAX = 100000;
export const MAX_PICKS = 10;
export const MAX_PAYOUT = 10_000_000;
export const SPORT_CHIPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];
const CASHOUT_CUT = 0.92;

export type Selection = {
  key: string; // matchId|market|pick
  matchId: string;
  sport: Sport;
  market: string;
  pick: string;
  label: string; // what was picked
  marketTitle: string;
  matchLabel: string; // "Arsenal – Chelsea"
  kickoff: number;
  odds: number;
  live: boolean;
  /** Player bets: his season line when the bet was placed (settles on the change). */
  snap?: { teamId: string; comp: string; played: number; goals: number; assists: number };
};
export type Leg = Selection & { result: "won" | "lost" | "void" | null; final?: string };
export type Ticket = {
  id: number;
  at: number;
  stake: number;
  odds: number; // total at placement
  legs: Leg[];
  status: "open" | "won" | "lost" | "void" | "cashed";
  payout: number;
  settledAt?: number;
  seen?: boolean;
};
type Saved = { tickets: Ticket[]; slip: Selection[]; stake: number; nextId: number; pending: boolean };
const KEY = "royalace:sports";
const FORMS_KEY = "royalace:sports-forms";
const RESULTS_KEY = "royalace:sports-results";
function pastResults(sport: Sport): Match[] {
  try {
    return Object.values(JSON.parse(localStorage.getItem(RESULTS_KEY) ?? "{}") as Record<string, Match>).filter((m) => m.sport === sport);
  } catch {
    return [];
  }
}
const EMPTY: Saved = { tickets: [], slip: [], stake: 100, nextId: 1, pending: false };

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Saved> | null;
    if (!s) return { ...EMPTY };
    const tickets: Ticket[] = Array.isArray(s.tickets) ? s.tickets.slice(-150) : [];
    return {
      tickets,
      slip: Array.isArray(s.slip) ? s.slip.slice(0, MAX_PICKS) : [],
      stake: Math.min(SPORTS_MAX, Math.max(SPORTS_MIN, s.stake ?? 100)),
      nextId: s.nextId ?? 1,
      pending: tickets.some((t) => t.status === "open"),
    };
  } catch {
    return { ...EMPTY };
  }
}

/**
 * A player bet is settled by comparing his season line with the one saved
 * when the bet was placed: one more appearance, and goals / assists added
 * (or not). Anything unclear is refunded: he did not appear, the table
 * did not move before his team played again, or two days went by.
 */
function settlePlayer(
  m: Match,
  kind: "scorer" | "assist" | "decisive",
  id: string,
  snap: NonNullable<Selection["snap"]>,
  players: PlayerLine[] | undefined,
  all: Match[],
  now: number,
): Leg["result"] {
  if (m.status === "void") return "void";
  if (m.status !== "done") return null;
  const p = players?.find((x) => x.id === id);
  if (p) {
    if (p.played === snap.played + 1) {
      const scored = p.goals > snap.goals;
      const assisted = p.assists > snap.assists;
      const ok = kind === "scorer" ? scored : kind === "assist" ? assisted : scored || assisted;
      return ok ? "won" : "lost";
    }
    if (p.played > snap.played + 1) return "void";
  }
  const later = all.some((x) => x.sport === "football" && (x.home.id === snap.teamId || x.away.id === snap.teamId) && x.kickoff > m.kickoff && x.status !== "pre");
  if (later || now > m.kickoff + 60 * 3600000) return "void";
  return null;
}

const day = (t: number) => new Date(t).toISOString().slice(0, 10);
const comboOdds = (legs: { odds: number; result?: Leg["result"] }[]) =>
  Math.round(legs.reduce((p, l) => p * (l.result === "void" ? 1 : l.odds), 1) * 100) / 100;

type FormsCache = Record<string, { at: number; teams: Standings }>;

export function useSportsbook(active: boolean) {
  const balance = useBalance();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState<Record<Sport, boolean>>({ football: false, basketball: false, hockey: false });
  const [errors, setErrors] = useState<Partial<Record<Sport, string>>>({});
  const [demo, setDemo] = useState(false);
  const [forms, setForms] = useState<FormsCache>({});
  const [scorers, setScorers] = useState<Record<string, { at: number; players: PlayerLine[] }>>({});
  const [now, setNow] = useState(0);
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [message, setMessage] = useState("");
  const [refused, setRefused] = useState(0);
  const savedRef = useRef<Saved>(EMPTY);
  const hydrated = useRef(false);

  const commit = useCallback((next: Saved) => {
    next = { ...next, pending: next.tickets.some((t) => t.status === "open") };
    savedRef.current = next;
    setSaved(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);
  const refuse = (why: string) => {
    setMessage(why);
    setRefused((n) => n + 1);
    haptic(HAPTIC.tick);
    return false;
  };

  // ---- Restore
  useEffect(() => {
    const s = load();
    savedRef.current = s;
    setSaved(s);
    hydrated.current = true;
    try {
      setForms(JSON.parse(localStorage.getItem(FORMS_KEY) ?? "{}") as FormsCache);
    } catch {}
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, []);

  // ---- Feeds
  const wantDemo = useRef(false);
  const fetchFeed = useCallback(async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`http-${res.status}`);
    return res.json();
  }, []);

  const byId = useRef(new Map<string, Match>());
  const merge = useCallback((sport: Sport, list: Match[]) => {
    setMatches((prev) => {
      const keep = prev.filter((m) => m.sport !== sport);
      const next = [...keep, ...list].sort((a, b) => a.kickoff - b.kickoff);
      byId.current = new Map(next.map((m) => [m.id, m]));
      return next;
    });
    setLoaded((l) => ({ ...l, [sport]: true }));
  }, []);

  const startDemo = useCallback(() => {
    wantDemo.current = true;
    setDemo(true);
    const t = Date.now();
    const list = demoMatches(t);
    (["football", "basketball", "hockey"] as Sport[]).forEach((s) => merge(s, list.filter((m) => m.sport === s)));
    setErrors({});
  }, [merge]);

  const loadFootball = useCallback(async () => {
    if (wantDemo.current) return startDemo();
    try {
      const f = (await fetchFeed("/api/sports?feed=football")) as Feed;
      if (f.error) throw new Error(f.error);
      merge("football", f.matches);
      setErrors((e) => ({ ...e, football: undefined }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      setErrors((x) => ({ ...x, football: msg }));
      setLoaded((l) => ({ ...l, football: true }));
      return msg;
    }
    return null;
  }, [fetchFeed, merge, startDemo]);

  const loadOther = useCallback(
    async (sport: "basketball" | "hockey") => {
      if (wantDemo.current) return;
      const t = Date.now();
      const dates = [day(t - 86400000), day(t), day(t + 86400000)];
      try {
        const feeds = (await Promise.all(dates.map((d) => fetchFeed(`/api/sports?feed=${sport}&date=${d}`)))) as Feed[];
        const err = feeds.find((f) => f.error)?.error;
        const list = feeds.flatMap((f) => f.matches ?? []);
        if (err && !list.length) throw new Error(err);
        // A game can sit in two UTC days: keep one copy.
        const uniq = new Map(list.map((m) => [m.id, m]));
        merge(sport, [...uniq.values()]);
        setErrors((e) => ({ ...e, [sport]: undefined }));
      } catch (e) {
        setErrors((x) => ({ ...x, [sport]: e instanceof Error ? e.message : "error" }));
        setLoaded((l) => ({ ...l, [sport]: true }));
      }
    },
    [fetchFeed, merge],
  );

  // First load, then polling. Fast while the game is open and live,
  // slow in the background (only to settle open tickets).
  const hasLive = matches.some((m) => m.status === "live" || m.status === "break");
  const pending = saved.pending;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!active && !pending) return;
    let stop = false;
    (async () => {
      const local = location.protocol === "file:" || new URLSearchParams(location.search).has("demo");
      if (local) startDemo();
      else {
        const err = await loadFootball();
        // No keys yet (or the route is unreachable): show the demo, clearly labelled.
        if (err && (err === "missing-key" || err.startsWith("http-404"))) startDemo();
        else {
          loadOther("basketball");
          loadOther("hockey");
        }
      }
      if (!stop) setReady(true);
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active || pending]);
  useEffect(() => {
    if (!ready || (!active && !pending)) return;
    const fbEvery = active ? (hasLive ? 20000 : 60000) : 120000;
    const a = window.setInterval(() => {
      if (document.hidden) return;
      loadFootball();
    }, fbEvery);
    const b = window.setInterval(() => {
      if (document.hidden) return;
      loadOther("basketball");
      loadOther("hockey");
    }, active ? 5 * 60000 : 10 * 60000);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
    };
  }, [ready, active, pending, hasLive, loadFootball, loadOther]);

  // ---- Team strength (league tables), cached 12 h in the browser.
  const formKey = (m: Match) => `${m.sport}:${m.comp.id}:${m.sport === "football" ? "" : m.comp.season ?? ""}`;
  const asking = useRef(new Set<string>());
  useEffect(() => {
    if (!active || !matches.length) return;
    const t = Date.now();
    const need = [...new Map<string, Match>(matches.filter((m: Match) => m.status !== "done" && m.status !== "void").map((m: Match) => [formKey(m), m] as [string, Match])).values()].filter((m) => {
      const k = formKey(m);
      const c = forms[k];
      return (!c || t - c.at > 12 * 3600000) && !asking.current.has(k);
    });
    if (!need.length) return;
    let stop = false;
    const save = (k: string, teams: Standings) =>
      setForms((prev) => {
        const next = { ...prev, [k]: { at: Date.now(), teams } };
        try {
          localStorage.setItem(FORMS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    (async () => {
      const history = new Set<Sport>();
      for (const m of need) {
        if (stop) return;
        const k = formKey(m);
        asking.current.add(k);
        let teams: Standings = {};
        if (!demo && m.sport !== "football") {
          // The free plan has no tables and no history for basketball and
          // hockey (yesterday to tomorrow only): team form is built from the
          // results this browser has collected over the last three weeks.
          if (history.has(m.sport)) continue;
          history.add(m.sport);
          const done = [...pastResults(m.sport), ...matches.filter((x) => x.sport === m.sport)].filter((x) => x.status === "done" && x.score);
          const byKey = new Map<string, Record<string, { n: number; f: number; a: number; w: number }>>();
          const seen = new Set<string>();
          for (const x of done) {
            if (seen.has(x.id)) continue;
            seen.add(x.id);
            const kk = formKey(x);
            const tbl = byKey.get(kk) ?? {};
            const sc = x.score as { h: number; a: number };
            for (const [id, f, a] of [
              [x.home.id, sc.h, sc.a],
              [x.away.id, sc.a, sc.h],
            ] as [string, number, number][]) {
              const r = tbl[id] ?? { n: 0, f: 0, a: 0, w: 0 };
              tbl[id] = { n: r.n + 1, f: r.f + f, a: r.a + a, w: r.w + (f > a ? 1 : 0) };
            }
            byKey.set(kk, tbl);
          }
          const keys = new Set([...byKey.keys(), ...need.filter((x) => x.sport === m.sport).map(formKey)]);
          for (const kk of keys) {
            const tbl = byKey.get(kk) ?? {};
            const out: Standings = {};
            for (const [id, r] of Object.entries(tbl)) out[id] = { played: r.n, scored: r.f / r.n, conceded: r.a / r.n, winPct: r.w / r.n };
            save(kk, out);
          }
          continue;
        }
        if (demo) {
          teams = demoForms(matches.filter((x) => formKey(x) === k).flatMap((x) => [x.home.id, x.away.id]), m.sport);
        } else {
          try {
            const url = `/api/sports?feed=football-standings&comp=${m.comp.id}`;
            const f = (await fetchFeed(url)) as StandingsFeed;
            if (f.error) {
              asking.current.delete(k);
              continue;
            }
            teams = f.teams;
          } catch {
            asking.current.delete(k);
            continue;
          }
          // Spread the calls (football-data: 10 a minute).
          await new Promise((r) => setTimeout(r, 7000));
        }
        save(k, teams);
      }
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, matches, demo]);

  // Keep finished basketball / hockey results (21 days) for team form.
  useEffect(() => {
    if (demo || !matches.length) return;
    const done = matches.filter((m) => m.sport !== "football" && m.status === "done" && m.score);
    if (!done.length) return;
    try {
      const store = JSON.parse(localStorage.getItem(RESULTS_KEY) ?? "{}") as Record<string, Match>;
      const limit = Date.now() - 21 * 86400000;
      let changed = false;
      for (const m of done)
        if (!store[m.id]) {
          store[m.id] = { ...m, clock: undefined, ht: null };
          changed = true;
        }
      for (const [id, m] of Object.entries(store))
        if (m.kickoff < limit) {
          delete store[id];
          changed = true;
        }
      if (changed) localStorage.setItem(RESULTS_KEY, JSON.stringify(store));
    } catch {}
  }, [matches, demo]);

  const formsOf = useCallback((m: Match) => forms[formKey(m)]?.teams, [forms]);

  // ---- Players (football): the competition's leading scorers and assisters.
  const scorersAsk = useRef(new Map<string, number>());
  const loadScorers = useCallback(
    async (comp: string, maxAge = 60 * 60000) => {
      if (demo) return;
      const last = scorersAsk.current.get(comp) ?? 0;
      if (Date.now() - last < Math.min(maxAge, 10 * 60000)) return;
      scorersAsk.current.set(comp, Date.now());
      try {
        const f = (await fetchFeed(`/api/sports?feed=football-scorers&comp=${encodeURIComponent(comp)}`)) as { players?: PlayerLine[]; error?: string };
        if (f.error || !Array.isArray(f.players)) return;
        setScorers((prev) => ({ ...prev, [comp]: { at: Date.now(), players: f.players as PlayerLine[] } }));
      } catch {}
    },
    [demo, fetchFeed],
  );
  const playersFor = useCallback(
    (m: Match): PlayerLine[] => {
      if (m.sport !== "football") return [];
      const list = scorers[m.comp.id]?.players ?? [];
      const pick = (teamId: string) =>
        list
          .filter((p) => p.teamId === teamId && p.played >= 3)
          .sort((a, b) => b.goals + b.assists * 0.6 - (a.goals + a.assists * 0.6))
          .slice(0, 6);
      return [...pick(m.home.id), ...pick(m.away.id)];
    },
    [scorers],
  );
  const playerOf = (m: Match, id: string) => (scorers[m.comp.id]?.players ?? []).find((p) => p.id === id);
  const teamAvg = (m: Match, teamId: string) => formsOf(m)?.[teamId]?.scored;
  /** Fair chance of any pick, team or player market. */
  const chanceOf = (m: Match, market: string, pick: string, t: number): number | null => {
    const model = modelOf(m, formsOf(m), t);
    const pm = parsePlayerMarket(market);
    if (pm) {
      if (m.status !== "pre" || t >= m.kickoff) return null;
      const p = playerOf(m, pm.id);
      return p ? playerProb(model, m, p, pm.kind, teamAvg(m, p.teamId)) : null;
    }
    return model ? probOf(model, m.sport, market, pick) : null;
  };
  const modelFor = useCallback((m: Match) => modelOf(m, formsOf(m), now || Date.now()), [formsOf, now]);

  /** Current odds of one pick (null: closed). */
  const oddsNow = useCallback(
    (m: Match, market: string, pick: string) => {
      const t = now || Date.now();
      if (!isOpen(m, t)) return null;
      return priceOf(chanceOf(m, market, pick, t), market);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formsOf, now, scorers],
  );

  // ---- Settlement: as soon as the feeds carry the results.
  useEffect(() => {
    if (!hydrated.current || !matches.length) return;
    const s = savedRef.current;
    if (!s.pending) return;
    const t = Date.now();
    let changed = false;
    let paid = 0;
    const done: Ticket[] = [];
    const tickets = s.tickets.map((tk) => {
      if (tk.status !== "open") return tk;
      const legs = tk.legs.map((l) => {
        if (l.result) return l;
        const m = byId.current.get(l.matchId);
        let r: Leg["result"] = null;
        let final: string | undefined;
        const pm = parsePlayerMarket(l.market);
        if (m && pm && l.snap) {
          r = settlePlayer(m, pm.kind, pm.id, l.snap, scorers[l.snap.comp]?.players, matches, t);
          if (r === "won" || r === "lost") final = r === "won" ? "✓" : "✗";
        } else if (m) {
          r = settle(m, l.market, l.pick);
          const fs = m.regular ?? m.score;
          if (r && fs) final = `${fs.h}-${fs.a}`;
        } else if (loaded[l.sport] && !errors[l.sport] && t > l.kickoff + 48 * 3600000) r = "void"; // never got a result
        if (r) changed = true;
        return r ? { ...l, result: r, final } : l;
      });
      const lost = legs.some((l) => l.result === "lost");
      const open = legs.some((l) => !l.result);
      if (!lost && open) return { ...tk, legs };
      const allVoid = legs.every((l) => l.result === "void");
      const payout = lost ? 0 : Math.min(MAX_PAYOUT, Math.floor(tk.stake * comboOdds(legs)));
      const next: Ticket = { ...tk, legs, status: lost ? "lost" : allVoid ? "void" : "won", payout, settledAt: t, seen: active };
      paid += payout;
      done.push(next);
      return next;
    });
    if (!changed) return;
    if (paid) wallet.add(paid);
    commit({ ...s, tickets });
    for (const tk of done) {
      sessionStore.recordSports(tk.stake, tk.payout - tk.stake);
      if (tk.status === "won") {
        track("betWon");
        if (tk.legs.filter((l) => l.result === "won").length >= 3) track("betComboWon");
        if (tk.payout >= tk.stake * 10) track("betBigWin");
      }
    }
    if (done.some((d) => d.status === "won")) {
      sfx.win();
      haptic(HAPTIC.win);
      setMessage(`Ticket won · ◈ ${done.reduce((s2, d) => s2 + d.payout, 0).toLocaleString("en-US")}`);
    } else if (done.length) setMessage(done[0].status === "void" ? "Ticket void · stake returned" : "Ticket lost");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, loaded, errors, scorers]);

  // Player bets settle on the scorers table once the match is over:
  // refresh it (every 20 min) while such a leg waits.
  useEffect(() => {
    const comps = new Set<string>();
    for (const tk of saved.tickets)
      if (tk.status === "open")
        for (const l of tk.legs) {
          const m = byId.current.get(l.matchId);
          if (!l.result && l.snap && m && m.status === "done") comps.add(l.snap.comp);
        }
    comps.forEach((c) => loadScorers(c, 20 * 60000));
  }, [saved.tickets, matches, loadScorers]);

  // ---- Slip
  const slip = saved.slip;
  const inSlip = useMemo(() => new Set(slip.map((s) => s.key)), [slip]);
  const toggle = (m: Match, market: string, pick: string, label: string, marketTitle: string) => {
    const key = `${m.id}|${market}|${pick}`;
    const s = savedRef.current;
    if (s.slip.some((x) => x.key === key)) {
      commit({ ...s, slip: s.slip.filter((x) => x.key !== key) });
      return true;
    }
    const odds = oddsNow(m, market, pick);
    if (odds === null) return refuse("This market is closed");
    // One pick per match: a new pick on the same match replaces the old one.
    const others = s.slip.filter((x) => x.matchId !== m.id);
    if (others.length >= MAX_PICKS) return refuse(`${MAX_PICKS} picks at most`);
    const sel: Selection = {
      key,
      matchId: m.id,
      sport: m.sport,
      market,
      pick,
      label,
      marketTitle,
      matchLabel: `${m.home.name} – ${m.away.name}`,
      kickoff: m.kickoff,
      odds,
      live: m.status !== "pre",
    };
    const pm = parsePlayerMarket(market);
    if (pm) {
      const p = playerOf(m, pm.id);
      if (!p) return refuse("Player data unavailable");
      sel.snap = { teamId: p.teamId, comp: m.comp.id, played: p.played, goals: p.goals, assists: p.assists };
    }
    commit({ ...s, slip: [...others, sel] });
    sfx.chip();
    if (s.slip.some((x) => x.matchId === m.id)) setMessage("One pick per match: replaced");
    return true;
  };
  const removeSel = (key: string) => commit({ ...savedRef.current, slip: savedRef.current.slip.filter((x) => x.key !== key) });
  const clearSlip = () => commit({ ...savedRef.current, slip: [] });
  const setStake = (v: number) => {
    const st = Math.max(SPORTS_MIN, Math.min(SPORTS_MAX, Math.round(v)));
    commit({ ...savedRef.current, stake: st });
  };

  // Live odds in the slip (they move with the match).
  const slipNow = slip.map((s) => {
    const m = matches.find((x) => x.id === s.matchId);
    const o = m ? oddsNow(m, s.market, s.pick) : null;
    return { ...s, now: o };
  });
  const slipOdds = comboOdds(slipNow.map((s) => ({ odds: s.now ?? s.odds })));
  const slipChanged = slipNow.some((s) => s.now !== null && s.now !== s.odds);
  const slipClosed = slipNow.some((s) => s.now === null);
  const stake = saved.stake;
  const potential = Math.min(MAX_PAYOUT, Math.floor(stake * slipOdds));

  const place = () => {
    const s = savedRef.current;
    if (!s.slip.length) return refuse("Add a pick to your ticket");
    if (slipClosed) return refuse("A pick is closed — remove it");
    if (slipChanged) {
      // Accept the new prices only after the player has seen them.
      commit({ ...s, slip: slipNow.map(({ now: n, ...x }) => ({ ...x, odds: n ?? x.odds })) });
      return refuse("Odds changed — check and confirm");
    }
    if (s.stake > wallet.getBalance()) return refuse("Not enough chips");
    const t = Date.now();
    const legs: Leg[] = s.slip.map((x) => ({ ...x, result: null }));
    const ticket: Ticket = { id: s.nextId, at: t, stake: s.stake, odds: comboOdds(legs), legs, status: "open", payout: 0 };
    wallet.add(-s.stake);
    commit({ ...s, tickets: [...s.tickets, ticket].slice(-150), slip: [], nextId: s.nextId + 1 });
    track("betPlaced");
    if (legs.length >= 3) track("betCombo");
    if (legs.some((l) => l.live)) track("betLive");
    sfx.coin(5);
    haptic(HAPTIC.win);
    setMessage(`Ticket placed · potential ◈ ${Math.min(MAX_PAYOUT, Math.floor(ticket.stake * ticket.odds)).toLocaleString("en-US")}`);
    return true;
  };

  // ---- Cash-out
  const cashOutValue = useCallback(
    (tk: Ticket): number | null => {
      if (tk.status !== "open") return null;
      const t = now || Date.now();
      let p = 1;
      for (const l of tk.legs) {
        if (l.result === "lost") return null;
        if (l.result) continue;
        const m = byId.current.get(l.matchId);
        if (!m || !isOpen(m, t)) return null;
        const q = chanceOf(m, l.market, l.pick, t);
        if (q === null) return null;
        p *= q;
      }
      const v = Math.floor(tk.stake * comboOdds(tk.legs) * p * CASHOUT_CUT);
      return v >= 1 ? Math.min(v, MAX_PAYOUT) : null;
    },
    [formsOf, now],
  );
  const cashOut = (id: number) => {
    const s = savedRef.current;
    const tk = s.tickets.find((x) => x.id === id);
    if (!tk) return false;
    const v = cashOutValue(tk);
    if (v === null) return refuse("Cash-out not available right now");
    wallet.add(v);
    commit({ ...s, tickets: s.tickets.map((x) => (x.id === id ? { ...x, status: "cashed", payout: v, settledAt: Date.now(), seen: true } : x)) });
    sessionStore.recordSports(tk.stake, v - tk.stake);
    track("betCashout");
    sfx.coin(8);
    setMessage(`Cashed out · ◈ ${v.toLocaleString("en-US")}`);
    return true;
  };
  const markSeen = () => {
    const s = savedRef.current;
    if (s.tickets.some((t) => t.status !== "open" && !t.seen)) commit({ ...s, tickets: s.tickets.map((t) => (t.status !== "open" ? { ...t, seen: true } : t)) });
  };

  return {
    balance,
    now,
    demo,
    matches,
    loaded,
    errors,
    message,
    refused,
    modelFor,
    oddsNow,
    playersFor,
    loadScorers,
    slip: slipNow,
    inSlip,
    slipOdds,
    slipChanged,
    slipClosed,
    stake,
    potential,
    tickets: saved.tickets,
    unseen: saved.tickets.filter((t) => t.status !== "open" && !t.seen).length,
    openCount: saved.tickets.filter((t) => t.status === "open").length,
    toggle,
    removeSel,
    clearSlip,
    setStake,
    place,
    cashOutValue,
    cashOut,
    markSeen,
  };
}

export type SportsGame = ReturnType<typeof useSportsbook>;
