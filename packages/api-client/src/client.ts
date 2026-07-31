import { type ZodType } from "zod";

import {
  type HealthResponse,
  healthResponseSchema,
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
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const doFetch = options.fetch ?? globalThis.fetch;

  async function request<T>(path: string, schema: ZodType<T>, signal?: AbortSignal): Promise<T> {
    const token = await options.getAuthToken?.();

    let response: Response;

    try {
      response = await doFetch(`${baseUrl}${path}`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
  };
}
