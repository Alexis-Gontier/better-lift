# better-lift — conception

L'état présent du produit et de son architecture. Les choix un par un, avec leur numéro, sont
dans le [registre des décisions](decisions.md) ; le déploiement dans
[`deploiement.md`](deploiement.md).

## Pourquoi ce projet

Une V1 complète a existé (juillet–août 2026), dimensionnée pour un SaaS ouvert. Le produit a été
recadré en **application personnelle à deux ou trois comptes**, et le dépôt redémarré le
22 septembre 2026. La règle de chaque arbitrage depuis : **pas du code plus propre, beaucoup
moins de code.** Rien ne doit faire comme s'il y avait un public, une échelle ou une
monétisation. Le code de la V1 reste sur la branche `v1` (tag `v1-final`), pour référence.

**Prochaine étape : l'épreuve du jalon** — abandonner Hevy un mois complet. Ce qui manquera
guidera la suite.

## Produit

Préparer ses séances, les remplir sans friction pendant l'effort, voir sa progression.

| Surface | Rôle | Écrans |
|---|---|---|
| **Mobile** | L'outil de salle : une main, entre deux séries, parfois sans réseau | Routines (à lancer, séance vide, page d'une routine), Historique (séances passées en lecture, comme le web, D345), séance, fin de séance, Profil, connexion |
| **Web** | L'atelier : préparer et relire, grand écran et clavier. Pas de séance en direct | Accueil (tableau de bord, D330), Routines (dossiers, éditeur), Historique, Exercices, Paramètres |

### Vocabulaire

Identique dans le code, l'API et l'interface.

