import { type ZodType } from "zod";

import {
  type CreateExerciseInput,
  type CreateWorkoutInput,
  type CurrentUser,
  currentUserSchema,
  type ExerciseDetail,
  type ExerciseListQuery,
  type ExerciseListResponse,
  exerciseDetailSchema,
  exerciseListResponseSchema,
  type HealthResponse,
  healthResponseSchema,
  type LastPerformance,
  type Locale,
  lastPerformanceResponseSchema,
  type RoutineDetail,
  type RoutineFolder,
  type RoutineFolderInput,
  type RoutineListQuery,
  type RoutineStructureInput,
  type RoutineSummary,
  routineDetailSchema,
  routineFolderListResponseSchema,
  routineFolderSchema,
  routineListResponseSchema,
  type StatsMuscleDistributionResponse,
  type StatsRange,
  type StatsRecord,
  type StatsStreakResponse,
  type StatsSummary,
  type StatsVolumeQuery,
  type StatsVolumeResponse,
  statsMuscleDistributionResponseSchema,
  statsRecordsResponseSchema,
  statsStreakResponseSchema,
  statsSummarySchema,
  statsVolumeResponseSchema,
  type UpdateExerciseInput,
  type UpdateMeInput,
  type UpdateRoutineInput,
  type VersionResponse,
  versionResponseSchema,
  type WorkoutDetail,
  type WorkoutListQuery,
  type WorkoutListResponse,
  type WorkoutSaveResponse,
  type WorkoutStructureInput,
  workoutDetailSchema,
  workoutListResponseSchema,
  workoutSaveResponseSchema,
} from "@better-lift/validators";

import { ApiClientError, toApiClientError } from "./errors.js";

export interface ApiClientOptions {
  /** Racine de l'API, sans barre oblique finale. */
  baseUrl: string;
  /**
   * Jeton de session pour les clients qui n'utilisent pas les cookies — le
   * mobile passe par un bearer token (doc 04).
   */
  getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Injectable pour les tests ; `globalThis.fetch` par défaut. */
  fetch?: typeof globalThis.fetch;
}

export interface ApiClient {
  getHealth: (signal?: AbortSignal) => Promise<HealthResponse>;
  getVersion: (signal?: AbortSignal) => Promise<VersionResponse>;
  /** Lève une `ApiClientError` 401 quand aucune session n'est établie. */
  getMe: (signal?: AbortSignal) => Promise<CurrentUser>;
  /** Lève une `ApiClientError` 409 quand le pseudo demandé est déjà pris. */
  updateMe: (input: UpdateMeInput, signal?: AbortSignal) => Promise<CurrentUser>;
  listExercises: (
    query?: Partial<ExerciseListQuery>,
    signal?: AbortSignal,
  ) => Promise<ExerciseListResponse>;
  /** Lève une `ApiClientError` 404 quand l'exercice est inconnu ou archivé. */
  getExercise: (id: string, locale?: Locale, signal?: AbortSignal) => Promise<ExerciseDetail>;
  createExercise: (
    input: CreateExerciseInput,
    locale?: Locale,
    signal?: AbortSignal,
  ) => Promise<ExerciseDetail>;
  /**
   * Lève une `ApiClientError` 403 sur un exercice du catalogue commun, 404 sur
   * celui d'un autre utilisateur — la distinction est volontaire, voir doc 04.
   */
  updateExercise: (
    id: string,
    input: UpdateExerciseInput,
    locale?: Locale,
    signal?: AbortSignal,
  ) => Promise<ExerciseDetail>;
  /** Archive, ne supprime pas : l'historique continue de le référencer. */
  archiveExercise: (id: string, signal?: AbortSignal) => Promise<void>;

  listRoutineFolders: (signal?: AbortSignal) => Promise<RoutineFolder[]>;
  createRoutineFolder: (input: RoutineFolderInput, signal?: AbortSignal) => Promise<RoutineFolder>;
  updateRoutineFolder: (
    id: string,
    input: RoutineFolderInput,
    signal?: AbortSignal,
  ) => Promise<RoutineFolder>;
  /** Les routines du dossier remontent à la racine, elles ne sont pas supprimées. */
  deleteRoutineFolder: (id: string, signal?: AbortSignal) => Promise<void>;
  /** L'ordre **complet**, pas un déplacement relatif. */
  reorderRoutineFolders: (ids: string[], signal?: AbortSignal) => Promise<RoutineFolder[]>;

