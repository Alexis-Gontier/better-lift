import {
  type CreateWorkoutInput,
  type ExerciseType,
  type LastPerformance,
  type RoutineDetail,
  type SetType,
  type WorkoutSetInput,
} from "@better-lift/validators";

/**
 * Brouillon de séance active.
 *
 * ## Pourquoi tout est en chaîne
 *
 * Les champs de valeur sont des **chaînes**, jamais des nombres, exactement
 * comme dans l'éditeur web. Un champ de saisie n'a pas d'état « vide » en
 * nombre : `0` et « rien tapé » sont deux choses différentes, et une charge
 * décimale en cours de frappe (« 82, ») n'est un nombre à aucun moment. La
 * conversion se fait une seule fois, à l'envoi.
 *
 * ## Pourquoi le nom de l'exercice est copié
 *
 * Une séance est un **instantané indépendant** (règle non négociable n°5) : le
 * brouillon copie le nom et le type au démarrage. Il survit ainsi à la
 * suppression de la routine d'origine, et s'affiche hors ligne sans dépendre
 * d'un cache de catalogue.
 */

export interface DraftSet {
  /** Stable pour toute la vie de la série : c'est la clé de rendu et de mise à jour. */
  key: string;
  type: SetType;
  reps: string;
  weightKg: string;
  rpe: string;
  durationSec: string;
  distanceM: string;
  completed: boolean;
  /** Horodaté à la coche, pas à l'envoi : entre les deux il y a le vestiaire. */
  completedAt: string | null;
}

export interface DraftExercise {
  key: string;
  exerciseId: string;
  /** Copié au démarrage : le brouillon ne dépend plus du catalogue ensuite. */
  name: string;
  exerciseType: ExerciseType;
  restSec: number | null;
  supersetGroup: number | null;
  notes: string;
  sets: DraftSet[];
  /** Ce que la dernière séance a donné, pour la colonne « PRÉC. ». */
  previous: PreviousSet[];
}

/**
 * Une série de la dernière séance.
 *
 * Le résumé lisible **et** les valeurs par colonne sont portés séparément :
 * la colonne « PRÉC. » affiche le premier, les champs de saisie prennent les
 * secondes en placeholder. Reconstituer les valeurs en découpant le résumé
 * marcherait jusqu'au jour où le format du résumé change.
 */
export interface PreviousSet {
  label: string;
  values: Partial<Record<Column, string>>;
}

