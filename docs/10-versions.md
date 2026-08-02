# 10 — Versions

Vérifié le **31 juillet 2026**. À revalider à chaque démarrage de phase (V0 → V1 → V2), les versions ci-dessous bougent vite.

## Socle

| Brique     | Version                  | Note                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js    | **24 LTS** (« Krypton ») | LTS jusqu'à mai 2028. **Node 20 est EOL depuis avril 2026**, Node 22 tient jusqu'à avril 2027. Fixer dans `.nvmrc`.                                                                                                                                                                                                                                                                             |
| pnpm       | **11.x**                 | Utiliser les **catalogs** (voir plus bas).                                                                                                                                                                                                                                                                                                                                                      |
| Turborepo  | **2.10.x**               | Champ `tasks` (le `pipeline` de la 1.x est mort depuis longtemps).                                                                                                                                                                                                                                                                                                                              |
| TypeScript | **6.0.3**                | Version attendue par Expo SDK 57 (`expo install --check`). **Pas la 7**, pourtant disponible : c'est Expo seul qui borne désormais — la contrainte `typescript-eslint` (`>=4.8.4 <6.1.0`) est tombée avec ESLint (D19). Rupture de la 6 à connaître : `baseUrl` est déprécié et disparaît en 7 — n'utiliser que `paths`, qui se résout relativement au `tsconfig`.                                                                                                                                                                                                                                                                     |
| Biome      | **2.5.6**                | Remplace ESLint et Prettier (D19). Trois pièges : `linter.rules.recommended` est **déprécié**, écrire `"preset": "recommended"` ; le parseur CSS refuse `@theme` tant que `css.parser.tailwindDirectives` n'est pas à `true` ; `useImportType` produit `import type { X }` par défaut, il faut `"style": "inlineType"` pour garder la forme `import { type X }` du dépôt. Pas de règles typées : le domaine `types` existe mais reste trop jeune pour qu'on s'appuie dessus. |
| Lefthook   | **2.1.10**               | Remplace husky et lint-staged. Son postinstall doit être autorisé dans `allowBuilds` de `pnpm-workspace.yaml`, sinon `lefthook install` n'a rien à poser et **aucun hook n'est actif, sans erreur**. Si husky est passé par là : `git config --unset-all --local core.hooksPath` d'abord, l'installation échoue tant que le chemin pointe sur `.husky/_`. |
| Knip       | **6.30.0**               | Dépendances, fichiers et exports morts. Tourne en CI, pas en pré-commit. Configuration en `knip.jsonc` — le format JSON simple interdit les commentaires. |

## Applications

| Brique              | Version    | Note                                                                                                                                                                                 |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Next.js             | **16.2.x** | Active LTS jusqu'à oct. 2027. Turbopack par défaut, `middleware.ts` renommé `proxy.ts` — voir ci-dessous. Next 15 est en Maintenance LTS jusqu'à oct. 2026 — ne pas démarrer dessus. |
| React               | **19.2.x** | Aligné web et mobile.                                                                                                                                                                |
| Hono                | **4.12.x** |                                                                                                                                                                                      |
| `@hono/node-server` | **2.0.x**  | Adaptateur Node.                                                                                                                                                                     |
| `@hono/zod-openapi` | **1.5.x**  | La 1.0 est la migration Zod v4.                                                                                                                                                      |
| Zod                 | **4.x**    |                                                                                                                                                                                      |
| Expo SDK            | **57**     | Sorti le 30 juin 2026. RN 0.86, React 19.2. Support ~1 an ; SDK 58 attendu vers sept./oct. 2026.                                                                                     |
| React Native        | **0.86**   | Porté par Expo 57.                                                                                                                                                                   |

## Données & auth

