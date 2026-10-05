# Refonte des pages — lot 1 : fondations — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** poser les données dont les lots suivants ont besoin (note de séance, préférences du
compte) et rendre la feuille basse refermable d'un glissement.

**Architecture :** le contrat (Zod) vit dans `packages/shared` ; Prisma reçoit une colonne
`Seance.note` et une table `Preferences` ; l'API expose `GET` / `PUT /preferences` derrière
`exigerSession`, avec un dépôt injecté (les routes se testent sans base) ; la note de séance est
écrite par `POST /seances` et relue par `GET /seances/:id`. Côté mobile, `Feuille` gagne un geste
de fermeture (`react-native-gesture-handler` + `react-native-reanimated`, déjà installés).

**Tech Stack :** TypeScript 6.0.3, Zod, Hono + `@hono/zod-validator`, Prisma 7 (PostgreSQL Neon,
branche `dev`, base `betterlift`), Vitest, Expo SDK 57.

**Spec :** [`docs/superpowers/specs/2026-10-05-mobile-refonte-pages-design.md`](../specs/2026-10-05-mobile-refonte-pages-design.md)
(D128, D129, D130 ; « Données » ; « Découpage », lot 1).

## Global Constraints

- L'application est en **français** : identifiants, commentaires, messages, commits.
- `packages/shared` n'importe jamais Prisma, React ni une API de plateforme.
- Toute route de données personnelles passe par `exigerSession` ; l'utilisateur vient de la
  session, jamais de l'URL. La donnée d'autrui est introuvable (404), jamais interdite (403).
- Toute erreur de l'API répond `{ erreur }`.
- Prisma 7 : après `migrate dev`, lancer `pnpm --filter @better-lift/db generate`.
- Commits en Conventional Commits, en français, terminés par
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `main` est protégée : une branche, une PR, squash.
- Knip refuse un export sans usage : n'exporter que ce qu'un autre module importe.

## Préalable

#82 et #83 fusionnées dans `main` (#83 reciblée sur `main` avant la fusion de #82). Puis :

```bash
git switch main && git pull --ff-only
git switch -c feat/refonte-fondations
```

## Fichiers

| Fichier | Rôle |
|---|---|
| `packages/shared/src/preferences.ts` (nouveau) | Schéma Zod `preferences`, type `Preferences`, `PREFERENCES_DEFAUT` |
| `packages/shared/src/preferences.test.ts` (nouveau) | Bornes du schéma |
| `packages/shared/src/seance.ts` | `seanceSaisie` accepte `note` |
| `packages/shared/src/seance.test.ts` | Tests de `note` |
| `packages/shared/src/records.ts` | `SeanceDetail.note` |
| `packages/shared/src/index.ts` | Exporte `preferences` |
| `packages/db/prisma/schema.prisma` | `Seance.note`, modèle `Preferences` |
| `packages/db/prisma/migrations/<horodatage>_note_preferences/` (généré) | La migration |
| `apps/api/src/services/seances.ts` | Écrit et relit `note` |
| `apps/api/src/services/seances.test.ts` | Test de la note relue |
| `apps/api/src/services/preferences.ts` (nouveau) | Dépôt Prisma des préférences |
| `apps/api/src/routes/preferences.ts` (nouveau) | `GET` / `PUT /preferences` |
| `apps/api/src/routes/preferences.test.ts` (nouveau) | Tests des routes |
| `apps/api/src/app.ts` | Monte `/preferences` |
| `apps/mobile/components/ui/feuille.tsx` | Fermeture par glissement |
| `.claude/rules/mobile.md` | Une ligne sur la feuille qui glisse |

---

### Task 1 : le contrat dans `shared` (préférences, note de séance)

**Files :**
- Create : `packages/shared/src/preferences.ts`, `packages/shared/src/preferences.test.ts`
- Modify : `packages/shared/src/seance.ts:325-334`, `packages/shared/src/seance.test.ts`,
  `packages/shared/src/records.ts:134-137`, `packages/shared/src/index.ts`

