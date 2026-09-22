# better-lift

Tracker de musculation personnel (2–3 comptes), web + mobile. **L'application est en français.**

La conception fait foi : [`docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md`](docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md).
Lis-la avant toute décision d'architecture — elle porte le registre des décisions (D1–D22)
et la liste des pièges déjà payés.

## État

Le dépôt repart de zéro le 22 septembre 2026. Il ne contient pour l'instant que la conception,
le setup Claude Code et les skills. **Aucun code applicatif.**

Distant : `Alexis-Gontier/better-lift` (privé), **réinitialisé** — `main` porte le nouvel
historique. Le code de la V1 reste consultable sur la branche **`v1`** et le tag **`v1-final`**
(`b5f0a39`) ; il sert de référence et n'est pas repris.

Le ruleset « main protégée » est **désactivé** : ses trois checks requis désignent l'ancienne CI.
À remettre au lot 0, avec les noms à jour — les deux doivent bouger ensemble, sinon toute PR
devient immergeable.

## Stack

| Brique | Choix |
|---|---|
| Web | Vite + React 19 (SPA), TanStack Router + TanStack Query, shadcn/ui |
| Mobile | Expo SDK 57, Expo Router, TanStack Query, MMKV |
| API | Hono, Better Auth, Node 24 — fonction Vercel en production |
| Base | Prisma 7 + PostgreSQL sur Neon (Francfort) |
| Monorepo | pnpm ≥ 11.18.0 + Turborepo |
| Qualité | Biome, Lefthook, Knip, Vitest |

Paquets : `apps/{web,mobile,api}` et `packages/{db,shared,api-client}`.

## Règles d'architecture

- **Le web et le mobile passent tous deux par l'API.** Jamais d'accès direct à la base depuis un client.
- `packages/shared` n'importe **jamais** Prisma, React ni une API de plateforme. TypeScript pur,
  `Intl` toléré pour les dates.
- La logique métier vit dans `services/` côté API et ne connaît jamais le contexte Hono.
- **L'interface n'est pas partagée** entre web et mobile. Deux surfaces, deux ergonomies.
- Contrat typé par **Hono RPC**, pas d'OpenAPI. Zod dans `shared` est la source unique.

## Interface

- **Coquille web à trois panneaux** : navigation, liste, détail — redimensionnables, tailles
  persistées, et **le détail ouvert vit dans l'URL** avec les filtres (paramètres de recherche
  typés de TanStack Router). Un rechargement retombe au même endroit.
- `Resizable` et `Command` de shadcn fournissent les panneaux et le `Cmd+K` : rien à écrire.
- **Sombre par défaut, clair accessible.** Hiérarchie par échelle de surfaces et quatre niveaux
  d'encre, jamais d'ombres ni de seconde couleur. Contraste AA : 4,5:1, ou 3:1 dès 24 px.
- **La densité vaut pour le web seulement.** Le mobile partage la palette, pas l'échelle : en
  salle il faut des cibles larges et un contraste franc.
- **L'interface passe avant la logique** : on dessine et on valide un écran avant de lui brancher
  des données — avec ses **quatre états** dès le dessin (vide, chargement, erreur, nominal), sans
  quoi le branchement les découvre trop tard.

## Commandes

```
pnpm dev          # les trois applications
pnpm build        # turbo build
pnpm typecheck
pnpm test         # vitest
pnpm lint         # biome check depuis la racine (pas de tâche turbo)
pnpm knip
pnpm db:migrate   # prisma migrate
pnpm db:seed
```

`/verif` enchaîne build, typecheck, test, lint et knip.

## Pièges qui coûtent cher

Tous ont déjà été payés une fois. La section 13 de la conception les détaille.

- **Dates** : découpage dans le fuseau du profil, **jamais en UTC**. Le samedi 21 h à Paris est
  déjà dimanche en UTC. L'arithmétique civile vit dans `shared`.
- **Clés de cache TanStack Query** : toute donnée présente dans la clé de lecture doit l'être
  dans la clé d'écriture, sinon l'écran affiche les anciennes valeurs après un enregistrement réussi.
- **Unités** : tout affichage de charge passe par le système d'unités du profil.
- **Formulaires** : tester `!data` sans tester l'état de chargement laisse le squelette pour toujours.
- **MMKV 4** : `createMMKV({ id })` et non `new MMKV()`, `storage.remove()` et non `delete()`,
  `react-native-nitro-modules` en dépendance de pair. **Aucun plugin de configuration** — l'ajouter
  casse `expo export` avec une erreur qui ne mentionne jamais `app.json`.
- **Builds natifs** : `expo run:android` est bloqué sur cette machine (chemins pnpm trop longs
  pour CMake). Les builds natifs passent par **EAS**. L'émulateur ne sert qu'à exécuter.
  Sur émulateur, l'API se joint en `http://10.0.2.2:3001`.
- **`.tsbuildinfo` périmé** après des rebases : reconstruire paquet par paquet, de bas en haut.
- **Correctifs d'audit** : sur une branche dédiée partant de la principale, jamais dans une
  branche de fonctionnalité.

## Conventions

- Commits en **Conventional Commits**, en français.
- Branches `feat/…`, `fix/…`, `chore/…`.
- Jamais de secret dans le code : tout passe par `.env`, gitignoré.

## Skills

22 skills sont installées en **fichiers réels** sous `.claude/skills/`, commitées.
**Jamais de dossier `.agents/`.** Installation :

```
npx skills add <owner/repo> --skill <nom> --agent claude-code --copy -y
```

Trois pièges de cette CLI :

- `--skill` attend le **`name:` du frontmatter**, pas le nom du dossier. Les deux diffèrent
  parfois (`tanstack-router` sur disque, `tanstack-router-best-practices` dans le frontmatter).
- Un mauvais nom **échoue en silence**, avec une sortie qui ressemble à un succès. Vérifier
  `.claude/skills/` après chaque installation.
- `--skill a,b,c` ne marche pas : une invocation par skill.

**Ne jamais laisser Biome ou Knip toucher `.claude/`** : certaines skills embarquent des `.mjs`
que le formatage réécrirait, ce qui ferait diverger le hash de `skills-lock.json`. Quand
`biome.json` et `knip.json` seront créés, ils doivent porter les exclusions correspondantes.

## MCP

Neon et Context7 viennent des **plugins** déjà configurés sur cette machine — pas de `.mcp.json`
dans le dépôt, qui ferait doublon et imposerait une clé API en clair.

- **Neon** : projet `better-lift`, id `late-bar-51472267`, Francfort, PostgreSQL 18.
  Branches `production` (catalogue semé, 1 324 exercices) et `dev` (archivée, à réactiver).
- **Context7** : à utiliser pour toute question de version sur une bibliothèque, plutôt que
  de répondre de mémoire.
