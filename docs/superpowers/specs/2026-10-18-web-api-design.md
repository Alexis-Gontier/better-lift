# Brancher le web sur l'API, et auditer l'API

Date : 2026-10-18. Suit `2026-10-18-web-records-design.md` (D274–D292). Décisions D293 à D305.

## 1. Contexte

Le web (`feat/web-wireframe`) est une maquette complète : aucun appel d'API, tout passe par
`apps/web/src/mocks/` (stores à signaux, types `Mock*`). L'API a 18 routes, écrites pour le
mobile et l'ancien web. Le chantier branche le web sur l'API et profite du passage pour retirer
de l'API ce qui ne sert plus.

Constats de départ :

- Le mobile appelle toutes les routes sauf six : `GET /stats`, `GET /stats/periode`,
  `GET /stats/exercices`, `PUT /routines/ordre`, `GET /seances/:id`, `DELETE /seances/:id`.
- Le wireframe montre des choses que la base n'a pas : dossiers et notes de routine, note et
  cible d'un exercice, correction d'une séance, import Hevy, préférences étendues (fuseau,
  unité, format de date, premier jour, incréments, disques, RPE, formule du 1RM), export JSON
  avec pesées, mot de passe oublié (Better Auth n'envoie aucun e-mail).
- Plusieurs calculs de `mocks/` redoublent `shared` (1RM, records).
- L'application vit sous `/app` (D292) ; `/` reste à une future landing. `/api` ne bouge pas.

## 2. Décisions

- **D293 — Seuls les dossiers et les notes de routine gagnent une API** (2026-10-18). Note et
  cible d'exercice, correction de séance, import Hevy, préférences étendues, export JSON et
  pesées n'en auront pas dans ce chantier.
- **D294 — Ce qui n'est pas branché quitte l'interface** (2026-10-18). L'écran ne montre que ce
  qui marche ; l'historique git garde le dessin. Partent : l'import Hevy, l'export JSON, les
  sections de Préférences sans champ en base (on garde l'apparence, réglage d'appareil), les
  sections Charges et disques et Formule du 1RM d'Entraînement, la note et la cible sur la
  fiche Exercice (D276, D286), l'éditeur de correction de l'Historique, « Mot de passe
  oublié » et la page de réinitialisation. Ils reviennent si l'épreuve les réclame.
- **D295 — L'audit retire les routes sans écran** (2026-10-18). `GET /stats`,
  `GET /stats/periode`, `GET /stats/exercices` partent, avec leur service, leurs tests et les
  exports de `shared` que Knip trouve orphelins ensuite. `GET /stats/bilan` reste (mobile).
  `PUT /routines/ordre`, `GET` et `DELETE /seances/:id` restent : le web les reprend. Les routes
  restantes sont relues : code de statut explicite à chaque `c.json` (le RPC en tire des types
  discriminés), forme `{ erreur }`, un test par code.
- **D296 — Un dossier est une table** (2026-10-18). `Dossier` (`id`, `userId`, `nom`
  `VarChar(60)` unique par compte, `position`) ; `Routine.dossierId` nullable, `onDelete:
  SetNull` (supprimer un dossier range ses routines dans « Sans dossier », comme le
  wireframe) ; `Routine.note` `VarChar(1000)` nullable. Une table plutôt qu'un texte sur la
  routine : un dossier vide existe, se renomme en une écriture et garde sa place.
- **D297 — Les routes des dossiers** (2026-10-18). `GET /routines` rend `{ routines, dossiers }`.
  `POST /dossiers` (nom), `PATCH /dossiers/:id` (nom), `DELETE /dossiers/:id`,
  `PUT /dossiers/ordre`, `PATCH /routines/:id` (`dossierId`, pour déplacer sans renvoyer toute
  la routine). Un nom pris répond 409. Tout passe par `exigerSession` ; le dossier d'autrui
  est introuvable (404), y compris comme `dossierId` d'une routine.
- **D298 — Le mobile garde ce qu'il n'affiche pas** (2026-10-18). `note` et `dossierId` entrent
  dans `routineSaisie` et la lecture d'une routine ; `brouillon-routine.ts` les transporte.
  Le mobile, qui ne les montre pas, les renvoie tels quels en éditant : `PUT /routines/:id`
  remplace toute la routine, il ne doit rien effacer.
- **D299 — Le web lit les types de l'API** (2026-10-18). Pas d'adaptateur vers les types
  `Mock*` : les écrans consomment ce que le RPC infère depuis les schémas Zod de `shared`, et
  les calculs viennent de `shared` (`records.ts`, `training.ts`…). `mocks/` disparaît en fin
  de chantier. Les champs prennent les noms de l'API (`nom`, `series`, `chargeKg`…).
- **D300 — Une couche de requêtes par feature** (2026-10-18). `features/<x>/queries.ts` porte
  les `queryOptions` (une fabrique de clés par feature) et les mutations. Les loaders de
  route appellent `queryClient.ensureQueryData`, les composants `useSuspenseQuery`. Une
  réponse non `ok` devient une `ErreurApi` (message tiré de `{ erreur }`, statut gardé) par un
  seul utilitaire, `lib/api.ts`. Le `QueryClient` est dans le contexte du routeur. Règle déjà
  payée : toute donnée de la clé de lecture est dans la clé invalidée à l'écriture.
- **D301 — La session dans le contexte du routeur** (2026-10-18). `authClient` (Better Auth
  React) ; la session est lue avant le premier rendu (une API injoignable vaut « pas de
  session », jamais une page blanche) et posée dans le contexte. `_app` a une garde
  `beforeLoad` qui renvoie vers `/login` (sous `/app`) avec `?redirect=` ; `_auth` renvoie un
  connecté vers l'Accueil. La déconnexion relit la session, invalide le routeur, vide le
  cache de requêtes.
- **D302 — Supprimer, c'est différé** (2026-10-18). Le toast « Annuler » du wireframe reste :
  la ligne quitte le cache tout de suite, le `DELETE` part à l'expiration du toast (5 s).
  « Annuler » remet la ligne sans appel. Un départ de page (`pagehide`) envoie les
  suppressions en attente. Pas d'endpoint de restauration. Vaut pour routines, dossiers et
  séances.
- **D303 — Les quatre états restent** (2026-10-18). Chargement, erreur et vide viennent de la
  requête ; `?etat=` les force toujours, pour la revue (CLAUDE.md).
- **D304 — Une suite Playwright de bout en bout** (2026-10-18). Dans `apps/web/e2e/`,
  `pnpm --filter web e2e`. Elle tourne en local contre l'API de développement (branche Neon
  `dev`), sur un compte dédié `e2e@better-lift.local` dont l'adresse et le mot de passe viennent
  du `.env` (`E2E_EMAIL`, `E2E_PASSWORD`) ; jamais le compte `controle@`, qui porte la démo.
  Un projet `setup` se connecte une fois et garde l'état (`storageState`). Chaque test crée ce
  qu'il lit, préfixé `e2e-`, et le supprime. Sélecteurs par rôle et libellé. Pas dans la CI :
  elle n'a pas de base ; on l'y mettra avec une branche Neon éphémère si le besoin vient.
