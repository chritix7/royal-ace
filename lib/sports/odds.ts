/**
 * Royal Ace odds engine. No bookmaker feed: prices come from a model of
 * each match, fed by the league tables, with a fixed house margin.
 *
 * - Football: two Poisson scorers (attack × defence, home advantage).
 * - Hockey: the same over 60 minutes; the moneyline adds overtime.
 * - Basketball: normal laws on the margin and on the total.
 * In play, only the time left is modelled, on top of the current score.
 */
import type { Match, Score, Sport, TeamForm } from "./types";

export type Pick = { market: string; pick: string; label: string };
export type Market = { key: string; title: string; picks: Pick[] };
export type Priced = Pick & { odds: number | null };

/* ───────────── Maths ───────────── */

function poisson(l: number, max = 10) {
  const out: number[] = [];
  let p = Math.exp(-l);
  for (let k = 0; k <= max; k++) {
    out.push(p);
    p = (p * l) / (k + 1);
  }
  return out;
}
function erf(x: number) {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
const phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));

/* ───────────── Model of one match ───────────── */

type GoalModel = { kind: "goals"; now: Score; lh: number; la: number; /** first half, pre-match only */ half?: { lh: number; la: number } };
type PointsModel = { kind: "points"; now: Score; mu: number; sd: number; total: number; sdTotal: number };
export type Model = GoalModel | PointsModel;

const shrink = (v: number, n: number, prior: number, k = 6) => (v * n + prior * k) / (n + k);

/** Minutes played (football 90, hockey 60, basketball 40/48), from the clock or kick-off time. */
function elapsed(m: Match, now: number, length: number, periods: number) {
  if (m.status === "pre") return 0;
  if (m.status === "done") return length;
  const per = length / periods;
  const c = m.clock;
  if (c && c.period > 0) {
    if (c.period > periods) return length; // overtime
    if (m.status === "break") return Math.min(length, c.period * per);
    if (c.minute !== undefined) {
      // Football minutes are absolute; quarters/periods count within the period.
      const abs = m.sport === "football" ? c.minute : (c.period - 1) * per + c.minute;
      return Math.max(0, Math.min(length, abs));
    }
    return Math.min(length, (c.period - 0.5) * per);
  }
  // No clock: estimate from kick-off (football half-time 15 min).
  let e = (now - m.kickoff) / 60000;
  if (m.sport === "football") e = e > 60 ? e - 15 : Math.min(e, 45);
  else e *= 0.55; // stoppages
  return Math.max(0, Math.min(length - 1, e));
}

function avg(forms: Record<string, TeamForm>, key: "scored" | "conceded", fallback: number) {
  const v = Object.values(forms);
  if (v.length < 4) return fallback;
  return v.reduce((s, f) => s + f[key], 0) / v.length;
}

export function modelOf(m: Match, forms: Record<string, TeamForm> | undefined, now: number): Model | null {
  if (m.status === "void") return null;
  const f = forms ?? {};
  const H = f[m.home.id];
  const A = f[m.away.id];
  const score = m.score ?? { h: 0, a: 0 };
  if (m.sport === "football" || m.sport === "hockey") {
    const base = m.sport === "football" ? 1.35 : 2.9;
    const mean = avg(f, "scored", base);
    const att = (t?: TeamForm) => (t ? shrink(t.scored, t.played, mean) / mean : 1);
    const def = (t?: TeamForm) => (t ? shrink(t.conceded, t.played, mean) / mean : 1);
    const adv = m.sport === "football" ? 1.12 : 1.05;
    let lh = mean * att(H) * def(A) * adv;
    let la = (mean * att(A) * def(H)) / adv;
    const length = m.sport === "football" ? 93 : 60;
    const left = Math.max(0, 1 - elapsed(m, now, length, m.sport === "football" ? 2 : 3) / length);
    const half = m.sport === "football" && m.status === "pre" ? { lh: lh * 0.45, la: la * 0.45 } : undefined;
    const now0 = m.sport === "hockey" && m.clock && m.clock.period > 3 && m.regular ? m.regular : score;
    lh *= left;
    la *= left;
    return { kind: "goals", now: now0, lh, la, half };
  }
  // Basketball
  const nba = /nba/i.test(m.comp.name);
  const base = nba ? 114 : 82;
  const pts = avg(f, "scored", base);
  const sc = (t?: TeamForm) => (t ? shrink(t.scored, t.played, pts, 5) : pts);
  const cd = (t?: TeamForm) => (t ? shrink(t.conceded, t.played, pts, 5) : pts);
  const ph = (sc(H) + cd(A)) / 2 + 1.4;
  const pa = (sc(A) + cd(H)) / 2 - 1.4;
  const length = nba ? 48 : 40;
  const left = Math.max(0.02, 1 - elapsed(m, now, length, 4) / length);
  const done = m.status === "done";
  return {
    kind: "points",
    now: score,
    mu: done ? 0 : (ph - pa) * left,
    sd: done ? 0.0001 : (nba ? 13 : 11) * Math.sqrt(left),
    total: done ? 0 : (ph + pa) * left,
    sdTotal: done ? 0.0001 : (nba ? 18 : 14) * Math.sqrt(left),
  };
}

