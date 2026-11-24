"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HAPTIC, haptic } from "./haptics";
import { sfx } from "./sound";
import { track } from "./events";
import { sessionStore } from "./sessionStore";
import { useBalance, wallet } from "./wallet";
import { demoForms, demoMatches } from "./sports/demo";
import { builderOk, encodeBuilder, isOpen, modelOf, parsePlayerMarket, playerProb, priceOf, probOf, settle, type PlayerLine } from "./sports/odds";
import type { Feed, Match, Sport, Standings, StandingsFeed } from "./sports/types";
import { BOOST_MAX_STAKE, dailyBoosts, flashBoost, isBoostMarket, type Boost } from "./sports/boosts";

/**
 * Sports betting with virtual chips on real matches.
 * - The stake leaves the credit when the ticket is placed.
 * - A ticket of several picks is a combo: odds multiply, one lost pick loses it.
 * - Tickets settle on the official result as soon as the feed has it,
 *   even while another game is open (the page keeps this game mounted).
 * - Cash-out: the model's chance of winning × potential return, minus 8%.
 */

export const SPORTS_MIN = 10;
/** No table limit: you can stake your whole credit (all in). */
export const SPORTS_MAX = 1_000_000_000_000;
export const MAX_PICKS = 10;
/** Highest payout of one ticket: ◈ 1 billion. */
export const MAX_PAYOUT = 1_000_000_000;
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
  status: "open" | "won" | "lost" | "void" | "cashed" | "refund";
  payout: number;
  /** Combo boost on the winnings (0.05 = +5%), set when placed. */
  boost?: number;
  /** Combo insurance: stake back if exactly one pick loses. */
  insured?: boolean;
  settledAt?: number;
  seen?: boolean;
};
/** bb: the odds the player last saw for each bet builder (by match). */
type Saved = { tickets: Ticket[]; slip: Selection[]; stake: number; nextId: number; pending: boolean; bb?: Record<string, number> };
const KEY = "royalace:sports";
const FORMS_KEY = "royalace:sports-forms";
const RESULTS_KEY = "royalace:sports-results";
const BOOSTS_KEY = "royalace:sports-boosts";
type BoostStore = { day: string; daily: Boost[]; flash: Boost[] };
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
      bb: s.bb && typeof s.bb === "object" ? s.bb : {},
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
/** Combo boost by number of picks (each at odds 1.20 or more). */
const BOOST_BY_PICKS: Record<number, number> = { 3: 0.05, 4: 0.1, 5: 0.15, 6: 0.2, 7: 0.25, 8: 0.3, 9: 0.4, 10: 0.5 };
export const MIN_ODDS_COUNTED = 1.2;
export const INSURANCE_PICKS = 5;
export function comboBoost(legs: { odds: number; result?: Leg["result"] }[]) {
  const n = legs.filter((l) => l.result !== "void" && l.odds >= MIN_ODDS_COUNTED).length;
  return n >= 10 ? 0.5 : BOOST_BY_PICKS[n] ?? 0;
}
export const isInsured = (legs: { odds: number }[]) => legs.filter((l) => l.odds >= MIN_ODDS_COUNTED).length >= INSURANCE_PICKS;
/** Payout of a winning ticket: stake × odds, the boost on the winnings, capped. */
function winPayout(stake: number, legs: { odds: number; result?: Leg["result"] }[], boost: number) {
  const gross = stake * comboOdds(legs);
  // The boost shrinks if picks were void (counted again at settlement).
  const b = Math.min(boost, comboBoost(legs));
  return Math.min(MAX_PAYOUT, Math.floor(gross + (gross - stake) * b));
}
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

  // ---- Boosted odds: the day's list (fixed once chosen) + flash boosts
  // that open an hour before a big kick-off. Kept across reloads.
  const [boostStore, setBoostStore] = useState<BoostStore>({ day: "", daily: [], flash: [] });
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(BOOSTS_KEY) ?? "null") as BoostStore | null;
      if (raw && Array.isArray(raw.daily) && Array.isArray(raw.flash)) setBoostStore(raw);
    } catch {}
  }, []);
  useEffect(() => {
    const t = now;
    if (!t || !matches.length) return;
    setBoostStore((st) => {
      let next = st;
      const d = day(t);
      if (st.day !== d || st.daily.length < 3) {
        const fresh = dailyBoosts(matches, (m) => modelOf(m, formsOf(m), t), t);
        if (fresh.length > (st.day === d ? st.daily.length : 0)) next = { ...next, day: d, daily: fresh };
        else if (st.day !== d) next = { ...next, day: d, daily: st.daily.filter((x) => x.ends > t) };
      }
      const have = new Set(next.flash.map((x) => x.matchId));
      const add: Boost[] = [];
      for (const m of matches) {
        if (have.has(m.id)) continue;
        const f = flashBoost(m, modelOf(m, formsOf(m), t), t);
        if (f) add.push(f);
      }
      const kept = next.flash.filter((x) => x.ends > t - 6 * 3600000);
      if (add.length || kept.length !== next.flash.length) next = { ...next, flash: [...kept, ...add] };
      if (next !== st) {
        try {
          localStorage.setItem(BOOSTS_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, forms, now]);
  const boostsActive = useMemo(() => {
    const t = now || 0;
    const live = (b: Boost) => {
      const m = byId.current.get(b.matchId);
      return b.ends > t && (!m || m.status === "pre");
    };
    return { flash: boostStore.flash.filter(live).sort((a, b) => a.ends - b.ends), daily: boostStore.daily.filter(live) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boostStore, now, matches]);
  const boostById = useMemo(() => new Map([...boostsActive.flash, ...boostsActive.daily].map((b) => [b.id, b])), [boostsActive]);

  /** Current odds of one pick (null: closed). */
  const oddsNow = useCallback(
    (m: Match, market: string, pick: string) => {
      const t = now || Date.now();
      if (!isOpen(m, t)) return null;
      if (isBoostMarket(market)) {
        const b = boostById.get(`${m.id}|${market}|${pick}`);
        return b && m.status === "pre" && t < b.ends ? b.odds : null;
      }
      return priceOf(chanceOf(m, market, pick, t), market);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formsOf, now, scorers, boostById],
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
          r = settle(m, l.market, l.pick, !l.live);
          const fs = m.status === "done" ? m.regular ?? m.score : m.score;
          // Decided before the end (an over passed, 2 goals up…): paid at once.
          if (r && fs) final = m.status === "done" ? `${fs.h}-${fs.a}` : `${fs.h}-${fs.a} early`;
        } else if (loaded[l.sport] && !errors[l.sport] && t > l.kickoff + 48 * 3600000) r = "void"; // never got a result
        if (r) changed = true;
        return r ? { ...l, result: r, final } : l;
      });
      const nLost = legs.filter((l) => l.result === "lost").length;
      const open = legs.some((l) => !l.result);
      // Insured combos wait for every pick when only one has lost.
      if (nLost === 0 && open) return { ...tk, legs };
      if (tk.insured && nLost === 1 && open) return { ...tk, legs };
      const allVoid = legs.every((l) => l.result === "void");
      const refund = Boolean(tk.insured) && nLost === 1 && !open;
      const status: Ticket["status"] = refund ? "refund" : nLost ? "lost" : allVoid ? "void" : "won";
      const payout = refund ? tk.stake : nLost ? 0 : allVoid ? tk.stake : winPayout(tk.stake, legs, tk.boost ?? 0);
      const next: Ticket = { ...tk, legs, status, payout, settledAt: t, seen: active };
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
    for (const d of done)
      window.dispatchEvent(
        new CustomEvent("royal-ace:toast", {
          detail: {
            kind: d.status === "won" ? "win" : d.status === "void" || d.status === "refund" ? "info" : "loss",
            title: d.status === "won" ? (d.legs.length > 1 ? `Combo won · ${d.legs.length} picks` : "Bet won") : d.status === "void" ? "Ticket void · stake returned" : d.status === "refund" ? "Combo insurance · stake refunded" : "Ticket lost",
            text: d.legs.length === 1 ? d.legs[0].matchLabel : `×${d.odds.toFixed(2)}`,
            amount: d.payout,
            big: d.status === "won" && (d.payout >= d.stake * 10 || d.payout >= 100000),
            game: "sports",
          },
        }),
      );
    if (done.some((d) => d.status === "won")) {
      sfx.win();
      haptic(HAPTIC.win);
      setMessage(`Ticket won · ◈ ${done.reduce((s2, d) => s2 + d.payout, 0).toLocaleString("en-US")}`);
    } else if (done.length) setMessage(done[0].status === "void" ? "Ticket void · stake returned" : done[0].status === "refund" ? "Combo insurance · stake refunded" : "Ticket lost");
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
    let s = savedRef.current;
    if (s.slip.some((x) => x.key === key)) {
      removeSel(key);
      return true;
    }
    const odds = oddsNow(m, market, pick);
    if (odds === null) return refuse("This market is closed");
    // Boosted odds are single bets: a boost clears the ticket, and a pick
    // added next to a boost replaces it.
    if (isBoostMarket(market)) {
      if (s.slip.length) setMessage("Boosted odds are single bets — ticket cleared");
      commit({ ...s, slip: [], bb: {} });
    } else if (s.slip.some((x) => isBoostMarket(x.market))) {
      commit({ ...s, slip: s.slip.filter((x) => !isBoostMarket(x.market)), bb: {} });
      setMessage("Boosted odds are single bets — boost removed");
    }
    // Same match: football picks read from the score build a bet builder;
    // anything else replaces the match's previous pick.
    s = savedRef.current;
    const same = s.slip.filter((x) => x.matchId === m.id);
    const building = same.length > 0 && builderOk(m.sport, market) && same.every((x) => builderOk(x.sport, x.market));
    const keep = building ? same.filter((x) => x.market !== market) : [];
    const others = s.slip.filter((x) => x.matchId !== m.id);
    if (new Set(others.map((x) => x.matchId)).size >= MAX_PICKS) return refuse(`${MAX_PICKS} matches at most`);
    if (keep.length >= 6) return refuse("6 picks at most in a bet builder");
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
    const group = [...keep, sel];
    const bb = { ...(s.bb ?? {}) };
    if (group.length > 1) {
      const o = oddsNow(m, "bb", encodeBuilder(group));
      if (o === null) return refuse("These picks cannot all win together");
      bb[m.id] = o;
    } else delete bb[m.id];
    commit({ ...s, slip: [...others, ...group], bb });
    sfx.chip();
    if (group.length > 1) setMessage(`Bet builder · ${group.length} picks`);
    else if (same.length) setMessage("One pick per match: replaced");
    return true;
  };
  /** Remove a pick (or a whole bet builder, by its key). */
  const removeSel = (key: string) => {
    const s = savedRef.current;
    const [matchId, market] = key.split("|");
    const slip2 = market === "bb" ? s.slip.filter((x) => x.matchId !== matchId) : s.slip.filter((x) => x.key !== key);
    const bb = { ...(s.bb ?? {}) };
    const left = slip2.filter((x) => x.matchId === matchId);
    const m = byId.current.get(matchId);
    if (left.length > 1 && m) {
      const o = oddsNow(m, "bb", encodeBuilder(left));
      if (o !== null) bb[matchId] = o;
    } else delete bb[matchId];
    commit({ ...s, slip: slip2, bb });
  };
  const clearSlip = () => commit({ ...savedRef.current, slip: [], bb: {} });
  const setStake = (v: number) => {
    const st = Math.max(SPORTS_MIN, Math.min(SPORTS_MAX, Math.round(v)));
    commit({ ...savedRef.current, stake: st });
  };
  const allIn = () => {
    const b = Math.floor(wallet.getBalance());
    if (b < SPORTS_MIN) return refuse("Not enough chips");
    setStake(b);
    return true;
  };
  const halfStake = () => setStake(Math.floor(savedRef.current.stake / 2));
  const doubleStake = () => setStake(Math.min(Math.floor(wallet.getBalance()), savedRef.current.stake * 2) || SPORTS_MIN);

  // Live odds in the slip (they move with the match).
  // Picks on the same match make one bet builder leg.
  const slipLegs: Selection[] = [];
  for (const id of [...new Set(slip.map((x) => x.matchId))]) {
    const grp = slip.filter((x) => x.matchId === id);
    if (grp.length === 1) slipLegs.push(grp[0]);
    else {
      const pick = encodeBuilder(grp);
      slipLegs.push({
        ...grp[0],
        key: `${id}|bb|${pick}`,
        market: "bb",
        pick,
        label: grp.map((x) => x.label).join(" + "),
        marketTitle: `Bet builder · ${grp.length} picks`,
        odds: saved.bb?.[id] ?? 0,
        live: grp.some((x) => x.live),
      });
    }
  }
  const slipNow = slipLegs.map((s) => {
    const m = matches.find((x) => x.id === s.matchId);
    const o = m ? oddsNow(m, s.market, s.pick) : null;
    return { ...s, now: o };
  });
  const slipOdds = comboOdds(slipNow.map((s) => ({ odds: s.now ?? s.odds })));
  const slipChanged = slipNow.some((s) => s.now !== null && s.now !== s.odds);
  const slipClosed = slipNow.some((s) => s.now === null);
  const stake = saved.stake;
  const slipBoost = comboBoost(slipNow.map((x) => ({ odds: x.now ?? x.odds })));
  const slipInsured = isInsured(slipNow.map((x) => ({ odds: x.now ?? x.odds })));
  const potential = winPayout(stake, slipNow.map((x) => ({ odds: x.now ?? x.odds })), slipBoost);

  const place = () => {
    const s = savedRef.current;
    if (!s.slip.length) return refuse("Add a pick to your ticket");
    if (slipClosed) return refuse("A pick is closed — remove it");
    if (slipChanged) {
      // Accept the new prices only after the player has seen them.
      const fresh = new Map(slipNow.map((x) => [x.key, x.now]));
      const bb = { ...(s.bb ?? {}) };
      for (const x of slipNow) if (x.market === "bb" && x.now !== null) bb[x.matchId] = x.now;
      commit({ ...s, slip: s.slip.map((x) => ({ ...x, odds: fresh.get(x.key) ?? x.odds })), bb });
      return refuse("Odds changed — check and confirm");
    }
    if (s.stake > wallet.getBalance()) return refuse("Not enough chips");
    if (s.slip.some((x) => isBoostMarket(x.market))) {
      if (s.slip.length > 1) return refuse("Boosted odds are single bets");
      if (s.stake > BOOST_MAX_STAKE) return refuse(`Boosted odds: ◈ ${BOOST_MAX_STAKE.toLocaleString("en-US")} max stake`);
    }
    const t = Date.now();
    // A pick counts as live if its match has started when the ticket is placed
    // (even if it was added to the slip before kick-off).
    const legs: Leg[] = slipNow.map(({ now: _n, ...x }) => {
      const mm = byId.current.get(x.matchId);
      return { ...x, live: x.live || t >= x.kickoff || (mm ? mm.status !== "pre" : false), result: null };
    });
    const ticket: Ticket = { id: s.nextId, at: t, stake: s.stake, odds: comboOdds(legs), legs, status: "open", payout: 0, boost: comboBoost(legs), insured: isInsured(legs) };
    wallet.add(-s.stake);
    commit({ ...s, tickets: [...s.tickets, ticket].slice(-150), slip: [], bb: {}, nextId: s.nextId + 1 });
    track("betPlaced");
    if (legs.length >= 3) track("betCombo");
    if (legs.some((l) => l.live)) track("betLive");
    sfx.coin(5);
    haptic(HAPTIC.win);
    setMessage(`Ticket placed · potential ◈ ${winPayout(ticket.stake, legs, ticket.boost ?? 0).toLocaleString("en-US")}`);
    return true;
  };

  // ---- Cash-out
  const cashOutValue = useCallback(
    (tk: Ticket): number | null => {
      if (tk.status !== "open") return null;
      // No cash-out on boosted odds (as in real sportsbooks).
      if (tk.legs.some((l) => isBoostMarket(l.market))) return null;
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
      const v = Math.floor(winPayout(tk.stake, tk.legs, tk.boost ?? 0) * p * CASHOUT_CUT);
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
    boosts: boostsActive,
    boostById,
    slipHasBoost: slipNow.some((x) => isBoostMarket(x.market)),
    playersFor,
    loadScorers,
    slip: slipNow,
    inSlip,
    slipOdds,
    slipChanged,
    slipBoost,
    slipInsured,
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
    allIn,
    halfStake,
    doubleStake,
    place,
    cashOutValue,
    cashOut,
    markSeen,
  };
}

export type SportsGame = ReturnType<typeof useSportsbook>;