**Interfaces :**
- Produces :
  - `preferences: z.ZodObject` — `{ objectifHebdo: number | null; reposDefautSec: number | null }`
  - `type Preferences = z.infer<typeof preferences>`
  - `PREFERENCES_DEFAUT: Preferences` = `{ objectifHebdo: null, reposDefautSec: null }`
  - `SeanceSaisie.note?: string | null` (au plus 1000 caractères, rogné)
  - `SeanceDetail.note: string | null`

- [ ] **Step 1 : écrire les tests qui échouent**

`packages/shared/src/preferences.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { PREFERENCES_DEFAUT, preferences } from "./preferences.js";

describe("preferences (D129)", () => {
  it("accepte des préférences réglées, et celles d'un compte qui n'a rien réglé", () => {
    const p = { objectifHebdo: 3, reposDefautSec: 90 };
    expect(preferences.parse(p)).toEqual(p);
    expect(preferences.parse(PREFERENCES_DEFAUT)).toEqual(PREFERENCES_DEFAUT);
  });

  it("borne l'objectif de 1 à 7 séances entières par semaine", () => {
    for (const objectifHebdo of [0, 8, 2.5]) {
      expect(() => preferences.parse({ objectifHebdo, reposDefautSec: null })).toThrow();
    }
  });

  it("borne le repos par défaut de 0 à 3600 secondes, comme celui d'une routine", () => {
    for (const reposDefautSec of [-1, 3601, 1.5]) {
      expect(() => preferences.parse({ objectifHebdo: null, reposDefautSec })).toThrow();
    }
  });

  it("exige les deux champs : un PUT remplace tout", () => {
    expect(() => preferences.parse({ objectifHebdo: 3 })).toThrow();
  });
});
```

Dans `packages/shared/src/seance.test.ts`, à la fin du `describe("versEnvoi et seanceSaisie", …)`
(après le test « refuse des valeurs hors bornes ») :

```ts
  it("accepte une note de séance (D130), rognée, ou son absence", () => {
    expect(seanceSaisie.parse({ ...envoi(), note: "  Bonne séance.  " }).note).toBe("Bonne séance.");
    expect(seanceSaisie.parse({ ...envoi(), note: null }).note).toBeNull();
    expect(seanceSaisie.parse(envoi())).not.toHaveProperty("note");
  });

  it("refuse une note de plus de 1000 caractères", () => {
    expect(() => seanceSaisie.parse({ ...envoi(), note: "x".repeat(1001) })).toThrow();
  });
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `pnpm --filter @better-lift/shared exec vitest run src/preferences.test.ts src/seance.test.ts`
Expected : FAIL — `Cannot find module './preferences.js'`, et pour la note : `expected undefined to be 'Bonne séance.'` (le `looseObject` laisse passer la note non rognée).

- [ ] **Step 3 : écrire le code**

`packages/shared/src/preferences.ts` :

```ts
import { z } from "zod";

/**
 * Les préférences du compte (D129) : ce qui suit l'utilisateur d'un appareil à
 * l'autre. Le thème et les vibrations, réglages d'appareil, restent sur le
 * téléphone. `null` : pas d'objectif, ou le repos par défaut de l'application.
 */
export const preferences = z.object({
  /** Les séances visées par semaine (D128). */
  objectifHebdo: z.number().int().min(1).max(7).nullable(),
  /** Le repos des exercices qui n'en ont pas, en secondes ; mêmes bornes qu'une routine. */
  reposDefautSec: z.number().int().min(0).max(3600).nullable(),
});

export type Preferences = z.infer<typeof preferences>;

