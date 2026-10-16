# Wireframe web — passe 3 : contenu de l'Accueil — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les zones de l'Accueil par de vrais composants nourris de données factices, avec ses quatre états (`?etat=nominal|vide|chargement|erreur`). Page pilote : elle fixe le niveau de détail des autres.

**Architecture:** `src/mocks/` porte des données factices **déterministes** (générateur à graine, date du jour fixée au 2026-10-16 pour des captures stables) et des calculs purs testés (`stats.ts`). `src/features/home/` porte une carte par fichier ; la route assemble et choisit l'état via `useProto()`.

**Tech Stack:** shadcn Radix Nova (`card`, `chart` + Recharts, `progress`, `badge`, `skeleton`, `empty`, `alert`), Kibo UI *Contribution Graph* (+ `date-fns`, validé D228), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-16-web-wireframe-design.md` (§ 4.2 Accueil, D222, D223, D227)

## Global Constraints

- Les dates sont des chaînes civiles `YYYY-MM-DD` ; l'arithmétique se fait sur ces chaînes en UTC (jamais l'heure locale) : un jour civil reste un jour civil.
- Semaine du lundi au dimanche (préférence par défaut).
- Chiffres en `tabular-nums`, nombres formatés en `fr-FR` (`12 480 kg`).
- « Jours d'affilée » devient **« Semaines d'affilée »** (semaines consécutives avec au moins une séance) : un pratiquant ne s'entraîne pas tous les jours.
- État `vide` : le compte n'a encore rien (nouvel inscrit) → un `Empty` qui propose « Créer une routine » et « Importer depuis Hevy ».

---

### Task 1: Données factices et calculs (TDD)

**Files:** `src/mocks/{today,random,sessions,weights,goals,records,planning}.ts`, `src/mocks/stats.ts`, `src/mocks/stats.test.ts`

- [ ] **Tests d'abord** (`stats.test.ts`) sur un petit jeu écrit à la main :
  - `startOfWeek("2026-10-16")` → `"2026-10-12"` (lundi) ; `startOfWeek("2026-10-12")` → lui-même ; `addDays("2026-10-31", 1)` → `"2026-11-01"`.
  - `weekSummary(sessions, today)` → `{ current: { count, volume, minutes }, previous: {…} }`.
  - `weeklyVolume(sessions, today, 3)` → 3 semaines, la plus ancienne d'abord, semaines vides à 0.
  - `weekStreak(sessions, today)` → nombre de semaines consécutives avec une séance, en comptant la semaine en cours si elle en a une, sinon en partant de la précédente.
  - `dailyActivity(sessions, today, days)` → un élément par jour, `level` 0 à 4 selon le volume relatif au maximum.
  - `movingAverage(values, 7)` → moyenne des 7 dernières valeurs disponibles à chaque point.
- [ ] Implémenter `stats.ts` jusqu'au vert.
- [ ] Générateur `random.ts` (mulberry32) ; `sessions.ts` : ~3,5 séances par semaine sur 365 jours avant `TODAY`, routines Push A / Pull A / Jambes A / Push B / Pull B / Haut du corps ; `weights.ts` : 90 pesées de ~82 à ~79,5 kg avec bruit ; `goals.ts`, `records.ts`, `planning.ts` (aujourd'hui : Push B).
- [ ] Commit `feat(web): données factices et calculs de l'accueil`.

### Task 2: Composants de l'Accueil

**Files:** `src/features/home/{today-card,week-stats,weekly-volume-chart,weight-card,consistency-card,goals-card,recent-records,recent-sessions,home-states}.tsx`

- [ ] Installer `card chart progress badge empty alert` (shadcn) et le Contribution Graph (Kibo).
- [ ] Une carte par fichier, chacune une `Card` (`CardHeader` / `CardTitle` / `CardDescription` / `CardContent`) :
  - **Aujourd'hui** : routine planifiée, nombre d'exercices, durée estimée, bouton « Voir la routine ».
  - **Semaine** : 4 tuiles (séances, volume, durée, semaines d'affilée) avec écart à la semaine précédente en `Badge`.
  - **Volume par semaine** : `ChartContainer` + `BarChart`, 12 semaines, animations coupées.
  - **Poids** : valeur, écart sur 7 jours, mini-courbe (`LineChart` sans axes) de la moyenne mobile.
  - **Régularité** : Contribution Graph, 52 semaines, libellés français, semaine du lundi.
  - **Objectifs** : `Progress` par objectif, valeur / cible.
  - **Records récents** et **Dernières séances** : listes, chaque ligne mène à l'exercice ou à la séance.
- [ ] `home-states.tsx` : `HomeSkeleton` (mêmes cartes en `Skeleton`), `HomeEmpty` (`Empty`), `HomeError` (`Alert` + « Réessayer »).
- [ ] Commit `feat(web): cartes de l'accueil`.

### Task 3: Assemblage et vérification

- [ ] `_app.index.tsx` : même grille que le squelette, chaque `Zone` remplacée par sa carte ; `useProto().state` choisit nominal / vide / chargement / erreur.
- [ ] `/verif` ; captures des quatre états, clair et sombre ; commit `feat(web): accueil en contenu, quatre états`.
