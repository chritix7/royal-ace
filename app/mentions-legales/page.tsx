import type { Metadata } from "next";
import { H, HELP_LINE, LegalDoc } from "../../components/LegalDoc";

export const metadata: Metadata = { title: "Mentions légales · Royal Ace" };

export default function Page() {
  return (
    <LegalDoc
      title="Mentions légales"
      updated="27 novembre 2026"
      fr={
        <>
          <section>
            <H>Éditeur du site</H>
            <p>
              Royal Ace est un projet personnel et non commercial, édité par Christian Constantin, particulier. Contact : <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>.
            </p>
            <p>Directeur de la publication : Christian Constantin.</p>
            <p>
              Conformément à l&apos;article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique,
              l&apos;éditeur, personne physique agissant à titre non professionnel, a communiqué ses coordonnées complètes à l&apos;hébergeur
              ci-dessous.
            </p>
          </section>
          <section>
            <H>Hébergement</H>
            <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).</p>
            <p>Sauvegarde en ligne facultative : Upstash, Inc. (upstash.com).</p>
          </section>
          <section>
            <H>Nature du service</H>
            <p>
              Royal Ace est un jeu de simulation de casino, gratuit et réservé aux personnes de 18 ans et plus. On y joue uniquement avec des
              jetons virtuels : ils n&apos;ont aucune valeur, ne s&apos;achètent pas, ne s&apos;échangent pas et ne se convertissent ni en argent ni
              en lots. Il n&apos;y a rien à payer et rien à gagner : Royal Ace n&apos;est pas un jeu d&apos;argent et de hasard au sens de
              l&apos;article L. 320-1 du code de la sécurité intérieure.
            </p>
            <p>
              Le jeu doit rester un plaisir. Si le jeu, même gratuit, te pose problème, {HELP_LINE.name} répond au {HELP_LINE.phone} (appel non
              surtaxé) et sur {HELP_LINE.url.replace("https://", "")}.
            </p>
          </section>
          <section>
            <H>Propriété intellectuelle</H>
            <p>
              Le nom, les visuels, les symboles, les sons et le code de Royal Ace sont protégés. Toute reproduction sans autorisation est interdite.
              Royal Ace n&apos;est affilié à aucun casino, éditeur de jeux, fabricant de machines, club, ligue ni bookmaker. Les noms d&apos;équipes et
              de compétitions ne servent qu&apos;à identifier les matchs ; aucun logo n&apos;est utilisé.
            </p>
            <p>Données sportives : football-data.org et API-Sports. Les cotes sont calculées par Royal Ace et ne sont pas des cotes de bookmaker.</p>
          </section>
        </>
      }
      en={
        <>
          <section>
            <H>Publisher</H>
            <p>
              Royal Ace is a personal, non-commercial project published by Christian Constantin, a private individual. Contact: <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>.
              Publication director: Christian Constantin.
            </p>
          </section>
          <section>
            <H>Hosting</H>
            <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Optional cloud save: Upstash, Inc.</p>
          </section>
          <section>
            <H>What Royal Ace is</H>
            <p>
              A free casino simulation for adults (18+), played with virtual chips only. Chips have no value: they cannot be bought, sold, exchanged
              or turned into money or prizes. Nothing to pay, nothing to win: Royal Ace is not gambling. Not affiliated with any casino, game maker,
              club, league or bookmaker. Sports data: football-data.org and API-Sports; odds are computed by Royal Ace.
            </p>
          </section>
        </>
      }
    />
  );
}
