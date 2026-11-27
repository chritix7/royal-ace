"use client";

import { useEffect, useState } from "react";
import { useLang } from "../lib/i18n";
import { HELP_LINE, LEGAL_LINKS } from "./LegalDoc";

export const AGE_KEY = "royalace:age-ok";

/** First visit: Chrysonyx is for adults only, and the chips are worth nothing. */
export default function AgeGate() {
  const fr = useLang() === "fr";
  const [open, setOpen] = useState(false);
  const [minor, setMinor] = useState(false);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem(AGE_KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);
  if (!open) return null;
  const ok = () => {
    try {
      localStorage.setItem(AGE_KEY, "1");
    } catch {}
    setOpen(false);
  };
  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-title" translate="no">
      <div className="age-gate__card">
        <p className="age-gate__badge" aria-hidden="true">18+</p>
        <h2 id="age-title" className="font-display gold-text text-2xl font-bold">
          {minor ? (fr ? "Réservé aux adultes" : "Adults only") : fr ? "Bienvenue au Chrysonyx" : "Welcome to Chrysonyx"}
        </h2>
        {minor ? (
          <p className="mt-3 text-sm leading-6 text-white/75">
            {fr ? "Chrysonyx est réservé aux personnes de 18 ans et plus. Reviens nous voir à tes 18 ans !" : "Chrysonyx is for people aged 18 and over. Come back when you turn 18!"}
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-white/75">
              {fr
                ? "Un casino 100 % gratuit, réservé aux 18 ans et plus. On joue uniquement avec des jetons virtuels : ils n'ont aucune valeur, rien ne s'achète et rien ne se gagne en argent réel."
                : "A 100% free casino, for adults 18 and over. You play with virtual chips only: they are worth nothing, nothing can be bought and no real money can be won."}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" className="pr-btn" onClick={ok}>
                {fr ? "J'ai 18 ans ou plus" : "I am 18 or older"}
              </button>
              <button type="button" className="pr-btn is-ghost" onClick={() => setMinor(true)}>
                {fr ? "J'ai moins de 18 ans" : "I am under 18"}
              </button>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-white/45">
              {fr ? "En entrant, tu acceptes les " : "By entering, you accept the "}
              <a href="/conditions" className="underline hover:text-white">{fr ? "conditions d'utilisation" : "terms of use"}</a>
              {fr ? ". Jouer doit rester un plaisir : " : ". Keep it fun: "}
              {HELP_LINE.name} <span className="whitespace-nowrap">{HELP_LINE.phone}</span>.
            </p>
          </>
        )}
        <nav className="mt-4 flex justify-center gap-3 text-[11px] text-white/40">
          {LEGAL_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white">
              {fr ? l.fr : l.en}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
