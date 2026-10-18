# Brancher le web sur l'API, et auditer l'API

Date : 2026-10-18. Suit `2026-10-18-web-records-design.md` (D274–D292). Décisions D293 à D313.

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
  **Précision** : le tableau de bord du web en production (`main`) lit encore
  `GET /stats/periode`. L'audit retire `GET /stats` et `GET /stats/exercices` ; `/stats/periode`
  ne part qu'au lot Ménage du web, quand plus rien ne l'appelle.
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
  route lancent `queryClient.prefetchQuery` sans l'attendre, les composants lisent par
  `useQuery` et choisissent leur état par `etatAffiche` (D303) : pas de Suspense, qui
  sortirait chargement et erreur de la page et rendrait `?etat=chargement` impossible. Une
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
  requête ; `?etat=` les force toujours, pour la revue (CLAUDE.md). Une seule fonction pure,
  `etatAffiche(force, requete, vide)` dans `components/states/`, testée, fait ce choix pour
  toutes les pages.
- **D304 — Une suite Playwright de bout en bout** (2026-10-18). Dans `apps/web/e2e/`,
  `pnpm --filter web e2e`. Elle tourne en local contre l'API de développement (branche Neon
  `dev`), sur un compte dédié `e2e@better-lift.local` dont l'adresse et le mot de passe viennent
  du `.env` (`E2E_EMAIL`, `E2E_PASSWORD`) ; jamais le compte `controle@`, qui porte la démo.
  Un projet `setup` se connecte une fois et garde l'état (`storageState`). Chaque test crée ce
  qu'il lit, préfixé `e2e-`, et le supprime. Sélecteurs par rôle et libellé. Pas dans la CI :
  elle n'a pas de base ; on l'y mettra avec une branche Neon éphémère si le besoin vient.
- **D305 — Trois branches** (2026-10-18). `chore/api-audit` et `feat/api-web` (dossiers, notes
  et lectures de D310–D312 ; d'abord nommée `feat/api-dossiers`) partent de
  `main` (indépendantes du web, chacune sa PR) ; le branchement du web s'empile sur
  `feat/web-wireframe`, dans `feat/web-api`, une fois les deux premières fusionnées et
  rebasées.

- **D306 — Chaque fichier a sa place** (2026-10-18). Une règle par dossier, écrite dans
  `.claude/rules/interface-web.md` :
  - `routes/` : la route seule — `validateSearch`, garde, loader, choix de l'état. Aucune
    logique, aucun JSX au-delà de l'appel au composant de la feature.
  - `features/<x>/` : tout ce qui est propre à une page — `queries.ts`, ses composants
    (`<x>-*.tsx`), sa logique pure (`*.ts`) et ses tests à côté. Une feature n'importe pas
    une autre feature ; ce qu'elles partagent monte dans `components/` ou `lib/`.
  - `components/` : les briques communes à plusieurs features (`list-detail`, `editable`,
    `row-menu`, `body-map`…) ; `components/shell/` la coquille ; `components/states/` les
    quatre états ; `components/ui/`, `reui/`, `kibo-ui/` le code des registres, non modifié
    sauf nécessité.
  - `lib/` : sans React ni feature — config, client d'API, auth, formatage, lecture.
  - `packages/shared` : le calcul métier commun au web et au mobile (records, 1RM, volume,
    dates civiles). Le web ne réécrit jamais un calcul que `shared` a déjà.
- **D307 — Ce que `mocks/` contient de vrai déménage** (2026-10-18). Avant d'effacer `mocks/` :
  les calculs de séance, de routine et d'exercice (`history`, `routine-stats`,
  `routine-history`, `exercise-stats`) vont dans `shared` s'ils valent pour le mobile, sinon
  dans la feature qui les lit, tests compris ; ceux que `shared` fait déjà sont supprimés au
  profit de `shared`. `addDays` et `TODAY` cèdent la place au calendrier civil de `shared`
  dans le fuseau du profil, jamais à l'UTC.
- **D308 — `proto/` devient les états** (2026-10-18). `components/proto/` (`?etat=`, `?v=`)
  rejoint `components/states/` sous le nom `useEtat` ; les variantes `?v=`, mortes depuis D263,
  partent. La barre de prototype (`proto-bar`) ne s'affiche qu'en développement.
- **D309 — Knip voit tout le web** (2026-10-18). `kibo-ui/` et `reui/` sortent des entrées de
  Knip ; restent `components/ui/` (registre shadcn) et `lib/utils.ts`. Les fichiers jamais
  importés partent : `kibo-ui/contribution-graph` (calendrier retiré, D288), `ui/calendar`,
  `ui/popover` — à revérifier en fin de chantier, les retraits de D294 en libéreront d'autres.
  Les exports de `packages/shared/src/index.ts` qu'aucune application n'importe sont retirés
  de l'index (Knip `includeEntryExports` sur `shared`), et leur code s'il ne sert pas en interne.
- **D310 — Une routine sait quand elle a été faite** (2026-10-18). `RoutineResume` gagne
  `derniereSeance` (ISO ou `null`) et `dossierId` : la liste du web les affiche sans lire les
  séances.
  **Précision** (2026-10-18, au lot Routines) : aussi `exercices` (nom et muscle principal de
  chacun) et `dureeEstimeeSec` (`dureeEstimeeSec` de `shared`) — la liste cherche dans les
  noms d'exercices, montre les muscles et la durée sans lire chaque routine.
