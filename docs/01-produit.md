# 01 — Produit

## Vision

better-lift permet à quelqu'un qui s'entraîne en salle de **préparer ses séances à l'avance** et de **les remplir sans friction pendant l'effort**, puis de **voir sa progression**.

Le postulat de répartition web / mobile :

- **Le web est l'atelier.** On y prépare, on analyse, on lit. Grand écran, clavier, drag & drop : c'est là qu'on construit ses routines et qu'on regarde ses courbes.
- **Le mobile est l'outil de terrain.** Une main, entre deux séries, parfois sans réseau. La saisie doit tenir en un pouce et un coup d'œil.

Les deux partagent le même compte et les mêmes données, en temps réel.

## Personas

| Persona                                          | Besoin dominant                              | Surface principale                          |
| ------------------------------------------------ | -------------------------------------------- | ------------------------------------------- |
| **Alex, pratiquant régulier (3–5 séances/sem.)** | Suivre un programme fixe, battre ses charges | Mobile (séance) + web (ajustements de bloc) |
| **Camille, débutante**                           | Savoir quoi faire, comprendre les exercices  | Mobile, guidée par les routines             |
| **Sam, coach (V2+)**                             | Créer des programmes pour ses clients        | Web                                         |

Le persona coach n'est **pas** ciblé avant la V2 — mais le modèle de données évite de fermer la porte (une routine appartient à un `userId`, l'ajout d'un partage ultérieur ne casse rien).

## Concepts métier

Le vocabulaire doit être identique dans le code, l'API et l'UI.

| Terme                         | Définition                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Exercice** (`Exercise`)     | Mouvement du catalogue (global) ou créé par l'utilisateur (custom). Immuable côté catalogue.                  |
| **Routine** (`Routine`)       | Modèle de séance : une liste ordonnée d'exercices avec des séries cibles. Ne contient aucune donnée réalisée. |
| **Dossier** (`RoutineFolder`) | Regroupement de routines (« Push/Pull/Legs », « Prise de masse hiver »).                                      |
| **Séance** (`Workout`)        | Une séance réellement effectuée, horodatée. Peut être issue d'une routine ou vierge.                          |
| **Série** (`Set`)             | Une série au sein d'un exercice d'une routine (cible) ou d'une séance (réalisé).                              |
| **Superset**                  | Groupe d'exercices enchaînés sans repos, identifié par un `supersetGroup`.                                    |
| **Record** (`PersonalRecord`) | Meilleure performance sur un exercice, par type (1RM estimé, charge max, volume de série…).                   |

Distinction structurante : **une routine est un gabarit, une séance est un instantané indépendant**. Modifier ou supprimer une routine ne doit jamais altérer l'historique.

## Périmètre fonctionnel

### Catalogue d'exercices

- Recherche plein texte, filtres par partie du corps / équipement / muscle cible.
- Fiche exercice : GIF d'animation, muscles primaires et secondaires, instructions pas à pas.
- Exercices personnalisés créés par l'utilisateur.
- Historique et records personnels par exercice.

### Routines

