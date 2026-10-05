# Refonte des pages — lot 4 : détail d'une séance et fiche d'exercice — plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal :** le détail d'une séance passée dit, série par série, l'écart avec la séance précédente
de l'exercice, et propose Refaire / Supprimer (D123) ; la fiche d'un exercice porte la courbe du
1RM estimé, ses records et son historique (D124).

**Spec :** [`2026-10-05-mobile-refonte-pages-design.md`](../specs/2026-10-05-mobile-refonte-pages-design.md) — D123, D124.

**Écarts assumés avec la spec, plus simples :**
- La séance précédente de chaque exercice est calculée **dans `GET /seances/:id`** (qui charge
  déjà l'historique antérieur pour les records) plutôt que par `precedentes?avant=` : une requête
  au lieu de deux, aucune nouvelle route.
- « Refaire » relance **la routine d'origine** (`useDemarrer().routine`) ; une séance sans routine
  n'a pas « Refaire ». L'écart de volume de l'en-tête attend un usage qui le réclame.

## Global Constraints

Celles des lots 2 et 3. Branche `feat/refonte-detail-fiche` depuis `main`.

### Task 1 : `shared`

- `ecart.ts` : `ecartSerie(serie, precedente)` →
  `{ genre: "charge"; deltaKg: number } | { genre: "reps"; delta: number } | { genre: "egal" } | null`
  — `null` sans précédente, ou si l'une des deux n'a pas de reps. Charge d'abord (deux charges
  connues et différentes), puis reps, sinon « égal ». Tests : charge en hausse, en baisse, reps,
  égal, poids du corps (charges nulles → reps), sans précédente.
- `courbeUnRm(seances)` (même fichier) : pour chaque séance `{ date, series }`, le meilleur
  `estimate1RM` des séries faites hors échauffement avec charge et reps > 0 ; une séance sans
  telle série est omise ; ordre chronologique. Tests.
- `SeanceDetail.exercices[]` gagne `image: string | null` et
  `precedentes: { reps: number | null; chargeKg: number | null }[]` (les séries de la dernière
  occurrence antérieure, TOUTES, dans l'ordre — l'alignement position par position de CLAUDE.md).
- Type `HistoriqueExercice = { id; nom; debut; series: { type; reps; chargeKg; faite }[] }[]`.

### Task 2 : API

- `versDetail` remplit `image` (`imageDe`) et `precedentes` (dans l'historique antérieur de
  l'exercice, les séries de la date la plus récente). Test sur la fixture.
- `DELETE /seances/:id` → 204, 404 si introuvable ou à autrui (`deleteMany` filtré par
  `userId`). Tests de route (session, 204, 404).
- `GET /exercices/:slug/historique` (session) dans `routes/records.ts` →
  `{ seances: HistoriqueExercice }`, du plus récent au plus ancien, 404 si l'exercice n'existe pas.
  Tests de route.

### Task 3 : le détail (mobile)

`historique/[id].tsx` : vignette à côté du nom d'exercice ; à droite de chaque série, l'écart
(« +2,5 kg », « +1 rep », « = », en `encreTertiaire`, rien sans précédente) ; en-tête « ⋯ »
(`useFeuille`) : « Refaire cette séance » (si `routineId`, et pas de séance en cours) et
« Supprimer la séance » (danger, `useConfirmer`) → `DELETE`, invalide `["seances"]`, `["stats"]`,
`["records"]`, puis retour.

### Task 4 : la fiche (mobile)

`exercices/[slug].tsx`, une page qui défile : GIF, nom et muscle ; bloc « 1RM estimé » (dernière
valeur, écart avec la première de la courbe, courbe `react-native-svg` en encre, dernier point
lime comme un record — sinon rien) ; records (existants) ; historique (date, nom de séance, séries
« 85 × 5 · 85 × 5 », badge record) ; consignes. Hors ligne : ce qui est en cache, sinon le dire.

### Task 5 : vérification et PR

Typage, tests, Knip, émulateur sombre et clair (détail de Push A, menu ⋯ sans supprimer de
séance de démo, fiche du développé couché) ; `mobile.md` ; PR, CI, fusion.