/** Un compte qui n'a encore rien réglé. */
export const PREFERENCES_DEFAUT: Preferences = { objectifHebdo: null, reposDefautSec: null };
```

Dans `packages/shared/src/seance.ts`, `seanceSaisie` gagne `note` (après `fin`) :

```ts
    fin: z.iso.datetime(),
    /** La note de la séance, écrite à la fin (D130). Absente des anciennes versions du mobile. */
    note: z.string().trim().max(1000).nullable().optional(),
    exercices: z.array(exerciceEnvoye).max(100),
```

Dans `packages/shared/src/records.ts`, `SeanceDetail` :

```ts
export type SeanceDetail = SeanceResume & {
  /** La note de la séance (D130), `null` sans note. */
  note: string | null;
  /** `note` : la note libre de l'exercice (D90), `null` sans note. */
  exercices: { slug: string; nom: string; note: string | null; series: SerieLue[] }[];
};
```

Dans `packages/shared/src/index.ts`, ajouter à sa place alphabétique (avant l'export de
`./recherche.js`) :

```ts
export { PREFERENCES_DEFAUT, type Preferences, preferences } from "./preferences.js";
```

- [ ] **Step 4 : relancer les tests**

Run : `pnpm --filter @better-lift/shared exec vitest run`
Expected : PASS, tous les tests du paquet.

- [ ] **Step 5 : commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): préférences du compte et note de séance (D129, D130)"
```

---

### Task 2 : la migration (`Seance.note`, `Preferences`)

**Files :**
- Modify : `packages/db/prisma/schema.prisma` (modèles `User` et `Seance`, nouveau modèle)
- Create (généré) : `packages/db/prisma/migrations/<horodatage>_note_preferences/migration.sql`

**Interfaces :**
- Produces : `prisma.seance` avec `note: string | null` ; `prisma.preferences` (`userId` clé,
  `objectifHebdo: number | null`, `reposDefautSec: number | null`, `updatedAt`).

- [ ] **Step 1 : modifier le schéma**

Dans `model User`, après `seances   Seance[]` :

```prisma
  preferences   Preferences?
```

Dans `model Seance`, après `fin       DateTime` :

```prisma
  // D130 : la note libre de la séance, écrite à la fin.
  note      String?  @db.VarChar(1000)
```

À la fin de la section des séances, le nouveau modèle :

```prisma
// --- Préférences (D129) -------------------------------------------------------
// Ce qui suit le compte d'un appareil à l'autre. Une ligne par utilisateur,
// créée au premier enregistrement : sans ligne, les valeurs par défaut.

model Preferences {
  userId         String   @id
  // Séances visées par semaine, de 1 à 7 (D128).
  objectifHebdo  Int?
  // Repos des exercices sans repos propre, en secondes.
  reposDefautSec Int?
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2 : générer et appliquer la migration sur la branche `dev`**

Run : `pnpm --filter @better-lift/db exec prisma migrate dev --name note_preferences`
Expected : `Your database is now in sync with your schema.` et un dossier
`packages/db/prisma/migrations/<horodatage>_note_preferences/`.

Vérifier que `migration.sql` contient exactement : `ALTER TABLE "Seance" ADD COLUMN "note"
VARCHAR(1000);`, `CREATE TABLE "Preferences"` (quatre colonnes, clé `userId`) et la clé étrangère
vers la table des utilisateurs avec `ON DELETE CASCADE`. Rien d'autre : une ligne inattendue signale une dérive
entre la base `dev` et le schéma — s'arrêter et la comprendre.

- [ ] **Step 3 : régénérer le client**

Run : `pnpm --filter @better-lift/db generate && pnpm --filter @better-lift/db exec tsc --noEmit`
Expected : pas d'erreur.

- [ ] **Step 4 : commit**

```bash
git add packages/db/prisma
git commit -m "feat(db): note de séance et préférences du compte (D129, D130)"
```

---

### Task 3 : l'API écrit et relit la note de séance

**Files :**
- Modify : `apps/api/src/services/seances.ts` (type `LigneSeance` ~l.148, `enregistrer` ~l.104,
  `LECTURE_SEANCE` ~l.263, `versDetail` ~l.208)
- Test : `apps/api/src/services/seances.test.ts`

**Interfaces :**
- Consumes : `SeanceSaisie.note`, `SeanceDetail.note` (Task 1) ; `Seance.note` (Task 2).
- Produces : `LigneSeance.note: string | null` ; `GET /seances/:id` rend `note`.

- [ ] **Step 1 : écrire le test qui échoue**

Dans `apps/api/src/services/seances.test.ts`, la fixture `ligne` gagne `note: null` après `fin`.
Puis, dans `describe("versDetail", …)` :

```ts
  it("rend la note de la séance (D130), null sans note", () => {
    expect(versDetail({ ...ligne, note: "Bonne séance." }, new Map()).note).toBe("Bonne séance.");
    expect(versDetail(ligne, new Map()).note).toBeNull();
  });
