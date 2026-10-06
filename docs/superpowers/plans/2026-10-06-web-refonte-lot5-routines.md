# Refonte du web — lot 5 : Routines — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** la colonne des routines réordonnable et l'éditeur restylé, fonctionnement inchangé (D142).

**Architecture :** `PUT /routines/ordre` (existant) par une mutation optimiste
(`useOrdonnerRoutines` : la liste se réordonne avant la réponse, revient en arrière en échec).
Glisser par `@dnd-kit` (déjà là pour l'éditeur), à la souris et au clavier. L'éditeur
(`brouillon-routine.ts`, D85) ne change que d'habillage. Aucun changement d'API ni de `shared`.

**Spec :** [`2026-10-06-web-refonte-design.md`](../specs/2026-10-06-web-refonte-design.md) (D142).
Branche `feat/web-refonte-lot5`, empilée sur `feat/web-refonte-lot4` (PR #95).

## Tâches

- [x] **1. Ordre** — `useOrdonnerRoutines` ; `liste-routines.tsx` : en-tête (titre, nombre,
  « Nouvelle routine », seul aplat), cartes en surface, poignée visible au survol et au focus.
- [x] **2. Habillage** — titre de l'éditeur en 800, cartes d'exercice sans filet (`surface-2`,
  rayon 16), vignettes `--image-bg`, plus de chasse fixe (D135).
- [x] **3. Vérifier** — Playwright : routine ouverte, glisser au clavier (Espace, ↓, Espace)
  enregistré côté serveur, puis ordre d'origine rétabli. build, typecheck, test, lint, knip.
