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

// ── prepared ceremonies ──
// iPhone Safari only opens Face ID when the request starts right inside the
// tap: the server challenge is fetched beforehand (Settings open), so the
// tap calls navigator.credentials with nothing awaited first.
type RegOpts = { cid: string; options: { challenge: string; user: { id: string; name: string; displayName: string }; [k: string]: unknown } };
type LoginOpts = { cid: string; options: { challenge: string; rpId: string; userVerification: UserVerificationRequirement; timeout: number } };
let prepared: { at: number; name: string; reg: RegOpts | null; login: LoginOpts | null } | null = null;
const fresh = () => !!prepared && Date.now() - prepared.at < 4 * 60_000;

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
  if (e instanceof DOMException && e.name === "NotAllowedError") return `Face ID was cancelled or not allowed — ${e.message}`;
  if (e instanceof DOMException && e.name === "InvalidStateError") return "A passkey already exists here: tap “I already have a save”";
  if (e instanceof DOMException) return `Face ID unavailable (${e.name})`;
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
  /** Fetches the challenges ahead of the tap (see above). */
  async prepare(name: string) {
    if (!state.configured || !state.supported) return;
    if (fresh() && prepared!.name === name) return;
    try {
      const [reg, login] = await Promise.all([call<RegOpts>({ op: "reg-options", name }), call<LoginOpts>({ op: "login-options" })]);
      prepared = { at: Date.now(), name, reg, login };
    } catch {
      prepared = null;
    }
  },
  /** Creates the passkey (Face ID) and saves this device's progress. Call straight from the tap. */
  create(name: string) {
    if (!fresh() || !prepared?.reg) {
      set({ msg: "One moment, then tap again" });
      void cloud.prepare(name);
      return;
    }
    const { cid, options } = prepared.reg;
    prepared = null;
    set({ busy: true, msg: "" });
    // Started synchronously, inside the tap.
    const ask = navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: toBytes(options.challenge),
        user: { ...options.user, id: toBytes(options.user.id) },
      } as unknown as PublicKeyCredentialCreationOptions,
    });
    void (async () => {
      try {
        const cred = (await ask) as PublicKeyCredential | null;
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
        void cloud.prepare(name);
      }
    })();
  },
  /** Signs in with Face ID and brings the saved progress to this device. Call straight from the tap. */
  restore() {
    if (!fresh() || !prepared?.login) {
      set({ msg: "One moment, then tap again" });
      void cloud.prepare(prepared?.name ?? "Player");
      return;
    }
    const { cid, options } = prepared.login;
    const name = prepared.name;
    prepared = null;
    set({ busy: true, msg: "" });
    const ask = navigator.credentials.get({ publicKey: { ...options, challenge: toBytes(options.challenge) } });
    void (async () => {
      try {
        const cred = (await ask) as PublicKeyCredential | null;
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
        void cloud.prepare(name);
      }
    })();
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
