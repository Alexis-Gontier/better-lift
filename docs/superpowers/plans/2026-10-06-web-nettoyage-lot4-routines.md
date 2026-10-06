# Nettoyage du web — lot 4 : Routines — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** la colonne des routines et l'éditeur à l'habillage D158 / D160, sans toucher à leur
logique.

**Spec :** [`2026-10-06-web-nettoyage-design.md`](../specs/2026-10-06-web-nettoyage-design.md) (D157, D158, D160).

## Global Constraints

Celles du [lot 1](2026-10-06-web-nettoyage-lot1-coquille.md). Branche `feat/web-nettoyage-lot-4`.
`brouillon-routine.ts`, `supersets.ts`, `useOrdonnerRoutines` et le glisser ne changent pas.

## Tâches

- [ ] **1. Colonne** — filtre par nom (`?q=`, local) ; la poignée de réordonnancement est masquée
  tant qu'un filtre est actif (on ne réordonne pas une liste partielle) ; sélection en surface
  comme au lot 3 ; « Nouvelle routine » en bouton `outline` en tête de colonne. Commit.
- [ ] **2. Éditeur** — `<DansEnTete titre>` porte Annuler / Enregistrer (barre conditionnée par
  `empreinte`, inchangée) et le menu « ⋯ » (Supprimer) ; `BoutonFermer` retiré si le fil d'Ariane
  le rend inutile. Commit.
- [ ] **3. Cartes d'exercice** — `carte-exercice.tsx` sur `Card` (vignette blanche, nom, « dernière
  fois », menu ⋯) ; `tableau-series.tsx` à l'échelle de `Table` ; supersets : `EtiquetteSuperset`
  et filet `border-superset` conservés. Commit.
- [ ] **4. Vérifier, documenter, PR** — `/verif` ; Playwright (créer, modifier, annuler, glisser à la
  souris et au clavier, superset lié puis défait, sombre et clair, quatre états) ;
  `interface-web.md` ; PR.
