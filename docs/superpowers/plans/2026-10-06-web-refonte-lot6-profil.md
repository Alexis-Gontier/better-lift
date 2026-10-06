# Refonte du web — lot 6 : Profil — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** le Profil du web (D143) : bilan de toujours, préférences du compte, thème, mesures,
export CSV, déconnexion.

**Architecture :** `GET /stats/bilan` (`["stats","bilan"]`), `GET` / `PUT /preferences`
(`["preferences"]`, la clé que lisent les tuiles du Tableau de bord), `GET /export/seances.csv`
par un simple lien (le cookie part avec la navigation ; l'API répond en pièce jointe). Le thème
reste un réglage d'appareil (`localStorage`, D129). Aucun changement d'API ni de `shared`.

**Spec :** [`2026-10-06-web-refonte-design.md`](../specs/2026-10-06-web-refonte-design.md) (D143).
Branche `feat/web-refonte-lot6`, empilée sur `feat/web-refonte-lot5` (PR #96).

## Tâches

- [x] **1. Requêtes** — `features/profil/requetes.ts` : `optionsBilan`, `useEcrirePreferences`.
- [x] **2. Page** — `_protege.profil.tsx` refait : bilan, Entraînement (objectif 1–7 ou aucun,
  repos par défaut, mêmes choix que le mobile), Apparence, Mesures, Données (export), Compte.
- [x] **3. Vérifier** — Playwright : objectif posé puis retiré par l'interface (préférences
  d'origine rétablies), export en 200. build, typecheck, test, lint, knip.
