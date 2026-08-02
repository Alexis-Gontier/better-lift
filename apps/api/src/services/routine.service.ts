import { type Prisma, prisma } from "@better-lift/db";
import {
  DEFAULT_LOCALE,
  type Locale,
  type ReorderInput,
  type RoutineDetail,
  type RoutineExercise,
  type RoutineListQuery,
  type RoutineSet,
  type RoutineStructurePayload,
  type RoutineSummary,
  type UpdateRoutineInput,
} from "@better-lift/validators";

import { ApiError, notFound } from "../lib/errors.js";
import { toExerciseSummary } from "./exercise.service.js";

/**
 * Routines (doc 04, § Routines).
 *
 * ## Ce que ce service protège
 *
 * Une routine est un **gabarit**, une séance en sera un instantané indépendant
 * (règle non négociable n°5). Rien ici ne doit pouvoir modifier un historique :
 * d'où la suppression **logique** (`deletedAt`), et non un `DELETE` réel.
 *
 * ## Positions
 *
 * Le client n'envoie jamais de `position` : l'ordre des tableaux la porte, le
 * serveur l'assigne (doc 04). C'est ce qui rend impossible la suite à trous ou
 * la position en double — et `@@unique([routineId, position])` en base ferait
 * de toute façon échouer un échange naïf (invariant 3).
 */

/** Ce que les lectures ramènent, exercices et séries compris. */
type RoutineRow = Prisma.RoutineGetPayload<{
  include: {
    exercises: {
      include: {
        exercise: { include: { translations: true } };
        sets: true;
      };
    };
  };
}>;

const ROUTINE_INCLUDE = {
  exercises: {
    orderBy: { position: "asc" },
    include: {
      exercise: { include: { translations: true } },
      sets: { orderBy: { position: "asc" } },
    },
  },
} as const;

/**
 * Les `Decimal` sortent en **chaîne** (doc 04), avec l'échelle de leur colonne.
 * `toString()` donnerait `"100"` là où le contrat annonce `"100.00"`, et un
 * client qui compare des chaînes verrait deux charges différentes.
 */
function toDecimalString(value: Prisma.Decimal | null, scale: number): string | null {
  return value === null ? null : value.toFixed(scale);
}

function toSet(row: RoutineRow["exercises"][number]["sets"][number]): RoutineSet {
  return {
    id: row.id,
    position: row.position,
    type: row.type,
    targetReps: row.targetReps,
    targetWeightKg: toDecimalString(row.targetWeightKg, 2),
    targetDurationSec: row.targetDurationSec,
    targetDistanceM: toDecimalString(row.targetDistanceM, 2),
    targetRpe: toDecimalString(row.targetRpe, 1),
  };
}

function toRoutineExercise(row: RoutineRow["exercises"][number], locale: Locale): RoutineExercise {
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

/**
 * Champs communs au résumé et au détail. `exerciseCount` est passé à part
 * parce que les deux le connaissent différemment : la liste le fait compter par
 * Postgres, le détail tient déjà les exercices en mémoire.
 */
function toSummaryFields(row: Prisma.RoutineGetPayload<object>, exerciseCount: number) {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folderId,
    notes: row.notes,
    position: row.position,
    exerciseCount,
    lastPerformedAt: row.lastPerformedAt?.toISOString() ?? null,
    performedCount: row.performedCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } satisfies RoutineSummary;
}

function toDetail(row: RoutineRow, locale: Locale): RoutineDetail {
  return {
    ...toSummaryFields(row, row.exercises.length),
    exercises: row.exercises.map((exercise) => toRoutineExercise(exercise, locale)),
  };
}

/**
 * Un superset resté seul n'en est pas un.
 *
 * L'invariant 4 (doc 03) demande qu'un groupe compte au moins deux exercices,
 * sinon il est ramené à `NULL` à l'enregistrement. Le cas arrive tout seul :
 * on crée un superset de deux exercices dans l'éditeur, puis on en supprime un
 * — le survivant garderait sinon une marque de groupe invisible et fausse.
 */
function normalizeSupersets(exercises: RoutineStructurePayload["exercises"]): (number | null)[] {
  const counts = new Map<number, number>();

  for (const exercise of exercises) {
    if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
      counts.set(exercise.supersetGroup, (counts.get(exercise.supersetGroup) ?? 0) + 1);
    }
  }

  return exercises.map((exercise) => {
    const group = exercise.supersetGroup;

    if (group === null || group === undefined) {
      return null;
    }

    return (counts.get(group) ?? 0) >= 2 ? group : null;
  });
}

/**
 * Vérifie que **tous** les exercices référencés sont visibles de cet
 * utilisateur, et non archivés.
 *
 * Sans ce contrôle, glisser l'identifiant d'un exercice personnalisé d'autrui
 * dans le corps de la requête suffirait à le lire ensuite dans sa propre
 * routine : la clé étrangère l'accepterait sans broncher. C'est la seule
 * frontière entre deux comptes sur cette route.
 */
