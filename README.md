# Royal Ace

Une salle de jeu virtuelle privée — PWA Next.js.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (via Turbopack)
- **Serwist** pour le service worker (PWA installable)
- **Vitest** pour les tests

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvre [http://localhost:3000](http://localhost:3000).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarre le build de prod (port 3000) |
| `npm run mobile` | Build + start sur le port 4000 (test mobile en LAN) |
| `npm run lint` | ESLint |
| `npm run test` | Lance les tests Vitest |

## Structure

```
app/            Routes Next.js (App Router), layout, manifest PWA
components/     Composants React — jeux et UI
  Blackjack*    Blackjack et sa version immersive
  Slots*        Machine à sous et ses rouleaux
  VaultGame     Jeu du coffre
  GamblePanel   Panneau gamble (double or nothing)
  Jackpot*      Barre et effets de jackpot
  Achievement*  Succès et toasts
  Stats/Rewards/Sidebar  Panneaux latéraux
  ui.tsx        Primitives UI partagées
hooks/          Hooks React personnalisés
lib/            Logique métier — jeux, économie, audio, stockage
scripts/        Scripts utilitaires (ex. génération d'icônes)
tests/          Tests Vitest
public/         Assets statiques (icônes PWA, favicon)
```

## PWA

L'app est installable (icônes 192/512 + maskable, manifest, service worker via Serwist).
