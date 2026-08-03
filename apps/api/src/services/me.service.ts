import { Prisma, prisma } from "@better-lift/db";
import {
  type CurrentUser,
  DATA_EXPORT_VERSION,
  type DataExport,
  type DataExportExercise,
  type DataExportRecord,
  type DataExportRoutine,
  type DataExportWorkout,
  type UpdateMeInput,
} from "@better-lift/validators";

import { toDecimalString } from "../lib/decimal.js";
import { ApiError, notFound } from "../lib/errors.js";

/**
 * Profil et préférences de l'utilisateur connecté (doc 04, § Compte).
 *
 * Aucune fonction d'ici ne prend l'identifiant depuis une entrée client : la
 * route le lit dans `c.get("user")`, posé par le middleware d'authentification
 * (règle non négociable n°8).
 */

/** Ligne telle que la base la renvoie, avant sérialisation du contrat. */
type UserRow = Prisma.UserGetPayload<{ select: typeof SELECTION }>;

/**
 * Sélection explicite plutôt qu'un `include` : les colonnes de Better Auth qui
 * ne concernent pas le client — jetons, comptes liés — n'ont rien à sortir
 * d'ici par inadvertance le jour où le schéma en gagne.
 */
const SELECTION = {
  id: true,
  email: true,
  name: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  username: true,
  bio: true,
  unitSystem: true,
  locale: true,
  timezone: true,
  defaultRestSec: true,
  defaultVisibility: true,
  onboardedAt: true,
} satisfies Prisma.UserSelect;

function toCurrentUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: row.emailVerified,
    image: row.image,
    createdAt: row.createdAt.toISOString(),
    username: row.username,
    bio: row.bio,
    unitSystem: row.unitSystem,
    /**
     * La colonne est un `String` libre en base, pas une énumération : Better
     * Auth crée des comptes sans passer par nos validateurs, et une valeur
     * inattendue ne doit pas faire échouer la lecture du profil. On retombe
     * sur le français, qui est la valeur par défaut de la colonne.
     */
    locale: row.locale === "en" ? "en" : "fr",
    timezone: row.timezone,
    defaultRestSec: row.defaultRestSec,
    defaultVisibility: row.defaultVisibility,
    onboardedAt: row.onboardedAt?.toISOString() ?? null,
  };
}

export async function getCurrentUser(userId: string): Promise<CurrentUser> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: SELECTION });

  if (!row) {
    /**
     * Une session valide dont l'utilisateur a disparu : compte supprimé
     * pendant que la session courait (D18, suppression immédiate en cascade).
     * Le cas est rare mais réel, et un 404 vaut mieux qu'un plantage.
     */
    throw notFound("Utilisateur");
  }

  return toCurrentUser(row);
}

export async function updateCurrentUser(
  userId: string,
  input: UpdateMeInput,
): Promise<CurrentUser> {
  /**
   * Le pseudo est unique. On pourrait le vérifier avant d'écrire, mais entre
   * la lecture et l'écriture deux inscriptions concurrentes peuvent choisir le
   * même : seule la contrainte de base tranche vraiment. On écrit donc, et on
   * traduit la violation — c'est la seule version sans fenêtre de course.
   */
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: SELECTION,
    });

    return toCurrentUser(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 : violation de contrainte d'unicité.
      if (error.code === "P2002") {
        throw new ApiError("CONFLICT", "Ce pseudo est déjà pris.", [
          { path: "username", message: "Déjà utilisé." },
        ]);
      }

      // P2025 : la ligne visée n'existe plus.
      if (error.code === "P2025") {
        throw notFound("Utilisateur");
      }
    }

    throw error;
  }
}

// ── Suppression de compte ─────────────────────────────────────────────────

/**
 * Le compte porte-t-il un mot de passe à confirmer ?
 *
 * Un compte créé par GitHub seul (D26) n'a pas de ligne `credential` : lui
 * réclamer un mot de passe l'enfermerait dehors, puisqu'il n'en a jamais choisi.
 * C'est la seule raison pour laquelle `password` est facultatif dans le contrat.
 */
