# better-lift

Tracker de musculation personnel (2–3 comptes), web + mobile. **L'application est en français.**

La conception fait foi : [`docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md`](docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md).
Lis-la avant toute décision d'architecture — elle porte le registre des décisions et les pièges
déjà payés. Les décisions suivantes (D55 et au-delà) sont dans les autres specs de
`docs/superpowers/specs/`.

Les consignes propres à une zone sont dans `.claude/rules/` et se chargent avec ses fichiers :
`interface-web.md` (apps/web), `mobile.md` (apps/mobile), `catalogue-db.md` (packages/db),
`deploiement-ci.md` (CI, Vercel, turbo.json).

<!-- Garder ce fichier sous 200 lignes : ce qui ne vaut que pour une zone va dans .claude/rules/. -->

## État

Premier jalon complet (lots 0 à 7 : socle, coquille web, auth, catalogue français, routines,
séance mobile, historique et records), plus, sur mobile, les routines (D82–D85), la séance façon
Hevy (D86–D94) et le hors ligne avec l'Accueil en fil des séances (D95–D100). Le web a été
repensé en **poste d'analyse** (D132–D144, `2026-10-06-web-refonte-design.md`) : Tableau de bord,
Séances, Routines, Exercices, Profil — pas de séance en direct sur le web. Les **supersets** sont
livrés (D145–D153, `2026-10-06-supersets-design.md`) : éditeur de routine web et mobile, séance
mobile, historique. Le web est **nettoyé** (D154–D160, `2026-10-06-web-nettoyage-design.md`) :
coquille plate, en-tête commun à fil d'Ariane, cartes et graphes shadcn. Le mobile a une
**nouvelle identité** (D161–D177, `2026-10-11-mobile-identite-design.md`, `DESIGN.md`) :
« Underground orange », Barlow, Accueil tableau de la semaine, onglet Progrès, horloge de salle ;
le web bascule ensuite (D177). Le mobile est ensuite **resserré pour le MVP** (D178,
`2026-10-13-mobile-mvp-retrait-design.md`) : Accueil, Progrès et détail de séance retirés, la barre
est Routines · Démarrer · Profil ; les pages gardées sont revues une à une. Le web est ensuite
**redessiné en wireframe** (D221–D292, `2026-10-16-web-wireframe-design.md`,
`2026-10-18-web-records-design.md`) : Accueil · Routines · Historique · Exercices, Paramètres au
menu du compte, l'application sous `/app` (la racine est laissée à une landing). Puis le web est
**branché sur l'API** (D293–D313, `2026-10-18-web-api-design.md`) : plus de maquette, une couche
de requêtes par page, dossiers et notes de routine côté API, suite Playwright de bout en bout
(`pnpm --filter @better-lift/web e2e`, compte `e2e@better-lift.local` sur la branche Neon `dev`,
identifiants dans `apps/web/.env.e2e`). **Prochaine étape : l'épreuve du jalon** — abandonner Hevy
un mois complet ; ce qui manquera guidera la suite.
`git log` et les plans de `docs/superpowers/plans/` donnent le détail.

Distant : `Alexis-Gontier/better-lift` (privé). Le code de la V1 reste sur la branche `v1` et le
tag `v1-final` ; il sert de référence et n'est pas repris.

**`main` est protégée** : PR obligatoire, squash seul, check requis
`Qualité · typecheck · test · build` (voir `deploiement-ci.md`). Ne jamais pousser sur `main`.

## Stack

| Brique | Choix |
|---|---|
| Web | Vite + React 19 (SPA), TanStack Router + TanStack Query, shadcn/ui |
| Mobile | Expo SDK 57 (Expo Go), Expo Router, TanStack Query, AsyncStorage |
| API | Hono, Better Auth, Node 24 — fonction Vercel en production |
| Base | Prisma 7 + PostgreSQL sur Neon (Francfort) |
| Monorepo | pnpm ≥ 11.18.0 + Turborepo |
| Qualité | Biome, Lefthook, Knip, Vitest |

Paquets : `apps/{web,mobile,api}` et `packages/{db,shared,api-client,config}` (`config` ne porte
que `tsconfig.base.json`).

## Règles d'architecture

- **Le web et le mobile passent tous deux par l'API.** Jamais d'accès direct à la base depuis un
  client.
- `packages/shared` n'importe jamais Prisma, React ni une API de plateforme. TypeScript pur,
  `Intl` toléré pour les dates. `crypto.randomUUID` n'existe pas sous Hermes : pas dans `shared`.
- La logique métier vit dans `services/` côté API et ne connaît jamais le contexte Hono.
- **L'interface n'est pas partagée** entre web et mobile. Deux surfaces, deux ergonomies. La
  logique d'écran commune, elle, vit dans `shared` (ex. `brouillon-routine.ts`, D85).
- Contrat typé par **Hono RPC**, pas d'OpenAPI. Zod dans `shared` est la source unique.
- **Le client d'API vit dans `packages/api-client`, l'URL de base chez l'appelant** :
  `creerClient(baseUrl)`. Le web la tire de `import.meta.env`, le mobile de `lib/config.ts`
  (émulateur : `10.0.2.2`). Un paquet partagé qui lirait `import.meta.env` ne compilerait pas
  côté Expo.
- **Toute route de données personnelles passe par `exigerSession`**
  (`apps/api/src/middlewares/`), qui pose `userId` dans le contexte ; le service le reçoit en
  argument et filtre par lui. La donnée d'autrui est **introuvable (404), jamais interdite
  (403)**. Le lecteur de session est injecté : les routes se testent sans Better Auth.