- CRUD, organisation en dossiers, réordonnancement par glisser-déposer.
- Par exercice : notes, temps de repos par défaut, appartenance à un superset.
- Par série : type (échauffement / normale / dégressive / à l'échec), reps cibles, charge cible, RPE cible.
- Duplication d'une routine.
- « Démarrer cette routine » → pré-remplit une séance.

### Séance

- Démarrer depuis une routine ou à vide.
- Chrono de séance persistant (survit à la fermeture de l'app).
- Saisie série par série avec **valeurs de la dernière séance affichées en placeholder** — c'est ce détail qui rend la saisie rapide.
- Minuteur de repos qui se déclenche à la validation d'une série.
- Ajout / suppression / réordonnancement d'exercices en cours de séance.
- Détection automatique des records à l'enregistrement.
- Reprise d'une séance interrompue.

### Historique & statistiques

- Liste des séances, vue calendrier, détail d'une séance.
- Dashboard web : volume hebdomadaire, régularité, répartition par groupe musculaire, records récents.
- Courbe de progression par exercice (charge, volume, 1RM estimé).

### Compte & réglages

- Inscription e-mail/mot de passe + OAuth Google et Apple. Vérification d'e-mail non bloquante (D6).
- Application **gratuite et sans limite** (D16) : pas de plan, pas d'abonnement, rien à modéliser côté facturation.
- Unités kg/lb, langue (fr/en), temps de repos par défaut, visibilité des séances.
- Export de ses données, suppression de compte (RGPD).

## Roadmap

### V0 — Socle technique

**Objectif : `pnpm dev` démarre les trois applications, elles se parlent, la CI est verte.** Zéro fonctionnalité produit.

- [x] Monorepo pnpm + Turborepo, TypeScript strict, Biome (format + lint) et Knip à la racine.
- [x] `apps/api` : Hono avec `GET /health` renvoyant `{ status, version, db, uptimeSec }`, plus `GET /v1/version`.
- [x] `apps/web` : Next.js affichant l'état de l'API (prouve la chaîne web → API).
- [x] `apps/mobile` : Expo affichant le même état (prouve la chaîne mobile → API, y compris depuis un téléphone physique).
- [x] `packages/db` : Prisma 7 sur Neon, seed idempotent du catalogue (1 324 exercices vendorisés).
- [x] Première migration appliquée et catalogue semé sur Neon Francfort.
- [x] `packages/core` consommé par les trois apps — c'est le test réel du partage de code.
- [x] CI GitHub Actions : format + lint + typecheck + test + build, plus un job de bundle Metro et un audit de dépendances.
- [x] Valider pnpm 11 + Metro (aucun `node-linker=hoisted` requis) et Prisma 7 en ESM.
- [x] Spike Better Auth : instance unique côté API, servant le cookie web **et** le bearer token mobile sur la même route protégée. **Reste à éprouver sur appareil** — `expo-secure-store` et le deep link OAuth exigent un development build, voir [doc 09](09-decisions.md).

**Critère de sortie :** un développeur clone le repo et a les trois apps qui tournent en moins de 10 minutes, en suivant uniquement le README.

### V1 — MVP utilisable

- [x] Auth Better Auth : e-mail/mot de passe, vérification d'adresse non bloquante (D6), réinitialisation de mot de passe, quotas d'authentification, `proxy.ts` protégeant la zone connectée, écrans web dédiés. GitHub et Google sont câblés — **il reste à créer les OAuth Apps** pour les éprouver. Apple attend un compte Apple Developer, exigé seulement à la première soumission iOS (doc 04).
- [x] Catalogue d'exercices : recherche, filtres, fiche détail. API en lecture, écrans web (filtres persistés dans l'URL) et mobile. **Les médias ne sont pas encore hébergés** : `MEDIA_BASE_URL` est vide, les deux interfaces basculent donc sur un repli sans visuel (D17).
- [x] Exercices personnalisés : création, modification et archivage. Le web crée et modifie ; le mobile crée et archive, l'édition restant l'affaire de l'atelier. Un filtre d'origine (tous / catalogue / les miens) sépare les deux ensembles sur les deux surfaces.
- [ ] Routines : CRUD complet + dossiers, éditeur web soigné, consultation mobile.
- [ ] Séance : démarrage depuis routine ou à vide, saisie complète, minuteur de repos, enregistrement.
- [ ] Historique : liste + détail d'une séance.
- [ ] Dashboard web : les 4 cartes KPI + volume hebdo + séances récentes.
- [ ] Réglages : unités, langue, repos par défaut.
- [ ] Suppression de compte + export JSON.

**Critère de sortie :** on peut abandonner Hevy pendant un mois complet sans manque bloquant.

### V2 — Profondeur

- Records détaillés, courbes de progression par exercice, 1RM estimé.
- Mensurations et poids de corps.
- Supersets et séries dégressives dans l'UI mobile (le modèle les porte dès la V1 — D8).
- Calculateur de disques, échauffement automatique.
- Import CSV depuis Hevy / Strong.
- Notifications push (rappel de séance, repos terminé en arrière-plan).
- Partage d'une routine par lien.
- Brzycki en option pour le 1RM.

## Hors périmètre (assumé)

**Le social est repoussé au-delà de la V2** (D15) : profils publics, abonnements, fil d'actualité et likes forment un chantier majeur — modération, signalements, RGPD sur données publiées — pour un bénéfice incertain sur un produit d'abord personnel. Le champ `Workout.visibility` et la valeur `FOLLOWERS` existent dès la V1, donc la porte reste ouverte sans coût aujourd'hui.

Également hors périmètre : nutrition, cardio GPS, intégration montres connectées, coaching IA, marketplace de programmes, programmes tout faits (D13). Chacun est un produit à part entière ; les ajouter tôt diluerait le cœur.

## Objectifs non fonctionnels

| Critère                     | Cible                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| Saisie d'une série (mobile) | < 2 interactions, < 150 ms de retour visuel                      |
| Démarrage à froid mobile    | < 2 s jusqu'à l'écran d'accueil                                  |
| Séance hors ligne           | Fonctionnelle intégralement, synchronisation au retour du réseau |
| API p95                     | < 300 ms sur les lectures                                        |
| Accessibilité               | WCAG 2.1 AA sur le web                                           |
| i18n                        | fr + en dès la V1 (le dataset fournit déjà les deux)             |
| RGPD                        | Export et suppression effectifs, hébergement UE                  |
