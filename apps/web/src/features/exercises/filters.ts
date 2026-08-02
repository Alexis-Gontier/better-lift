import { type BodyPart, bodyPartSchema, type ExerciseListQuery } from "@better-lift/validators";

/**
 * État de filtrage du catalogue, dans les deux sens : URL → état, état → URL.
 *
 * Les filtres vivent dans l'URL et non dans un `useState` (doc 05) : une
 * recherche doit être partageable par lien et survivre à un rechargement. Cela
 * impose de traiter la query string comme une **entrée non fiable** — elle est
 * tapée, copiée, tronquée —, d'où la validation à la lecture plutôt qu'un cast.
 *
 * Ce fichier est volontairement sans React : c'est la partie testable de
 * l'écran, et elle se teste sans monter un composant.
 */

export interface CatalogFilters {
  q: string;
  bodyPart: BodyPart[];
  /** Chaîne libre issue du dataset ("barbell", "body_weight"…), toujours en minuscules. */
  equipment: string[];
  /**
   * Origine des exercices. `true` : les siens seulement ; `false` : le catalogue
   * commun seulement ; `undefined` : les deux, qui est le cas courant — on
   * cherche un exercice, pas une provenance.
   */
  custom: boolean | undefined;
}

export const EMPTY_FILTERS: CatalogFilters = {
  q: "",
  bodyPart: [],
  equipment: [],
  custom: undefined,
};

/** Longueur maximale acceptée pour `q` côté API : on tronque plutôt que d'envoyer un 422. */
const MAX_QUERY_LENGTH = 100;
const MAX_EQUIPMENT_LENGTH = 50;

/**
 * Les valeurs inconnues sont **écartées silencieusement**, pas signalées : une
 * `?bodyPart=PECS` venue d'un vieux lien doit donner un catalogue non filtré,
 * jamais un écran d'erreur.
 */
function parseBodyParts(values: string[]): BodyPart[] {
  const parsed = values
    .map((value) => bodyPartSchema.safeParse(value))
    .filter((result) => result.success)
    .map((result) => result.data);

  return sortUnique(parsed);
}

function parseEquipment(values: string[]): string[] {
  const cleaned = values
    .map((value) => value.trim().toLowerCase().slice(0, MAX_EQUIPMENT_LENGTH))
    .filter((value) => value.length > 0);

  return sortUnique(cleaned);
}

/**
 * Trie et dédoublonne. Le tri n'est pas cosmétique : ces tableaux entrent dans
 * la clé de cache TanStack (`queryKeys.exercises`), qui compare par structure.
 * Sans ordre stable, cocher « Pecs » puis « Dos » et l'inverse donneraient deux
 * entrées de cache pour une même recherche — donc deux appels réseau.
 */
function sortUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/**
 * Seules `"true"` et `"false"` comptent. Toute autre valeur — un `?custom=1`
 * écrit à la main, un paramètre tronqué — retombe sur « les deux origines »,
 * qui est le choix le moins surprenant : on montre plus, jamais moins.
 */
function parseCustom(value: string | null): boolean | undefined {
  if (value === "true") {
    return true;
  }

  return value === "false" ? false : undefined;
}

export function parseFilters(params: URLSearchParams): CatalogFilters {
  return {
    q: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    bodyPart: parseBodyParts(params.getAll("bodyPart")),
    equipment: parseEquipment(params.getAll("equipment")),
    custom: parseCustom(params.get("custom")),
  };
}

/**
 * Sérialise vers la query string. Les filtres vides sont **omis** et non
 * envoyés vides : un `?q=` échouerait la validation de l'API, et une URL propre
 * quand rien n'est filtré est ce qu'on veut partager.
 */
export function serializeFilters(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  const q = filters.q.trim();

  if (q) {
    params.set("q", q);
  }

  for (const value of filters.bodyPart) {
    params.append("bodyPart", value);
  }

  for (const value of filters.equipment) {
    params.append("equipment", value);
  }

  if (filters.custom !== undefined) {
    params.set("custom", String(filters.custom));
  }

  return params.toString();
}

/** Traduit l'état d'écran en paramètres de `GET /v1/exercises`. */
export function toListQuery(filters: CatalogFilters): Partial<ExerciseListQuery> {
  const q = filters.q.trim();

  return {
    ...(q ? { q } : {}),
    ...(filters.bodyPart.length ? { bodyPart: filters.bodyPart } : {}),
    ...(filters.equipment.length ? { equipment: filters.equipment } : {}),
    // `false` est une valeur significative ici : ne pas la confondre avec
    // « non renseigné », qui veut dire « les deux origines ».
    ...(filters.custom === undefined ? {} : { custom: filters.custom }),
  };
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.q.trim().length > 0 ||
    filters.bodyPart.length > 0 ||
    filters.equipment.length > 0 ||
    filters.custom !== undefined
  );
}

/** Ajoute ou retire une valeur d'un filtre multiple, en conservant l'ordre stable. */
export function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : sortUnique([...values, value]);
}
