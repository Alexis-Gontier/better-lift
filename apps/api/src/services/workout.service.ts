import {
  isPersonalRecord,
  normalizeSupersetGroups,
  recordValue,
  workoutDurationSec,
  workoutTotals,
} from "@better-lift/core";
import { type Prisma, prisma } from "@better-lift/db";
import {
  type CreateWorkoutPayload,
  DEFAULT_LOCALE,
  type ExerciseType,
  type LastPerformance,
  type LastPerformanceQuery,
  type Locale,
  type NewRecord,
  type RecordType,
  recordTypeSchema,
  type WorkoutDetail,
  type WorkoutExercise,
  type WorkoutListQuery,
  type WorkoutListResponse,
  type WorkoutSaveResponse,
  type WorkoutSet,
  type WorkoutStructurePayload,
  type WorkoutSummary,
} from "@better-lift/validators";

import { toDecimalString } from "../lib/decimal.js";
import { ApiError, notFound } from "../lib/errors.js";
import { loadUsableExercises, toExerciseSummary } from "./exercise.service.js";

/**
 * Séances (doc 04, § Séances).
 *
 * ## Ce que ce service garantit
 *
 * 1. **L'idempotence du `POST`** (règle non négociable n°7). L'identifiant est
 *    généré par le client ; un `POST` répété renvoie la séance existante. Sans
 *    cela, une reconnexion réseau au mauvais moment crée un doublon — le bug
 *    numéro un des trackers de sport, et celui qu'une file de synchronisation
 *    hors ligne rend inévitable.
 * 2. **Les records sont calculés serveur** (règle non négociable n°6), dans la
 *    transaction d'écriture, à partir des seules séries validées et non
 *    d'échauffement.
 * 3. **Les agrégats sont dénormalisés à l'écriture** (doc 03, §3) : volume,
 *    séries, répétitions, durée. Jamais agrégés à la lecture.
 *
 * ## Un seul mécanisme pour les records
 *
 * Enregistrer, corriger et supprimer passent tous par `recomputeRecords`, qui
 * **reconstruit** les records des exercices touchés depuis l'historique complet
 * plutôt que de les ajuster (invariant 7, doc 03).
 *
 * La raison tient en un cas : corriger une séance à la baisse peut *invalider*
 * un record, et il faut alors retrouver le second meilleur — qu'un ajustement
 * incrémental n'a aucun moyen de connaître. Faire vivre deux chemins, l'un
 * rapide à l'ajout et l'autre complet à la correction, c'était garantir qu'ils
 * finiraient par ne plus dire la même chose. L'opération reste bornée : elle ne
 * lit que les séries des exercices concernés, pas tout l'historique.
 */

const WORKOUT_INCLUDE = {
  exercises: {
    orderBy: { position: "asc" },
    include: {
      exercise: { include: { translations: true } },
      sets: { orderBy: { position: "asc" } },
    },
  },
} as const;

type WorkoutRow = Prisma.WorkoutGetPayload<{
  include: {
    exercises: {
      include: {
        exercise: { include: { translations: true } };
        sets: true;
      };
    };
  };
}>;

const RECORD_TYPES = recordTypeSchema.options;

function toSet(row: WorkoutRow["exercises"][number]["sets"][number]): WorkoutSet {
  return {
    id: row.id,
    position: row.position,
    type: row.type,
    reps: row.reps,
    weightKg: toDecimalString(row.weightKg, 2),
    durationSec: row.durationSec,
    distanceM: toDecimalString(row.distanceM, 2),
    rpe: toDecimalString(row.rpe, 1),
    completed: row.completed,
    completedAt: row.completedAt?.toISOString() ?? null,
    isPr: row.isPr,
  };
}

function toWorkoutExercise(row: WorkoutRow["exercises"][number], locale: Locale): WorkoutExercise {
  const translation =
    row.exercise.translations.find((entry) => entry.locale === locale) ??
    row.exercise.translations[0];

  return {
    id: row.id,
    position: row.position,
    notes: row.notes,
    restSec: row.restSec,
    supersetGroup: row.supersetGroup,
    exercise: toExerciseSummary(row.exercise, translation?.name ?? row.exercise.name),
    sets: row.sets.map(toSet),
  };
}

