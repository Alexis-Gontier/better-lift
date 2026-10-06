# Nettoyage du web — lot 6 : Profil et connexion — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** le Profil et la page de connexion en cartes shadcn (D158).

**Spec :** [`2026-10-06-web-nettoyage-design.md`](../specs/2026-10-06-web-nettoyage-design.md) (D158).

## Global Constraints

Celles du [lot 1](2026-10-06-web-nettoyage-lot1-coquille.md). Branche `feat/web-nettoyage-lot-6`.

## Tâches

- [ ] **1. Profil** — bilan, objectif et repos, thème, unités et fuseau, export : une `Card` par
  section (`CardHeader` titre + description), lignes séparées par des filets ; la déconnexion
  reste aussi dans le Profil. Commit.
- [ ] **2. Connexion** — formulaire dans une `Card` centrée (logo et nom au-dessus), champs et
  bouton inchangés dans leur fonctionnement. Commit.
- [ ] **3. Vérifier, documenter, PR** — `/verif` ; Playwright (Profil : objectif modifié puis
  rétabli, thème, export ; connexion : erreur puis succès ; sombre et clair) ; `interface-web.md` ;
  `CLAUDE.md` (« État » : nettoyage du web livré) ; PR.