export interface WorkoutDraft {
  /** Généré ici. C'est lui qui rend `POST /v1/workouts` idempotent (règle n°7). */
  id: string;
  routineId: string | null;
  title: string;
  notes: string;
  startedAt: string;
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

export const COLUMN_LABELS: Record<Column, string> = {
  weightKg: "kg",
  reps: "Reps",
  durationSec: "Sec.",
  distanceM: "m",
};

export function columnsFor(type: ExerciseType): Column[] {
  return COLUMNS[type];
}

let counter = 0;

/**
 * Clé locale, jamais envoyée à l'API. Un compteur suffit et reste lisible dans
 * les journaux ; l'unicité n'a besoin d'être vraie que dans ce brouillon.
 */
function nextKey(prefix: string): string {
  counter += 1;

  return `${prefix}${counter}`;
}

/**
 * Identifiant de séance, généré **côté client** (règle non négociable n°7).
 *
 * `crypto.randomUUID` n'existe pas dans Hermes : la valeur est composée à la
 * main, en restant dans l'alphabet que le contrat accepte. L'unicité tient au
 * temps et à 40 bits d'aléa — deux séances démarrées à la même milliseconde sur
 * le même téléphone n'existent pas.
 */
export function newWorkoutId(): string {
  const random = Math.floor(Math.random() * 2 ** 40).toString(36);

  return `w${Date.now().toString(36)}${random}`;
}

function emptySet(type: SetType = "NORMAL"): DraftSet {
  return {
    key: nextKey("s"),
    type,
    reps: "",
    weightKg: "",
    rpe: "",
    durationSec: "",
    distanceM: "",
    completed: false,
    completedAt: null,
  };
}

/**
 * Traduit une série passée en repère de saisie : « 100 × 5 » à afficher, et
 * les valeurs par colonne pour pré-remplir les champs.
 */
function describe(set: LastPerformance["sets"][number]): PreviousSet {
  const values: Partial<Record<Column, string>> = {};

  if (set.weightKg !== null) {
    values.weightKg = set.weightKg;
  }

  if (set.reps !== null) {
    values.reps = String(set.reps);
  }

  if (set.durationSec !== null) {
    values.durationSec = String(set.durationSec);
  }

  if (set.distanceM !== null) {
    values.distanceM = set.distanceM;
  }

  return { label: label(set), values };
}

function label(set: LastPerformance["sets"][number]): string {
  if (set.weightKg !== null && set.reps !== null) {
    return `${set.weightKg} × ${set.reps}`;
  }

  if (set.reps !== null) {
    return `${set.reps} reps`;
  }

  if (set.distanceM !== null && set.durationSec !== null) {
    return `${set.distanceM} m · ${set.durationSec} s`;
  }

  if (set.durationSec !== null) {
    return `${set.durationSec} s`;
  }

  return set.weightKg ?? "—";
}

/**
 * Construit le brouillon depuis une routine.
 *
 * Les séries cibles deviennent des séries **vides mais typées** : la charge
 * prescrite n'est pas recopiée dans le champ. C'est la performance de la
 * dernière séance qui pré-remplit (doc 06), pas la cible — une routine écrite
 * il y a six mois prescrit une charge qu'on a dépassée depuis.
 */
export function draftFromRoutine(
  routine: RoutineDetail,
  performances: readonly LastPerformance[] = [],
  now: Date = new Date(),
): WorkoutDraft {
  const previousByExercise = new Map(
    performances.map((entry) => [entry.exerciseId, entry.sets.map(describe)] as const),
  );

  return {
    id: newWorkoutId(),
    routineId: routine.id,
    title: routine.name,
    notes: "",
    startedAt: now.toISOString(),
    exercises: routine.exercises.map((exercise) => ({
      key: nextKey("e"),
      exerciseId: exercise.exercise.id,
      name: exercise.exercise.name,
      exerciseType: exercise.exercise.type,
      restSec: exercise.restSec,
      supersetGroup: exercise.supersetGroup,
      notes: exercise.notes ?? "",
      sets: exercise.sets.map((set) => emptySet(set.type)),
      previous: previousByExercise.get(exercise.exercise.id) ?? [],
    })),
  };
}

// ── Réducteur ─────────────────────────────────────────────────────────────

export type DraftAction =
  /** `null` met fin à la séance : envoyée, ou abandonnée. */
  | { type: "replace"; draft: WorkoutDraft | null }
  | { type: "setTitle"; value: string }
  | { type: "setNotes"; value: string }
  | { type: "setField"; exerciseKey: string; setKey: string; field: keyof DraftSet; value: string }
  | { type: "toggleSet"; exerciseKey: string; setKey: string; at: string }
  | { type: "cycleSetType"; exerciseKey: string; setKey: string }
  | { type: "addSet"; exerciseKey: string }
  | { type: "removeSet"; exerciseKey: string; setKey: string }
  | { type: "removeExercise"; exerciseKey: string };

/** L'ordre du cycle suit la fréquence d'usage, pas celui de l'énumération. */
const TYPE_CYCLE: SetType[] = ["NORMAL", "WARMUP", "FAILURE", "DROP"];

/**
 * Virgule décimale française acceptée telle quelle. Sans cela, « 82,5 » saisi
 * au clavier natif partirait en `82` — une erreur muette sur une charge.
 */
export function normalizeDecimal(value: string): string {
  return value.replace(",", ".").trim();
}

function mapExercise(
  draft: WorkoutDraft,
  key: string,
  update: (exercise: DraftExercise) => DraftExercise,
): WorkoutDraft {
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

/**
 * L'absence de séance est un état du brouillon, pas un cas particulier de
 * l'écran : sans séance en cours, toute action autre que « remplacer » n'a
 * simplement pas d'objet.
 */
export function draftReducer(draft: WorkoutDraft | null, action: DraftAction): WorkoutDraft | null {
  if (action.type === "replace") {
    return action.draft;
  }

  if (draft === null) {
    return null;
  }

  switch (action.type) {
    case "setTitle":
      return { ...draft, title: action.value };

    case "setNotes":
      return { ...draft, notes: action.value };

    case "setField":
      return mapExercise(draft, action.exerciseKey, (exercise) =>
        mapSet(exercise, action.setKey, (set) => ({ ...set, [action.field]: action.value })),
      );

    case "toggleSet":
      return mapExercise(draft, action.exerciseKey, (exercise) =>
        mapSet(exercise, action.setKey, (set) => ({
          ...set,
          completed: !set.completed,
          // La date est celle de la coche. Décocher l'efface : une série
          // rouverte n'a pas été validée à l'instant où elle l'avait été.
          completedAt: set.completed ? null : action.at,
        })),
      );

    case "cycleSetType":
      return mapExercise(draft, action.exerciseKey, (exercise) =>
        mapSet(exercise, action.setKey, (set) => {
          const index = TYPE_CYCLE.indexOf(set.type);

          return { ...set, type: TYPE_CYCLE[(index + 1) % TYPE_CYCLE.length] ?? "NORMAL" };
        }),
      );

    case "addSet":
      return mapExercise(draft, action.exerciseKey, (exercise) => ({
        ...exercise,
        /**
         * La nouvelle série hérite des valeurs de la dernière, pas d'un champ
         * vide : on enchaîne presque toujours à la même charge, et retaper
         * « 100 » entre deux séries est exactement la friction qu'on cherche à
         * supprimer.
         */
        sets: [...exercise.sets, cloneForNext(exercise.sets.at(-1))],
      }));

    case "removeSet":
      return mapExercise(draft, action.exerciseKey, (exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => set.key !== action.setKey),
      }));

    case "removeExercise":
      return {
        ...draft,
        exercises: draft.exercises.filter((exercise) => exercise.key !== action.exerciseKey),
      };
  }
}

