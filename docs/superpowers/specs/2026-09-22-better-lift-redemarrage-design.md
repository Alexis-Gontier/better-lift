# better-lift — Conception du redémarrage

> Document de conception, 22 septembre 2026.
> Remplace l'intégralité de la documentation du dépôt précédent.

## 1. Pourquoi ce redémarrage

Une première version de better-lift existe : dépôt `Alexis-Gontier/better-lift`, 37 PR fusionnées entre le 31 juillet et le 6 août 2026, ~41 000 lignes de TypeScript, 507 tests verts. Elle couvrait presque toute une V1 : authentification, catalogue, routines, séances, historique, statistiques, réglages, export RGPD, saisie mobile hors ligne.

Ce n'est pas la dette qui motive de repartir : **c'est un changement de cible**.

L'architecture d'alors était dimensionnée pour un SaaS ouvert — API déployée à part, monorepo à huit paquets, contrat OpenAPI publiable, quotas d'authentification, internationalisation fr/en, étage de préproduction. Le 6 août 2026, le produit a été recadré en **application personnelle à deux ou trois comptes**. Toute cette machinerie payait donc pour des utilisateurs qui n'existeront jamais.

Le redémarrage est rentable pour une seule raison, et il faut la garder en tête à chaque arbitrage : **l'objectif n'est pas du code plus propre, c'est beaucoup moins de code.**

### Ce qui est repris de l'ancien projet

| Actif | État |
|---|---|
| Base Neon `late-bar-51472267` (Francfort, PostgreSQL 18) | Vivante, catalogue intact : 1 324 exercices |
| Schéma Prisma (14 modèles, 6 enums) | Éprouvé en production, repris avec deux suppressions |
| Seed et mapping du dataset | Écrits et testés |
| Chaîne EAS et émulateur Android | Montés sur la machine de développement |
| OAuth App GitHub | Créée et éprouvée |
| Registre des 29 décisions argumentées | Relu, trié : repris, révisé ou abandonné (§ 10) |

### Ce qui est abandonné

Le code applicatif, dans sa totalité. Le nouveau dépôt ne partage avec l'ancien ni historique, ni fichier.

Le dépôt `Alexis-Gontier/better-lift` a été **réinitialisé** le 22 septembre 2026 plutôt que recréé : `main` porte le nouvel historique, et celui de la V1 reste accessible sur la branche **`v1`** et le tag **`v1-final`** (`b5f0a39`, 35 PR fusionnées). Voir D26.

## 2. Produit

### Vision

better-lift permet à quelqu'un qui s'entraîne en salle de **préparer ses séances à l'avance**, de **les remplir sans friction pendant l'effort**, puis de **voir sa progression**.

La répartition entre les deux surfaces est un postulat, pas une contrainte technique :

- **Le web est l'atelier.** On y prépare, on y analyse, on y lit. Grand écran et clavier : c'est là qu'on construit ses routines.
- **Le mobile est l'outil de terrain.** Une main, entre deux séries, parfois sans réseau. La saisie doit tenir en un pouce et un coup d'œil.

### Utilisateurs

Deux à trois comptes, tous connus personnellement. L'inscription est fermée par une liste blanche d'adresses. Il n'y a ni public, ni échelle, ni monétisation — et aucune décision ne doit faire comme s'il y en avait.

### Vocabulaire

Identique dans le code, l'API et l'interface. **L'application est en français, cette liste fait foi.** Le code du web fait exception depuis D198 (`2026-10-14-web-neobrutalism-design.md`) : il est en anglais, son interface reste en français.

| Terme | Code | Définition |
|---|---|---|
| Exercice | `Exercise` | Mouvement du catalogue, ou créé par l'utilisateur |
| Routine | `Routine` | Modèle de séance : exercices ordonnés et séries cibles. Aucune donnée réalisée |
| Séance | `Workout` | Séance réellement effectuée, horodatée |
| Série | `Set` | Une série, cible dans une routine, réalisée dans une séance |
| Record | — | Meilleure performance sur un exercice. **Dérivé à la lecture, jamais stocké** (§ 4) |

Distinction structurante : **une routine est un gabarit, une séance est un instantané indépendant.** Modifier ou supprimer une routine ne doit jamais altérer l'historique.

### Périmètre du premier jalon

