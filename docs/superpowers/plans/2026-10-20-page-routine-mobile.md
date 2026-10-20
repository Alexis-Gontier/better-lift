# Page d'une routine — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** la carte de routine porte un segment « Lancer » foncé ; le reste de la carte ouvre une
page en lecture seule de la routine, aux exercices repliables.

**Architecture :** `resumeSeries` monte dans `shared` (testé, lu par le web et le mobile). Le
mobile gagne `app/routine/[id].tsx` sur la pile racine et un composant d'exercice repliable ;
`LigneRoutine` devient une carte à deux zones.

**Tech Stack :** Expo Router 57, Reusables sur Uniwind, Vitest.

**Spec :** `docs/superpowers/specs/2026-10-20-page-routine-mobile-design.md`

## Global Constraints

- Tout en français ; jamais de couleur en dur ; cible de 48 ; titre `accessibilityRole="header"`.
- Toute charge affichée passe par `formaterCharge` / `chargeEnTexte` (`SYSTEME_UNITES`).
- Aucune dépendance ajoutée (Expo Go, D80). `git add <fichier>` seulement ; pas de fusion.

---

### Task 1 : `resumeSeries` dans shared, le web dessus

**Files :** `packages/shared/src/liste-routines.ts` (+ test), `packages/shared/src/index.ts`,
`apps/web/src/features/routines/routine-draft.ts`.

- [ ] Test d'abord (`liste-routines.test.ts`) :
  - `resumeSeries([{type:"NORMALE",reps:12,kg:10},{…12,10}], "metric")` → `"2 × 12 · 10 kg"` ;
  - plages : reps 10 et 12, kg 8 et 10,5 → `"2 × 10–12 · 8–10,5 kg"` ;
  - échauffement devant : `"1 É + 3 × 8 · 80 kg"` ; avec `"W"` → `"1 W + …"` ;
  - sans cible : `"3 séries"` ; seulement des échauffements : `"2 É"` ; vide : `"Aucune série"`.
- [ ] Vérifier l'échec, puis écrire :

```ts
export type SerieChiffree = { type: TypeSerie; reps: number | null; kg: number | null };

export function resumeSeries(
  series: readonly SerieChiffree[],
  systeme: UnitSystem,
  echauffement = ABREGE_TYPE_SERIE.ECHAUFFEMENT,
): string { … }  // logique de l'ancien setsSummary ; charge : chargeEnTexte(min)–formaterCharge(max)
```

- [ ] Le web : `setsSummary(series)` convertit (`/^\d+$/` → nombre, `lireCharge` → nombre ou
  `null`, `NaN` → `null`) puis `resumeSeries(…, SYSTEME, "W")`. Ses tests restent verts.
- [ ] `pnpm --filter @better-lift/shared test`, `pnpm --filter @better-lift/web test`, typecheck ;
  commit `refactor(shared): résumé des séries partagé (D321)`.

### Task 2 : la page et la carte

**Files :** `apps/mobile/app/routine/[id].tsx`, `apps/mobile/app/_layout.tsx`,
`apps/mobile/components/routine/carte-exercice-routine.tsx`,
`apps/mobile/components/accueil/ligne-routine.tsx`, `apps/mobile/app/(connecte)/index.tsx`,
`apps/mobile/components/seance/repere-superset.tsx`.

- [ ] `RepereSuperset` : `onEtiquette` facultatif ; sans lui, l'étiquette est un simple `Text`.
- [ ] `CarteExerciceRoutine({ exercice, ouvert, onBasculer, repos })` : en-tête `Pressable` (48+,
  `accessibilityState={{ expanded }}`) chevron · vignette 40 ronde fond blanc (`expo-image`,
  `autoplay={false}`, repli `Dumbbell`) · nom · résumé ; ouvert : muscle, tableau, repos.
- [ ] `app/routine/[id].tsx` : `useLocalSearchParams`, `useQuery(optionsRoutine(id))`, résumé
  (durée, dernière fois) lu dans `optionsRoutines()` en cache ; quatre états ; `ScrollView`
  avec `EnteteRetour` maison (retour + titre) ; bouton « Lancer » par `useDemarrer().routine`.
- [ ] `_layout.tsx` : `<Stack.Screen name="routine/[id]" />` après `(connecte)`.
- [ ] `LigneRoutine` : deux zones (`onOuvrir`, `onLancer`), segment `w-20 bg-primary`.
  `index.tsx` passe `onOuvrir={() => router.push(\`/routine/${id}\`)}`.
- [ ] typecheck, lint ; émulateur clair et sombre ; commit
  `feat(mobile): page d'une routine et segment « Lancer » (D321)`.

### Task 3 : décisions, règle, PR

- [ ] D321 dans `docs/decisions.md` (révise D316 pour la page, D320 pour l'appui) ; règle mobile.
- [ ] `/verif` ; push ; PR vers `main` ; checks verts ; pas de fusion.
