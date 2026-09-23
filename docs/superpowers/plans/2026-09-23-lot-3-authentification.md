# Lot 3 — Authentification : plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUISE — utiliser `superpowers:subagent-driven-development`
> (recommandé) ou `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les étapes
> utilisent des cases à cocher (`- [ ]`).

**But :** rendre la connexion effective sur le web et le mobile, avec une inscription close par
liste blanche, et une session mobile qui survit à la fermeture de l'application.

**Architecture :** une instance Better Auth côté API sert le cookie du web et le jeton porteur du
mobile. La liste blanche mord sur `databaseHooks.user.create.before`, donc sur la création d'un
utilisateur et non sur une route. Le web pose la session dans le contexte du routeur et protège
les écrans par une route de mise en page sans chemin dont le `beforeLoad` redirige avant tout
rendu.

**Pile :** Better Auth 1.7.5, `@better-auth/expo` 1.7.5, `expo-secure-store`, Prisma 7,
TanStack Router, Hono, Vitest 5.

**Spec :** [`docs/superpowers/specs/2026-09-23-lot-3-authentification-design.md`](../specs/2026-09-23-lot-3-authentification-design.md)

## Contraintes globales

- **L'application est en français.** Tout libellé visible, tout commentaire, tout message de
  commit. Commits en Conventional Commits, en français ; **le sujet ne doit pas commencer par une
  majuscule** — commitlint applique `subject-case` et refuse `docs: CLAUDE.md …` ou `docs: D36 …`.
- **Branche dédiée** `feat/lot-3-authentification`, partant de `main`. Jamais de commit direct
  sur `main`.
- **Versions verrouillées par Expo** : TypeScript 6.0.3, React 19.2.3. Toute dépendance Expo ou
  React Native s'installe par `npx expo install <paquet>`, jamais en recopiant une version.
- **`packages/shared` n'importe jamais** Prisma, React ni une API de plateforme. TypeScript pur,
  `Intl` toléré.
- **Un rôle shadcn non déclaré dans `@theme inline` n'émet aucune règle, en silence.** Le
  vérifier au navigateur, pas à la lecture.
- **La CI n'a pas de base de données.** Toute étape qui charge `packages/db/prisma.config.ts` ou
  la configuration Better Auth a besoin de variables factices.
- **Le nom du job CI est `Qualité · typecheck · test · build`** et c'est un check requis : le
  changer rend toute PR immergeable.
- **Variables déjà documentées dans `.env.example`** : `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `SIGNUP_ALLOWLIST`, `VITE_API_URL`, `EXPO_PUBLIC_API_URL`. Ne pas en inventer d'autres noms.
- **Le schéma mobile est `better-lift`**, déjà déclaré dans `apps/mobile/app.json`.
- **Arrêter le serveur de dev avant toute fusion** : il réécrit `routeTree.gen.ts` en
  arrière-plan, ce qui bloque un `git pull` avec un `git diff` vide.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `packages/shared/src/allowlist.ts` | Normalisation et comparaison d'adresses — calcul pur |
| `packages/db/prisma/schema.prisma` | Les quatre modèles de Better Auth |
| `apps/api/src/auth.ts` | L'instance Better Auth et les deux gardes |
| `apps/api/src/app.ts` | Montage de `/api/auth/*` |
| `apps/web/src/styles/tokens.css` | Les deux valeurs du token de danger (D36) |
| `apps/web/src/lib/auth-client.ts` | Le client d'authentification du web |
| `apps/web/src/lib/auth-session.ts` | Le porteur de session passé au contexte du routeur |
| `apps/web/src/routes/_protege.tsx` | La frontière d'authentification du web |
| `apps/web/src/routes/connexion.tsx` | L'écran de connexion |
| `apps/web/src/features/auth/formulaire-connexion.tsx` | Le formulaire et ses trois refus |
| `apps/web/src/components/shell/nav-lateral.tsx` | Gagne la déconnexion |
| `apps/mobile/lib/auth-client.ts` | Le client mobile, stockage `SecureStore` |
| `apps/mobile/app/connexion.tsx` | L'écran de connexion mobile, volontairement brut |

---

### Tâche 0 : Ouvrir la branche

- [ ] **Étape 1 : Partir de `main` à jour**

```bash
git checkout main
git pull --ff-only
git checkout -b feat/lot-3-authentification
```

---

### Tâche 1 : La liste blanche, en calcul pur

**Fichiers :**
- Créer : `packages/shared/src/allowlist.ts`
- Test : `packages/shared/src/allowlist.test.ts`
- Modifier : `packages/shared/src/index.ts`

**Interfaces :**
- Produit :
  - `normaliserListe(brut: string | undefined): string[]`
  - `estAutorisee(email: string, liste: string[]): boolean`

> C'est le seul endroit du lot où un test attrape vraiment quelque chose. Le reste — câblage du
> hook, garde du routeur, persistance du jeton — se vérifie en exécutant.

- [ ] **Étape 1 : Écrire le test qui échoue**