function toSummaryFields(
  row: Prisma.WorkoutGetPayload<object>,
  exerciseCount: number,
): WorkoutSummary {
  return {
    id: row.id,
    routineId: row.routineId,
    title: row.title,
    notes: row.notes,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    durationSec: row.durationSec,
    totalVolumeKg: row.totalVolumeKg.toFixed(2),
    totalSets: row.totalSets,
    totalReps: row.totalReps,
    prCount: row.prCount,
    visibility: row.visibility,
    exerciseCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDetail(row: WorkoutRow, locale: Locale): WorkoutDetail {
  return {
    ...toSummaryFields(row, row.exercises.length),
    exercises: row.exercises.map((exercise) => toWorkoutExercise(exercise, locale)),
  };
}

// ── Écriture ──────────────────────────────────────────────────────────────

/**
 * La routine d'origine doit vous appartenir, **même supprimée**.
 *
 * Une routine supprimée reste en base (suppression logique) et une séance
 * lancée depuis elle, puis envoyée trois jours plus tard par la file de
 * synchronisation, doit toujours pouvoir la désigner. Ce qui est refusé, c'est
 * l'identifiant d'autrui — 404, comme partout (règle non négociable n°8).
 */
async function assertRoutineOwned(routineId: string | null | undefined, userId: string) {
  if (!routineId) {
    return;
  }

  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    select: { id: true },
  });

  if (!routine) {
    throw notFound("Routine");
  }
}

/**
 * Traduit la structure reçue en `create` imbriqué Prisma, positions comprises.
 *
 * Comme pour les routines, **le client n'envoie aucune `position`** : l'ordre
 * des tableaux la porte et le serveur l'assigne (doc 04).
 */
function toNestedCreate(structure: WorkoutStructurePayload, fallbackCompletedAt: Date) {
  const supersets = normalizeSupersetGroups(
    structure.exercises.map((exercise) => exercise.supersetGroup),
  );

  return structure.exercises.map((exercise, index) => ({
    exerciseId: exercise.exerciseId,
    position: index,
    notes: exercise.notes ?? null,
    restSec: exercise.restSec ?? null,
    supersetGroup: supersets[index] ?? null,
    sets: {
      create: exercise.sets.map((set, setIndex) => ({
        position: setIndex,
        type: set.type,
        reps: set.reps ?? null,
        weightKg: set.weightKg ?? null,
        durationSec: set.durationSec ?? null,
        distanceM: set.distanceM ?? null,
        rpe: set.rpe ?? null,
        completed: set.completed,
        /**
         * Une série validée a toujours une date : à défaut de celle du client,
         * celle de la séance. Un `completedAt` nul sur une série cochée
         * obligerait chaque lecteur — records compris — à inventer un repli.
         */
        completedAt: set.completedAt
          ? new Date(set.completedAt)
          : set.completed
            ? fallbackCompletedAt
            : null,
      })),
    },
  }));
}

/** Agrégats dénormalisés, calculés par `packages/core` et non ici (règle n°9). */
function computeTotals(structure: WorkoutStructurePayload, types: Map<string, ExerciseType>) {
  const measured = {
    exercises: structure.exercises.map((exercise) => ({
      exerciseType: types.get(exercise.exerciseId) ?? "WEIGHT_REPS",
      sets: exercise.sets.map((set) => ({
        type: set.type,
        completed: set.completed,
        reps: set.reps ?? null,
        weightKg: set.weightKg ?? null,
        durationSec: set.durationSec ?? null,
        distanceM: set.distanceM ?? null,
      })),
    })),
  };

  const totals = workoutTotals(measured);

  return {
    totalVolumeKg: totals.totalVolumeKg.toFixed(2),
    totalSets: totals.totalSets,
    totalReps: totals.totalReps,
    durationSec: workoutDurationSec(
      new Date(structure.startedAt),
      structure.endedAt ? new Date(structure.endedAt) : null,
    ),
  };
}

/** Meilleure série d'un exercice pour un type de record donné. */
interface RecordWinner {
  exerciseId: string;
  type: RecordType;
  value: number;
  setId: string;
  workoutId: string;
  achievedAt: Date;
  reps: number | null;
  weightKg: Prisma.Decimal | null;
}