- **D305 — Trois branches** (2026-10-18). `chore/api-audit` et `feat/api-dossiers` partent de
  `main` (indépendantes du web, chacune sa PR) ; le branchement du web s'empile sur
  `feat/web-wireframe`, dans `feat/web-api`, une fois les deux premières fusionnées et
  rebasées.

## 3. Architecture côté web

```
apps/web/src/
  lib/config.ts        URL_API, URL_AUTH (prod : même origine, /api ; dev : 3001)
  lib/api.ts           client RPC, ErreurApi, lireReponse()
  lib/auth.ts          authClient, lecture de session, useDeconnexion
  features/<x>/queries.ts   clés, queryOptions, mutations
  routes/              loaders (ensureQueryData) ; composants (useSuspenseQuery)
  e2e/                 setup, un fichier par page
```

Flux : route → loader → `ensureQueryData(xQuery())` → composant `useSuspenseQuery` → mutation
→ invalidation de la clé de la feature (ou mise à jour du cache quand la réponse porte la
donnée). Erreur : `ErreurApi` → `errorComponent` de la route (état erreur), 404 → état
introuvable, 401 → retour à la connexion.

En production, l'API et le web partagent l'origine : `/api` pour l'API, `/api/auth` pour
Better Auth, `/app` pour le SPA. La garde et les redirections visent des routes du routeur,
donc restent sous `basepath: "/app"` sans préfixe en dur.

## 4. Ordre de construction

**Branche `chore/api-audit`** : retrait des routes `stats` (D295), relecture des codes de statut et
des tests, Knip, `/verif`.

**Branche `feat/api-dossiers`** : migration (D296), services et routes (D297), `shared` (D298),
tests de service et de route, vérification que le mobile édite une routine sans perdre note
ni dossier.

**Branche `feat/web-api`**, un commit et des captures par lot :

1. **Socle** : config, client, `ErreurApi`, `QueryClient` dans le contexte, session et
   gardes (D300, D301) ; retrait des écrans non branchés (D294) ; Playwright installé avec
   le projet `setup` (D304).
2. **Auth** : connexion, inscription, déconnexion ; Compte (nom par `updateUser`, mot de passe
   par `changePassword`). E2E : connexion, refus, déconnexion, garde.
3. **Exercices** : catalogue paginé, recherche et filtres côté serveur ; fiche avec historique
   et records (`shared`). E2E : recherche, ouverture d'une fiche.
4. **Routines** : liste, dossiers, ordre, création, édition, note, déplacement, suppression
   différée (D302). E2E : créer, éditer, ranger dans un dossier, supprimer et annuler.
5. **Historique** : liste paginée, détail, suppression différée. E2E : ouvrir et supprimer une
   séance créée par l'API dans le test.
6. **Paramètres** : objectif et repos (`/preferences`), export CSV. E2E : enregistrer un
   objectif, le relire après rechargement.
7. **Ménage** : `mocks/` supprimé, Knip propre, `/verif`, une passe E2E complète.

## 5. Vérification

- API : tests de service et de route avec dépôts injectés et lecteur de session factice,
  comme aujourd'hui ; un test par code de statut.
- Web : Vitest sur les fonctions pures (fabriques de clés, suppression différée, lecture
  d'erreur) ; E2E Playwright par lot (D304) ; capture de chaque page dans ses quatre états.
- `/verif` (build, typecheck, test, lint, knip) propre à chaque lot.

## 6. Hors périmètre

Landing (`/`), mobile (hors D298), séance en direct sur le web, import Hevy, note et cible
d'exercice, correction de séance, préférences étendues, e-mails Better Auth, E2E en CI.
