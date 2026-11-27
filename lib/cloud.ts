import { useSyncExternalStore } from "react";
import { onEvent } from "./events";

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
  /** Sign-ins on the account (when linked). */
  email: string;
  google: boolean;
  passkey: boolean;
  /** Sign-in methods the server offers. */
  providers: { google: boolean; email: boolean };
  at: number;
  busy: boolean;
  msg: string;
};
const META = "royalace:cloud-meta";
const EXCLUDE = new Set([META, "royalace:pwa-dismissed", "royalace:debug", "royalace:sports-results", "royalace:sports-forms"]);
const API = "/api/cloud";

let state: CloudState = { ready: false, configured: false, supported: false, linked: false, name: "", email: "", google: false, passkey: false, providers: { google: false, email: false }, at: 0, busy: false, msg: "" };
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

const SIGNED_IN_MSG: Record<string, string> = {
  google: "Signed in with Google ✓",
  email: "Signed in ✓",
  expired: "This sign-in link has expired or was already used: ask for a new one",
  cancelled: "Sign-in cancelled",
  unavailable: "This sign-in is not available yet",
  error: "Sign-in failed, try again",
};

// After a few rounds as a guest, one nudge to sign in (once per device).
const NUDGE_KEY = "royalace:save-nudge";
const ROUNDS = new Set(["spin", "bjHand", "rouletteSpin", "pokerHand", "crapsRoll", "penaltyRound", "betPlaced"]);
let rounds = 0;
function watchForNudge() {
  try {
    if (localStorage.getItem(NUDGE_KEY)) return;
  } catch {
    return;
  }
  const off = onEvent((e) => {
    if (!ROUNDS.has(e) || ++rounds < 25) return;
    off();
    if (state.linked || !state.configured || !(state.providers.google || state.providers.email || state.supported)) return;
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {}
    const fr = document.documentElement.lang === "fr" || localStorage.getItem("royalace:lang") === "fr";
    window.dispatchEvent(
      new CustomEvent("royal-ace:toast", {
        detail: {
          kind: "info",
          eyebrow: fr ? "Ta progression" : "Your progress",
          title: fr ? "Garde tes jetons sur tous tes appareils" : "Keep your chips on every device",
          text: fr ? "Connecte-toi avec Google ou par e-mail : touche ici" : "Sign in with Google or e-mail: tap here",
          action: "settings",
          ms: 7000,
        },
      }),
    );
  });
}

export const cloud = {
  /** "Continue with Google": leaves for Google, comes back signed in. */
  google() {
    void push(true);
    location.href = "/api/auth/google";
  },
  /** Sends a one-time sign-in link to this address. */
  async emailLink(email: string, fr: boolean) {
    set({ busy: true, msg: "" });
    try {
      await call({ op: "email-start", email, lang: fr ? "fr" : "en" });
      set({ busy: false, msg: fr ? `Lien envoyé à ${email} ✓ Ouvre-le sur cet appareil (regarde aussi les spams).` : `Link sent to ${email} ✓ Open it on this device (check your spam too).` });
      return true;
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      set({ busy: false, msg: m === "bad-email" ? (fr ? "Cette adresse e-mail n'est pas valide" : "This e-mail address is not valid") : errText(e) });
      return false;
    }
  },
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
      // Back from Google or an e-mail link: say how it went, and clean the address.
      const url = new URL(location.href);
      const outcome = url.searchParams.get("signed-in");
      if (outcome) {
        url.searchParams.delete("signed-in");
        history.replaceState(history.state, "", url.pathname + url.search + url.hash);
      }
      const r = await fetch(API, { credentials: "same-origin", cache: "no-store" }).then((x) => x.json());
      set({
        ready: true,
        configured: !!r.configured,
        linked: !!r.linked,
        name: r.name ?? "",
        email: r.email ?? "",
        google: !!r.google,
        passkey: !!r.passkey,
        providers: { google: !!r.providers?.google, email: !!r.providers?.email },
        at: r.at ?? 0,
        msg: outcome ? SIGNED_IN_MSG[outcome] ?? "" : "",
      });
      if (outcome) window.dispatchEvent(new CustomEvent("royal-ace:signed-in", { detail: { outcome, linked: !!r.linked } }));
      if (!r.linked) return watchForNudge();
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
        const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
        set({
          busy: false,
          msg:
            standalone && e instanceof DOMException && e.name === "NotAllowedError"
              ? "iOS blocks creating the key inside the installed app. Create it once in Safari on the same site, then come back here and tap “I already have a save”."
              : errText(e),
        });
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