/** Les records sont indexés par (exercice, type) — la clé composite en base. */
function recordKey(exerciseId: string, type: RecordType): string {
  return `${exerciseId} ${type}`;
}

/**
 * Reconstruit les records des exercices donnés depuis l'historique complet, et
 * renvoie ceux que **cette** séance vient d'établir.
 *
 * Un record n'est battu qu'à valeur **strictement** supérieure (invariant 5) :
 * à égalité, c'est la performance la plus ancienne qui garde la ligne, sinon
 * la moindre séance répétant la même charge réécrirait la date.
 */
async function recomputeRecords(
  tx: Prisma.TransactionClient,
  userId: string,
  exerciseIds: readonly string[],
  /**
   * La séance à créditer, ou `null` pour une suppression : il n'y a alors rien
   * à annoncer, et le nom traduit des exercices n'a plus à être lu.
   */
  attribution: { workoutId: string; locale: Locale } | null,
): Promise<NewRecord[]> {
  const ids = [...new Set(exerciseIds)];

  if (ids.length === 0) {
    return [];
  }

  const [previous, sets] = await Promise.all([
    tx.personalRecord.findMany({
      where: { userId, exerciseId: { in: ids } },
      select: { exerciseId: true, type: true, value: true },
    }),
    tx.workoutSet.findMany({
      where: {
        completed: true,
        // L'échauffement est exclu des records comme du volume (invariant 5).
        type: { not: "WARMUP" },
        workoutExercise: { exerciseId: { in: ids }, workout: { userId } },
      },
      select: {
        id: true,
        type: true,
        completed: true,
        reps: true,
        weightKg: true,
        durationSec: true,
        distanceM: true,
        completedAt: true,
        workoutExercise: {
          select: {
            exerciseId: true,
            workoutId: true,
            exercise: { select: { type: true } },
            workout: { select: { startedAt: true } },
          },
        },
      },
    }),
  ]);

  const previousByKey = new Map(
    previous.map((row) => [recordKey(row.exerciseId, row.type), row.value] as const),
  );

  const winners = new Map<string, RecordWinner>();

  for (const set of sets) {
    const { exerciseId, workoutId } = set.workoutExercise;
    const exerciseType = set.workoutExercise.exercise.type;
    const achievedAt = set.completedAt ?? set.workoutExercise.workout.startedAt;

    for (const type of RECORD_TYPES) {
      const value = recordValue(
        {
          type: set.type,
          completed: set.completed,
          reps: set.reps,
          weightKg: set.weightKg?.toString() ?? null,
          durationSec: set.durationSec,
          distanceM: set.distanceM?.toString() ?? null,
        },
        exerciseType,
        type,
      );

      if (value === null || value <= 0) {
        continue;
      }

      const key = recordKey(exerciseId, type);
      const current = winners.get(key);

      // Strictement supérieur, ou aussi bon mais plus ancien : à performance
      // égale, le record garde sa date d'origine.
      const better =
        !current ||
        value > current.value ||
        (value === current.value && achievedAt < current.achievedAt);

      if (better) {
        winners.set(key, {
          exerciseId,
          type,
          value,
          setId: set.id,
          workoutId,
          achievedAt,
          reps: set.reps,
          weightKg: set.weightKg,
        });
      }
    }
  }

  /**
   * Table rase puis réécriture, plutôt qu'un rapprochement ligne à ligne : les
   * records d'un exercice tiennent en six lignes au plus, et un `upsert` par
   * type laisserait derrière lui les records d'un exercice dont toutes les
   * séries ont disparu.
   */
  await tx.personalRecord.deleteMany({ where: { userId, exerciseId: { in: ids } } });

  if (winners.size > 0) {
    await tx.personalRecord.createMany({
      data: [...winners.values()].map((winner) => ({
        userId,
        exerciseId: winner.exerciseId,
        type: winner.type,
        value: winner.value.toFixed(2),
        reps: winner.reps,
        weightKg: winner.weightKg,
        achievedAt: winner.achievedAt,
        workoutId: winner.workoutId,
        workoutSetId: winner.setId,
      })),
    });
  }

  /**
   * `isPr` est réécrit intégralement pour les exercices touchés : une série qui
   * détenait un record invalidé par une correction doit perdre son trophée,
   * et rien d'autre ne le lui retirerait.
   */
  const winningSetIds = [...new Set([...winners.values()].map((winner) => winner.setId))];

  await tx.workoutSet.updateMany({
    where: {
      isPr: true,
      workoutExercise: { exerciseId: { in: ids }, workout: { userId } },
    },
    data: { isPr: false },
  });

  if (winningSetIds.length > 0) {
    await tx.workoutSet.updateMany({
      where: { id: { in: winningSetIds } },
      data: { isPr: true },
    });
  }

  if (!attribution) {
    return [];
  }

  // Le nom est celui **affiché** : annoncer un record sur « Barbell Bench
  // Press » dans une interface française serait le seul endroit de l'app où
  // le catalogue reparlerait anglais.
  const names = await tx.exercise.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, translations: { where: { locale: attribution.locale } } },
  });
  const nameById = new Map(
    names.map((row) => [row.id, row.translations[0]?.name?.trim() || row.name] as const),
  );

  const newRecords: NewRecord[] = [];

  for (const [key, winner] of winners) {
    // Seuls comptent les records que **cette** séance détient désormais : une
    // correction à la baisse peut faire remonter le record d'une autre séance,
    // ce n'est pas un record de celle-ci.
    if (winner.workoutId !== attribution.workoutId) {
      continue;
    }

    const before = previousByKey.get(key) ?? null;

    if (!isPersonalRecord(winner.value, before?.toString() ?? null)) {
      continue;
    }

    newRecords.push({
      exerciseId: winner.exerciseId,
      exerciseName: nameById.get(winner.exerciseId) ?? "",
      type: winner.type,
      value: winner.value.toFixed(2),
      previousValue: before === null ? null : before.toFixed(2),
    });
  }

  return newRecords;
}

