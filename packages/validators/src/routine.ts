import { z } from "zod";

import { exerciseSummarySchema } from "./exercise.js";

/**
 * Contrats des dossiers et des routines (doc 04, § Dossiers et § Routines).
 *
 * Une routine est un **gabarit** : elle ne contient que des cibles, jamais du
 * réalisé (règle non négociable n°5). Tous les champs de valeur d'une série
 * sont donc optionnels — une routine qui ne prescrit qu'un nombre de séries est
 * parfaitement valide, et c'est même le cas le plus fréquent en début de bloc.
 */

export const setTypeSchema = z.enum(["WARMUP", "NORMAL", "FAILURE", "DROP"]);

/**
 * Charges, distances et RPE voyagent en **chaîne décimale** (`"82.50"`), jamais
 * en nombre : un flottant IEEE 754 ne représente pas exactement 0,1, et une
 * charge qui traverse trois clients finirait par dériver.
 *
 * La validation reste ici plutôt que dans `packages/core` : c'est une règle de
 * **forme**, pas de calcul, et `packages/validators` ne dépend de rien d'autre
 * que Zod — une propriété qu'on préfère garder.
 */
function decimalString({ scale, min, max }: { scale: number; min: number; max: number }) {
  return z
    .string()
    .trim()
    .regex(new RegExp(`^\\d+(\\.\\d{1,${scale}})?$`), `Attendu : un nombre à ${scale} décimale(s).`)
    .refine((value) => {
      const parsed = Number(value);

      return parsed >= min && parsed <= max;
    }, `Attendu : entre ${min} et ${max}.`);
}

/** `Decimal(7,2)` en base : jusqu'à 99 999,99 kg. */
export const weightKgSchema = decimalString({ scale: 2, min: 0, max: 99_999.99 });
/** `Decimal(9,2)` en base. */
export const distanceMSchema = decimalString({ scale: 2, min: 0, max: 9_999_999.99 });
/** Effort perçu, `Decimal(3,1)` en base. */
export const rpeSchema = decimalString({ scale: 1, min: 1, max: 10 });

/** Bornes du repos par exercice : les mêmes que le repos par défaut du profil. */
const MIN_REST_SEC = 10;
const MAX_REST_SEC = 3600;

/** 24 h, comme le plafond de durée d'une séance (invariant 2, doc 03). */
const MAX_DURATION_SEC = 86_400;

export const MAX_EXERCISES_PER_ROUTINE = 50;
export const MAX_SETS_PER_EXERCISE = 30;

/**
 * Série cible, telle que le client l'envoie.
 *
 * Aucune `position` : **l'ordre du tableau la porte**, et le serveur l'assigne
 * (doc 04). Laisser le client la fournir, c'est accepter qu'il envoie deux fois
 * la même, ou une suite à trous — une source d'incohérence en moins.
 */
export const routineSetInputSchema = z
  .object({
    type: setTypeSchema.default("NORMAL"),
    targetReps: z.number().int().min(1).max(999).nullable().optional(),
    targetWeightKg: weightKgSchema.nullable().optional(),
    targetDurationSec: z.number().int().min(1).max(MAX_DURATION_SEC).nullable().optional(),
    targetDistanceM: distanceMSchema.nullable().optional(),
    targetRpe: rpeSchema.nullable().optional(),
  })
  .strict();

export const routineExerciseInputSchema = z
  .object({
    exerciseId: z.string().min(1),
    notes: z.string().trim().max(500).nullable().optional(),
    restSec: z.number().int().min(MIN_REST_SEC).max(MAX_REST_SEC).nullable().optional(),
    /**
     * Les exercices partageant cette valeur forment un superset. Le modèle le
     * porte dès la V1, l'interface viendra en V2 (D8). Un groupe resté seul est
     * ramené à `null` par le serveur (invariant 4) : à deux, ce n'est plus un
     * superset, c'est un exercice.
     */
    supersetGroup: z.number().int().min(0).max(50).nullable().optional(),
    sets: z.array(routineSetInputSchema).min(1).max(MAX_SETS_PER_EXERCISE),
  })
  .strict();

/**
 * Structure complète d'une routine, pour `POST` comme pour `PUT`.
 *
 * Le `PUT` **remplace intégralement** (doc 04) : un PATCH granulaire sur des
 * sous-ressources imbriquées — « la série 2 de l'exercice 3 » — multiplierait
 * les allers-retours et les états intermédiaires incohérents. L'éditeur web
 * travaille sur un brouillon local et envoie l'ensemble en une transaction.
 */
export const routineStructureSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom est requis.").max(120, "120 caractères au maximum."),
    folderId: z.string().min(1).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    exercises: z.array(routineExerciseInputSchema).max(MAX_EXERCISES_PER_ROUTINE).default([]),
  })
  .strict();

/**
 * Métadonnées seules. Sert à renommer ou à déplacer sans renvoyer toute la
 * structure — le cas d'un glisser-déposer entre dossiers, où l'éditeur n'est
 * même pas ouvert.
 */
