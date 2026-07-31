import { type BodyPart, type ExerciseType } from "../src/generated/prisma/enums.js";
import { type SourceExercise } from "./schema.js";

/** Correspondance des parties du corps (doc 08). */
const BODY_PART_MAP: Record<string, BodyPart> = {
  chest: "CHEST",
  back: "BACK",
  shoulders: "SHOULDERS",
  "upper arms": "UPPER_ARMS",
  "lower arms": "LOWER_ARMS",
  "upper legs": "UPPER_LEGS",
  "lower legs": "LOWER_LEGS",
  waist: "WAIST",
  cardio: "CARDIO",
  neck: "NECK",
};

/**
 * Échoue bruyamment sur une valeur inconnue plutôt que de la ranger dans un
 * fourre-tout : un ajout amont passerait sinon inaperçu (doc 08).
 */
export function mapBodyPart(source: string): BodyPart {
  const mapped = BODY_PART_MAP[source.toLowerCase()];

  if (!mapped) {
    throw new Error(
      `Partie du corps inconnue : "${source}". Compléter BODY_PART_MAP dans seed/mapping.ts.`,
    );
  }

  return mapped;
}

/**
 * Le type d'exercice est la seule information réellement absente du dataset,
 * et elle conditionne toute la saisie. Heuristique de doc 08 ; les erreurs se
 * corrigent dans `type-overrides.json`, pas en complexifiant cette fonction.
 */
export function inferType(exercise: SourceExercise): ExerciseType {
  const name = exercise.name.toLowerCase();
  const equipment = exercise.equipment.toLowerCase();

  if (exercise.body_part.toLowerCase() === "cardio") return "DISTANCE_DURATION";
  if (/plank|hold|hang|wall sit|isometric/.test(name)) return "DURATION";
  if (/assisted/.test(name)) return "ASSISTED_BODYWEIGHT";
  if (equipment === "body weight") return "BODYWEIGHT_REPS";
  if (equipment === "weighted") return "WEIGHTED_BODYWEIGHT";

  return "WEIGHT_REPS";
}

/** Normalise l'équipement en `snake_case` (doc 08). */
export function normalizeEquipment(equipment: string): string {
  return equipment.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Dédoublonne les muscles secondaires et en retire la cible si elle s'y trouve. */
export function normalizeSecondaryMuscles(exercise: SourceExercise): string[] {
  const target = exercise.target.trim().toLowerCase();
  const seen = new Set<string>();

  for (const muscle of exercise.secondary_muscles) {
    const normalized = muscle.trim().toLowerCase();

    if (normalized && normalized !== target) {
      seen.add(normalized);
    }
  }

  return [...seen].sort();
}

const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "up",
  "with",
]);

/** Le dataset est intégralement en minuscules : on remet une capitalisation lisible. */
export function titleCase(name: string): string {
  return name
    .split(" ")
    .map((word, index) => {
      if (index > 0 && SMALL_WORDS.has(word)) {
        return word;
      }

      return word.replace(/^([a-z])/, (letter) => letter.toUpperCase());
    })
    .join(" ");
}

function slugifyOnce(name: string): string {
  return (
    name
      .normalize("NFD")
      // Retire les diacritiques décomposés par NFD (U+0300 à U+036F).
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Slug unique, dérivé du nom anglais. Les entrées sont traitées triées par
 * `externalId` pour que les suffixes de désambiguïsation soient stables d'une
 * exécution à l'autre — sinon le slug d'un exercice changerait au gré de
 * l'ordre de lecture.
 */
export function buildSlug(name: string, externalId: string, taken: Set<string>): string {
  const base = slugifyOnce(name) || `exercise-${externalId}`;
  let candidate = base;
  let suffix = 2;

  while (taken.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  taken.add(candidate);

  return candidate;
}

/**
 * Préfixe le chemin média par `MEDIA_BASE_URL`. Sans variable, le chemin
 * relatif est conservé tel quel : rejouer le seed après avoir renseigné le
 * CDN suffit à le compléter (doc 08, « Hébergement des médias »).
 */
export function buildMediaUrl(path: string | null | undefined, baseUrl: string): string | null {
  if (!path) {
    return null;
  }

  const cleanPath = path.replace(/^\//, "");

  return baseUrl ? `${baseUrl}/${cleanPath}` : cleanPath;
}