`packages/shared/src/allowlist.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { estAutorisee, normaliserListe } from "./allowlist.js";

describe("normaliserListe", () => {
  it("découpe sur les virgules, détoure et met en minuscules", () => {
    expect(normaliserListe(" Alexis@Gmail.com , bob@example.com ")).toEqual([
      "alexis@gmail.com",
      "bob@example.com",
    ]);
  });

  it("ignore les entrées vides plutôt que de produire une chaîne vide", () => {
    expect(normaliserListe("a@b.c,,  ,d@e.f")).toEqual(["a@b.c", "d@e.f"]);
  });

  it("rend une liste vide quand la variable est absente", () => {
    expect(normaliserListe(undefined)).toEqual([]);
  });
});

describe("estAutorisee", () => {
  const liste = ["alexis@gmail.com"];

  it("accepte l'adresse exacte", () => {
    expect(estAutorisee("alexis@gmail.com", liste)).toBe(true);
  });

  it("accepte quelle que soit la casse et les espaces autour", () => {
    expect(estAutorisee("  Alexis@Gmail.COM ", liste)).toBe(true);
  });

  it("refuse une adresse absente", () => {
    expect(estAutorisee("inconnu@example.com", liste)).toBe(false);
  });

  // Le cas qui compte le plus : une liste vide ne doit JAMAIS tout laisser passer.
  it("refuse tout quand la liste est vide", () => {
    expect(estAutorisee("alexis@gmail.com", [])).toBe(false);
  });

  // Les alias `+` ne sont PAS traités comme équivalents : les considérer identiques
  // élargirait la liste blanche au lieu de la resserrer, et demanderait de connaître
  // les règles de chaque fournisseur.
  it("ne traite pas un alias + comme l'adresse de base", () => {
    expect(estAutorisee("alexis+spam@gmail.com", liste)).toBe(false);
  });
});
```

- [ ] **Étape 2 : Vérifier l'échec**

```bash
pnpm --filter @better-lift/shared exec vitest run src/allowlist.test.ts
```

Attendu : ÉCHEC, « Cannot find module './allowlist.js' ».

- [ ] **Étape 3 : Implémenter**

`packages/shared/src/allowlist.ts` :

```ts
/**
 * La liste blanche d'inscription, réduite à du calcul pur.
 *
 * C'est le point de sécurité du projet (D22) : dans l'ancien dépôt,
 * `/sign-up/email` est resté ouvert sur Internet. Le garde qui s'appuie sur ces
 * fonctions vit dans `apps/api/src/auth.ts`, sur la création d'utilisateur.
 */

function normaliser(email: string): string {
  return email.trim().toLowerCase();
}

export function normaliserListe(brut: string | undefined): string[] {
  if (!brut) return [];
  return brut
    .split(",")
    .map(normaliser)
    .filter((e) => e.length > 0);
}

export function estAutorisee(email: string, liste: string[]): boolean {
  // Une liste vide refuse tout. L'inverse — tout laisser passer — aurait
  // l'apparence d'une protection sans en être une.
  if (liste.length === 0) return false;
  return liste.includes(normaliser(email));
}
```

- [ ] **Étape 4 : Vérifier que les tests passent**

```bash
pnpm --filter @better-lift/shared exec vitest run src/allowlist.test.ts
```

Attendu : 8 tests verts.

- [ ] **Étape 5 : Exporter**

Ajouter dans `packages/shared/src/index.ts`, en gardant l'ordre alphabétique des lignes
d'export existantes :

```ts
export { estAutorisee, normaliserListe } from "./allowlist.js";
```

- [ ] **Étape 6 : Commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): la liste blanche d'inscription, en calcul pur"
```

---

### Tâche 2 : Les modèles de Better Auth

**Fichiers :**
- Modifier : `packages/db/prisma/schema.prisma`
- Créer : une migration sous `packages/db/prisma/migrations/`

**Interfaces :**
- Produit : les modèles `User`, `Session`, `Account`, `Verification` dans le client Prisma généré

- [ ] **Étape 1 : Installer Better Auth côté API**

```bash
pnpm --filter @better-lift/api add better-auth@1.7.5
```

- [ ] **Étape 2 : Écrire une instance minimale, juste pour que la CLI ait quoi lire**

`apps/api/src/auth.ts`, première version — elle sera complétée à la tâche 3 :

```ts
import "./env.js";

