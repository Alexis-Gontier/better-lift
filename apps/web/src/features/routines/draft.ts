import {
  type ExerciseSummary,
  type RoutineDetail,
  type RoutineStructureInput,
  type SetType,
} from "@better-lift/validators";

/**
 * Brouillon de l'éditeur de routines (doc 05).
 *
 * ## Pourquoi tout est en chaîne de caractères
 *
 * Les champs de valeur — reps, charge, RPE — sont des `string`, pas des
 * nombres. Un `<input>` produit du texte, et le convertir à chaque frappe
 * empêche de taper « 10. » avant « 10.5 », ou d'effacer un champ sans qu'il
 * se remplisse d'un `0` surgi de nulle part. La conversion se fait **une
 * fois**, à l'enregistrement, dans `toStructure`.
 *
 * ## Pourquoi ce fichier ne connaît pas React
 *
 * C'est la partie de l'éditeur qui porte les règles : ordre, duplication,
 * conversion vers le contrat. Elle se teste sans monter un composant, et
 * l'écran n'a plus qu'à afficher.
 */

export interface DraftSet {
  /** Identité locale, stable tant que la série vit — c'est la clé du glisser-déposer. */
  key: string;
  type: SetType;
  targetReps: string;
  targetWeightKg: string;
  targetRpe: string;
}

export interface DraftExercise {
  key: string;
  exercise: ExerciseSummary;
  notes: string;
  restSec: string;
  supersetGroup: number | null;
  sets: DraftSet[];
}

export interface RoutineDraft {
  name: string;
  folderId: string | null;
  notes: string;
  exercises: DraftExercise[];
}

/**
 * Les clés sont locales et jetables : le serveur réassigne les identifiants à
 * chaque `PUT`, puisqu'il remplace la structure. S'en servir comme clés React
 * serait donc faux — d'où ces identités générées côté client.
 */
function newKey(): string {
  return crypto.randomUUID();
}

function emptySet(type: SetType = "NORMAL"): DraftSet {
  return { key: newKey(), type, targetReps: "", targetWeightKg: "", targetRpe: "" };
}

export function emptyDraft(): RoutineDraft {
  return { name: "", folderId: null, notes: "", exercises: [] };
}

/** Reconstruit un brouillon depuis une routine existante, pour l'édition. */
export function fromDetail(routine: RoutineDetail): RoutineDraft {
  return {
    name: routine.name,
    folderId: routine.folderId,
    notes: routine.notes ?? "",
    exercises: routine.exercises.map((exercise) => ({
      key: newKey(),
      exercise: exercise.exercise,
      notes: exercise.notes ?? "",
      restSec: exercise.restSec === null ? "" : String(exercise.restSec),
      supersetGroup: exercise.supersetGroup,
      sets: exercise.sets.map((set) => ({
        key: newKey(),
        type: set.type,
        targetReps: set.targetReps === null ? "" : String(set.targetReps),
        targetWeightKg: set.targetWeightKg ?? "",
        targetRpe: set.targetRpe ?? "",
      })),
    })),
  };
}

export type DraftAction =
  /** Remplace le brouillon entier — restauration d'une sauvegarde locale. */
  | { type: "replaceDraft"; draft: RoutineDraft }
  | { type: "setName"; value: string }
  | { type: "setNotes"; value: string }
  | { type: "setFolder"; value: string | null }
  | { type: "addExercise"; exercise: ExerciseSummary }
  | { type: "removeExercise"; key: string }
  | { type: "moveExercise"; from: string; to: string }
  | { type: "setExerciseField"; key: string; field: "notes" | "restSec"; value: string }
  | { type: "addSet"; exerciseKey: string }
  | { type: "removeSet"; exerciseKey: string; setKey: string }
  | {
      type: "setSetField";
      exerciseKey: string;
      setKey: string;
      field: "type" | "targetReps" | "targetWeightKg" | "targetRpe";
      value: string;
    };

