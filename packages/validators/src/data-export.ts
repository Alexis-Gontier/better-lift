import { z } from "zod";

import { bodyPartSchema, exerciseTypeSchema } from "./exercise.js";
import { setTypeSchema } from "./routine.js";
import { currentUserSchema, visibilitySchema } from "./session.js";
import { recordTypeSchema } from "./workout.js";

/**
 * Export RGPD (doc 04, § Compte — D18, D27).
 *
 * Trois propriétés que ce document doit tenir, et qui expliquent qu'il ne
 * réutilise pas les schémas de lecture de l'API :
 *
 *   - **il est autoportant.** Chaque exercice cité l'est par son identifiant
 *     *et* par son nom : un export ouvert dans un tableur trois ans plus tard
 *     ne peut pas résoudre un `exerciseId` contre une base à laquelle son
 *     lecteur n'a plus accès ;
 *   - **il ne dépend d'aucune locale.** Les noms d'exercices sont ceux du
 *     catalogue, pas la traduction du profil, sans quoi deux exports du même
 *     compte différeraient sur un simple changement de langue ;
 *   - **il dit tout ce qui est stocké**, y compris ce que l'interface cache :
 *     les routines supprimées le sont logiquement (`deletedAt`), elles restent
 *     donc en base et donc dans l'export.
 *
 * Les charges restent des chaînes décimales (règle non négociable n°4) et tout
 * y est métrique (n°3) : `unitSystem` du profil reste une préférence
 * d'affichage, elle ne convertit rien ici.
 */

/**
 * Version du **format**, pas de l'application. Elle n'a qu'un usage : permettre
 * à un futur import de reconnaître ce qu'il lit. Toute rupture de forme
 * l'incrémente.
 */
export const DATA_EXPORT_VERSION = 1;

export const dataExportExerciseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  /** Nom de base, indépendant de la locale. Les traductions suivent. */
  name: z.string(),
  type: exerciseTypeSchema,
  bodyPart: bodyPartSchema,
  equipment: z.string(),
  target: z.string(),
  secondaryMuscles: z.array(z.string()),
  isArchived: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  translations: z.array(
    z.object({
      /**
       * `z.string()` et non `localeSchema` : la colonne est libre en base, et un
       * export ne doit jamais échouer à se sérialiser sur une valeur qu'on ne
       * sert plus.
       */
      locale: z.string(),
      name: z.string(),
      instructions: z.array(z.string()),
    }),
  ),
});

/**
 * Référence à un exercice depuis une routine ou une séance : l'identifiant pour
 * recouper, le nom pour lire. L'exercice lui-même n'est détaillé qu'une fois,
 * dans `customExercises` — et pas du tout s'il vient du catalogue commun, qui
 * n'est pas une donnée personnelle.
 */
const exerciseReference = {
  exerciseId: z.string(),
  exerciseName: z.string(),
};

export const dataExportRoutineSchema = z.object({
  id: z.string(),
  name: z.string(),
  folderId: z.string().nullable(),
  notes: z.string().nullable(),
  position: z.number().int(),
  lastPerformedAt: z.iso.datetime().nullable(),
  performedCount: z.number().int(),
  /** Non nulle : routine supprimée côté interface, conservée en base. */
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  exercises: z.array(
    z.object({
      ...exerciseReference,
      position: z.number().int(),
      notes: z.string().nullable(),
      restSec: z.number().int().nullable(),
      supersetGroup: z.number().int().nullable(),
      sets: z.array(
        z.object({
          position: z.number().int(),
          type: setTypeSchema,
          targetReps: z.number().int().nullable(),
          targetWeightKg: z.string().nullable(),
          targetDurationSec: z.number().int().nullable(),
          targetDistanceM: z.string().nullable(),
          targetRpe: z.string().nullable(),
        }),
      ),
    }),
  ),
});

export const dataExportWorkoutSchema = z.object({
  id: z.string(),
  /** Nul si séance libre, ou si la routine d'origine a été purgée. */
  routineId: z.string().nullable(),
  title: z.string(),
  notes: z.string().nullable(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
  durationSec: z.number().int(),
  totalVolumeKg: z.string(),
  totalSets: z.number().int(),
  totalReps: z.number().int(),
  prCount: z.number().int(),
  visibility: visibilitySchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  exercises: z.array(
    z.object({
      ...exerciseReference,
      position: z.number().int(),
      notes: z.string().nullable(),
      restSec: z.number().int().nullable(),
      supersetGroup: z.number().int().nullable(),
      sets: z.array(
        z.object({
          position: z.number().int(),
          type: setTypeSchema,
          reps: z.number().int().nullable(),
          weightKg: z.string().nullable(),
          durationSec: z.number().int().nullable(),
          distanceM: z.string().nullable(),
          rpe: z.string().nullable(),
          /** `false` : série planifiée mais jamais validée, donc hors agrégats. */
          completed: z.boolean(),
          completedAt: z.iso.datetime().nullable(),
          isPr: z.boolean(),
        }),
      ),
    }),
  ),
});

export const dataExportRecordSchema = z.object({
  ...exerciseReference,
  type: recordTypeSchema,
  value: z.string(),
  reps: z.number().int().nullable(),
  weightKg: z.string().nullable(),
  achievedAt: z.iso.datetime(),
  /** Nul si la séance qui l'a produit a été supprimée : le record reste vrai. */
  workoutId: z.string().nullable(),
});

export const dataExportSchema = z.object({
  version: z.literal(DATA_EXPORT_VERSION),
  exportedAt: z.iso.datetime(),
  profile: currentUserSchema,
  /**
   * Les exercices **personnalisés** seuls. Le catalogue commun n'appartient à
   * personne : l'exporter ajouterait 1 324 entrées identiques pour tous, sans
   * rien dire de l'utilisateur.
   */
  customExercises: z.array(dataExportExerciseSchema),
  routineFolders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      position: z.number().int(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
  ),
  routines: z.array(dataExportRoutineSchema),
  /** Antéchronologiques, comme l'historique. */
  workouts: z.array(dataExportWorkoutSchema),
  records: z.array(dataExportRecordSchema),
});

export type DataExportExercise = z.infer<typeof dataExportExerciseSchema>;
export type DataExportRoutine = z.infer<typeof dataExportRoutineSchema>;
export type DataExportWorkout = z.infer<typeof dataExportWorkoutSchema>;
export type DataExportRecord = z.infer<typeof dataExportRecordSchema>;
export type DataExport = z.infer<typeof dataExportSchema>;
