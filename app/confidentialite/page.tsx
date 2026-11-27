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
              No mandatory account, no password, no ads, no trackers. Just anonymous visit counts, without cookies. Your game stays on
              your device, unless you sign in yourself.
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
              <b className="text-white">Account and cloud save (optional).</b> If you sign in, we keep your nickname, your game data and what
              you signed in with: your e-mail address (Google or e-mail link), your Google account identifier (Google), or your passkey&apos;s
              public key (Face ID, Touch ID…: we never see your fingerprint or face). Your e-mail is only used to sign you in: no newsletter,
              no ads. A strictly necessary session cookie (&quot;ra_sess&quot;, 1 year) keeps you signed in. Legal basis: providing the service
              you ask for. Kept until you delete your account, which you can do at any time in Settings.
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
            <H>Sign in with Google</H>
            <p>
              If you choose &quot;Continue with Google&quot;, Google shares with Chrysonyx only what the basic sign-in scopes (openid, email,
              profile) allow and what you approve on Google&apos;s screen: your Google account identifier, your e-mail address (and whether
              Google has verified it) and your name. We do not ask for, and never receive, your contacts, files, calendar, password or any other
              Google data.
            </p>
            <p>
              <b className="text-white">How we use it.</b> Only to create your Chrysonyx account, sign you in on any device, find the same
              account if you later sign in with an e-mail link, and show your first name as your default nickname. Nothing else: no advertising,
              no profiling, no newsletter.
            </p>
            <p>
              <b className="text-white">Sharing.</b> We never sell, rent or share Google user data. It is only stored by the providers that run
              the service for us (Vercel for hosting, Upstash for the account database), under their data-protection terms.
            </p>
            <p>
              <b className="text-white">Storage and deletion.</b> It is kept with your account until you delete it in Settings, &quot;Delete my
              account and data&quot;, which removes it from our database at once. You can also remove Chrysonyx&apos;s access at any time from
              your Google Account (myaccount.google.com/permissions), or write to us to have everything deleted.
            </p>
            <p>
              Chrysonyx&apos;s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy,
              including the Limited Use requirements.
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
              Chrysonyx only uses the cloud save&apos;s session cookie, which is strictly necessary for the service you ask for. It needs no
              consent, so there is no cookie banner.
            </p>
          </section>
          <section>
            <H>Providers and transfers</H>
            <p>
              Hosting: Vercel Inc. Accounts and cloud save: Upstash, Inc. Sign-in e-mails: Resend, Inc. &quot;Continue with Google&quot;:
              Google LLC, which tells us your name, e-mail and account identifier when you choose it. These providers may process data outside the European Union, in particular in the
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
            <H>Security</H>
            <p>
              Everything travels over HTTPS. Sign-in uses one-time links, passkeys or Google: we never handle passwords. Sessions are kept in an
              HttpOnly cookie that scripts cannot read, and access to the database is restricted to the service itself.
            </p>
          </section>
          <section>
            <H>Changes</H>
            <p>If this policy changes, the new version is published on this page with its date.</p>
          </section>
          <section>
            <H>Minors</H>
            <p>Chrysonyx is for people aged 18 and over. We do not knowingly collect data about minors.</p>
          </section>
        </>
      }
      fr={

        <>
          <section>
            <H>En bref</H>
            <p>
              Pas de compte obligatoire, pas de mot de passe, pas de publicité, pas de traceur. Seulement un comptage anonyme
              des visites, sans cookie. Ta partie reste sur ton appareil, sauf si tu te connectes toi-même.
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
              <b className="text-white">Compte et sauvegarde en ligne (facultatifs).</b> Si tu te connectes, nous conservons ton pseudo, ta
              partie et ce qui te sert à te connecter : ton adresse e-mail (Google ou lien par e-mail), l&apos;identifiant de ton compte Google
              (Google) ou la clé publique de ta passkey (Face ID, Touch ID… : nous ne voyons jamais ton empreinte ni ton visage). Ton e-mail sert
              uniquement à te connecter : pas de newsletter, pas de publicité. Un cookie de session strictement nécessaire (« ra_sess », 1 an)
              te garde connecté. Base légale : l&apos;exécution du service que tu demandes. Conservation : jusqu&apos;à ce que tu supprimes ton
              compte, ce que tu peux faire à tout moment dans les Réglages.
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
            <H>Connexion avec Google</H>
            <p>
              Si tu choisis « Continuer avec Google », Google ne transmet à Chrysonyx que ce que permettent les autorisations de connexion de base
              (openid, email, profile) et ce que tu acceptes sur l&apos;écran de Google : l&apos;identifiant de ton compte Google, ton adresse
              e-mail (et si Google l&apos;a vérifiée) et ton nom. Nous ne demandons et ne recevons jamais tes contacts, fichiers, agenda, mot de
              passe ni aucune autre donnée Google.
            </p>
            <p>
              <b className="text-white">Utilisation.</b> Uniquement pour créer ton compte Chrysonyx, te connecter sur tous tes appareils,
              retrouver le même compte si tu te connectes plus tard par un lien e-mail, et proposer ton prénom comme pseudo. Rien d&apos;autre :
              ni publicité, ni profilage, ni newsletter.
            </p>
            <p>
              <b className="text-white">Partage.</b> Nous ne vendons, ne louons et ne partageons jamais les données reçues de Google. Elles sont
              seulement conservées par les prestataires qui font fonctionner le service pour nous (Vercel pour l&apos;hébergement, Upstash pour la
              base des comptes), selon leurs conditions de protection des données.
            </p>
            <p>
              <b className="text-white">Conservation et suppression.</b> Elles sont gardées avec ton compte jusqu&apos;à ce que tu le supprimes
              dans Réglages, « Supprimer mon compte et mes données », ce qui les efface aussitôt de notre base. Tu peux aussi retirer l&apos;accès
              de Chrysonyx à tout moment depuis ton compte Google (myaccount.google.com/permissions), ou nous écrire pour tout faire supprimer.
            </p>
            <p>
              L&apos;utilisation et le transfert par Chrysonyx des informations reçues des API Google respectent les Règles relatives aux données
              utilisateur des services d&apos;API Google (Google API Services User Data Policy), y compris les exigences d&apos;utilisation limitée.
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
              Chrysonyx n&apos;utilise que le cookie de session de la sauvegarde en ligne, strictement nécessaire au service demandé. Il est donc
              dispensé de consentement, et il n&apos;y a pas de bandeau cookies.
            </p>
          </section>
          <section>
            <H>Prestataires et transferts</H>
            <p>
              Hébergement : Vercel Inc. Comptes et sauvegarde : Upstash, Inc. E-mails de connexion : Resend, Inc. « Continuer avec Google » :
              Google LLC, qui nous transmet ton nom, ton e-mail et l&apos;identifiant de ton compte quand tu choisis cette option. Ces prestataires peuvent traiter des données hors de l&apos;Union
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
            <H>Sécurité</H>
            <p>
              Tout circule en HTTPS. La connexion se fait par lien à usage unique, passkey ou Google : nous ne gérons jamais de mot de passe. La
              session est gardée dans un cookie HttpOnly que les scripts ne peuvent pas lire, et l&apos;accès à la base est réservé au service.
            </p>
          </section>
          <section>
            <H>Modifications</H>
            <p>Si cette politique change, la nouvelle version est publiée sur cette page avec sa date.</p>
          </section>
          <section>
            <H>Mineurs</H>
            <p>Chrysonyx est réservé aux personnes de 18 ans et plus. Nous ne collectons pas sciemment de données concernant des mineurs.</p>
          </section>
        </>
      }
    />
  );
}
