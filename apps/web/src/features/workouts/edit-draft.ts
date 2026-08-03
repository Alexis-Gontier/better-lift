import {
  type ExerciseSummary,
  type ExerciseType,
  type SetType,
  type WorkoutDetail,
  type WorkoutStructureInput,
} from "@better-lift/validators";

/**
 * Brouillon de l'éditeur d'une séance **passée** (doc 05, D10).
 *
 * ## Ce qui le distingue du brouillon de routine
 *
 * Une routine prescrit, une séance constate. On n'y saisit donc pas des cibles
 * mais du réalisé, et surtout un drapeau `completed` : c'est lui qui décide de
 * ce qui compte dans le volume et dans les records (doc 03). Le décocher est
 * une correction courante — la série notée par erreur —, et elle doit être
 * possible sans supprimer la ligne, qui dit ce qui était prévu.
 *
 * ## Pourquoi tout est en chaîne de caractères
 *
 * Comme partout ailleurs dans le projet : un `<input>` produit du texte, et
 * convertir à chaque frappe empêche de taper « 82, » avant « 82,5 » ou
 * d'effacer un champ sans qu'il se remplisse d'un zéro. La conversion se fait
 * **une fois**, à l'enregistrement.
 *
 * ## Pourquoi ce fichier ne connaît pas React
 *
 * C'est la partie qui porte les règles — ordre, colonnes par type d'exercice,
 * conversion vers le contrat. Elle se teste sans monter un composant.
 */

interface DraftSet {
  /** Identité locale, stable tant que la série vit. Le serveur réassigne la sienne. */
  key: string;
  type: SetType;
  reps: string;
  weightKg: string;
  rpe: string;
  durationSec: string;
  distanceM: string;
  completed: boolean;
  /**
   * Conservé tel quel quand la série existait déjà : c'est l'heure à laquelle
   * elle a réellement été validée. La corriger depuis l'éditeur reviendrait à
   * réécrire l'histoire pour avoir touché à une charge.
   */
  completedAt: string | null;
}

export interface DraftExercise {
  key: string;
  exercise: ExerciseSummary;
  notes: string;
  restSec: string;
  supersetGroup: number | null;
  sets: DraftSet[];
}

export interface WorkoutEditDraft {
  title: string;
  notes: string;
  /** Format `datetime-local` : « 2026-08-03T18:00 », dans le fuseau du navigateur. */
  startedAt: string;
  endedAt: string;
  exercises: DraftExercise[];
}

/** Champs saisissables selon le type d'exercice (doc 03). */
export type Column = "weightKg" | "reps" | "durationSec" | "distanceM";

const COLUMNS: Record<ExerciseType, Column[]> = {
  WEIGHT_REPS: ["weightKg", "reps"],
  BODYWEIGHT_REPS: ["reps"],
  WEIGHTED_BODYWEIGHT: ["weightKg", "reps"],
  ASSISTED_BODYWEIGHT: ["weightKg", "reps"],
  REPS_ONLY: ["reps"],
  DURATION: ["durationSec"],
  DURATION_WEIGHT: ["weightKg", "durationSec"],
  DISTANCE_DURATION: ["distanceM", "durationSec"],
};

/**
 * Proposer une charge sur un gainage n'a pas de sens ; l'omettre sur un
 * développé couché en perdrait la moitié. Le tableau de la doc 03 décide.
 */
export function columnsFor(type: ExerciseType): Column[] {
  return COLUMNS[type];
}

function newKey(): string {
  return crypto.randomUUID();
}

function emptySet(type: SetType = "NORMAL"): DraftSet {
  return {
    key: newKey(),
    type,
    reps: "",
    weightKg: "",
    rpe: "",
    durationSec: "",
    distanceM: "",
    // Une série ajoutée depuis l'éditeur d'une séance passée est une série
    // qu'on avait oublié de noter : elle a donc été faite.
    completed: true,
    completedAt: null,
  };
}

/**
 * Traduit un instant ISO en valeur d'`<input type="datetime-local">`.
 *
 * L'entrée attend une heure **locale sans fuseau**, quand l'API parle en UTC :
 * découper la chaîne ISO afficherait 16 h pour une séance de 18 h l'été. Le
 * décalage est donc retiré avant le formatage.
 */
export function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

