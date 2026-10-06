# Refonte du web — lot 4 : Exercices — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** la fiche d'un exercice en une page qui défile, avec le 1RM estimé et sa courbe en grand
(D141).

**Architecture :** `GET /exercices/:slug`, `/:slug/records`, `/:slug/historique`. `courbeUnRm`
(shared) donne les points ; la géométrie de la courbe (échelle, écart, record) est une fonction
pure testée dans `features/exercices/calculs.ts`, dessinée en SVG sans bibliothèque. Le
catalogue (liste, recherche, filtres) ne change pas, il passe en disposition `fil`.

**Spec :** [`2026-10-06-web-refonte-design.md`](../specs/2026-10-06-web-refonte-design.md) (D141).

## Global Constraints

Celles des lots précédents. Branche `feat/web-refonte-lot4`, empilée sur `feat/web-refonte-lot3`
(PR #94). Le web ne lance pas de séance (D132) : le bouton « Démarrer la séance » de la fiche
disparaît. Clé de l'historique sous `["seances", "historique", slug]` : la suppression d'une
séance l'invalide (lot 3).

## Tâches

- [ ] **1. Géométrie de la courbe (TDD)** — `courbe(points, largeur, hauteur)` → `{ xy, min,
  max, ecartKg, record }` : un seul point au centre ; `record` si le dernier point est le plus
  haut et qu'il y en a plusieurs. Commit.
- [ ] **2. Fiche** — `optionsHistorique(slug)` ; `detail-exercice.tsx` refait en une page : en-tête
  (GIF, nom, groupe · équipement, muscles), carte **1RM estimé** (valeur, écart sur l'historique,
  courbe SVG pleine largeur, dates aux extrémités, dernier point en lime s'il est record),
  **records** en tuiles, **historique** en table (date → la séance, nom, séries faites,
  meilleur 1RM), **consignes**. Route `$slug` : historique en parallèle. Liste en `fil`. Commit.
- [ ] **3. Vérifier, documenter, PR** — build, typecheck, test, lint, knip ; Playwright (fiche
  avec et sans historique, sombre et clair) ; `interface-web.md` ; PR empilée.
