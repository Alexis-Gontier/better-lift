# Nettoyage du web — lot 3 : Séances — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** le fil et le relevé des séances nettoyés (D160) : filtre, sélection en surface, actions
dans l'en-tête, tuiles jointives, relevé en `Table`.

**Spec :** [`2026-10-06-web-nettoyage-design.md`](../specs/2026-10-06-web-nettoyage-design.md) (D157, D158, D160).

## Global Constraints

Celles du [lot 1](2026-10-06-web-nettoyage-lot1-coquille.md). Branche `feat/web-nettoyage-lot-3`.

## Tâches

- [ ] **1. Filtre (TDD)** — `filtrerSeances(seances, texte)` dans `features/seances/calculs.ts` : sur
  le nom et les noms d'exercices, insensible à la casse et aux accents (`normalize("NFD")`). Il
  filtre les pages déjà chargées ; « Afficher plus » reste. Le texte vit dans l'URL (`?q=`, suit
  d'un détail à l'autre). Commit.
- [ ] **2. Liste** — en-tête interne retiré (le titre est dans l'en-tête commun) ; `Input` de filtre
  et total en tête ; libellés de mois en casse normale `--ink-subtle` ; entrées séparées par un
  filet, sélection `bg-(--surface-2)` + `shadow-[inset_2px_0_0_var(--ink)]`, jamais lime ; ↑ / ↓
  inchangés. Commit.
- [ ] **3. Détail** — `<DansEnTete titre={seance.nom}>` porte « Ouvrir la routine » et le menu
  « ⋯ » ; `h2` de 26 px retiré, date et heures en tête du détail ; tuiles dans une seule `Card` à
  cellules séparées par des filets (`divide-x`) ; une `Card` par exercice, sa table devient le
  `Table` shadcn (colonnes inchangées) ; superset : `border-superset` conservé. Commit.
- [ ] **4. Vérifier, documenter, PR** — `/verif` ; Playwright (filtre, ↑ ↓, suppression annulée,
  superset, sombre et clair, quatre états) ; `interface-web.md` ; PR.