- **Toute erreur de l'API répond `{ erreur }`** : les routes le font elles-mêmes, et
  `app.onError` / `app.notFound` (`apps/api/src/app.ts`) couvrent le reste — une exception
  imprévue est journalisée en entier et rend un 500 sans détail.
- **Les tentatives de connexion sont limitées EN BASE** (table `rateLimit`, Better Auth) : en
  mémoire, chaque instance Vercel aurait son compteur. Active en production seulement.
- **Toute charge affichée ou saisie passe par `formaterCharge` / `lireCharge`** de `shared`, avec
  le système d'unités fixé en un seul endroit par surface.
- **Records : tout est dérivé à la lecture** (`shared/records.ts`), jamais stocké. Un badge dit ce
  qu'une série a battu à ce moment-là. « La dernière fois » s'aligne position par position sur
  TOUTES les séries précédentes, comme Hevy ; filtrer les faites décalerait tout.

## Interface (les deux surfaces)

- **Une seule couleur pour l'action et le record** : l'**orange** sur le mobile (D161,
  `DESIGN.md`), encore le **lime sourd `#a8cf45`** sur le web jusqu'à sa bascule (D177). La distinction se
  fait par la forme : l'action est un **aplat** (fond lime, texte sombre), le record un
  **contour** (lime en texte sur fond teinté, flèche montante). Invariant.
- **Le danger a sa propre couleur** (`--danger`, D36) et ne porte jamais l'action ni le record.
- **Un token par rôle, deux valeurs par token** (sombre / clair). Jamais de couleur en dur
  réutilisée dans les deux registres.
- **Logo** : l'haltère Lucide (`Dumbbell`) redressée de 45°, en encre sur aplat de la couleur d'action (orange sur le mobile, lime sur le web).
- **La densité vaut pour le web seulement.** Le mobile partage la palette, pas l'échelle : en
  salle il faut des cibles larges et un contraste franc.
- **L'interface passe avant la logique** : on dessine et valide un écran avant de brancher ses
  données, avec ses **quatre états** dès le dessin (vide, chargement, erreur, nominal). Sur le
  web, chacun est atteignable par l'URL (`?etat=…`) : tout nouvel écran les porte.

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

`/verif` enchaîne build, typecheck, test, lint et knip. Un hook Biome formate chaque fichier
édité.

## Pièges qui coûtent cher

Tous ont déjà été payés une fois. La section 13 de la conception les détaille.

- **Dates** : découpage dans le fuseau du profil, **jamais en UTC**. Le samedi 21 h à Paris est
  déjà dimanche en UTC. L'arithmétique civile vit dans `shared`.
- **Clés de cache TanStack Query** : toute donnée présente dans la clé de lecture doit l'être
  dans la clé d'écriture, sinon l'écran affiche les anciennes valeurs après un enregistrement
  réussi.
- **Formulaires** : tester `!data` sans tester l'état de chargement laisse le squelette pour
  toujours.
- **Versions verrouillées par Expo** : le SDK 57 fixe **TypeScript 6.0.3** et **React 19.2.3**
  pour tout le monorepo. Ne pas monter TypeScript en 7 tant qu'Expo ne suit pas. `@types/react`
  est épinglé en version **exacte** (`19.2.4`) : une plage `^` ne fait jamais redescendre pnpm.
- **`.tsbuildinfo` périmé** après des rebases : reconstruire paquet par paquet, de bas en haut.
- **Vérifier un écran protégé** : l'agent ne lit pas le `.env`. Le compte
  `controle@better-lift.local` (base `betterlift`, branche `dev`) porte les données de démo — ne
  pas le supprimer. Réinitialiser son mot de passe par un hash `hashPassword` de
  `better-auth/crypto` écrit dans `account.password` (`providerId = 'credential'`), sans relancer
  l'API. Pour créer un autre compte : relancer l'API avec `SIGNUP_ALLOWLIST=<adresse>` (une
  variable d'environnement l'emporte sur le `.env`), `POST /api/auth/sign-up/email` avec
  `Origin: http://localhost:3000`, puis relancer l'API sans la surcharge.
- **Correctifs d'audit** : sur une branche dédiée partant de la principale, jamais dans une
  branche de fonctionnalité.

## Conventions

- Commits en **Conventional Commits**, en français.
- Branches `feat/…`, `fix/…`, `chore/…`.
- Jamais de secret dans le code : tout passe par le `.env` racine, gitignoré (modèle :
  `.env.example`).

## Skills

22 skills installées en fichiers réels sous `.claude/skills/`, commitées. **Jamais de dossier
`.agents/`.** Installation, une invocation par skill :

```
npx skills add <owner/repo> --skill <nom> --agent claude-code --copy -y
```

- `--skill` attend le **`name:` du frontmatter**, pas le nom du dossier (`tanstack-router` sur
  disque, `tanstack-router-best-practices` dans le frontmatter).
- Un mauvais nom **échoue en silence** : vérifier `.claude/skills/` après chaque installation.
- Biome et Knip excluent `.claude/` : le formatage réécrirait les `.mjs` des skills et ferait
  diverger le hash de `skills-lock.json`. Garder ces exclusions.

## MCP

Neon et Context7 viennent des **plugins** de cette machine — pas de `.mcp.json` dans le dépôt.

- **Neon** : projet `better-lift`, id `late-bar-51472267`, Francfort, PostgreSQL 18. Branches
  `production` (prod) et `dev`. Sur chacune, **`betterlift` est la base du dépôt** ; `neondb` porte
  encore la V1. **Toute requête MCP passe `database_name: "betterlift"`**, sans quoi elle lit la
  V1 et affiche un état trompeur.
- **Context7** : pour toute question de version sur une bibliothèque, plutôt que de répondre de
  mémoire.
