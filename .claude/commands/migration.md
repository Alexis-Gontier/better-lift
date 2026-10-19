---
description: Crée et applique une migration Prisma sur la bonne branche Neon
argument-hint: <nom_de_la_migration>
allowed-tools: Bash, Read, Edit, Glob, Grep
---

Crée la migration Prisma nommée **$1**.

**Avant toute chose, vérifie sur quelle branche Neon pointe le `.env`** (par le MCP Neon, projet
`late-bar-51472267`, `database_name: "betterlift"` — l'agent ne lit pas le `.env`) :

| Branche | Rôle |
|---|---|
| `dev` (`br-royal-sun-asz4aev0`) | On migre ici pendant le développement. |
| `production` (`br-purple-thunder-as4jo5s8`) | Jamais à la main : le build de production applique les migrations lui-même à la fusion sur `main`. |

Le `.env` porte deux URL : `DATABASE_URL` (poolée, `-pooler`) pour l'exécution et `DIRECT_URL`
(directe) pour les migrations.

Déroulé :

1. Vérifie la branche visée ; **arrête-toi et demande si c'est `production`**.
2. Modifie `packages/db/prisma/schema.prisma`. La migration doit rester **additive** (colonne
   nullable, table neuve) : pendant le build de prod, l'ancien déploiement tourne déjà sur le
   nouveau schéma. Renommer ou supprimer se fait en deux fusions.
3. `pnpm db:migrate --name $1`
4. Relis le SQL généré — en particulier toute colonne `NOT NULL` sans valeur par défaut sur une
   table qui contient déjà des lignes.
5. `pnpm db:generate` (Prisma 7 ne régénère plus le client à la migration), puis
   `pnpm typecheck` pour voir ce que le changement casse.

**Changer de branche Neon impose de redémarrer le serveur de développement** : le `PrismaClient`
est mis en cache sur `globalThis` hors production.
