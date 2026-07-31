---
description: Crée une migration Prisma 7 correctement — modification du schéma, migration nommée, mise à jour des invariants et des tests, vérification de la compatibilité descendante mobile.
argument-hint: <description courte du changement>
---

Prépare la migration pour : `$ARGUMENTS`

Lire d'abord `.claude/rules/database.md` et `docs/03-modele-de-donnees.md`.

Étapes :

1. **Modifier `packages/db/prisma/schema.prisma`.** Respecter les conventions : `Decimal` avec précision explicite pour toute charge ou distance, métrique partout, index sur les colonnes de filtre et de tri.
2. **Vérifier l'impact sur les invariants** listés dans `docs/03-modele-de-donnees.md`. Si un invariant change ou s'ajoute, mettre le document à jour dans la même modification.
3. **Générer la migration** avec un nom explicite : `pnpm db:migrate --name <verbe_objet>`, par exemple `add_superset_group`.
4. **Compatibilité descendante.** Les clients mobiles en version ancienne restent installés des mois. Toute suppression ou renommage de colonne doit passer par une phase intermédiaire : ajouter, double-écrire, migrer les données, supprimer plus tard. Le signaler explicitement si c'est le cas ici.
5. **Mettre à jour** les schémas Zod de `packages/validators` et les types dérivés si le contrat d'API bouge.
6. **Tests** : couvrir le nouveau comportement, et vérifier que les six points critiques de `.claude/rules/testing.md` passent toujours.

Rappels Prisma 7 : générateur `prisma-client` avec `output`, pas d'`url` dans `datasource`, driver adapter obligatoire, `prisma db seed` explicite.

Ne pas lancer `migrate reset` ni `migrate deploy` — les proposer à l'utilisateur s'ils sont nécessaires.
