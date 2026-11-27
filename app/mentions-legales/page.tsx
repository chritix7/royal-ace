import type { Metadata } from "next";
import { H, HELP_LINE, LegalDoc } from "../../components/LegalDoc";

export const metadata: Metadata = { title: "Legal notice" };

export default function Page() {
  return (
    <LegalDoc
      title="Legal notice"
      titleFr="Mentions légales"
      updated="27 November 2026"
      en={
        <>
          <section>
            <H>Publisher</H>
            <p>Chrysonyx is a personal, non-commercial project published by Christian Constantin, a private individual. Contact: <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>.</p>
            <p>Publication director: Christian Constantin.</p>
            <p>
              Under article 6, III, 2 of French law no. 2004-575 of 21 June 2004 (LCEN), the publisher, a private individual acting on a
              non-professional basis, has given his full contact details to the host below.
            </p>
          </section>
          <section>
            <H>Hosting</H>
            <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA (vercel.com).</p>
            <p>Optional cloud save: Upstash, Inc. (upstash.com).</p>
          </section>
          <section>
            <H>What Chrysonyx is</H>
            <p>
              Chrysonyx is a free casino simulation for adults aged 18 and over. It is played with virtual chips only: they have no value, cannot
              be bought, cannot be exchanged and can never be turned into money or prizes. There is nothing to pay and nothing to win: Chrysonyx is
              not gambling (in France, article L. 320-1 of the Internal Security Code).
            </p>
            <p>
              Keep it fun. If gaming, even free, becomes a problem for you, talk to someone you trust or a support service. In France, 
              {HELP_LINE.name} answers on {HELP_LINE.phone} (free of extra charge) and at {HELP_LINE.url.replace("https://", "")}.
            </p>
          </section>
          <section>
            <H>Intellectual property</H>
            <p>
              The name, visuals, symbols, sounds and code of Chrysonyx are protected; reproducing them without permission is forbidden. Chrysonyx is
              not affiliated with any casino, game studio, machine maker, club, league or bookmaker. Team and competition names only identify the
              matches; no logo is used.
            </p>
            <p>Sports data: football-data.org and API-Sports. Odds are computed by Chrysonyx and are not bookmaker odds.</p>
          </section>
        </>
      }
      fr={

        <>
          <section>
            <H>Éditeur du site</H>
            <p>
              Chrysonyx est un projet personnel et non commercial, édité par Christian Constantin, particulier. Contact : <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>.
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
              Chrysonyx est un jeu de simulation de casino, gratuit et réservé aux personnes de 18 ans et plus. On y joue uniquement avec des
              jetons virtuels : ils n&apos;ont aucune valeur, ne s&apos;achètent pas, ne s&apos;échangent pas et ne se convertissent ni en argent ni
              en lots. Il n&apos;y a rien à payer et rien à gagner : Chrysonyx n&apos;est pas un jeu d&apos;argent et de hasard au sens de
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
              Le nom, les visuels, les symboles, les sons et le code de Chrysonyx sont protégés. Toute reproduction sans autorisation est interdite.
              Chrysonyx n&apos;est affilié à aucun casino, éditeur de jeux, fabricant de machines, club, ligue ni bookmaker. Les noms d&apos;équipes et
              de compétitions ne servent qu&apos;à identifier les matchs ; aucun logo n&apos;est utilisé.
            </p>
            <p>Données sportives : football-data.org et API-Sports. Les cotes sont calculées par Chrysonyx et ne sont pas des cotes de bookmaker.</p>
          </section>
        </>
      }
    />
  );
}