/** Le chemin inverse : l'heure locale saisie redevient un instant UTC. */
export function fromLocalInput(value: string): string | null {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function fromDetail(workout: WorkoutDetail): WorkoutEditDraft {
  return {
    title: workout.title,
    notes: workout.notes ?? "",
    startedAt: toLocalInput(workout.startedAt),
    endedAt: workout.endedAt === null ? "" : toLocalInput(workout.endedAt),
    exercises: workout.exercises.map((exercise) => ({
      key: newKey(),
      exercise: exercise.exercise,
      notes: exercise.notes ?? "",
      restSec: exercise.restSec === null ? "" : String(exercise.restSec),
      supersetGroup: exercise.supersetGroup,
      sets: exercise.sets.map((set) => ({
        key: newKey(),
        type: set.type,
        reps: set.reps === null ? "" : String(set.reps),
        weightKg: set.weightKg ?? "",
        rpe: set.rpe ?? "",
        durationSec: set.durationSec === null ? "" : String(set.durationSec),
        distanceM: set.distanceM ?? "",
        completed: set.completed,
        completedAt: set.completedAt,
      })),
    })),
  };
}

export type DraftAction =
  | { type: "setTitle"; value: string }
  | { type: "setNotes"; value: string }
  | { type: "setStartedAt"; value: string }
  | { type: "setEndedAt"; value: string }
  | { type: "addExercise"; exercise: ExerciseSummary }
  | { type: "removeExercise"; key: string }
  | { type: "moveExercise"; key: string; direction: -1 | 1 }
  | { type: "setExerciseField"; key: string; field: "notes" | "restSec"; value: string }
  | { type: "addSet"; exerciseKey: string }
  | { type: "removeSet"; exerciseKey: string; setKey: string }
  | { type: "toggleSet"; exerciseKey: string; setKey: string }
  | { type: "setSetType"; exerciseKey: string; setKey: string; value: SetType }
  | {
      type: "setSetField";
      exerciseKey: string;
      setKey: string;
      field: Column | "rpe";
      value: string;
    };

function mapExercise(
  draft: WorkoutEditDraft,
  key: string,
  update: (exercise: DraftExercise) => DraftExercise,
): WorkoutEditDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) =>
      exercise.key === key ? update(exercise) : exercise,
    ),
  };
}

function mapSet(
  exercise: DraftExercise,
  key: string,
  update: (set: DraftSet) => DraftSet,
): DraftExercise {
  return {
    ...exercise,
    sets: exercise.sets.map((set) => (set.key === key ? update(set) : set)),
  };
}

export function draftReducer(draft: WorkoutEditDraft, action: DraftAction): WorkoutEditDraft {
  switch (action.type) {
    case "setTitle":
      return { ...draft, title: action.value };

    case "setNotes":
      return { ...draft, notes: action.value };

    case "setStartedAt":
      return { ...draft, startedAt: action.value };

    case "setEndedAt":
      return { ...draft, endedAt: action.value };

    case "addExercise":
      return {
        ...draft,
        exercises: [
          ...draft.exercises,
          {
            key: newKey(),
            exercise: action.exercise,
            notes: "",
            restSec: "",
            supersetGroup: null,
            sets: [emptySet()],
          },
        ],
      };

    case "removeExercise":
      return {
        ...draft,
        exercises: draft.exercises.filter((exercise) => exercise.key !== action.key),
      };

    case "moveExercise": {
      const index = draft.exercises.findIndex((exercise) => exercise.key === action.key);
      const target = index + action.direction;

      // Aux extrémités, on ne fait rien : le bouton est déjà désactivé, mais un
      // raccourci clavier ou un double appui rapide peut encore passer par ici.
      if (index === -1 || target < 0 || target >= draft.exercises.length) {
        return draft;
      }

      const exercises = [...draft.exercises];
      const [moved] = exercises.splice(index, 1);

      if (moved) {
        exercises.splice(target, 0, moved);
      }

      return { ...draft, exercises };
    }

    case "setExerciseField":
      return mapExercise(draft, action.key, (exercise) => ({
        ...exercise,
        [action.field]: action.value,
      }));

    case "addSet":
      return mapExercise(draft, action.exerciseKey, (exercise) => {
        const last = exercise.sets.at(-1);

        /**
         * La nouvelle série hérite des valeurs de la précédente : on corrige
         * presque toujours une séance en ajoutant une série faite à la même
         * charge, et retaper « 100 » est exactement la friction à éviter. La
         * date de validation, elle, ne se recopie pas — cette série-là n'a pas
         * été validée à l'instant de l'autre.
         */
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            last ? { ...last, key: newKey(), completed: true, completedAt: null } : emptySet(),
          ],
        };
      });

    case "removeSet":
      return mapExercise(draft, action.exerciseKey, (exercise) => ({
        ...exercise,
        /**
         * Zéro série est permis, contrairement à une routine : le contrat
         * l'accepte, et un exercice commencé puis abandonné est une chose qui
         * arrive vraiment.
         */
        sets: exercise.sets.filter((set) => set.key !== action.setKey),
      }));

    case "toggleSet":
      return mapExercise(draft, action.exerciseKey, (exercise) =>
        mapSet(exercise, action.setKey, (set) => ({
          ...set,
          completed: !set.completed,
          // Décocher efface l'heure de validation : une série qui n'a pas été
          // faite n'a pas d'instant où elle l'aurait été.
          completedAt: set.completed ? null : set.completedAt,
        })),
      );

    case "setSetType":
      return mapExercise(draft, action.exerciseKey, (exercise) =>
        mapSet(exercise, action.setKey, (set) => ({ ...set, type: action.value })),
      );

    case "setSetField":
      return mapExercise(draft, action.exerciseKey, (exercise) =>
        mapSet(exercise, action.setKey, (set) => ({ ...set, [action.field]: action.value })),
      );
  }
}

