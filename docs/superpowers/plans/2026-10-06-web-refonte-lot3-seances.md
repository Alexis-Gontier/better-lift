# Refonte du web — lot 3 : Séances — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** le fil des séances groupé par mois et le relevé comparé série par série (D140).

**Architecture :** `GET /seances` (paginé, `SeanceFil`), `GET /seances/:id` (`SeanceDetail`, avec
`precedentes` par exercice), `DELETE /seances/:id`. Les calculs propres au web (regroupement par
mois dans le fuseau, texte d'un écart) sont purs et testés dans `features/seances/calculs.ts`.
Aucun changement d'API ni de `shared`.

**Spec :** [`2026-10-06-web-refonte-design.md`](../specs/2026-10-06-web-refonte-design.md) (D140).

## Global Constraints

Celles des lots [1](2026-10-06-web-refonte-lot1-fondations.md) et
[2](2026-10-06-web-refonte-lot2-tableau-de-bord.md). Branche `feat/web-refonte-lot3`, empilée
sur `feat/web-refonte-lot2` (PR #93).

## Écart assumé avec la spec

D140 prévoit des tuiles « avec leur écart ». `SeanceDetail` ne porte pas les totaux de la séance
précédente : les tuiles montrent durée, volume, séries et records **sans écart** ; la comparaison
se lit série par série (colonne Écart), comme sur le mobile. Ajouter l'écart demanderait l'API.

## Tâches

- [ ] **1. Calculs (TDD)** — `grouperParMois(seances, fuseau)` → `{ cle, libelle, seances }[]`
  (« Octobre 2026 », mois civil dans le fuseau, ordre de l'API conservé) ; `texteEcart(ecart)`
  → « +2,5 kg », « −1 rep », « +2 reps », « = ». Commit.
- [ ] **2. Liste** — `liste-seances.tsx` refait : en-tête « Séances » (titre, total), groupes par
  mois, entrée = nom, pastille record (`nbRecords`), date courte · durée · volume · séries,
  aperçu des exercices (« A, B, C + n »). « Afficher plus » garde la pagination. ↑ / ↓ passent
  d'une séance à l'autre (hors champ de saisie). Commit.
- [ ] **3. Détail** — `detail-seance.tsx` refait : titre, date et heures, « Ouvrir la routine »
  (si `routineId`), menu « ⋯ » → Supprimer (`ConfirmerSuppression` généralisée par
  `description`, `DELETE`, invalide `seances`, `stats`, `records`, retour à `/seances`) ; tuiles
  durée · volume · séries · records ; note ; une carte par exercice (vignette blanche, nom,
  « Fiche » → `/exercices/$slug`, note) avec la table Série · Charge × reps · La fois d'avant ·
  Écart · Record. Commit.
- [ ] **4. Vérifier, documenter, PR** — build, typecheck, test, lint, knip ; Playwright (fil,
  détail, ↑ ↓, suppression annulée, sombre et clair) ; `interface-web.md` ; PR empilée.