| Brique               | Version   | Note                                                                                                                                                                                                                                  |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma ORM           | **7.x**   | Rupture majeure vs 6 — voir ci-dessous.                                                                                                                                                                                               |
| `@prisma/adapter-pg` | 7.x       | **Obligatoire** : `new PrismaClient()` sans adaptateur est invalide en v7.                                                                                                                                                            |
| Better Auth          | **1.6.x** |                                                                                                                                                                                                                                       |
| `@better-auth/expo`  | **1.6.x** | Nécessite `expo-secure-store` **et** `expo-network` — donc un development build, Expo Go ne suffit plus. Deux pièges : ses types sont **incompatibles avec `better-auth` de la même version** (`getActions` déclare un `BetterFetch` plus étroit que `BetterAuthClientPlugin` n'accepte) — ce n'est pas une duplication pnpm, les deux résolvent bien la même copie ; un `@ts-expect-error` sur le plugin vaut mieux qu'un cast, il préserve l'inférence de session et sautera quand la lib corrigera. Et `getCookie()` renvoie un en-tête `Cookie` complet, **pas** le jeton nu : il faut en extraire `better-auth.session_token` pour le présenter en `Authorization: Bearer`. |
| Resend               | **6.x**   | E-mails transactionnels (D20). Le SDK **ne lève pas** d'exception : il renvoie `{ data, error }`, à tester explicitement. Chargé paresseusement — sans `RESEND_API_KEY`, il n'est jamais importé.                                       |
| PostgreSQL           | **18**    | Neon, région **Francfort** (`aws-eu-central-1`). La cible initiale était la 17 ; Neon provisionne désormais en 18 par défaut, et rien dans le schéma ne justifiait de forcer la version inférieure. Migration et seed validés dessus. |

## Front

| Brique                       | Version                      | Note                        |
| ---------------------------- | ---------------------------- | --------------------------- |
| TanStack Query               | **5.101.x**                  |                             |
| Tailwind CSS                 | **4.x**                      | Web. Config CSS-first.      |
| NativeWind                   | **v4 stable** (Tailwind 3.x) | ⚠️ voir le point ci-dessous |
| shadcn/ui                    | courant                      | Web uniquement.             |
| dnd-kit, Recharts, FlashList | courants                     |                             |

---

## Ruptures à connaître

### Prisma 7 — la plus grosse

La v7 casse quatre choses par rapport à tout ce qu'on trouve encore dans les tutoriels :

1. **Prisma est désormais un module ES.** `"type": "module"` requis dans le `package.json` du package `db`.
2. **Nouveau générateur, `output` obligatoire.** `provider = "prisma-client"` (et non plus `prisma-client-js`), avec un chemin de sortie explicite. Le client n'est plus généré dans `node_modules`, donc `import { PrismaClient } from "@prisma/client"` ne fonctionne plus.
3. **L'URL sort du schéma.** `url`, `directUrl` et `shadowDatabaseUrl` ne sont plus acceptés dans le bloc `datasource` ; ils vivent dans un `prisma.config.ts` à la racine du package.
4. **Driver adapter obligatoire.** `new PrismaClient()` nu échoue ; il faut passer un adaptateur (`PrismaPg` pour Postgres).

Ont aussi disparu : le middleware client (`$use`), le seed automatique pendant les migrations (il faut lancer `prisma db seed` explicitement), et les métriques.

**Deux pièges découverts au montage de la V0**, absents de la documentation amont :

1. **`@prisma/client` reste une dépendance obligatoire.** L'import direct `import { PrismaClient } from "@prisma/client"` a bien disparu, mais le client _généré_ fait `import * as runtime from "@prisma/client/runtime/client"`. Sans le paquet dans les dépendances, pnpm (isolation stricte) ne le résout pas : la compilation ne plante pas franchement, **les types s'effondrent silencieusement en `{}`** et tout `findMany` devient `any`. Symptôme trompeur : des `TS7006 implicitly has an 'any' type` sur des callbacks parfaitement typés.

2. **`prisma.config.ts` ne doit pas exiger `DATABASE_URL`.** `prisma generate` charge la configuration entière, y compris le bloc `datasource` — alors qu'il ne se connecte à rien. Avec `env("DATABASE_URL")` inconditionnel, `pnpm db:generate` échoue en CI, là où aucune base n'est branchée. Rendre le bloc `datasource` conditionnel à la présence de l'URL ; les commandes de migration, elles, échoueront explicitement si elle manque.

Configuration cible :

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // pas d'url ici en v7
}
```

```ts
// packages/db/prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
```

```ts
// packages/db/src/client.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });
export * from "./generated/prisma/client";
```

**Bonne nouvelle collatérale :** le bug connu entre le générateur `prisma-client` et Turbopack (SSR Next.js 16) ne nous concerne pas, puisque le web ne touche jamais Prisma — seule l'API l'importe. C'est un bénéfice concret de la règle « tout passe par l'API ».

**`migrate dev` exige un terminal interactif** dès qu'il a un avertissement à faire confirmer — l'ajout d'une contrainte d'unicité, par exemple. Il échoue sinon, `--create-only` compris. Pour produire une migration hors terminal, passer par `migrate diff`, dont les options ont été **renommées en v7** :

```bash
# v6 : --from-schema-datasource / --to-schema-datamodel — supprimées
prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

Le SQL obtenu se dépose dans `prisma/migrations/<horodatage>_<nom>/migration.sql`, puis `migrate deploy` l'applique. Vérifier le SQL avant : c'est le seul contrôle qu'on garde en se passant du mode interactif.

### Next.js 16 — `middleware.ts` devient `proxy.ts`

