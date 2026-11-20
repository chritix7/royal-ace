/**
 * Turns the raw answers of the free data providers into our Match shape.
 * - Football: football-data.org v4 (free plan: top competitions).
 * - Basketball / hockey: API-Sports v1 (free plan: 100 requests a day).
 * Pure functions, shared by the server route and the tests.
 */
import type { Match, MatchStatus, Score, Standings } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(+v) ? +v : null);
const pair = (h: any, a: any): Score | null => {
  const x = num(h);
  const y = num(a);
  return x === null || y === null ? null : { h: x, a: y };
};

/* ───────────── Football (football-data.org) ───────────── */

/** Competitions on the free plan, by code, with the name shown. */
export const FOOTBALL_COMPS: Record<string, { name: string; country: string }> = {
  CL: { name: "Champions League", country: "Europe" },
  PL: { name: "Premier League", country: "England" },
  PD: { name: "LaLiga", country: "Spain" },
  SA: { name: "Serie A", country: "Italy" },
  BL1: { name: "Bundesliga", country: "Germany" },
  FL1: { name: "Ligue 1", country: "France" },
  DED: { name: "Eredivisie", country: "Netherlands" },
  PPL: { name: "Primeira Liga", country: "Portugal" },
  ELC: { name: "Championship", country: "England" },
  BSA: { name: "Brasileirão", country: "Brazil" },
  EC: { name: "European Championship", country: "Europe" },
  WC: { name: "World Cup", country: "World" },
};

const FD_STATUS: Record<string, MatchStatus> = {
  SCHEDULED: "pre",
  TIMED: "pre",
  IN_PLAY: "live",
  LIVE: "live",
  PAUSED: "break",
  SUSPENDED: "break",
  FINISHED: "done",
  AWARDED: "done",
  POSTPONED: "void",
  CANCELLED: "void",
};

export function footballMatch(m: any): Match | null {
  if (!m || m.id == null || !m.homeTeam || !m.awayTeam) return null;
  const code = String(m.competition?.code ?? m.competition?.id ?? "?");
  const meta = FOOTBALL_COMPS[code];
  const status = FD_STATUS[m.status] ?? "pre";
  const s = m.score ?? {};
  const full = pair(s.fullTime?.home, s.fullTime?.away);
  const ht = pair(s.halfTime?.home, s.halfTime?.away);
  // Extra time and penalties do not count: bets settle on 90 minutes.
  const regular = s.duration && s.duration !== "REGULAR" ? pair(s.regularTime?.home, s.regularTime?.away) ?? full : full;
  const minute = num(m.minute);
  const kickoff = Date.parse(m.utcDate);
  let clock: Match["clock"];
  if (status === "live" || status === "break") {
    const period = status === "break" ? 1 : minute !== null ? (minute > 45 ? 2 : 1) : 0;
    clock = { period, minute: minute ?? undefined, label: status === "break" ? "HT" : minute !== null ? `${minute}'` : "Live" };
  }
  return {
    id: `fb:${m.id}`,
    sport: "football",
    comp: { id: code, name: meta?.name ?? m.competition?.name ?? code, country: meta?.country ?? m.area?.name },
    home: { id: String(m.homeTeam.id), name: m.homeTeam.shortName || m.homeTeam.name || "Home" },
    away: { id: String(m.awayTeam.id), name: m.awayTeam.shortName || m.awayTeam.name || "Away" },
    kickoff: Number.isFinite(kickoff) ? kickoff : 0,
    status,
    clock,
    score: status === "pre" || status === "void" ? null : full ?? { h: 0, a: 0 },
    ht,
    regular: status === "done" ? regular : null,
  };
}

export function footballStandings(json: any): Standings {
  const out: Standings = {};
  const groups: any[] = Array.isArray(json?.standings) ? json.standings : [];
  for (const g of groups) {
    if (g?.type && g.type !== "TOTAL") continue;
    for (const r of Array.isArray(g?.table) ? g.table : []) {
      const id = r?.team?.id;
      const played = num(r?.playedGames) ?? 0;
      if (id == null || out[id] || !played) continue;
      out[String(id)] = { played, scored: (num(r.goalsFor) ?? 0) / played, conceded: (num(r.goalsAgainst) ?? 0) / played, winPct: (num(r.won) ?? 0) / played };
    }
  }
  return out;
}

/* ───────────── Basketball & hockey (API-Sports) ───────────── */

