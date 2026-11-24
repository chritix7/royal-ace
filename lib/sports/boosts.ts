/**
 * Boosted odds, the way real sportsbooks run them.
 *
 * - Daily boosts: a handful of picks on the day's biggest matches, at a
 *   better price (1.60 → 2.00, 2.50 → 3.00, 4.00 → 4.50…). Chosen once a
 *   day, then fixed; each one closes 5 minutes before its kick-off.
 * - Flash boosts: one hour before a big match kicks off, a stronger boost
 *   on that match appears, until 5 minutes before kick-off.
 *
 * A boost is a single bet (it cannot go in a combo), with a capped stake,
 * and no cash-out. The leg's market is "boost.<market>" and settles like
 * the plain market.
 */
import type { Match, Sport } from "./types";
import { priceOf, probOf, type Model } from "./odds";

export type BoostKind = "daily" | "flash";
export type Boost = {
  id: string; // slip key: matchId|boost.<market>|pick
  kind: BoostKind;
  matchId: string;
  sport: Sport;
  market: string; // "boost.1x2", "boost.ou:2.5"…
  pick: string;
  label: string;
  was: number;
  odds: number;
  ends: number;
};

export const BOOST_MAX_STAKE = 100_000;
export const FLASH_WINDOW = 60 * 60000;
export const CLOSE_BEFORE = 5 * 60000;
const DAILY_COUNT = 6;

/** Top competitions first (football-data ids, then the US leagues). */
const PRIORITY = ["CL", "PL", "PD", "SA", "BL1", "FL1", "EC", "WC", "PPL", "DED", "ELC", "BSA"];
const rank = (m: Match) => {
  const i = PRIORITY.indexOf(m.comp.id);
  if (i >= 0) return i;
  if (/nba|nhl/i.test(m.comp.name)) return 3.5;
  if (/euroleague|khl/i.test(m.comp.name)) return 9;
  return 50;
};
export const isBig = (m: Match) => rank(m) < 12;

const round05 = (v: number) => Math.round(v * 20) / 20;
/** The better price: small odds gain the most in proportion. */
export function boosted(was: number, kind: BoostKind) {
  let o: number;
  if (was < 2) o = was * (kind === "flash" ? 1.33 : 1.25);
  else if (was < 3.5) o = was + (kind === "flash" ? 0.75 : 0.5);
  else o = was * (kind === "flash" ? 1.18 : 1.12);
  return Math.max(round05(was + 0.1), round05(o));
}

type Template = { market: string; pick: (m: Match, model: Model) => string | null; label: (m: Match, pick: string) => string; min: number; max: number };
const favourite = (market: string) => (m: Match, model: Model) => {
  const ph = probOf(model, m.sport, market, "1") ?? 0;
  const pa = probOf(model, m.sport, market, "2") ?? 0;
  return ph >= pa ? "1" : "2";
};
const underdog = (market: string) => (m: Match, model: Model) => (favourite(market)(m, model) === "1" ? "2" : "1");
const teamWins = (m: Match, pick: string) => `${pick === "1" ? m.home.name : m.away.name} to win`;

const FOOTBALL: Template[] = [
  { market: "1x2", pick: favourite("1x2"), label: teamWins, min: 1.3, max: 2.3 },
  { market: "ou:2.5", pick: () => "over", label: () => "Over 2.5 goals", min: 1.5, max: 2.6 },
  { market: "btts", pick: () => "yes", label: () => "Both teams to score", min: 1.5, max: 2.6 },
  { market: "1x2", pick: underdog("1x2"), label: teamWins, min: 2.6, max: 6.5 },
  { market: "dc", pick: (m, model) => (favourite("1x2")(m, model) === "1" ? "X2" : "1X"), label: (m, p) => (p === "1X" ? `${m.home.name} or draw` : `Draw or ${m.away.name}`), min: 1.4, max: 2.6 },
];
const OTHER: Template[] = [{ market: "ml", pick: favourite("ml"), label: teamWins, min: 1.25, max: 2.4 }];

function make(m: Match, model: Model, kind: BoostKind, templates: Template[], ends: number): Boost | null {
  for (const t of templates) {
    const pick = t.pick(m, model);
    if (!pick) continue;
    const was = priceOf(probOf(model, m.sport, t.market, pick), t.market);
    if (!was || was < t.min || was > t.max) continue;
    const market = `boost.${t.market}`;
    return { id: `${m.id}|${market}|${pick}`, kind, matchId: m.id, sport: m.sport, market, pick, label: t.label(m, pick), was, odds: boosted(was, kind), ends };
  }
  return null;
}

/** The day's boosts: big matches of the next 30 hours, varied picks. */
export function dailyBoosts(matches: Match[], modelOf: (m: Match) => Model | null, now: number): Boost[] {
  const cands = matches
    .filter((m) => m.status === "pre" && m.kickoff > now + 30 * 60000 && m.kickoff < now + 30 * 3600000)
    .sort((a, b) => rank(a) - rank(b) || a.kickoff - b.kickoff || a.id.localeCompare(b.id));
  const out: Boost[] = [];
  let i = 0;
  for (const m of cands) {
    if (out.length >= DAILY_COUNT) break;
    const model = modelOf(m);
    if (!model) continue;
    // Rotate the kind of pick so the list is not six "X to win".
    const t = m.sport === "football" ? [...FOOTBALL.slice(i % FOOTBALL.length), ...FOOTBALL.slice(0, i % FOOTBALL.length)] : OTHER;
    const b = make(m, model, "daily", t, m.kickoff - CLOSE_BEFORE);
    if (b) {
      out.push(b);
      i++;
    }
  }
  return out;
}

/** A flash boost for a big match kicking off within the hour. */
export function flashBoost(m: Match, model: Model | null, now: number): Boost | null {
  if (!model || m.status !== "pre" || !isBig(m)) return null;
  const left = m.kickoff - now;
  if (left > FLASH_WINDOW || left <= CLOSE_BEFORE) return null;
  const t = m.sport === "football" ? [FOOTBALL[0], FOOTBALL[1], FOOTBALL[2]] : OTHER;
  const b = make(m, model, "flash", t, m.kickoff - CLOSE_BEFORE);
  return b ? { ...b, id: b.id } : null;
}

export const isBoostMarket = (market: string) => market === "boost" || market.startsWith("boost.");

/** "Ends in 42 min" style countdown. */
export function endsIn(ends: number, now: number) {
  const s = Math.max(0, Math.floor((ends - now) / 1000));
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const h = Math.floor(s / 3600);
  return `${h} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}
