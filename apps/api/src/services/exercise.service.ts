import { randomUUID } from "node:crypto";

import { type Prisma, prisma } from "@better-lift/db";
import {
  type CreateExercisePayload,
  DEFAULT_LOCALE,
  type ExerciseDetail,
  type ExerciseListQuery,
  type ExerciseListResponse,
  type ExerciseSummary,
  LOCALES,
  type Locale,
  type UpdateExercisePayload,
} from "@better-lift/validators";

import { ApiError } from "../lib/errors.js";

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
 * chaque locale servie**, sans quoi il deviendrait invisible. Le seed la tient
 * pour le catalogue ; `createExercise` la tient pour les exercices
 * personnalisés, en écrivant le même nom dans toutes les locales.
 *
 * ## Visibilité
 *
 * Un exercice sans propriétaire est du catalogue commun, visible de tous. Un
 * exercice avec propriétaire n'est visible que de lui — et l'appartenance se
 * vérifie **ici**, dans le service, jamais dans la route (règle non
 * négociable n°8).
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
     * Calculé depuis le propriétaire, seule source de vérité (D22). Il n'y a
     * pas de colonne `isCustom` : elle finirait par contredire `ownerId`.
     */
    isCustom: exercise.ownerId !== null,
  };
}

/**
 * Clause de visibilité, appliquée à **toutes** les lectures sans exception.
 *
 * L'oublier ne produirait aucune erreur visible : la liste montrerait
 * simplement les exercices des autres, mêlés au catalogue. C'est le genre de
 * fuite qui passe une relecture, d'où sa centralisation en une fonction unique.
 */
function visibleTo(userId: string): Prisma.ExerciseWhereInput {
  return { OR: [{ ownerId: null }, { ownerId: userId }] };
}

/**
 * Construit le filtre Prisma. Les tableaux vides sont écartés : un
 * `{ in: [] }` ne ramènerait jamais rien, ce qui transformerait un filtre non
 * renseigné en catalogue vide.
 */
function buildWhere(
  query: ExerciseListQuery,
  userId: string,
): Prisma.ExerciseTranslationWhereInput {
  const exercise: Prisma.ExerciseWhereInput = {
    // Un exercice archivé disparaît du catalogue sans casser l'historique des
    // séances qui le référencent (doc 03).
    isArchived: false,
    ...visibleTo(userId),
  };

  if (query.bodyPart?.length) {
    exercise.bodyPart = { in: query.bodyPart };
  }

  if (query.equipment?.length) {
    // L'équipement est normalisé par le contrat, comme au seed : minuscules et
    // tirets bas. On compare donc sur la même base, sans retoucher ici.
    exercise.equipment = { in: query.equipment };
  }

  if (query.type?.length) {
    exercise.type = { in: query.type };
  }

  if (query.custom !== undefined) {
    /**
     * Le filtre restreint la visibilité, il ne l'élargit jamais : `custom=true`
     * ne peut donner que **ses** exercices, la clause `visibleTo` restant en
     * place au-dessus.
     */
    exercise.ownerId = query.custom ? userId : null;
  }

  return {
    locale: query.locale,
    exercise,
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
  };
}