async function assertExercisesUsable(exerciseIds: string[], userId: string): Promise<void> {
  if (exerciseIds.length === 0) {
    return;
  }

  const unique = [...new Set(exerciseIds)];

  const usable = await prisma.exercise.findMany({
    where: {
      id: { in: unique },
      isArchived: false,
      OR: [{ ownerId: null }, { ownerId: userId }],
    },
    select: { id: true },
  });

  if (usable.length === unique.length) {
    return;
  }

  const found = new Set(usable.map((row) => row.id));

  throw new ApiError(
    "VALIDATION_FAILED",
    "Certains exercices sont introuvables ou ne vous sont pas accessibles.",
    unique
      .filter((id) => !found.has(id))
      .map((id) => ({ path: "exercises", message: `Exercice inconnu : ${id}` })),
  );
}

/** Le dossier visé doit exister et vous appartenir — sinon 404, comme partout. */
async function assertFolderOwned(folderId: string | null | undefined, userId: string) {
  if (!folderId) {
    return;
  }

  const folder = await prisma.routineFolder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });

  if (!folder) {
    throw notFound("Dossier");
  }
}

/** Traduit la structure reçue en `create` imbriqué Prisma, positions comprises. */
function toNestedCreate(structure: RoutineStructurePayload) {
  const supersets = normalizeSupersets(structure.exercises);

  return structure.exercises.map((exercise, index) => ({
    exerciseId: exercise.exerciseId,
    position: index,
    notes: exercise.notes ?? null,
    restSec: exercise.restSec ?? null,
    supersetGroup: supersets[index] ?? null,
    sets: {
      create: exercise.sets.map((set, setIndex) => ({
        position: setIndex,
        type: set.type ?? "NORMAL",
        targetReps: set.targetReps ?? null,
        targetWeightKg: set.targetWeightKg ?? null,
        targetDurationSec: set.targetDurationSec ?? null,
        targetDistanceM: set.targetDistanceM ?? null,
        targetRpe: set.targetRpe ?? null,
      })),
    },
  }));
}