Turbopack par défaut n'est pas la seule rupture de la 16. Le fichier `middleware.ts` est **déprécié et renommé `proxy.ts`**, pour marquer qu'il s'agit d'une frontière réseau et non d'un middleware applicatif.

- L'export nommé passe de `middleware` à `proxy`.
- Les options de configuration suivent : `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`, `middlewarePrefetch` → `proxyPrefetch`, etc.
- Les types aussi : `NextMiddleware` → `NextProxy`, `MiddlewareConfig` → `ProxyConfig`.
- Le build **avertit** si seul `middleware.ts` existe, et **échoue** si les deux fichiers coexistent.
- **Le runtime `edge` n'est pas supporté par `proxy`** : il tourne en `nodejs`, et ce n'est pas configurable. Un besoin d'edge oblige à rester sur `middleware.ts`.

```ts
// src/proxy.ts
export function proxy(request: NextRequest) {
  /* … */
}
export const config = { matcher: ["/dashboard/:path*", "/routines/:path*" /* … */] };
```

Migration automatique si l'on part d'un projet existant : `npx @next/codemod middleware-to-proxy .`. Ici on démarre à neuf : écrire directement `proxy.ts`.

Deux points constatés à l'écriture, le 1er août 2026 :

- **Un groupe de routes ne s'écrit pas dans le `matcher`.** `"/(app)/:path*"` ne correspond à rien : `(app)` est une convention de dossier qui n'apparaît **jamais** dans l'URL. Il faut lister les chemins réels (`/dashboard/:path*`, `/routines/:path*`, …), et donc penser à compléter la liste à chaque nouvelle section. Un test vérifie l'alignement.
- **Le `matcher` est analysé statiquement au build.** Pas de spread, pas de constante réutilisée : un tableau de littéraux, sinon Next ne le voit pas.

### Better Auth — trois pièges de cookie côté `proxy.ts`

Rencontrés en câblant la protection des routes web. Aucun n'est visible en développement, ce qui est précisément le problème.

- **Le nom du cookie change en HTTPS.** Better Auth préfixe de `__Secure-` dès qu'il émet en sécurisé : `better-auth.session_token` en local devient `__Secure-better-auth.session_token` en production. Un `proxy.ts` qui ne cherche qu'un seul des deux noms marche en local et déconnecte tout le monde en production — et la CI ne le voit pas.
- **Les cookies ne sont pas cloisonnés par port, mais bien par hôte.** En développement, le cookie posé par l'API sur `:3001` arrive tel quel sur le web en `:3000` : rien à configurer, ça marche « tout seul ». En production ce sont deux hôtes (`better-lift.app` et `api.better-lift.app`, D2) et le cookie reste rattaché à celui de l'API. Il faut `advanced.crossSubDomainCookies`, activé ici en comparant les hôtes de `WEB_APP_URL` et `BETTER_AUTH_URL`.
- **`callbackURL` doit être absolue.** C'est l'API qui effectue la redirection de fin d'OAuth et de vérification d'e-mail : un chemin relatif se résout sur **son** origine, et l'utilisateur atterrit sur du JSON. Le web les construit depuis `window.location.origin`.

### `useSearchParams()` impose une frontière `<Suspense>`

Tout composant client qui lit les paramètres d'URL doit être enveloppé dans un `<Suspense>` par la page qui l'affiche, sinon Next refuse de prérendre et **le build échoue**. Concerne ici les écrans de connexion, d'inscription et de réinitialisation, qui lisent `?next=` et `?token=`.

### NativeWind et Tailwind 4 — décalage à assumer

Le web est en Tailwind 4. Côté mobile, **NativeWind v5 (qui supporte Tailwind 4) est encore en preview** ; la version stable est la v4, qui fonctionne avec Tailwind 3.x. La chaîne Tailwind 4 sur Expo demande en plus `react-native-css` et une configuration Metro spécifique.

**Décision :** NativeWind v4 + Tailwind 3.x sur le mobile, Tailwind 4 sur le web. Les deux configurations restent séparées de toute façon (aucun composant partagé), donc le décalage ne coûte qu'une chose : ne pas partager le fichier de thème tel quel.

Le contournement propre : définir les **tokens de design** (couleurs, espacements, rayons) dans `packages/config` en TypeScript, et générer les deux configurations Tailwind à partir de cette source unique. Migrer le mobile vers NativeWind v5 quand il sera stable.

### pnpm catalogs

pnpm 11 rend les catalogs incontournables en monorepo : une seule déclaration de version pour tous les packages, ce qui élimine la dérive entre `apps/web` et `apps/mobile`.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  react: 19.2.0
  react-dom: 19.2.0
  zod: ^4.0.0
  "@tanstack/react-query": ^5.101.0
  typescript: ^5.9.0
