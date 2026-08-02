# better-lift

Tracker de musculation (type Hevy). Monorepo TypeScript : app web (atelier), app mobile (terrain), API partagée.

## Commandes

```bash
pnpm dev                      # web :3000 · api :3001 · mobile (Expo)
pnpm dev --filter=api         # une seule app
pnpm build | typecheck | test # via Turborepo
pnpm lint | lint:fix          # Biome, depuis la racine — pas de tâche Turborepo
pnpm knip                     # dépendances, fichiers et exports morts
pnpm db:migrate               # prisma migrate dev
pnpm db:seed                  # explicite : Prisma 7 ne seed plus automatiquement
pnpm db:studio
```

## Structure

```
apps/web      Next.js 16 (App Router, Turbopack)
apps/api      Hono 4.12 + @hono/zod-openapi
apps/mobile   Expo SDK 57 (Expo Router)
packages/db          Prisma 7 : schéma, migrations, seed, client
packages/core        logique métier pure — aucun I/O, aucun React, aucun Prisma
packages/validators  schémas Zod partagés (source de vérité des contrats)
packages/api-client  client typé + hooks TanStack Query
packages/ui          primitives shadcn/ui + globals.css — web uniquement, exporté en source (pas de build)
packages/config      tsconfig partagés
```

## Règles non négociables

1. **Le web et le mobile passent toujours par l'API.** Jamais d'import Prisma dans `apps/web`, même depuis un Server Component. Sans exception.
2. **Aucun partage de composants UI entre web et mobile.** Pas de `react-native-web`. Ce qui se partage : `core`, `validators`, `api-client`.
3. **Tout est stocké en métrique** : kg, mètres, secondes, cm. Le kg/lb est un affichage, jamais une donnée persistée.
4. **Les charges sont des `Decimal`**, sérialisées en chaînes dans l'API (`"82.50"`). Ne jamais faire de calcul métier avec `parseFloat` — passer par `packages/core`.
5. **Une routine est un gabarit, une séance est un instantané indépendant.** Modifier ou supprimer une routine ne doit jamais altérer l'historique.
6. **Les records sont calculés serveur**, jamais client.
7. **`POST /v1/workouts` est idempotent** : l'identifiant est généré par le client. Un double envoi ne crée jamais deux séances.
8. **La vérification d'appartenance d'une ressource se fait dans les services**, pas dans les routes. Une ressource d'autrui renvoie 404, pas 403.
9. **`packages/core` reste pur.** S'il faut y importer Prisma, React ou une API de plateforme, c'est que le code n'a rien à y faire.

## Pièges de version — lire avant d'écrire du code

Ces quatre points contredisent la majorité de ce qui traîne en ligne. Vérifier plutôt que supposer.

**Prisma 7** (pas 6) :
- Générateur `prisma-client`, **pas** `prisma-client-js`. `output` obligatoire.
- `import { PrismaClient } from "@prisma/client"` **ne fonctionne plus** — importer depuis le chemin généré.
- Pas d'`url` dans `datasource` : elle vit dans `packages/db/prisma.config.ts`.
- `new PrismaClient()` nu est invalide : driver adapter requis (`PrismaPg`).
- `packages/db` est en ES module (`"type": "module"`).
- Le middleware client `$use` a été supprimé.

**Next.js 16** (pas 15) : Turbopack par défaut, ne pas produire de configuration webpack. `middleware.ts` est renommé **`proxy.ts`** (export nommé `proxy`, runtime Node, pas d'edge) — le build échoue si les deux coexistent.

**Expo SDK 57** : development build obligatoire, jamais Expo Go. NativeWind **v4 + Tailwind 3** côté mobile alors que le web est en **Tailwind 4** — c'est voulu, NativeWind v5 est encore en preview.

**Node 24 LTS.** Node 20 est EOL depuis avril 2026.

**Zod 4.** Dans les routes API, importer `z` depuis `@hono/zod-openapi`, pas depuis `zod`, sinon `.openapi()` n'existe pas.

**Biome 2.5** : dans `biome.json`, `linter.rules.recommended` est **déprécié** — écrire `"preset": "recommended"`. Le parseur CSS rejette `@theme` de Tailwind 4 tant que `css.parser.tailwindDirectives` n'est pas à `true`.

## Conventions

- TypeScript `strict` + `noUncheckedIndexedAccess`. `any` interdit, utiliser `unknown` puis affiner.
- Qualité : **Biome** (format + lint + tri des imports), **Lefthook** (hooks), **Knip** (code mort). Ni ESLint ni Prettier — ne pas recréer de `eslint.config.js`, `.prettierrc` ni de configuration par package.
- Fichiers en `kebab-case`, composants en `PascalCase`, hooks préfixés `use`.
- Découpage **par domaine métier**, pas par type technique : `features/routines/{components,hooks,api}` plutôt qu'un dossier `components/` global.
- Domaines au singulier dans le code (`routine.service.ts`), au pluriel dans les URL (`/v1/routines`).
- Commits en Conventional Commits avec périmètre : `feat(routines): ...`, `fix(mobile): ...`.
- Une migration Prisma par PR, nommée explicitement.
- Versions des dépendances partagées déclarées via les **pnpm catalogs**, jamais en dur dans un `package.json` d'app. Exception : les paquets `expo-*`, pilotés par `npx expo install`.

## Ce qui est fait, ce qui ne l'est pas

État actuel : **V0** (socle technique). Voir `docs/01-produit.md` pour la roadmap.

Hors périmètre, ne pas proposer spontanément : social (profils, abonnements, fil), nutrition, cardio GPS, montres connectées, coaching IA, programmes tout faits, abonnements payants. L'app est gratuite et le reste.

## Documentation

Le détail vit dans `docs/`. Y aller plutôt que deviner.

| Sujet | Fichier |
|---|---|
| Produit, roadmap | `docs/01-produit.md` |
| Architecture, monorepo | `docs/02-architecture.md` |
| Modèle de données, invariants | `docs/03-modele-de-donnees.md` |
| Contrat d'API | `docs/04-api.md` |
| App web | `docs/05-app-web.md` |
| App mobile | `docs/06-app-mobile.md` |
| Conventions, CI | `docs/07-conventions.md` |
| Dataset d'exercices, licence | `docs/08-dataset-exercices.md` |
| **Décisions tranchées et leurs raisons** | `docs/09-decisions.md` |
| **Versions épinglées et ruptures** | `docs/10-versions.md` |

Avant de proposer un choix d'architecture, vérifier dans `docs/09-decisions.md` s'il n'est pas déjà tranché. Si une décision doit changer, modifier ce fichier dans la même PR.