```

- [ ] **Step 2 : lancer le test, constater l'échec**

Run : `pnpm --filter @better-lift/api exec vitest run src/services/seances.test.ts`
Expected : FAIL — erreur de type sur `note` dans la fixture, ou `expected undefined to be 'Bonne séance.'`.

- [ ] **Step 3 : écrire le code**

`LigneSeance` gagne, après `fin: Date;` :

```ts
  /** La note de la séance (D130). */
  note: string | null;
```

`LECTURE_SEANCE` gagne `note: true,` après `fin: true,`.

Dans `enregistrer`, `prisma.seance.create({ data: { … } })` gagne, après `fin: new Date(saisie.fin),` :

```ts
          // Une note vide n'est pas une note.
          note: saisie.note || null,
```

Dans `versDetail`, l'objet rendu gagne `note: l.note,` juste après `nbRecords,`.

`services/stats.ts` convertit déjà ses lignes par `l as LigneSeance` sans lire la note : rien à y
changer.

- [ ] **Step 4 : relancer les tests de l'API et le typage**

Run : `pnpm --filter @better-lift/api exec vitest run && pnpm --filter @better-lift/api exec tsc --noEmit`
Expected : PASS, pas d'erreur de type.

- [ ] **Step 5 : commit**

```bash
git add apps/api/src/services
git commit -m "feat(api): la séance enregistre et rend sa note (D130)"
```

---

### Task 4 : `GET` / `PUT /preferences`

**Files :**
- Create : `apps/api/src/services/preferences.ts`, `apps/api/src/routes/preferences.ts`,
  `apps/api/src/routes/preferences.test.ts`
- Modify : `apps/api/src/app.ts`

**Interfaces :**
- Consumes : `preferences`, `Preferences`, `PREFERENCES_DEFAUT` (Task 1) ; `prisma.preferences`
  (Task 2) ; `exigerSession`, `LireSession` (`apps/api/src/middlewares/session.ts`).
- Produces :
  - `type DepotPreferences = { lire(userId: string): Promise<Preferences>; ecrire(userId: string, p: Preferences): Promise<Preferences> }`
  - `depotPreferences: DepotPreferences`
  - `routesPreferences(depot: DepotPreferences, lireSession: LireSession): Hono`
  - Routes : `GET /preferences` → `200 Preferences` ; `PUT /preferences` (corps `Preferences`)
    → `200 Preferences` ; sans session → `401`.

- [ ] **Step 1 : écrire les tests qui échouent**

`apps/api/src/routes/preferences.test.ts` :

```ts
import { PREFERENCES_DEFAUT, type Preferences } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotPreferences } from "../services/preferences.js";
import { routesPreferences } from "./preferences.js";

const lireSession: LireSession = async (h) => {
  const id = h.get("x-test-user");
  return id ? { user: { id } } : null;
};