/** Déplace un élément identifié par sa clé devant celui d'une autre clé. */
function move<T extends { key: string }>(items: T[], from: string, to: string): T[] {
  const fromIndex = items.findIndex((item) => item.key === from);
  const toIndex = items.findIndex((item) => item.key === to);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);

  // `moved` est défini : `fromIndex` vient d'un `findIndex` positif.
  if (moved) {
    next.splice(toIndex, 0, moved);
  }

  return next;
}

function mapExercise(
  draft: RoutineDraft,
  key: string,
  update: (exercise: DraftExercise) => DraftExercise,
): RoutineDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) =>
      exercise.key === key ? update(exercise) : exercise,
    ),
  };
}

export function draftReducer(draft: RoutineDraft, action: DraftAction): RoutineDraft {
  switch (action.type) {
    case "replaceDraft":
      return action.draft;

    case "setName":
      return { ...draft, name: action.value };

    case "setNotes":
      return { ...draft, notes: action.value };

    case "setFolder":
      return { ...draft, folderId: action.value };

    case "addExercise":
      /**
       * Un exercice arrive avec **une série**, jamais zéro : le contrat en
       * exige au moins une, et laisser l'utilisateur découvrir cette règle au
       * moment d'enregistrer serait une mauvaise surprise en fin de saisie.
       */
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

    case "moveExercise":
      return { ...draft, exercises: move(draft.exercises, action.from, action.to) };

    case "setExerciseField":
      return mapExercise(draft, action.key, (exercise) => ({
        ...exercise,
        [action.field]: action.value,
      }));

    case "addSet":
      /**
       * La plupart des séries d'un exercice sont identiques (doc 05) :
       * copier la dernière économise l'essentiel des saisies d'une routine.
       * Sans dernière série, on retombe sur un ajout vide.
       */
      return mapExercise(draft, action.exerciseKey, (exercise) => {
        const last = exercise.sets.at(-1);

        return {
          ...exercise,
          sets: [...exercise.sets, last ? { ...last, key: newKey() } : emptySet()],
        };
      });

    case "removeSet":
      return mapExercise(draft, action.exerciseKey, (exercise) => {
        const sets = exercise.sets.filter((set) => set.key !== action.setKey);

        // Jamais zéro série : le contrat en exige une, et un exercice sans
        // série n'a rien à prescrire.
        return { ...exercise, sets: sets.length > 0 ? sets : [emptySet()] };
      });

    case "setSetField":
      return mapExercise(draft, action.exerciseKey, (exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.key === action.setKey ? { ...set, [action.field]: action.value } : set,
        ),
      }));

    default:
      return draft;
  }
}

/**
 * Normalise une saisie décimale.
 *
 * La virgule devient un point : sur un clavier français, le pavé numérique
 * produit une virgule, et l'API n'accepte que le point. Refuser « 82,5 » pour
 * cette seule raison serait incompréhensible côté utilisateur.
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
 * Traduit le brouillon en corps de requête.
 *
 * Les champs vides sont **omis**, pas envoyés à `null` : une routine qui ne
 * prescrit qu'un nombre de séries est valide, et distinguer « non prescrit »
 * de « prescrit à zéro » est tout l'intérêt d'un gabarit.
 *
 * Aucune `position` n'est envoyée : l'ordre des tableaux la porte, le serveur
 * l'assigne (doc 04).
 */
export function toStructure(draft: RoutineDraft): RoutineStructureInput {
  return {
    name: draft.name.trim(),
    folderId: draft.folderId,
    notes: draft.notes.trim() === "" ? null : draft.notes.trim(),
    exercises: draft.exercises.map((exercise) => ({
      exerciseId: exercise.exercise.id,
      notes: exercise.notes.trim() === "" ? null : exercise.notes.trim(),
      restSec: toOptionalInt(exercise.restSec) ?? null,
      supersetGroup: exercise.supersetGroup,
      sets: exercise.sets.map((set) => ({
        type: set.type,
        targetReps: toOptionalInt(set.targetReps),
        targetWeightKg: toOptionalDecimal(set.targetWeightKg),
        targetRpe: toOptionalDecimal(set.targetRpe),
      })),
    })),
  };
}

/** Nombre total de séries, affiché dans l'en-tête de l'éditeur. */
export function countSets(draft: RoutineDraft): number {
  return draft.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}