- **D311 — Les séances se filtrent par routine** (2026-10-18). `GET /seances` accepte
  `routine=<id>` ; les stats d'une routine (D280 : séances, volume et sa tendance, durée,
  records, réalisation) se calculent sur ces `SeanceResume` (`debut`, `fin`, `volumeKg`,
  `nbRecords`, `seriesFaites`) face aux séries prévues de la routine. Le calcul vit dans
  `features/routines/`, testé.
- **D312 — Les exercices faits** (2026-10-18). `GET /exercices/faits`, derrière une session :
  par exercice que l'utilisateur a fait, `slug`, `derniereFois`, `meilleur1Rm`. La page
  Exercices lit le catalogue (paginé, recherche et filtres côté serveur) et y joint ces
  valeurs ; le tri « Récents » ne montre que les exercices faits. Monté AVANT le catalogue,
  sinon `/:slug` prendrait « faits » pour un slug.
  **Précision** (2026-10-18, au lot Exercices) : chaque exercice fait porte aussi sa ligne du
  catalogue (`ExerciceResume` : nom, groupe, équipement, image), la plus récente d'abord. Le tri
  « récents » liste ainsi les faits sans charger tout le catalogue.
- **D313 — Fuseau et unités, en un seul endroit** (2026-10-18). Sans champ en base (D294), le
  web prend le fuseau du navigateur (`Intl.DateTimeFormat().resolvedOptions().timeZone`) et le
  système métrique, fixés dans `lib/locale.ts` : tout découpage de jour et toute charge passent
  par là (`formaterCharge`, `lireCharge`, calendrier de `shared`).

## 3. Architecture côté web

```
apps/web/src/
  routes/              minces : validateSearch, garde, loader (prefetchQuery), état
  features/<x>/
    queries.ts         clés, queryOptions, mutations
    <x>-*.tsx          composants de la page
    *.ts, *.test.ts    logique propre à la page, testée
  components/          briques communes ; shell/ ; states/ (useEtat, quatre états)
  components/ui|reui|kibo-ui/   registres
  lib/config.ts        URL_API, URL_AUTH (prod : même origine, /api ; dev : 3001)
  lib/api.ts           client RPC, ErreurApi, lireReponse()
  lib/auth.ts          authClient, lecture de session, useDeconnexion
  lib/                 format, parse, draft-history…
  e2e/                 setup, un fichier par page
```

Flux : route → loader → `prefetchQuery(xQuery())` → composant `useQuery` + `etatAffiche` → mutation
→ invalidation de la clé de la feature (ou mise à jour du cache quand la réponse porte la
donnée). Erreur : `ErreurApi` → `errorComponent` de la route (état erreur), 404 → état
introuvable, 401 → retour à la connexion.

En production, l'API et le web partagent l'origine : `/api` pour l'API, `/api/auth` pour
Better Auth, `/app` pour le SPA. La garde et les redirections visent des routes du routeur,
donc restent sous `basepath: "/app"` sans préfixe en dur.

## 4. Ordre de construction

**Branche `chore/api-audit`** : retrait des routes `stats` (D295), relecture des codes de statut et
des tests, Knip, `/verif`.

**Branche `feat/api-web`** : migration (D296), services et routes (D297), `shared` (D298),
lectures pour le web (D310–D312), tests de service et de route, vérification que le mobile édite une routine sans perdre note
ni dossier.

**Branche `feat/web-api`**, un commit et des captures par lot :

1. **Socle** : config, client, `ErreurApi`, `QueryClient` dans le contexte, session et
   gardes (D300, D301) ; retrait des écrans non branchés (D294) ; `proto/` devient
   `useEtat` (D308) ; Knip élargi et fichiers morts retirés (D309) ; règle d'arborescence
   écrite (D306) ; Playwright installé avec le projet `setup` (D304).
2. **Auth** : connexion, inscription, déconnexion ; Compte (nom par `updateUser`, mot de passe
   par `changePassword`, appareils connectés par `listSessions` / `revokeSession`). E2E : connexion, refus, déconnexion, garde.
3. **Exercices** : catalogue paginé, recherche et filtres côté serveur ; fiche avec historique
   et records (`shared`). E2E : recherche, ouverture d'une fiche.
4. **Routines** : liste, dossiers, ordre, création, édition, note, déplacement, suppression
   différée (D302). E2E : créer, éditer, ranger dans un dossier, supprimer et annuler.
5. **Historique** : liste paginée, détail, suppression différée. E2E : ouvrir et supprimer une
   séance créée par l'API dans le test.
6. **Paramètres** : objectif et repos (`/preferences`), export CSV. E2E : enregistrer un
   objectif, le relire après rechargement.
   Chaque lot déménage d'abord la logique de `mocks/` qu'il consomme (D307).
7. **Ménage** : `mocks/` supprimé, `GET /stats/periode` retiré de l'API (D295), Knip propre (revérifier D309), `/verif`, une passe E2E
   complète.

## 5. Vérification

- API : tests de service et de route avec dépôts injectés et lecteur de session factice,
  comme aujourd'hui ; un test par code de statut.
- Web : Vitest sur les fonctions pures (fabriques de clés, suppression différée, lecture
  d'erreur) ; E2E Playwright par lot (D304) ; capture de chaque page dans ses quatre états.
- `/verif` (build, typecheck, test, lint, knip) propre à chaque lot.

## 6. Hors périmètre

Landing (`/`), mobile (hors D298), séance en direct sur le web, import Hevy, note et cible
d'exercice, correction de séance, préférences étendues, e-mails Better Auth, E2E en CI.
