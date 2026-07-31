import { API_ERROR_STATUS, type ApiErrorCode } from "@better-lift/validators";

/**
 * Erreur métier de l'API. Levée par les services, traduite en réponse HTTP par
 * le middleware d'erreurs : un service ne connaît jamais le contexte Hono
 * (doc 02).
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: { path: string; message: string }[] | undefined;

  constructor(code: ApiErrorCode, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = API_ERROR_STATUS[code];
    this.details = details;
  }
}

/**
 * Une ressource appartenant à autrui renvoie 404, pas 403 (doc 04).
 *
 * @public exporté pour les services à venir : aucun endpoint de la V0 ne
 * manipule encore de ressource utilisateur.
 */
export function notFound(resource: string): ApiError {
  return new ApiError("NOT_FOUND", `${resource} introuvable.`);
}