export const updateRoutineSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    folderId: z.string().min(1).nullable(),
    notes: z.string().trim().max(2000).nullable(),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins un champ doit être fourni.",
  });

/**
 * Réordonnancement : la liste **complète** des identifiants dans leur nouvel
 * ordre, pas un déplacement relatif.
 *
 * L'ordre absolu est le seul à ne pas dépendre de ce que le client croit savoir
 * de l'état du serveur. Un « déplace de 2 vers le haut » appliqué à une liste
 * qui a bougé entre-temps range l'élément ailleurs, sans erreur.
 */
export const reorderSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(200) }).strict();

// ── Sorties ───────────────────────────────────────────────────────────────

export const routineSetSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  type: setTypeSchema,
  targetReps: z.number().int().nullable(),
  targetWeightKg: z.string().nullable(),
  targetDurationSec: z.number().int().nullable(),
  targetDistanceM: z.string().nullable(),
  targetRpe: z.string().nullable(),
});

export const routineExerciseSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  notes: z.string().nullable(),
  restSec: z.number().int().nullable(),
  supersetGroup: z.number().int().nullable(),
  /**
   * L'exercice est **embarqué**, pas seulement référencé : afficher une routine
   * demanderait sinon une requête par exercice, ou un catalogue entier chargé
   * côté client pour résoudre des identifiants.
   */
  exercise: exerciseSummarySchema,
  sets: z.array(routineSetSchema),
});

export const routineSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  folderId: z.string().nullable(),
  notes: z.string().nullable(),
  position: z.number().int(),
  /**
   * De quoi afficher une carte de routine sans charger sa structure.
   *
   * `setCount` est le total des séries **cibles**, toutes lignes confondues :
   * c'est ce qui distingue une séance de vingt minutes d'une d'une heure et
   * demie, là où le nombre d'exercices seul ne dit rien du volume. Trois
   * exercices à cinq séries et trois à deux séries donnent la même carte sans
   * lui.
   */
  exerciseCount: z.number().int(),
  setCount: z.number().int(),
  lastPerformedAt: z.iso.datetime().nullable(),
  performedCount: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const routineDetailSchema = routineSummarySchema.extend({
  exercises: z.array(routineExerciseSchema),
});

/**
 * La liste n'est **pas paginée**, contrairement au catalogue.
 *
 * Le nombre de routines est borné par l'effort de leur auteur : quelques
 * dizaines, jamais des milliers. L'écran les affiche toutes, groupées par
 * dossier. Un curseur imposerait en prime une clé composite dès qu'on trie par
 * nom ou par dernière utilisation, deux colonnes non uniques — de la complexité
 * pour une liste qui tient à l'écran.
 */
export const routineListResponseSchema = z.object({ data: z.array(routineSummarySchema) });

export const routineSortSchema = z.enum(["position", "name", "recent"]);

export const routineListQuerySchema = z.object({
  /**
   * Restreint à un dossier. L'absence de filtre ramène **toutes** les routines,
   * classées ou non : la liste n'étant pas paginée, l'écran groupe lui-même par
   * dossier sans un appel de plus.
   */
  folderId: z.string().min(1).optional(),
  sort: routineSortSchema.default("position"),
});

// ── Dossiers ──────────────────────────────────────────────────────────────

export const routineFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().int(),
  /** Compté côté serveur : l'écran de liste l'affiche sans charger les routines. */
  routineCount: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const routineFolderListResponseSchema = z.object({
  data: z.array(routineFolderSchema),
});

/**
 * Un dossier n'a qu'un champ modifiable : son nom. Créer et renommer prennent
 * donc exactement le même corps, et un seul schéma les sert — deux noms pour
 * la même règle finiraient par diverger.
 */
export const routineFolderInputSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom est requis.").max(120, "120 caractères au maximum."),
  })
  .strict();

export type SetType = z.infer<typeof setTypeSchema>;
export type RoutineSetInput = z.input<typeof routineSetInputSchema>;
export type RoutineExerciseInput = z.input<typeof routineExerciseInputSchema>;
export type RoutineStructureInput = z.input<typeof routineStructureSchema>;
export type RoutineStructurePayload = z.infer<typeof routineStructureSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type RoutineSet = z.infer<typeof routineSetSchema>;
export type RoutineExercise = z.infer<typeof routineExerciseSchema>;
export type RoutineSummary = z.infer<typeof routineSummarySchema>;
export type RoutineDetail = z.infer<typeof routineDetailSchema>;
export type RoutineListQuery = z.infer<typeof routineListQuerySchema>;
export type RoutineListResponse = z.infer<typeof routineListResponseSchema>;
export type RoutineSort = z.infer<typeof routineSortSchema>;
export type RoutineFolder = z.infer<typeof routineFolderSchema>;
export type RoutineFolderListResponse = z.infer<typeof routineFolderListResponseSchema>;
export type RoutineFolderInput = z.infer<typeof routineFolderInputSchema>;
