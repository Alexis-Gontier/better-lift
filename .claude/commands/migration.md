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
| `dev` (`br-royal-sun-asz4aev0`) | C'est ici qu'on migre pendant le développement (base `betterlift`). |
| `production` (`br-purple-thunder-as4jo5s8`) | Jamais migrée à la main : le build Vercel de production applique `prisma migrate deploy` à la fusion sur `main` (voir `deploiement-ci.md`). |

Le `.env` porte deux URL distinctes : `DATABASE_URL` (poolée, `-pooler`) pour l'exécution et
`DIRECT_URL` (directe) pour les migrations. Prisma utilise la seconde.

Déroulé :

1. Vérifie que le `.env` vise `dev`. S'il vise `production`, arrête-toi et demande.
2. Modifie `packages/db/prisma/schema.prisma`.
3. `pnpm db:migrate --name $1`
4. Relis le SQL généré avant de le considérer comme acquis — en particulier toute colonne
   ajoutée en `NOT NULL` sans valeur par défaut sur une table qui contient déjà des lignes.
5. `pnpm db:generate`, puis `pnpm typecheck` pour voir ce que le changement casse.
6. **La migration doit rester additive** (colonne nullable, table neuve) : la prod migre pendant
   que l'ancien déploiement tourne encore. Renommer ou supprimer se fait en deux fusions.

**Changer de branche Neon impose de redémarrer le serveur de développement** : le `PrismaClient`
est mis en cache sur `globalThis` hors production, et garde donc l'ancienne connexion.
