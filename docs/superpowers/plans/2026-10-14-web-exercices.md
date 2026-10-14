# Page Exercices — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** grille d'exercices filtrée, fiche en page entière avec analyse (graphes, période,
meilleures séries par reps) et variantes.

**Architecture:** l'analyse est un calcul pur dans `shared` sur l'historique existant ; l'API
gagne deux filtres et deux routes ; le web remplace la liste / fiche côte à côte par deux pages.

**Tech Stack:** Hono RPC, Prisma 7, Zod, Vitest, React 19, TanStack Router / Query, Recharts 3.8.0.

**Spec:** `docs/superpowers/specs/2026-10-14-web-exercices-design.md`

## Global Constraints

- Interface en français, code du web en anglais (D198), `shared` et API en français.
- Échauffements exclus et séries non faites ignorées dans toute analyse.
- Découpage des dates dans le fuseau du profil (`FUSEAU` / `TIME_ZONE`), jamais en UTC.
- Charges par `formaterCharge` avec `UNIT_SYSTEM`.
- Quatre états par écran, `?state=` en développement.
- Après chaque tâche web : capture connectée du rendu (Playwright autonome si le MCP est pris).
- Ne committer que les fichiers touchés (jamais un dossier entier).

---

### Task 1 : `shared/analyse-exercice.ts`

**Files:** create `packages/shared/src/analyse-exercice.ts`, `analyse-exercice.test.ts` ; export
depuis `index.ts`.

**Produces :**
- `PERIODES_EXERCICE = ["1m","3m","6m","1a","tout"]`, `type PeriodeExercice`.
- `pointsExercice(historique: HistoriqueExercice, periode, maintenant: string, fuseau): PointSeance[]`
  — un point par séance de la période, chronologique : `{ date, chargeMax, unRm, volume, reps }`
  (`chargeMax` / `unRm` `null` au poids du corps ; séances sans série comptée ignorées).
- `resumePeriode(points): { seances, series, reps, volume, volumeMoyen }`.
- `meilleuresParReps(historique): { reps, realise: { chargeKg, date } | null, estimeKg: number | null }[]`
  pour `REPS_TABLEAU = [1,3,5,6,8,10,12]`, depuis toujours ; `estimeKg` = meilleur 1RM / (1 + r/30),
  arrondi au 0,5.
- `avecCharge(historique): boolean`.

Tests : période (frontière dans le fuseau), échauffement et non-faite exclus, poids du corps,
reps hors liste comptées dans le 1RM mais sans ligne, égalité de charge → date la plus ancienne.

### Task 2 : contrat et API

**Files:** `packages/shared/src/exercices.ts` (+ `cible` dans `ExerciceResume`, `cible` et `slugs`
dans `requeteCatalogue`), `apps/api/src/services/exercices.ts` (filtre, `variantes`),
`apps/api/src/services/seances.ts` (`pratiques`), routes `exercices.ts` / `records.ts`, tests.

- `slugs` : chaîne séparée par des virgules dans l'URL, transformée en liste (≤ 200).
- `GET /exercices/pratiques` sous `exigerSession` : `{ pratiques: { slug, nbSeances, derniere }[] }`,
  déclarée AVANT `/:slug`.
- `GET /exercices/:slug/variantes` : 404 si inconnu, sinon `{ variantes: ExerciceResume[] }`.

### Task 3 : la grille (`/exercises`)

**Files:** `routes/_authenticated.exercises.tsx` (grille, plus de `ListDetailPage`),
`routes/_authenticated.exercises.$slug.tsx` → route sœur `_authenticated.exercises_.$slug.tsx`
(page entière), `features/exercises/exercise-grid.tsx`, `exercise-filters.tsx`, `queries.ts`.

### Task 4 : la fiche (`/exercises/$slug`)

**Files:** `features/exercises/exercise-page.tsx` (en-tête, consignes), `exercise-analysis.tsx`
(onglets, période, graphe Recharts, résumé), `best-sets-table.tsx`, `exercise-variants.tsx`.
Retirer `exercise-detail.tsx` et ce qui n'est plus utilisé (`calculations.ts` si `curve` ne sert
plus).

### Task 5 : consignes, `/verif`, captures, push
