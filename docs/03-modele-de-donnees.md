# 03 — Modèle de données

## Principes

1. **Tout est stocké en métrique.** Charges en kg, distances en mètres, durées en secondes, mensurations en cm. La conversion kg/lb est une préférence d'affichage, jamais une donnée persistée. Stocker les deux unités garantit des divergences d'arrondi.
2. **Une séance est un instantané indépendant.** `Workout` copie sa structure depuis la routine au démarrage. Supprimer une routine ne touche pas l'historique (`routineId` passe à `NULL`).
3. **Les agrégats coûteux sont dénormalisés** sur `Workout` (volume total, nombre de séries, durée). Recalculés à l'écriture, jamais à la lecture — le dashboard doit rester rapide sans avoir à agréger des millions de séries.
4. **Suppression logique pour les routines** (`deletedAt`), suppression physique pour les séances. Un utilisateur qui supprime une séance veut qu'elle disparaisse.
5. **Charges en `Decimal`, pas en `Float`.** `@db.Decimal(7,2)` : jusqu'à 99 999,99 kg, précision 0,01 (suffisant pour les micro-charges de 1,25 kg et les plaques fractionnaires).

## Schéma Prisma (v7)

> **Prisma 7 casse la configuration héritée.** Générateur `prisma-client` (et non `prisma-client-js`), `output` obligatoire, plus d'`url` dans le bloc `datasource`, driver adapter requis à l'instanciation, et package en ES module. La configuration complète est en [doc 10](10-versions.md) — la lire avant d'écrire la première migration.

