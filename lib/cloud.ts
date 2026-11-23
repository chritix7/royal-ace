import { useSyncExternalStore } from "react";

/**
 * Cloud save, Game Center style. The account is a passkey (Face ID, synced
 * by iCloud Keychain); the save is every royalace:* entry of this device.
 * Once linked, changes are sent every ~20 s and when the app goes to the
 * background; at launch, a newer save from another device is brought in.
 */
export type CloudState = {
  ready: boolean;
  configured: boolean;
  supported: boolean;
  linked: boolean;
  name: string;
  at: number;
  busy: boolean;
  msg: string;
};
const META = "royalace:cloud-meta";
const EXCLUDE = new Set([META, "royalace:pwa-dismissed", "royalace:debug", "royalace:sports-results", "royalace:sports-forms"]);
const API = "/api/cloud";

let state: CloudState = { ready: false, configured: false, supported: false, linked: false, name: "", at: 0, busy: false, msg: "" };
const listeners = new Set<() => void>();
const set = (p: Partial<CloudState>) => {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
};

// ── local data ──
function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("royalace:") && !EXCLUDE.has(k)) out[k] = localStorage.getItem(k) ?? "";
    }
  } catch {}
  return out;
}
const meta = (): { at: number } => {
  try {
    return JSON.parse(localStorage.getItem(META) ?? "null") ?? { at: 0 };
  } catch {
    return { at: 0 };
  }
};
const setMeta = (at: number) => {
  try {
    localStorage.setItem(META, JSON.stringify({ at }));
  } catch {}
};
/** Replaces this device's data with a save, then reloads. */
function apply(data: Record<string, string>, at: number) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("royalace:") && !EXCLUDE.has(k)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    Object.entries(data).forEach(([k, v]) => k.startsWith("royalace:") && localStorage.setItem(k, v));
  } catch {}
  setMeta(at);
  window.location.reload();
}

async function call<T>(body: Record<string, unknown>, keepalive = false): Promise<T> {
  const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin", keepalive });
  const j = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || j.error) throw new Error(j.error || `http-${res.status}`);
  return j;
}

// ── base64url ⇄ bytes (WebAuthn) ──
const toBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const toB64u = (b: ArrayBuffer | null) => (b ? btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : "");

// ── sync ──
let lastSent = "";
let timer: number | null = null;
async function push(keepalive = false) {
  if (!state.linked) return;
  const data = snapshot();
  const str = JSON.stringify(data);
  if (str === lastSent) return;
  if (keepalive && str.length > 60_000) return; // browsers cap keepalive bodies
  try {
    const r = await call<{ at: number }>({ op: "save", data }, keepalive);
    lastSent = str;
    setMeta(r.at);
    set({ at: r.at, msg: "" });
  } catch (e) {
    if (e instanceof Error && e.message === "signed-out") set({ linked: false });
  }
}
function startSync() {
  if (timer !== null) return;
  timer = window.setInterval(() => void push(), 20_000);
  const away = () => document.visibilityState === "hidden" && void push(true);
  document.addEventListener("visibilitychange", away);
  window.addEventListener("pagehide", () => void push(true));
}

const errText = (e: unknown) => {
  const m = e instanceof Error ? e.message : "";
  if (e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "AbortError")) return "Cancelled";
  if (m === "storage-not-configured") return "Cloud storage is not set up yet";
  if (m === "unknown-key") return "No save found for this passkey";
  if (m === "slow-down") return "Too many tries, wait a minute";
  return "Something went wrong, try again";
};

