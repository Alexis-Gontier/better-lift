import { MAX_PAGE_SIZE, type WorkoutListQuery } from "@better-lift/validators";

import { monthRange, parseMonthKey } from "./calendar";

/**
 * État de l'historique, dans les deux sens : URL → état, état → URL.
 *
 * Comme pour le catalogue (doc 05), l'état vit dans la query string et non dans
 * un `useState` : « mes séances de mars » doit être un lien qu'on met en
 * favori, et le bouton « précédent » du navigateur doit défaire un filtre.
 *
 * Sans React, donc testable sans monter un composant.
 */

/**
 * Non exportés : la vue se choisit dans l'écran, qui écrit ses deux boutons en
 * clair. Les exporter ferait un point d'extension que personne ne demande.
 */
const HISTORY_VIEWS = ["list", "calendar"] as const;
type HistoryView = (typeof HISTORY_VIEWS)[number];

/**
 * Périodes proposées en vue liste.
 *
 * Des préréglages plutôt qu'un sélecteur de dates : la question qu'on se pose
 * devant un historique est « qu'est-ce que j'ai fait ces derniers mois », pas
 * « du 12 au 27 ». Le jour près se regarde en vue calendrier, qui est faite
 * pour ça.
 */
export const HISTORY_PERIODS = ["30d", "3m", "12m", "all"] as const;
export type HistoryPeriod = (typeof HISTORY_PERIODS)[number];

export const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  "30d": "30 jours",
  "3m": "3 mois",
  "12m": "12 mois",
  all: "Tout",
};

/**
 * Nombre de **jours** à remonter. `null` : pas de borne basse.
 *
 * Des jours et non des mois, alors que les libellés parlent en mois : reculer
 * d'un mois calendaire avec `setUTCMonth` déborde silencieusement — le 31 mars
 * moins un mois donne le 3 mars, février n'ayant pas de 31. La dérive de deux
 * jours entre « 3 mois » et 91 jours est invisible sur un historique ; une
 * fenêtre qui saute de 28 jours un mois sur douze ne l'est pas.
 */
const PERIOD_DAYS: Record<HistoryPeriod, number | null> = {
  "30d": 30,
  "3m": 91,
  "12m": 365,
  all: null,
};

export interface HistoryFilters {
  view: HistoryView;
  period: HistoryPeriod;
  /** Mois affiché en vue calendrier, `YYYY-MM`. */
  month: string;
  /** Restriction à une routine d'origine. `undefined` : toutes. */
  routineId: string | undefined;
}

/**
 * Toute valeur inconnue est **écartée silencieusement** au profit du défaut :
 * un vieux lien avec `?view=grid` doit donner l'historique en liste, jamais un
 * écran d'erreur. Même principe que le catalogue.
 */
function parseEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Un identifiant de routine part dans une URL d'API : on le borne. */
const MAX_ROUTINE_ID_LENGTH = 64;

export function parseHistoryFilters(params: URLSearchParams, timeZone: string): HistoryFilters {
  const routineId = (params.get("routineId") ?? "").trim().slice(0, MAX_ROUTINE_ID_LENGTH);

  return {
    view: parseEnum(params.get("view"), HISTORY_VIEWS, "list"),
    period: parseEnum(params.get("period"), HISTORY_PERIODS, "3m"),
    month: parseMonthKey(params.get("month"), timeZone),
    routineId: routineId || undefined,
  };
}

/**
 * Sérialise vers la query string. Les valeurs par défaut sont **omises** : une
 * URL propre est ce qu'on veut partager, et `?view=list&period=3m` sur un
 * historique qu'on n'a pas touché n'apprend rien à personne.
 *
 * `month` n'est écrit qu'en vue calendrier, où il a un sens. Le laisser traîner
 * en vue liste ferait un paramètre qui ne bouge plus et qu'on ne comprend plus.
 */
export function serializeHistoryFilters(filters: HistoryFilters, currentMonth: string): string {
  const params = new URLSearchParams();

  if (filters.view !== "list") {
    params.set("view", filters.view);
  }

  if (filters.view === "list" && filters.period !== "3m") {
    params.set("period", filters.period);
  }

  if (filters.view === "calendar" && filters.month !== currentMonth) {
    params.set("month", filters.month);
  }

  if (filters.routineId) {
    params.set("routineId", filters.routineId);
  }

  return params.toString();
}

/**
 * Traduit l'état d'écran en paramètres de `GET /v1/workouts`.
 *
 * Les deux vues n'interrogent pas la même fenêtre : la liste remonte d'une
 * période glissante et pagine par curseur, le calendrier tire un mois entier
 * d'un coup. C'est la même route, avec des bornes différentes.
 */
export function toWorkoutListQuery(
  filters: HistoryFilters,
  now: Date = new Date(),
): Partial<WorkoutListQuery> {
  const routine = filters.routineId ? { routineId: filters.routineId } : {};

  if (filters.view === "calendar") {
    /**
     * La page maximale, et non les 20 par défaut : une grille de calendrier
     * n'a pas de « charger la suite », donc une deuxième page se traduirait
     * par des pastilles manquantes — le pire défaut possible ici, puisque rien
     * ne le signale à l'écran. À cinq séances par semaine, un mois en compte
     * une vingtaine : 20 est exactement la limite qu'on frôle.
     */
    return { ...monthRange(filters.month), limit: MAX_PAGE_SIZE, ...routine };
  }

  const days = PERIOD_DAYS[filters.period];

  if (days === null) {
    return routine;
  }

  const from = new Date(now.getTime() - days * 86_400_000);

  return { from: from.toISOString(), ...routine };
}