```prisma
generator client {
  provider = "prisma-client"          // v7 : plus de "prisma-client-js"
  output   = "../src/generated/prisma" // obligatoire en v7
}

datasource db {
  provider = "postgresql"
  // v7 : url / directUrl / shadowDatabaseUrl vivent dans prisma.config.ts
}

// ─────────────────────────────────────────────
// Énumérations
// ─────────────────────────────────────────────

/// Détermine les champs saisissables pour une série.
enum ExerciseType {
  WEIGHT_REPS          // développé couché : charge + reps
  BODYWEIGHT_REPS      // pompes : reps seules
  WEIGHTED_BODYWEIGHT  // traction lestée : charge additionnelle + reps
  ASSISTED_BODYWEIGHT  // traction assistée : charge soustraite + reps
  REPS_ONLY            // reps seules, sans notion de poids de corps
  DURATION             // gainage : durée
  DURATION_WEIGHT      // farmer walk statique : durée + charge
  DISTANCE_DURATION    // course, rameur : distance + durée
}

enum SetType {
  WARMUP   // exclue du volume et des records
  NORMAL
  FAILURE
  DROP
}

enum BodyPart {
  CHEST
  BACK
  SHOULDERS
  UPPER_ARMS
  LOWER_ARMS
  UPPER_LEGS
  LOWER_LEGS
  WAIST
  CARDIO
  NECK
}

enum UnitSystem {
  METRIC
  IMPERIAL
}

enum Visibility {
  PRIVATE
  FOLLOWERS  // réservé V2
  PUBLIC
}

enum RecordType {
  BEST_1RM          // 1RM estimé le plus élevé
  BEST_WEIGHT       // charge maximale sur une série valide
  BEST_SET_VOLUME   // charge × reps sur une série
  BEST_REPS         // nombre de reps maximal
  BEST_DURATION
  BEST_DISTANCE
}

// ─────────────────────────────────────────────
// Auth — modèles Better Auth
// Générés par `npx @better-auth/cli generate`.
// Ne pas les éditer à la main : les régénérer après
// tout ajout de plugin Better Auth.
// ─────────────────────────────────────────────

model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Champs applicatifs
  username         String?    @unique
  bio              String?    @db.VarChar(300)
  unitSystem       UnitSystem @default(METRIC)
  locale           String     @default("fr")
  timezone         String     @default("Europe/Paris")
  defaultRestSec   Int        @default(120)
  defaultVisibility Visibility @default(PRIVATE)
  onboardedAt      DateTime?

  sessions         Session[]
  accounts         Account[]
  customExercises  Exercise[]
  routineFolders   RoutineFolder[]
  routines         Routine[]
  workouts         Workout[]
  records          PersonalRecord[]
  measurements     BodyMeasurement[]

  @@map("user")
}

model Session {
  id        String   @id
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}

// ─────────────────────────────────────────────
// Catalogue d'exercices
// ─────────────────────────────────────────────

model Exercise {
  id         String       @id @default(cuid())
  /// Identifiant d'origine du dataset ("0001"). NULL pour les exercices custom.
  externalId String?      @unique
  slug       String       @unique
  name       String
  type       ExerciseType @default(WEIGHT_REPS)
  bodyPart   BodyPart
  /// Chaîne libre issue du dataset : "barbell", "dumbbell", "body weight"…
  equipment  String
  /// Muscle cible principal : "pectorals", "lats"…
  target     String
  secondaryMuscles String[] @default([])

  thumbnailUrl String?
  animationUrl String?
  /// Mention de copyright à conserver et à afficher (voir doc 08).
  attribution  String?

  /// Un exercice custom appartient à un utilisateur et n'est visible que par
  /// lui. `ownerId` est la **seule** marque de cette appartenance : le champ
  /// `isCustom` de l'API en est calculé, il n'a pas de colonne (D22).
  ownerId String?
  owner   User?   @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  /// Permet de retirer un exercice du catalogue sans casser l'historique.
  isArchived Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  translations      ExerciseTranslation[]
  routineExercises  RoutineExercise[]
  workoutExercises  WorkoutExercise[]
  records           PersonalRecord[]

  @@index([bodyPart])
  @@index([equipment])
  @@index([isArchived])
  @@index([ownerId])
}

/// Nom et instructions traduits. Le dataset fournit 10 langues ;
/// on n'importe que celles réellement servies (fr, en) pour limiter la taille.
model ExerciseTranslation {
  id           String   @id @default(cuid())
  exerciseId   String
  locale       String   // "fr", "en"
  name         String
  instructions String[] @default([])
  exercise     Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

  @@unique([exerciseId, locale])
  @@index([locale])
}

// ─────────────────────────────────────────────
// Routines (gabarits)
// ─────────────────────────────────────────────

model RoutineFolder {
  id        String    @id @default(cuid())
  userId    String
  name      String    @db.VarChar(120)
  position  Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  routines  Routine[]

  @@index([userId, position])
}

model Routine {
  id       String  @id @default(cuid())
  userId   String
  folderId String?
  name     String  @db.VarChar(120)
  notes    String? @db.Text
  position Int     @default(0)

  /// Dénormalisé pour trier « dernière utilisée » sans jointure.
  lastPerformedAt DateTime?
  performedCount  Int       @default(0)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  folder    RoutineFolder?    @relation(fields: [folderId], references: [id], onDelete: SetNull)
  exercises RoutineExercise[]
  workouts  Workout[]

  @@index([userId, deletedAt])
  @@index([folderId, position])
}

model RoutineExercise {
  id         String @id @default(cuid())
  routineId  String
  exerciseId String
  position   Int
  notes      String? @db.VarChar(500)
  /// Surcharge le repos par défaut de l'utilisateur.
  restSec    Int?
  /// Les exercices partageant la même valeur non nulle forment un superset.
  supersetGroup Int?

  routine  Routine      @relation(fields: [routineId], references: [id], onDelete: Cascade)
  exercise Exercise     @relation(fields: [exerciseId], references: [id], onDelete: Restrict)
  sets     RoutineSet[]

  @@unique([routineId, position])
  @@index([exerciseId])
}

/// Série *cible*. Tous les champs de valeur sont optionnels :
/// une routine peut ne prescrire que le nombre de séries.
model RoutineSet {
  id                String  @id @default(cuid())
  routineExerciseId String
  position          Int
  type              SetType @default(NORMAL)

  targetReps        Int?
  targetWeightKg    Decimal? @db.Decimal(7, 2)
  targetDurationSec Int?
  targetDistanceM   Decimal? @db.Decimal(9, 2)
  targetRpe         Decimal? @db.Decimal(3, 1)  // 1.0 → 10.0

  routineExercise RoutineExercise @relation(fields: [routineExerciseId], references: [id], onDelete: Cascade)

  @@unique([routineExerciseId, position])
}

// ─────────────────────────────────────────────
// Séances (réalisé)
// ─────────────────────────────────────────────

model Workout {
  id        String   @id @default(cuid())
  userId    String
  /// NULL si séance libre, ou si la routine d'origine a été supprimée.
  routineId String?
  title     String   @db.VarChar(120)
  notes     String?  @db.Text

  startedAt DateTime
  endedAt   DateTime?

  // Agrégats recalculés à chaque écriture (voir « Invariants »).
  durationSec   Int     @default(0)
  totalVolumeKg Decimal @default(0) @db.Decimal(12, 2)
  totalSets     Int     @default(0)
  totalReps     Int     @default(0)
  prCount       Int     @default(0)

  visibility Visibility @default(PRIVATE)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  routine   Routine?          @relation(fields: [routineId], references: [id], onDelete: SetNull)
  exercises WorkoutExercise[]
  records   PersonalRecord[]

  @@index([userId, startedAt(sort: Desc)])
  @@index([routineId])
}

model WorkoutExercise {
  id         String @id @default(cuid())
  workoutId  String
  exerciseId String
  position   Int
  notes      String? @db.VarChar(500)
  restSec    Int?
  supersetGroup Int?

  workout  Workout      @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise Exercise     @relation(fields: [exerciseId], references: [id], onDelete: Restrict)
  sets     WorkoutSet[]

  @@unique([workoutId, position])
  @@index([exerciseId])
}

/// Série *réalisée*. `completed = false` signifie que la série était
/// planifiée mais non validée : conservée pour l'affichage, exclue des
/// agrégats et des records.
model WorkoutSet {
  id                String  @id @default(cuid())
  workoutExerciseId String
  position          Int
  type              SetType @default(NORMAL)

  reps        Int?
  weightKg    Decimal? @db.Decimal(7, 2)
  durationSec Int?
  distanceM   Decimal? @db.Decimal(9, 2)
  rpe         Decimal? @db.Decimal(3, 1)

  completed   Boolean  @default(false)
  completedAt DateTime?
  isPr        Boolean  @default(false)

  workoutExercise WorkoutExercise  @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)
  records         PersonalRecord[]

  @@unique([workoutExerciseId, position])
}

// ─────────────────────────────────────────────
// Records & mensurations
// ─────────────────────────────────────────────

/// Une ligne par (utilisateur, exercice, type) : le record *courant*.
/// L'historique complet reste dérivable des WorkoutSet.
model PersonalRecord {
  id         String     @id @default(cuid())
  userId     String
  exerciseId String
  type       RecordType
  /// Valeur normalisée : kg pour les charges, kg pour le 1RM,
  /// unités brutes pour reps / secondes / mètres.
  value      Decimal    @db.Decimal(12, 2)
  /// Contexte lisible : « 100 kg × 5 » plutôt qu'un simple nombre.
  reps       Int?
  weightKg   Decimal?   @db.Decimal(7, 2)

  achievedAt   DateTime
  workoutId    String?
  workoutSetId String?

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise   Exercise    @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  workout    Workout?    @relation(fields: [workoutId], references: [id], onDelete: SetNull)
  workoutSet WorkoutSet? @relation(fields: [workoutSetId], references: [id], onDelete: SetNull)

  @@unique([userId, exerciseId, type])
  @@index([userId, achievedAt(sort: Desc)])
}

model BodyMeasurement {
  id         String   @id @default(cuid())
  userId     String
  measuredAt DateTime

  weightKg   Decimal? @db.Decimal(6, 2)
  bodyFatPct Decimal? @db.Decimal(4, 1)
  /// Mensurations en cm, toutes optionnelles.
  neckCm     Decimal? @db.Decimal(5, 1)
  chestCm    Decimal? @db.Decimal(5, 1)
  waistCm    Decimal? @db.Decimal(5, 1)
  hipsCm     Decimal? @db.Decimal(5, 1)
  bicepLCm   Decimal? @db.Decimal(5, 1)
  bicepRCm   Decimal? @db.Decimal(5, 1)
  thighLCm   Decimal? @db.Decimal(5, 1)
  thighRCm   Decimal? @db.Decimal(5, 1)
  notes      String?  @db.VarChar(500)

  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, measuredAt])
  @@index([userId, measuredAt(sort: Desc)])
}
```

