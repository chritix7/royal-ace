/**
 * Accounts: one player = one uid, reachable by any of its sign-ins
 * (passkey, Google, e-mail link). Sessions are an HttpOnly cookie.
 * Server only.
 */
import { pipeline, redis } from "./redis";
import { randomId, type StoredKey } from "./webauthn";

export type User = { name: string; created: number; keys: StoredKey[]; email?: string; google?: string };
export const COOKIE = "ra_sess";
export const SESSION_TTL = 60 * 60 * 24 * 365;

export const json = (body: unknown, status = 200, cookies: string[] = []) => {
  const h = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  cookies.forEach((c) => h.append("set-cookie", c));
  return new Response(JSON.stringify(body), { status, headers: h });
};
export const redirect = (to: string, cookies: string[] = []) => {
  const h = new Headers({ location: to, "cache-control": "no-store" });
  cookies.forEach((c) => h.append("set-cookie", c));
  return new Response(null, { status: 303, headers: h });
};

/** The session cookie covers every /api route (sign-ins live under /api/auth). */
export function sessionCookies(token: string | null, secure: boolean): string[] {
  const s = secure ? "; Secure" : "";
  const main = `${COOKIE}=${token ?? ""}; Path=/api; HttpOnly; SameSite=Lax${s}; Max-Age=${token ? SESSION_TTL : 0}`;
  // Sessions made before accounts lived on /api/cloud only: clear that copy.
  const legacy = `${COOKIE}=; Path=/api/cloud; HttpOnly; SameSite=Strict${s}; Max-Age=0`;
  return [main, legacy];
}
export function readCookies(req: Request, name = COOKIE): string[] {
  const out: string[] = [];
  const re = new RegExp(`(?:^|; )${name}=([A-Za-z0-9_-]{20,})`, "g");
  for (const m of (req.headers.get("cookie") ?? "").matchAll(re)) out.push(m[1]);
  return out;
}
export async function sessionUser(req: Request): Promise<string | null> {
  for (const t of readCookies(req)) {
    const uid = await redis<string | null>(["GET", `sess:${t}`]);
    if (uid) {
      await redis(["EXPIRE", `sess:${t}`, SESSION_TTL]);
      return uid;
    }
  }
  return null;
}
export async function newSession(uid: string) {
  const t = randomId(32);
  await redis(["SET", `sess:${t}`, uid, "EX", SESSION_TTL]);
  return t;
}
export const getUser = async (uid: string) => {
  const raw = await redis<string | null>(["GET", `user:${uid}`]);
  return raw ? (JSON.parse(raw) as User) : null;
};
export const getSave = async (uid: string) => {
  const raw = await redis<string | null>(["GET", `save:${uid}`]);
  return raw ? (JSON.parse(raw) as { at: number; data: Record<string, string> }) : null;
};
export const cleanName = (s: unknown) => (typeof s === "string" ? s.replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, 16) : "") || "Player";
export const cleanEmail = (s: unknown) => {
  const e = typeof s === "string" ? s.trim().toLowerCase() : "";
  return e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
};

/**
 * Finds the account behind a Google or e-mail sign-in, or makes one.
 * An address already known (from Google or an e-mail link) reaches the same
 * account; a player already signed in (passkey) gets the new sign-in added.
 */
export async function accountFor(req: Request, id: { google?: string; email?: string; name?: string }): Promise<{ uid: string; user: User }> {
  const [byGoogle, byEmail] = (await pipeline([
    ["GET", id.google ? `idp:google:${id.google}` : "idp:none"],
    ["GET", id.email ? `idp:email:${id.email}` : "idp:none"],
  ])) as (string | null)[];
  const uid = byGoogle ?? byEmail ?? (await sessionUser(req)) ?? randomId(16);
  const user = (await getUser(uid)) ?? { name: cleanName(id.name), created: Date.now(), keys: [] };
  if (id.google && !user.google) user.google = id.google;
  if (id.email && !user.email) user.email = id.email;
  const cmds: (string | number)[][] = [["SET", `user:${uid}`, JSON.stringify(user)]];
  if (id.google && !byGoogle) cmds.push(["SET", `idp:google:${id.google}`, uid]);
  if (id.email && !byEmail) cmds.push(["SET", `idp:email:${id.email}`, uid]);
  await pipeline(cmds);
  return { uid, user };
}

/** Where a sign-in sends the player back, with the outcome for the game to show. */
export const back = (origin: string, outcome: string) => `${origin}/?signed-in=${encodeURIComponent(outcome)}`;