| Terme | Code | Définition |
|---|---|---|
| Exercice | `Exercise` | Mouvement du catalogue (pas d'exercice personnel) |
| Routine | `Routine` | Modèle de séance : exercices ordonnés et séries cibles |
| Dossier | `Dossier` | Rangement de routines |
| Séance | `Seance` | Séance réellement faite, horodatée — un **instantané** : modifier ou supprimer sa routine ne la touche pas |
| Série | `RoutineSerie`, `SeanceSerie` | Cible dans une routine, réalisée dans une séance |
| Record | — | Meilleure performance sur un exercice, **dérivée à la lecture**, jamais stockée |

### Hors périmètre pour l'instant

Exercices personnels, mensurations et poids de corps, import Hevy, calcul des disques, méthodes
de progression, notifications push, social, nutrition, programmes tout faits, e-mails
(vérification d'adresse, mot de passe oublié). Ils reviennent si l'épreuve les réclame.

## Architecture

```
apps/
  web/        Vite + React 19 (SPA), TanStack Router + Query, shadcn/ui — servi sous /app
  mobile/     Expo SDK 57 (Expo Go), Expo Router, Reusables + Uniwind, TanStack Query, AsyncStorage
  api/        Hono + Better Auth — Node en dev, fonction Vercel en prod
packages/
  db/         Prisma 7 : schéma, migrations, catalogue et semis
  shared/     Zod et calculs purs, communs aux trois applications
  api-client/ client Hono RPC typé ; l'URL de base vient de l'appelant
  config/     tsconfig.base.json
```

- **Une seule source de vérité, l'API.** Web et mobile consomment les mêmes routes ; aucun
  client ne touche la base.
- **Contrat typé par Hono RPC**, schémas Zod dans `shared`. L'API : `routes/` valide et parle
  HTTP, `services/` porte le métier sans connaître Hono (testable directement), les dépôts et le
  lecteur de session sont injectés.
- **`shared` est du TypeScript pur** : ni Prisma, ni React, ni API de plateforme ; `Intl` toléré
  pour les dates. La logique d'écran commune y vit aussi (brouillon de routine, séance, pavé).
- **L'interface n'est pas partagée** : un éditeur au clavier et une saisie au pouce n'ont rien en
  commun.
- **Déploiement** : un projet Vercel, même origine pour le SPA (`/app`) et l'API (`/api`), donc
  aucun CORS en production. Le mobile est un APK EAS installé à la main.

## Données

Prisma 7 sur PostgreSQL (Neon, Francfort). Modèles : Better Auth (`User`, `Session`, `Account`,
`Verification`, `RateLimit`), `Exercise` (catalogue aplati : `name` anglais, `nomFr`,
`nomRecherche`), `Dossier`, `Routine` → `RoutineExercice` → `RoutineSerie`, `Seance` →
`SeanceExercice` → `SeanceSerie`, `Preferences`.

- Charges en kg ; l'affichage passe par le système d'unités.
- Aucun total stocké sur une séance, aucune table de records : tout se dérive. On matérialisera
  le jour où une mesure le justifie.
- L'identifiant d'une séance vient du client : l'envoi est idempotent et la file peut rejouer.
- Le catalogue (1 316 exercices) vient de
  [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) ; les noms
  français sont écrits dans `packages/db/catalogue/noms-fr.json`. Les animations appartiennent à
  Gym visual : affichées depuis le dépôt du dataset, jamais copiées.

## Authentification

Better Auth, une instance côté API : cookie pour le web, jeton porteur (`@better-auth/expo`) pour
le mobile. E-mail et mot de passe seulement. **L'inscription est fermée par `SIGNUP_ALLOWLIST`**,
vérifiée sur la création d'utilisateur elle-même ; le démarrage échoue si la liste est vide. Les
tentatives de connexion sont limitées en base (production seulement).

## La séance ne se perd jamais

Le cœur du mobile, éprouvé sur émulateur.

- Le brouillon vit en AsyncStorage sous une clé unique et transite **par le disque**, jamais par
  un paramètre de route : démarrer et reprendre après un plantage sont le même chemin.
- Une séance en cours n'est jamais écrasée : la vérification se refait à l'appui.
- **Chrono et repos se calculent depuis des heures stockées**, jamais par un compteur.
- File d'envoi : terminer met en file avant d'effacer le brouillon ; une séance en attente quitte
  l'écran, une séance refusée y revient avec son message. L'envoi se relance au retour du réseau
  et du premier plan.
- Hors ligne, démarrer, ajouter un exercice et terminer fonctionnent : routines, catalogue,
  précédents et préférences sont gardés dans un cache persistant filtré.

Deux écarts délibérés : le corps de `POST /seances` n'est pas strict, et un exercice archivé y est
accepté. Perdre un entraînement réel est pire qu'un champ ignoré.

## Interface

- **Une couleur pour l'action et le record, distinguées par la forme** : l'action est un aplat,
  le record un contour (texte coloré sur fond teinté, flèche montante). Le danger a sa couleur,
  qui ne porte ni l'un ni l'autre. Sur le mobile, cette couleur est l'**orange** (D161).
- **Le web est un wireframe shadcn en gris** (Inter, thème neutre) : son style sera décidé
  après l'épreuve. La seule couleur porteuse de sens y est le type de série, comme dans Hevy.
- **Un token par rôle, deux valeurs** (sombre / clair) ; contraste AA (4,5:1, 3:1 dès 24 px).
- **Quatre états par écran** (vide, chargement, erreur, nominal), dessinés dès le départ. Sur le
  web, `?etat=` force chacun.
- La densité est pour le web ; le mobile garde des cibles de 48 et un contraste franc.

## Qualité

- Biome (format et lint), Lefthook (Biome sur les fichiers indexés, commitlint), Knip (code mort).
- Vitest, en priorité sur `shared` et les services de l'API — là où un test attrape vraiment
  quelque chose. Playwright de bout en bout pour le web (`apps/web/e2e/`).
- L'interface se vérifie en la faisant tourner : les défauts marquants de la V1 (volume affiché
  sans les unités, formulaire bloqué sur son squelette) étaient invisibles aux tests.
- CI : un job `Qualité · typecheck · test · build` requis sur `main`, protégée (PR et squash).

## Objectifs

| Critère | Cible |
|---|---|
| Saisie d'une série (mobile) | Moins de 2 interactions, retour sous 150 ms |
| Démarrage à froid (mobile) | Moins de 2 s |
| Séance hors ligne | Entièrement fonctionnelle, envoi au retour du réseau |
| Lectures de l'API | p95 sous 300 ms |
| Hébergement | Union européenne, coût nul |