## Champs pertinents selon `ExerciseType`

L'UI et la validation Zod doivent s'aligner sur ce tableau — c'est lui qui décide des colonnes affichées dans la grille de saisie.

| Type | reps | weightKg | durationSec | distanceM |
|---|:--:|:--:|:--:|:--:|
| `WEIGHT_REPS` | ✅ | ✅ | | |
| `BODYWEIGHT_REPS` | ✅ | | | |
| `WEIGHTED_BODYWEIGHT` | ✅ | ✅ (additionnelle) | | |
| `ASSISTED_BODYWEIGHT` | ✅ | ✅ (assistance, soustraite) | | |
| `REPS_ONLY` | ✅ | | | |
| `DURATION` | | | ✅ | |
| `DURATION_WEIGHT` | | ✅ | ✅ | |
| `DISTANCE_DURATION` | | | ✅ | ✅ |

## Invariants

Ces règles sont vérifiées côté service API, dans une transaction, et couvertes par des tests.

1. **Volume.** `totalVolumeKg = Σ (reps × weightKg)` sur les séries où `completed = true` et `type ≠ WARMUP`. Pour `ASSISTED_BODYWEIGHT`, la contribution est nulle (l'assistance n'est pas une charge soulevée). Pour `DURATION` / `DISTANCE_DURATION`, contribution nulle.
2. **Durée.** `durationSec = endedAt - startedAt`, borné à 24 h pour absorber les séances oubliées ouvertes toute la nuit.
3. **Positions.** `position` est contigu et commence à 0 au sein d'un parent. Le réordonnancement réécrit toutes les positions du parent dans la même transaction (une contrainte `@@unique` sur `[parentId, position]` interdit les swaps naïfs — passer par un `DELETE`/`INSERT` ou un décalage en deux temps).
4. **Supersets.** `supersetGroup` est un entier local à la routine ou à la séance. Un groupe contient au moins deux exercices, sinon il est ramené à `NULL` à l'enregistrement.
5. **Records.** Recalculés à la fin d'une séance, uniquement à partir des séries `completed` et non `WARMUP`. Un record n'est mis à jour que si la valeur est strictement supérieure. `WorkoutSet.isPr` est positionné en conséquence.
6. **Suppression de routine.** `deletedAt` est renseigné ; les `Workout.routineId` associés basculent à `NULL` (`onDelete: SetNull`) uniquement en cas de purge physique.
7. **Modification d'une séance passée** (D10). Autorisée. Elle déclenche un **recalcul intégral** des records de chaque exercice touché, reconstruit depuis l'historique complet — pas un ajustement incrémental. C'est le seul moyen correct d'invalider un record devenu caduc, puisqu'il faut alors retrouver le second meilleur. **L'enregistrement et la suppression passent par le même recalcul** (D23) : deux chemins sur la même donnée auraient fini par diverger, et le complet est de toute façon obligatoire.
8. **Exercice référencé.** `onDelete: Restrict` sur `Exercise` : on ne supprime jamais un exercice utilisé dans un historique. Utiliser `isArchived`. C'est pourquoi `DELETE /v1/exercises/:id` **archive** — le verbe HTTP dit l'intention de l'utilisateur, pas ce que fait la base.
9. **Visibilité d'un exercice.** `ownerId IS NULL` = catalogue commun, visible de tous ; renseigné = visible de ce seul utilisateur. La clause est appliquée dans le service, à **chaque** lecture, et un exercice d'autrui répond 404 comme s'il n'existait pas (règle non négociable n°8). Un exercice du catalogue, lui, est visible de tous : tenter de le modifier répond 403, pas 404 — 404 contredirait le `GET` qui vient de réussir, et son existence n'est pas un secret.
10. **Traductions complètes.** Tout exercice a une ligne de `ExerciseTranslation` dans **chaque** locale servie. Les listes étant enracinées sur cette table, un exercice sans traduction dans une locale y devient invisible, sans erreur. Le seed le garantit pour le catalogue, `createExercise` pour les exercices personnalisés — en écrivant le nom saisi à l'identique dans toutes les locales.