  listRoutines: (
    query?: Partial<RoutineListQuery>,
    signal?: AbortSignal,
  ) => Promise<RoutineSummary[]>;
  getRoutine: (id: string, locale?: Locale, signal?: AbortSignal) => Promise<RoutineDetail>;
  createRoutine: (
    input: RoutineStructureInput,
    locale?: Locale,
    signal?: AbortSignal,
  ) => Promise<RoutineDetail>;
  /** **Remplace** la structure entière : l'éditeur envoie son brouillon complet. */
  replaceRoutine: (
    id: string,
    input: RoutineStructureInput,
    locale?: Locale,
    signal?: AbortSignal,
  ) => Promise<RoutineDetail>;
  /** Métadonnées seules — renommer, déplacer — sans toucher à la structure. */
  updateRoutine: (
    id: string,
    input: UpdateRoutineInput,
    locale?: Locale,
    signal?: AbortSignal,
  ) => Promise<RoutineDetail>;
  /** Suppression logique : l'historique continue de désigner la routine. */
  deleteRoutine: (id: string, signal?: AbortSignal) => Promise<void>;
  duplicateRoutine: (id: string, locale?: Locale, signal?: AbortSignal) => Promise<RoutineDetail>;
  reorderRoutines: (ids: string[], signal?: AbortSignal) => Promise<RoutineSummary[]>;

  listWorkouts: (
    query?: Partial<WorkoutListQuery>,
    signal?: AbortSignal,
  ) => Promise<WorkoutListResponse>;
  getWorkout: (id: string, locale?: Locale, signal?: AbortSignal) => Promise<WorkoutDetail>;
  /**
   * **Idempotent** : l'`id` est généré par l'appelant, et un envoi répété
   * renvoie la séance existante au lieu d'en créer une seconde (règle non
   * négociable n°7). C'est ce qui rend une file de synchronisation hors ligne
   * rejouable sans précaution.
   *
   * Lève une `ApiClientError` 409 si l'identifiant appartient déjà à quelqu'un
   * d'autre — il faut alors en générer un nouveau, pas réessayer.
   */
  createWorkout: (
    input: CreateWorkoutInput,
    locale?: Locale,
    signal?: AbortSignal,
  ) => Promise<WorkoutSaveResponse>;
  /** **Remplace** la structure entière, et fait recalculer les records touchés. */
  updateWorkout: (
    id: string,
    input: WorkoutStructureInput,
    locale?: Locale,
    signal?: AbortSignal,
  ) => Promise<WorkoutSaveResponse>;
  /** Suppression **physique**, contrairement à une routine. */
  deleteWorkout: (id: string, signal?: AbortSignal) => Promise<void>;
  /**
   * Dernières valeurs par exercice, pour pré-remplir l'écran de saisie. Un
   * exercice jamais fait est **absent** de la réponse.
   */
  getLastPerformance: (exerciseIds: string[], signal?: AbortSignal) => Promise<LastPerformance[]>;

  /**
   * Chiffres clés du tableau de bord. `previousPeriod` évite un second appel
   * pour afficher les variations ; il vaut `null` pour `range=all`.
   */
  getStatsSummary: (range?: StatsRange, signal?: AbortSignal) => Promise<StatsSummary>;
  /** Les périodes sans séance sont **présentes** avec un volume à zéro. */
  getStatsVolume: (
    query?: Partial<StatsVolumeQuery>,
    signal?: AbortSignal,
  ) => Promise<StatsVolumeResponse>;
  getStatsMuscleDistribution: (
    range?: StatsRange,
    signal?: AbortSignal,
  ) => Promise<StatsMuscleDistributionResponse>;
  /** `days` porte une entrée par jour de la fenêtre, jours vides compris. */
  getStatsStreak: (weeks?: number, signal?: AbortSignal) => Promise<StatsStreakResponse>;
  getStatsRecords: (
    query?: { limit?: number; locale?: Locale },
    signal?: AbortSignal,
  ) => Promise<StatsRecord[]>;
}

/**
 * Sérialise les paramètres de liste. Les tableaux deviennent des clés
 * **répétées** (`?bodyPart=CHEST&bodyPart=BACK`), forme attendue par l'API ;
 * les valeurs absentes sont omises plutôt qu'envoyées vides, un
 * `?q=` déclencherait sinon une erreur de validation.
 */