export async function hasPassword(userId: string): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential", NOT: { password: null } },
    select: { id: true },
  });

  return account !== null;
}

/**
 * Efface tout ce que l'utilisateur a produit, avant que Better Auth ne supprime
 * la ligne `user` elle-même (D18 : suppression immédiate, pas un drapeau).
 *
 * **L'ordre n'est pas décoratif.** Les exercices personnalisés sont en cascade
 * depuis leur propriétaire, mais `RoutineExercise` et `WorkoutExercise` les
 * référencent en `onDelete: Restrict` — on n'efface jamais un exercice cité par
 * un historique, on l'archive (invariant 8, doc 03). Postgres vérifie un
 * `RESTRICT` immédiatement, sans attendre la fin de la cascade : supprimer la
 * ligne `user` d'un trait ferait donc échouer la suppression de tout compte
 * ayant utilisé son propre exercice dans une séance. Séances et routines
 * doivent partir **avant** les exercices qui les portent.
 *
 * Le tout en une transaction : un compte à moitié supprimé serait pire que pas
 * supprimé du tout.
 */
export async function purgeUserData(userId: string): Promise<void> {
  await prisma.$transaction([
    // Les séances d'abord : elles emportent leurs exercices et leurs séries, et
    // libèrent les `Restrict` posés sur le catalogue personnel.
    prisma.workout.deleteMany({ where: { userId } }),
    prisma.personalRecord.deleteMany({ where: { userId } }),
    prisma.routine.deleteMany({ where: { userId } }),
    prisma.routineFolder.deleteMany({ where: { userId } }),
    // Plus rien ne les référence : ils peuvent enfin partir.
    prisma.exercise.deleteMany({ where: { ownerId: userId } }),
  ]);
}

// ── Export RGPD ───────────────────────────────────────────────────────────

/** Échelles des colonnes `Decimal`, telles que déclarées au schéma. */
const WEIGHT_SCALE = 2;
const DISTANCE_SCALE = 2;
const RPE_SCALE = 1;
const VOLUME_SCALE = 2;
const ZERO = "0.00";

type ExerciseRow = Prisma.ExerciseGetPayload<{ include: { translations: true } }>;

type RoutineRow = Prisma.RoutineGetPayload<{
  include: {
    exercises: { include: { exercise: { select: { name: true } }; sets: true } };
  };
}>;

type WorkoutRow = Prisma.WorkoutGetPayload<{
  include: {
    exercises: { include: { exercise: { select: { name: true } }; sets: true } };
  };
}>;

type RecordRow = Prisma.PersonalRecordGetPayload<{
  include: { exercise: { select: { name: true } } };
}>;

/** Ordre stable partout : deux exports du même compte doivent être identiques. */
const BY_POSITION = { position: "asc" } as const;

function toExportExercise(row: ExerciseRow): DataExportExercise {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    bodyPart: row.bodyPart,
    equipment: row.equipment,
    target: row.target,
    secondaryMuscles: row.secondaryMuscles,
    isArchived: row.isArchived,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    translations: row.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      instructions: translation.instructions,
    })),
  };
}

function toExportRoutine(row: RoutineRow): DataExportRoutine {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folderId,
    notes: row.notes,
    position: row.position,
    lastPerformedAt: row.lastPerformedAt?.toISOString() ?? null,
    performedCount: row.performedCount,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    exercises: row.exercises.map((entry) => ({
      exerciseId: entry.exerciseId,
      exerciseName: entry.exercise.name,
      position: entry.position,
      notes: entry.notes,
      restSec: entry.restSec,
      supersetGroup: entry.supersetGroup,
      sets: entry.sets.map((set) => ({
        position: set.position,
        type: set.type,
        targetReps: set.targetReps,
        targetWeightKg: toDecimalString(set.targetWeightKg, WEIGHT_SCALE),
        targetDurationSec: set.targetDurationSec,
        targetDistanceM: toDecimalString(set.targetDistanceM, DISTANCE_SCALE),
        targetRpe: toDecimalString(set.targetRpe, RPE_SCALE),
      })),
    })),
  };
}

