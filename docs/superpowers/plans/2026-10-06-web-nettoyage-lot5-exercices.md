# Nettoyage du web — lot 5 : Exercices — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** le catalogue et la fiche d'exercice à l'habillage D158 / D160, courbe du 1RM en `Chart`.

**Spec :** [`2026-10-06-web-nettoyage-design.md`](../specs/2026-10-06-web-nettoyage-design.md) (D157–D160).

## Global Constraints

Celles du [lot 1](2026-10-06-web-nettoyage-lot1-coquille.md) ; `chart` vient du lot 2. Branche
`feat/web-nettoyage-lot-5`.

## Tâches

- [ ] **1. Catalogue** — recherche et filtres de groupe inchangés dans leur fonctionnement ; lignes
  à filet, sélection en surface comme au lot 3. Commit.
- [ ] **2. Fiche** — `<DansEnTete titre={exercice.nom}>` ; `h2` retiré, nom anglais en sous-titre ;
  GIF, 1RM, records, historique, consignes chacun dans une `Card` ; historique en `Table` ;
  `BadgeRecord` reste la seule pastille record. Commit.
- [ ] **3. Courbe** — `LineChart` dans `ChartContainer` sur `courbe()` de `calculs.ts` (inchangée,
  testée) ; trait `--ink-muted`, dernier point en lime s'il est record (D141) ; infobulle date +
  1RM par `formaterCharge`. Commit.
- [ ] **4. Vérifier, documenter, PR** — `/verif` ; Playwright (recherche, filtre, fiche avec et sans
  historique, sombre et clair, quatre états) ; `interface-web.md` ; PR.
