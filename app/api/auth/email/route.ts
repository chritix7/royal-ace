/** The sign-in link from the e-mail: one use, 15 minutes. */
import { accountFor, back, newSession, redirect, sessionCookies } from "../../../../lib/server/account";
import { redis, redisReady } from "../../../../lib/server/redis";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t") ?? "";
  if (!redisReady() || !/^[A-Za-z0-9_-]{20,}$/.test(t)) return redirect(back(url.origin, "expired"));
  const raw = await redis<string | null>(["GETDEL", `mlink:${t}`]);
  if (!raw) return redirect(back(url.origin, "expired"));
  const { email } = JSON.parse(raw) as { email: string };
  const { uid } = await accountFor(req, { email, name: email.split("@")[0] });
  const s = await newSession(uid);
  return redirect(back(url.origin, "email"), sessionCookies(s, url.protocol === "https:"));
}
