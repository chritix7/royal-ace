/**
 * Nickname rules, shared by the browser and the server. A nickname belongs
 * to one account; look-alikes ("Chris", "chris", "Chrïs", "Chr1s", "Chris_")
 * share the same key, so nobody can pose as someone else.
 */

/** 2 to 16 characters: letters (any language), digits, space, . _ - ' */
export function cleanNick(raw: unknown): string | null {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 16);
  return /^[\p{L}\p{N} ._'-]{2,16}$/u.test(s) ? s : null;
}

const LOOKALIKE: Record<string, string> = { "0": "o", "1": "i", l: "i", "!": "i", "|": "i", "3": "e", "4": "a", "@": "a", "5": "s", $: "s", "7": "t", "8": "b", "9": "g", "2": "z", "6": "g" };

/** The uniqueness key: lower case, no accents, look-alike characters folded, no separators. */
export function nickKey(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[ ._'-]/g, "")
    .replace(/./gu, (c) => LOOKALIKE[c] ?? c)
    .replace(/(.)\1+/g, "$1"); // "Chriss" = "Chris"
}

/** Nobody can take these (or a look-alike). */
const RESERVED = ["chrysonyx", "admin", "administrator", "administrateur", "moderator", "moderateur", "modo", "support", "staff", "official", "officiel", "croupier", "dealer", "casino", "system", "systeme", "player", "joueur", "founder", "fondateur", "anonymous", "anonyme", "you", "toi"].map(nickKey);
export const isReserved = (name: string) => {
  const k = nickKey(name);
  return RESERVED.some((r) => k === r || (r.length >= 5 && k.includes(r)));
};

/** A player may change nickname once a week; the old one stays held for 30 days. */
export const NICK_COOLDOWN_MS = 7 * 86400000;
export const NICK_HOLD_S = 30 * 86400;
