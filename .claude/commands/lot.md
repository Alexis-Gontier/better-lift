---
description: Démarre un lot du plan d'implémentation, sur sa propre branche
argument-hint: <numéro du lot>
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, TodoWrite
---

Démarre le **lot $1**.

1. Relis le découpage en lots, section 11 de
   [`docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md`](../../docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md),
   et le plan d'implémentation s'il existe déjà.
2. Énonce en trois lignes ce que ce lot doit produire et **à quoi on saura qu'il est fini**
   — son critère de sortie, pas une liste de fichiers.
3. Crée la branche : `git checkout -b feat/lot-$1-<sujet>`. Ne travaille jamais directement
   sur la branche principale.
4. Crée une tâche par élément livrable, puis déroule.

Rappels qui valent pour tous les lots :

- **L'UI passe avant la logique** : on dessine et on valide l'écran avant de brancher les données.
  C'est la méthode retenue pour ce projet.
- Les calculs purs de `shared` se font en TDD — c'est le code où un test attrape vraiment
  quelque chose. L'interface, elle, se vérifie en la faisant tourner.
- Un lot n'est pas fini tant que `/verif` n'est pas vert.
- Ne considère jamais un écran comme acquis sans l'avoir vu fonctionner. Les défauts marquants
  de l'ancien projet — le volume affiché sans tenir compte des unités, le formulaire bloqué sur
  son squelette après un échec — étaient tous invisibles à la lecture comme aux tests unitaires.
