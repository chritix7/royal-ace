import type { Metadata } from "next";
import { H, HELP_LINE, LegalDoc } from "../../components/LegalDoc";

export const metadata: Metadata = { title: "Conditions d'utilisation · Royal Ace" };

export default function Page() {
  return (
    <LegalDoc
      title="Conditions d'utilisation"
      updated="27 novembre 2026"
      fr={
        <>
          <section>
            <H>1. Accès</H>
            <p>Royal Ace est gratuit et réservé aux personnes de 18 ans et plus. En jouant, tu confirmes avoir 18 ans ou plus et accepter ces conditions.</p>
          </section>
          <section>
            <H>2. Jetons virtuels</H>
            <p>
              Les jetons, tickets, objets de la boutique et jackpots de Royal Ace sont virtuels. Ils n&apos;ont aucune valeur monétaire, ne
              s&apos;achètent pas, ne se vendent pas, ne s&apos;échangent pas entre joueurs et ne se convertissent ni en argent ni en lots. Ils
              peuvent être ajustés, réinitialisés ou perdus (par exemple si tu effaces les données de ton navigateur).
            </p>
          </section>
          <section>
            <H>3. Ce n&apos;est pas un jeu d&apos;argent</H>
            <p>
              Royal Ace est une simulation de divertissement. Réussir dans Royal Ace ne veut pas dire réussir dans un vrai casino ou chez un vrai
              bookmaker. Les paris sportifs sont fictifs : ils se règlent en jetons virtuels selon des résultats réels, avec des cotes calculées par
              Royal Ace.
            </p>
          </section>
          <section>
            <H>4. Bon usage</H>
            <p>
              Tu t&apos;engages à ne pas perturber le service, à ne pas tenter d&apos;en contourner la sécurité et à ne pas choisir de pseudo
              injurieux ou trompeur. Nous pouvons supprimer une sauvegarde en ligne qui ne respecte pas ces règles.
            </p>
          </section>
          <section>
            <H>5. Disponibilité et responsabilité</H>
            <p>
              Le service est fourni tel quel, sans garantie de disponibilité permanente. Il peut évoluer, être interrompu ou arrêté. Notre
              responsabilité ne peut être engagée pour la perte de jetons ou de progression virtuels, qui n&apos;ont pas de valeur.
            </p>
          </section>
          <section>
            <H>6. Jouer doit rester un plaisir</H>
            <p>
              Fais des pauses et fixe-toi des limites de temps. Si le jeu te pose problème, {HELP_LINE.name} répond au {HELP_LINE.phone} (appel non
              surtaxé) et sur {HELP_LINE.url.replace("https://", "")}.
            </p>
          </section>
          <section>
            <H>7. Modifications et droit applicable</H>
            <p>
              Ces conditions peuvent être mises à jour ; la date en haut de la page fait foi. Elles sont soumises au droit français. Tu peux nous
              écrire via l&apos;adresse indiquée dans les mentions légales.
            </p>
          </section>
        </>
      }
      en={
        <>
          <p>
            Royal Ace is free and for adults (18+) only. Chips, tickets, shop items and jackpots are virtual: no monetary value, not for sale, not
            tradable, never convertible into money or prizes, and they can be adjusted, reset or lost. It is entertainment, not gambling; sports bets
            are fictional and settled in virtual chips. Do not disrupt the service or misuse nicknames. The service is provided as is and can change
            or stop. Take breaks; in France, {HELP_LINE.name} ({HELP_LINE.phone}) can help. French law applies.
          </p>
        </>
      }
    />
  );
}
