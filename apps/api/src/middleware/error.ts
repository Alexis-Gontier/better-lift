import { type Context, type ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { type ApiErrorBody } from "@better-lift/validators";

import { ApiError } from "../lib/errors.js";

function body(
  code: ApiErrorBody["error"]["code"],
  message: string,
  extra: Partial<ApiErrorBody["error"]> = {},
): ApiErrorBody {
  return { error: { code, message, ...extra } };
}

/**
 * Traduit toute erreur en réponse au format unique de la doc 04. Les détails
 * d'une erreur inattendue ne sont jamais renvoyés au client : seul un
 * `requestId` permet de la retrouver dans les logs.
 */
export const errorHandler: ErrorHandler = (error, c: Context) => {
  if (error instanceof ApiError) {
    return c.json(
      body(error.code, error.message, error.details ? { details: error.details } : {}),
      error.status as 401 | 403 | 404 | 409 | 422 | 429 | 500,
    );
  }

  if (error instanceof HTTPException) {
    if (error.status === 404) {
      return c.json(body("NOT_FOUND", error.message), 404);
    }

    /**
     * Hono lève un 400 quand il n'arrive pas à lire le corps — un JSON tronqué,
     * typiquement. C'est une erreur du client, pas une panne : la classer en
     * `INTERNAL` était trompeur pour qui aiguille sur le code, et le contrat ne
     * connaît de toute façon pas le 400 (doc 04).
     */
    if (error.status === 400) {
      return c.json(body("VALIDATION_FAILED", error.message), 422);
    }

    return c.json(body("INTERNAL", error.message), error.status);
  }

  const requestId = c.get("requestId") ?? crypto.randomUUID();

  console.error(`[${requestId}]`, error);

  return c.json(body("INTERNAL", "Erreur interne.", { requestId }), 500);
};

/** 404 par défaut, au même format que les autres erreurs. */
export const notFoundHandler = (c: Context) =>
  c.json(body("NOT_FOUND", `Route inconnue : ${c.req.method} ${c.req.path}`), 404);