/* ───────────── Markets ───────────── */

const FB_LINES = [0.5, 1.5, 2.5, 3.5, 4.5];
const HK_LINES = [4.5, 5.5, 6.5];
const CS = ["1-0", "2-0", "2-1", "3-0", "3-1", "3-2", "0-0", "1-1", "2-2", "3-3", "0-1", "0-2", "1-2", "0-3", "1-3", "2-3"];
const HTFT = ["1/1", "1/X", "1/2", "X/1", "X/X", "X/2", "2/1", "2/X", "2/2"];

/** The markets offered for a match (the lines depend on the model in basketball). */
export function marketsOf(m: Match, model: Model | null): Market[] {
  const h = m.home.name;
  const a = m.away.name;
  const out: Market[] = [];
  if (m.sport === "basketball") {
    out.push({ key: "ml", title: "Winner (incl. overtime)", picks: [{ market: "ml", pick: "1", label: h }, { market: "ml", pick: "2", label: a }] });
    if (model && model.kind === "points" && m.status !== "done") {
      const lead = model.now.h - model.now.a + model.mu;
      const line = -(Math.floor(lead) + 0.5);
      const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`);
      out.push({ key: `spread:${line}`, title: "Handicap", picks: [{ market: `spread:${line}`, pick: "1", label: `${h} ${fmt(line)}` }, { market: `spread:${line}`, pick: "2", label: `${a} ${fmt(-line)}` }] });
      const t = Math.floor(model.now.h + model.now.a + model.total) + 0.5;
      for (const l of [t - 10, t, t + 10]) out.push({ key: `ou:${l}`, title: `Total points ${l}`, picks: [{ market: `ou:${l}`, pick: "over", label: `Over ${l}` }, { market: `ou:${l}`, pick: "under", label: `Under ${l}` }] });
    }
    return out;
  }
  const reg = m.sport === "hockey" ? " (60 min)" : "";
  out.push({ key: "1x2", title: m.sport === "football" ? (m.status === "pre" ? "Match result · paid early 2 goals up" : "Match result") : `Match result${reg}`, picks: [{ market: "1x2", pick: "1", label: h }, { market: "1x2", pick: "X", label: "Draw" }, { market: "1x2", pick: "2", label: a }] });
  if (m.sport === "hockey") out.push({ key: "ml", title: "Winner (incl. OT & shootout)", picks: [{ market: "ml", pick: "1", label: h }, { market: "ml", pick: "2", label: a }] });
  out.push({ key: "dc", title: `Double chance${reg}`, picks: [{ market: "dc", pick: "1X", label: `${h} or draw` }, { market: "dc", pick: "12", label: `${h} or ${a}` }, { market: "dc", pick: "X2", label: `Draw or ${a}` }] });
  for (const l of m.sport === "football" ? FB_LINES : HK_LINES)
    out.push({ key: `ou:${l}`, title: `Total goals ${l}${reg}`, picks: [{ market: `ou:${l}`, pick: "over", label: `Over ${l}` }, { market: `ou:${l}`, pick: "under", label: `Under ${l}` }] });
  out.push({ key: "btts", title: `Both teams to score${reg}`, picks: [{ market: "btts", pick: "yes", label: "Yes" }, { market: "btts", pick: "no", label: "No" }] });
  if (m.sport === "football") {
    for (const hc of [-1, 1])
      out.push({ key: `hcp:${hc}`, title: `Handicap ${h} ${hc > 0 ? "+" : ""}${hc}`, picks: [{ market: `hcp:${hc}`, pick: "1", label: `${h} (${hc > 0 ? "+" : ""}${hc})` }, { market: `hcp:${hc}`, pick: "X", label: `Draw (${hc > 0 ? "+" : ""}${hc})` }, { market: `hcp:${hc}`, pick: "2", label: `${a} (${hc > 0 ? "−" : "+"}${Math.abs(hc)})` }] });
    if (m.status === "pre") out.push({ key: "htft", title: "Half-time / Full-time", picks: HTFT.map((p) => ({ market: "htft", pick: p, label: p.replace(/1/g, h.split(" ")[0]).replace(/2/g, a.split(" ")[0]).replace(/X/g, "Draw") })) });
    out.push({ key: "cs", title: "Correct score", picks: CS.map((p) => ({ market: "cs", pick: p, label: p })) });
  }
  return out;
}

/* ───────────── Probabilities ───────────── */

/** Fair probability that a pick wins, from the model (null: cannot price). */
/** Boosted picks ("boost.<market>", or the old "boost" = match result) settle like the plain market. */
export const baseMarket = (market: string) => (market === "boost" ? "1x2" : market.startsWith("boost.") ? market.slice(6) : market);

export function probOf(model: Model, sport: Sport, market: string, pick: string): number | null {
  if (market === "bb") return builderProb(model, sport, parseBuilder(pick));
  const [kind, lineS] = baseMarket(market).split(":");
  const line = lineS !== undefined ? +lineS : 0;
  if (model.kind === "points") {
    const lead = model.now.h - model.now.a + model.mu;
    const tot = model.now.h + model.now.a + model.total;
    if (kind === "ml") {
      const p = phi(lead / model.sd);
      return pick === "1" ? p : 1 - p;
    }
    if (kind === "spread") {
      const p = phi((lead + line) / model.sd);
      return pick === "1" ? p : 1 - p;
    }
    if (kind === "ou") {
      const p = 1 - phi((line - tot) / model.sdTotal);
      return pick === "over" ? p : 1 - p;
    }
    return null;
  }
  // Goals: walk the grid of remaining goals.
  const ph = poisson(model.lh);
  const pa = poisson(model.la);
  if (kind === "htft") {
    if (!model.half) return null;
    const [htP, ftP] = pick.split("/");
    const h1 = poisson(model.half.lh);
    const a1 = poisson(model.half.la);
    const h2 = poisson(model.lh - model.half.lh);
    const a2 = poisson(model.la - model.half.la);
    const res = (d: number) => (d > 0 ? "1" : d < 0 ? "2" : "X");
    let p = 0;
    for (let i = 0; i <= 8; i++)
      for (let j = 0; j <= 8; j++) {
        if (res(i - j) !== htP) continue;
        const pij = h1[i] * a1[j];
        for (let k = 0; k <= 8; k++) for (let l = 0; l <= 8; l++) if (res(i + k - j - l) === ftP) p += pij * h2[k] * a2[l];
      }
    return p;
  }
  let p = 0;
  for (let i = 0; i < ph.length; i++)
    for (let j = 0; j < pa.length; j++) {
      const w = ph[i] * pa[j];
      if (wins({ h: model.now.h + i, a: model.now.a + j }, kind, line, pick)) p += w;
    }
  if (kind === "ml" && sport === "hockey") {
    // Level after 60 minutes: overtime / shootout, a shade to the home side.
    let draw = 0;
    for (let i = 0; i < ph.length; i++) for (let j = 0; j < pa.length; j++) if (model.now.h + i === model.now.a + j) draw += ph[i] * pa[j];
    return p + draw * (pick === "1" ? 0.52 : 0.48);
  }
  return p;
}

/** Does a pick win on a final score? (ml in hockey is handled by its caller.) */
function wins(s: Score, kind: string, line: number, pick: string): boolean {
  const res = s.h > s.a ? "1" : s.h < s.a ? "2" : "X";
  switch (kind) {
    case "1x2":
    case "boost":
      return res === pick;
    case "ml":
      return res === pick;
    case "dc":
      return pick.includes(res);
    case "ou":
      return pick === "over" ? s.h + s.a > line : s.h + s.a < line;
    case "btts":
      return (s.h > 0 && s.a > 0) === (pick === "yes");
    case "cs":
      return pick === `${s.h}-${s.a}`;
    case "hcp": {
      const d = s.h + line - s.a;
      return (d > 0 ? "1" : d < 0 ? "2" : "X") === pick;
    }
    case "spread":
      return pick === "1" ? s.h + line > s.a : s.h + line < s.a;
    default:
      return false;
  }
}

/* ───────────── Prices ───────────── */

const MARGIN: Record<string, number> = { bb: 0.1, scorer: 0.15, assist: 0.15, decisive: 0.14, "1x2": 0.07, dc: 0.05, ou: 0.06, btts: 0.06, hcp: 0.07, ml: 0.05, spread: 0.05, cs: 0.18, htft: 0.16 };

/** Decimal odds with the house margin; null when the market is closed. */
export function priceOf(p: number | null, market: string): number | null {
  if (p === null || !Number.isFinite(p) || p < 0.004 || p > 0.995) return null;
  const m = MARGIN[baseMarket(market).split(":")[0]] ?? 0.08;
  // Long shots: margin on the stake; favourites: on the profit (never below 1.01).
  const o = p <= 0.5 ? 1 / (p * (1 + m)) : 1 + (1 / p - 1) * (1 - 1.5 * m);
  if (o < 1.01) return null;
  return o >= 10 ? Math.round(o * 4) / 4 : Math.round(o * 100) / 100;
}

/** Markets close a little before the end (and at full time). */
export function isOpen(m: Match, now: number) {
  if (m.status === "done" || m.status === "void") return false;
  // Pre-match prices close at kick-off; live prices open once the feed shows the match live.
  if (m.status === "pre") return now < m.kickoff;
  if (m.sport === "football") return elapsed(m, now, 93, 2) < 87;
  if (m.sport === "hockey") return !m.clock || m.clock.period <= 3 ? elapsed(m, now, 60, 3) < 57 : false;
  return elapsed(m, now, /nba/i.test(m.comp.name) ? 48 : 40, 4) < (/nba/i.test(m.comp.name) ? 46 : 38);
}

export function priced(m: Match, model: Model | null, market: Market, now: number): Priced[] {
  const open = model !== null && isOpen(m, now);
  return market.picks.map((p) => ({ ...p, odds: open && model ? priceOf(probOf(model, m.sport, p.market, p.pick), p.market) : null }));
}

/* ───────────── Settlement ───────────── */

/**
 * "won" | "lost" | "void" once the match is over, null while it runs.
 * `twoUpOk`: the "paid 2 goals ahead" offer — pre-match bets only (a bet
 * placed live on a team already 2 goals up would be a free win).
 */
export function settle(m: Match, rawMarket: string, pick: string, twoUpOk = false): "won" | "lost" | "void" | null {
  if (m.status === "void") return "void";
  const market = baseMarket(rawMarket);
  if (market === "bb") {
    // Bet builder: every part must win; one lost part loses it at once.
    const parts = parseBuilder(pick).map((x) => settle(m, x.market, x.pick, twoUpOk));
    if (parts.includes("lost")) return "lost";
    if (parts.includes(null)) return null;
    return parts.every((x) => x === "void") ? "void" : "won";
  }
  const [kind, lineS] = market.split(":");
  const line = lineS !== undefined ? +lineS : 0;
  if (m.status !== "done") return m.status === "pre" ? null : settleEarly(m, kind, line, pick, twoUpOk);
  // Football result (pre-match bets): paid as soon as the team was 2 goals up at half-time.
  if (twoUpOk && twoUp(m, kind, pick, m.ht)) return "won";
  if (kind === "htft") {
    if (!m.ht || !m.regular) return "void";
    const r = (s: Score) => (s.h > s.a ? "1" : s.h < s.a ? "2" : "X");
    return `${r(m.ht)}/${r(m.regular)}` === pick ? "won" : "lost";
  }
  if (kind === "ml" && m.sport === "hockey") {
    if (!m.score) return "void";
    return (m.score.h > m.score.a ? "1" : "2") === pick ? "won" : "lost";
  }
  const s = m.regular ?? m.score;
  if (!s) return "void";
  if (kind === "ou" && s.h + s.a === line) return "void";
  return wins(s, kind, line, pick) ? "won" : "lost";
}

/* ───────────── Bet builder (one football match, several picks) ───────────── */

/** Markets that can go into a bet builder: all read from the final score. */
export const builderOk = (sport: Sport, market: string) => sport === "football" && ["1x2", "dc", "ou", "btts", "cs", "hcp"].includes(market.split(":")[0]);
export type BuilderPart = { market: string; pick: string };
export const encodeBuilder = (parts: BuilderPart[]) => parts.map((p) => `${p.market}=${p.pick}`).join("|");
export function parseBuilder(pick: string): BuilderPart[] {
  return pick
    .split("|")
    .map((x) => x.split("="))
    .filter((x) => x.length === 2 && x[0] && x[1])
    .map(([market, pk]) => ({ market, pick: pk }));
}
/**
 * Joint chance of several picks on the same match, read on the same grid
 * of final scores: correlated picks (a win and over 2.5…) are priced
 * together, contradictory ones come out at zero.
 */
export function builderProb(model: Model, sport: Sport, parts: BuilderPart[]): number | null {
  if (model.kind !== "goals" || sport !== "football" || parts.length < 2) return null;
  if (!parts.every((p) => builderOk(sport, p.market))) return null;
  const ph = poisson(model.lh);
  const pa = poisson(model.la);
  let p = 0;
  for (let i = 0; i < ph.length; i++)
    for (let j = 0; j < pa.length; j++) {
      const s = { h: model.now.h + i, a: model.now.a + j };
      if (
        parts.every((x) => {
          const [k, l] = x.market.split(":");
          return wins(s, k, l !== undefined ? +l : 0, x.pick);
        })
      )
        p += ph[i] * pa[j];
    }
  return p;
}

/** "Paid if 2 goals ahead": football match result (and the daily boost). */
export const TWO_UP = (sport: Sport, market: string, pick: string) => sport === "football" && baseMarket(market) === "1x2" && (pick === "1" || pick === "2");
function twoUp(m: Match, kind: string, pick: string, s: Score | null | undefined) {
  if (!s || !TWO_UP(m.sport, kind, pick)) return false;
  return pick === "1" ? s.h - s.a >= 2 : s.a - s.h >= 2;
}

/**
 * Bets that are already decided while the match is still on, paid (or
 * lost) at once, like a real bookmaker: an "over" passed, both teams have
 * scored, a correct score already beaten, the half-time half of a
 * HT/FT pick, and the football result when the team leads by 2.
 */
function settleEarly(m: Match, kind: string, line: number, pick: string, twoUpOk: boolean): "won" | "lost" | null {
  const s = m.score;
  if (!s) return null;
  // Hockey "60 min" markets: overtime goals do not count.
  if (m.sport === "hockey" && m.clock && m.clock.period > 3) return null;
  const tot = s.h + s.a;
  if (twoUpOk && twoUp(m, kind, pick, s)) return "won";
  switch (kind) {
    case "ou":
      if (tot > line) return pick === "over" ? "won" : "lost";
      return null;
    case "btts":
      if (s.h > 0 && s.a > 0) return pick === "yes" ? "won" : "lost";
      return null;
    case "cs": {
      const [h, a] = pick.split("-").map(Number);
      return s.h > h || s.a > a ? "lost" : null;
    }
    case "htft": {
      // The half-time score is known once the second half has started.
      if (m.sport !== "football" || !m.ht || (m.status !== "break" && (m.clock?.period ?? 0) < 2)) return null;
      const r = m.ht.h > m.ht.a ? "1" : m.ht.h < m.ht.a ? "2" : "X";
      return pick.split("/")[0] !== r ? "lost" : null;
    }
    default:
      return null;
  }
}

/* ───────────── Player markets (football, before kick-off) ───────────── */

export type PlayerKind = "scorer" | "assist" | "decisive";
export const PLAYER_KINDS: { kind: PlayerKind; label: string; title: string }[] = [
  { kind: "scorer", label: "Scores", title: "Anytime scorer" },
  { kind: "assist", label: "Assist", title: "Gives an assist" },
  { kind: "decisive", label: "Goal or assist", title: "Decisive (goal or assist)" },
];
export type PlayerLine = { id: string; name: string; teamId: string; played: number; goals: number; assists: number };

/** Market key of a player bet: "scorer:12345". */
export const playerMarket = (kind: PlayerKind, id: string) => `${kind}:${id}`;
export function parsePlayerMarket(market: string): { kind: PlayerKind; id: string } | null {
  const [k, id] = market.split(":");
  return (k === "scorer" || k === "assist" || k === "decisive") && id ? { kind: k, id } : null;
}

/**
 * Chance that a player scores / assists in this match: his season rate per
 * appearance (shrunk for small samples), scaled by how many goals his team
 * should score today against its season average, and by the chance he
 * plays a full part (~0.82).
 */
export function playerProb(model: Model | null, m: Match, p: PlayerLine, kind: PlayerKind, teamAvg: number | undefined): number | null {
  if (!model || model.kind !== "goals" || m.sport !== "football" || m.status !== "pre") return null;
  if (p.played < 3) return null;
  const lam = p.teamId === m.home.id ? model.lh : p.teamId === m.away.id ? model.la : null;
  if (lam === null) return null;
  const base = teamAvg && teamAvg > 0.3 ? teamAvg : lam;
  const adj = Math.max(0.5, Math.min(1.8, lam / base));
  const g = (p.goals + 0.3) / (p.played + 2);
  const a = (p.assists + 0.2) / (p.played + 2);
  const rate = kind === "scorer" ? g : kind === "assist" ? a : g + a;
  return 0.82 * (1 - Math.exp(-rate * adj));
}
