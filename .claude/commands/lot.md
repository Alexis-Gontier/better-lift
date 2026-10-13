---
description: Démarre un lot d'un chantier planifié, sur sa propre branche
argument-hint: <chantier> <numéro du lot>
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, TodoWrite
---

Démarre le **lot $2 du chantier $1**.

1. Relis la spec du chantier (`docs/superpowers/specs/`) et le plan du lot s'il existe
   (`docs/superpowers/plans/`). Sans plan, écris-le d'abord. Vérifie qu'aucune décision plus
   récente ne révise celles du chantier.
2. Énonce en trois lignes ce que ce lot doit produire et **à quoi on saura qu'il est fini**
   — son critère de sortie, pas une liste de fichiers.
3. Crée la branche `feat/$1-lot$2` depuis `main` (ou depuis le lot précédent s'il n'est pas
   encore fusionné). Ne travaille jamais directement sur la branche principale.
4. Crée une tâche par élément livrable, puis déroule.

Rappels qui valent pour tous les lots :

- **L'UI passe avant la logique** : on dessine et on valide l'écran avant de brancher les données.
- Les calculs purs de `shared` se font en TDD — c'est le code où un test attrape vraiment
  quelque chose. L'interface, elle, se vérifie en la faisant tourner.
- Un lot n'est pas fini tant que `/verif` n'est pas vert.
- Ne considère jamais un écran comme acquis sans l'avoir vu fonctionner. Les défauts marquants
  de l'ancien projet — le volume affiché sans tenir compte des unités, le formulaire bloqué sur
  son squelette après un échec — étaient tous invisibles à la lecture comme aux tests unitaires.
- Si le lot révèle qu'une décision de la spec était mauvaise, le dire et proposer une décision
  qui la révise plutôt que de la contourner en silence.