/**
 * Les transactions de séance dépassent le budget par défaut de Prisma (5 s).
 * Elles enchaînent la création imbriquée, le recalcul des records et la mise à
 * jour des compteurs, contre une base distante — et échouer après coup, c'est
 * perdre une séance réelle.
 */
const TRANSACTION_OPTIONS = { timeout: 20_000, maxWait: 10_000 } as const;

async function loadDetail(id: string, locale: Locale): Promise<WorkoutDetail> {
  const row = await prisma.workout.findUnique({ where: { id }, include: WORKOUT_INCLUDE });

  if (!row) {
    throw new ApiError("INTERNAL", "Séance introuvable après écriture.");
  }

  return toDetail(row, locale);
}

/**
 * Enregistre une séance terminée. **Idempotent** : un identifiant déjà connu
 * renvoie la séance existante, sans rien réécrire ni recompter.
 */
export async function createWorkout(
  input: CreateWorkoutPayload,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ workout: WorkoutSaveResponse; created: boolean }> {
  const existing = await prisma.workout.findUnique({
    where: { id: input.id },
    select: { userId: true },
  });

  if (existing) {
    if (existing.userId !== userId) {
      /**
       * 409 et non 404 : le client doit savoir que son identifiant est pris
       * pour en générer un autre, alors qu'un 404 l'inviterait à réessayer à
       * l'identique. Rien n'est révélé du contenu de la séance en question, et
       * la collision de deux cuid relève du hasard pur.
       */
      throw new ApiError("CONFLICT", "Cet identifiant de séance est déjà utilisé.");
    }

    // Renvoi de la séance existante, sans records : ils ont été calculés au
    // premier envoi, et les recalculer ici les annoncerait une seconde fois.
    return {
      workout: { ...(await loadDetail(input.id, locale)), newRecords: [] },
      created: false,
    };
  }

  const exerciseIds = input.exercises.map((exercise) => exercise.exerciseId);

  await assertRoutineOwned(input.routineId, userId);
  const types = await loadUsableExercises(exerciseIds, userId, { allowArchived: true });

  const visibility =
    input.visibility ??
    (
      await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { defaultVisibility: true },
      })
    ).defaultVisibility;

  const startedAt = new Date(input.startedAt);
  const endedAt = input.endedAt ? new Date(input.endedAt) : null;

  const newRecords = await prisma.$transaction(async (tx) => {
    await tx.workout.create({
      data: {
        id: input.id,
        userId,
        routineId: input.routineId ?? null,
        title: input.title,
        notes: input.notes ?? null,
        startedAt,
        endedAt,
        visibility,
        ...computeTotals(input, types),
        exercises: { create: toNestedCreate(input, endedAt ?? startedAt) },
      },
    });

    if (input.routineId) {
      /**
       * Compteurs dénormalisés de la routine, pour trier « dernière utilisée »
       * sans jointure. `lastPerformedAt` ne recule jamais : une séance ancienne
       * remontée tardivement par la file de synchronisation ne doit pas faire
       * paraître la routine plus vieille qu'elle ne l'est.
       */
      await tx.routine.updateMany({
        where: { id: input.routineId, userId },
        data: { performedCount: { increment: 1 } },
      });

      await tx.routine.updateMany({
        where: {
          id: input.routineId,
          userId,
          OR: [{ lastPerformedAt: null }, { lastPerformedAt: { lt: startedAt } }],
        },
        data: { lastPerformedAt: startedAt },
      });
    }

    const records = await recomputeRecords(tx, userId, exerciseIds, {
      workoutId: input.id,
      locale,
    });

    if (records.length > 0) {
      await tx.workout.update({ where: { id: input.id }, data: { prCount: records.length } });
    }

    return records;
  }, TRANSACTION_OPTIONS);

  return {
    workout: { ...(await loadDetail(input.id, locale)), newRecords },
    created: true,
  };
}

