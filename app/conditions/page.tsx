import type { Metadata } from "next";
import { H, HELP_LINE, LegalDoc } from "../../components/LegalDoc";

export const metadata: Metadata = { title: "Terms of use" };

export default function Page() {
  return (
    <LegalDoc
      title="Terms of use"
      titleFr="Conditions d'utilisation"
      updated="27 November 2026"
      en={
        <>
          <section>
            <H>1. Access</H>
            <p>Chrysonyx is free and for people aged 18 and over only. By playing, you confirm you are 18 or older and accept these terms.</p>
          </section>
          <section>
            <H>2. Virtual chips</H>
            <p>
              Chips, tickets, shop items and jackpots in Chrysonyx are virtual. They have no monetary value, cannot be bought, sold or traded
              between players, and can never be turned into money or prizes. They may be adjusted, reset or lost (for example if you clear your
              browser data).
            </p>
          </section>
          <section>
            <H>3. This is not gambling</H>
            <p>
              Chrysonyx is an entertainment simulation. Doing well in Chrysonyx does not mean you would do well in a real casino or with a real
              bookmaker. Sports bets are fictional: they are settled in virtual chips on real results, with odds computed by Chrysonyx.
            </p>
          </section>
          <section>
            <H>4. Fair use</H>
            <p>
              You agree not to disrupt the service, not to try to get around its security and not to pick an offensive or misleading nickname. We
              may delete a cloud save that breaks these rules.
            </p>
          </section>
          <section>
            <H>5. Availability and liability</H>
            <p>
              The service is provided as is, with no guarantee that it is always available. It may change, pause or stop. We are not liable for the
              loss of virtual chips or progress, which have no value.
            </p>
          </section>
          <section>
            <H>6. Keep it fun</H>
            <p>
              Take breaks and set yourself time limits. If gaming becomes a problem, talk to someone you trust or a support service. In France,{" "}
              {HELP_LINE.name} answers on {HELP_LINE.phone} (free of extra charge) and at {HELP_LINE.url.replace("https://", "")}.
            </p>
          </section>
          <section>
            <H>7. Changes and governing law</H>
            <p>
              These terms may be updated; the date at the top of the page applies. They are governed by French law. You can reach us at the
              address given in the legal notice.
            </p>
          </section>
        </>
      }
      fr={

        <>
          <section>
            <H>1. Accès</H>
            <p>Chrysonyx est gratuit et réservé aux personnes de 18 ans et plus. En jouant, tu confirmes avoir 18 ans ou plus et accepter ces conditions.</p>
          </section>
          <section>
            <H>2. Jetons virtuels</H>
            <p>
              Les jetons, tickets, objets de la boutique et jackpots de Chrysonyx sont virtuels. Ils n&apos;ont aucune valeur monétaire, ne
              s&apos;achètent pas, ne se vendent pas, ne s&apos;échangent pas entre joueurs et ne se convertissent ni en argent ni en lots. Ils
              peuvent être ajustés, réinitialisés ou perdus (par exemple si tu effaces les données de ton navigateur).
            </p>
          </section>
          <section>
            <H>3. Ce n&apos;est pas un jeu d&apos;argent</H>
            <p>
              Chrysonyx est une simulation de divertissement. Réussir dans Chrysonyx ne veut pas dire réussir dans un vrai casino ou chez un vrai
              bookmaker. Les paris sportifs sont fictifs : ils se règlent en jetons virtuels selon des résultats réels, avec des cotes calculées par
              Chrysonyx.
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
    />
  );
}
