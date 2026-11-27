/**
 * Weekly ranking (see lib/board.ts for the rules).
 *  GET            → top 50 of the week, plus the signed-in player's line
 *  POST report    → { rounds: Round[], name } from a signed-in player
 *  POST grant     → admin only: chips for the admin's own wallet (logged, never ranked)
 *  POST review    → admin only: { uid, action: "approve" | "hide" }
 */
import { boardName, countRound, MAX_BATCH, MAX_PER_MIN, suspicious, weekEnds, weekKey, type WeekStats } from "../../../lib/board";
import { getUser, json, sessionUser } from "../../../lib/server/account";
import { isAdminUser } from "../../../lib/server/admin";
import { pipeline, redis, redisReady } from "../../../lib/server/redis";

const KEEP = 60 * 60 * 24 * 21; // weeks stay readable for three weeks
const TOP = 50;

const k = (wk: string) => ({ board: `lb:${wk}`, names: `lbn:${wk}`, review: `lbrev:${wk}`, stats: (uid: string) => `lbs:${wk}:${uid}` });

async function isAdmin(uid: string | null) {
  return !!uid && isAdminUser(await getUser(uid));
}

const num = (v: unknown) => (typeof v === "string" || typeof v === "number" ? Number(v) || 0 : 0);
function parseStats(raw: unknown): WeekStats {
  const o: Record<string, unknown> = {};
  if (Array.isArray(raw)) for (let i = 0; i + 1 < raw.length; i += 2) o[String(raw[i])] = raw[i + 1];
  else if (raw && typeof raw === "object") Object.assign(o, raw);
  return { rounds: num(o.rounds), staked: num(o.staked), won: num(o.won), score: num(o.score), big: num(o.big), max: num(o.max), bad: num(o.bad), ok: num(o.ok), hidden: num(o.hidden) };
}
const pairs = (raw: unknown): [string, number][] => {
  const a = Array.isArray(raw) ? raw : [];
  const out: [string, number][] = [];
  for (let i = 0; i + 1 < a.length; i += 2) out.push([String(a[i]), Number(a[i + 1])]);
  return out;
};

export async function GET(req: Request) {
  const wk = weekKey();
  const K = k(wk);
  if (!redisReady()) return json({ week: wk, ends: weekEnds(), rows: [], me: null });
  try {
    const uid = await sessionUser(req);
    const [top, total] = (await pipeline([["ZREVRANGE", K.board, 0, TOP - 1, "WITHSCORES"], ["ZCARD", K.board]])) as [unknown, number];
    const list = pairs(top);
    const ids = list.map(([u]) => u);
    const [names, founders] = ids.length ? ((await pipeline([["HMGET", K.names, ...ids], ["SMISMEMBER", "founders", ...ids]])) as [(string | null)[], number[]]) : [[], []];
    const rows = list.map(([u, score], i) => ({ pos: i + 1, name: names[i] || "Player", score: Math.round(score), you: u === uid, founder: founders[i] === 1 }));
    let me = null;
    let review: { uid: string; name: string; score: number; rounds: number; why: string }[] | undefined;
    if (uid) {
      const [rank, raw] = (await pipeline([["ZREVRANK", K.board, uid], ["HGETALL", K.stats(uid)]])) as [number | null, unknown];
      const s = parseStats(raw);
      me = { rank: rank === null ? 0 : rank + 1, score: Math.round(s.score), rounds: s.rounds, status: s.hidden ? "hidden" : rank === null && s.rounds > 0 ? "review" : "ok" };
      if (await isAdmin(uid)) {
        const ids = (await redis<string[]>(["SMEMBERS", K.review])) ?? [];
        review = await Promise.all(
          ids.slice(0, 30).map(async (id) => {
            const [n, r] = (await pipeline([["HGET", K.names, id], ["HGETALL", K.stats(id)]])) as [string | null, unknown];
            const st = parseStats(r);
            return { uid: id, name: n || "Player", score: Math.round(st.score), rounds: st.rounds, why: suspicious(st) ?? "held" };
          }),
        );
      }
    }
    return json({ week: wk, ends: weekEnds(), total, rows, me, admin: review !== undefined, review });
  } catch {
    return json({ week: wk, ends: weekEnds(), rows: [], me: null, error: "unavailable" }, 503);
  }
}

