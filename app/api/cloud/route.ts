/**
 * Cloud save, Game Center style: an account is a passkey (Face ID / Touch
 * ID, synced by iCloud Keychain), the save is the player's royalace:* data.
 * No e-mail, no password; the server only keeps a public key, the nickname
 * and the game data. Everything goes through POST { op, ... }.
 */
import { pipeline, redis, redisReady } from "../../../lib/server/redis";
import { randomId, verifyAssertion, verifyRegistration, type StoredKey } from "../../../lib/server/webauthn";

type User = { name: string; created: number; keys: StoredKey[] };
const COOKIE = "ra_sess";
const SESSION_TTL = 60 * 60 * 24 * 365;
const MAX_SAVE = 900_000;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

function sessionCookie(token: string | null, secure: boolean) {
  const base = `${COOKIE}=${token ?? ""}; Path=/api/cloud; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
  return token ? `${base}; Max-Age=${SESSION_TTL}` : `${base}; Max-Age=0`;
}
function readCookie(req: Request) {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|; )${COOKIE}=([A-Za-z0-9_-]{20,})`));
  return m?.[1] ?? null;
}
async function sessionUser(req: Request): Promise<string | null> {
  const t = readCookie(req);
  if (!t) return null;
  const uid = await redis<string | null>(["GET", `sess:${t}`]);
  if (uid) await redis(["EXPIRE", `sess:${t}`, SESSION_TTL]);
  return uid;
}
async function newSession(uid: string) {
  const t = randomId(32);
  await redis(["SET", `sess:${t}`, uid, "EX", SESSION_TTL]);
  return t;
}
const getUser = async (uid: string) => {
  const raw = await redis<string | null>(["GET", `user:${uid}`]);
  return raw ? (JSON.parse(raw) as User) : null;
};
const getSave = async (uid: string) => {
  const raw = await redis<string | null>(["GET", `save:${uid}`]);
  return raw ? (JSON.parse(raw) as { at: number; data: Record<string, string> }) : null;
};
const cleanName = (s: unknown) => (typeof s === "string" ? s.replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, 16) : "") || "Player";
const okData = (d: unknown): d is Record<string, string> =>
  !!d && typeof d === "object" && !Array.isArray(d) && Object.entries(d).every(([k, v]) => k.startsWith("royalace:") && typeof v === "string");

export async function GET(req: Request) {
  if (!redisReady()) return json({ configured: false, linked: false });
  try {
    if (new URL(req.url).searchParams.has("health")) {
      const k = `health:${randomId(6)}`;
      const [set, get] = (await pipeline([["SET", k, "1", "EX", 30], ["GET", k]])) as string[];
      return json({ configured: true, storage: set === "OK" && get === "1" ? "ok" : "bad" });
    }
    const uid = await sessionUser(req);
    if (!uid) return json({ configured: true, linked: false });
    const [user, save] = await Promise.all([getUser(uid), getSave(uid)]);
    if (!user) return json({ configured: true, linked: false });
    return json({ configured: true, linked: true, name: user.name, at: save?.at ?? 0 });
  } catch {
    return json({ configured: true, linked: false, error: "unavailable" }, 503);
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
            rp: { name: "Royal Ace", id: rpId },
            user: { id: uid, name: `${name} · Royal Ace`, displayName: name },
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
        return json({ ok: true, name: user.name, at }, 200, { "set-cookie": sessionCookie(t, secure) });
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
        return json({ ok: true, name: user.name, save: await getSave(uid) }, 200, { "set-cookie": sessionCookie(t, secure) });
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
        const t = readCookie(req);
        if (t) await redis(["DEL", `sess:${t}`]);
        return json({ ok: true }, 200, { "set-cookie": sessionCookie(null, secure) });
      }
      case "delete": {
        const uid = await sessionUser(req);
        if (!uid) return json({ error: "signed-out" }, 401);
        const user = await getUser(uid);
        const t = readCookie(req);
        await pipeline([["DEL", `user:${uid}`, `save:${uid}`, `sess:${t}`], ...(user?.keys ?? []).map((k) => ["DEL", `cred:${k.id}`])]);
        return json({ ok: true }, 200, { "set-cookie": sessionCookie(null, secure) });
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
