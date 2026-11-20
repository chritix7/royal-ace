/**
 * Sportsbook data, shared by every player. The free data plans are small,
 * so answers are cached at Vercel's edge (s-maxage) and in this instance's
 * memory: whatever the number of players, the providers see a handful of
 * calls. The API keys stay on the server.
 *
 *   ?feed=football                       live, upcoming and recent matches
 *   ?feed=football-standings&comp=PL     table of one competition
 *   ?feed=basketball&date=2026-11-20     games of one day (top leagues)
 *   ?feed=hockey&date=2026-11-20
 *   ?feed=basketball-standings&league=12&season=2025-2026  (same for hockey)
 */
import { FOOTBALL_COMPS, footballMatch, footballStandings, isTopLeague, sportsGame, sportsStandings } from "../../../lib/sports/providers";
import type { Match } from "../../../lib/sports/types";

type Entry = { at: number; ttl: number; body: string };
const memory = new Map<string, Entry>();
const fdCalls: number[] = [];

const day = (d: Date) => d.toISOString().slice(0, 10);

function reply(body: string, ttl: number, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}`,
      // Shared edge cache on Vercel, whatever the browser does.
      "cdn-cache-control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}`,
    },
  });
}
const fail = (error: string, ttl = 30) => reply(JSON.stringify({ error, at: Date.now(), matches: [], teams: {} }), ttl);

async function getJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { ok: res.ok, status: res.status, json: json as Record<string, unknown> | null };
}

async function football(url: string) {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) throw new Error("missing-key");
  // Free plan: 10 calls a minute. Keep a margin for the other instances.
  const now = Date.now();
  while (fdCalls.length && now - fdCalls[0] > 60000) fdCalls.shift();
  if (fdCalls.length >= 8) throw new Error("busy");
  fdCalls.push(now);
  const r = await getJson(`https://api.football-data.org/v4${url}`, { "X-Auth-Token": key });
  if (!r.ok) throw new Error(r.status === 429 ? "busy" : `provider-${r.status}`);
  return r.json;
}

async function apiSports(sport: "basketball" | "hockey", url: string) {
  const key = process.env.API_SPORTS_KEY;
  if (!key) throw new Error("missing-key");
  const r = await getJson(`https://v1.${sport}.api-sports.io${url}`, { "x-apisports-key": key });
  if (!r.ok) throw new Error(`provider-${r.status}`);
  const errors = r.json?.errors;
  if (errors && (Array.isArray(errors) ? errors.length : Object.keys(errors).length)) {
    throw new Error(`provider: ${Object.values(errors as Record<string, string>).join(" ").slice(0, 160)}`);
  }
  return r.json;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const feed = q.get("feed") ?? "";
  const now = new Date();
  let key = feed;
  let ttl = 60;
  let load: () => Promise<unknown>;

  if (feed === "football") {
    ttl = 20;
    const from = day(new Date(now.getTime() - 2 * 86400000));
    const to = day(new Date(now.getTime() + 4 * 86400000));
    key = `football:${from}`;
    load = async () => {
      const json = await football(`/matches?dateFrom=${from}&dateTo=${to}`);
      const list = Array.isArray(json?.matches) ? json.matches : [];
      const matches = list.map(footballMatch).filter((m: Match | null): m is Match => m !== null);
      return { matches, at: Date.now() };
    };
  } else if (feed === "football-standings") {
    const comp = (q.get("comp") ?? "").toUpperCase();
    if (!FOOTBALL_COMPS[comp]) return fail("bad-request", 3600);
    ttl = 6 * 3600;
    key = `fbst:${comp}`;
    load = async () => ({ teams: footballStandings(await football(`/competitions/${comp}/standings`)), at: Date.now() });
  } else if (feed === "basketball" || feed === "hockey") {
    const sport = feed;
    const date = q.get("date") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("bad-request", 3600);
    // 100 calls a day for each sport: today every 30 min, past days once a day.
    const today = day(now);
    ttl = date === today ? 30 * 60 : date < today ? 24 * 3600 : 6 * 3600;
    key = `${sport}:${date}`;
    load = async () => {
      const json = await apiSports(sport, `/games?date=${date}&timezone=UTC`);
      const list: unknown[] = Array.isArray(json?.response) ? (json.response as unknown[]) : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const top = list.filter((g: any) => isTopLeague(sport, String(g?.country?.name ?? ""), String(g?.league?.name ?? "")));
      const matches = top.map((g) => sportsGame(sport, g)).filter((m): m is Match => m !== null);
      return { matches, at: Date.now() };
    };
  } else if (feed === "basketball-standings" || feed === "hockey-standings") {
    const sport = feed === "basketball-standings" ? "basketball" : "hockey";
    const league = q.get("league") ?? "";
    const season = q.get("season") ?? "";
    if (!/^\d{1,6}$/.test(league) || !/^[\d-]{4,9}$/.test(season)) return fail("bad-request", 3600);
    ttl = 12 * 3600;
    key = `${feed}:${league}:${season}`;
    load = async () => ({ teams: sportsStandings(sport, await apiSports(sport, `/standings?league=${league}&season=${season}`)), at: Date.now() });
  } else {
    return fail("bad-request", 3600);
  }

  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < hit.ttl * 1000) return reply(hit.body, Math.max(5, Math.round(hit.ttl - (Date.now() - hit.at) / 1000)));
  try {
    const body = JSON.stringify(await load());
    memory.set(key, { at: Date.now(), ttl, body });
    if (memory.size > 200) memory.delete(memory.keys().next().value as string);
    return reply(body, ttl);
  } catch (e) {
    // Serve the last good answer if we have one.
    if (hit) return reply(hit.body, 30);
    const msg = e instanceof Error ? e.message : "error";
    return fail(msg, msg === "missing-key" ? 300 : 30);
  }
}