const ORDER_BY: Record<RoutineListQuery["sort"], Prisma.RoutineOrderByWithRelationInput[]> = {
  position: [{ position: "asc" }, { id: "asc" }],
  name: [{ name: "asc" }, { id: "asc" }],
  // Une routine jamais faite passe après celles qui l'ont été, pas avant.
  recent: [{ lastPerformedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
};

export async function listRoutines(
  query: RoutineListQuery,
  userId: string,
): Promise<RoutineSummary[]> {
  const rows = await prisma.routine.findMany({
    where: {
      userId,
      // Une routine supprimée reste en base pour l'historique, elle ne se liste
      // plus (doc 03).
      deletedAt: null,
      ...(query.folderId ? { folderId: query.folderId } : {}),
    },
    orderBy: ORDER_BY[query.sort],
    include: { _count: { select: { exercises: true } } },
  });

  return rows.map((row) => toSummaryFields(row, row._count.exercises));
}

export async function getRoutine(
  id: string,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<RoutineDetail | null> {
  const row = await prisma.routine.findFirst({
    where: { id, userId, deletedAt: null },
    include: ROUTINE_INCLUDE,
  });

  return row ? toDetail(row, locale) : null;
}

export async function createRoutine(
  structure: RoutineStructurePayload,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<RoutineDetail> {
  await assertFolderOwned(structure.folderId, userId);
  await assertExercisesUsable(
    structure.exercises.map((exercise) => exercise.exerciseId),
    userId,
  );

  // Rangée en dernier, comme un nouveau dossier — voir `createFolder`.
  const last = await prisma.routine.aggregate({
    where: { userId, folderId: structure.folderId ?? null, deletedAt: null },
    _max: { position: true },
  });

  const row = await prisma.routine.create({
    data: {
      userId,
      name: structure.name,
      folderId: structure.folderId ?? null,
      notes: structure.notes ?? null,
      position: (last._max.position ?? -1) + 1,
      exercises: { create: toNestedCreate(structure) },
    },
    include: ROUTINE_INCLUDE,
  });

  return toDetail(row, locale);
}

/**
 * Remplacement **intégral** de la structure (`PUT`, doc 04).
 *
 * Les exercices sont supprimés puis recréés plutôt que rapprochés un à un.
 * Deux raisons : le rapprochement demanderait une clé stable que l'éditeur
 * n'a pas — il travaille sur un brouillon local —, et surtout un échange de
 * positions violerait `@@unique([routineId, position])` en cours de route,
 * alors que la suppression préalable libère toutes les places d'un coup.
 *
 * Ce que l'on perd : les identifiants de `RoutineExercise` et de `RoutineSet`
 * changent à chaque enregistrement. Personne ne s'y réfère — une séance copie
 * les valeurs, elle ne pointe pas ces lignes.
 */
export async function replaceRoutine(
  id: string,
  structure: RoutineStructurePayload,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<RoutineDetail> {
  const existing = await prisma.routine.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Routine");
  }

  await assertFolderOwned(structure.folderId, userId);
  await assertExercisesUsable(
    structure.exercises.map((exercise) => exercise.exerciseId),
    userId,
  );

  const row = await prisma.$transaction(async (tx) => {
    // Les séries partent en cascade avec leur exercice.
    await tx.routineExercise.deleteMany({ where: { routineId: id } });

    return tx.routine.update({
      where: { id },
      data: {
        name: structure.name,
        folderId: structure.folderId ?? null,
        notes: structure.notes ?? null,
        exercises: { create: toNestedCreate(structure) },
      },
      include: ROUTINE_INCLUDE,
    });
  });

  return toDetail(row, locale);
}

/** Métadonnées seules : renommer ou déplacer sans toucher à la structure. */
export async function updateRoutineMeta(
  id: string,
  input: UpdateRoutineInput,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<RoutineDetail> {
  if (input.folderId !== undefined) {
    await assertFolderOwned(input.folderId, userId);
  }

  const { count } = await prisma.routine.updateMany({
    where: { id, userId, deletedAt: null },
    data: {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.folderId === undefined ? {} : { folderId: input.folderId }),
      ...(input.notes === undefined ? {} : { notes: input.notes }),
    },
  });

  if (count === 0) {
    throw notFound("Routine");
  }

  const routine = await getRoutine(id, userId, locale);

  if (!routine) {
    throw new ApiError("INTERNAL", "Routine introuvable après modification.");
  }

  return routine;
}

/**
 * Suppression **logique**. La ligne reste en base : une séance passée peut
 * encore la désigner, et l'historique ne change jamais rétroactivement.
 */
export async function deleteRoutine(id: string, userId: string): Promise<void> {
  const { count } = await prisma.routine.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (count === 0) {
    throw notFound("Routine");
  }
}

/**
 * Copie une routine, suffixée « (copie) ».
 *
 * Les compteurs d'exécution ne sont **pas** repris : la copie n'a jamais été
 * faite. Reprendre `performedCount` en ferait une routine qu'on croirait
 * rodée, et fausserait le tri « dernière utilisée » dès le lendemain.
 */
export async function duplicateRoutine(
  id: string,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<RoutineDetail> {
  const source = await prisma.routine.findFirst({
    where: { id, userId, deletedAt: null },
    include: ROUTINE_INCLUDE,
  });

  if (!source) {
    throw notFound("Routine");
  }

  const last = await prisma.routine.aggregate({
    where: { userId, folderId: source.folderId, deletedAt: null },
    _max: { position: true },
  });

  const row = await prisma.routine.create({
    data: {
      userId,
      // Tronqué à la longueur de la colonne : « (copie) » ajouté à un nom déjà
      // au maximum ferait échouer l'écriture sur une contrainte de longueur.
      name: `${source.name} (copie)`.slice(0, 120),
      folderId: source.folderId,
      notes: source.notes,
      position: (last._max.position ?? -1) + 1,
      exercises: {
        create: source.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          position: exercise.position,
          notes: exercise.notes,
          restSec: exercise.restSec,
          supersetGroup: exercise.supersetGroup,
          sets: {
            create: exercise.sets.map((set) => ({
              position: set.position,
              type: set.type,
              targetReps: set.targetReps,
              targetWeightKg: set.targetWeightKg,
              targetDurationSec: set.targetDurationSec,
              targetDistanceM: set.targetDistanceM,
              targetRpe: set.targetRpe,
            })),
          },
        })),
      },
    },
    include: ROUTINE_INCLUDE,
  });

  return toDetail(row, locale);
}

/**
 * Réordonne d'après la liste complète des identifiants. Comme pour les
 * dossiers, ce qui n'appartient pas à l'appelant est ignoré plutôt que de faire
 * échouer tout le geste.
 */
export async function reorderRoutines(
  input: ReorderInput,
  userId: string,
): Promise<RoutineSummary[]> {
  const owned = await prisma.routine.findMany({
    where: { id: { in: input.ids }, userId, deletedAt: null },
    select: { id: true },
  });

  const ownedIds = new Set(owned.map((row) => row.id));
  const ordered = input.ids.filter((id) => ownedIds.has(id));

  await prisma.$transaction(
    ordered.map((id, position) => prisma.routine.update({ where: { id }, data: { position } })),
  );

  return listRoutines({ sort: "position" }, userId);
}
