# better-lift

Tracker de musculation personnel (2–3 comptes), web + mobile. **L'application est en français.**

La conception fait foi : [`docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md`](docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md).
Lis-la avant toute décision d'architecture — elle porte le registre des décisions (D1–D29)
et la liste des pièges déjà payés.

## État

Le dépôt repart de zéro le 22 septembre 2026. **Les lots 0 à 7 sont fusionnés — le premier jalon est complet** ; les lots 0 à 2
clôturent le plan `docs/superpowers/plans/2026-09-22-lots-0-2-socle-et-interface.md` :

- **Lot 0** — le monorepo tient debout, les trois applications démarrent, et la chaîne
  émulateur → Metro → API → Neon est prouvée de bout en bout.
- **Lot 1** — la coquille web : tokens des deux thèmes, trois panneaux redimensionnables dont
  les tailles survivent au rechargement, palette `Cmd+K`, bascule de thème.
- **Lot 2** — les trois écrans web dessinés sur données factices : catalogue, routines,
  historique, chacun avec ses quatre états.

- **Lot 3** — Better Auth, liste blanche, connexion sur les deux surfaces.

- **Lot 4** — le catalogue français (plan révisé le 24 septembre après une revue à la lumière
  d'opengym) : 1 316 exercices à deux noms, recherche bilingue sans accents, servis par l'API et
  branchés sur l'écran des exercices, avec les animations et leur attribution.

- **Lot 5** — les routines, série par série : éditeur web dans le panneau détail (glisser-déposer
  des exercices, souris et clavier), API protégée par session, remplacement complet à chaque
  enregistrement.

- **Lot 6** — la séance sur mobile : routines réelles, saisie série par série, chrono et repos,
  brouillon sur disque qui survit à un arrêt forcé, file d'envoi idempotente. **Un entraînement
  réel se saisit avec.**

- **Lot 7** — historique des séances et records à la Hevy (charge, 1RM estimé jusqu'à 12 reps,
  volume ; reps au poids du corps), dérivés à la lecture ; sur mobile, « la dernière fois » en
  indication sous chaque série.

**Prochaine étape : l'épreuve du jalon** — abandonner Hevy un mois complet sans manque bloquant.
Ce qui manquera guidera la suite ; rien n'est planifié au-delà.

Distant : `Alexis-Gontier/better-lift` (privé), **réinitialisé** — `main` porte le nouvel
historique. Le code de la V1 reste consultable sur la branche **`v1`** et le tag **`v1-final`**
(`b5f0a39`) ; il sert de référence et n'est pas repris.

`main` est **protégée** : PR obligatoire, squash seul, et un check requis nommé **exactement**
`Qualité · typecheck · test · build`. Ce nom est celui du job dans `.github/workflows/ci.yml` :
**les deux doivent bouger ensemble**, sinon toute PR devient immergeable. Ne jamais pousser
directement sur `main`.

La CI n'a pas de base de données. Les étapes qui chargent `packages/db/prisma.config.ts` —
`prisma generate` et `pnpm knip`, et elles seules — reçoivent une URL PostgreSQL factice, jamais
contactée. Toute nouvelle étape qui touche cette configuration en aura besoin aussi : le piège
ne se voit pas en local, où le `.env` existe.

**Poser une variable sur une étape du workflow ne suffit pas.** Turborepo filtre l'environnement
en mode strict : une variable non déclarée dans la tâche de `turbo.json` n'atteint jamais le
processus. `pnpm test` et `pnpm build` passent par turbo et ont donc un bloc `env` ; `pnpm knip`
et `prisma generate` sont des appels pnpm directs et n'en ont pas besoin. Le symptôme est
déroutant — la variable est visible dans le workflow et absente dans le code — et il ne se
reproduit pas en local, où le `.env` la fournit par un autre chemin.

## Stack

| Brique | Choix |
|---|---|
| Web | Vite + React 19 (SPA), TanStack Router + TanStack Query, shadcn/ui |
| Mobile | Expo SDK 57, Expo Router, TanStack Query, MMKV |
| API | Hono, Better Auth, Node 24 — fonction Vercel en production |
| Base | Prisma 7 + PostgreSQL sur Neon (Francfort) |
| Monorepo | pnpm ≥ 11.18.0 + Turborepo |
| Qualité | Biome, Lefthook, Knip, Vitest |

Paquets : `apps/{web,mobile,api}` et `packages/{db,shared,api-client}`.

## Règles d'architecture

- **Le web et le mobile passent tous deux par l'API.** Jamais d'accès direct à la base depuis un client.
- `packages/shared` n'importe **jamais** Prisma, React ni une API de plateforme. TypeScript pur,
  `Intl` toléré pour les dates.
- La logique métier vit dans `services/` côté API et ne connaît jamais le contexte Hono.
- **L'interface n'est pas partagée** entre web et mobile. Deux surfaces, deux ergonomies.
- Contrat typé par **Hono RPC**, pas d'OpenAPI. Zod dans `shared` est la source unique.
- **Le client d'API vit dans `packages/api-client`, l'URL de base chez l'appelant.** Le paquet
  expose `creerClient(baseUrl)` ; le web la tire de `import.meta.env`, le mobile d'une constante
  (l'émulateur joint l'API en `10.0.2.2`). Un paquet partagé qui lirait `import.meta.env` ne
  compilerait pas côté Expo.
- **Toute route de données personnelles passe par `exigerSession`** (`apps/api/src/middlewares/`),
  qui pose `userId` dans le contexte ; le service le reçoit en argument et filtre par lui. La donnée
  d'autrui est **introuvable (404), jamais interdite (403)**. Le lecteur de session est injecté :
  les routes se testent sans Better Auth, et `app.ts` branche le vrai.
- **Toute charge affichée ou saisie passe par `formaterCharge` / `lireCharge`** de `shared`, avec
  `SYSTEME_UNITES` (`apps/web/src/lib/unites.ts`) — l'unique endroit où le système est fixé tant
  qu'aucun profil n'existe.
- **`AppShell` est monté par la route de MISE EN PAGE de chaque écran, jamais par `__root.tsx`.**
  `_protege.exercices.tsx`, `_protege.seances.tsx`, `_protege.routines.tsx` montent la coquille et
  la liste ; le détail est une **route enfant** rendue par `<Outlet />` (D81). La mise en page lit
  le paramètre de l'enfant par `useParams({ strict: false })` : elle sait ainsi s'il y a un détail,
  et la coquille change son jeu de panneaux — donc sa clé de persistance — selon qu'il y en a un.

## Interface

- **Coquille web** (D69–D73, [`2026-09-24-coquille-shadcn-design.md`](docs/superpowers/specs/2026-09-24-coquille-shadcn-design.md)) :
  `Sidebar variant="inset" collapsible="none"` de shadcn — **ni bouton de repli ni en-tête** (demande
  de l'utilisateur) ; non repliable, shadcn n'applique plus les marges de l'`inset`, recopiées sur
  le `SidebarInset` dans `AppShell`. Le titre reste en `sr-only`. Puis liste et détail
  redimensionnables dans le `SidebarInset`, tailles persistées, et **le détail ouvert vit dans
  le CHEMIN** (D81) : `/exercices/$slug`, `/seances/$id`, `/routines/$id`, `/routines/nouvelle`.
  Les paramètres de recherche ne portent que ce qui filtre (`q`, `groupe`) ou force un état
  (`etat`), et suivent d'un détail à l'autre (`search: (s) => s`). Un rechargement retombe au même endroit. Composants shadcn plutôt que
  maison : `ScrollArea`, `Skeleton`, `Badge`, `Card`, `Table`, `Select`, `Tabs`, `Tooltip`.
  **Routines** en disposition `colonne` (`AppShell`) : colonne de cartes à gauche, routine ouverte
  **toujours modifiable** à droite — plus de mode lecture ; la barre Annuler/Enregistrer n'apparaît
  qu'une fois la copie différente de la version enregistrée (`empreinte`). Cartes d'exercice à la
  Hevy : image, « dernière fois » (`meilleureSerie`), pastille de repos, séries étiquetées
  É/1/2/3 (`etiquettesSeries`).
  Page **Paramètres** (`/parametres`) : compte, thème (seul endroit où il se change), unités et
  fuseau affichés. La liste des exercices montre l'**image fixe** (JPG ~6 Ko) : `image`
  fait partie du résumé, déduite de `gifUrl` par `imageDe` (le dataset publie `images/<id>.jpg`
  à côté de `videos/<id>.gif`) — aucune colonne ni migration. Le GIF reste réservé aux fiches.
- `Resizable`, `Sidebar` et `Command` de shadcn fournissent panneaux, navigation et `Cmd+K`.
- **Le permanent est jointif, le passager flotte — une exception bornée** (D71). Seule la zone
  de contenu (`SidebarInset`) flotte, une fois : marge, coins arrondis, ombre légère. Liste et
  détail restent jointifs, séparés par un filet de 1 px. Le reste de l'élévation — flou, ombre
  portée, voile — est réservé au momentané : palette, menus, dialogues. **Si ça flotte, ça se
  ferme**, hormis cette zone.
- **Rôles `--sidebar-*` et `card`** traduits dans `@theme inline` (D72) : l'élément actif de la
  navigation est `--surface-3`, **jamais le lime**. La variante `dark:` des primitives suit
  `data-theme`, pas la préférence du système (`@custom-variant` dans `globals.css`).
- **Sombre par défaut, clair accessible.** Hiérarchie par échelle de surfaces et quatre niveaux
  d'encre. Contraste AA : 4,5:1, ou 3:1 dès 24 px.
- **Une seule couleur pour l'action et le record : le lime sourd `#a8cf45`.** Elle porte les
  deux, donc la distinction se fait **par la forme** : l'action est un **aplat** (fond lime,
  texte sombre), le record est un **contour** (lime en texte sur fond teinté, flèche montante).
  Invariant. Le danger a la sienne, qui ne porte ni l'une ni l'autre.
- **Un token par rôle, deux valeurs par token.** `--accent` (aplat) reste `#a8cf45` dans les deux
  thèmes ; `--accent-ink` (lime en texte) passe à `#5c7a14` en clair — sur blanc, `#a8cf45`
  tombe sous 2:1. Jamais de couleur en dur réutilisée dans les deux registres.
- **Les primitives shadcn parlent leur propre vocabulaire de rôles**, traduit vers les tokens du
  projet dans `@theme inline`. **Un rôle non déclaré n'émet aucune règle, en silence** — le
  défaut ne se voit ni à la lecture ni au typecheck. L'aplat de la doctrine est `bg-primary` /
  `text-primary-foreground` ; `accent`, qui chez shadcn désigne la **surface de survol** et non
  la marque, pointe vers `--surface-3`. Ne jamais rendre `bg-accent` au lime : chaque survol de
  bouton fantôme deviendrait un aplat de marque.
- **Le danger a sa propre couleur, et elle ne fait que ça** (D36). `--danger` porte l'aplat
  destructeur, `--danger-ink` le rouge en texte — qui s'assombrit en thème clair, comme
  `--accent-ink`. **Il ne porte jamais l'action ni le record**, qui restent au lime. La valeur
  `#a83e39` tient deux contraintes à la fois : assez sombre pour que son encre passe à 5,65:1,
  assez claire pour que l'aplat se détache du fond à 3,24:1. Plus foncé, le bouton disparaît
  dans la page.
- **Mobile à quatre onglets** (D74–D80, [`2026-09-24-mobile-onglets-design.md`](docs/superpowers/specs/2026-09-24-mobile-onglets-design.md)) :
  Accueil · Historique | **bouton central** | Exercices · Profil, façon opengym. Icônes
  **Lucide** (`lucide-react-native` + `react-native-svg`, présent dans Expo Go), comme le web. Le bouton
  central (aplat lime) reprend la séance en cours, sinon ouvre la modale `app/demarrer.tsx`
  (séance vide ou routine, logique partagée dans `lib/demarrer.ts`). **Piège** : une pile qui
  déclare ses écrans prend le premier pour route initiale — `(onglets)` est donc déclaré avant
  `demarrer` dans `app/_layout.tsx`, sinon l'application s'ouvre sur la modale. Groupe
  `app/(onglets)/` dont le `_layout` porte la
  garde de session. `seance` et `fin` restent hors des onglets, en plein écran. L'historique est
  désormais aussi sur mobile (D68 levée). Onglet actif en encre, jamais en lime. Une séance
  envoyée invalide `["seances"]` et `["records"]`. Pas de hauteur fixe sur la barre d'onglets :
  elle recouvrirait la zone de geste d'Android.
  Séance guidée : vignette GIF par exercice (agrandie à l'appui, `expo-image` en cache disque),
  écran maintenu allumé (`useKeepAwake`), repos en grand bandeau avec −15 s / +15 s
  (`ajusterRepos` dans `shared`).
- **La densité vaut pour le web seulement.** Le mobile partage la palette, pas l'échelle : en
  salle il faut des cibles larges et un contraste franc.
- **L'interface passe avant la logique** : on dessine et on valide un écran avant de lui brancher
  des données — avec ses **quatre états** dès le dessin (vide, chargement, erreur, nominal), sans
  quoi le branchement les découvre trop tard.
- **Les quatre états sont atteignables depuis l'URL** : `?etat=chargement`, `?etat=erreur` et
  `?etat=vide` sur chaque écran, derrière `import.meta.env.DEV` — éliminés du bundle de
  production. `vide` vide le jeu de données plutôt que de substituer un composant, pour que
  l'écran rende son propre état vide par son chemin de code réel. Tout nouvel écran les porte :
  un état qu'on ne peut atteindre est un état qu'on ne revérifiera pas après le branchement.

## Commandes

```
pnpm dev          # les trois applications
pnpm build        # turbo build
pnpm typecheck
pnpm test         # vitest
pnpm lint         # biome check depuis la racine (pas de tâche turbo)
pnpm knip
pnpm db:migrate   # prisma migrate
pnpm db:seed
```

`/verif` enchaîne build, typecheck, test, lint et knip.

## Pièges qui coûtent cher

Tous ont déjà été payés une fois. La section 13 de la conception les détaille.

- **Dates** : découpage dans le fuseau du profil, **jamais en UTC**. Le samedi 21 h à Paris est
  déjà dimanche en UTC. L'arithmétique civile vit dans `shared`.
- **Clés de cache TanStack Query** : toute donnée présente dans la clé de lecture doit l'être
  dans la clé d'écriture, sinon l'écran affiche les anciennes valeurs après un enregistrement réussi.
- **Unités** : tout affichage de charge passe par le système d'unités du profil.
- **Formulaires** : tester `!data` sans tester l'état de chargement laisse le squelette pour toujours.
- **MMKV 4** : `createMMKV({ id })` et non `new MMKV()`, `storage.remove()` et non `delete()`,
  `react-native-nitro-modules` en dépendance de pair. **Aucun plugin de configuration** — l'ajouter
  casse `expo export` avec une erreur qui ne mentionne jamais `app.json`.
- **Versions verrouillées par Expo** : le SDK 57 fixe **TypeScript 6.0.3** et **React 19.2.3**
  pour tout le monorepo — c'est le consommateur le plus contraint qui décide, et seul le mobile
  l'est. Ne pas monter TypeScript en 7 tant qu'Expo ne suit pas : `expo-doctor` le refuse, et à
  partir du client d'API partagé le même code serait typé par deux compilateurs différents.
  `@types/react` est épinglé en version **exacte** (`19.2.4`) : une plage `^` ne fait jamais
  redescendre pnpm d'une version déjà satisfaisante. Pour toute dépendance Expo ou React Native,
  `npx expo install <paquet>` choisit la version juste — ne jamais recopier une version de
  mémoire. `expo-router` et `expo-status-bar` suivent désormais le numéro du SDK (`~57.x`).
- **Builds natifs** : `expo run:android` est bloqué sur cette machine (chemins pnpm trop longs
  pour CMake). Les builds natifs passent par **EAS**. L'émulateur ne sert qu'à exécuter.
  Sur émulateur, l'API se joint en `http://10.0.2.2:3001`.
- **`.tsbuildinfo` périmé** après des rebases : reconstruire paquet par paquet, de bas en haut.
- **Serveur de dev laissé tournant** : le greffon de routes réécrit `routeTree.gen.ts` en
  arrière-plan, et `core.autocrlf=true` sur cette machine le rend « modifié » sans la moindre
  différence de contenu — ce qui **bloque un `git pull` ou un changement de branche** avec un
  `git diff` vide, donc incompréhensible. Le `.gitattributes` (`* text=auto eol=lf`) règle les
  fins de ligne ; arrêter le serveur avant de fusionner règle le reste. Vérifier que le port
  3000 est libre, `TaskStop` ne tuant pas toujours le processus Vite enfant.
- **Le catalogue porte deux noms.** `name` est l'anglais du dataset, `nomFr` le français
  affiché, et `nomRecherche` les deux normalisés : la recherche trouve dans les deux langues.
  Les noms français sont **écrits** dans `packages/db/catalogue/noms-fr.json`, par id du
  dataset — corriger un nom, c'est modifier une ligne et relancer `pnpm db:seed`. Le slug
  dérive du nom anglais et ne bouge donc jamais.
- **Les médias du catalogue sont affichés, jamais copiés.** Les données du dataset sont MIT, les
  GIF appartiennent à **Gym visual**. Choix assumé pour une application privée (D46) :
  `gifUrl` pointe vers le dépôt du dataset, figé sur un commit, et l'attribution « © Gym
  visual » accompagne chaque animation. Aucun média n'entre dans le dépôt.
- **Clés numériques en JSON** : un objet JavaScript range les clés numériques canoniques
  (« 1000 ») avant les autres (« 0001 »). `JSON.stringify` d'un objet d'ids réordonne donc le
  fichier en silence ; écrire `noms-fr.json` ligne à ligne, et vérifier l'ordre sur le texte.
- **Prisma 7 : `migrate dev` ne régénère plus le client.** Après une migration, lancer
  `pnpm --filter @better-lift/db generate`, sinon le client rejette les nouvelles colonnes
  avec une `PrismaClientValidationError` qui ne dit pas pourquoi.
- **Vérifier un écran protégé sans connaître les identifiants** : l'agent ne lit pas le `.env`.
  Une variable d'environnement l'emporte sur le `.env` (`process.loadEnvFile` n'écrase rien) :
  relancer l'API avec `SIGNUP_ALLOWLIST=controle@better-lift.local`, créer le compte par
  `POST /api/auth/sign-up/email` (en-tête `Origin: http://localhost:3000`), puis **relancer
  l'API sans la surcharge**. Le compte `controle@better-lift.local` existe sur `dev`
  (`betterlift`) depuis le lot 4 ; son mot de passe n'est conservé nulle part — le supprimer
  (tables `user` et `account`) et le recréer si besoin.
- **Le mobile tourne dans Expo Go** : aucune dépendance native hors SDK (d'où AsyncStorage et non
  MMKV, D55). Lancement : `npx expo start`, puis `adb reverse tcp:8081 tcp:8081` et
  `adb reverse tcp:3001 tcp:3001`, puis `adb shell am start -a android.intent.action.VIEW -d
  "exp://127.0.0.1:8081" host.exp.exponent`. Par l'IP du réseau local, Expo Go affiche un
  ancien bundle en cache avec « Cannot connect to Expo CLI ». En `CI=1`, Metro ne surveille pas
  les fichiers : le relancer après chaque modification.
- **Metro et les paquets du dépôt** : `packages/*` s'importe en `./x.js` (convention ESM de `tsc`),
  ce que Metro ne résout pas seul. `apps/mobile/metro.config.js` essaie la variante `.ts` pour
  ces seuls paquets. Un nouveau paquet partagé en profite sans rien faire.
- **Le cookie de session sur mobile** : `authClient.getCookie()` est ASYNCHRONE. Le client d'API
  le pose par un en-tête asynchrone ; sans `await`, chaque requête part sans session.
- **Séance mobile : le disque d'abord.** Tout changement de séance écrit le brouillon
  (`better-lift:seance-en-cours`) ; démarrer relit le disque à l'appui ; terminer met en file
  AVANT d'effacer le brouillon. La logique vit dans `shared` (`seance.ts`, `file-envoi.ts`),
  pure et testée ; le mobile ne garde que le disque et les écrans.
- **Dette connue** : l'avertissement « error during concurrent rendering » au démarrage du mobile,
  présent depuis le lot 3. React s'en remet seul ; les journaux n'en donnent pas la cause.
- **Records : tout est dérivé à la lecture** (`shared/records.ts`), jamais stocké. Un badge dit ce
  qu'une série a battu À CE MOMENT-LÀ, contre l'historique antérieur. « La dernière fois » s'aligne
  position par position sur TOUTES les séries précédentes, comme Hevy ; filtrer les faites
  décalerait tout.
- **Fuseau** : `apps/web/src/lib/fuseau.ts` est l'unique endroit où il est fixé (Europe/Paris).
- **Déploiement** : procédure dans `docs/deploiement.md`. Un projet Vercel à la racine, construit
  au format Build Output API par `scripts/construire-vercel.mjs` (l'API en UN bundle esbuild, sous
  `/api` ; Better Auth sous `/api/auth`). Éprouver en local avec `scripts/essayer-vercel.mjs` avant
  tout envoi. Base de prod : `betterlift` sur la branche Neon `production` — jamais `neondb` (V1).
  Le web de production appelle `<origine>/api` ; `VITE_API_URL` ne sert qu'en développement.
  En ligne sur **https://better-lift.vercel.app** ; le projet Vercel est relié à GitHub : **chaque
  fusion sur `main` déploie la production**, chaque PR a sa prévisualisation. Le build Vercel n'a
  **ni `.git` ni `DIRECT_URL`** : `prepare` tolère l'échec de `lefthook install`, et le script de
  build pose une `DIRECT_URL` factice pour `prisma generate` — l'essai local, qui a les deux, ne
  le voit pas. La console Neon propose `neondb` par défaut : **une URL de prod doit finir par
  `/betterlift`**, sinon l'API tombe sur le schéma de la V1 (`column nomFr does not exist`).
  Mobile : projet EAS `@algont/better-lift`, APK par `eas build --profile preview` (file
  gratuite : jusqu'à une heure d'attente avant le build).
- **Correctifs d'audit** : sur une branche dédiée partant de la principale, jamais dans une
  branche de fonctionnalité.

## Conventions

- Commits en **Conventional Commits**, en français.
- Branches `feat/…`, `fix/…`, `chore/…`.
- Jamais de secret dans le code : tout passe par `.env`, gitignoré.

## Skills

22 skills sont installées en **fichiers réels** sous `.claude/skills/`, commitées.
**Jamais de dossier `.agents/`.** Installation :

```
npx skills add <owner/repo> --skill <nom> --agent claude-code --copy -y
```

Trois pièges de cette CLI :

- `--skill` attend le **`name:` du frontmatter**, pas le nom du dossier. Les deux diffèrent
  parfois (`tanstack-router` sur disque, `tanstack-router-best-practices` dans le frontmatter).
- Un mauvais nom **échoue en silence**, avec une sortie qui ressemble à un succès. Vérifier
  `.claude/skills/` après chaque installation.
- `--skill a,b,c` ne marche pas : une invocation par skill.

**Ne jamais laisser Biome ou Knip toucher `.claude/`** : certaines skills embarquent des `.mjs`
que le formatage réécrirait, ce qui ferait diverger le hash de `skills-lock.json`. Quand
`biome.json` et `knip.json` seront créés, ils doivent porter les exclusions correspondantes.

## MCP

Neon et Context7 viennent des **plugins** déjà configurés sur cette machine — pas de `.mcp.json`
dans le dépôt, qui ferait doublon et imposerait une clé API en clair.

- **Neon** : projet `better-lift`, id `late-bar-51472267`, Francfort, PostgreSQL 18.
  Branches `production` (V1 seule, non reprise) et `dev`. **Sur `dev`, deux bases** : `neondb`
  porte encore la V1 (1 331 exercices, anciennes migrations) ; **`betterlift` est celle du
  nouveau dépôt** (catalogue semé, 1 316 exercices). Toute requête MCP doit passer
  `database_name: "betterlift"`, sans quoi elle lit la V1 et affiche un état trompeur.
- **Context7** : à utiliser pour toute question de version sur une bibliothèque, plutôt que
  de répondre de mémoire.
