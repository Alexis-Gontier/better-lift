import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { prisma } from "../src/client.js";
import { type BodyPart, ExerciseType } from "../src/generated/prisma/enums.js";
import {
  buildMediaUrl,
  buildSlug,
  inferType,
  mapBodyPart,
  normalizeEquipment,
  normalizeSecondaryMuscles,
  titleCase,
} from "./mapping.js";
import { type SourceExercise, sourceDatasetSchema } from "./schema.js";

const SEED_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(SEED_DIR, "data/exercises.json");
const OVERRIDES_FILE = resolve(SEED_DIR, "type-overrides.json");

/** Locales réellement servies. Le dataset en fournit dix (doc 08). */
const LOCALES = ["fr", "en"] as const;
type Locale = (typeof LOCALES)[number];

/** Taille des lots d'écriture : un compromis entre allers-retours réseau et poids des requêtes. */
const CHUNK_SIZE = 250;

interface MappedExercise {
  externalId: string;
  slug: string;
  name: string;
  type: ExerciseType;
  bodyPart: BodyPart;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  thumbnailUrl: string | null;
  animationUrl: string | null;
  attribution: string;
  translations: { locale: Locale; name: string; instructions: string[] }[];
}

export interface SeedReport {
  created: number;
  updated: number;
  unchanged: number;
  archived: number;
  translationsWritten: number;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function sameStringArray(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

async function loadTypeOverrides(): Promise<Map<string, ExerciseType>> {
  const raw: unknown = JSON.parse(await readFile(OVERRIDES_FILE, "utf8"));

  if (typeof raw !== "object" || raw === null) {
    throw new Error("type-overrides.json doit contenir un objet.");
  }

  const validTypes = new Set<string>(Object.values(ExerciseType));
  const overrides = new Map<string, ExerciseType>();

  for (const [externalId, value] of Object.entries(raw)) {
    if (externalId.startsWith("$")) {
      continue; // clés de documentation
    }

    if (typeof value !== "string" || !validTypes.has(value)) {
      throw new Error(
        `type-overrides.json : "${value}" n'est pas un ExerciseType (clé ${externalId}).`,
      );
    }

    overrides.set(externalId, value as ExerciseType);
  }

  return overrides;
}

async function loadSource(): Promise<SourceExercise[]> {
  const raw: unknown = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const parsed = sourceDatasetSchema.safeParse(raw);

  if (!parsed.success) {
    const [firstIssue] = parsed.error.issues;
    throw new Error(
      `Dataset invalide (${parsed.error.issues.length} erreur(s)). Première : ` +
        `${firstIssue?.path.join(".")} — ${firstIssue?.message}`,
    );
  }

  // Tri stable par externalId : les suffixes de slug doivent être reproductibles.
  return parsed.data.sort((a, b) => a.id.localeCompare(b.id));
}

function mapExercises(
  source: readonly SourceExercise[],
  overrides: ReadonlyMap<string, ExerciseType>,
  mediaBaseUrl: string,
): MappedExercise[] {
  const takenSlugs = new Set<string>();

  return source.map((exercise) => {
    const englishName = titleCase(exercise.name.trim());
    const steps = exercise.instruction_steps;

    return {
      externalId: exercise.id,
      slug: buildSlug(exercise.name, exercise.id, takenSlugs),
      name: englishName,
      type: overrides.get(exercise.id) ?? inferType(exercise),
      bodyPart: mapBodyPart(exercise.body_part),
      equipment: normalizeEquipment(exercise.equipment),
      target: exercise.target.trim().toLowerCase(),
      secondaryMuscles: normalizeSecondaryMuscles(exercise),
      thumbnailUrl: buildMediaUrl(exercise.image, mediaBaseUrl),
      animationUrl: buildMediaUrl(exercise.gif_url, mediaBaseUrl),
      attribution: exercise.attribution,
      translations: LOCALES.map((locale) => ({
        locale,
        // Le dataset ne fournit qu'un nom anglais : la traduction française
        // reprend ce nom en attendant une passe de traduction dédiée. Les
        // instructions, elles, existent bien dans les deux langues.
        name: englishName,
        instructions: steps[locale] ?? [],
      })),
    };
  });
}

export async function seedExercises(): Promise<SeedReport> {
  const mediaBaseUrl = (process.env.MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

  if (!mediaBaseUrl) {
    console.warn(
      "MEDIA_BASE_URL non renseignée : les chemins médias sont stockés en relatif. " +
        "Rejouer le seed après configuration du CDN les complétera.",
    );
  }

  const [source, overrides] = await Promise.all([loadSource(), loadTypeOverrides()]);
  const mapped = mapExercises(source, overrides, mediaBaseUrl);

  const unknownOverrides = [...overrides.keys()].filter(
    (id) => !mapped.some((exercise) => exercise.externalId === id),
  );

  if (unknownOverrides.length > 0) {
    console.warn(
      `type-overrides.json référence ${unknownOverrides.length} exercice(s) absent(s) du dataset : ` +
        unknownOverrides.join(", "),
    );
  }

  const existing = await prisma.exercise.findMany({
    where: { externalId: { not: null } },
    select: {
      id: true,
      externalId: true,
      slug: true,
      name: true,
      type: true,
      bodyPart: true,
      equipment: true,
      target: true,
      secondaryMuscles: true,
      thumbnailUrl: true,
      animationUrl: true,
      attribution: true,
      isArchived: true,
    },
  });

  const existingByExternalId = new Map(existing.map((row) => [row.externalId ?? "", row]));

  const toCreate: MappedExercise[] = [];
  const toUpdate: MappedExercise[] = [];
  let unchanged = 0;

  for (const exercise of mapped) {
    const current = existingByExternalId.get(exercise.externalId);

    if (!current) {
      toCreate.push(exercise);
      continue;
    }

    const identical =
      current.slug === exercise.slug &&
      current.name === exercise.name &&
      current.type === exercise.type &&
      current.bodyPart === exercise.bodyPart &&
      current.equipment === exercise.equipment &&
      current.target === exercise.target &&
      current.thumbnailUrl === exercise.thumbnailUrl &&
      current.animationUrl === exercise.animationUrl &&
      current.attribution === exercise.attribution &&
      current.isArchived === false &&
      sameStringArray(current.secondaryMuscles, exercise.secondaryMuscles);

    if (identical) {
      unchanged += 1;
    } else {
      toUpdate.push(exercise);
    }
  }

  if (toCreate.length > 0) {
    for (const batch of chunk(toCreate, CHUNK_SIZE)) {
      await prisma.exercise.createMany({
        data: batch.map(({ translations: _translations, ...data }) => data),
      });
    }
  }

  for (const batch of chunk(toUpdate, CHUNK_SIZE)) {
    await prisma.$transaction(
      batch.map(({ translations: _translations, externalId, ...data }) =>
        prisma.exercise.update({
          where: { externalId },
          // Un exercice réapparu en amont est désarchivé (doc 08).
          data: { ...data, isArchived: false },
        }),
      ),
    );
  }

  // Les exercices disparus du dataset sont archivés, jamais supprimés :
  // ils restent référencés dans l'historique des utilisateurs (doc 08).
  const sourceIds = new Set(mapped.map((exercise) => exercise.externalId));
  const disappeared = existing
    .filter((row) => row.externalId && !sourceIds.has(row.externalId) && !row.isArchived)
    .map((row) => row.id);

  if (disappeared.length > 0) {
    await prisma.exercise.updateMany({
      where: { id: { in: disappeared } },
      data: { isArchived: true },
    });
  }

  const translationsWritten = await syncTranslations(mapped);

  return {
    created: toCreate.length,
    updated: toUpdate.length,
    unchanged,
    archived: disappeared.length,
    translationsWritten,
  };
}

async function syncTranslations(mapped: readonly MappedExercise[]): Promise<number> {
  const idByExternalId = new Map(
    (
      await prisma.exercise.findMany({
        where: { externalId: { in: mapped.map((exercise) => exercise.externalId) } },
        select: { id: true, externalId: true },
      })
    ).map((row) => [row.externalId ?? "", row.id]),
  );

  const existing = await prisma.exerciseTranslation.findMany({
    where: { exerciseId: { in: [...idByExternalId.values()] } },
    select: { id: true, exerciseId: true, locale: true, name: true, instructions: true },
  });

  const existingByKey = new Map(existing.map((row) => [`${row.exerciseId}:${row.locale}`, row]));

  const toCreate: { exerciseId: string; locale: string; name: string; instructions: string[] }[] =
    [];
  const toUpdate: { id: string; name: string; instructions: string[] }[] = [];

  for (const exercise of mapped) {
    const exerciseId = idByExternalId.get(exercise.externalId);

    if (!exerciseId) {
      throw new Error(`Exercice introuvable après écriture : ${exercise.externalId}`);
    }

    for (const translation of exercise.translations) {
      const current = existingByKey.get(`${exerciseId}:${translation.locale}`);

      if (!current) {
        toCreate.push({ exerciseId, ...translation });
        continue;
      }

      if (
        current.name !== translation.name ||
        !sameStringArray(current.instructions, translation.instructions)
      ) {
        toUpdate.push({
          id: current.id,
          name: translation.name,
          instructions: translation.instructions,
        });
      }
    }
  }

  for (const batch of chunk(toCreate, CHUNK_SIZE)) {
    await prisma.exerciseTranslation.createMany({ data: batch });
  }

  for (const batch of chunk(toUpdate, CHUNK_SIZE)) {
    await prisma.$transaction(
      batch.map(({ id, ...data }) => prisma.exerciseTranslation.update({ where: { id }, data })),
    );
  }

  return toCreate.length + toUpdate.length;
}