/** Leagues we keep: [country, name keywords]. The free feed lists every game in the world. */
const TOP: Record<"basketball" | "hockey", [string, string[]][]> = {
  basketball: [
    ["usa", ["nba"]],
    ["europe", ["euroleague", "eurocup"]],
    ["france", ["lnb", "pro a", "elite"]],
    ["spain", ["acb"]],
    ["italy", ["lega a", "serie a"]],
    ["germany", ["bbl"]],
    ["turkey", ["super lig", "super ligi"]],
    ["greece", ["a1", "basket league"]],
  ],
  hockey: [
    ["usa", ["nhl"]],
    ["russia", ["khl"]],
    ["sweden", ["shl"]],
    ["finland", ["liiga"]],
    ["switzerland", ["national league"]],
    ["germany", ["del"]],
    ["france", ["magnus"]],
    ["czech", ["extraliga"]],
    ["europe", ["champions"]],
  ],
};
// Exclude youth, women's and minor variants that share a keyword.
const MINOR = /(women|\bw\b|u\d\d|youth|junior|development|g league|\b2\b|a2\b|\bii\b|\bcup\b)/i;

export function isTopLeague(sport: "basketball" | "hockey", country: string, league: string) {
  const c = country.toLowerCase();
  const l = league.toLowerCase();
  if (MINOR.test(l) && !(sport === "hockey" && l.includes("champions"))) return false;
  return TOP[sport].some(([tc, keys]) => c.includes(tc) && keys.some((k) => l === k || l.includes(k)));
}

const BK_STATUS: Record<string, MatchStatus> = {
  NS: "pre", Q1: "live", Q2: "live", Q3: "live", Q4: "live", OT: "live", BT: "break", HT: "break",
  FT: "done", AOT: "done", POST: "void", CANC: "void", SUSP: "break", AWD: "done", ABD: "void",
};
const HK_STATUS: Record<string, MatchStatus> = {
  NS: "pre", P1: "live", P2: "live", P3: "live", OT: "live", PT: "live", BT: "break",
  FT: "done", AOT: "done", AP: "done", POST: "void", CANC: "void", INTR: "break", ABD: "void", AWD: "done",
};
const PERIOD: Record<string, number> = { Q1: 1, Q2: 2, HT: 2, Q3: 3, Q4: 4, OT: 5, P1: 1, P2: 2, P3: 3, PT: 4 };

export function sportsGame(sport: "basketball" | "hockey", g: any): Match | null {
  if (!g || g.id == null || !g.teams?.home || !g.teams?.away) return null;
  const short = String(g.status?.short ?? "NS");
  const status = (sport === "basketball" ? BK_STATUS : HK_STATUS)[short] ?? "pre";
  const kickoff = num(g.timestamp) !== null ? (num(g.timestamp) as number) * 1000 : Date.parse(g.date);
  let score: Score | null = null;
  let regular: Score | null = null;
  if (sport === "basketball") {
    score = pair(g.scores?.home?.total, g.scores?.away?.total);
    regular = score; // overtime counts in basketball
  } else {
    score = pair(g.scores?.home, g.scores?.away);
    // 60 minutes: the three periods only.
    const p = g.periods ?? {};
    let h = 0;
    let a = 0;
    let ok = true;
    for (const k of ["first", "second", "third"]) {
      const m = typeof p[k] === "string" ? p[k].match(/(\d+)\s*-\s*(\d+)/) : null;
      if (!m) {
        ok = false;
        break;
      }
      h += +m[1];
      a += +m[2];
    }
    regular = ok ? { h, a } : short === "FT" ? score : null;
  }
  const timer = num(g.status?.timer);
  const period = PERIOD[short] ?? 0;
  const clock =
    status === "live" || status === "break"
      ? { period, minute: timer ?? undefined, label: status === "break" ? "Break" : `${short}${timer !== null ? ` ${timer}'` : ""}` }
      : undefined;
  return {
    id: `${sport === "basketball" ? "bk" : "hk"}:${g.id}`,
    sport,
    comp: { id: String(g.league?.id ?? "?"), name: String(g.league?.name ?? "League"), country: g.country?.name, season: g.league?.season != null ? String(g.league.season) : undefined },
    home: { id: String(g.teams.home.id), name: String(g.teams.home.name ?? "Home") },
    away: { id: String(g.teams.away.id), name: String(g.teams.away.name ?? "Away") },
    kickoff: Number.isFinite(kickoff) ? kickoff : 0,
    status,
    clock,
    score: status === "pre" || status === "void" ? null : score ?? { h: 0, a: 0 },
    regular: status === "done" ? regular : null,
  };
}

export function sportsStandings(sport: "basketball" | "hockey", json: any): Standings {
  const out: Standings = {};
  const groups: any[] = Array.isArray(json?.response) ? json.response : [];
  for (const g of groups) {
    for (const r of Array.isArray(g) ? g : [g]) {
      const id = r?.team?.id;
      const played = num(r?.games?.played) ?? 0;
      if (id == null || out[id] || !played) continue;
      const pf = sport === "basketball" ? num(r?.points?.for) : num(r?.goals?.for);
      const pa = sport === "basketball" ? num(r?.points?.against) : num(r?.goals?.against);
      const wins = (num(r?.games?.win?.total) ?? 0) + (num(r?.games?.win_overtime?.total) ?? 0);
      out[String(id)] = { played, scored: (pf ?? 0) / played, conceded: (pa ?? 0) / played, winPct: wins / played };
    }
  }
  return out;
}
