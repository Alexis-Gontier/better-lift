# better-lift

Tracker de musculation personnel (2–3 comptes), web + mobile. **L'application est en français.**

La conception fait foi : [`docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md`](docs/superpowers/specs/2026-09-22-better-lift-redemarrage-design.md).
Lis-la avant toute décision d'architecture — elle porte le registre des décisions (D1–D29)
et la liste des pièges déjà payés.

## État

Le dépôt repart de zéro le 22 septembre 2026. **Les lots 0 à 2 sont fusionnés**, ce qui clôt le
plan `docs/superpowers/plans/2026-09-22-lots-0-2-socle-et-interface.md` :

- **Lot 0** — le monorepo tient debout, les trois applications démarrent, et la chaîne
  émulateur → Metro → API → Neon est prouvée de bout en bout.
- **Lot 1** — la coquille web : tokens des deux thèmes, trois panneaux redimensionnables dont
  les tailles survivent au rechargement, palette `Cmd+K`, bascule de thème.
- **Lot 2** — les trois écrans web dessinés sur données factices : catalogue, routines,
  historique, chacun avec ses quatre états.

**Le lot 3 n'est pas encore planifié**, et c'est voulu : les lots 3 à 7 dépendent de ce que le
dessin des écrans a appris. Prochaine étape : Better Auth, liste blanche, connexion web et mobile.

Distant : `Alexis-Gontier/better-lift` (privé), **réinitialisé** — `main` porte le nouvel
historique. Le code de la V1 reste consultable sur la branche **`v1`** et le tag **`v1-final`**
(`b5f0a39`) ; il sert de référence et n'est pas repris.

`main` est **protégée** : PR obligatoire, squash seul, et un check requis nommé **exactement**
`Qualité · typecheck · test · build`. Ce nom est celui du job dans `.github/workflows/ci.yml` :
**les deux doivent bouger ensemble**, sinon toute PR devient immergeable. Ne jamais pousser
directement sur `main`.

La CI n'a pas de base de données. Les étapes qui chargent `packages/db/prisma.config.ts` —
`prisma generate` et `pnpm knip`, et elles seules — reçoivent une URL PostgreSQL factice, jamais
contactée. Toute nouvelle étape qui touche cette configuration en aura besoin aussi : le piège
ne se voit pas en local, où le `.env` existe.

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
- **`AppShell` est monté par chaque route, jamais par `__root.tsx`.** Seule la route sait s'il y
  a un détail à ouvrir, et la coquille change son jeu de panneaux — donc sa clé de persistance —
  selon qu'il y en a un. Montée dans la racine, elle imposerait une coquille imbriquée.

## Interface

- **Coquille web à trois panneaux** : navigation, liste, détail — redimensionnables, tailles
  persistées, et **le détail ouvert vit dans l'URL** avec les filtres (paramètres de recherche
  typés de TanStack Router). Un rechargement retombe au même endroit.
- `Resizable` et `Command` de shadcn fournissent les panneaux et le `Cmd+K` : rien à écrire.
- **Le permanent est jointif, le passager flotte.** Les trois panneaux se touchent, séparés par
  un filet de 1 px. L'élévation — flou, ombre portée, voile — est réservée à ce qui est
  momentané : palette, menus, dialogues. **Si ça flotte, ça se ferme.**
- **Sombre par défaut, clair accessible.** Hiérarchie par échelle de surfaces et quatre niveaux
  d'encre. Contraste AA : 4,5:1, ou 3:1 dès 24 px.
- **Une seule couleur : le lime sourd `#a8cf45`.** Elle porte l'action ET le record, donc la
  distinction se fait **par la forme** : l'action est un **aplat** (fond lime, texte sombre), le
  record est un **contour** (lime en texte sur fond teinté, flèche montante). Invariant.