function cloneForNext(previous: DraftSet | undefined): DraftSet {
  if (!previous) {
    return emptySet();
  }

  return {
    ...emptySet(previous.type === "WARMUP" ? "NORMAL" : previous.type),
    reps: previous.reps,
    weightKg: previous.weightKg,
    durationSec: previous.durationSec,
    distanceM: previous.distanceM,
  };
}

// ── Envoi ─────────────────────────────────────────────────────────────────

/** Un champ vide reste **absent** du corps, jamais envoyé comme zéro. */
function decimal(value: string): string | undefined {
  const normalized = normalizeDecimal(value);

  return normalized === "" ? undefined : normalized;
}

function integer(value: string): number | undefined {
  const normalized = normalizeDecimal(value);

  if (normalized === "") {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function toSetInput(set: DraftSet): WorkoutSetInput {
  return {
    type: set.type,
    reps: integer(set.reps),
    weightKg: decimal(set.weightKg),
    durationSec: integer(set.durationSec),
    distanceM: decimal(set.distanceM),
    rpe: decimal(set.rpe),
    completed: set.completed,
    completedAt: set.completedAt ?? undefined,
  };
}

/**
 * Traduit le brouillon en corps d'API.
 *
 * Les séries non validées sont **conservées** : elles disent ce qui était prévu
 * et n'a pas été fait, et l'API les exclut elle-même des agrégats et des
 * records. Les filtrer ici effacerait cette information.
 */
export function toCreateWorkoutInput(draft: WorkoutDraft, endedAt: Date): CreateWorkoutInput {
  return {
    id: draft.id,
    routineId: draft.routineId,
    title: draft.title.trim() || "Séance",
    notes: draft.notes.trim() || undefined,
    startedAt: draft.startedAt,
    endedAt: endedAt.toISOString(),
    exercises: draft.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      notes: exercise.notes.trim() || undefined,
      restSec: exercise.restSec,
      supersetGroup: exercise.supersetGroup,
      sets: exercise.sets.map(toSetInput),
    })),
  };
}

/** Nombre de séries validées, affiché en tête et gardien de l'enregistrement. */
export function completedSetCount(draft: WorkoutDraft): number {
  return draft.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );
}
