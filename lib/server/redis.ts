/**
 * Minimal Upstash Redis client over its REST API (no package needed).
 * Vercel's Upstash integration provides KV_REST_API_URL / KV_REST_API_TOKEN
 * (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). Server only.
 */
type Cmd = (string | number)[];

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}
export const redisReady = () => creds() !== null;

export async function redis<T = unknown>(cmd: Cmd): Promise<T> {
  const c = creds();
  if (!c) throw new Error("storage-not-configured");
  const res = await fetch(c.url, {
    method: "POST",
    headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => null)) as { result?: T; error?: string } | null;
  if (!res.ok || !json || json.error) throw new Error(json?.error || `redis-${res.status}`);
  return json.result as T;
}

export async function pipeline(cmds: Cmd[]): Promise<unknown[]> {
  const c = creds();
  if (!c) throw new Error("storage-not-configured");
  const res = await fetch(`${c.url}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => null)) as { result?: unknown; error?: string }[] | null;
  if (!res.ok || !Array.isArray(json)) throw new Error(`redis-${res.status}`);
  const bad = json.find((r) => r.error);
  if (bad) throw new Error(bad.error);
  return json.map((r) => r.result);
}
