import { useEffect, useState } from "react";
import { cloud } from "./cloud";
import { cleanNick } from "./nickRules";
import { profileStore } from "./profile";

/**
 * Unique nicknames in the browser. Signed-in players reserve theirs on the
 * server (/api/nick); without an account the nickname stays on the device.
 * The server's copy wins: a restore or another device brings it back.
 */
const API = "/api/nick";
type Claim = { ok: true; nick: string } | { ok: false; error: string; until?: number };

async function claim(name: string): Promise<Claim> {
  try {
    const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    const d = (await r.json().catch(() => ({}))) as { nick?: string; error?: string; until?: number };
    if (r.ok && d.nick) return { ok: true, nick: d.nick };
    return { ok: false, error: d.error ?? "unavailable", until: d.until };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export function nickError(error: string, fr: boolean, until?: number) {
  const day = until ? new Date(until).toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "long" }) : "";
  const m: Record<string, [string, string]> = {
    taken: ["Already taken: try another one", "Déjà pris : essaie un autre pseudo"],
    reserved: ["This name is reserved", "Ce nom est réservé"],
    cooldown: [`You can change it again on ${day}`, `Tu pourras le changer à nouveau le ${day}`],
    bad: ["2 to 16 letters or numbers", "2 à 16 lettres ou chiffres"],
    "signed-out": ["Signed out: sign in again", "Déconnecté : reconnecte-toi"],
  };
  const t = m[error] ?? ["Couldn't check right now, try again", "Vérification impossible pour l'instant, réessaie"];
  return fr ? t[1] : t[0];
}

let syncing = false;
async function sync() {
  if (syncing) return;
  syncing = true;
  try {
    const d = (await fetch(API, { cache: "no-store" }).then((r) => r.json())) as { nick?: string | null };
    const local = profileStore.get().name;
    if (d.nick) {
      if (local !== d.nick) profileStore.setName(d.nick);
      return;
    }
    const n = cleanNick(local);
    if (!n) return;
    const r = await claim(n);
    if (r.ok) {
      if (r.nick !== local) profileStore.setName(r.nick);
    } else if (r.error === "taken" || r.error === "reserved") {
      window.dispatchEvent(new CustomEvent("royal-ace:nick-needed", { detail: { error: r.error } }));
    }
  } catch {
  } finally {
    syncing = false;
  }
}

let started = false;
let wasLinked = false;
export const nick = {
  /** Once, in the browser: reserves the nickname as soon as the player is signed in. */
  start() {
    if (started || typeof window === "undefined") return;
    started = true;
    const tick = () => {
      const s = cloud.get();
      if (s.linked && !wasLinked) void sync();
      wasLinked = s.linked;
    };
    cloud.subscribe(tick);
    tick();
  },
  /**
   * Save a new nickname. Signed in: reserved on the server first.
   * Returns null when saved, or the error message to show.
   */
  async save(raw: string, fr: boolean): Promise<string | null> {
    const n = cleanNick(raw);
    if (!n) return nickError("bad", fr);
    if (!cloud.get().linked) {
      profileStore.setName(n);
      return null;
    }
    const r = await claim(n);
    if (!r.ok) return nickError(r.error, fr, r.until);
    profileStore.setName(r.nick);
    return null;
  },
};

/** Live "available / taken" while typing (signed-in players only). */
export function useNickCheck(value: string, current: string, linked: boolean, fr: boolean) {
  const [state, setState] = useState<{ v: string; ok: boolean; msg: string } | null>(null);
  useEffect(() => {
    const n = cleanNick(value);
    if (!linked || !n || n === current) return;
    let live = true;
    const t = window.setTimeout(async () => {
      try {
        const d = (await fetch(`${API}?n=${encodeURIComponent(n)}`, { cache: "no-store" }).then((r) => r.json())) as { ok?: boolean; reason?: string };
        if (live) setState({ v: value, ok: !!d.ok, msg: d.ok ? (fr ? "✓ Disponible" : "✓ Available") : nickError(d.reason ?? "taken", fr) });
      } catch {}
    }, 350);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [value, current, linked, fr]);
  return state && state.v === value && cleanNick(value) !== current ? state : null;
}
