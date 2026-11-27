import type { Metadata } from "next";
import { H, LegalDoc, Todo } from "../../components/LegalDoc";

export const metadata: Metadata = { title: "Confidentialité · Royal Ace" };

export default function Page() {
  return (
    <LegalDoc
      title="Politique de confidentialité"
      updated="27 novembre 2026"
      fr={
        <>
          <section>
            <H>En bref</H>
            <p>
              Pas de compte obligatoire, pas d&apos;e-mail, pas de mot de passe, pas de publicité, pas de traceur, pas de mesure d&apos;audience. Ta
              partie reste sur ton appareil, sauf si tu actives toi-même la sauvegarde en ligne.
            </p>
          </section>
          <section>
            <H>Responsable du traitement</H>
            <p>
              L&apos;éditeur du site (voir les mentions légales), joignable à <Todo>adresse e-mail de contact</Todo>.
            </p>
          </section>
          <section>
            <H>Les données utilisées</H>
            <p>
              <b className="text-white">Sur ton appareil.</b> Ton pseudo, tes jetons, ta progression et tes réglages sont enregistrés dans le
              stockage local de ton navigateur. Ils ne nous sont pas envoyés. Tu peux tout effacer dans Réglages, « Réinitialiser le compte ».
            </p>
            <p>
              <b className="text-white">Sauvegarde en ligne (facultative).</b> Si tu l&apos;actives, nous conservons ton pseudo, la clé publique de
              ta passkey (Face ID, Touch ID… : nous ne voyons jamais ton empreinte ni ton visage) et les données de ta partie. Un cookie de session
              strictement nécessaire (« ra_sess », 1 an) te garde connecté. Base légale : l&apos;exécution du service que tu demandes. Conservation :
              jusqu&apos;à ce que tu supprimes ta sauvegarde, ce que tu peux faire à tout moment depuis le jeu.
            </p>
            <p>
              <b className="text-white">Journaux techniques.</b> Comme tout site, notre hébergeur traite l&apos;adresse IP et des informations
              techniques de connexion pour faire fonctionner et sécuriser le service.
            </p>
            <p>
              <b className="text-white">Matchs.</b> Les scores et calendriers sont demandés par notre serveur à football-data.org et API-Sports :
              aucune donnée te concernant ne leur est transmise.
            </p>
          </section>
          <section>
            <H>Cookies</H>
            <p>
              Royal Ace n&apos;utilise que le cookie de session de la sauvegarde en ligne, strictement nécessaire au service demandé. Il est donc
              dispensé de consentement, et il n&apos;y a pas de bandeau cookies.
            </p>
          </section>
          <section>
            <H>Prestataires et transferts</H>
            <p>
              Hébergement : Vercel Inc. Sauvegarde en ligne : Upstash, Inc. Ces prestataires peuvent traiter des données hors de l&apos;Union
              européenne, notamment aux États-Unis, avec les garanties prévues par le RGPD (cadre de protection des données UE–États-Unis ou clauses
              contractuelles types).
            </p>
          </section>
          <section>
            <H>Tes droits</H>
            <p>
              Tu peux accéder à tes données, les rectifier, les effacer, en limiter l&apos;usage, t&apos;y opposer et les récupérer. Écris à{" "}
              <Todo>adresse e-mail de contact</Todo>. Tu peux aussi saisir la CNIL (cnil.fr).
            </p>
          </section>
          <section>
            <H>Mineurs</H>
            <p>Royal Ace est réservé aux personnes de 18 ans et plus. Nous ne collectons pas sciemment de données concernant des mineurs.</p>
          </section>
        </>
      }
      en={
        <>
          <p>
            No mandatory account, no e-mail, no password, no ads, no trackers, no analytics. Your game stays in your browser&apos;s local storage.
            If you turn on the optional cloud save, we keep your nickname, your passkey&apos;s public key and your game data, with one strictly
            necessary session cookie (&quot;ra_sess&quot;, 1 year), until you delete the save from the game. Our host processes IP addresses and
            technical logs to run the service. Providers: Vercel Inc. (hosting) and Upstash, Inc. (cloud save), possibly in the USA under GDPR
            safeguards. To use your rights (access, correction, deletion, objection, portability), write to <Todo>contact e-mail</Todo>; you can also
            complain to the CNIL. Royal Ace is for adults (18+).
          </p>
        </>
      }
    />
  );
}
