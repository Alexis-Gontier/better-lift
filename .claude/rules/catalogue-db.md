---
paths:
  - "packages/db/**"
---

# Base et catalogue

- **Prisma 7 : `migrate dev` ne régénère plus le client.** Après une migration, lancer
  `pnpm --filter @better-lift/db generate`, sinon le client rejette les nouvelles colonnes avec
  une `PrismaClientValidationError` qui ne dit pas pourquoi.
- **Le catalogue porte deux noms.** `name` est l'anglais du dataset, `nomFr` le français affiché,
  `nomRecherche` les deux normalisés (recherche bilingue sans accents). Les noms français sont
  écrits dans `catalogue/noms-fr.json`, par id du dataset : corriger un nom, c'est modifier une
  ligne et relancer `pnpm db:seed`. Le slug dérive du nom anglais et ne bouge jamais.
- **Clés numériques en JSON** : un objet JavaScript range les clés numériques canoniques
  (« 1000 ») avant les autres (« 0001 »). `JSON.stringify` réordonne donc `noms-fr.json` en
  silence : l'écrire ligne à ligne, et vérifier l'ordre sur le texte.
- **Les médias sont affichés, jamais copiés** (D46). Les données du dataset sont MIT, les GIF
  appartiennent à **Gym visual** : `gifUrl` pointe vers le dépôt du dataset, figé sur un commit,
  et « © Gym visual » accompagne chaque animation. Aucun média n'entre dans le dépôt.
- Requêtes MCP Neon : toujours `database_name: "betterlift"` (voir CLAUDE.md, section MCP).
