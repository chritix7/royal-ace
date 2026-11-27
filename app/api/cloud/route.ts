/**
 * Accounts and cloud save. A player signs in with a passkey (Face ID / Touch
 * ID), Google or an e-mail link (see /api/auth); the save is the player's
 * royalace:* data. No password. Everything here goes through POST { op, ... }.
 */
import { cleanEmail, cleanName, getSave, getUser, json, newSession, readCookies, sessionCookies, sessionUser } from "../../../lib/server/account";
import { mailReady, sendLoginLink } from "../../../lib/server/mail";
import { pipeline, redis, redisReady } from "../../../lib/server/redis";
import { randomId, verifyAssertion, verifyRegistration } from "../../../lib/server/webauthn";
import { weekKey } from "../../../lib/board";
import { nickKey } from "../../../lib/nickRules";

const MAX_SAVE = 900_000;
const providers = () => ({ google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), email: mailReady() });
const okData = (d: unknown): d is Record<string, string> =>
  !!d && typeof d === "object" && !Array.isArray(d) && Object.entries(d).every(([k, v]) => k.startsWith("royalace:") && typeof v === "string");

export async function GET(req: Request) {
  if (!redisReady()) return json({ configured: false, linked: false, providers: providers() });
  try {
    if (new URL(req.url).searchParams.has("health")) {
      const k = `health:${randomId(6)}`;
      const [set, get] = (await pipeline([["SET", k, "1", "EX", 30], ["GET", k]])) as string[];
      return json({ configured: true, storage: set === "OK" && get === "1" ? "ok" : "bad" });
    }
    const uid = await sessionUser(req);
    if (!uid) return json({ configured: true, linked: false, providers: providers() });
    const [user, save] = await Promise.all([getUser(uid), getSave(uid)]);
    if (!user) return json({ configured: true, linked: false, providers: providers() });
    return json({ configured: true, linked: true, name: user.name, email: user.email ?? "", google: !!user.google, passkey: user.keys.length > 0, at: save?.at ?? 0, providers: providers() });
  } catch {
    return json({ configured: true, linked: false, providers: providers(), error: "unavailable" }, 503);
  }
}

