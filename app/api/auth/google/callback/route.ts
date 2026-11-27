/** Google sends the player back here: check, sign in (or create the account), return to the game. */
import { accountFor, back, newSession, readCookies, redirect, sessionCookies } from "../../../../../lib/server/account";
import { redis } from "../../../../../lib/server/redis";

type IdToken = { iss: string; aud: string; exp: number; sub: string; email?: string; email_verified?: boolean; given_name?: string; name?: string };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secure = url.protocol === "https:";
  const clear = `ra_oauth=; Path=/api/auth; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}; Max-Age=0`;
  const fail = (why: string) => redirect(back(url.origin, why), [clear]);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  if (!code) return fail("cancelled");
  // The state must be the one this browser was given, and only once.
  if (!readCookies(req, "ra_oauth").includes(state) || !(await redis<string | null>(["GETDEL", `oauth:${state}`]))) return fail("expired");
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(8000),
    });
    const tok = (await res.json()) as { id_token?: string };
    if (!res.ok || !tok.id_token) return fail("error");
    // Received straight from Google over TLS with our secret: the payload can be read as is.
    const p = JSON.parse(Buffer.from(tok.id_token.split(".")[1], "base64url").toString("utf8")) as IdToken;
    const okIss = p.iss === "https://accounts.google.com" || p.iss === "accounts.google.com";
    if (!okIss || p.aud !== process.env.GOOGLE_CLIENT_ID || p.exp * 1000 < Date.now() || !p.sub) return fail("error");
    const email = p.email && p.email_verified ? p.email.toLowerCase() : undefined;
    const { uid } = await accountFor(req, { google: p.sub, email, name: p.given_name ?? p.name });
    const t = await newSession(uid);
    return redirect(back(url.origin, "google"), [clear, ...sessionCookies(t, secure)]);
  } catch {
    return fail("error");
  }
}