function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, String(entry));
      }
    } else {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : "";
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const doFetch = options.fetch ?? globalThis.fetch;

  async function request<T>(
    path: string,
    schema: ZodType<T>,
    signal?: AbortSignal,
    /** Absent pour une lecture ; renseigné, il fait de la requête une écriture. */
    write?: { method: "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown },
  ): Promise<T> {
    const token = await options.getAuthToken?.();

    let response: Response;

    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method: write?.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(write?.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(write?.body === undefined ? {} : { body: JSON.stringify(write.body) }),
        // Le web s'authentifie par cookie ; l'API autorise explicitement
        // l'origine et les credentials (doc 02).
        credentials: "include",
        signal,
      });
    } catch (cause) {
      throw new ApiClientError(
        0,
        "NETWORK_ERROR",
        cause instanceof Error ? cause.message : "API injoignable.",
      );
    }

    if (!response.ok) {
      // `/health` répond 503 avec un corps valide : c'est une information, pas
      // une panne de contrat. On le laisse remonter comme réponse normale.
      const body: unknown = await response
        .clone()
        .json()
        .catch(() => null);
      const parsed = schema.safeParse(body);

      if (response.status === 503 && parsed.success) {
        return parsed.data;
      }

      throw await toApiClientError(response);
    }

    const parsed = schema.safeParse(await response.json());

    if (!parsed.success) {
      throw new ApiClientError(
        response.status,
        "INVALID_RESPONSE",
        `Réponse non conforme au contrat pour ${path}.`,
      );
    }

    return parsed.data;
  }

  /**
   * Écriture sans corps de réponse (204). Elle ne peut pas passer par
   * `request`, qui exige un schéma : appeler `.json()` sur un corps vide lève,
   * et un `DELETE` réussi finirait en `INVALID_RESPONSE`.
   */
  async function requestNoContent(
    path: string,
    method: "DELETE",
    signal?: AbortSignal,
  ): Promise<void> {
    const token = await options.getAuthToken?.();

    let response: Response;

    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        signal,
      });
    } catch (cause) {
      throw new ApiClientError(
        0,
        "NETWORK_ERROR",
        cause instanceof Error ? cause.message : "API injoignable.",
      );
    }

    if (!response.ok) {
      throw await toApiClientError(response);
    }
  }

  /** `?locale=` n'est ajouté que s'il est demandé : l'API a son propre défaut. */
  function localeQuery(locale?: Locale): string {
    return locale ? `?locale=${locale}` : "";
  }

  return {
    getHealth: (signal) => request("/health", healthResponseSchema, signal),
    getVersion: (signal) => request("/v1/version", versionResponseSchema, signal),
    getMe: (signal) => request("/v1/me", currentUserSchema, signal),
    updateMe: (input, signal) =>
      request("/v1/me", currentUserSchema, signal, { method: "PATCH", body: input }),
    listExercises: (query = {}, signal) =>
      request(`/v1/exercises${toSearchParams(query)}`, exerciseListResponseSchema, signal),
    getExercise: (id, locale, signal) =>
      request(
        `/v1/exercises/${encodeURIComponent(id)}${localeQuery(locale)}`,
        exerciseDetailSchema,
        signal,
      ),
    createExercise: (input, locale, signal) =>
      request(`/v1/exercises${localeQuery(locale)}`, exerciseDetailSchema, signal, {
        method: "POST",
        body: input,
      }),
    updateExercise: (id, input, locale, signal) =>
      request(
        `/v1/exercises/${encodeURIComponent(id)}${localeQuery(locale)}`,
        exerciseDetailSchema,
        signal,
        { method: "PATCH", body: input },
      ),
    archiveExercise: (id, signal) =>
      requestNoContent(`/v1/exercises/${encodeURIComponent(id)}`, "DELETE", signal),

    listRoutineFolders: async (signal) =>
      (await request("/v1/routine-folders", routineFolderListResponseSchema, signal)).data,
    createRoutineFolder: (input, signal) =>
      request("/v1/routine-folders", routineFolderSchema, signal, {
        method: "POST",
        body: input,
      }),
    updateRoutineFolder: (id, input, signal) =>
      request(`/v1/routine-folders/${encodeURIComponent(id)}`, routineFolderSchema, signal, {
        method: "PATCH",
        body: input,
      }),
    deleteRoutineFolder: (id, signal) =>
      requestNoContent(`/v1/routine-folders/${encodeURIComponent(id)}`, "DELETE", signal),
    reorderRoutineFolders: async (ids, signal) =>
      (
        await request("/v1/routine-folders/reorder", routineFolderListResponseSchema, signal, {
          method: "POST",
          body: { ids },
        })
      ).data,

    listRoutines: async (query = {}, signal) =>
      (await request(`/v1/routines${toSearchParams(query)}`, routineListResponseSchema, signal))
        .data,
    getRoutine: (id, locale, signal) =>
      request(
        `/v1/routines/${encodeURIComponent(id)}${localeQuery(locale)}`,
        routineDetailSchema,
        signal,
      ),
    createRoutine: (input, locale, signal) =>
      request(`/v1/routines${localeQuery(locale)}`, routineDetailSchema, signal, {
        method: "POST",
        body: input,
      }),
    replaceRoutine: (id, input, locale, signal) =>
      request(
        `/v1/routines/${encodeURIComponent(id)}${localeQuery(locale)}`,
        routineDetailSchema,
        signal,
        { method: "PUT", body: input },
      ),
    updateRoutine: (id, input, locale, signal) =>
      request(
        `/v1/routines/${encodeURIComponent(id)}${localeQuery(locale)}`,
        routineDetailSchema,
        signal,
        { method: "PATCH", body: input },
      ),
    deleteRoutine: (id, signal) =>
      requestNoContent(`/v1/routines/${encodeURIComponent(id)}`, "DELETE", signal),
    duplicateRoutine: (id, locale, signal) =>
      request(
        `/v1/routines/${encodeURIComponent(id)}/duplicate${localeQuery(locale)}`,
        routineDetailSchema,
        signal,
        { method: "POST" },
      ),
    reorderRoutines: async (ids, signal) =>
      (
        await request("/v1/routines/reorder", routineListResponseSchema, signal, {
          method: "POST",
          body: { ids },
        })
      ).data,

    listWorkouts: (query = {}, signal) =>
      request(`/v1/workouts${toSearchParams(query)}`, workoutListResponseSchema, signal),
    getWorkout: (id, locale, signal) =>
      request(
        `/v1/workouts/${encodeURIComponent(id)}${localeQuery(locale)}`,
        workoutDetailSchema,
        signal,
      ),
    createWorkout: (input, locale, signal) =>
      request(`/v1/workouts${localeQuery(locale)}`, workoutSaveResponseSchema, signal, {
        method: "POST",
        body: input,
      }),
    updateWorkout: (id, input, locale, signal) =>
      request(
        `/v1/workouts/${encodeURIComponent(id)}${localeQuery(locale)}`,
        workoutSaveResponseSchema,
        signal,
        { method: "PUT", body: input },
      ),
    deleteWorkout: (id, signal) =>
      requestNoContent(`/v1/workouts/${encodeURIComponent(id)}`, "DELETE", signal),
    getLastPerformance: async (exerciseIds, signal) => {
      // Aucun exercice, aucune requête : l'API exige au moins un identifiant et
      // répondrait 422 là où la réponse évidente est « rien à dire ».
      if (exerciseIds.length === 0) {
        return [];
      }

      const { data } = await request(
        `/v1/workouts/last-performance?exerciseIds=${exerciseIds.map(encodeURIComponent).join(",")}`,
        lastPerformanceResponseSchema,
        signal,
      );

      return data;
    },

    getStatsSummary: (range, signal) =>
      request(`/v1/stats/summary${toSearchParams({ range })}`, statsSummarySchema, signal),
    getStatsVolume: (query = {}, signal) =>
      request(`/v1/stats/volume${toSearchParams(query)}`, statsVolumeResponseSchema, signal),
    getStatsMuscleDistribution: (range, signal) =>
      request(
        `/v1/stats/muscle-distribution${toSearchParams({ range })}`,
        statsMuscleDistributionResponseSchema,
        signal,
      ),
    getStatsStreak: (weeks, signal) =>
      request(`/v1/stats/streak${toSearchParams({ weeks })}`, statsStreakResponseSchema, signal),
    getStatsRecords: async (query = {}, signal) =>
      (
        await request(
          `/v1/stats/records${toSearchParams(query)}`,
          statsRecordsResponseSchema,
          signal,
        )
      ).data,
  };
}