/** Un dépôt en mémoire : on vérifie que chacun ne lit et n'écrit que les siennes. */
function monter() {
  const base = new Map<string, Preferences>();
  const depot: DepotPreferences = {
    async lire(userId) {
      return base.get(userId) ?? PREFERENCES_DEFAUT;
    },
    async ecrire(userId, p) {
      base.set(userId, p);
      return p;
    },
  };
  const app = new Hono().route("/preferences", routesPreferences(depot, lireSession));
  const appel = (methode: "GET" | "PUT", user: string | null, corps?: unknown) =>
    app.request("/preferences", {
      method: methode,
      headers: {
        ...(user ? { "x-test-user": user } : {}),
        ...(corps === undefined ? {} : { "content-type": "application/json" }),
      },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
  return { appel };
}

describe("/preferences (D129)", () => {
  it("exige une session", async () => {
    const { appel } = monter();
    expect((await appel("GET", null)).status).toBe(401);
    expect((await appel("PUT", null, PREFERENCES_DEFAUT)).status).toBe(401);
  });

  it("rend les valeurs par défaut à qui n'a rien réglé", async () => {
    const res = await monter().appel("GET", "alice");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PREFERENCES_DEFAUT);
  });

  it("enregistre celles de l'utilisateur de la session, et seulement les siennes", async () => {
    const { appel } = monter();
    const p = { objectifHebdo: 3, reposDefautSec: 120 };
    const ecrit = await appel("PUT", "alice", p);
    expect(ecrit.status).toBe(200);
    expect(await ecrit.json()).toEqual(p);
    expect(await (await appel("GET", "alice")).json()).toEqual(p);
    expect(await (await appel("GET", "bob")).json()).toEqual(PREFERENCES_DEFAUT);
  });

  it("refuse des préférences hors bornes ou incomplètes", async () => {
    const { appel } = monter();
    expect((await appel("PUT", "alice", { objectifHebdo: 9, reposDefautSec: null })).status).toBe(400);
    expect((await appel("PUT", "alice", { objectifHebdo: 3 })).status).toBe(400);
  });
});
```

- [ ] **Step 2 : lancer les tests, constater l'échec**

Run : `pnpm --filter @better-lift/api exec vitest run src/routes/preferences.test.ts`
Expected : FAIL — `Cannot find module './preferences.js'`.

- [ ] **Step 3 : écrire le dépôt**

`apps/api/src/services/preferences.ts` :

```ts
import { prisma } from "@better-lift/db";
import { PREFERENCES_DEFAUT, type Preferences } from "@better-lift/shared";

/** Les préférences du compte (D129), côté métier. Ce module ne connaît pas Hono. */
export type DepotPreferences = {
  /** Celles de l'utilisateur, ou les valeurs par défaut s'il n'a encore rien réglé. */
  lire(userId: string): Promise<Preferences>;
  /** Les remplace en entier, et rend ce qui est enregistré. */
  ecrire(userId: string, p: Preferences): Promise<Preferences>;
};

const CHAMPS = { objectifHebdo: true, reposDefautSec: true } as const;

export const depotPreferences: DepotPreferences = {
  async lire(userId) {
    const p = await prisma.preferences.findUnique({ where: { userId }, select: CHAMPS });
    return p ?? PREFERENCES_DEFAUT;
  },
  // La ligne naît au premier enregistrement : `upsert`, pas de création à l'inscription.
  async ecrire(userId, p) {
    return prisma.preferences.upsert({
      where: { userId },
      create: { userId, ...p },
      update: p,
      select: CHAMPS,
    });
  },
};
```

- [ ] **Step 4 : écrire les routes et les monter**

`apps/api/src/routes/preferences.ts` :

```ts
import { preferences } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotPreferences } from "../services/preferences.js";

/**
 * Les préférences du compte (D129), derrière une session. L'utilisateur vient
 * de la session, jamais de l'URL : chacun ne lit et n'écrit que les siennes.
 * `PUT` remplace le tout — le client envoie toujours les deux champs.
 */