export async function POST(req: Request) {
  if (!redisReady()) return json({ error: "storage-not-configured" }, 503);
  const raw = await req.text();
  if (raw.length > 20_000) return json({ error: "too-large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  try {
    const uid = await sessionUser(req);
    if (!uid) return json({ error: "signed-out" }, 401);
    const wk = weekKey();
    const K = k(wk);

    if (body.op === "report") {
      const rounds = Array.isArray(body.rounds) ? body.rounds.slice(0, MAX_BATCH) : [];
      if (!rounds.length) return json({ ok: true });
      const minute = `lbr:${uid}:${Math.floor(Date.now() / 60000)}`;
      const [n] = (await pipeline([["INCRBY", minute, rounds.length], ["EXPIRE", minute, 120]])) as number[];
      let staked = 0, won = 0, score = 0, big = 0, max = 0, bad = 0, count = 0;
      if (n > MAX_PER_MIN) bad = 1;
      else
        for (const r of rounds) {
          const c = countRound(r);
          if (!c) {
            bad++;
            continue;
          }
          count++;
          staked += c.stake;
          won += c.ret;
          score += c.net;
          if (c.big) big++;
          max = Math.max(max, c.ret);
        }
      const S = K.stats(uid);
      const out = (await pipeline([
        ["HINCRBY", S, "rounds", count],
        ["HINCRBYFLOAT", S, "staked", staked],
        ["HINCRBYFLOAT", S, "won", won],
        ["HINCRBYFLOAT", S, "score", score],
        ["HINCRBY", S, "big", big],
        ["HINCRBY", S, "bad", bad],
        ["HGETALL", S],
        ["EXPIRE", S, KEEP],
      ])) as unknown[];
      const s = parseStats(out[6]);
      if (max > s.max) s.max = max;
      const user = await getUser(uid);
      const name = boardName(user?.nick);
      const why = suspicious(s);
      const cmds: (string | number)[][] = [
        ["HSET", S, "max", s.max],
        ["HSET", K.names, uid, name],
        ["EXPIRE", K.names, KEEP],
      ];
      if (why || s.hidden) {
        cmds.push(["ZREM", K.board, uid]);
        if (!s.hidden) cmds.push(["SADD", K.review, uid], ["EXPIRE", K.review, KEEP]);
      } else cmds.push(["ZADD", K.board, Math.round(s.score), uid], ["EXPIRE", K.board, KEEP]);
      await pipeline(cmds);
      return json({ ok: true, counted: count, held: !!why || !!s.hidden });
    }

    if (body.op === "grant") {
      if (!(await isAdmin(uid))) return json({ error: "not-allowed" }, 403);
      const amount = Math.floor(Number(body.amount));
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return json({ error: "bad-amount" }, 400);
      await redis(["LPUSH", `grants:${uid}`, JSON.stringify({ at: Date.now(), amount })]);
      return json({ ok: true, amount });
    }

    if (body.op === "review") {
      if (!(await isAdmin(uid))) return json({ error: "not-allowed" }, 403);
      const who = String(body.uid ?? "");
      if (!/^[A-Za-z0-9_-]{6,64}$/.test(who)) return json({ error: "bad-uid" }, 400);
      const S = K.stats(who);
      if (body.action === "approve") {
        await pipeline([["HSET", S, "ok", 1], ["HDEL", S, "hidden"], ["SREM", K.review, who]]);
        const s = parseStats(await redis(["HGETALL", S]));
        await redis(["ZADD", K.board, Math.round(s.score), who]);
      } else if (body.action === "hide") {
        await pipeline([["HSET", S, "hidden", 1], ["SREM", K.review, who], ["ZREM", K.board, who]]);
      } else return json({ error: "bad-action" }, 400);
      return json({ ok: true });
    }
    return json({ error: "bad-op" }, 400);
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
