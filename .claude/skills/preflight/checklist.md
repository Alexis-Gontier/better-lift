# Checklist pré-V0 — better-lift

## 1. Documentation

| Fichier | Marqueur de contenu attendu |
|---|---|
| `README.md` | tableau de stack avec versions, sommaire pointant vers `docs/` |
| `docs/01-produit.md` | roadmap V0 / V1 / V2, critères de sortie |
| `docs/02-architecture.md` | arborescence du monorepo, règle « tout passe par l'API » |
| `docs/03-modele-de-donnees.md` | schéma Prisma complet, section « Invariants » |
| `docs/04-api.md` | liste des endpoints, format d'erreur, idempotence de `POST /v1/workouts` |
| `docs/05-app-web.md` | routes Next, dashboard, éditeur de routines |
| `docs/06-app-mobile.md` | écran de séance active, persistance MMKV, hors ligne |
| `docs/07-conventions.md` | commandes, CI, six points de test critiques |
| `docs/08-dataset-exercices.md` | mapping du dataset, **licence Gym visual** |
| `docs/09-decisions.md` | décisions D1 à D18 |
| `docs/10-versions.md` | tableau de versions, ruptures Prisma 7, décalage NativeWind |

Contrôles transverses :

- Aucun lien interne cassé entre les documents (`docs/09-decisions-ouvertes.md` est un ancien nom, il ne doit plus être référencé).
- Aucune version périmée mentionnée comme cible : `Next.js 15`, `Node 22`, `pnpm 9`, `prisma-client-js` en tant que recommandation. Ces chaînes ne sont acceptables que dans une phrase qui explique explicitement qu'elles sont obsolètes.

## 2. Configuration Claude Code

| Fichier | Marqueur de contenu attendu |
|---|---|
| `CLAUDE.md` | commandes, règles non négociables, section « Pièges de version », **moins de 200 lignes** |
| `.claude/settings.json` | **JSON valide**, `permissions.allow`, `permissions.deny`, `enabledPlugins` |
| `.claude/rules/database.md` | frontmatter `paths:`, générateur `prisma-client`, driver adapter, `prisma.config.ts` |
| `.claude/rules/api.md` | frontmatter `paths:`, `z` importé depuis `@hono/zod-openapi`, 404 vs 403 |
| `.claude/rules/web.md` | frontmatter `paths:`, interdiction d'importer Prisma |
| `.claude/rules/mobile.md` | frontmatter `paths:`, MMKV, chrono calculé depuis `startedAt` |
| `.claude/rules/testing.md` | frontmatter `paths:`, les six points critiques |
| `.claude/skills/new-endpoint/SKILL.md` | frontmatter `description` |
| `.claude/skills/db-migration/SKILL.md` | frontmatter `description` |
| `.claude/skills/preflight/SKILL.md` | ce fichier même |
| `.claude/agents/code-reviewer.md` | frontmatter `name`, `description`, `tools` restreints en lecture seule |
| `.worktreeinclude` | au moins une entrée `.env` |
| `.mcp.json` | JSON valide, secrets par référence `${VAR}` et jamais en dur |

Contrôles transverses :

- Chaque fichier de `.claude/rules/` possède un frontmatter `paths:` avec au moins un glob. Une règle sans `paths:` se charge à **chaque** session et gonfle le contexte : le signaler.
- Chaque `SKILL.md` possède une `description` non vide — c'est elle qui détermine le déclenchement.
- `.mcp.json` ne contient aucun jeton en clair.

## 3. Hygiène du dépôt

| Contrôle | Attendu |
|---|---|
| Dépôt git initialisé | oui |
| `.gitignore` présent | oui |
| `.gitignore` contient `.claude/settings.local.json` | oui |
| `.gitignore` contient `CLAUDE.local.md` | oui |
| `.gitignore` contient `packages/db/src/generated/` | oui |
| `.gitignore` contient `node_modules`, `.next`, `dist`, `.env` | oui |
| `.env.example` présent et documentant toutes les clés | oui |

## 4. Anti-patterns — à traiter en priorité

| Détection | Gravité | Pourquoi |
|---|---|---|
| Un `.env` suivi par git | **critique** | fuite de secrets, présente dans l'historique même après suppression |
| Un jeton ou mot de passe en clair dans `.mcp.json` ou `settings.json` | **critique** | idem |
| `.claude/settings.local.json` suivi par git | élevée | config personnelle imposée à l'équipe |
| `packages/db/src/generated/` suivi par git | moyenne | artefact reconstruit par `pnpm db:generate`, source de conflits |
| `CLAUDE.md` au-delà de 200 lignes | moyenne | l'adhérence baisse ; découper vers `.claude/rules/` |
| Une règle sans frontmatter `paths:` | faible | chargée à chaque session, coût de contexte inutile |
| Un `docs/*.md` vide ou réduit à un titre | faible | faux sentiment de complétude |

## 5. Hors périmètre de ce contrôle

Ces éléments **ne sont pas** attendus avant la V0 et leur absence n'est pas un écart :

- Tout code applicatif (`apps/`, `packages/`)
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`
- Le schéma Prisma réel et les migrations
- La CI GitHub Actions

Ils font partie du périmètre **de** la V0, pas de ses prérequis.
