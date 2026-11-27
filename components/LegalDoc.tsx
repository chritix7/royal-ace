import type { ReactNode } from "react";

/** The three legal pages share this frame: French first (the publisher is in France), English below. */
export const LEGAL_LINKS = [
  { href: "/mentions-legales", fr: "Mentions légales", en: "Legal notice" },
  { href: "/confidentialite", fr: "Confidentialité", en: "Privacy" },
  { href: "/conditions", fr: "Conditions d'utilisation", en: "Terms of use" },
] as const;

export const CONTACT_EMAIL = "christianxpro7@gmail.com";
export const FEEDBACK_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Chrysonyx feedback")}`;

/** Help line shown wherever we talk about playing responsibly (France, free call). */
export const HELP_LINE = { name: "Joueurs Info Service", phone: "09 74 75 13 13", url: "https://www.joueurs-info-service.fr" };

export function LegalDoc({ title, titleFr, updated, en, fr }: { title: string; titleFr: string; updated: string; en: ReactNode; fr: ReactNode }) {
  return (
    <main translate="no" lang="en" className="legal mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-[15px] leading-7 text-white/80 sm:px-8">
      <a href="/" className="text-sm font-semibold text-[#e5c779] hover:underline">
        ← Chrysonyx
      </a>
      <h1 className="font-display mt-6 text-3xl font-bold text-[#f0d99a]">{title}</h1>
      <p className="mt-1 text-sm text-white/45">Last updated: {updated}</p>
      <div className="mt-8 space-y-6">{en}</div>
      <details lang="fr" className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <summary className="cursor-pointer font-semibold text-white">Version française · {titleFr}</summary>
        <div className="mt-5 space-y-6">{fr}</div>
      </details>
      <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-sm">
        {LEGAL_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="text-[#e5c779] hover:underline">
            {l.en}
          </a>
        ))}
      </nav>
    </main>
  );
}

export function H({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-xl font-bold text-white">{children}</h2>;
}

/** One quiet line at the bottom of the lobby: 18+, virtual chips, the legal pages. */
export function LegalFooter({ fr, compact = false }: { fr: boolean; compact?: boolean }) {
  return (
    <nav className="lb-legal" aria-label={fr ? "Informations légales" : "Legal"} translate="no">
      <span className="lb-legal__age">18+</span>
      {!compact && <span>{fr ? "Jetons virtuels sans valeur réelle" : "Virtual chips, no real value"}</span>}
      {LEGAL_LINKS.map((l) => (
        <a key={l.href} href={l.href}>
          {compact && l.href === "/conditions" ? (fr ? "Conditions" : "Terms") : fr ? l.fr : l.en}
        </a>
      ))}
      {!compact && (
        <span>
          {HELP_LINE.name} <span className="whitespace-nowrap">{HELP_LINE.phone}</span>
        </span>
      )}
    </nav>
  );
}