export async function POST(req: Request) {
  if (!redisReady()) return json({ error: "storage-not-configured" }, 503);
  const url = new URL(req.url);
  const origin = url.origin;
  const rpId = url.hostname;
  const secure = url.protocol === "https:";
  const raw = await req.text();
  if (raw.length > MAX_SAVE + 10_000) return json({ error: "too-large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  try {
    // Light rate limit per address.
    const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
    const [hits] = (await pipeline([["INCR", `rl:${ip}:${Math.floor(Date.now() / 60000)}`], ["EXPIRE", `rl:${ip}:${Math.floor(Date.now() / 60000)}`, 90]])) as number[];
    if (hits > 90) return json({ error: "slow-down" }, 429);

    switch (body.op) {
      case "reg-options": {
        const current = await sessionUser(req);
        const uid = current ?? randomId(16);
        const name = cleanName(body.name);
        const challenge = randomId(32);
        const cid = randomId(12);
        await redis(["SET", `chal:${cid}`, JSON.stringify({ challenge, uid, name }), "EX", 300]);
        return json({
          cid,
          options: {
            challenge,
            rp: { name: "Chrysonyx", id: rpId },
            user: { id: uid, name: `${name} · Chrysonyx`, displayName: name },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 },
              { type: "public-key", alg: -257 },
            ],
            authenticatorSelection: { residentKey: "required", requireResidentKey: true, userVerification: "required" },
            attestation: "none",
            timeout: 120000,
          },
        });
      }
      case "reg-verify": {
        const c = await redis<string | null>(["GETDEL", `chal:${String(body.cid)}`]);
        if (!c) return json({ error: "expired" }, 400);
        const { challenge, uid, name } = JSON.parse(c) as { challenge: string; uid: string; name: string };
        const cred = body.credential as { clientDataJSON: string; attestationObject: string };
        const key = verifyRegistration(cred, challenge, origin, rpId);
        const user = (await getUser(uid)) ?? { name, created: Date.now(), keys: [] };
        user.keys = [...user.keys.filter((k) => k.id !== key.id), key].slice(-10);
        const cmds: (string | number)[][] = [
          ["SET", `user:${uid}`, JSON.stringify(user)],
          ["SET", `cred:${key.id}`, uid],
        ];
        let at = 0;
        if (okData(body.data) && JSON.stringify(body.data).length <= MAX_SAVE && !(await getSave(uid))) {
          at = Date.now();
          cmds.push(["SET", `save:${uid}`, JSON.stringify({ at, data: body.data })]);
        }
        await pipeline(cmds);
        const t = await newSession(uid);
        return json({ ok: true, name: user.name, at }, 200, sessionCookies(t, secure));
      }
      case "login-options": {
        const challenge = randomId(32);
        const cid = randomId(12);
        await redis(["SET", `chal:${cid}`, JSON.stringify({ challenge }), "EX", 300]);
        return json({ cid, options: { challenge, rpId, userVerification: "required", timeout: 120000 } });
      }
      case "login-verify": {
        const c = await redis<string | null>(["GETDEL", `chal:${String(body.cid)}`]);
        if (!c) return json({ error: "expired" }, 400);
        const { challenge } = JSON.parse(c) as { challenge: string };
        const cred = body.credential as { id: string; clientDataJSON: string; authenticatorData: string; signature: string; userHandle?: string };
        const uid = await redis<string | null>(["GET", `cred:${String(cred?.id)}`]);
        if (!uid) return json({ error: "unknown-key" }, 404);
        if (cred.userHandle && cred.userHandle !== uid) return json({ error: "bad-user" }, 400);
        const user = await getUser(uid);
        const key = user?.keys.find((k) => k.id === cred.id);
        if (!user || !key) return json({ error: "unknown-key" }, 404);
        key.counter = verifyAssertion(cred, key, challenge, origin, rpId);
        await redis(["SET", `user:${uid}`, JSON.stringify(user)]);
        const t = await newSession(uid);
        return json({ ok: true, name: user.name, save: await getSave(uid) }, 200, sessionCookies(t, secure));
      }
      case "save": {
        const uid = await sessionUser(req);
        if (!uid) return json({ error: "signed-out" }, 401);
        if (!okData(body.data)) return json({ error: "bad-data" }, 400);
        const at = Date.now();
        await redis(["SET", `save:${uid}`, JSON.stringify({ at, data: body.data })]);
        return json({ ok: true, at });
      }
      case "load": {
        const uid = await sessionUser(req);
        if (!uid) return json({ error: "signed-out" }, 401);
        return json({ save: await getSave(uid) });
      }
      case "logout": {
        const ts = readCookies(req);
        if (ts.length) await pipeline(ts.map((t) => ["DEL", `sess:${t}`]));
        return json({ ok: true }, 200, sessionCookies(null, secure));
      }
      case "delete": {
        const uid = await sessionUser(req);
        if (!uid) return json({ error: "signed-out" }, 401);
        const user = await getUser(uid);
        const ts = readCookies(req);
        await pipeline([
          ["DEL", `user:${uid}`, `save:${uid}`, ...ts.map((t) => `sess:${t}`)],
          ...(user?.keys ?? []).map((k) => ["DEL", `cred:${k.id}`]),
          ...(user?.google ? [["DEL", `idp:google:${user.google}`]] : []),
          ...(user?.email ? [["DEL", `idp:email:${user.email}`]] : []),
          ...(user?.nick ? [["DEL", `nick:${nickKey(user.nick)}`]] : []),
          ["SREM", "founders", uid],
          ["DEL", `trophies:${uid}`],
          ["HDEL", "tcount", uid],
          // The ranking: this week's line and counters, and the admin log.
          ["ZREM", `lb:${weekKey()}`, uid],
          ["HDEL", `lbn:${weekKey()}`, uid],
          ["DEL", `lbs:${weekKey()}:${uid}`, `grants:${uid}`],
          ["SREM", `lbrev:${weekKey()}`, uid],
        ]);
        return json({ ok: true }, 200, sessionCookies(null, secure));
      }
      case "email-start": {
        if (!mailReady()) return json({ error: "not-available" }, 400);
        const email = cleanEmail(body.email);
        if (!email) return json({ error: "bad-email" }, 400);
        // At most 5 links an hour per address.
        const [n] = (await pipeline([["INCR", `mlrl:${email}`], ["EXPIRE", `mlrl:${email}`, 3600]])) as number[];
        if (n > 5) return json({ error: "slow-down" }, 429);
        const token = randomId(32);
        await redis(["SET", `mlink:${token}`, JSON.stringify({ email }), "EX", 900]);
        await sendLoginLink(email, `${origin}/api/auth/email?t=${token}`, body.lang === "fr");
        return json({ ok: true });
      }
      default:
        return json({ error: "bad-op" }, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    const client = /^(bad-|not-|no-|unsupported|counter|cbor)/.test(msg);
    return json({ error: client ? msg : "unavailable" }, client ? 400 : 503);
  }
}