export function routesPreferences(depot: DepotPreferences, lireSession: LireSession) {
  return new Hono()
    .use(exigerSession(lireSession))
    .get("/", async (c) => c.json(await depot.lire(c.get("userId"))))
    .put("/", zValidator("json", preferences), async (c) =>
      c.json(await depot.ecrire(c.get("userId"), c.req.valid("json"))),
    );
}
```

Dans `apps/api/src/app.ts` : importer `routesPreferences` (`./routes/preferences.js`) et
`depotPreferences` (`./services/preferences.js`) à leur place alphabétique, puis ajouter à la
chaîne `routes`, après `/stats` :

```ts
  .route("/stats", routesStats(depotStats, lireSession))
  .route("/preferences", routesPreferences(depotPreferences, lireSession));
```

- [ ] **Step 5 : relancer les tests et le typage**

Run : `pnpm --filter @better-lift/api exec vitest run && pnpm --filter @better-lift/api exec tsc --noEmit`
Expected : PASS (dont les 4 nouveaux tests), pas d'erreur de type.

- [ ] **Step 6 : vérifier contre la vraie base**

Démarrer l'API (`pnpm --filter @better-lift/api dev`), se connecter avec le compte
`controle@better-lift.local` (voir CLAUDE.md, « Vérifier un écran protégé ») et appeler
`GET /preferences` puis `PUT /preferences` avec `{"objectifHebdo":3,"reposDefautSec":120}`, puis
`GET` de nouveau. Expected : `{"objectifHebdo":null,"reposDefautSec":null}`, puis deux fois les
valeurs envoyées. Remettre ensuite `{"objectifHebdo":null,"reposDefautSec":null}` pour laisser
la démo intacte.

- [ ] **Step 7 : commit**

```bash
git add apps/api/src
git commit -m "feat(api): GET et PUT /preferences (D129)"
```

---

### Task 5 : la feuille basse se ferme en glissant

**Files :**
- Modify : `apps/mobile/components/ui/feuille.tsx`, `.claude/rules/mobile.md`

**Interfaces :**
- Consumes : rien de neuf.
- Produces : `Feuille` garde ses props (`visible`, `titre`, `message`, `options`, `onFermer`) ;
  un glissement vers le bas de plus de 80 px, ou plus vif que 800 px/s, appelle `onFermer`. Toutes
  les feuilles de l'app (menus, `useConfirmer`, `useFeuille`) en profitent.

Pas de test automatique : le mobile n'a pas de suite de tests. La vérification se fait sur
l'émulateur (Step 3).

- [ ] **Step 1 : écrire le geste**

Dans `apps/mobile/components/ui/feuille.tsx`, ajouter les imports :

```ts
import { useEffect } from "react";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
```

et, au-dessus de `export function Feuille` :

```ts
/** Tirée de 80 px vers le bas, ou lancée plus vite que 800 px/s, la feuille se ferme. */
const SEUIL_FERMETURE = 80;
const VITESSE_FERMETURE = 800;
```

Dans le composant, après `const { bottom } = useSafeAreaInsets();` :

```ts
  // La feuille suit le doigt vers le bas, jamais vers le haut. Relâchée trop
  // tôt, elle revient ; au-delà du seuil, elle se ferme — le geste attendu de
  // toute feuille basse (Material, iOS), en plus du voile et du retour Android.
  const decalage = useSharedValue(0);
  useEffect(() => {
    if (visible) decalage.value = 0;
  }, [visible, decalage]);
  const glisser = Gesture.Pan()
    .runOnJS(true)
    // 10 px avant de s'activer : un appui sur une option reste un appui.
    .activeOffsetY(10)
    .onUpdate((e) => {
      decalage.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > SEUIL_FERMETURE || e.velocityY > VITESSE_FERMETURE) onFermer();
      else decalage.value = withTiming(0, { duration: 150 });
    });
  const suivre = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.value }] }));
