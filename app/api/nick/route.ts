/**
 * Unique nicknames.
 *  GET  ?n=Name  → { ok } or { ok: false, reason }   (is it free for me?)
 *  GET           → { nick }                          (my reserved nickname)
 *  POST { name } → { ok, nick } or { error, until? } (reserve / change)
 */
import { weekKey } from "../../../lib/board";
import { cleanNick, isReserved, NICK_COOLDOWN_MS, NICK_HOLD_S, nickKey } from "../../../lib/nickRules";
import { getUser, json, sessionUser } from "../../../lib/server/account";
import { isAdminUser } from "../../../lib/server/admin";
import { pipeline, redis, redisReady } from "../../../lib/server/redis";

type Why = "bad" | "reserved" | "taken";
/** Nicknames kept for the owner accounts (ADMIN_NICKS env var, comma-separated). */
const ownerNicks = () => (process.env.ADMIN_NICKS ?? "").split(",").map((s) => s.trim()).filter(Boolean).map(nickKey);

async function whyNot(name: string, uid: string | null, admin: boolean): Promise<Why | null> {
  const n = cleanNick(name);
  if (!n) return "bad";
  const k = nickKey(n);
  if (!admin && (isReserved(n) || ownerNicks().includes(k))) return "reserved";
  const [owner, held] = (await pipeline([["GET", `nick:${k}`], ["GET", `nickhold:${k}`]])) as (string | null)[];
  if (owner && owner !== uid) return "taken";
  if (held && held !== uid) return "taken";
  return null;
}

export async function GET(req: Request) {
  if (!redisReady()) return json({ ok: true, nick: null });
  try {
    const uid = await sessionUser(req);
    const n = new URL(req.url).searchParams.get("n");
    if (n === null) {
      if (!uid) return json({ nick: null });
      const u = await getUser(uid);
      return json({ nick: u?.nick ?? null });
    }
    const why = await whyNot(n, uid, uid ? isAdminUser(await getUser(uid)) : false);
    return json(why ? { ok: false, reason: why } : { ok: true });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}

export async function POST(req: Request) {
  if (!redisReady()) return json({ error: "storage-not-configured" }, 503);
  try {
    const uid = await sessionUser(req);
    if (!uid) return json({ error: "signed-out" }, 401);
    const body = (await req.json().catch(() => ({}))) as { name?: unknown };
    const name = cleanNick(body.name);
    if (!name) return json({ error: "bad" }, 400);
    const user = await getUser(uid);
    if (!user) return json({ error: "signed-out" }, 401);
    const admin = isAdminUser(user);
    const key = nickKey(name);
    const oldKey = user.nick ? nickKey(user.nick) : null;

    // Same nickname (or just a different spelling of it): no cooldown.
    if (oldKey !== key && user.nick && user.nickAt && Date.now() - user.nickAt < NICK_COOLDOWN_MS && !admin) {
      return json({ error: "cooldown", until: user.nickAt + NICK_COOLDOWN_MS }, 409);
    }
    const why = await whyNot(name, uid, admin);
    if (why) return json({ error: why }, 409);
    // Take it atomically: someone may grab it at the same moment.
    const got = await redis<string | null>(["SET", `nick:${key}`, uid, "NX"]);
    if (got !== "OK") {
      const owner = await redis<string | null>(["GET", `nick:${key}`]);
      if (owner !== uid) return json({ error: "taken" }, 409);
    }
    const cmds: (string | number)[][] = [];
    if (oldKey && oldKey !== key) cmds.push(["DEL", `nick:${oldKey}`], ["SET", `nickhold:${oldKey}`, uid, "EX", NICK_HOLD_S]);
    const changed = oldKey !== key;
    user.nick = name;
    if (changed) user.nickAt = Date.now();
    cmds.push(["SET", `user:${uid}`, JSON.stringify(user)]);
    if (admin) cmds.push(["SADD", "founders", uid]);
    // This week's ranking shows the new name right away.
    cmds.push(["HSET", `lbn:${weekKey()}`, uid, name], ["EXPIRE", `lbn:${weekKey()}`, 60 * 60 * 24 * 21]);
    await pipeline(cmds);
    return json({ ok: true, nick: name });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
