import { type ZodType } from "zod";

import {
  type CurrentUser,
  currentUserSchema,
  type ExerciseDetail,
  type ExerciseListQuery,
  type ExerciseListResponse,
  exerciseDetailSchema,
  exerciseListResponseSchema,
  type HealthResponse,
  healthResponseSchema,
  type Locale,
  type UpdateMeInput,
  type VersionResponse,
  versionResponseSchema,
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
}

/**
 * Sérialise les paramètres de liste. Les tableaux deviennent des clés
 * **répétées** (`?bodyPart=CHEST&bodyPart=BACK`), forme attendue par l'API ;
 * les valeurs absentes sont omises plutôt qu'envoyées vides, un
 * `?q=` déclencherait sinon une erreur de validation.
 */
function toSearchParams(query: Partial<ExerciseListQuery>): string {
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
        `/v1/exercises/${encodeURIComponent(id)}${locale ? `?locale=${locale}` : ""}`,
        exerciseDetailSchema,
        signal,
      ),
  };
}