```

```jsonc
// dans n'importe quel package.json
{ "dependencies": { "zod": "catalog:", "react": "catalog:" } }
```

Cas particulier : les versions des paquets `expo-*` sont pilotées par `npx expo install`, qui les aligne sur le SDK. Ne pas les mettre au catalog, laisser Expo décider.

### React s'épingle **exactement**, jamais en plage

Piège coûteux, rencontré en V0. pnpm indexe chaque paquet à peer React par la version de React résolue : `@tanstack+react-query@5.101.4_react@19.2.3` et `…_react@19.2.8` sont deux répertoires, donc **deux instances du module**, donc deux contextes React distincts.

Symptôme : `No QueryClient set, use QueryClientProvider to set one`, alors que le `QueryClientProvider` est manifestement en place — il alimente le contexte d'une instance, et les hooks de `packages/api-client` lisent celui de l'autre. Rien dans le message ne pointe vers une histoire de versions.

Cause en V0 : catalog en `react: ^19.2.0` (résolu en 19.2.8) tandis qu'`apps/mobile` épinglait `19.2.3`, la version qu'impose Expo. **Un `^` sur React dans un monorepo pnpm suffit à créer la divergence.**

Règle : `react` et `react-dom` sont épinglés au catalog à la version exacte attendue par Expo SDK, et **aucune application ne redéclare sa propre version** — toutes utilisent `catalog:`.

Vérification, quand un doute survient :

```bash
# Doit renvoyer un seul et même chemin pour les trois consommateurs.
node -e "console.log(require('fs').realpathSync('apps/mobile/node_modules/@tanstack/react-query'))"
```

Une entrée `react@19.2.8` peut subsister dans `node_modules/.pnpm` : elle vient des dépendances optionnelles de **Prisma Studio** (Radix, visx) et n'atteint jamais le bundle des applications.

### Expo et pnpm

Metro a longtemps mal supporté les node_modules symboliques. Si la résolution des packages du workspace échoue depuis `apps/mobile`, le contournement connu est :

```ini
# .npmrc
node-linker=hoisted
```

À tester en V0 avant d'en faire une règle : la situation s'est améliorée côté Metro et pnpm 11, et le mode hoisted a ses propres inconvénients (il annule une partie de l'isolation qui fait l'intérêt de pnpm). Ne l'activer que si le problème se manifeste réellement.

### MMKV 4 — API différente de tout ce qui traîne en ligne

`react-native-mmkv` **4.3.2**, la version que `expo install` retient pour le SDK 57. Trois écarts avec la quasi-totalité des exemples publiés, tous écrits pour la 3 :

| La 3 disait | La 4 dit |
|---|---|
| `new MMKV({ id })` | `createMMKV({ id })` — le constructeur a disparu, `MMKV` n'est plus qu'un **type** |
| `storage.delete(key)` | `storage.remove(key)` |
| rien | `react-native-nitro-modules` est une **dépendance de pair obligatoire** |

Deux pièges de plus, découverts en bundlant :

- **Il n'y a pas de config plugin.** Le `package.json` liste pourtant `app.plugin.js` dans ses `files`, et le fichier n'existe pas dans le paquet publié. L'ajouter à `plugins` dans `app.json` fait échouer `expo export` sur une erreur ESM/CJS dont le message ne mentionne jamais `app.json` — l'autolinking suffit.
- **Les chaînes accentuées sont en UTF-16 dans le bytecode Hermes.** Chercher « Démarrer la séance » dans un `.hbc` lu en latin-1 ne donne rien alors que le code est bien embarqué. Vérifier un bundle avec `Buffer.from(texte, "utf16le")`, sinon on conclut à une absence qui n'existe pas.

### Node 20 est mort

Sa fin de support est passée en avril 2026. Toute doc ou tutoriel qui la mentionne comme cible est périmé. Next.js 16 exige Node 20+ au minimum, mais viser directement la 24.

## Politique de mise à jour

| Type                   | Cadence                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| Correctifs de sécurité | immédiat (Dependabot/Renovate en auto-merge si la CI passe)             |
| Patchs et mineures     | hebdomadaire, groupés                                                   |
| Majeures               | décision explicite, une PR par majeure, jamais deux en même temps       |
| Expo SDK               | dans les 2 mois suivant la sortie — le support ne dure qu'environ un an |
| Next.js                | rester sur l'Active LTS                                                 |

Next.js a eu un cluster d'avis de sécurité en mai 2026 (contournement d'autorisation dans le middleware, SSRF, empoisonnement de cache). C'est une dépendance à tenir à jour sérieusement, pas au fil de l'eau.