import { prisma } from "@better-lift/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});
```

- [ ] **Étape 3 : Générer les modèles**

```bash
npx @better-auth/cli@1.7.5 generate --config apps/api/src/auth.ts
```

La CLI déduit le fichier cible de l'adaptateur et **annonce le chemin qu'elle va écrire avant de
le faire**. Lire cette ligne : elle doit dire `packages/db/prisma/schema.prisma`. Si elle propose
un autre chemin, refuser et relancer en donnant le bon avec `--output`.

- [ ] **Étape 4 : Relire le diff avant de migrer**

```bash
git diff packages/db/prisma/schema.prisma
```

**Ne pas enchaîner sans lire.** Contrôler quatre points :

1. Quatre modèles ajoutés : `User`, `Session`, `Account`, `Verification`.
2. Le modèle `Exercise` existant et l'enum `BodyPart` sont **intacts**.
3. Le bloc `generator client` garde `provider = "prisma-client"` et
   `output = "../src/generated"` — la CLI peut réécrire le générateur.
4. Le bloc `datasource db` ne regagne **pas** de champ `url` : en Prisma 7, l'URL vit dans
   `prisma.config.ts`. Si la CLI en ajoute un, le retirer.

Si l'un des trois derniers points a bougé, corriger à la main avant de continuer.

> `Verification` est conservé bien que la vérification d'adresse soit désactivée (D15) : Better
> Auth s'en sert aussi pour la réinitialisation de mot de passe.

- [ ] **Étape 5 : Migrer sur la branche Neon `dev`**

Vérifier d'abord que `.env` vise bien `dev` et non `production` :

```bash
grep -c "production" .env
```

Attendu : `0`. Puis :

```bash
pnpm db:migrate
```

- [ ] **Étape 6 : Vérifier que le client se génère**

```bash
pnpm db:generate
pnpm typecheck
```

- [ ] **Étape 7 : Commit**

```bash
git add packages/db apps/api/src/auth.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(db): les quatre modèles de Better Auth et leur migration"
```

---

### Tâche 3 : L'instance et les deux gardes

**Fichiers :**
- Modifier : `apps/api/src/auth.ts`
- Modifier : `apps/api/src/app.ts`
- Test : `apps/api/src/auth.test.ts`

**Interfaces :**
- Consomme : `estAutorisee`, `normaliserListe` de `@better-lift/shared`
- Produit : `auth` — l'instance Better Auth, montée sur `/api/auth/*`

> **Le cœur du lot.** La documentation offre deux accroches pour refuser une inscription, et
> elles ne se valent pas. `hooks.before` filtré sur `ctx.path === "/sign-up/email"` est lié à
> **une route** ; `databaseHooks.user.create.before` est lié à **la création d'un utilisateur**,
> quel que soit le chemin. On retient le second (D30). Le premier est ajouté **en plus**, et
> uniquement pour rendre le message lisible côté formulaire. Si les deux divergent un jour,
> c'est le premier qu'on supprime.

- [ ] **Étape 1 : Ajouter `@better-lift/shared` aux dépendances de l'API**

```bash
pnpm --filter @better-lift/api add "@better-lift/shared@workspace:*"
```

- [ ] **Étape 2 : Écrire l'instance complète**

`apps/api/src/auth.ts` :

```ts
import "./env.js";

import { prisma } from "@better-lift/db";
import { estAutorisee, normaliserListe } from "@better-lift/shared";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";

// Lue UNE FOIS au démarrage. Une liste vide fait échouer le démarrage : une
// liste blanche qui laisse tout passer a l'apparence d'une protection sans en
// être une, et le seul comportement sûr est d'échouer bruyamment.
const LISTE_BLANCHE = normaliserListe(process.env.SIGNUP_ALLOWLIST);

if (LISTE_BLANCHE.length === 0) {
  throw new Error(
    "SIGNUP_ALLOWLIST est absente ou vide. L'inscription serait ouverte à tous : refus de démarrer.",
  );
}

const MESSAGE_REFUS = "Cette adresse n'est pas autorisée à créer un compte.";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  trustedOrigins: ["http://localhost:3000", "better-lift://"],

  // LE garde. Lié à la création d'un utilisateur, donc valable pour tout chemin
  // présent ou futur — y compris un fournisseur OAuth ajouté plus tard, que le
  // hook de route ci-dessous ne couvrirait pas.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!estAutorisee(user.email, LISTE_BLANCHE)) {
            throw new APIError("FORBIDDEN", { message: MESSAGE_REFUS });
          }
        },
      },
    },
  },

  // Confort, pas sécurité : il rend au formulaire un message lisible plutôt que
  // l'erreur remontée depuis la couche base. Ne jamais s'y fier seul.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = ctx.body?.email;
      if (typeof email === "string" && !estAutorisee(email, LISTE_BLANCHE)) {
        throw new APIError("FORBIDDEN", { message: MESSAGE_REFUS });
      }
    }),
  },
});
```

- [ ] **Étape 3 : Monter le gestionnaire dans l'app**

Dans `apps/api/src/app.ts`, ajouter l'import et la ligne de montage **avant** `app.route("/health", health)` :

```ts
import { auth } from "./auth.js";
```

```ts
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

> Le middleware CORS existant couvre déjà `/*` avec `credentials: true` et les origines de
> développement — il n'y a rien à ajouter. `trustedOrigins` de Better Auth doit lister les mêmes
> origines, ce que fait l'étape 2.

- [ ] **Étape 4 : Écrire le test du refus et de l'acceptation**

`apps/api/src/auth.test.ts` :

```ts
import { beforeAll, describe, expect, it, vi } from "vitest";

// L'instance lit SIGNUP_ALLOWLIST au chargement du module : la variable doit
// donc être posée AVANT l'import, d'où le `vi.hoisted` et l'import dynamique.
vi.hoisted(() => {
  process.env.SIGNUP_ALLOWLIST = "autorise@example.com";
  process.env.BETTER_AUTH_SECRET = "secret-de-test-uniquement-pour-vitest";
  process.env.BETTER_AUTH_URL = "http://localhost:3001";
});

let app: typeof import("./app.js").default;

beforeAll(async () => {
  app = (await import("./app.js")).default;
});

describe("l'inscription est close par la liste blanche", () => {
  it("refuse une adresse absente de la liste", async () => {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "inconnu@example.com",
        password: "motdepasse-assez-long",
        name: "Inconnu",
      }),
    });

    expect(res.status).toBe(403);
  });
});
```

> Ce test couvre le refus, qui est ce qui compte. L'acceptation demande une vraie base — elle se
> vérifie à la main à l'étape 6, et de nouveau à chaque écran des tâches 6 et 7.

- [ ] **Étape 5 : Lancer le test**

```bash
pnpm --filter @better-lift/api exec vitest run src/auth.test.ts
```

Attendu : vert. **S'il échoue sur une connexion à la base**, c'est que le garde de route (a) n'a
pas mordu et que la requête est descendue jusqu'à la couche base : vérifier le chemin comparé
dans `hooks.before`.

- [ ] **Étape 6 : Vérifier à la main que l'acceptation marche**

Avec `.env` renseigné, l'API lancée (`pnpm --filter @better-lift/api dev`) :

```bash
curl -i -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"inconnu@example.com","password":"motdepasse-assez-long","name":"Inconnu"}'
```

Attendu : **403**.

```bash
curl -i -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"<UNE ADRESSE DE SIGNUP_ALLOWLIST>","password":"motdepasse-assez-long","name":"Moi"}'
```

Attendu : **200**, et un cookie de session dans les en-têtes.

- [ ] **Étape 7 : Vérifier le refus de démarrage**

```bash
SIGNUP_ALLOWLIST="" pnpm --filter @better-lift/api dev
```

Attendu : le processus s'arrête avec « SIGNUP_ALLOWLIST est absente ou vide ». **Ce contrôle est
le plus important du lot** : c'est lui qui garantit qu'aucun déploiement mal configuré n'ouvre
l'inscription.

- [ ] **Étape 8 : Commit**

```bash
git add apps/api packages/shared pnpm-lock.yaml
git commit -m "feat(api): instance Better Auth et liste blanche sur la création d'utilisateur"
```

---

### Tâche 4 : Le token de danger (D36)

**Fichiers :**
- Modifier : `apps/web/src/styles/tokens.css`
- Modifier : `apps/web/src/styles/globals.css`
- Modifier : `CLAUDE.md`

**Interfaces :**
- Produit : les classes `bg-destructive`, `text-destructive-foreground`, `text-destructive-ink`,
  et l'effet réel d'`aria-invalid` sur `input.tsx`

> D36 amende la ligne « une seule couleur » de la doctrine. Le rouge est **borné au danger** : il
> ne porte jamais l'action ni le record, qui restent au lime. C'est pour cette raison exacte que
> la distinction action/record se fait par la forme — le lime porte déjà deux rôles et ne peut
> pas en porter un troisième.

- [ ] **Étape 1 : Ajouter les deux valeurs du token**

Dans `apps/web/src/styles/tokens.css`, sous `:root` (thème sombre), après le bloc « Accent » :

```css
  /* Danger — borné au danger, ne porte jamais l'action ni le record (D36) */
  --danger: #b4453f;
  --danger-on: #fdf3f2;
  --danger-ink: #e98b85;
  --danger-wash: rgb(180 69 63 / 0.16);
