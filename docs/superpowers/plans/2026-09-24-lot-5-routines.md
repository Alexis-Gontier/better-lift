# Lot 5 — les routines : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (exécution inline
> retenue par l'utilisateur, pour économiser les jetons). Steps use checkbox (`- [ ]`) syntax.
> Plan volontairement compact : le code n'y figure que pour les parties délicates ; fichiers,
> interfaces et tests sont complets.

**Goal :** créer, modifier, réordonner et supprimer des routines depuis le web, série par série.

**Architecture :** l'éditeur est dessiné d'abord sur données factices (PR 1, validée à l'écran),
puis branché sur un modèle Prisma et une API protégée par session (PR 2). Un `PUT` remplace la
routine entière. Le glisser-déposer ne porte que sur les exercices.

**Tech Stack :** Prisma 7, Hono RPC, Better Auth (session), Zod 4, TanStack Query/Router,
`@dnd-kit/core` + `@dnd-kit/sortable`, Vitest.

**Spec :** [`docs/superpowers/specs/2026-09-24-lot-5-routines-design.md`](../specs/2026-09-24-lot-5-routines-design.md)

## Global Constraints

Celles du lot 4, inchangées (`CLAUDE.md` fait foi), plus :

- **Base `betterlift` de la branche Neon `dev`** ; `database_name: "betterlift"` pour toute requête MCP.
- **Après `pnpm db:migrate`, `pnpm --filter @better-lift/db generate`** (Prisma 7 ne le fait plus).
- **Toute charge affichée ou saisie passe par `formaterCharge` / `lireCharge`** (D52).
- **Quatre états atteignables par `?etat=`** sur l'écran des routines, éditeur compris.
- **Le permanent est jointif, le passager flotte** : le sélecteur d'exercice et la confirmation de
  suppression sont des dialogues ; l'éditeur reste dans le panneau.
- **Danger** : le bouton « Supprimer » et sa confirmation utilisent `--danger`, jamais le lime.

---

# PR 1 — l'éditeur dessiné

Branche `feat/lot-5-routines-dessin`, depuis `main`.

### Task 1 : la charge et ses unités (`shared`, TDD)

**Files :** create `packages/shared/src/charge.ts`, `charge.test.ts` ; modify `index.ts`.

**Produces :**
```ts
export function formaterCharge(kg: number, systeme: UnitSystem): string; // 82.5 → « 82,5 kg » ; imperial → « 181,88 lb »
export function lireCharge(texte: string, systeme: UnitSystem): number | null; // → kg, 2 décimales
```

**Tests :** virgule et point acceptés ; espaces autour ; zéros inutiles retirés (« 80 kg », pas
« 80,00 kg ») ; `lireCharge` rend `null` pour vide, texte, négatif, > 1000 kg ; aller-retour
imperial → kg → imperial stable à 0,01 près ; séparateur décimal français à l'affichage.

### Task 2 : les types des routines (`shared`)

**Files :** create `packages/shared/src/routines.ts` ; modify `index.ts`.

**Produces :**
```ts
export const TYPES_SERIE = ["ECHAUFFEMENT", "NORMALE", "ECHEC", "DEGRESSIVE"] as const;
export type TypeSerie = (typeof TYPES_SERIE)[number];
export const LIBELLE_TYPE_SERIE: Record<TypeSerie, string>; // Échauffement, Normale, Échec, Dégressive
export const ABREGE_TYPE_SERIE: Record<TypeSerie, string>;  // É, N, Éc, D — pour le tableau
export type SerieRoutine = { type: TypeSerie; repsCible: number | null; chargeCibleKg: number | null };
export type ExerciceRoutine = { slug: string; nom: string; reposSec: number | null; series: SerieRoutine[] };
export type RoutineDetail = { id: string; nom: string; exercices: ExerciceRoutine[] };
export type RoutineResume = { id: string; nom: string; nbExercices: number; nbSeries: number };
```
Ces types sont ceux que l'API rendra en PR 2 : les factices ont déjà leur forme.

### Task 3 : les données factices, série par série

**Files :** rewrite `apps/web/src/mocks/routines.ts` : `ROUTINES: RoutineDetail[]`, trois
routines (Push au nom long, Pull, Legs) sur des **slugs réels** du catalogue
(`barbell-bench-press`, `dumbbell-incline-bench-press`, `dumbbell-lateral-raise`,
`cable-triceps-pushdown-v-bar`, `barbell-deadlift`, `pull-up`, `barbell-full-squat`…), avec des
séries d'échauffement, des charges décimales (82,5) et une série sans charge.
Et `resumer(r: RoutineDetail): RoutineResume`.

### Task 4 : la lecture, série par série

**Files :** modify `features/routines/liste-routines.tsx` (type `RoutineResume`, sous-ligne
« 4 exercices · 14 séries »), `features/routines/detail-routine.tsx` (type `RoutineDetail` ; par
exercice, les séries en lignes : type abrégé, reps, charge via `formaterCharge` ; bouton
« Modifier » secondaire à côté de « Démarrer cette routine »), create `apps/web/src/lib/unites.ts`
(`export const SYSTEME_UNITES: UnitSystem = "metric"` — l'unique endroit, D52).

### Task 5 : l'éditeur

**Files :** create `features/routines/editeur-routine.tsx`, `carte-exercice.tsx`,
`tableau-series.tsx`, `selecteur-exercice.tsx`, `confirmer-suppression.tsx` ; ajouter
`@dnd-kit/core` et `@dnd-kit/sortable` à `apps/web` (versions via `pnpm add`, puis Context7 pour
l'API courante).

**Interfaces :**
```ts
EditeurRoutine({ initiale: RoutineDetail | null; enregistrement: boolean;
  onEnregistrer(r: Omit<RoutineDetail, "id">): void; onAnnuler(): void; onSupprimer?(): void })
```
- État local : une copie de travail ; chaque exercice porte une clé locale stable (`crypto.randomUUID()`)
  — le slug ne suffit pas, le même exercice peut figurer deux fois.
- `DndContext` + `SortableContext` (stratégie verticale) sur les **exercices seulement** ;
  `KeyboardSensor` avec `sortableKeyboardCoordinates`, `PointerSensor` avec une distance
  d'activation de 4 px (sinon chaque clic sur un champ démarre un glisser). Poignée dédiée, étiquetée.
- « + série » recopie la dernière série de l'exercice (ou une série normale vide).
- Champ charge : texte libre relu par `lireCharge` à la sortie du champ ; invalide → bordure danger
  et enregistrement désactivé.
- « Enregistrer » désactivé si le nom est vide ou si aucun exercice.
- Sélecteur : dialogue shadcn, champ de recherche branché sur `optionsCatalogue` (le catalogue
  réel existe déjà) ; choisir ajoute l'exercice avec trois séries normales vides.
- Confirmation de suppression : dialogue, bouton `bg-(--danger)`.

### Task 6 : la route, les états, et l'édition sur factices

**Files :** modify `routes/_protege.routines.tsx` : recherche `{ id?, edition?: boolean, etat? }`
(`edition` via `z.coerce.boolean()`… non : `z.enum(["1"]).optional()` pour garder l'URL lisible) ;
un état local `useState(ROUTINES)` rend la création, la modification, la suppression et le
réordonnancement **interactifs sur factices** ; « Nouvelle routine » dans l'en-tête de la liste
ouvre `?id=nouvelle&edition=1`. `?etat=vide` vide la liste par son chemin réel (état vide avec un
appel à créer).

### Task 7 : vérification et validation utilisateur

`/verif` ; Playwright avec le compte de contrôle (recréé selon `CLAUDE.md` si besoin) : créer,
réordonner à la souris **et** au clavier, ajouter/supprimer des séries, charge « 82,5 » → « 82,5 kg »,
charge invalide refusée, supprimer avec confirmation, quatre états. Capture d'écran de l'éditeur
**présentée à l'utilisateur, qui valide avant la PR**. Puis PR 1, CI, squash.

---

# PR 2 — le branchement

Branche `feat/lot-5-routines-api`, depuis `main` après la PR 1.

### Task 8 : le schéma

Modèles de la spec § 3 ; relation inverse `routines Routine[]` sur `User` et
`routineExercices RoutineExercice[]` sur `Exercise`. `pnpm db:migrate --name routines`, puis
`generate`. Vérifier par MCP (`betterlift`) que les trois tables existent.

### Task 9 : le contrat (`shared`, TDD)

**Files :** modify `routines.ts` ; test `routines.test.ts`.
```ts
export const serieSaisie, exerciceSaisi, routineSaisie, ordreRoutines; // Zod
export type RoutineSaisie = z.infer<typeof routineSaisie>;
```
**Tests :** bornes de la spec § 4 ; nom détouré et non vide ; type inconnu refusé ; charge négative
refusée ; ordre des exercices conservé ; `ordreRoutines` refuse les doublons.

### Task 10 : `exigerSession`

**Files :** create `apps/api/src/middlewares/session.ts`, test.
```ts
export type VariablesSession = { userId: string };
export function exigerSession(lire?: (h: Headers) => Promise<{ user: { id: string } } | null>):
  MiddlewareHandler<{ Variables: VariablesSession }>;
```
Par défaut `lire = (headers) => auth.api.getSession({ headers })`. Injecté pour les tests.
**Tests :** 401 sans session ; `userId` posé avec session.

### Task 11 : le service (TDD sur le pur)

**Files :** create `apps/api/src/services/routines.ts`, test.
- Pur : `versEcriture(saisie, idsParSlug: Map<string,string>)` → données de création imbriquées
  (positions = index), lève `SlugInconnu` ; `versDetail(ligne)` ; `versResume(ligne)`.
- Dépôt : `lister(userId)`, `lire(userId, id)`, `creer(userId, saisie)`, `remplacer(userId, id,
  saisie)` (transaction : vérifier l'appartenance, supprimer les exercices, recréer, renommer),
  `supprimer(userId, id)`, `ordonner(userId, ids)`. Toute lecture filtre par `userId` ; absent → `null`.
**Tests :** positions, slug inconnu, doublon d'exercice autorisé, charge `Decimal` → `number`.

### Task 12 : les routes

**Files :** create `apps/api/src/routes/routines.ts`, test ; modify `app.ts` (monter `/routines`
dans `AppType`). Dépôt et lecteur de session injectables.
**Tests :** 401 sans session ; 404 routine d'autrui ; 400 slug inconnu ; 201 création ; PUT puis
GET rend la nouvelle version ; DELETE puis GET → 404 ; `PUT /routines/ordre`.
**Vérif réelle :** `curl` avec le cookie du compte de contrôle.

### Task 13 : le branchement web

**Files :** create `features/routines/requetes.ts` (`optionsRoutines()`, `optionsRoutine(id)`,
mutations `useCreerRoutine`, `useRemplacerRoutine`, `useSupprimerRoutine`, `useOrdonnerRoutines`
— chacune invalide `["routines"]` : **la clé de lecture et celle d'écriture partagent leur
préfixe**) ; modify la route ; delete `mocks/routines.ts`. Après création, naviguer vers
`?id=<nouvel id>` hors édition.

### Task 14 : clôture

`/verif` ; Playwright : parcours complet, rechargement, API coupée → erreur réelle ;
`CLAUDE.md` (état, `exigerSession`, D50–D53) ; PR 2, CI, squash ; mémoire d'avancement.