export async function listExercises(
  query: ExerciseListQuery,
  userId: string,
): Promise<ExerciseListResponse> {
  /**
   * On demande un élément de plus que la page : sa présence dit s'il reste
   * quelque chose après, sans le `count()` supplémentaire qu'un total exigerait
   * — et dont personne n'a besoin ici.
   */
  const rows = await prisma.exerciseTranslation.findMany({
    where: buildWhere(query, userId),
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
 * Fiche détaillée. Renvoie `null` quand l'exercice n'existe pas, n'est plus au
 * catalogue, **ou appartient à quelqu'un d'autre** — la route en fait un 404
 * sans distinguer les trois cas (règle non négociable n°8).
 */
export async function getExerciseById(
  id: string,
  locale: Locale,
  userId: string,
): Promise<ExerciseDetail | null> {
  const exercise = await prisma.exercise.findFirst({
    where: { id, isArchived: false, ...visibleTo(userId) },
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

/**
 * Slug d'un exercice personnalisé.
 *
 * Le `slug` est unique sur toute la table, catalogue et exercices de tous les
 * utilisateurs confondus : deux personnes qui créent « Mon curl » entreraient
 * en collision. Plutôt qu'une boucle de tentatives contre la base, on suffixe
 * d'emblée — le slug d'un exercice personnalisé n'est adressé par personne,
 * l'API ne l'expose même pas.
 */
function buildCustomSlug(name: string): string {
  const base = name
    .normalize("NFD")
    // Retire les diacritiques : « développé » devient « developpe ».
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `${base || "exercice"}-${randomUUID().slice(0, 8)}`;
}

/**
 * Crée un exercice personnalisé.
 *
 * Les traductions sont écrites **pour toutes les locales servies**, avec le
 * même texte. C'est le point à ne pas rater : la liste est enracinée sur
 * `ExerciseTranslation` filtrée par locale, donc un exercice sans ligne en
 * anglais disparaîtrait purement et simplement pour un profil anglophone —
 * sans erreur, sans trace.
 */
export async function createExercise(
  input: CreateExercisePayload,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ExerciseDetail> {
  const name = input.name.trim();

  const exercise = await prisma.exercise.create({
    data: {
      slug: buildCustomSlug(name),
      name,
      type: input.type,
      bodyPart: input.bodyPart,
      equipment: input.equipment,
      target: input.target,
      secondaryMuscles: input.secondaryMuscles,
      ownerId: userId,
      // Ni média ni attribution : rien à héberger, et le dataset Gym visual
      // n'a rien à voir avec un exercice saisi par un utilisateur (D17).
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          name,
          instructions: input.instructions,
        })),
      },
    },
    include: { translations: true },
  });

  const translation = exercise.translations.find((row) => row.locale === locale);

  return {
    ...toSummary(exercise, translation?.name ?? exercise.name),
    instructions: translation?.instructions ?? [],
    locale,
  };
}

/**
 * Charge un exercice **modifiable** par cet utilisateur, ou lève.
 *
 * Deux refus distincts, et la distinction est délibérée :
 *
 * - un exercice **du catalogue** existe pour tout le monde, l'utilisateur vient
 *   peut-être de l'afficher : répondre 404 contredirait le `GET` qui a réussi
 *   une seconde plus tôt. C'est un 403, et il ne révèle rien qui ne soit déjà
 *   public.
 * - un exercice **d'autrui** doit rester invisible : 404, comme s'il n'existait
 *   pas (règle non négociable n°8).
 */
async function loadOwned(id: string, userId: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id } });

  if (!exercise || (exercise.ownerId !== null && exercise.ownerId !== userId)) {
    throw new ApiError("NOT_FOUND", "Exercice introuvable.");
  }

  if (exercise.ownerId === null) {
    throw new ApiError(
      "FORBIDDEN",
      "Le catalogue commun n'est pas modifiable. Créer un exercice personnalisé à la place.",
    );
  }

  return exercise;
}

/**
 * Modification partielle d'un exercice personnalisé.
 *
 * Le nom est répercuté sur **toutes** les traductions, pour la même raison
 * qu'à la création : une seule saisie, plusieurs locales à tenir alignées.
 */
export async function updateExercise(
  id: string,
  input: UpdateExercisePayload,
  userId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ExerciseDetail> {
  await loadOwned(id, userId);

  const name = input.name?.trim();

  await prisma.$transaction(async (tx) => {
    await tx.exercise.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.bodyPart ? { bodyPart: input.bodyPart } : {}),
        ...(input.equipment ? { equipment: input.equipment } : {}),
        ...(input.target ? { target: input.target } : {}),
        ...(input.secondaryMuscles ? { secondaryMuscles: input.secondaryMuscles } : {}),
      },
    });

    if (name !== undefined || input.instructions !== undefined) {
      await tx.exerciseTranslation.updateMany({
        where: { exerciseId: id },
        data: {
          ...(name ? { name } : {}),
          ...(input.instructions ? { instructions: input.instructions } : {}),
        },
      });
    }
  });

  // Relu plutôt que reconstruit de mémoire : c'est la seule façon de renvoyer
  // ce qui est réellement en base, valeurs par défaut comprises.
  const detail = await getExerciseById(id, locale, userId);

  if (!detail) {
    throw new ApiError("INTERNAL", "Exercice introuvable après modification.");
  }

  return detail;
}

/**
 * Archive un exercice personnalisé — il n'est **jamais** supprimé.
 *
 * Une séance passée peut le référencer, et l'historique ne doit pas changer
 * sous les pieds de l'utilisateur (invariant 8, doc 03). L'archivage le retire
 * du catalogue et des recherches ; les séances qui le citent restent lisibles.
 */
export async function archiveExercise(id: string, userId: string): Promise<void> {
  await loadOwned(id, userId);

  await prisma.exercise.update({ where: { id }, data: { isArchived: true } });
}