```

Le rendu : sous Android, le contenu d'un `Modal` vit hors de la racine des gestes de
`app/_layout.tsx` — il lui faut sa propre `GestureHandlerRootView`. Remplacer le contenu du
`<Modal …>` par :

```tsx
      <GestureHandlerRootView style={styles.racine}>
        <Pressable style={styles.voile} onPress={onFermer} accessibilityLabel="Fermer" />
        <GestureDetector gesture={glisser}>
          <Animated.View style={[styles.feuille, { paddingBottom: bottom + espace.s }, suivre]}>
            {/* … le contenu actuel de la feuille, inchangé : poignée, question ou titre, options … */}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
```

(le contenu entre la poignée et la dernière option est celui qui se trouve aujourd'hui dans le
`<View style={[styles.feuille, …]}>` : il est déplacé tel quel.)

Dans `useStyles`, ajouter `racine: { flex: 1 },` en tête.

- [ ] **Step 2 : typage et lint**

Run : `pnpm --filter @better-lift/mobile exec tsc --noEmit && pnpm lint`
Expected : pas d'erreur.

- [ ] **Step 3 : vérifier sur l'émulateur**

Metro lancé (`pnpm --filter @better-lift/mobile start`), `adb reverse tcp:8081 tcp:8081`, Expo Go
ouvert sur `exp://127.0.0.1:8081`, compte de contrôle connecté. Dans Profil, appuyer sur
« Se déconnecter » : la feuille de confirmation monte.

1. Glissement court et lent : `adb shell input swipe 540 1700 540 1740 600` → la feuille revient
   en place (capture).
2. Glissement long : `adb shell input swipe 540 1700 540 2300 250` → la feuille se ferme, la
   session est toujours ouverte (capture).
3. Rouvrir la feuille et appuyer sur « Annuler » → elle se ferme : un appui reste un appui.
4. Refaire 2 en thème clair (`adb shell cmd uimode night no`, puis `night yes` pour revenir).

- [ ] **Step 4 : consigner la règle**

Dans `.claude/rules/mobile.md`, à la ligne qui décrit `useConfirmer` / `useFeuille` /
`useInformer`, ajouter à la fin : « Toute feuille se ferme aussi en glissant vers le bas
(80 px ou 800 px/s) ; sous Android, le contenu d'un `Modal` porte sa propre
`GestureHandlerRootView`. »

- [ ] **Step 5 : commit**

```bash
git add apps/mobile/components/ui/feuille.tsx .claude/rules/mobile.md
git commit -m "feat(mobile): la feuille basse se ferme en glissant"
```

---

### Task 6 : vérification complète et PR

- [ ] **Step 1 : tout vérifier**

Run : `pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm knip`
Expected : tout passe. `preferences`, `Preferences` et `PREFERENCES_DEFAUT` sont tous importés
par l'API : Knip ne doit rien signaler de neuf.

- [ ] **Step 2 : pousser et ouvrir la PR (avec l'accord de l'utilisateur)**

```bash
git push -u origin feat/refonte-fondations
gh pr create --base main --title "feat: refonte des pages, lot 1 — fondations (D129, D130)" --body "$(cat <<'EOF'
Premier lot de la refonte des pages (spec `docs/superpowers/specs/2026-10-05-mobile-refonte-pages-design.md`).

- `shared` : schéma `preferences`, `seanceSaisie.note`, `SeanceDetail.note`
- base : `Seance.note` (VARCHAR 1000), table `Preferences` (migration `note_preferences`)
- API : `GET` / `PUT /preferences` derrière la session ; la séance écrit et rend sa note
- mobile : toute feuille basse se ferme en glissant

Vérifié : build, typecheck, tests, lint, knip ; routes contre la base `dev` ; feuille sur l'émulateur, sombre et clair.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3 : attendre la CI**

Run : `gh pr checks --watch`
Expected : `Qualité · typecheck · test · build` vert. Avant la fusion, relire
`.claude/rules/deploiement-ci.md` pour savoir comment la migration atteint la branche Neon
`production`, et l'y appliquer selon cette règle.