```

Et sous `[data-theme="light"]`, au même endroit :

```css
  /* Même logique que l'accent : l'aplat garde sa teinte, le rouge EN TEXTE
     s'assombrit pour tenir 4,5:1 sur blanc. */
  --danger: #b4453f;
  --danger-on: #fdf3f2;
  --danger-ink: #9a2f2a;
  --danger-wash: rgb(154 47 42 / 0.1);
```

- [ ] **Étape 2 : Traduire le rôle shadcn**

Dans `apps/web/src/styles/globals.css`, remplacer le commentaire « `destructive` n'est
volontairement pas traduit… » et le bloc qui le suit par :

```css
  /* `destructive` est désormais traduit (D36). Le rouge est borné au danger :
     il ne porte jamais l'action ni le record, qui restent au lime. */
  --color-destructive: var(--danger);
  --color-destructive-foreground: var(--danger-on);
  --color-destructive-ink: var(--danger-ink);
```

- [ ] **Étape 3 : Mesurer les contrastes au navigateur**

Lancer `pnpm --filter @better-lift/web dev`, ouvrir `http://localhost:3000/exercices`, puis dans
la console :

```js
const s = getComputedStyle(document.documentElement);
[...["--danger", "--danger-on", "--danger-ink", "--ink", "--surface-1", "--canvas"]].forEach((n) =>
  console.log(n, s.getPropertyValue(n).trim()),
);
```

Contrôler, **dans les deux thèmes** (basculer avec le bouton de la navigation) :

- `--danger-on` sur `--danger` : ≥ 4,5:1 — c'est l'aplat du bouton destructeur.
- `--danger-ink` sur `--surface-1` : ≥ 4,5:1 — c'est le message d'erreur sous un champ.

**Si l'un des deux ne passe pas, ajuster la valeur et re-mesurer** — ne pas continuer avec un
contraste sous le seuil. Le thème clair est celui qui casse en premier, comme pour `--accent-ink`.

- [ ] **Étape 4 : Mettre CLAUDE.md à jour**

Dans la section « Interface », remplacer la puce commençant par « **`destructive` n'est pas
traduit, et c'est une décision en attente.** » par :

```markdown
- **Le danger a sa propre couleur, et elle ne fait que ça** (D36). `--danger` porte l'aplat
  destructeur, `--danger-ink` le rouge en texte — qui s'assombrit en thème clair, comme
  `--accent-ink`. **Il ne porte jamais l'action ni le record**, qui restent au lime. C'est parce
  que le lime porte déjà deux rôles qu'il ne peut pas en porter un troisième.
```

Et amender la puce « Une seule couleur » ainsi :

```markdown
- **Une seule couleur pour l'action et le record : le lime sourd `#a8cf45`.** Elle porte les
  deux, donc la distinction se fait **par la forme** : l'action est un **aplat** (fond lime,
  texte sombre), le record est un **contour** (lime en texte sur fond teinté, flèche montante).
  Invariant. Le danger a la sienne, qui ne porte ni l'une ni l'autre.