> **Historique.** Ce périmètre et la liste « hors périmètre » ci-dessous datent du redémarrage. Plusieurs points écartés ici sont livrés depuis (tableau de bord, calendrier d'activité, supersets, courbes) : ils ne ferment aucune porte. L'état présent est dans `CLAUDE.md`.

Le strict nécessaire pour abandonner Hevy :

- Catalogue d'exercices en français : recherche, filtres, fiche détaillée
- Routines : création, modification, suppression, réordonnancement
- Séance : démarrage depuis une routine ou à vide, saisie série par série, chrono, minuteur de repos, fonctionnement hors ligne intégral
- Historique : liste antéchronologique, détail d'une séance, records dérivés par exercice

### Hors périmètre, assumé

Reporté après le premier jalon : dossiers de routines, vue calendrier, calendrier d'activité (heatmap), tableau de bord et courbes, supersets dans l'interface, exercices personnalisés, mensurations et suivi du poids de corps, import CSV (Hevy compris), calcul des disques à charger, méthodes de progression, notifications push.

> **Revue du 24 septembre 2026.** Le périmètre a été relu à la lumière d'[opengym](https://github.com/alexpcosta/opengym), tracker libre bâti sur le même dataset. Ses fonctions absentes d'ici — poids de corps, heatmap, import Hevy, disques, progression — ont été examinées une à une et **laissées hors du premier jalon**. Deux choses en ont été retenues pour le lot 4 : garder le nom anglais à côté du français, et afficher les animations sans les héberger (D44, D46).

Écarté sans échéance : social, nutrition, cardio GPS, montres connectées, coaching automatique, programmes tout faits.

Supprimé par le recadrage : internationalisation, export RGPD, vérification d'adresse e-mail, quotas d'authentification élaborés, contrat OpenAPI, étage de préproduction.

## 3. Architecture

```
better-lift/
├─ apps/
│  ├─ web/          Vite + React 19 · TanStack Router + Query · shadcn/ui
│  ├─ mobile/       Expo SDK 57 · Expo Router · TanStack Query · AsyncStorage (D55)
│  └─ api/          Hono · Better Auth · Node en développement, fonction Vercel en production
└─ packages/
   ├─ db/           Prisma 7 · schéma · migrations · seed
   ├─ shared/       Zod + calculs purs
   └─ api-client/   client Hono RPC typé + hooks TanStack Query
```

Trois applications et trois paquets, contre trois et six auparavant.

### Une seule source de vérité : l'API

Le web ne parle jamais directement à PostgreSQL. Dès qu'une règle métier existe à deux endroits, elle diverge. Web et mobile consomment strictement les mêmes routes.

Cette contrainte, qui demandait de la discipline avec Next.js et ses Server Components, devient naturelle avec un SPA : il n'existe aucun moyen d'attaquer la base depuis le navigateur.

### Le gain du SPA

Avec Next.js, `api-client` n'était partageable qu'à moitié : les Server Components du web ne consommaient pas les hooks du mobile. **En SPA, web et mobile sont tous deux des clients React purs** et utilisent exactement la même couche de données. Le partage passe de « types et validation » à « types, validation et tout l'accès aux données ».

Ce qu'on perd — rendu serveur et référencement — ne sert à rien pour une application privée derrière une authentification. Disparaissent avec : la frontière `"use client"`, le fichier `proxy.ts`, le cache de Next, les routes rendues dynamiques par la lecture d'un cookie, et `next/font`.

### Protection des routes

Il n'y a plus de garde côté serveur. Le web redirige vers la connexion quand la session est absente, et **la frontière de sécurité réelle est l'API**. C'est plus honnête que l'ancien dispositif : `proxy.ts` ne vérifiait que la *présence* du cookie, jamais sa validité, et laissait donc passer une session expirée jusqu'au premier appel.

### Partage de code

| Paquet | web | mobile | api | Contenu |
|---|:--:|:--:|:--:|---|
| `shared` | ✅ | ✅ | ✅ | Schémas Zod, calculs 1RM et volume, conversions, semaines civiles |
| `api-client` | ✅ | ✅ | — | Client RPC typé, hooks TanStack Query |
| `db` | — | — | ✅ | Prisma seul |

`shared` n'importe jamais Prisma, React, ni aucune API de plateforme. TypeScript pur, testable en isolation. `Intl` est sa seule dépendance tolérée, pour l'arithmétique des dates.

**L'interface n'est pas partagée.** `react-native-web` impose un dénominateur commun qui dégrade les deux plateformes, et les interactions d'un éditeur de routines au clavier n'ont rien de commun avec une saisie de série au doigt.

### Déploiement

Un seul projet Vercel sert le SPA en statique et l'API en fonction sur `/api/*`. **Même origine, donc aucun CORS en production** ; la configuration d'origines de confiance de Better Auth ne sert qu'en développement, où Vite et l'API occupent deux ports distincts.

Le mobile n'est pas distribué par les magasins d'applications : APK universel produit par EAS et installé directement. Les artefacts EAS expirent au bout de quatorze jours.

### La coquille du web

**Trois panneaux : navigation, liste, détail** — la structure de Linear et de claude.ai, retenue après comparaison de quatre maquettes.

```
┌──────────┬────────────────────┬──────────────┐
│   nav    │       liste        │    détail    │
│  ~228px  │     flex-grow      │    ~390px    │
└──────────┴────────────────────┴──────────────┘
      ↕ poignées redimensionnables, tailles persistées
```

Elle est retenue pour une raison précise : **les trois écrans principaux sont des listes** — le catalogue, les routines, l'historique. Avec un détail en pleine page, consulter un exercice fait perdre la liste et ses filtres, et parcourir le catalogue devient un aller-retour permanent. C'était le défaut de l'ancien projet et c'est celui de Hevy.

Le coût assumé : un détail étroit, où les graphiques restent petits.

Trois mécaniques viennent avec, et aucune n'est à écrire :

- **Panneaux redimensionnables** — `Resizable` de shadcn, c'est-à-dire `react-resizable-panels`, dont `autoSaveId` persiste les tailles en `localStorage`.
- **Palette de commandes** (`Cmd+K`) — `Command` de shadcn, c'est-à-dire `cmdk`.
- **Le détail ouvert vit dans l'URL**, avec les filtres, via les paramètres de recherche typés de TanStack Router. Un rechargement retombe exactement au même endroit.

Le SPA supprime ici un problème que Next.js imposait : l'ancien projet devait lire le cookie `sidebar_state` **côté serveur** pour éviter que la barre latérale saute de 16 rem au chargement, ce qui rendait dynamiques toutes les routes de la zone connectée. En SPA, `localStorage` est lu avant le premier rendu.

### Registre visuel

**Sombre par défaut, clair disponible et accessible.** Les tokens sont définis pour les deux registres dès le départ, même si le sombre est ce qu'on regarde en salle et le soir.

La hiérarchie vient d'une **échelle de surfaces et de quatre niveaux d'encre** : canvas, trois surfaces, filets de 1 px. C'est la doctrine de Linear, et elle convient à une interface dense.

**Le permanent est jointif, le passager flotte.** Les trois panneaux se touchent, séparés par un filet — aucun pixel perdu en gouttières. L'élévation, elle, est réservée à une seule chose : ce qui est momentané. La palette de commandes, les menus et les dialogues s'élèvent avec flou, ombre portée et un voile qui assombrit le reste. La règle tient en une phrase, ce qui la rend facile à respecter : **si ça flotte, ça se ferme.**

C'est une synthèse des deux références, qui divergent sur ce point précis : la refonte 2026 de VS Code détache toutes ses surfaces et cherche la profondeur par *« transparence, flou et ombres »*, là où Linear colle les siennes et emploie *« une échelle de surfaces plutôt que des ombres »*. Elles convergent en revanche sur trois principes qu'on reprend tels quels : palette réduite, accents rares et stratégiques, interface en couches.

**Une seule couleur : le lime sourd `#a8cf45`.** Désaturé par rapport au lime vif, pour qu'il fatigue moins sur de longues sessions et le soir.

Cette couleur unique porte à la fois l'action et le record, ce qui pose un problème réel : ce sont deux choses opposées — ce qu'on *peut faire* et ce qu'on *a accompli* — et le record est le moment fort du produit. **Il est résolu par la forme, pas par la teinte :**

| Rôle | Traitement |
|---|---|
| **Action** | Aplat de lime, texte sombre dessus |
| **Record** | Lime en texte sur fond transparent teinté, précédé d'une flèche montante |

Un aplat et un contour ne se confondent pas, même à teinte égale. Cette distinction est un invariant : tout nouvel élément d'interface doit s'y ranger.

**Le lime en texte change de valeur selon le thème.** `#a8cf45` sur blanc tombe sous 2:1 — très en dessous des 4,5:1 requis. Il faut donc distinguer deux tokens :

- `--accent` (aplat de fond) : `#a8cf45` dans les deux thèmes, le texte sombre dessus passant largement.
- `--accent-ink` (lime employé comme texte) : `#a8cf45` en sombre, **`#5c7a14`** en clair.

Règle générale qui en découle : **un token par rôle, deux valeurs par token.** Jamais une couleur en dur réutilisée dans les deux registres.

**Cette densité vaut pour le web seulement.** En salle, à bout de bras, entre deux séries, il faut l'inverse : cibles larges, contraste franc, peu d'éléments à l'écran. Le mobile partage la palette pour rester la même application, mais pas l'échelle ni la densité. C'est la traduction visuelle de « le web est l'atelier, le mobile est l'outil de terrain ».

Contraste minimum WCAG 2.1 AA : 4,5:1 sur le texte courant, 3:1 à partir de 24 px.

## 4. Modèle de données

Repris du schéma éprouvé, avec deux suppressions.

| Table | Sort |
|---|---|
| `Exercise` | **Aplatie** : `nomFr` et `instructions` en français portés directement, `name` anglais conservé pour la recherche (D44) |
| `ExerciseTranslation` | **Supprimée** |
| `User` `Session` `Account` `Verification` | Better Auth, inchangées |
| `Routine` `RoutineExercise` `RoutineSet` | Inchangées |
| `Workout` `WorkoutExercise` `WorkoutSet` | Inchangées |
| `PersonalRecord` | **Supprimée** |
| `RoutineFolder` | Hors premier jalon |

### Pourquoi aplatir le catalogue

Une seule langue rend la table de traductions inutile. On y gagne trois fois : plus de jointure sur chaque lecture du catalogue, recherche plein texte plus simple, et surtout **plus de `locale` à traîner dans les clés de cache TanStack Query** — précisément le piège qui, dans l'ancien projet, affichait les anciens chiffres après un enregistrement pourtant réussi.

Le JSON source du dataset reste versionné : rien n'est perdu définitivement.

### Pourquoi supprimer les records

C'était la partie la plus délicate de l'ancien projet. Sa décision D23 imposait un recalcul complet à chaque écriture, y compris à l'ajout, parce qu'un record entretenu de façon incrémentale sait s'ajouter mais **jamais se retirer** quand on corrige une séance passée.

Tout ce chantier disparaît si le record est **dérivé à la lecture**, par une requête d'agrégation sur `WorkoutSet`. Pour trois comptes et quelques milliers de séries, le coût est négligeable. On matérialisera une table le jour où une mesure le justifie, pas avant.

## 5. Contrat entre l'API et les clients

Zod est la source unique. `packages/shared` définit les schémas ; l'API valide ses entrées avec, les clients en tirent leurs types.

**Hono RPC**, et non `@hono/zod-openapi`. L'ancienne décision visait un contrat OpenAPI publiable que personne ne publiera pour trois comptes. Son objection au RPC — l'inférence TypeScript devient pénible passé environ quatre-vingts routes — ne s'applique pas à un périmètre d'une vingtaine de routes. Le RPC donne le typage de bout en bout sans rien générer, et réduit `api-client` à presque rien.

Découpage de l'API : `routes/` fait la validation et l'HTTP, `services/` porte la logique métier et **ne connaît jamais le contexte Hono**, ce qui le rend testable directement.

## 6. Authentification

Better Auth, instance unique côté API, servant le cookie du web **et** le jeton porteur du mobile.

- Adresse e-mail et mot de passe. GitHub en option — l'OAuth App existe déjà. Une OAuth App GitHub n'accepte qu'une seule URL de rappel : la production en demandera une seconde.
- **Inscription fermée par liste blanche d'adresses**, vérifiée avant la création du compte. C'est le point de sécurité du projet : dans l'ancien, `/sign-up/email` est resté ouvert sur Internet.
- **Pas de vérification d'adresse e-mail** : une liste blanche de trois adresses la rend sans objet. Supprime du même coup le besoin d'un service d'envoi transactionnel, et l'arbitrage sur la résidence des données qui allait avec.
- Mobile : `@better-auth/expo` (1.7.2), plugin officiel. Il gère le stockage sécurisé du jeton et le rappel par lien profond — **les deux points jamais éprouvés dans l'ancien projet**.

## 7. Le catalogue français

Les instructions sont déjà traduites dans le dataset. **Les noms d'exercices ne le sont pas** : la ligne française porte encore « Band Bench Press ».

> **Révisé le 24 septembre 2026.** Le glossaire et la traduction générée prévus ici ont été abandonnés au profit d'une simple entrée par exercice. Le détail est dans la conception du lot 4, [`2026-09-23-lot-4-catalogue-francais-design.md`](2026-09-23-lot-4-catalogue-francais-design.md).

**Le nom français s'ajoute, l'anglais reste** (D44). `name` garde le nom du dataset, `nomFr` porte le français affiché, et la recherche porte sur les deux : en salle, on tape aussi bien « bench press » que « développé couché ».

**Le nom français est une donnée, pas le produit d'un moteur** (D45). Un fichier `noms-fr.json` — id du dataset → nom français — est écrit une fois, relu en diff et commité ; le semis le lit. Un test vérifie qu'aucun exercice n'en est absent. Une correction est une ligne modifiée et un semis relancé, jamais une migration.

**Registre retenu : le français d'usage.** Les anglicismes réellement employés en salle sont conservés, parce qu'ils sont ce qu'on tape dans une barre de recherche. Personne ne cherche « flexion des avant-bras » pour trouver un curl.

| Nom d'origine | Retenu |
|---|---|
| Dumbbell Bench Press | Développé couché aux haltères |
| Barbell Deadlift | Soulevé de terre à la barre |
| Cable Triceps Pushdown | Pushdown triceps à la poulie |
| Lever Leg Extension | Leg extension à la machine |
| Assisted Pull-up | Traction assistée |

### Médias

Le dataset fournit une animation 180×180 par exercice, propriété de Gym visual et hors de la licence MIT des données. **Elles sont affichées dès le lot 4, sans être hébergées** (D46) : l'URL pointe vers le dépôt du dataset, figée sur un commit, avec l'attribution « © Gym visual — https://gymvisual.com/ » sous chaque visuel. C'est un choix assumé pour une application privée à trois comptes ; il serait le premier à reprendre si elle s'ouvrait. Si le chargement échoue, les interfaces retombent sur un repli sans visuel.

## 8. L'invariant du mobile

Le seul point où rien ne change, parce qu'il a été prouvé sur émulateur le 4 août 2026 : **une séance en cours ne se perd jamais.**

- Le brouillon vit en **AsyncStorage sous une clé unique** (D55, qui remplace MMKV pour tourner dans Expo Go), et transite **par le disque, jamais par un paramètre de route**. « Démarrer une routine » et « reprendre après un plantage » sont ainsi le même chemin de code, et non deux chemins dont l'un serait rarement exercé.
- Une séance en cours n'est **jamais écrasée** : la vérification se refait au moment de l'appui, pas depuis un état d'interface vieilli.
- **Le chrono se calcule depuis `startedAt`**, jamais par un compteur incrémental. C'est ce qui lui a fait afficher 3:24 au retour d'un `force-stop` de soixante-dix secondes, là où un `setInterval` remis à zéro aurait montré 1:05.
- **File d'envoi** : une séance en attente quitte l'écran de saisie, une séance **refusée** y reste.
- L'enregistrement est **idempotent** : la file peut rejouer sans créer de doublon.

Deux écarts délibérés au reste de l'API, hérités et maintenus : le corps de la création d'une séance n'est **pas** en mode strict, et un exercice archivé reste acceptable dans une séance. Perdre un entraînement réel envoyé par la file est pire qu'accepter un champ ignoré.

## 9. Qualité

- **Biome** (format et lint), **Lefthook** (crochets), **Knip** (code mort). Pas de tâche de lint dans Turborepo : `pnpm lint` appelle Biome depuis la racine.
- **Vitest**, avec une priorité aux calculs purs de `shared` et aux services de l'API — le code où un test attrape vraiment quelque chose.
- Développement piloté par les tests sur la logique métier. L'interface se vérifie en la faisant tourner : les défauts marquants de l'ancien projet — le volume affiché sans tenir compte du système d'unités, le formulaire bloqué sur son squelette après un échec de requête — étaient tous invisibles à la lecture comme aux tests unitaires.
- **Node 24**, **pnpm 11.18.0** au minimum. La 11.13.0 a été retirée par l'amont.

### Outillage de l'agent

Posé le 22 septembre 2026, avant tout code.

- **`CLAUDE.md`** à la racine : stack, règles d'architecture, commandes et pièges hérités.
- **`.claude/settings.json`** : permissions (`pnpm`, `git`, `gh`, `adb`, `eas` autorisés ; les fichiers `.env` et `rm -rf` refusés ; `git push` en confirmation).
- **`.claude/hooks/format.ps1`** : Biome après chaque édition. En PowerShell, parce que sous Windows un hook en forme shell s'exécute par PowerShell et non par bash. Il **ignore `.claude/skills/`** : certaines skills embarquent des `.mjs` que le formatage réécrirait, ce qui ferait diverger le hash de `skills-lock.json`.
- **Trois commandes** : `/verif` (build, typecheck, test, lint, knip, avec le remède au `.tsbuildinfo` périmé), `/lot` (démarre un lot sur sa branche), `/migration` (migration Prisma, avec le garde-fou sur la branche Neon visée).
- **22 skills** en fichiers réels sous `.claude/skills/`, commitées, jamais de `.agents/`. Sources officielles pour Hono, Vite, Vitest, Expo, Prisma, Better Auth, shadcn et Turborepo ; TanStack et React Native viennent de sources tierces vérifiées.

Pas de `.mcp.json` : Neon et Context7 viennent des plugins déjà configurés sur la machine de développement, et les redéclarer imposerait une clé API en clair dans le dépôt.

## 10. Registre des décisions

### Reprises de l'ancien projet

| Nº | Décision | Ancien |
|---|---|---|
| D1 | Base Neon, région UE. Francfort contre Londres : le Royaume-Uni est hors Union européenne depuis le Brexit, couvert par une décision d'adéquation révocable | D4 |
| D2 | Runtime Node 24, pas de Cloudflare Workers — Prisma y ajoute de la complexité sans contrepartie | D5 |
| D3 | Le web passe toujours par l'API | D3 |
| D4 | 1RM estimé par la formule d'Epley — `poids × (1 + reps / 30)`, arrondi à la décimale. **Deux bornes que la formule littérale ne donne pas** : à une répétition le 1RM vaut la charge elle-même (Epley rendrait 103,3 % pour un maximum déjà atteint), et à zéro répétition il vaut 0 | D11 |
| D5 | Le poids de corps est exclu du volume | D12 |
| D6 | Notes de séance : champ libre, pas de structure imposée | D14 |
| D7 | Outillage qualité : Biome, Lefthook, Knip | D19 |
| D8 | Listes mobiles en `FlatList` tant que la pagination suffit | D21 |
| D9 | Un exercice personnalisé se reconnaît à son propriétaire, pas à un booléen. La fonctionnalité est hors du premier jalon ; la décision s'appliquera quand elle arrivera | D22 |
| D10 | File d'envoi : une séance en attente quitte l'écran, une séance refusée y reste | D28 |
| D11 | Supersets : portés par le modèle, absents de l'interface au premier jalon | D8 |

### Révisées

| Nº | Décision | Remplace |
|---|---|---|
| D12 | **Hono RPC** au lieu d'un contrat OpenAPI : personne ne publiera d'OpenAPI pour trois comptes, et l'objection d'échelle au RPC ne tient pas sous vingt routes | D1 |
| D13 | **Records dérivés à la lecture**, table supprimée. Annule tout le dispositif de recalcul complet | D23 |
| D14 | **Français unique, aucune machinerie d'internationalisation.** Annule aussi bien le plan fr/en que le passage à l'anglais seul décidé au recadrage | D29, D31 |
| D15 | **Pas de vérification d'adresse e-mail**, rendue sans objet par la liste blanche. Supprime le besoin d'un service d'envoi transactionnel | D6, D20 |
| D16 | **shadcn/ui conservé, thème repensé.** La palette achromatique et Geist de l'ancien projet ne sont pas reprises | D24, D25 |

### Nouvelles

| Nº | Décision |
|---|---|
| D17 | **Web en SPA Vite, sans rendu serveur.** Aucun besoin de référencement pour une application privée ; disparaissent la frontière client/serveur, `proxy.ts`, le cache de Next et `next/font` |
| D18 | **Un seul projet Vercel** : statique et fonction API sur la même origine, donc aucun CORS en production |
| D19 | **TanStack Router**, pour le typage des routes et surtout des paramètres d'URL — les filtres du catalogue et de l'historique y sont persistés |
| D20 | **Catalogue aplati**, sans table de traductions |
| D21 | **Noms d'exercices en français d'usage.** *Révisée le 24 septembre 2026* : le glossaire est abandonné, les noms sont une entrée écrite par exercice, à côté du nom anglais conservé (D44, D45 au lot 4) |
| D22 | **Inscription fermée par liste blanche d'adresses** |
| D23 | **Coquille web à trois panneaux** — navigation, liste, détail, redimensionnables et persistés. Retenue parce que les trois écrans principaux sont des listes ; le détail en pleine page ferait perdre la liste et ses filtres à chaque consultation |
| D24 | **Sombre par défaut, clair accessible.** Hiérarchie par échelle de surfaces et quatre niveaux d'encre. Densité réservée au web : le mobile partage la palette, pas l'échelle |
| D27 | **Registre hybride : le permanent est jointif, le passager flotte.** Panneaux collés, séparés par un filet ; l'élévation — flou, ombre, voile — est réservée à ce qui est momentané. Synthèse des deux références, qui divergent sur ce point : VS Code 2026 détache toutes ses surfaces, Linear les colle. La règle tient en une phrase : si ça flotte, ça se ferme |
| D28 | **Une seule couleur, le lime sourd `#a8cf45`**, désaturé pour fatiguer moins. Comme elle porte à la fois l'action et le record, **la distinction se fait par la forme** : l'action est un aplat, le record est un lime en texte sur fond teinté avec flèche montante. Invariant à respecter pour tout nouvel élément |
| D29 | **Un token par rôle, deux valeurs par token.** `--accent` (aplat) vaut `#a8cf45` dans les deux thèmes ; `--accent-ink` (lime en texte) passe à `#5c7a14` en clair, faute de quoi le contraste tombe sous 2:1 sur blanc |
| D25 | **L'interface passe avant la logique.** On dessine et on valide un écran avant de lui brancher des données. Réordonne le découpage en lots (§ 11) |
| D26 | **Dépôt `Alexis-Gontier/better-lift` réinitialisé** le 22 septembre 2026 plutôt que recréé. L'historique de la V1 est conservé sur la branche `v1` et le tag `v1-final` (`b5f0a39`). Le ruleset « main protégée » est **désactivé** : ses trois checks requis désignent l'ancienne CI, le réactiver tel quel bloquerait toute PR. À remettre au lot 0, avec les noms à jour |

## 11. Découpage en lots

> **Historique.** Les lots 0 à 7 sont livrés. Chaque chantier suivant a sa spec et un plan par lot dans `docs/superpowers/`.

**L'interface passe avant la logique** (D25) : on dessine un écran et on le valide avant de lui brancher des données. Le découpage suit ce principe — l'interface d'un domaine précède son API, et la coquille, qui est transversale, précède tout le reste.

| Lot | Contenu | Critère de sortie |
|---|---|---|
| **0** | Socle : monorepo, trois applications qui démarrent, Neon rebranchée, CI | `pnpm dev` lance tout, le mobile lit `/health` |
| **1** | **Coquille web** : tokens des deux thèmes, shadcn, trois panneaux redimensionnables, `Cmd+K` | La coquille tient debout, les tailles survivent au rechargement |
| **2** | **Écrans web dessinés** dans la coquille — catalogue, routines, historique — sur données factices | Les écrans sont validés visuellement, avant toute API |
| **3** | Better Auth, liste blanche, connexion web et mobile | Connexion effective sur les deux surfaces |
| **4** | Catalogue français : noms français, migration, seed, API, animations — puis branchement du lot 2 | N'importe quel exercice se retrouve, en français comme en anglais |
| **5** | Routines : API et branchement de l'éditeur | Une séance se prépare à l'avance |
| **6** | **Écrans mobiles dessinés**, puis la séance : API, saisie, chrono, repos, hors ligne | **Un entraînement réel est saisi avec** |
| **7** | Historique et records dérivés | L'historique et les meilleures charges sont consultables |

Le lot 6 est le but ; tout ce qui le précède existe pour lui.

Deux réserves sur cette méthode, à garder en tête plutôt qu'à découvrir : dessiner un écran sur données factices fait manquer les états que seules les vraies données révèlent — liste vide, chargement, échec de requête, libellés trop longs. Et une maquette validée n'est pas un écran fini : le branchement rouvrira des questions. Les lots d'interface doivent donc porter **les quatre états dès le dessin**, pas seulement le cas nominal.

**Critère de sortie global : pouvoir abandonner Hevy pendant un mois complet sans manque bloquant.**

## 12. Objectifs non fonctionnels

| Critère | Cible |
|---|---|
| Saisie d'une série (mobile) | Moins de 2 interactions, retour visuel sous 150 ms |
| Démarrage à froid (mobile) | Moins de 2 s jusqu'à l'écran d'accueil |
| Séance hors ligne | Intégralement fonctionnelle, synchronisation au retour du réseau |
| Lectures de l'API | p95 sous 300 ms |
| Accessibilité web | WCAG 2.1 AA |
| Hébergement | Union européenne, coût nul |

## 13. Pièges hérités, à ne pas repayer

Tous ont été payés une fois dans l'ancien projet. Aucun ne se déduit de la lecture du code.

**Découpage temporel.** Il se fait dans le fuseau du profil, jamais en UTC : une séance du samedi 21 h à Paris est déjà dimanche en UTC en été. L'arithmétique civile vit dans `shared`.

**Unités.** Tout endroit qui affiche une charge doit passer par le système d'unités du profil. Un volume en tonnes à côté de livres, c'est un profil impérial mal servi ; et « t » pour une tonne courte ferait passer 1 000 kg pour 907 kg.

**Formulaires.** Tester `!data` sans tester l'état de chargement laisse le squelette affiché pour toujours quand la requête échoue.

**Clés de cache TanStack Query.** Toute donnée qui entre dans la clé de lecture doit entrer dans la clé d'écriture. L'oubli écrit la réponse à côté de ce que l'écran lit, et l'interface affiche les anciennes valeurs après un enregistrement pourtant réussi.

**MMKV 4** (écarté par D55, gardé pour mémoire si un development build le ramène). `createMMKV({ id })` et non `new MMKV()`, `storage.remove()` et non `delete()`, et `react-native-nitro-modules` est une dépendance de pair obligatoire. **Il n'existe pas de plugin de configuration** malgré ce qu'annonce le `package.json` : l'ajouter fait échouer `expo export` sur une erreur qui ne mentionne jamais `app.json`. L'autolinking suffit.

**Builds natifs.** `expo run:android` est définitivement bloqué sur cette machine : les chemins du magasin pnpm dépassent la limite de CMake et `ninja` tourne en rond. Les builds natifs restent chez EAS ; l'émulateur ne sert qu'à exécuter. L'APK EAS est universel, donc installable tel quel sur un émulateur x86_64. Sur émulateur, l'API se joint en `10.0.2.2`.

**Glisser-déposer imbriqué.** Un contexte unique couvrant deux listes imbriquées exige une détection de collision qui **filtre les cibles de même nature** avant de chercher la plus proche. Sinon le déposé est rejeté en silence — invisible à la souris, révélé seulement au clavier.

**Graphiques.** Une bibliothèque qui anime en JavaScript échappe au bloc `prefers-reduced-motion` de la feuille de style, qui ne pilote que du CSS. L'animation doit être désactivée explicitement.

**Avis de sécurité.** Un correctif d'audit va sur une branche dédiée partant de la principale, jamais dans une branche de fonctionnalité — enterré dans une PR, il rend les autres rouges et interdit de les rebaser sans conflit de fichier de verrouillage.

**Compilation incrémentale.** Après une série de rebases, TypeScript peut se croire à jour sur un `.tsbuildinfo` périmé et échouer sur des symboles pourtant présents dans la source. Le remède est de forcer la reconstruction paquet par paquet, **de bas en haut**.
