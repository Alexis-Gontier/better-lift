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
    const code = error.status === 404 ? "NOT_FOUND" : "INTERNAL";
    return c.json(body(code, error.message), error.status);
  }

  const requestId = c.get("requestId") ?? crypto.randomUUID();

  console.error(`[${requestId}]`, error);

  return c.json(body("INTERNAL", "Erreur interne.", { requestId }), 500);
};

/** 404 par défaut, au même format que les autres erreurs. */
export const notFoundHandler = (c: Context) =>
  c.json(body("NOT_FOUND", `Route inconnue : ${c.req.method} ${c.req.path}`), 404);