```

- [ ] **Étape 5 : Vérifier**

```bash
pnpm lint && pnpm build
```

- [ ] **Étape 6 : Commit**

```bash
git add apps/web/src/styles CLAUDE.md
git commit -m "feat(web): le danger a sa propre couleur, bornée au danger"
```

---

### Tâche 5 : La session dans le contexte du routeur

**Fichiers :**
- Créer : `apps/web/src/lib/auth-client.ts`
- Créer : `apps/web/src/routes/_protege.tsx`
- Modifier : `apps/web/src/routes/__root.tsx`, `apps/web/src/main.tsx`
- Renommer : `exercices.tsx`, `routines.tsx`, `seances.tsx`

**Interfaces :**
- Produit :
  - `authClient` — le client Better Auth du web
  - `type Session` — `typeof authClient.$Infer.Session | null`
  - le contexte de routeur `{ auth: { session: Session } }`

- [ ] **Étape 1 : Installer le client**

```bash
pnpm --filter @better-lift/web add better-auth@1.7.5
```

- [ ] **Étape 2 : Écrire le client**

`apps/web/src/lib/auth-client.ts` :

```ts
import { createAuthClient } from "better-auth/react";

/**
 * `credentials: "include"` est requis tant que le client et l'API sont sur deux
 * origines — c'est le cas en développement (3000 contre 3001). En production,
 * le SPA et l'API partagent une origine et il n'y a pas de CORS.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  fetchOptions: { credentials: "include" },
});

export type Session = typeof authClient.$Infer.Session | null;
```

- [ ] **Étape 3 : Typer le contexte de la racine**

Dans `apps/web/src/routes/__root.tsx`, remplacer `createRootRoute` par
`createRootRouteWithContext` :

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Palette } from "@/components/shell/palette";
import type { Session } from "@/lib/auth-client";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

export type ContexteRouteur = {
  auth: { session: Session };
};

// La coquille n'est PAS montée ici : seule la route sait s'il y a un détail à
// ouvrir, et `AppShell` change son jeu de panneaux — donc sa clé de persistance —
// selon qu'il y en a un.
export const Route = createRootRouteWithContext<ContexteRouteur>()({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Palette />
    </QueryClientProvider>
  ),
});
```

- [ ] **Étape 4 : Écrire le porteur de session, hors de `main.tsx`**

`apps/web/src/lib/auth-session.ts` :

```ts
import { authClient, type Session } from "./auth-client";

/**
 * L'objet passé au contexte du routeur. Il est MUTÉ puis le routeur invalidé,
 * ce qui fait relire `beforeLoad` sans recréer le routeur.
 *
 * Il vit ici et non dans `main.tsx` : `main.tsx` importe `routeTree.gen`, qui
 * importe les routes — une route qui importerait `main.tsx` fermerait un cycle,
 * et la fonction pourrait valoir `undefined` au moment de l'appel.
 */
export const auth = { session: null as Session };

export async function chargerSession(): Promise<void> {
  const { data } = await authClient.getSession();
  auth.session = data ?? null;
}
```

- [ ] **Étape 5 : Résoudre la session AVANT le premier rendu**

`apps/web/src/main.tsx` :

```tsx
import "./styles/globals.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { auth, chargerSession } from "./lib/auth-session";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree, context: { auth } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const racine = document.getElementById("root");
if (!racine) throw new Error("Élément #root introuvable");

// La session est résolue AVANT le premier rendu : c'est ce qui évite qu'un
// écran protégé se peigne puis disparaisse — le même clignotement que le script
// synchrone du thème a servi à supprimer au lot 1. Sur une application privée,
// il n'y a rien à montrer avant de savoir qui est là.
await chargerSession();

createRoot(racine).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

> Le `await` au plus haut niveau est permis : `apps/web` est en `"type": "module"` et Vite cible
> des navigateurs modernes.

- [ ] **Étape 6 : Écrire la frontière d'authentification**

`apps/web/src/routes/_protege.tsx` :

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

// Route de mise en page SANS chemin : elle n'ajoute rien à l'URL, elle pose une
// frontière. Son composant vaut `Outlet` par défaut — rien à déclarer.
//
// La garde vit ici et non dans les composants : `beforeLoad` s'exécute AVANT
// tout rendu, donc l'écran protégé n'est jamais peint puis retiré.
export const Route = createFileRoute("/_protege")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.session) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } });
    }
  },
});
```

- [ ] **Étape 7 : Faire passer les trois écrans sous la frontière**

```bash
git mv apps/web/src/routes/exercices.tsx apps/web/src/routes/_protege.exercices.tsx
git mv apps/web/src/routes/routines.tsx apps/web/src/routes/_protege.routines.tsx
git mv apps/web/src/routes/seances.tsx apps/web/src/routes/_protege.seances.tsx
```

Puis, dans chacun des trois fichiers, changer **uniquement** l'identifiant de route :

```tsx
// exercices
export const Route = createFileRoute("/_protege/exercices")({ /* … inchangé … */ });
// routines
export const Route = createFileRoute("/_protege/routines")({ /* … inchangé … */ });
// seances
export const Route = createFileRoute("/_protege/seances")({ /* … inchangé … */ });
```

> Les URL restent `/exercices`, `/routines`, `/seances` : le segment `_protege` est sans chemin.
> Les liens de `nav-lateral.tsx` n'ont donc **pas** à changer.

- [ ] **Étape 8 : Régénérer l'arbre de routes et typer**

```bash
pnpm --filter @better-lift/web build
pnpm typecheck
```

- [ ] **Étape 9 : Vérifier au navigateur**

Déconnecté, ouvrir `http://localhost:3000/exercices`.