## Calcul du 1RM estimé

Formule d'Epley (D11), appliquée uniquement pour `reps` entre 1 et 12 (au-delà, l'estimation n'a plus de sens) :

```
1RM ≈ weightKg × (1 + reps / 30)
```

Brzycki proposé en option dans les réglages :

```
1RM ≈ weightKg × 36 / (37 - reps)
```

L'implémentation vit dans `packages/core`, jamais dupliquée côté client.

## Requêtes à surveiller

| Écran | Requête | Mesure |
|---|---|---|
| Dashboard — volume 12 semaines | agrégation sur `Workout` | index `[userId, startedAt]`, agrégats dénormalisés : pas de jointure sur les séries |
| Historique d'un exercice | `WorkoutSet` → `WorkoutExercise` → `Workout` | index `[exerciseId]` sur `WorkoutExercise`, pagination curseur |
| Placeholder « dernière séance » | dernière série complétée pour cet exercice | requête dédiée au démarrage de séance, mise en cache client pour la durée de la séance |
| Recherche d'exercices | `ILIKE` sur `name` | passer à `pg_trgm` + index GIN dès que le catalogue dépasse quelques milliers de lignes |

## Migrations

- Une migration par PR, nommée explicitement (`20260731_add_superset_group`).
- `prisma migrate dev` en local, `prisma migrate deploy` en CI/CD — jamais `db push` hors prototypage.
- **Prisma 7 a supprimé le seed automatique pendant les migrations.** `prisma db seed` doit être appelé explicitement, en local comme en déploiement. Le script est déclaré dans `prisma.config.ts`, plus dans le `package.json`.
- Toute migration destructive passe par une phase intermédiaire (ajout de la nouvelle colonne, double écriture, backfill, suppression de l'ancienne) : les clients mobiles en version ancienne restent en circulation plusieurs semaines.