function toExportWorkout(row: WorkoutRow): DataExportWorkout {
  return {
    id: row.id,
    routineId: row.routineId,
    title: row.title,
    notes: row.notes,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    durationSec: row.durationSec,
    totalVolumeKg: toDecimalString(row.totalVolumeKg, VOLUME_SCALE) ?? ZERO,
    totalSets: row.totalSets,
    totalReps: row.totalReps,
    prCount: row.prCount,
    visibility: row.visibility,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    exercises: row.exercises.map((entry) => ({
      exerciseId: entry.exerciseId,
      exerciseName: entry.exercise.name,
      position: entry.position,
      notes: entry.notes,
      restSec: entry.restSec,
      supersetGroup: entry.supersetGroup,
      sets: entry.sets.map((set) => ({
        position: set.position,
        type: set.type,
        reps: set.reps,
        weightKg: toDecimalString(set.weightKg, WEIGHT_SCALE),
        durationSec: set.durationSec,
        distanceM: toDecimalString(set.distanceM, DISTANCE_SCALE),
        rpe: toDecimalString(set.rpe, RPE_SCALE),
        completed: set.completed,
        completedAt: set.completedAt?.toISOString() ?? null,
        isPr: set.isPr,
      })),
    })),
  };
}

function toExportRecord(row: RecordRow): DataExportRecord {
  return {
    exerciseId: row.exerciseId,
    exerciseName: row.exercise.name,
    type: row.type,
    value: toDecimalString(row.value, VOLUME_SCALE) ?? ZERO,
    reps: row.reps,
    weightKg: toDecimalString(row.weightKg, WEIGHT_SCALE),
    achievedAt: row.achievedAt.toISOString(),
    workoutId: row.workoutId,
  };
}

/**
 * Tout ce que la base retient de cet utilisateur, en un document (D18, D27).
 *
 * L'historique est ramené **en entier**, sans curseur : un export partiel ne
 * remplirait pas l'obligation, et la pagination serait à la charge de qui
 * télécharge un fichier. Le volume reste celui d'une pratique personnelle —
 * quelques centaines de séances, quelques milliers de séries.
 *
 * Les routines supprimées sont présentes : leur suppression est logique
 * (`deletedAt`), la donnée existe donc toujours et un export doit le dire.
 */
export async function exportUserData(userId: string): Promise<DataExport> {
  const profile = await getCurrentUser(userId);

  const [customExercises, routineFolders, routines, workouts, records] = await Promise.all([
    prisma.exercise.findMany({
      where: { ownerId: userId },
      include: { translations: { orderBy: { locale: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.routineFolder.findMany({ where: { userId }, orderBy: BY_POSITION }),
    prisma.routine.findMany({
      where: { userId },
      include: {
        exercises: {
          orderBy: BY_POSITION,
          include: { exercise: { select: { name: true } }, sets: { orderBy: BY_POSITION } },
        },
      },
      orderBy: BY_POSITION,
    }),
    prisma.workout.findMany({
      where: { userId },
      include: {
        exercises: {
          orderBy: BY_POSITION,
          include: { exercise: { select: { name: true } }, sets: { orderBy: BY_POSITION } },
        },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.personalRecord.findMany({
      where: { userId },
      include: { exercise: { select: { name: true } } },
      orderBy: { achievedAt: "desc" },
    }),
  ]);

  return {
    version: DATA_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
    customExercises: customExercises.map(toExportExercise),
    routineFolders: routineFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      position: folder.position,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    })),
    routines: routines.map(toExportRoutine),
    workouts: workouts.map(toExportWorkout),
    records: records.map(toExportRecord),
  };
}
