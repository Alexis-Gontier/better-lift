# Identité mobile — lot 2 : navigation et Accueil — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal :** l'Accueil devient le tableau de la semaine (D166), l'onglet actif prend l'indicateur en pilule (D165), la feuille Démarrer gagne un bouton Fermer (D167).

**Spec :** [`2026-10-11-mobile-identite-design.md`](../specs/2026-10-11-mobile-identite-design.md) — D165, D166, D167 ; « Données » (`volumeKg` dans `Totaux`).

## Global Constraints

Celles du [lot 1](2026-10-12-mobile-identite-lot-1-systeme.md), plus : dates découpées **dans le fuseau** (`FUSEAU`), jamais en UTC ; forme d'une réponse persistée changée → monter `buster` ; le web lit `totaux` champ par champ (un champ ajouté ne le casse pas).

---

### Task 1 : `volumeKg` dans `Totaux` et les sept jours (shared, TDD)

**Files :** `packages/shared/src/stats.ts`, `packages/shared/src/stats.test.ts`, `packages/shared/src/index.ts`.

**Produces :** `Totaux = { seances; series; dureeMin; volumeKg }` (volume arrondi au centième, hors échauffement comme `SeancePeriode.volumeKg`) ; `export type JourSemaine = { jour: string; entraine: boolean; aujourdhui: boolean; avenir: boolean }` et `export function joursDeLaSemaine(premierLundi: string, jours: readonly JourEntraine[], maintenant: Date, fuseau: string): JourSemaine[]` (7 entrées, du lundi au dimanche).

- [ ] Tests d'abord : `totaux` et `precedents` portent `volumeKg` (adapter les `toEqual` existants) ; `joursDeLaSemaine` rend 7 jours à partir du lundi, `entraine` sur les jours présents, `aujourdhui` sur le jour de `maintenant` **dans le fuseau** (samedi 23 h 30 à Paris = samedi, pas dimanche UTC), `avenir` après lui.
- [ ] `pnpm --filter @better-lift/shared test` : échec, puis implémentation, puis succès.
- [ ] Commit `feat(shared): volume des totaux et jours de la semaine (D166)`.

### Task 2 : l'Accueil (mobile)

**Files :** `components/accueil/a-suivre.tsx` (révisé : sans sur-titre ni bouton), `components/accueil/cette-semaine.tsx` (nouveau), `components/accueil/ligne-seance.tsx` (nouveau), `components/accueil/carte-seance.tsx` (supprimé), `app/(onglets)/index.tsx`, `app/_layout.tsx` (`buster` « 3 »).

- [ ] **Prochaine séance** : nom en affiche, « Ta prochaine séance · ≈ N min · n exercices », zones principales ; toucher ouvre la routine ; plus de `BoutonContour`.
- [ ] **Cette semaine** (`optionsStatsPeriode("semaine")`, `optionsPreferences()`) : en-tête « Cette semaine » et « x / y séances » (sans objectif : « x séances ») ; 7 cases (L M M J V S D), entraînée en `action`, aujourd'hui cerclée à l'encre, à venir en contour ; ligne « volume · écart % · séries · durée ». Le dernier record de la semaine (`records[0]`) en badge contour, masqué sans record. Sans donnée (chargement, hors ligne sans cache) : le bloc ne s'affiche pas.
- [ ] **Journal** : en-tête `Section` « Journal », une `LigneSeance` par séance (nom ; date · durée · volume ; badge « ↑ n » si `nbRecords`), qui ouvre le détail.
- [ ] Vérifier : typecheck, lint, knip ; commit `feat(mobile): accueil tableau de la semaine (D166)`.

### Task 3 : la barre et Démarrer

**Files :** `app/(onglets)/_layout.tsx`, `components/feuille-demarrer.tsx`.

- [ ] `tabBarIcon` : l'icône dans une pilule de 56 × 30 (`surface3`) quand l'onglet est actif ; libellé à l'encre (actif) ou `encreAttenuee`.
- [ ] Feuille Démarrer : bouton « Fermer » (icône `X`, cible 48, `accessibilityLabel="Fermer"`) à droite du titre ; le sur-titre « À suivre » au-dessus du nom devient la ligne « Ta prochaine séance · … » sous le nom (interdit du sur-titre, D164).
- [ ] Commit `feat(mobile): onglet actif en pilule, démarrer se ferme d'un bouton (D165, D167)`.

### Task 4 : vérifier, règles, PR

- [ ] `/verif` ; émulateur sombre et clair : Accueil (avec et sans séance cette semaine), feuille Démarrer, barre.
- [ ] `.claude/rules/mobile.md` : sections Navigation et Accueil (D165–D167).
- [ ] Pousser, PR, CI verte, fusion squash.