- **Un token par rôle, deux valeurs par token.** `--accent` (aplat) reste `#a8cf45` dans les deux
  thèmes ; `--accent-ink` (lime en texte) passe à `#5c7a14` en clair — sur blanc, `#a8cf45`
  tombe sous 2:1. Jamais de couleur en dur réutilisée dans les deux registres.
- **Les primitives shadcn parlent leur propre vocabulaire de rôles**, traduit vers les tokens du
  projet dans `@theme inline`. **Un rôle non déclaré n'émet aucune règle, en silence** — le
  défaut ne se voit ni à la lecture ni au typecheck. L'aplat de la doctrine est `bg-primary` /
  `text-primary-foreground` ; `accent`, qui chez shadcn désigne la **surface de survol** et non
  la marque, pointe vers `--surface-3`. Ne jamais rendre `bg-accent` au lime : chaque survol de
  bouton fantôme deviendrait un aplat de marque.
- **`destructive` n'est pas traduit, et c'est une décision en attente.** La doctrine ne connaît
  qu'une couleur ; lui en donner une seconde relève de la conception. En attendant, la variante
  `destructive` de `button.tsx` et l'`aria-invalid` de `input.tsx` sont **sans effet, en
  silence**. À trancher avant les premiers formulaires.
- **La densité vaut pour le web seulement.** Le mobile partage la palette, pas l'échelle : en
  salle il faut des cibles larges et un contraste franc.
- **L'interface passe avant la logique** : on dessine et on valide un écran avant de lui brancher
  des données — avec ses **quatre états** dès le dessin (vide, chargement, erreur, nominal), sans
  quoi le branchement les découvre trop tard.
- **Les quatre états sont atteignables depuis l'URL** : `?etat=chargement`, `?etat=erreur` et
  `?etat=vide` sur chaque écran, derrière `import.meta.env.DEV` — éliminés du bundle de
  production. `vide` vide le jeu de données plutôt que de substituer un composant, pour que
  l'écran rende son propre état vide par son chemin de code réel. Tout nouvel écran les porte :
  un état qu'on ne peut atteindre est un état qu'on ne revérifiera pas après le branchement.

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
- **Versions verrouillées par Expo** : le SDK 57 fixe **TypeScript 6.0.3** et **React 19.2.3**
  pour tout le monorepo — c'est le consommateur le plus contraint qui décide, et seul le mobile
  l'est. Ne pas monter TypeScript en 7 tant qu'Expo ne suit pas : `expo-doctor` le refuse, et à
  partir du client d'API partagé le même code serait typé par deux compilateurs différents.
  `@types/react` est épinglé en version **exacte** (`19.2.4`) : une plage `^` ne fait jamais
  redescendre pnpm d'une version déjà satisfaisante. Pour toute dépendance Expo ou React Native,
  `npx expo install <paquet>` choisit la version juste — ne jamais recopier une version de
  mémoire. `expo-router` et `expo-status-bar` suivent désormais le numéro du SDK (`~57.x`).
- **Builds natifs** : `expo run:android` est bloqué sur cette machine (chemins pnpm trop longs
  pour CMake). Les builds natifs passent par **EAS**. L'émulateur ne sert qu'à exécuter.
  Sur émulateur, l'API se joint en `http://10.0.2.2:3001`.
- **`.tsbuildinfo` périmé** après des rebases : reconstruire paquet par paquet, de bas en haut.
- **Serveur de dev laissé tournant** : le greffon de routes réécrit `routeTree.gen.ts` en
  arrière-plan, et `core.autocrlf=true` sur cette machine le rend « modifié » sans la moindre
  différence de contenu — ce qui **bloque un `git pull` ou un changement de branche** avec un
  `git diff` vide, donc incompréhensible. Le `.gitattributes` (`* text=auto eol=lf`) règle les
  fins de ligne ; arrêter le serveur avant de fusionner règle le reste. Vérifier que le port
  3000 est libre, `TaskStop` ne tuant pas toujours le processus Vite enfant.
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