Attendu : redirection immédiate vers `/connexion?redirect=%2Fexercices`, **sans que la liste
d'exercices n'apparaisse un instant**. Recharger plusieurs fois : aucun clignotement.

- [ ] **Étape 10 : Commit**

```bash
git add apps/web
git commit -m "feat(web): la session vit dans le contexte du routeur, la garde avant tout rendu"
```

---

### Tâche 6 : L'écran de connexion

**Fichiers :**
- Créer : `apps/web/src/routes/connexion.tsx`
- Créer : `apps/web/src/features/auth/formulaire-connexion.tsx`

**Interfaces :**
- Consomme : `authClient`, `chargerSession`, `champEtat`, `etatForceRendu`
- Produit : rien que les suivants consomment

> Trois refus doivent se lire différemment, parce qu'ils appellent trois gestes différents.
> Les confondre est le défaut classique : on laisse quelqu'un retaper dix fois un mot de passe
> correct pour une adresse qui ne sera jamais acceptée.

- [ ] **Étape 1 : Écrire le formulaire**

`apps/web/src/features/auth/formulaire-connexion.tsx` :

```tsx
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Refus =
  | { genre: "identifiants" }
  | { genre: "listeBlanche" }
  | { genre: "reseau" }
  | null;

const MESSAGES: Record<Exclude<Refus, null>["genre"], string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  listeBlanche: "Cette adresse n'est pas autorisée à créer un compte. Inutile de réessayer.",
  reseau: "L'API est injoignable. Ce n'est pas toi — réessaie dans un instant.",
};

export function FormulaireConnexion({ onSucces }: { onSucces: () => void }) {
  const [mode, setMode] = useState<"connexion" | "creation">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [refus, setRefus] = useState<Refus>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setRefus(null);

    try {
      const { error } =
        mode === "connexion"
          ? await authClient.signIn.email({ email, password: motDePasse })
          : await authClient.signUp.email({ email, password: motDePasse, name: email });

      if (!error) {
        onSucces();
        return;
      }

      // 403 est le code que le garde de liste blanche renvoie : c'est ce qui
      // distingue « cette adresse n'aura jamais de compte » de « tu t'es trompé ».
      setRefus(error.status === 403 ? { genre: "listeBlanche" } : { genre: "identifiants" });
    } catch {
      setRefus({ genre: "reseau" });
    } finally {
      setEnCours(false);
    }
  }

  const invalide = refus !== null;

  return (
    <form onSubmit={soumettre} className="flex w-full max-w-sm flex-col gap-3">
      <label htmlFor="email" className="text-sm text-(--ink-muted)">
        Adresse e-mail
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={invalide}
        className="rounded-md border border-(--line) bg-(--surface-1) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) aria-[invalid=true]:border-(--danger)"
      />

      <label htmlFor="mdp" className="text-sm text-(--ink-muted)">
        Mot de passe
      </label>
      <input
        id="mdp"
        type="password"
        autoComplete={mode === "connexion" ? "current-password" : "new-password"}
        required
        minLength={8}
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        aria-invalid={invalide}
        className="rounded-md border border-(--line) bg-(--surface-1) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) aria-[invalid=true]:border-(--danger)"
      />

      {refus ? (
        <p role="alert" className="text-sm text-(--danger-ink)">
          {MESSAGES[refus.genre]}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enCours}
        className="mt-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
      >
        {enCours ? "…" : mode === "connexion" ? "Se connecter" : "Créer le compte"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "connexion" ? "creation" : "connexion");
          setRefus(null);
        }}
        className="text-sm text-(--ink-subtle) underline-offset-2 hover:underline"
      >
        {mode === "connexion" ? "Créer un compte" : "J'ai déjà un compte"}
      </button>
    </form>
  );
}
```

- [ ] **Étape 2 : Écrire la route**

`apps/web/src/routes/connexion.tsx` :

