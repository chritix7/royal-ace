import type { Metadata } from "next";
import { H, LegalDoc } from "../../components/LegalDoc";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Page() {
  return (
    <LegalDoc
      title="Privacy policy"
      titleFr="Politique de confidentialité"
      updated="27 November 2026"
      en={
        <>
          <section>
            <H>In short</H>
            <p>
              No mandatory account, no e-mail, no password, no ads, no trackers. Just anonymous visit counts, without cookies. Your game stays on
              your device, unless you turn on the cloud save yourself.
            </p>
          </section>
          <section>
            <H>Data controller</H>
            <p>Christian Constantin, publisher of the site, reachable at <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>.</p>
          </section>
          <section>
            <H>The data we use</H>
            <p>
              <b className="text-white">On your device.</b> Your nickname, chips, progress and settings are kept in your browser&apos;s local
              storage. They are not sent to us. You can erase everything in Settings, &quot;Reset account&quot;.
            </p>
            <p>
              <b className="text-white">Cloud save (optional).</b> If you turn it on, we keep your nickname, your passkey&apos;s public key (Face
              ID, Touch ID…: we never see your fingerprint or face) and your game data. A strictly necessary session cookie (&quot;ra_sess&quot;, 1
              year) keeps you signed in. Legal basis: providing the service you ask for. Kept until you delete your save, which you can do at any
              time from the game.
            </p>
            <p>
              <b className="text-white">Technical logs.</b> Like any website, our host processes your IP address and technical connection data to
              run and secure the service.
            </p>
            <p>
              <b className="text-white">Matches.</b> Scores and fixtures are requested by our server from football-data.org and API-Sports: no data
              about you is sent to them.
            </p>
          </section>
          <section>
            <H>Visit statistics</H>
            <p>
              To know how many people visit and which pages they open, we use Vercel Web Analytics. It sets no cookie and stores nothing on your
              device; it only gives us aggregate, anonymous figures (visits, pages, country, type of device) and is used for nothing else. Legal
              basis: our legitimate interest in running the site. You can turn it off at any time in Settings, &quot;Anonymous visit stats&quot;.
            </p>
          </section>
          <section>
            <H>Cookies</H>
            <p>
              Royal Ace only uses the cloud save&apos;s session cookie, which is strictly necessary for the service you ask for. It needs no
              consent, so there is no cookie banner.
            </p>
          </section>
          <section>
            <H>Providers and transfers</H>
            <p>
              Hosting: Vercel Inc. Cloud save: Upstash, Inc. These providers may process data outside the European Union, in particular in the
              United States, with the safeguards required by the GDPR (EU–US Data Privacy Framework or standard contractual clauses).
            </p>
          </section>
          <section>
            <H>Your rights</H>
            <p>
              You can access, correct and delete your data, restrict or object to its use, and get a copy of it. Write to <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>. You can also
              complain to your data protection authority (in France, the CNIL: cnil.fr).
            </p>
          </section>
          <section>
            <H>Minors</H>
            <p>Royal Ace is for people aged 18 and over. We do not knowingly collect data about minors.</p>
          </section>
        </>
      }
      fr={

        <>
          <section>
            <H>En bref</H>
            <p>
              Pas de compte obligatoire, pas d&apos;e-mail, pas de mot de passe, pas de publicité, pas de traceur. Seulement un comptage anonyme
              des visites, sans cookie. Ta partie reste sur ton appareil, sauf si tu actives toi-même la sauvegarde en ligne.
            </p>
          </section>
          <section>
            <H>Responsable du traitement</H>
            <p>
              Christian Constantin, éditeur du site, joignable à <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>.
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
            <H>Statistiques de visite</H>
            <p>
              Pour savoir combien de personnes viennent et quelles pages elles ouvrent, nous utilisons Vercel Web Analytics. Cet outil ne dépose
              aucun cookie et n&apos;enregistre rien sur ton appareil ; il nous donne seulement des chiffres globaux et anonymes (visites, pages,
              pays, type d&apos;appareil) et ne sert à rien d&apos;autre. Base légale : notre intérêt légitime à faire fonctionner le site. Tu peux
              le désactiver à tout moment dans Réglages, « Statistiques de visite anonymes ».
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
              Tu peux accéder à tes données, les rectifier, les effacer, en limiter l&apos;usage, t&apos;y opposer et les récupérer. Écris à <a href="mailto:christianxpro7@gmail.com" className="text-[#e5c779] underline">christianxpro7@gmail.com</a>. Tu peux aussi saisir la CNIL (cnil.fr).
            </p>
          </section>
          <section>
            <H>Mineurs</H>
            <p>Royal Ace est réservé aux personnes de 18 ans et plus. Nous ne collectons pas sciemment de données concernant des mineurs.</p>
          </section>
        </>
      }
    />
  );
}
