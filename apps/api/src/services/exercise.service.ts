import { type Prisma, prisma } from "@better-lift/db";
import {
  type ExerciseDetail,
  type ExerciseListQuery,
  type ExerciseListResponse,
  type ExerciseSummary,
  type Locale,
} from "@better-lift/validators";

/**
 * Catalogue d'exercices (doc 04, § Exercices).
 *
 * ## Pourquoi la requête part de la table de traduction
 *
 * Le premier réflexe serait d'interroger `Exercise` et de joindre ses
 * traductions. Il donne un catalogue **trié sur le nom anglais** pendant qu'on
 * affiche des noms français : « Développé couché » apparaîtrait entre deux
 * exercices sans rapport, et la recherche ne trouverait que les noms de base.
 *
 * Enraciner la requête sur `ExerciseTranslation` filtrée par locale règle les
 * deux d'un coup — le tri et la recherche portent sur le texte réellement
 * affiché — et fournit en prime un curseur stable, la traduction étant unique
 * par `(exerciseId, locale)`.
 *
 * La condition de validité est que **chaque exercice ait une traduction dans
 * chaque locale servie**, sans quoi il deviendrait invisible. C'est ce que
 * garantit le seed, qui écrit `fr` et `en` pour tous (voir `packages/db/seed`).
 * Un test le vérifie plutôt que de le supposer.
 */

/** Ce que la requête de liste ramène : la traduction et l'exercice qu'elle décrit. */
type TranslationWithExercise = Prisma.ExerciseTranslationGetPayload<{
  include: { exercise: true };
}>;

/**
 * Le nom traduit est passé à part plutôt que déduit d'une ligne de traduction :
 * la liste et la fiche ne l'obtiennent pas de la même façon, et une signature
 * qui accepte les deux évite un cast à l'une des deux.
 */
function toSummary(exercise: TranslationWithExercise["exercise"], name: string): ExerciseSummary {
  return {
    id: exercise.id,
    // Repli sur le nom de base : une traduction vide vaut absence de traduction.
    name: name.trim() || exercise.name,
    type: exercise.type,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
    target: exercise.target,
    secondaryMuscles: exercise.secondaryMuscles,
    thumbnailUrl: exercise.thumbnailUrl,
    animationUrl: exercise.animationUrl,
    attribution: exercise.attribution,
    /**
     * `externalId` est l'identifiant d'origine du dataset : seuls les exercices
     * du catalogue en ont un. Le schéma le déclare nullable précisément pour
     * les exercices créés par un utilisateur (doc 03), qui arriveront avec
     * `POST /v1/exercises`. Aujourd'hui il n'en existe aucun, donc ce champ
     * vaut toujours `false` — mais il le calcule, il ne le suppose pas.
     */
    isCustom: exercise.externalId === null,
  };
}

/**
 * Construit le filtre Prisma. Les tableaux vides sont écartés : un
 * `{ in: [] }` ne ramènerait jamais rien, ce qui transformerait un filtre non
 * renseigné en catalogue vide.
 */
function buildWhere(query: ExerciseListQuery): Prisma.ExerciseTranslationWhereInput {
  const exercise: Prisma.ExerciseWhereInput = {
    // Un exercice archivé disparaît du catalogue sans casser l'historique des
    // séances qui le référencent (doc 03).
    isArchived: false,
  };

  if (query.bodyPart?.length) {
    exercise.bodyPart = { in: query.bodyPart };
  }

  if (query.equipment?.length) {
    // L'équipement est une chaîne libre du dataset, normalisée en minuscules
    // au seed : on compare sur la même base.
    exercise.equipment = { in: query.equipment.map((value) => value.toLowerCase()) };
  }

  if (query.type?.length) {
    exercise.type = { in: query.type };
  }

  return {
    locale: query.locale,
    exercise,
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
  };
}

export async function listExercises(query: ExerciseListQuery): Promise<ExerciseListResponse> {
  /**
   * On demande un élément de plus que la page : sa présence dit s'il reste
   * quelque chose après, sans le `count()` supplémentaire qu'un total exigerait
   * — et dont personne n'a besoin ici.
   */
  const rows = await prisma.exerciseTranslation.findMany({
    where: buildWhere(query),
    include: { exercise: true },
    // `id` départage les homonymes : sans lui l'ordre n'est pas déterministe,
    // et un curseur sur un ordre instable saute ou répète des lignes.
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;

  return {
    data: page.map((row) => toSummary(row.exercise, row.name)),
    // Le curseur est l'identifiant de la **traduction**, pas de l'exercice :
    // c'est la ligne sur laquelle porte l'ordre.
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    hasMore,
  };
}

/**
 * Fiche détaillée. Renvoie `null` quand l'exercice n'existe pas ou n'est plus
 * au catalogue — la route en fait un 404, sans distinguer les deux cas.
 */
export async function getExerciseById(id: string, locale: Locale): Promise<ExerciseDetail | null> {
  const exercise = await prisma.exercise.findFirst({
    where: { id, isArchived: false },
    include: {
      /**
       * La locale demandée **et** le repli : deux lignes au plus, et une seule
       * requête. Demander la locale seule obligerait à en refaire une quand la
       * traduction manque.
       */
      translations: { where: { locale: { in: [locale, "en"] } } },
    },
  });

  if (!exercise) {
    return null;
  }

  const translation =
    exercise.translations.find((row) => row.locale === locale) ?? exercise.translations[0];

  return {
    ...toSummary(exercise, translation?.name ?? exercise.name),
    instructions: translation?.instructions ?? [],
    locale,
  };
}