```tsx
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { FormulaireConnexion } from "@/features/auth/formulaire-connexion";
import { chargerSession } from "@/lib/auth-session";

const recherche = z.object({ redirect: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/connexion")({
  validateSearch: recherche,
  component: PageConnexion,
});

function PageConnexion() {
  const { redirect, etat } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const force = etatForceRendu(etat, "L'API est injoignable.", () =>
    navigate({ to: "/connexion", search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <main className="grid h-screen place-items-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-5.5 rounded-md"
            style={{ background: "var(--accent)" }}
          />
          <span className="text-sm font-semibold tracking-tight">better-lift</span>
        </div>

        {force ?? (
          <FormulaireConnexion
            onSucces={async () => {
              // Relire la session PUIS invalider : sans l'invalidation, le
              // `beforeLoad` de `_protege` relirait l'ancien contexte et
              // renverrait aussitôt vers /connexion.
              await chargerSession();
              await router.invalidate();
              await navigate({ to: redirect ?? "/seances" });
            }}
          />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Étape 3 : Ajouter la déconnexion à la navigation**

Sans elle, on peut entrer dans l'application mais jamais en sortir — et le seul moyen de changer
de compte serait de vider les cookies à la main.

Dans `apps/web/src/components/shell/nav-lateral.tsx`, ajouter les imports :

```tsx
import { useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { chargerSession } from "@/lib/auth-session";
```

Dans le corps de `NavLaterale`, à côté de l'état du thème :

```tsx
  const navigate = useNavigate();
  const router = useRouter();

  async function seDeconnecter() {
    await authClient.signOut();
    // Relire puis invalider, dans cet ordre : une déconnexion qui ne rafraîchit
    // pas le contexte laisse l'ancienne session à l'écran, et la garde continue
    // de laisser passer.
    await chargerSession();
    await router.invalidate();
    await navigate({ to: "/connexion" });
  }
```

Et, **juste après** le bouton de bascule de thème — en retirant `mt-auto` de ce dernier pour le
poser sur celui-ci, afin que les deux restent collés en bas :

```tsx
      <button
        type="button"
        onClick={seDeconnecter}
        className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-(--ink-muted) hover:bg-(--surface-3) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
      >
        Se déconnecter
      </button>
```

- [ ] **Étape 4 : Éprouver les trois refus, à la main**

Serveur de dev lancé, sur `/connexion` :

1. **Identifiants faux** — une adresse de `SIGNUP_ALLOWLIST` avec un mauvais mot de passe, en
   mode « Se connecter ». Attendu : « Adresse ou mot de passe incorrect. »
2. **Hors liste blanche** — `inconnu@example.com`, en mode « Créer un compte ». Attendu :
   « Cette adresse n'est pas autorisée… Inutile de réessayer. » **C'est le contrôle qui compte :
   si ce message est celui du cas 1, la distinction est perdue.**
3. **API injoignable** — arrêter l'API, réessayer. Attendu : « L'API est injoignable. »

Vérifier aussi que les champs se cerclent bien de `--danger` dans les trois cas, **dans les deux
thèmes**.

- [ ] **Étape 5 : Éprouver le chemin nominal, le retour et la sortie**

Déconnecté, ouvrir `/exercices` : redirection vers `/connexion?redirect=%2Fexercices`. Se
connecter. Attendu : retour **sur `/exercices`**, pas sur l'accueil.

Puis cliquer « Se déconnecter » : retour à `/connexion`. Reculer dans l'historique du navigateur.
**Attendu : on ne revient PAS dans l'application** — la garde reprend la main. Si l'écran protégé
réapparaît, c'est que `router.invalidate()` n'a pas été appelé après la déconnexion.

- [ ] **Étape 6 : Commit**

```bash
git add apps/web/src
git commit -m "feat(web): écran de connexion et ses trois refus distincts"
```

---

### Tâche 7 : Le mobile et la persistance du jeton

**Fichiers :**
- Créer : `apps/mobile/lib/auth-client.ts`, `apps/mobile/app/connexion.tsx`
- Modifier : `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`
- Modifier : `apps/api/src/auth.ts`

**Interfaces :**
- Consomme : `auth` côté API
- Produit : `authClient` mobile, avec stockage `SecureStore`

> **Le contrôle qui fait le lot :** se connecter, **tuer l'application**, la rouvrir — la session
> tient. C'est l'un des deux points jamais éprouvés dans l'ancien projet, et il ne se vérifie pas
> autrement qu'en le faisant.

- [ ] **Étape 1 : Installer**

```bash
pnpm --filter @better-lift/mobile add better-auth@1.7.5 @better-auth/expo@1.7.5
cd apps/mobile && npx expo install expo-secure-store && cd ../..
```

> `expo-secure-store` s'installe par `npx expo install`, qui choisit la version juste pour le SDK
> 57. Ne pas transposer la règle de MMKV (« aucun plugin de configuration ») sans avoir lu la
> documentation du paquet : c'est une règle propre à MMKV.

- [ ] **Étape 2 : Ajouter le plugin serveur**

Dans `apps/api/src/auth.ts`, ajouter l'import et le tableau `plugins` :

```ts
import { expo } from "@better-auth/expo";
```

```ts
  plugins: [expo()],
```

Et compléter `trustedOrigins` — les origines `exp://` **uniquement en développement** :

```ts
  trustedOrigins: [
    "http://localhost:3000",
    "better-lift://",
    ...(process.env.NODE_ENV !== "production" ? ["exp://", "exp://**"] : []),
  ],
```

```bash
pnpm --filter @better-lift/api add @better-auth/expo@1.7.5
```

- [ ] **Étape 3 : Écrire le client mobile**

`apps/mobile/lib/auth-client.ts` :

```ts
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

// `scheme` doit valoir EXACTEMENT le `scheme` de app.json — « better-lift ».
// C'est aussi lui que `trustedOrigins` doit porter côté API, en « better-lift:// ».
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001",
  plugins: [
    expoClient({
      scheme: "better-lift",
      storagePrefix: "better-lift",
      storage: SecureStore,
    }),
  ],
});
```

- [ ] **Étape 4 : Écrire l'écran de connexion**

`apps/mobile/app/connexion.tsx` — volontairement brut, le dessin mobile est le lot 6 :

```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { authClient } from "../lib/auth-client";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function seConnecter() {
    setEnCours(true);
    setErreur(null);
    try {
      const { error } = await authClient.signIn.email({ email, password: motDePasse });
      if (error) {
        setErreur("Adresse ou mot de passe incorrect.");
        return;
      }
      router.replace("/");
    } catch {
      setErreur("API injoignable.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>better-lift</Text>
      <TextInput
        style={styles.champ}
        placeholder="Adresse e-mail"
        placeholderTextColor="#6a717a"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.champ}
        placeholder="Mot de passe"
        placeholderTextColor="#6a717a"
        secureTextEntry
        value={motDePasse}
        onChangeText={setMotDePasse}
      />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
      <Pressable style={styles.bouton} onPress={seConnecter} disabled={enCours}>
        <Text style={styles.boutonTexte}>{enCours ? "…" : "Se connecter"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#08090a" },
  titre: { color: "#f2f3f5", fontSize: 24, fontWeight: "600", marginBottom: 12 },
  champ: {
    borderWidth: 1,
    borderColor: "#24272b",
    borderRadius: 8,
    color: "#f2f3f5",
    fontSize: 16,
    padding: 14,
  },
  erreur: { color: "#e98b85", fontSize: 14 },
  bouton: { backgroundColor: "#a8cf45", borderRadius: 8, padding: 16, alignItems: "center" },
  boutonTexte: { color: "#0b0f04", fontSize: 16, fontWeight: "700" },
});
```

- [ ] **Étape 5 : Mettre l'accueil derrière la session**

Remplacer `apps/mobile/app/index.tsx` par :

```tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { authClient } from "../lib/auth-client";

export default function Accueil() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/connexion");
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <View style={styles.ecran}>
        <Text style={styles.texte}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>better-lift</Text>
      <Text style={styles.texte}>Connecté : {session?.user.email}</Text>
      <Pressable
        style={styles.bouton}
        onPress={async () => {
          await authClient.signOut();
          router.replace("/connexion");
        }}
      >
        <Text style={styles.boutonTexte}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#08090a" },
  titre: { color: "#f2f3f5", fontSize: 24, fontWeight: "600" },
  texte: { color: "#b6bcc4", fontSize: 15 },
  bouton: { borderWidth: 1, borderColor: "#24272b", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  boutonTexte: { color: "#b6bcc4", fontSize: 15 },
});
```

- [ ] **Étape 6 : LE contrôle du lot — la persistance**

Émulateur lancé, API lancée :

```bash
pnpm --filter @better-lift/mobile dev
```

1. Se connecter avec une adresse de `SIGNUP_ALLOWLIST`. Attendu : l'accueil affiche l'adresse.
2. **Fermer complètement l'application** (glisser depuis la liste des applications récentes de
   l'émulateur — pas seulement la mettre en arrière-plan).
3. La rouvrir.

**Attendu : l'accueil s'affiche directement, sans redemander le mot de passe.** Si l'écran de
connexion réapparaît, le jeton n'est pas persisté — vérifier que `storage: SecureStore` est bien
passé à `expoClient`, et que `storagePrefix` n'a pas changé entre deux lancements.

4. Se déconnecter, fermer, rouvrir. Attendu : l'écran de connexion.

- [ ] **Étape 7 : Commit**

```bash
git add apps/mobile apps/api pnpm-lock.yaml
git commit -m "feat(mobile): connexion et session qui survit à la fermeture"
```

---

### Tâche 8 : CI, vérification complète et PR

**Fichiers :**
- Modifier : `.github/workflows/ci.yml`

- [ ] **Étape 1 : Donner à la CI les variables que Better Auth exige au démarrage**

L'instance lit `SIGNUP_ALLOWLIST` et refuse de démarrer si elle est vide ; `BETTER_AUTH_SECRET`
est exigé de même. La CI n'a ni `.env` ni base — il lui faut des valeurs factices, jamais
contactées, sur **les étapes qui chargent `apps/api/src/auth.ts`** : `pnpm test`, `pnpm build` et
`pnpm knip`.

Ajouter à chacune de ces trois étapes, en complétant les blocs `env:` existants :

```yaml
        env:
          SIGNUP_ALLOWLIST: ci@example.com
          BETTER_AUTH_SECRET: secret-factice-de-ci-jamais-utilise-ailleurs
          BETTER_AUTH_URL: http://localhost:3001
```

> **Ne pas toucher au nom du job** — `Qualité · typecheck · test · build` est un check requis, et
> le renommer rend toute PR immergeable.

- [ ] **Étape 2 : Vérification complète**

```bash
pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm knip
```

Les cinq doivent passer. En cas de `TS2724 : has no exported member` visant un symbole présent
dans la source, c'est un `.tsbuildinfo` périmé :

```bash
pnpm --filter @better-lift/shared exec tsc --build --force
```

- [ ] **Étape 3 : Arrêter le serveur de dev**

```bash
# Vérifier qu'aucun Vite ne tourne : il réécrit routeTree.gen.ts et bloque la fusion.
```

Sous Windows : `Get-NetTCPConnection -LocalPort 3000 -State Listen` ne doit rien renvoyer.

- [ ] **Étape 4 : Ouvrir la PR**

```bash
git add -A
git push -u origin feat/lot-3-authentification
gh pr create --fill --base main
gh pr checks --watch
```

---

## Ce que ce plan ne couvre pas

- **GitHub OAuth** (D31) — ajoutable sans rien casser, le garde étant posé sur la création
  d'utilisateur et non sur une route. Demandera une seconde URL de rappel.
- **Réinitialisation de mot de passe** — demande un envoi d'e-mail, que D15 a supprimé du projet.
- **Rôles et permissions** — deux ou trois comptes, tous égaux.
- **Le dessin des écrans mobiles** — lot 6.
- **`packages/api-client`** — extraction prévue au lot 4.
