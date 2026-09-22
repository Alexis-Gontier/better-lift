---
description: Crée et applique une migration Prisma sur la bonne branche Neon
argument-hint: <nom_de_la_migration>
allowed-tools: Bash, Read, Edit, Glob, Grep
---

Crée la migration Prisma nommée **$1**.

**Avant toute chose, vérifie sur quelle branche Neon pointe le `.env`.** Le projet a deux
branches et elles ne servent pas à la même chose :

| Branche | Rôle |
|---|---|
| `dev` (`br-royal-sun-asz4aev0`) | C'est ici qu'on migre pendant le développement. **Archivée depuis le 13 septembre 2026** — la réactiver avant usage. |
| `production` (`br-purple-thunder-as4jo5s8`) | Porte le catalogue semé. On n'y applique une migration que délibérément, jamais par réflexe. |

Le `.env` porte deux URL distinctes : `DATABASE_URL` (poolée, `-pooler`) pour l'exécution et
`DIRECT_URL` (directe) pour les migrations. Prisma utilise la seconde.

Déroulé :

1. Vérifie la branche visée, et **demande confirmation si c'est `production`**.
2. Modifie `packages/db/prisma/schema.prisma`.
3. `pnpm db:migrate --name $1`
4. Relis le SQL généré avant de le considérer comme acquis — en particulier toute colonne
   ajoutée en `NOT NULL` sans valeur par défaut sur une table qui contient déjà des lignes.
5. `pnpm db:generate`, puis `pnpm typecheck` pour voir ce que le changement casse.

**Changer de branche Neon impose de redémarrer le serveur de développement** : le `PrismaClient`
est mis en cache sur `globalThis` hors production, et garde donc l'ancienne connexion.