/**
 * Corrige une séance passée (D10). Autorisé, et déclenche le recalcul intégral
 * des records de **tous** les exercices touchés — ceux qui disparaissent de la
 * séance comme ceux qui y entrent.
 *
 * Les compteurs de la routine ne bougent pas : la séance a bien eu lieu, la
 * corriger ne la fait pas avoir lieu une seconde fois.
 */
export async function updateWorkout(
  id: string,
  input: WorkoutStructurePayload,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<WorkoutSaveResponse> {
  const existing = await prisma.workout.findFirst({
    where: { id, userId },
    select: { exercises: { select: { exerciseId: true } } },
  });

  if (!existing) {
    throw notFound("Séance");
  }

  const nextIds = input.exercises.map((exercise) => exercise.exerciseId);

  await assertRoutineOwned(input.routineId, userId);
  const types = await loadUsableExercises(nextIds, userId, { allowArchived: true });

  const touched = [...new Set([...existing.exercises.map((row) => row.exerciseId), ...nextIds])];

  const startedAt = new Date(input.startedAt);
  const endedAt = input.endedAt ? new Date(input.endedAt) : null;

  const newRecords = await prisma.$transaction(async (tx) => {
    // Les séries partent en cascade avec leur exercice, comme pour un `PUT` de
    // routine : un échange de positions violerait `@@unique([workoutId, position])`
    // en cours de route, la suppression préalable libère toutes les places.
    await tx.workoutExercise.deleteMany({ where: { workoutId: id } });

    await tx.workout.update({
      where: { id },
      data: {
        routineId: input.routineId ?? null,
        title: input.title,
        notes: input.notes ?? null,
        startedAt,
        endedAt,
        ...(input.visibility ? { visibility: input.visibility } : {}),
        ...computeTotals(input, types),
        exercises: { create: toNestedCreate(input, endedAt ?? startedAt) },
      },
    });

    const records = await recomputeRecords(tx, userId, touched, { workoutId: id, locale });

    await tx.workout.update({ where: { id }, data: { prCount: records.length } });

    return records;
  }, TRANSACTION_OPTIONS);

  return { ...(await loadDetail(id, locale)), newRecords };
}

/**
 * Suppression **physique**, contrairement aux routines : quelqu'un qui supprime
 * une séance veut qu'elle disparaisse (doc 03, §4).
 *
 * Les records qu'elle détenait sont reconstruits derrière elle — c'est
 * précisément le cas où il faut retrouver le second meilleur.
 */
export async function deleteWorkout(id: string, userId: string): Promise<void> {
  const existing = await prisma.workout.findFirst({
    where: { id, userId },
    select: { routineId: true, exercises: { select: { exerciseId: true } } },
  });

  if (!existing) {
    throw notFound("Séance");
  }

  const deletedExerciseIds = existing.exercises.map((row) => row.exerciseId);

  await prisma.$transaction(async (tx) => {
    await tx.workout.delete({ where: { id } });

    if (existing.routineId) {
      // `lastPerformedAt` est relu depuis les séances restantes : le laisser
      // pointer une séance supprimée fausserait le tri « dernière utilisée »
      // sans que rien ne le signale.
      const last = await tx.workout.aggregate({
        where: { routineId: existing.routineId, userId },
        _max: { startedAt: true },
        _count: true,
      });

      await tx.routine.updateMany({
        where: { id: existing.routineId, userId },
        data: { performedCount: last._count, lastPerformedAt: last._max.startedAt },
      });
    }

    await recomputeRecords(tx, userId, deletedExerciseIds, null);
  }, TRANSACTION_OPTIONS);
}

// ── Lecture ───────────────────────────────────────────────────────────────

export async function listWorkouts(
  query: WorkoutListQuery,
  userId: string,
): Promise<WorkoutListResponse> {
  const rows = await prisma.workout.findMany({
    where: {
      userId,
      ...(query.routineId ? { routineId: query.routineId } : {}),
      ...(query.from || query.to
        ? {
            startedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    },
    // `id` départage deux séances du même instant : sans lui l'ordre n'est pas
    // déterministe, et un curseur sur un ordre instable saute ou répète.
    orderBy: [{ startedAt: "desc" }, { id: "asc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { _count: { select: { exercises: true } } },
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;

  return {
    data: page.map((row) => toSummaryFields(row, row._count.exercises)),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    hasMore,
  };
}

/** `null` si la séance n'existe pas **ou appartient à autrui** : la route en fait un 404. */
export async function getWorkout(
  id: string,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<WorkoutDetail | null> {
  const row = await prisma.workout.findFirst({
    where: { id, userId },
    include: WORKOUT_INCLUDE,
  });

  return row ? toDetail(row, locale) : null;
}

/**
 * Dernières valeurs par exercice, pour la colonne « PRÉC. » de l'écran de
 * saisie (doc 06). C'est le repère qui permet de décider de sa charge sans
 * réfléchir : dans le cas nominal, l'utilisateur ne tape rien, il coche.
 *
 * Une requête par exercice, lancées **en parallèle** : chacune est une lecture
 * d'index sur `[exerciseId]` qui s'arrête à la première ligne, et le contrat
 * borne la demande à cinquante identifiants. Une requête unique demanderait un
 * `DISTINCT ON` que Prisma ne garantit pas de pousser en base, et se
 * rabattrait sur un dédoublonnage en mémoire après avoir tout ramené.
 */
export async function getLastPerformance(
  query: LastPerformanceQuery,
  userId: string,
): Promise<LastPerformance[]> {
  const exerciseIds = [...new Set(query.exerciseIds)];

  const results = await Promise.all(
    exerciseIds.map((exerciseId) =>
      prisma.workoutExercise.findFirst({
        where: { exerciseId, workout: { userId }, sets: { some: { completed: true } } },
        orderBy: { workout: { startedAt: "desc" } },
        select: {
          workout: { select: { id: true, startedAt: true } },
          sets: { where: { completed: true }, orderBy: { position: "asc" } },
        },
      }),
    ),
  );

  const performances: LastPerformance[] = [];

  for (const [index, row] of results.entries()) {
    const exerciseId = exerciseIds[index];

    // Un exercice jamais fait est absent de la réponse, plutôt que présent avec
    // des valeurs nulles que le client devrait distinguer d'une séance vide.
    if (!row || !exerciseId) {
      continue;
    }

    performances.push({
      exerciseId,
      workoutId: row.workout.id,
      performedAt: row.workout.startedAt.toISOString(),
      sets: row.sets.map((set) => ({
        position: set.position,
        type: set.type,
        reps: set.reps,
        weightKg: toDecimalString(set.weightKg, 2),
        durationSec: set.durationSec,
        distanceM: toDecimalString(set.distanceM, 2),
        rpe: toDecimalString(set.rpe, 1),
      })),
    });
  }

  return performances;
}
