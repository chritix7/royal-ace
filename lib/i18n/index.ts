import { useSyncExternalStore } from "react";
import { FR } from "./fr";

/**
 * FR / EN. The interface is written in English; in French a light layer
 * translates what is on screen (text, aria-labels, titles) from a
 * dictionary plus a few patterns for the sentences built with numbers.
 * It watches the page for changes, skips anything without letters (the
 * counters) and never touches inputs or names marked translate="no".
 */
export type Lang = "en" | "fr";
const KEY = "royalace:lang";
let lang: Lang = "en";
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const v = localStorage.getItem(KEY);
    lang = v === "fr" || v === "en" ? v : navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
  } catch {}
}

const ACTION: Record<string, string> = { Hit: "Tirer", Stand: "Rester", Double: "Doubler", Split: "Séparer", Surrender: "Abandonner", Call: "Suivre", Fold: "Se coucher" };
const tr = (s: string) => FR[s] ?? s;

/** Sentences built with numbers or names. */
const PATTERNS: [RegExp, (...m: string[]) => string][] = [
  [/^Level (\d+)$/, (_, n) => `Niveau ${n}`],
  [/^Lv (\d+)$/, (_, n) => `Niv. ${n}`],
  [/^(\d+) challenges? today$/, (_, n) => `${n} défi${+n > 1 ? "s" : ""} aujourd'hui`],
  [/^✓ Challenges done$/, () => "✓ Défis terminés"],
  [/^(\d+) of (\d+) today$/, (_, a, b) => `${a} sur ${b} aujourd'hui`],
  [/^(\d+) of (\d+)$/, (_, a, b) => `${a} sur ${b}`],
  [/^([\d,]+) rounds?$/, (_, n) => `${n} manche${n === "1" ? "" : "s"}`],
  [/^Last save: (.+)\. Saves itself while you play; on another device, open Settings and tap “I already have a save”\.$/, (_, v) => `Dernière sauvegarde : ${tr(v)}. Elle se fait toute seule pendant que tu joues ; sur un autre appareil, ouvre les Réglages et touche « J'ai déjà une sauvegarde ».`],
  [/^(\d+) min ago$/, (_, n) => `il y a ${n} min`],
  [/^(\d+) h ago$/, (_, n) => `il y a ${n} h`],
  [/^(\d+) days ago$/, (_, n) => `il y a ${n} jours`],
  [/^Face ID was cancelled or not allowed — (.+)$/, (_, v) => `Face ID a été annulé ou refusé — ${v}`],
  [/^Face ID unavailable \((\w+)\)$/, (_, v) => `Face ID indisponible (${v})`],
  [/^(\d+) of (\d+) owned$/, (_, a, b) => `${a} sur ${b} acquis`],
  [/^Open · ◈ (.+)$/, (_, v) => `Ouvrir · ◈ ${v}`],
  [/^Credit: ◈ (.+) · everything is paid in virtual chips$/, (_, v) => `Crédit : ◈ ${v} · tout se paie en jetons virtuels`],
  [/^×2 · (.+)$/, (_, v) => `×2 · ${v}`],
  [/^From ◈ (.+)$/, (_, v) => `Dès ◈ ${v}`],
  [/^◈ (.+) – all in$/, (_, v) => `◈ ${v} – tapis`],
  [/^Claim ◈ (.+)$/, (_, v) => `Récupérer ◈ ${v}`],
  [/^Tomorrow (.+)$/, (_, v) => `Demain ${v}`],
  [/^Over ([\d.]+)$/, (_, v) => `Plus de ${v}`],
  [/^Under ([\d.]+)$/, (_, v) => `Moins de ${v}`],
  [/^Total goals ([\d.]+)( \(60 min\))?$/, (_, v, r) => `Total de buts ${v}${r ?? ""}`],
  [/^Total points ([\d.]+)$/, (_, v) => `Total de points ${v}`],
  [/^Match result \(60 min\)$/, () => "Résultat (60 min)"],
  [/^Double chance( \(60 min\))?$/, (_, r) => `Double chance${r ?? ""}`],
  [/^Both teams to score( \(60 min\))?$/, (_, r) => `Les deux équipes marquent${r ?? ""}`],
  [/^Both score: (Yes|No)$/, (_, v) => `Les deux marquent : ${v === "Yes" ? "Oui" : "Non"}`],
  [/^Score (\d+-\d+)$/, (_, v) => `Score ${v}`],
  [/^(.+) or draw$/, (_, t) => `${t} ou nul`],
  [/^Draw or (.+)$/, (_, t) => `Nul ou ${t}`],
  [/^Draw \(([+−-]?\d)\)$/, (_, v) => `Nul (${v})`],
  [/^Combo · (\d+) picks$/, (_, n) => `Combiné · ${n} sélections`],
  [/^Bet builder · (\d+) picks$/, (_, n) => `Bet builder · ${n} sélections`],
  [/^Combo won · (\d+) picks$/, (_, n) => `Combiné gagné · ${n} sélections`],
  [/^Combo ×(.+)$/, (_, v) => `Combiné ×${v}`],
  [/^Combo boost \+(\d+)%$/, (_, v) => `Boost combiné +${v} %`],
  [/^(\d) picks → \+5% boost$/, (_, n) => `${n} sélections → boost +5 %`],
  [/^(\d) picks → insurance$/, (_, n) => `${n} sélections → assurance`],
  [/^Ticket · (\d+)$/, (_, n) => `Ticket · ${n}`],
  [/^My bets · (\d+)$/, (_, n) => `Mes paris · ${n}`],
  [/^TICKET · (\d+)$/, (_, n) => `TICKET · ${n}`],
  [/^Ticket placed · potential ◈ (.+)$/, (_, v) => `Ticket validé · gain potentiel ◈ ${v}`],
  [/^Ticket won · ◈ (.+)$/, (_, v) => `Ticket gagné · ◈ ${v}`],
  [/^Cashed out · ◈ (.+)$/, (_, v) => `Encaissé · ◈ ${v}`],
  [/^Cash out ◈ (.+)$/, (_, v) => `Encaisser ◈ ${v}`],
  [/^Win ◈ (.+)$/, (_, v) => `Gain ◈ ${v}`],
  [/^Stake ◈ (.+)$/, (_, v) => `Mise ◈ ${v}`],
  [/^(.+) to win$/, (_, t) => `${t} gagne`],
  [/^(.+) to win · boost$/, (_, t) => `${t} gagne · boost`],
  [/^Follow (.+)$/, (_, t) => `Suivre ${t}`],
  [/^Following (.+)$/, (_, t) => `Suivi : ${t}`],
  [/^Goal (\d)$/, (_, n) => `But ${n}`],
  [/^Goal! ×([\d.]+) · cash out or shoot$/, (_, v) => `But ! ×${v} · encaisse ou retire`],
  [/^Top corner! ×([\d.]+) · cash out or shoot$/, (_, v) => `Lucarne ! ×${v} · encaisse ou retire`],
  [/^×([\d.]+) · cash out or shoot$/, (_, v) => `×${v} · encaisse ou retire`],
  [/^Perfect five · ◈ (.+)$/, (_, v) => `Cinq sur cinq · ◈ ${v}`],
  [/^Next goal pays ◈ (.+)$/, (_, v) => `Le prochain but paie ◈ ${v}`],
  [/^Saved on shot (\d)$/, (_, n) => `Arrêté au tir ${n}`],
  [/^(\d) goals? · ×(.+)$/, (_, n, v) => `${n} but${n === "1" ? "" : "s"} · ×${v}`],
  [/^ACC (\d+) · PWR (\d+)$/, (_, a, p) => `PRÉ ${a} · PUI ${p}`],
  [/^Hint · (Call|Fold)$/, (_, a) => `Aide · ${ACTION[a]}`],
  [/^Win (\d+)% · Tie (\d+)% · Call (.+)$/, (_, w, t, e) => `Victoire ${w} % · Égalité ${t} % · Suivre ${e}`],
  [/^Basic strategy: (\w+)$/, (_, a) => `Stratégie de base : ${ACTION[a] ?? a}`],
  [/^Basic strategy · (\w+)$/, (_, a) => `Stratégie de base · ${ACTION[a] ?? a}`],
  [/^Hand (\d+): your move\.$/, (_, n) => `Main ${n} : à toi de jouer.`],
  [/^Finish your round at (.+) first$/, (_, g) => `Termine d'abord ta manche au ${tr(g)}`],
  [/^Daily bonus · \+◈ (.+)$/, (_, v) => `Bonus du jour · +◈ ${v}`],
  [/^Bonus complete: ◈ (.+)$/, (_, v) => `Bonus terminé : ◈ ${v}`],
  [/^#(\d+) this week$/, (_, n) => `#${n} cette semaine`],
  [/^#(\d+) of (\d+)$/, (_, a, b) => `#${a} sur ${b}`],
  [/^Level (\d+) · member since (.+)$/, (_, n, d) => `Niveau ${n} · membre depuis le ${d}`],
  [/^(.+) \(you\)$/, (_, n) => `${n} (toi)`],
  [/^Money figures count from (.+)\. Virtual chips only\.$/, (_, d) => `Les montants comptent depuis le ${d}. Jetons virtuels uniquement.`],
  [/^Pin (.+)$/, (_, t) => `Épingler ${t}`],
  [/^(\d+) spins$/, (_, n) => `${n} tours`],
  [/^Shot (\d) of 5$/, (_, n) => `Tir ${n} sur 5`],
  [/^You (called|folded) · hint said$/, (_, v) => `Tu as ${v === "called" ? "suivi" : "abandonné"} · l'aide disait`],
  [/^Your hand: (.+)$/, (_, v) => `Ta main : ${v}`],
  [/^Hand replay · (.+)$/, (_, v) => `Replay de la main · ${tr(v)}`],
  [/^Good (morning|afternoon|evening|night)$/, (m) => tr(m)],
  [/^Chip (\d[\d,]*)$/, (_, v) => `Jeton ${v}`],
  [/^Bet (\d[\d,]*)$/, (_, v) => `Mise ${v}`],
];

export function translateText(s: string): string {
  const t = s.trim();
  if (!t || !/[A-Za-z]/.test(t)) return s;
  let out = FR[t];
  if (out === undefined) {
    for (const [re, fn] of PATTERNS) {
      const m = t.match(re);
      if (m) {
        out = fn(...m);
        break;
      }
    }
  }
  if (out === undefined || out === t) return s;
  const lead = s.match(/^\s*/)?.[0] ?? "";
  const trail = s.match(/\s*$/)?.[0] ?? "";
  return lead + out + trail;
}

const ATTRS = ["aria-label", "title", "placeholder"];
const skip = (el: Element | null) => !!el && (el.closest("[translate=no], input, textarea, script, style") !== null);

function translateNode(n: Node) {
  if (n.nodeType === Node.TEXT_NODE) {
    const v = n.nodeValue ?? "";
    if (!/[A-Za-z]/.test(v) || skip(n.parentElement)) return;
    const t = translateText(v);
    if (t !== v) n.nodeValue = t;
    return;
  }
  if (n.nodeType !== Node.ELEMENT_NODE) return;
  const el = n as Element;
  if (skip(el)) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && /[A-Za-z]/.test(v)) {
      const t = translateText(v);
      if (t !== v) el.setAttribute(a, t);
    }
  }
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let c = w.nextNode();
  while (c) {
    if (c.nodeType === Node.TEXT_NODE) translateNode(c);
    else {
      const e = c as Element;
      for (const a of ATTRS) {
        const v = e.getAttribute(a);
        if (v && /[A-Za-z]/.test(v)) {
          const t = translateText(v);
          if (t !== v) e.setAttribute(a, t);
        }
      }
    }
    c = w.nextNode();
  }
}

let observer: MutationObserver | null = null;
function start() {
  if (observer || typeof document === "undefined") return;
  document.documentElement.lang = "fr";
  translateNode(document.body);
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") translateNode(m.target);
      else if (m.type === "attributes") {
        const el = m.target as Element;
        const v = el.getAttribute(m.attributeName!);
        if (v && /[A-Za-z]/.test(v) && !skip(el)) {
          const t = translateText(v);
          if (t !== v) el.setAttribute(m.attributeName!, t);
        }
      } else m.addedNodes.forEach(translateNode);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

export const i18n = {
  get: () => {
    load();
    return lang;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Called once by the page after it has mounted. */
  boot() {
    load();
    if (lang === "fr") start();
  },
  set(next: Lang) {
    load();
    if (next === lang) return;
    lang = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    listeners.forEach((l) => l());
    // English is the written text: going back reloads the page cleanly.
    if (next === "fr") start();
    else window.location.reload();
  },
};
export const useLang = () => useSyncExternalStore(i18n.subscribe, i18n.get, () => "en" as Lang);