/**
 * Normalise une saisie décimale : sur un clavier français, le pavé numérique
 * produit une virgule, que l'API n'accepte pas. Refuser « 82,5 » pour cette
 * seule raison serait incompréhensible.
 */
export function normalizeDecimal(value: string): string {
  return value.trim().replace(",", ".");
}

function toOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();

  return trimmed === "" ? undefined : Number(trimmed);
}

function toOptionalDecimal(value: string): string | undefined {
  const normalized = normalizeDecimal(value);

  return normalized === "" ? undefined : normalized;
}

/**
 * Traduit le brouillon en corps de `PUT /v1/workouts/:id`, qui **remplace** la
 * structure entière (doc 04). Aucune `position` n'est envoyée : l'ordre des
 * tableaux la porte, le serveur l'assigne.
 *
 * `startedAt` invalide fait échouer la conversion plutôt que d'envoyer une date
 * inventée : c'est le seul champ dont l'absence n'a pas de repli sensé.
 */
export function toStructure(draft: WorkoutEditDraft): WorkoutStructureInput | null {
  const startedAt = fromLocalInput(draft.startedAt);

  if (startedAt === null) {
    return null;
  }

  return {
    title: draft.title.trim(),
    notes: draft.notes.trim() === "" ? null : draft.notes.trim(),
    startedAt,
    // Une séance sans fin est une séance encore en cours : le contrat l'admet.
    endedAt: draft.endedAt === "" ? null : fromLocalInput(draft.endedAt),
    exercises: draft.exercises.map((exercise) => ({
      exerciseId: exercise.exercise.id,
      notes: exercise.notes.trim() === "" ? null : exercise.notes.trim(),
      restSec: toOptionalInt(exercise.restSec) ?? null,
      supersetGroup: exercise.supersetGroup,
      sets: exercise.sets.map((set) => ({
        type: set.type,
        reps: toOptionalInt(set.reps),
        weightKg: toOptionalDecimal(set.weightKg),
        durationSec: toOptionalInt(set.durationSec),
        distanceM: toOptionalDecimal(set.distanceM),
        rpe: toOptionalDecimal(set.rpe),
        completed: set.completed,
        /**
         * Une série ajoutée depuis l'éditeur n'a pas de date de validation, et
         * on n'en invente pas : l'API pose la sienne pour toute série cochée
         * qui arrive sans. Choisir ici un repli — le début de séance, l'heure
         * courante — ferait exister deux règles pour la même valeur.
         */
        completedAt: set.completedAt ?? undefined,
      })),
    })),
  };
}

/** Nombre de séries validées : ce qui comptera dans le volume et les records. */
export function countCompletedSets(draft: WorkoutEditDraft): number {
  return draft.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );
}
