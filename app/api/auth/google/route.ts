/** "Continue with Google": sends the player to Google's sign-in page. */
import { redirect } from "../../../../lib/server/account";
import { redis, redisReady } from "../../../../lib/server/redis";
import { randomId } from "../../../../lib/server/webauthn";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id || !process.env.GOOGLE_CLIENT_SECRET || !redisReady()) return redirect(`${url.origin}/?signed-in=unavailable`);
  const state = randomId(24);
  await redis(["SET", `oauth:${state}`, "1", "EX", 600]);
  const q = new URLSearchParams({
    client_id: id,
    redirect_uri: `${url.origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  const secure = url.protocol === "https:";
  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, [
    `ra_oauth=${state}; Path=/api/auth; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}; Max-Age=600`,
  ]);
}