export const cloud = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  async boot() {
    if (state.ready || typeof window === "undefined") return;
    const supported = typeof window.PublicKeyCredential !== "undefined" && !!navigator.credentials;
    set({ supported });
    try {
      const r = await fetch(API, { credentials: "same-origin", cache: "no-store" }).then((x) => x.json());
      set({ ready: true, configured: !!r.configured, linked: !!r.linked, name: r.name ?? "", at: r.at ?? 0 });
      if (!r.linked) return;
      // Another device saved more recently: bring that save in.
      if ((r.at ?? 0) > meta().at + 1000) {
        const l = await call<{ save: { at: number; data: Record<string, string> } | null }>({ op: "load" });
        if (l.save) return apply(l.save.data, l.save.at);
      }
      startSync();
      void push();
    } catch {
      set({ ready: true });
    }
  },
  /** Creates the passkey (Face ID) and saves this device's progress. */
  async create(name: string) {
    set({ busy: true, msg: "" });
    try {
      const { cid, options } = await call<{ cid: string; options: { challenge: string; user: { id: string; name: string; displayName: string }; [k: string]: unknown } }>({ op: "reg-options", name });
      const cred = (await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: toBytes(options.challenge),
          user: { ...options.user, id: toBytes(options.user.id) },
        } as unknown as PublicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;
      if (!cred) throw new DOMException("cancel", "NotAllowedError");
      const res = cred.response as AuthenticatorAttestationResponse;
      const data = snapshot();
      const r = await call<{ name: string; at: number }>({
        op: "reg-verify",
        cid,
        credential: { id: cred.id, clientDataJSON: toB64u(res.clientDataJSON), attestationObject: toB64u(res.attestationObject) },
        data,
      });
      lastSent = r.at ? JSON.stringify(data) : "";
      if (r.at) setMeta(r.at);
      set({ linked: true, name: r.name, at: r.at, busy: false, msg: "Progress saved ✓" });
      startSync();
      void push();
    } catch (e) {
      set({ busy: false, msg: errText(e) });
    }
  },
  /** Signs in with Face ID and brings the saved progress to this device. */
  async restore() {
    set({ busy: true, msg: "" });
    try {
      const { cid, options } = await call<{ cid: string; options: { challenge: string; rpId: string; userVerification: UserVerificationRequirement; timeout: number } }>({ op: "login-options" });
      const cred = (await navigator.credentials.get({
        publicKey: { ...options, challenge: toBytes(options.challenge) },
      })) as PublicKeyCredential | null;
      if (!cred) throw new DOMException("cancel", "NotAllowedError");
      const res = cred.response as AuthenticatorAssertionResponse;
      const r = await call<{ name: string; save: { at: number; data: Record<string, string> } | null }>({
        op: "login-verify",
        cid,
        credential: {
          id: cred.id,
          clientDataJSON: toB64u(res.clientDataJSON),
          authenticatorData: toB64u(res.authenticatorData),
          signature: toB64u(res.signature),
          userHandle: toB64u(res.userHandle),
        },
      });
      if (r.save) return apply(r.save.data, r.save.at);
      set({ linked: true, name: r.name, busy: false, msg: "Signed in ✓" });
      startSync();
      void push();
    } catch (e) {
      set({ busy: false, msg: errText(e) });
    }
  },
  syncNow: async () => {
    set({ busy: true });
    lastSent = "";
    await push();
    set({ busy: false, msg: "Saved ✓" });
  },
  async signOut() {
    await push();
    await call({ op: "logout" }).catch(() => {});
    set({ linked: false, name: "", msg: "" });
  },
  async deleteAccount() {
    set({ busy: true });
    try {
      await call({ op: "delete" });
      set({ linked: false, name: "", at: 0, busy: false, msg: "Account and cloud data deleted" });
    } catch (e) {
      set({ busy: false, msg: errText(e) });
    }
  },

  // ── backup code (no account needed) ──
  async exportCode(): Promise<string> {
    const bytes = new TextEncoder().encode(JSON.stringify(snapshot()));
    if (typeof CompressionStream === "undefined") return "RA0." + toB64u(bytes.buffer as ArrayBuffer);
    const gz = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    return "RA1." + toB64u(gz);
  },
  async importCode(code: string): Promise<boolean> {
    try {
      const c = code.trim().replace(/\s+/g, "");
      const raw = toBytes(c.slice(4));
      let text: string;
      if (c.startsWith("RA1.")) text = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
      else if (c.startsWith("RA0.")) text = new TextDecoder().decode(raw);
      else return false;
      const data = JSON.parse(text) as Record<string, string>;
      if (!data || typeof data !== "object" || !Object.keys(data).some((k) => k.startsWith("royalace:"))) return false;
      // Newer than the cloud copy: if linked, this becomes the save.
      apply(data, Date.now());
      return true;
    } catch {
      return false;
    }
  },
};
export const useCloud = () => useSyncExternalStore(cloud.subscribe, cloud.get, () => state);
